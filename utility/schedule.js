/**
	Utility Module - Schedule
*/
module.exports = function() {
    
    /**
    Command: $schedule
    To see and manage the schedule
    */
	this.cmdSchedule = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) {
            cmdScheduleList(message.channel);
			return;
		}

		// Check Subcommand
		switch(args[0]) {
			case "list": cmdScheduleList(message.channel); break;
			case "add": cmdScheduleAdd(message.channel, args, argsX); break;
			case "recur": cmdScheduleRecur(message.channel, args, argsX); break;
			case "remove": cmdScheduleRemove(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $schedule list
    **/
    this.cmdScheduleList = async function(channel) {
        let sched = await sqlProm("SELECT * FROM schedule ORDER BY timestamp ASC");
        sched = sched.map(el => `\`${el.ai_id}\` **[${el.type}]:** ${el.value} (<t:${el.timestamp}:R>${el.recurrence>0 ? ' | Recurs: ' + (el.recurrence/60) + 'm' : ''})`);
        channel.send(`**Current Schedule**\n${sched.join("\n")}`);
    }
    
    /**
    Command: $schedule recur
    **/
    this.cmdScheduleRecur = async function(channel, args, argsX) {
        let recur = args.splice(3, 1);
       recur = (+recur) * 60;
       argsX.splice(3, 1);
       cmdScheduleAdd(channel, args, argsX, recur);
    }
    
    /**
    Command: $schedule add
    **/
    this.cmdScheduleAdd = async function(channel, args, argsX, recur = 0) {
        let subtype = args[1];
        let time = parseToFutureUnixTimestamp(args[2]);
        if(!time) {
            channel.send("⛔ Syntax error. Invalid time format! Please specify a future time in one of these formats: HH:MM, N[s|m|h|d], Unix Timestamp.");
            return;
        }
        argsX = argsX.splice(3);
        
        switch(subtype) {
            case "cmd":
            case "command":
                await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence) VALUES ('command'," + connection.escape(argsX.join(" ")) + "," + connection.escape(time) + "," + recur + ")");
                channel.send(`✅ Command scheduled for <t:${time}:R>!`);
            break;
            case "spec":
            case "special":
                const spec = ["late", "switch"];
                if(!spec.includes(args[3])) {
                    channel.send("⛔ Syntax error. Unknown special event.");
                    return;
                }
                await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence) VALUES ('special'," + connection.escape(args[3]) + "," + connection.escape(time) + "," + recur + ")");
                channel.send(`✅ **${toTitleCase(args[3])}** scheduled for <t:${time}:R>!`);
            break;
            default:
                channel.send("⛔ Syntax error. Unknown schedule type `" + args[1] + "`!");
            break;
        }
    }
    
    /**
    Command: $schedule remove
    **/
    this.cmdScheduleRemove = async function(channel, args) {
        let id = + args[1];
        let sched = await sqlPromOneEsc("SELECT * FROM schedule WHERE ai_id=", id);
        if(!sched) {
            channel.send("⛔ Syntax error. Could not find scheduled event `" + id + "`!");
            return;
        }
        await sqlPromOneEsc("DELETE FROM schedule WHERE ai_id=", id);
        channel.send(`✅ Deleted scheduled event \`${id}\`!`);
    }
    
    /**
    Schedule Execute - Executes events who's time has come
    **/
    this.scheduleExecute = async function() {
        const now = new Date();
        const nowUnix = Math.floor(now.getTime() / 1000);
        let sched = await sqlPromEsc("SELECT * FROM schedule WHERE timestamp<=", nowUnix);
        if(sched.length <= 0) return; 
        let cmdChannel = null;
        cmdChannel = mainGuild.channels.cache.get(backupChannelId);
        for(let i = 0; i < sched.length; i++) {
            switch(sched[i].type) {
                case "command":
                    log(`Running scheduled command: ${sched[i].value}`);
                    cmdChannel.send(stats.prefix + sched[i].value);
                break;
                case "special":
                    log(`Running scheduled event: ${sched[i].value}`);
                    try {
                        switch(sched[i].value) {
                            case "late":
                                await setSubphase(SUBPHASE.LATE);
                                await executeDelayedQueuedAction();
                                break;
                            case "switch":
                                await setSubphase(SUBPHASE.LOCKED);
                                await sleep(60 * 1000);
                                await cmdPhaseNext();
                                break;
                        }
                    } catch (e) {
                        console.log(e)
                        log(`‼️Failed to complete phase change ${sched[i].value}: ${e.message}`)
                    }
                break;
            }
            if(sched[i].recurrence == 0) {   
                await sqlPromOneEsc("DELETE FROM schedule WHERE ai_id=", sched[i].ai_id);
            } else {
                await sqlPromOneEsc("UPDATE schedule SET timestamp=timestamp+recurrence WHERE ai_id=", sched[i].ai_id);
            }
        }
    }
    
    /**
    Run schedule execute on an intervall
    **/
    this.isRunningSchedule = false;
    this.createScheduleChecker =  function() {
        setInterval(async () => {
            if(isRunningSchedule) return;
            isRunningSchedule = true;
            await scheduleExecute();
            isRunningSchedule = false;
        }, 15 * 1000)
    }
    
    /**
    Clears schedule
    **/
    this.clearSchedule = function() {
        sql("DELETE FROM schedule")
    }
    
    /**
    Timestamp Input Parser
    parses a timestamp in HH:MM, N[smhd] and Unix Timestamp formats
    **/
    this.parseToFutureUnixTimestamp = function(input) {
        const now = new Date();
        const nowUnix = Math.floor(now.getTime() / 1000);

        // Handle "5m", "2h", etc.
        const relativeMatch = input.match(/^(\d+)([smhd])$/);
        if(relativeMatch) {
            const val = parseInt(relativeMatch[1], 10);
            const unit = relativeMatch[2];
            let seconds = 0;
            switch(unit) {
                case "s": seconds = val; break;
                case "m": seconds = val * 60; break;
                case "h": seconds = val * 3600; break;
                case "d": seconds = val * 86400; break;
            }
            return nowUnix + seconds;
        }

        // Handle "HH:MM" format in UTC
        const timeMatch = input.match(/^(\d{1,2}):(\d{2})$/);
        if(timeMatch) {
            const targetHours = parseInt(timeMatch[1], 10);
            const targetMinutes = parseInt(timeMatch[2], 10);
            if(targetHours > 23 || targetMinutes > 59) return null;

            const nowUTC = new Date(now.toISOString().slice(0, 19)); // remove milliseconds and 'Z'
            const target = new Date(Date.UTC(
                nowUTC.getUTCFullYear(),
                nowUTC.getUTCMonth(),
                nowUTC.getUTCDate(),
                targetHours,
                targetMinutes,
                0
            ));

            if (target.getTime() / 1000 <= nowUnix) {
                // If in the past today, add a day
                target.setUTCDate(target.getUTCDate() + 1);
            }

            return Math.floor(target.getTime() / 1000);
        }

        // Handle direct UNIX timestamp
        const unix = parseInt(input, 10);
        if(!isNaN(unix) && unix > nowUnix) {
            return unix;
        }

        // Invalid or not in future
        return null;
    }
    
    /**
    Save D0 Time
    **/
    this.saveD0Time = function(time) {
        stats.d0_time = + time; 
        return new Promise(res => {
            sqlSetStat(statID.D0_TIME, time, () => {
                res(true);
            }, () => {
                res(false);
            }); 
        }); 
    }
    
}
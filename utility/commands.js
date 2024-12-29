/**
	Utility Module - Discord Commands
    This module has utility commands
*/
module.exports = function() {
    
    /**
    Command: $time
    **/
    this.cmdTime = function(channel, args) {
        if(!args[0]) {
            let utcTime = new Date();
            let timezone = Math.round((new Date().getTimezoneOffset()) / 60) * -1;
            if(timezone >= 0) timezone = "+" + timezone;
            channel.send(`✅ My time is ${utcTime.toLocaleTimeString()} (UTC${timezone})!`);
        } else if(!args[1]) {
            try {
                let tz = parseTimeZone(args[0]);
                channel.send(`✅ Your timezone is UTC${tz}!`);
            } catch(err) {
                channel.send("⛔ Time error. Could not parse your time!"); 
                return;
            }
        } else {
            let tz = args[0].replace(/[^0-9\+\-\:]*/g,"");
            let tzOffset = 0;
            // not direct TZ, try to parse
            if(tz[0] != "-" && tz[0] != "+") {
                try {
                    tz = parseTimeZone(args[0]);
                } catch(err) {
                    channel.send("⛔ Time error. Could not parse your time!"); 
                    return;
                }
            }
            // tz to offset
            let spl = tz.split(":");
            tzOffset = spl[0] * 60;
            if(spl[1]) tzOffset += Math.sign(spl[0]) * spl[1];
            // parse time
            let utcTime = new Date();
            let time = parseTime(args[1] + (args[1].length === 2 ? utcTime.getMinutes() : ""));
            time.setYear(utcTime.getFullYear());
            time.setMonth(utcTime.getMonth());
            time.setDate(utcTime.getDate());
            let timeNew = new Date(time.getTime() - tzOffset * 1000 * 60);
            channel.send(`✅ ${time.toTimeString().split(' ')[0].split(":").splice(0, 2).join(":")} in UTC${tz} is ${timeNew.toTimeString().split(' ')[0].split(":").splice(0, 2).join(":")} in UTC! This is your: <t:${Math.floor(timeNew.getTime() / 1000 - (new Date().getTimezoneOffset() * 60))}:t>`);
        }
    }
    
    /**
    Command: $edit
    Edits a bot message specified in arg0 to args1+
    */
    this.cmdEdit = function(channel, args, argsX) {
        channel.messages.fetch(args[0])
            .then(m => {
                argsX.shift();
                let text = argsX.join(" ");
                m.edit(text.replace(/~/g,"\n"));
            });
    }
	
    /**
    Command: $bulkdelete
    Deletes as many messages as possible (excluding bot messages). Can only be run in SCs
    **/
	this.cmdBulkDelete = function(channel) {
        if(isSC(channel)) {
            channel.messages.fetch().then(messages => {
                channel.bulkDelete(messages.filter(el => el.member == null || !el.author.bot)).then(messages => {
                  channel.send("✅ Deleted " + messages.size + " messages.").then(msg => msg.delete({timeout: 5000}));
                });
            }).catch(err => {
                logO(err); 
                sendError(channel, err, "Could not perform bulk delete");
            });
        } else {
            channel.send("⛔ Game Master error. Do not run this in non-SCs!"); 
			return; 
        }
	}
	
    /**
    Command: $delete
    Deletes a specified amount of messages in a channel (max. 10)
    **/
	this.cmdDelete = function(channel, args) {
		if(!args[0] || isNaN(args[0]) || args[0] > 10) {
			channel.send("⛔ Syntax error. Requires a number (<=10) as parameter!"); 
			return; 
		}
		channel.messages.fetch().then(messages => {
			channel.bulkDelete(args[0]).then(messages => {
			  channel.send("✅ Deleted " + messages.size + " messages.").then(msg => msg.delete({timeout: 500}));
			});
		}).catch(err => {
			logO(err); 
			sendError(channel, err, "Could not perform delete");
		});
	}
	
    /**
    Command: $delay
    Runs another command (arg1) after a specified amount of time (arg0)
    **/
	this.cmdDelay = function(channel, args) {
		if(!args[0] || isNaN(args[0]) || args[0] >= 93600) {
			channel.send("⛔ Syntax error. Requires a number as parameter!"); 
			return; 
		} else if(!args[1]) {
			channel.send("⛔ Syntax error. Needs a command to run after the delay!"); 
		}
		setTimeout(() => { 
			if(args[1] != "delay") channel.send(stats.prefix + args.splice(1).join(" "));
			else channel.send("```" + stats.prefix + args.splice(1).join(" ") + "```");
		}, args[0] * 1000);
	}
	
    /**
    Command: $modify
    Modifies a specific bot attribute (arg0) to a specified value (arg1)
    **/
	this.cmdModify = function(message, args, argsX) {
		if(!args[0] || !args[1]) {
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		switch(args[0]) {
			case "nick":
			case "nickname":
				message.guild.members.cache.get(client.user.id).setNickname(argsX[1])
				 .then(() => {
					  message.channel.send("✅ Updated bot nickname!");
				  }).catch(err => {
					logO(err); 
					sendError(message.channel, err, "Could not update bot nickname");
				});
			break;
			case "status":
				if(args[1] != "dnd" && args[1] != "online" && args[1] != "idle" && args[1] != "invisible") {
					message.channel.send("⛔ Syntax error. Needs to be `online`, `idle`, `dnd` or `invisible`!"); 
					return;
				}
				client.user.setStatus(args[1])
				message.channel.send("✅ Updated bot status!");
			break;
			case "activity":
				client.user.setPresence({ activities: [{ name: argsX[1], type: "PLAYING" }] })
				message.channel.send("✅ Updated bot activity!");
			break;
			default:
				message.channel.send("⛔ Syntax error. This is not a value that can be modified!"); 
			break;
		}
	}
	
    /**
    Command: $temp
    Does a temperature conversion from °F to °C or vice versa
    **/
	this.cmdTemp = function(message, args) {
		if(!args[0] || !args[1].match(/[0-9]*/) || (args[0] != "c" && args[0] != "f")) {
			message.channel.send("Not enough/Invalid parameters.");
			return;
		}
		switch(args[0]) {
			default: message.channel.send("Unknown conversion."); break;
			case "f": message.channel.send("🌡️ "+ args[1] + " °C in Fahrenheit: "  + Math.round((args[1] * (9/5)) + 32, 2) + " °F"); break;
			case "c": message.channel.send("🌡️ "+ args[1] + " °F in Celsius: "  + Math.round((args[1] - 32) *  5/9, 2)  + " °C"); break;
		}
	}
	
	/**
    Command: $ping
    Checks the bot's ping
    **/
	this.cmdPing = function(message) {
		// Send pinging message
		message.channel.send("✳ Ping")
		.then(m => {
			// Get values
			let latency = m.createdTimestamp - message.createdTimestamp;
			let ping = Math.round(client.ws.ping);
			m.edit("✅ Pong! Latency is " + latency + "ms. API Latency is " + ping + "ms");
		})
		.catch(err => { 
			// Pinging failed
			logO(err); 
			sendError(message.channel, err, "Could not get ping");
		});
	}
	
    
}
       
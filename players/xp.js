/**
Skin Packs
**/

module.exports = function() {
    
    this.XP_MULTIPLIER = 11.63257;
    
    /**
    Command: $xp
    **/
    this.cmdXP = async function(message, args) {
        if(!args[0]) { 
            cmdXPGet(message.channel, ["get", message.author.id]);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) {
			case "list": cmdXPList(message.channel); break;
			case "get": cmdXPGet(message.channel, args); break;
			case "list_actual": if(checkSafe(message)) cmdXPListActual(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $xp list
    **/
    this.cmdXPList = async function(channel) {
        
        let curTime = xpGetTime();
        let oneDay = 288;
        let pastTime = curTime - oneDay * 7;
        
        let lb = await sqlProm("SELECT * FROM activity WHERE timestamp > " + connection.escape(pastTime) + " ORDER BY count DESC, player DESC");
        
        let i = 1;
        let lbText = lb.sort((a,b) => Math.floor(b.count * XP_MULTIPLIER + (+b.player[0])) - Math.floor(a.count * XP_MULTIPLIER + (+a.player[0]))).map(el => `**#${i++}:** <@${''+el.player}> - ${Math.floor(el.count * XP_MULTIPLIER + (+el.player[0]))} [${el.level}]`);
        let lbPings = lb.map(el => `<@${''+el.player}>`);
        let chunked = chunkArray(lbText, 20);
        
        let embed = { title: "XP Leaderboard", color: 8984857, fields: [ ] };
        embed.fields = chunked.map(el => { return { name: "_ _", "value": el.join("\n"), inline: true }; });
        let msg = await channel.send({ embeds: [ embed ] });
        await msg.edit({ content: lbPings.join("").substr(0, 2000), embeds: [ embed ] });
        msg.edit({ content: "", embeds: [ embed ] });
    }
    
    /**
    Command: $xp list_actual
    **/
    this.cmdXPListActual = async function(channel) {
        
        let curTime = xpGetTime();
        let oneDay = 288;
        let pastTime = curTime - oneDay * 30;
        
        let lb = await sqlProm("SELECT * FROM activity WHERE timestamp > " + connection.escape(pastTime) + " ORDER BY count DESC, player DESC");
        
        let i = 1;
        let lbText = lb.map(el => `**#${i++}:** <@${''+el.player}> - ${el.count} [${el.level}]`);
        let lbPings = lb.map(el => `<@${''+el.player}>`);
        let chunked = chunkArray(lbText, 20);
        
        let embed = { title: "XP Leaderboard", color: 8984857, fields: [ ] };
        embed.fields = chunked.map(el => { return { name: "_ _", "value": el.join("\n"), inline: true }; });
        let msg = await channel.send({ embeds: [ embed ] });
        await msg.edit({ content: lbPings.join("").substr(0, 2000), embeds: [ embed ] });
        if(lbPings.join("").length > 2000) await msg.edit({ content: lbPings.join("").substr(1900, 2000), embeds: [ embed ] });
        msg.edit({ content: "", embeds: [ embed ] });
    }
    
    /**
    Command: $xp get
    **/
    this.cmdXPGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "xp get <player>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(args[1], channel);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. Not a valid player!"); 
			return; 
		} 
        let lb = await sqlPromOneEsc("SELECT * FROM activity WHERE player=", user);
        
        if(!lb) {
            let embed = { title: "XP Leaderboard", color: 8984857, description: `<@${user}> has **0 XP** and is on **Level 0**.` };
            channel.send({ embeds: [ embed ] });
        } else {
            let embed = { title: "XP Leaderboard", color: 8984857, description: `<@${user}> has **${Math.floor(lb.count * XP_MULTIPLIER + (+lb.player[0]))} XP** and is on **Level ${lb.level}**.` };
            channel.send({ embeds: [ embed ] });
        }
    }
    
    /**
    XP Time
    **/
    this.xpGetTime = function() {
        return Math.floor((new Date().getTime() / 1000) / 60 / (60 * 1/5)); // current time in 5m intervals
    }
    
    /**
    Get XP Gain
    **/
    this.getXPGain = function() {
        let xpgain = Math.floor(Math.random() * 5) + 1;
        return xpgain;
    }
    
    // these words do not count towards the minimum word requirement for a message
    let keywords = ["xp","level","levels","experience","yap","coins","leveling","lvls","lvl","coin", "levelling"] ;
    this.checkKeyword = function(msg) {
        let spl = msg.toLowerCase().replace(/[^a-z ]/g,"").split(" ");
        for(let i = 0; i < keywords.length; i++) {
            if(spl.includes(keywords[i])) return true;
        }
        return false;
    }
    
    /**
    XP Gain Handler
    **/
    let ACTIVITY_TRESHHOLD = 35; // allow a maximum of 35 XP gaining messages per hour
    // let x = [0,10], diff = 0; for(let i = 0; i < 99; i++) x.push(x[x.length - 1] + (diff+=10)); console.log(""+x);
    let LEVELS = [0,10,20,40,70,110,160,220,290,370,460,560,670,790,920,1060,1210,1370,1540,1720,1910,2110,2320,2540,2770,3010,3260,3520,3790,4070,4360,4660,4970,5290,5620,5960,6310,6670,7040,7420,7810,8210,8620,9040,9470,9910,10360,10820,11290,11770,12260,12760,13270,13790,14320,14860,15410,15970,16540,17120,17710,18310,18920,19540,20170,20810,21460,22120,22790,23470,24160,24860,25570,26290,27020,27760,28510,29270,30040,30820,31610,32410,33220,34040,34870,35710,36560,37420,38290,39170,40060,40960,41870,42790,43720,44660,45610,46570,47540,48520,49510];
    var lastChatter = null;
    var lastChatterCharacters = 0;
    this.xpProcessMessage = async function(message) {
        if(!message.author.bot && message.content.indexOf(stats.prefix) !== 0 && config.coins) {
            let countActivity = false;
            // check if treshold is hit
            if(lastChatter === message.author.id) {
                lastChatterCharacters += message.content.toLowerCase().replace(/[^a-z]/g,"").replace(/(.)\1\1{1,}/g,"$1$1").length;
                if(lastChatterCharacters >= ACTIVITY_TRESHHOLD) countActivity = true;
            } else {
                lastChatter = message.author.id;
                lastChatterCharacters = message.content.toLowerCase().replace(/[^a-z]/g,"").replace(/(.)\1\1{1,}/g,"$1$1").length;
                if(lastChatterCharacters >= ACTIVITY_TRESHHOLD) countActivity = true;
            }
            // current time in 5m intervals
            let curTime = xpGetTime(); 
            // filter out level up messages so we dont get double level ups
            let sCheck = checkKeyword(message.content)
            if(sCheck) {
                await sqlPromEsc("UPDATE activity SET timestamp=" + (curTime+3) + " WHERE player=", message.author.id);
            }
            // count activity
            // check for a players longest message within a 5 minute period, then award XP based on that
            else if(countActivity && config.coins) {
                let activity = await sqlPromEsc("SELECT * FROM activity WHERE player=", message.author.id);
                if(activity && activity.length > 0) {
                    if(activity[0].timestamp < curTime) {
                        let multiplier = ((await getBoosterMultiplier()) * getXPGain());
                        await sqlPromEsc("UPDATE activity SET count=count+" + connection.escape(multiplier) + ",timestamp=" + curTime + " WHERE player=", message.author.id);
                        let newLevel = (+activity[0].level) + 1;
                        let reqXpLevelup = LEVELS[newLevel];
                        let randChance = Math.random();
                        if(reqXpLevelup && reqXpLevelup <= ((+activity[0].count) + 1) && randChance < 0.25 && !((isParticipant(message.member) || isGhost(message.member) || isHost(message.member)) && stats.gamephase == gp.INGAME)) {
                            console.log(`Level Up for ${message.member.displayName} to Level ${newLevel}!`);
                            await sleep(3000); // delay level up by 30s
                            await levelUp(message.member, message.channel, newLevel);
                        } else {
                            console.log(`Delayed Level Up for ${message.member.displayName}!`);
                        }
                    }
                } else {
                    await sqlProm("INSERT INTO activity (player, count, timestamp) VALUES (" + connection.escape(lastChatter) + ", 1, " + connection.escape(curTime) +  ")");
                }
            }
        }
    }
    
    /**
    Command: $levelup
    **/
    this.cmdLevelup = function(message, args) {
        if(args[0] && +args[0] > 0) {
            levelUp(message.member, message.channel, +args[0]);
        } else {
            channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "levelup <level>`!"); 
        }
    }
    
    /**
    Level Up
    **/
    this.levelUp = async function(member, channel, newLevel) {
        await sqlPromEsc("UPDATE activity SET level=level+1 WHERE player=", member.id);
        let coinsReward = newLevel * 5;
        await modifyCoins(member.id, coinsReward);
        let embed = { title: "Level up!", description: `Congratulations, <@${member.id}>! You have leveled up to **Level ${newLevel}**!\n\nAs a reward you have received \`${coinsReward}\` coins. Use \`${stats.prefix}coins\` to check how many coins you have.`, color: 9483375};
        embed.thumbnail = { url: iconRepoBaseUrl + "Extras/Ascension.png" };
        // Level Up Reward
        let newLevelString = newLevel + "";
        if(newLevel % 5 === 0 || [7,16,18].includes(newLevel)) {
            let boxRewards = [null, null, null, [1], [1,2], null, null, [1,3], [1,2,3], [1,2,4], null, [1,4], [1,3,4], [2], [2,3], null, [2,4], [2,3,4], [3], [3,4], [4], [0,1,2,3,4,5], [1,2,3,4,5], [2,3,4,5], [3,4,5], [4,5], [5]];
            let re = boxRewards[Math.floor(newLevel / 5)];
            // Standard Box Reward
            if(newLevel === 100) {
                embed.description += `\n\nAdditionally, you get a free loot box with a guaranteed platinum tier reward.`;
                embed.description += `\n\nAdditionally, you may select any lootbox prize that will be unlocked for you.`;
                channel.send({ embeds: [ embed ] });
                await openBox(channel, member.id, null, re);
                await inventoryModifyItem(member.id, "SPEC:Any", 1);
            } else if(re && newLevel != 16 && newLevel != 18 && newLevel != 7) {
                let boxName = re.map(el => tierNames[el].toLowerCase()).join(" or ");
                embed.description += `\n\nAdditionally, you get a free loot box with a guaranteed ${boxName} tier reward.`;
                channel.send({ embeds: [ embed ] });
                await openBox(channel, member.id, null, re);
            } else {
                switch(newLevel) {
                    case 5:
                        embed.description += `\n\nAdditionally, you may now access the market using \`${stats.prefix}market\`.`;
                        await inventoryModifyItem(member.id, "BOT:market", 1);
                    break;
                    case 7:
                        embed.description += `\n\nAdditionally, you may now transfer rewards to others using \`${stats.prefix}inventory transfer\`.`;
                        await inventoryModifyItem(member.id, "BOT:invtransfer", 1);
                    break;
                    case 10: 
                        let verified = channel.guild.roles.cache.find(role => role.name == "Verified");
                        if(verified) {
                            member.roles.add(verified);
                            embed.description += `\n\nAdditionally, you got the \`Verified\` role, which grants a few additional permissions.`;    
                        }
                    break;
                    case 16:
                        embed.description += `\n\nAdditionally, you may now recycle rewards into coins using \`${stats.prefix}recycle\`.`;
                        await inventoryModifyItem(member.id, "BOT:recycle", 1);
                    break;
                    case 18:
                        embed.description += `\n\nAdditionally, you may now update your nickname while out of game \`${stats.prefix}nickname\`.`;
                        await inventoryModifyItem(member.id, "BOT:nick", 1);
                    break;
                    case 25:
                        embed.description += `\n\nAdditionally, you may select an icon (that is available as loot) that will be unlocked for you.`;
                        await inventoryModifyItem(member.id, "SPEC:AnyIcon", 1);
                    break;
                    case 30:
                        embed.description += `\n\nAdditionally, you may now reserve an emoji for signups.`;
                        await inventoryModifyItem(member.id, "BOT:reserve", 1);
                    break;
                    case 50:
                        embed.description += `\n\nAdditionally, you may select a skinpack (that is available as loot) that will be unlocked for you.`;
                        await inventoryModifyItem(member.id, "SPEC:AnySkinpack", 1);
                    break;
                    case 75:
                        embed.description += `\n\nAdditionally, you may select a guarantor (that is available as loot) that will be unlocked for you.`;
                        await inventoryModifyItem(member.id, "SPEC:AnyGuarantor", 1);
                    break;
                }
                channel.send({ embeds: [ embed ] });
            }
        } else if(newLevelString.length === 2 && newLevelString[0] === newLevelString[1]) {
            let boxRewards = [[1], [1,2], [1,3], [1,2,4], [1,2,3,4], [2,3], [2,4], [3,4], [4]];
            let re = boxRewards[(+ newLevelString[0]) - 1];
            // Standard Box Reward
            if(re) {
                let boxName = re.map(el => tierNames[el].toLowerCase()).join(" or ");
                embed.description += `\n\nAdditionally, you get a free loot box with a guaranteed ${boxName} tier reward.`;
                channel.send({ embeds: [ embed ] });
                await openBox(channel, member.id, null, re);
            } else {
                channel.send({ embeds: [ embed ] });
            }
        } else {  
            if(newLevel === 1) embed.description += `\n\nYou can check your XP and Level using \`${stats.prefix}xp\` and see a leaderboard using \`${stats.prefix}xp list\`.`;  
            channel.send({ embeds: [ embed ] });
        }
    }
    
}

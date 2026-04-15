/**
    Functions for various player lists
**/

module.exports = function() {
    
    /**
    Generate Player List
    generates a player list with a specified query, format and name
    **/
    this.generatePlayerList = async function(channel, name, conditions, format, sortFunction = null, formatFunction = null, codeBlock = false) {
        // send loading message
        let msgProm = channel.send(`✳️ Listing ${name.toLowerCase()}`);
        
        // prepare conditions
        let conditionsFormatted = [];
        conditions.forEach(el => {
            if(isPlayersArgs(el[0]) && ["=","<>",">=","<=",">","<"].includes(el[1])) {
                conditionsFormatted.push(`${el[0]}${el[1]}${connection.escape(el[2])}`);
            }
        });
        
        // retrieve players
        let matchingPlayers = await sqlProm("SELECT * FROM players WHERE " + conditionsFormatted.join(" AND "));
        
        if(sortFunction) {
            matchingPlayers = matchingPlayers.sort(sortFunction);
        }
        
        // format players
        let formattedPlayers = [];
        if(!formatFunction) {
            formattedPlayers = matchingPlayers.map(el => {
                let f = format;
                let member = mainGuild.members.cache.get(el.id);
                let mentor = el.mentor ? mainGuild.members.cache.get(el.mentor) : null;
                f = f.replace(/\$emoji/g, el.emoji);
                f = f.replace(/\$id/g, el.id);
                f = f.replace(/\$name/g, member ? member.user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*");
                f = f.replace(/\$tag/g, `<@${el.id}>`);
                f = f.replace(/\$mentor_tag/g, `<@${el.mentor}>`);
                f = f.replace(/\$mentor/g, mentor ? mentor.user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*");
                return f;
            });
        } else {
            formattedPlayers = await Promise.all(matchingPlayers.map(formatFunction));
            formattedPlayers = formattedPlayers.flat();
        }
        
        let messages = [];
        messages.push(`**${name}** | Total: ${formattedPlayers.length}\n`);
        
        if(codeBlock) messages[0] += "```";
        
        // split into several messages if necessary
        formattedPlayers.forEach(el => {
            if(messages.at(-1).length + el.length < 1900) {
                messages[messages.length - 1] += el + "\n";
            } else {
                if(!codeBlock) messages.push(el + "\n");
                else messages.push("```" + el + "\n");
            }
        });
        
        
        if(codeBlock) messages[messages.length - 1] += "```";
        
        // wait for promise
        let msg = await msgProm;
        
        // update message
        msg.edit(messages[0]);
        
        // send additional messages if applicable
        for(let i = 1; i < messages.length; i++) {
            await channel.send(messages[1]);
        }  
    }
    
	/**
    Signedup Alphabetical List
    **/
    this.cmdListSignedupAlphabetical = function(channel) {
        generatePlayerList(channel, "Signed Up Players (Alphabetical)", [["type", "=", "player"]], "$emoji - $name", (a, b) => {
                let pa = mainGuild.members.cache.get(a.id);
                let pb = mainGuild.members.cache.get(b.id);
               return (pa ? pa.user.username.toLowerCase() : "-") > (pb ? pb.user.username.toLowerCase() : "-") ? 1 : -1;
        });
	}
    
	/**
    Signedup List
    */
	this.cmdListSignedup = function(channel) {
        generatePlayerList(channel, "Signed Up Players", [["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
	/**
    Substitute List 
    */
	this.cmdListSubs = function(channel) {
        generatePlayerList(channel, "Substitute Players", [["type", "=", "substitute"]], "$emoji - $name ($tag)");
	}
    
	/**
    Mentor List
    **/
	this.cmdListMentors = function(channel) {
        generatePlayerList(channel, "Mentors", [["mentor", "<>", ""]], "$emoji - $mentor ($mentor_tag) for $name ($tag)");
	}
	
	/**
    Alive Player List
    **/
	this.cmdListAlive = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list alive players in ingame phase."); 
			return; 
		}
        // generate list
        generatePlayerList(channel, "Alive Players", [["alive", "=", 1], ["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
	/**
    Dead Player List
    **/
	this.cmdListDead = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list dead players in ingame phase."); 
			return; 
		}
        // generate list
        generatePlayerList(channel, "Dead Players", [["alive", "=", 0], ["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
	/**
    Ghostly Player List
    **/
	this.cmdListGhost = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list ghostly players in ingame phase."); 
			return; 
		}
        if(!stats.haunting) { 
			channel.send("⛔ Command error. Can only list ghostly players in haunting mode."); 
			return; 
        }
        // generate list
        generatePlayerList(channel, "Ghostly Players", [["alive", "=", 2], ["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
    /**
    Emoji List
    **/
	this.cmdEmojis = function(channel) {
		channel.send("```\n" + emojiIDs.map(el =>  el.emoji + " " + el.id).join("\n") + "\n``` ```\n" + emojiIDs.map(el =>  el.emoji).join(" ") + "\n```");
	}
    
	/**
    Emoji List (Alive Players)
    **/
	this.cmdEmojisAlive = async function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list alive players in ingame phase."); 
			return; 
		}
        let res = await sqlProm("SELECT id,emoji FROM players WHERE alive=1");
        let top = res.map(el =>  el.emoji + " " + el.id).join("\n");
		channel.send("```\n" + (top.length ? top : "-") + "\n``` ```\n" + (top.length ? res.map(el =>  el.emoji).join(" ") : "-") + "\n```");
	}
    	
	/**
    Command: $players list
    Shows all players, their status and role
    **/
	this.cmdPlayersList = async function(channel) {
        generatePlayerList(channel, "Players", [["type", "=", "player"]], null, null, el => {  
            let rName = toTitleCase(el.role);
            let rEmoji = getRoleEmoji(rName);
            rEmoji = (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> | ` : "❓ | ");
            let mem = channel.guild.members.cache.get(el.id);
            let status = mem ? (el.alive==1 ? client.emojis.cache.get(stats.yes_emoji) : (el.alive==2?"👻":client.emojis.cache.get(stats.no_emoji))) : "⚠️";
            return `${status} | ${rEmoji}${el.emoji} - ${mem ? mem : "<@" + el.id + ">"} (${rName})`;
        });
	}
    
	/**
    Command: $player votes
    Shows voting values of living players
    **/
	this.cmdPlayersVotes = function(channel) {
        generatePlayerList(channel, "Players", [["type", "=", "player"], ["alive", "=", "1"]], null, null, async el => {  
            let rName = toTitleCase(el.role);
            let rEmoji = getRoleEmoji(rName);
            rEmoji = (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> | ` : "❓ | ");
            let mem = channel.guild.members.cache.get(el.id);
            
            let publicVotingPower = await pollValue(el.id, "public");
            let privateVotingPower = await pollValue(el.id, "private");
            let publicText = `Public: ${publicVotingPower.total} (${publicVotingPower.visible})`;
            let privateText = `Private: ${privateVotingPower.total} (${privateVotingPower.visible})`;
            if(publicVotingPower.total != 1) publicText = `**${publicText}**`;
            if(privateVotingPower.total != 1) privateText = `**${privateText}**`;
            
            return `${rEmoji}${el.emoji} - ${mem ? mem : "<@" + el.id + ">"} (${rName}) | ${publicText}, ${privateText}`;
        });
	}
    
	/**
    Command: $players list_alive
    Shows all living players, their status and role
    **/
	this.cmdPlayersListAlive = async function(channel) {
        generatePlayerList(channel, "Alive Players", [["type", "=", "player"], ["alive", "=", "1"]], null, null, el => {  
            let rName = toTitleCase(el.role);
            let rEmoji = getRoleEmoji(rName);
            rEmoji = (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> | ` : "❓ | ");
            let mem = channel.guild.members.cache.get(el.id);
            let status = mem ? (el.alive==1 ? client.emojis.cache.get(stats.yes_emoji) : (el.alive==2?"👻":client.emojis.cache.get(stats.no_emoji))) : "⚠️";
            return `${status} | ${rEmoji}${el.emoji} - ${mem ? mem : "<@" + el.id + ">"} (${rName})`;
        });
	}
    
	/**
    Command: $players log
    Lists all signedup players in log format
    **/
	this.cmdPlayersLog = function(channel) {
        generatePlayerList(channel, "Players", [["type", "=", "player"]], null, null, el => {  
            let mem = channel.guild.members.cache.get(el.id);
            let nickname = mem && mem.nickname ? " (as `" + mem.nickname + "`)" : "";
            return `${stats.log_list_char} ${el.emoji} ${mem ? mem : "<@" + el.id + ">"}${nickname} is \`${el.role.split(",").map(role => toTitleCase(role)).join(" + ")}\``;
        }, true);	
	}
    
	/**
    Command: $player log2
    Lists all signedup players in a different log format 
    */
	this.cmdPlayersLog2 = function(channel) {
        generatePlayerList(channel, "Players", [["type", "=", "player"], ["alive", ">=", "1"]], null, null, el => {  
            let thisRole = toTitleCase(el.role);
            let thisPlayer = channel.guild.members.cache.get(el.id);
            let thisPlayerList = [];
            thisPlayerList.push(thisPlayer.nickname ? (thisPlayer.nickname + " (" + thisPlayer.user.username + ")") : thisPlayer.user.username);
            thisPlayerList.push(`• <@${el.id}> (${thisRole}) ? []`);
            thisPlayerList.push(`• ${thisRole} (<@${el.id}>) ? @ ()`);
            return thisPlayerList;
        }, true);		
	}
    
	/**
    Command: $players log3
    Lists all signedup players in final results format
    **/
	this.cmdPlayersLog3 = async function(channel) {
		// Get a list of players
        const players = await sqlProm("SELECT id,emoji,role,orig_role,alive,ccs,alignment,final_result FROM players WHERE type='player'");
        // function to format a log3 list
        const l3Format = el => {
            let mem = channel.guild.members.cache.get(el.id);
            return `${stats.log_list_char} ${mem ? mem : "<@" + el.id + ">"} (${el.role != el.orig_role ? toTitleCase(el.orig_role) + ' → ' + toTitleCase(el.role) : toTitleCase(el.role)})`;
        };
        // results
        let winnerTeam = await sqlPromOne("SELECT display_name FROM teams WHERE active=1");
        let msg = "```**Final Results**\n" + winnerTeam.display_name + " Victory\n\n";
        let liveWinner = players.filter(el => (el.alive == 1 || el.alignment == "unaligned") && el.final_result == 1).map(l3Format);
        let ghostlyWinners = players.filter(el => el.alive == 2 && el.alignment != "unaligned" && el.final_result == 1).map(l3Format);
        let deadWinners = players.filter(el => el.alive == 0 && el.alignment != "unaligned" && el.final_result == 1).map(l3Format);
        let liveLosers = players.filter(el => el.alive == 1 && el.final_result == 0).map(l3Format);
        let ghostlyLosers = players.filter(el => el.alive == 2 && el.final_result == 0).map(l3Format);
        let deadLosers = players.filter(el => el.alive == 0 && el.final_result == 0).map(l3Format);
        // sections
        if(liveWinner.length > 0) msg += "__Live Winners:__\n" + liveWinner.join("\n") + "\n\n";
        if(ghostlyWinners.length > 0) msg += "__Ghostly Winners:__\n" + ghostlyWinners.join("\n") + "\n\n";
        if(deadWinners.length > 0) msg += "__Dead Winners:__\n" + deadWinners.join("\n") + "\n\n";
        if(liveLosers.length > 0) msg += "__Live Losers:__\n" + liveLosers.join("\n") + "\n\n";
        if(ghostlyLosers.length > 0) msg += "__Ghostly Losers:__\n" + ghostlyLosers.join("\n") + "\n\n";
        if(deadLosers.length > 0) msg += "__Dead Losers:__\n" + deadLosers.join("\n") + "\n\n";
        // send
        channel.send(msg + "```");
	}
    
	/**
    Command: $players log4
    Lists all signedup players with their phases dead 
    */
	this.cmdPlayersLog4 = function(channel) {
        generatePlayerList(channel, "Players", [["type", "=", "player"]], null, null, el => {  
            let isN = isNight();
            let endPhase = getPhaseAsNumber() + (isN?1:0);
            let mem = channel.guild.members.cache.get(el.id);
            let daysDead = Math.floor((endPhase - el.death_phase) / 2) + 1;
            if(el.death_phase == -1) daysDead = 0;
            return `${mem ? mem.user.globalName ?? mem.displayName : "<@" + el.id + ">"}\t${daysDead}`;
        }, true);	
	}
    
	/**
    Command: $players messages
    Lists player message counts 
    */
    this.publicMessageAcc = 0;
    this.privateMessageAcc = 0;
	this.cmdPlayersListMsgs = async function(channel) {
        publicMessageAcc = 0;
        privateMessageAcc = 0;
        await generatePlayerList(channel, "Players", [["type", "=", "player"]], null, null, el => {  
            let mem = channel.guild.members.cache.get(el.id);
            publicMessageAcc += el.public_msgs;
            privateMessageAcc += el.private_msgs;
            return `${el.emoji} - ${mem ? mem : "<@" + el.id + ">"}; Total: ${el.public_msgs + el.private_msgs}; Public: ${el.public_msgs}; Private: ${el.private_msgs}`;
        });
        channel.send(`Total Messages: ${publicMessageAcc + privateMessageAcc}; Public Messages: ${publicMessageAcc}; Private Messages: ${privateMessageAcc}`);
	}
    
	/**
    Command: $players messages2
    Lists message counts for living players    
    */
	this.cmdPlayersListMsgs2 = async function(channel, args) {
        publicMessageAcc = 0;
        privateMessageAcc = 0;
        await generatePlayerList(channel, "Players", [["type", "=", "player"], ["alive", ">=", "1"]], (a, b) => {
            return (b.public_msgs + b.private_msgs) - (a.public_msgs + a.private_msgs);
        }, null, el => {  
            privateMessageAcc += el.private_msgs;
            publicMessageAcc += el.public_msgs;
            let prWarn = false;
            let pubWarn = false;
            let phases = args[1];
            if((el.public_msgs+el.private_msgs) < (phases * stats.total_req)) prWarn = true;
            if(el.public_msgs < (Math.floor(phases/2) * stats.public_req)) pubWarn = true;
            return `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"}; Total: ${el.public_msgs+el.private_msgs}${prWarn?' ❗':''}; Public: ${el.public_msgs}${pubWarn?' ❗':''}; Private: ${el.private_msgs}`;
        });
        channel.send(`Total Messages: ${publicMessageAcc + privateMessageAcc}; Public Messages: ${publicMessageAcc}; Private Messages: ${privateMessageAcc}`);	
	}
    
	/**
    Command: $players roles
    Lists all roles
    **/
	this.cmdPlayersRoleList = async function(channel) {
		// Get a list of players
        let players = await sqlProm("SELECT role FROM players WHERE type='player'");
        let roleList = players.map(el => el.role);
        channel.send("**Roles** | Total: " + roleList.length + "\n```" + roleList.join(",") + "```")
	}
    
}
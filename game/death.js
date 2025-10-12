/**
	Game Module - Death
	Handles killing and killq
*/
module.exports = function() {
    
	/* Handles killq command */
	this.cmdKillq = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `killq [list|add|remove|clear|killall]`!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			case "list": cmdKillqList(message.channel); break;
			case "add": cmdKillqAdd(message.channel, args); break;
			case "remove": cmdKillqRemove(message.channel, args); break;
			case "clear": cmdKillqClear(message.channel); break;
			case "killall": cmdKillqList(message.channel); cmdConfirm(message, "killq killall"); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}

	/* Lists current killq */
	this.cmdKillqList = function(channel) {
		// Get killq
		sql("SELECT killq.id, players.role FROM killq INNER JOIN players ON killq.id = players.id", result => {
			// Print killq
			let playerList = result.map(el => {
                let member = channel.guild.members.cache.get(el.id);
                let rName = toTitleCase(el.role.split(",")[0]);
                let rEmoji = getRoleEmoji(rName);
                return idToEmoji(el.id) + " - " + member.displayName + "/" + member.user.username + " - " + (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> ` : "") + rName;
            }).join("\n");
			channel.send("**Kill Queue** | Total: " +  result.length + "\n" + playerList);
		}, () => {
			// Db error
			channel.send("⛔ Database error. Could not list kill queue!");
		});
	}

	/* Add an user to the killq */
	this.cmdKillqAdd = function(channel, args) {
		// Check parameter
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Requires at least 1 player!"); 
			return; 
		}
		// Get users 
		players = parseUserList(args, 1, channel);
		if(players)  {
			let playerList = players.map(el => "`" + channel.guild.members.cache.get(el).displayName + "`").join(", ");
			// Add to killq
			channel.send("✳️ Adding " + players.length + " player" + (players.length != 1 ? "s" : "") + " (" + playerList  + ") to the kill queue!");
			players.forEach(el => {
                killqAdd(el);
                channel.send("✅ Added `" +  mainGuild.members.cache.get(el).displayName + "` to the kill queue!");
			});
		} else {
			// No valid players
			channel.send("⛔ Syntax error. No valid players!");
		}
	}

	/* Removes an user from the killq */
	this.cmdKillqRemove = function(channel, args) {
		// Check parameters
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Requires at least 1 player!");
			return; 
		}
		// Get users
		players = parseUserList(args, 1, channel);
		if(players) { 
			// Remove from killq
			let playerList = players.map(el =>"`" + channel.guild.members.cache.get(el).displayName + "`").join(", ");
			channel.send("✳ Removing " + players.length + " player" + (players.length != 1 ? "s" : "") + " (" + playerList + ") from the kill queue!");
			players.forEach(el => {
				sql("DELETE FROM killq WHERE id = " + connection.escape(el), result => {
					channel.send("✅ Removed `" +  channel.guild.members.cache.get(el).displayName + "` from the kill queue!");
				}, () => {
					// DB error
					channel.send("⛔ Database error. Could not remove " +  channel.guild.members.cache.get(el) + " from the kill queue!");
				});	
			});
		}  else {
			// No valid players
			channel.send("⛔ Syntax error. No valid players!");
		}
	}

	/** PUBLIC
    Command: $killq killall
    **/
	this.cmdKillqKillall = async function (channel) {
        let playerCount = await killqKillall();
        
        // feedback
        channel.send("✳️ Killed `" + playerCount + "` player" + (playerCount != 1 ? "s" : "") + "!");
	}

	/** PRIVATE
    Command: $killq clear
    **/
    function cmdKillqClear(channel) {
		killqClear();
	}
    
    /** PUBLIC
   Adds somebody to the kill queue
   **/
   this.killqAdd = function(pid, src_ref = "host:host", type = "true kill", src_name = "role:host") {
        return sqlProm("INSERT INTO killq (id, src_ref, src_name, type) VALUES (" + connection.escape(pid) + "," + connection.escape(src_ref) + "," + connection.escape(src_name) + "," + connection.escape(type) + ")");
   }
    
    /** PUBLIC
    Kills everyone in the kill queue
    **/
    this.killqKillall = async function() {
        // get players
        let players = await sqlProm("SELECT * FROM killq");
        players = shuffleArray(players);
        playersFiltered = removeDuplicates(players.map(el => el.id));
        
        // clear killq
        await killqClear();
        
        // kill players
        for(let i = 0; i < playersFiltered.length; i++) {
            // for low automation level emit a hardcoded reporter message
            if(stats.automation_level <= autoLvl.MINIMUM) {
                let reporters = await queryAttribute("attr_type", "role", "val1", "reporter");
                let src_ref = "player:" + playersFiltered[i];
                let info = await parseInfo(`@id:${playersFiltered[i]} - @id:${playersFiltered[i]}->Role`, src_ref, {});
                reporters.forEach(el => {
                    announcementImmediate(src_ref, info, { type: "channel", value: el.val2 }, {}); 
                });
            }
            
            
            // get all attacks/etc and select a random one to trigger the triggers
            let deaths = players.filter(el => el.id === playersFiltered[i]);
            let selDeath = deaths[Math.floor(Math.random() * deaths.length)];
            //console.log(playersFiltered[i], deaths, selDeath);
            // get the important values
            let target = playersFiltered[i];
            let attacker = srcToValue(selDeath.src_ref);
            let src_name = selDeath.src_name;
            let type = selDeath.type;
            // call triggers
            switch(type) {
                case "attack":
                case "kill":
                case "true kill":
                    // kill player
                    await killPlayer(playersFiltered[i]);
                    // normal triggers
                    await triggerPlayer(target, "On Death", { attacker: attacker, death_type: type, attack_source: src_name }); 
                    await triggerPlayer(target, "On Killed", { attacker: attacker, death_type: type, attack_source: src_name }); 
                    // complex triggers
                    await triggerHandler("On Death Complex", { attacker: attacker, death_type: type, attack_source: src_name, this: target }); 
                    await triggerHandler("On Killed Complex", { attacker: attacker, death_type: type, attack_source: src_name, this: target }); 
                    // passive
                    await triggerHandler("Passive");
                break;
                case "lynch":
                    // kill player
                    await killPlayer(playersFiltered[i]);
                    // normal triggers
                    await triggerPlayer(target, "On Death", { attacker: attacker, death_type: "lynch", attack_source: src_name }); 
                    await triggerPlayer(target, "On Lynch", { attacker: attacker, death_type: "lynch", attack_source: src_name }); 
                    // complex triggers
                    await triggerHandler("On Death Complex", { attacker: attacker, death_type: "lynch", attack_source: src_name, this: target }); 
                    // passive
                    await triggerHandler("Passive");
                break;
                case "banish":
                case "true banish":
                    // banish player
                    await banishPlayer(playersFiltered[i]);
                    // normal triggers
                    await triggerPlayer(target, "On Banished", { attacker: attacker, death_type: type, attack_source: src_name }); 
                    await triggerPlayer(target, "On Banishment", { attacker: attacker, death_type: type, attack_source: src_name }); 
                    // complex triggers
                    await triggerHandler("On Banished Complex", { attacker: attacker, death_type: type, attack_source: src_name, this: target }); 
                    await triggerHandler("On Banishment Complex", { attacker: attacker, death_type: type, attack_source: src_name, this: target }); 
                    // passive
                    await triggerHandler("Passive");
                break;
            }
        }
        
        // check if new killq entries were created
        let addPlayers = await sqlProm("SELECT * FROM killq");
        if(addPlayers.length > 0) {
            let addPlayerCount = await killqKillall();
            return addPlayerCount + players.length;
        }
        
        // return count
        return players.length;
    }
        
    
    /** PUBLIC
    Clears kill queue
    **/
    this.killqClear = function() {
        return sqlProm("DELETE FROM killq");
    }
    
    /** PUBLIC
    Kill Player
    kills a player (does not consider or defenses or anything, just kills)
    **/
	this.killPlayer = async function(player_id, silent = false) {
       // set to dead
       await setLivingStatus(player_id, !stats.haunting ? 0 : 2);
       // set death phase
       await setDeathPhase(player_id, getPhaseAsNumber());
        
        let player = mainGuild.members.cache.get(player_id);
        // revoke participant role
        removeRoleRecursive(player, false, stats.participant, "participant");
        // grant dead role depending on mode
        if(!stats.haunting) addRoleRecursive(player, false, stats.dead_participant, "dead participant");
        else addRoleRecursive(player, false, stats.ghost, "ghost");
        // revoke DRs
        removeAllDR(player_id);
        
        // set mentor as dead if applicable
        let mentor = await getMentor(player_id); 
        if(mentor) {
            let mentorMember = mainGuild.members.cache.get(mentor);
            // revoke mentor role
            removeRoleRecursive(mentorMember, false, stats.mentor, "mentor");
            // grant dead role depending on mode
            if(!stats.haunting) addRoleRecursive(mentorMember, false, stats.dead_participant, "dead participant");
            else addRoleRecursive(mentorMember, false, stats.ghost_mentor, "ghost mentor");
        }
        
        // retrieve all attributes of the player and set to dead
        let playerAttributes =  await queryAttributePlayer(player_id, "owner", player_id);
        for(let i = 0; i < playerAttributes.length; i++) {
            // check if group should be disbanded
            if(playerAttributes[i].attr_type === "group_membership" && playerAttributes[i].val2 === "owner") {
                let allGroupOwners = await queryAttribute("attr_type", "group_membership", "val1", playerAttributes[i].val1, "val2", "owner", "alive", 1);
                if(allGroupOwners.length === 1) { // Disband
                    await groupsDisband(playerAttributes[i].val1);
                }
            }
            // set attribute to dead
            updateAttributeAlive(playerAttributes[i].ai_id, !stats.haunting ? 0 : 2);
        }
        
        // add to storytime
        let dmsg = await getDeathMessage(player_id, `${idToEmoji(player_id)} <@${player_id}>`);
        if(!silent) await bufferStorytime(dmsg);
	}   
    
    /** PUBLIC
    Banish Player
    banishes a player (does not consider or defenses or anything, just banishes)
    **/
	this.banishPlayer = async function(player_id, silent = false) {
       // set to dead
       await setLivingStatus(player_id, 0);
        
        let player = mainGuild.members.cache.get(player_id);
        // revoke ghost role
        removeRoleRecursive(player, false, stats.ghost, "ghost");
        // grant dead role
        addRoleRecursive(player, false, stats.dead_participant, "dead participant");
        // revoke DRs
        removeAllDR(player_id);
        
        // set mentor as dead if applicable
        let mentor = await getMentor(player_id); 
        if(mentor) {
            let mentorMember = mainGuild.members.cache.get(mentor);
            // revoke mentor role
            removeRoleRecursive(mentorMember, false, stats.mentor, "mentor");
            // grant dead role
            addRoleRecursive(mentorMember, false, stats.dead_participant, "dead participant");
        }
        
        // retrieve all attributes of the player and set to dead
        let playerAttributes =  await queryAttributePlayer(player_id, "owner", player_id);
        for(let i = 0; i < playerAttributes.length; i++) {
            // set attribute to dead
            updateAttributeAlive(playerAttributes[i].ai_id, 0);
        }
        
        // add to storytime
        let dmsg = `${idToEmoji(player_id)} <@${player_id}> was banished.`;
        if(!silent) await bufferStorytime(dmsg);
	}   
    
    /** PUBLIC
    Resurrect Player
    resurrects a player
    **/
	this.resurrectPlayer = async function(player_id, silent = false) {
       // set to aluve
       await setLivingStatus(player_id, 1);
        
        let player = mainGuild.members.cache.get(player_id);
        // revoke dead roles
        removeRoleRecursive(player, false, stats.dead_participant, "dead participant");
        removeRoleRecursive(player, false, stats.ghost, "ghost");
        // grant participant role
        addRoleRecursive(player, false, stats.participant, "participant");
        
        // retrieve all attributes of the player and set to alive
        let playerAttributes =  await queryAttributePlayer(player_id, "owner", player_id);
        for(let i = 0; i < playerAttributes.length; i++) {
            // set attribute to alive
            updateAttributeAlive(playerAttributes[i].ai_id, 1);
        }
        
        // add to storytime
        if(!silent) await bufferStorytime(`<@${player_id}> has been resurrected!`);
	}

    
}
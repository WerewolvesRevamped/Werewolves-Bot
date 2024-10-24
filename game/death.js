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
		players = parseUserList(channel, args, 1);
		if(players)  {
			let playerList = players.map(el => "`" + channel.guild.members.cache.get(el).displayName + "`").join(", ");
			// Add to killq
			channel.send("✳ Adding " + players.length + " player" + (players.length != 1 ? "s" : "") + " (" + playerList  + ") to the kill queue!");
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
		players = parseUserList(channel, args, 1);
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
        channel.send("✳ Killed `" + playerCount + "` player" + (playerCount != 1 ? "s" : "") + "!");
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
   this.killqAdd = function(pid) {
        return sqlProm("INSERT INTO killq (id) VALUES (" + connection.escape(pid) + ")");
   }
    
    /** PUBLIC
    Kills everyone in the kill queue
    **/
    this.killqKillall = async function() {
            // get players
        let players = await sqlProm("SELECT id FROM killq");
        players = removeDuplicates(players.map(el => el.id));
        
        // kill players
        for(let i = 0; i < players.length; i++) {
            await killPlayer(players[i]);
        }
        
        // clear killq
        await killqClear();
        
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
       await setLivingStatus(player_id, 0);
        // check mayor treshhold (and change roles if applicable)
       await mayorCheck();
       // send a reporter message
       reporterMessage(player_id);
        
        let player = mainGuild.members.cache.get(player_id);
        // revoke participant role
        removeRoleRecursive(player, false, stats.participant, "participant");
        // grant dead role depending on mode
        if(!stats.haunting) addRoleRecursive(player, false, stats.dead_participant, "dead participant");
        else addRoleRecursive(player, false, stats.ghost, "ghost");
        // revoke elected role WIP: elected module?
        removeRoleRecursive(player, false, stats.mayor, "mayor");
        removeRoleRecursive(player, false, stats.mayor2, "mayor 2");
        removeRoleRecursive(player, false, stats.reporter, "reporter");
        removeRoleRecursive(player, false, stats.guardian, "guardian");
        
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
            updateAttributeAlive(playerAttributes[i].ai_id, 0);
        }
        
        // add to storytime
        if(!silent) await bufferStorytime(`<@${player_id}> has died!`);
	}
    
    /** PUBLIC
    Set Living Status
    set the alive value for a player
    // WIP: Maybe this should be in player module
    **/
    this.setLivingStatus = function(player_id, status) {
        return new Promise(res => {
            sql("UPDATE players SET alive=" + connection.escape(status) + " WHERE id=" + connection.escape(player_id), result => {
                updateGameStatus(); // update game status (async)
                res();
            });	
        });
    }

    
}
/*
	Module for main game handelling
		- Starts game
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
require("./startup.js")();
require("./caching.js")();
require("./cleanup.js")();
require("./phase.js")();
require("./locations.js")();
require("./polls.js")();
require("./teams.js")();
require("./connections.js")();
require("./storytime.js")();
require("./death.js")();
require("./channels.js")();
require("./discord_roles.js")();
require("./host_information.js")();
require("./displays.js")();
require("./transition.js")();

module.exports = function() {
    
	
	this.cmdEnd = function(channel) {
		gameEnd();
        channel.send("✅ Game has been ended.");
	}
    
	this.cmdTie = async function(channel) {
        // final trigger
        await triggerHandler("On End"); 
        // end game
		gameEnd();
        // set winners
        await sqlProm("UPDATE players SET final_result=1 WHERE alive=1 AND type='player'");
        // end message
        await bufferStorytime(`*A tie has occured!*`);
        await endMessage();
        channel.send("✅ Game has been ended in a tie.");
	}
    
	this.cmdReevaluate = async function(channel) {
        // final trigger
        await updateActiveTeams()
        channel.send("✅ Reevaluated win conditions.");
	}
    
    this.gameEnd = async function() {
        // update gamephase
        await sqlProm("UPDATE stats SET value=" + connection.escape(gp.POSTGAME) + " WHERE id=1");
        stats.gamephase = gp.POSTGAME;
        // update gp channel
        updateGameStatus();
        // update player roles
		mainGuild.roles.cache.get(stats.participant).members.forEach(el => {
            addRoleRecursive(el, backupChannelId, stats.dead_participant, "dead participant");
		});
        mainGuild.roles.cache.get(stats.sub).members.forEach(el => {
            addRoleRecursive(el, backupChannelId, stats.dead_participant, "dead participant");
		});
        mainGuild.roles.cache.get(stats.mentor).members.forEach(el => {
            addRoleRecursive(el, backupChannelId, stats.dead_participant, "dead participant");
		});
        // clear schedule
        clearSchedule();
    }
	
    
    /** Handles the restart command */
    this.cmdRestart = async function(channel) {
        // hide old group channels
		let groups = await sqlProm("SELECT * FROM active_groups");
        
        for(let i = 0; i < groups.length; i++) {
            let grpChannel = mainGuild.channels.cache.get(groups[i].channel_id);
            let chList = getChannelMembers(grpChannel);
            chList.forEach(el => {
                channelSetPermission(grpChannel, el, null);
            });
        }
        
        // reset
        cmdReset(channel, true, true);
        
        // update player scs
        let players = await sqlProm("SELECT id,role FROM players WHERE type='player' ORDER BY role ASC");
        
        for(let i = 0; i < players.length; i++) {
            let role = await sqlPromOne("SELECT * FROM roles WHERE name=" + connection.escape(players[i].role));
            var rolesName = role.display_name;
            var rolesNameBot = role.name;
            var roleData = role;
            if(role.identity) {
                let idRole = await sqlPromOneEsc("SELECT * FROM roles WHERE name=", role.identity);
                rolesName = idRole.display_name;
                rolesNameBot = idRole.name;
                roleData = idRole;
            }
            let disName = channel.guild.members.cache.get(players[i].id).displayName; // get the player's display name
            
            // Send Role DM (except if in debug mode)
            await createSCs_sendDM(channel.guild, players[i].id, roleData, disName, true);
            
            // Determine channel name
            let channelName = rolesName.substr(0, 100);
            channelName = applyTheme(channelName);
            
            if(channelName.length > 100 || channelName.length <= 0) channelName = "invalid";
            
            // set channel name
            let cid = await getSrcRefChannel(`player:${players[i].id}`);
            let targetChannel = mainGuild.channels.cache.get(cid);
            targetChannel.setName(channelName);
            
            // Send info message for each role
            cmdInfo(targetChannel, players[i].id, [ rolesNameBot ], true, false);
            
            // send card
            if (config.cards) {
                // wait
                await sleep(5 * 1000);
                cmdGetCard(targetChannel, rolesNameBot);
            }
        }
    }
    
	/* Handles reset command */
	this.cmdReset = function(channel, debug, restart = false) {
		if(stats.gamephase != gp.POSTGAME && stats.gamephase != gp.NONE && !debug) {
            channel.send("⛔ Command error. Can only reset game while in post-game state!");
            return;
        }
		// Set Gamephase
		cmdGamephaseSet(channel, ["set", gp.NONE]);
		// Reset Connection
        if(!debug) cmdConnectionReset(channel);
		// Reset Player Database
        if(!debug) {
            sql("DELETE FROM players", result => {
                channel.send("✅ Successfully reset player list!");
                getEmojis();
            },() => {
                channel.send("⛔ Database error. Could not reset player list!");
            });
        } else {
            sql("UPDATE players SET alive=1,ccs=0,public_msgs=0,private_msgs=0,target=NULL,counter=0,final_result=0,death_phase=-1");
        }
        // reset active groups
        groupsReset();
        // reset active attributes
        attributesReset();
        // reset active attributes
        abilitiesReset();
        // reset active polls
        pollsReset();
        // resets storytime
        resetStorytime();
        // resets choices
        choicesReset();
        // reset kill queue
        killqClear();
        // reset teams
        resetTeams();
        // reset displays
        resetDisplays();
        // reset host information
        resetHostInformation();
        // reset schedule
        clearSchedule();
        // disable action queue checker 
        pauseActionQueueChecker = true;
		// Reset Poll Count
		sqlSetStat(13, 1, result => {
			channel.send("✅ Successfully reset poll counter!");
		}, () => {
			channel.send("⛔ Database error. Could not reset poll counter!");
		});
        // reset DRs
        let livingPlayers =  channel.guild.roles.cache.get(stats.participant).members.toJSON();
        livingPlayers.forEach(el => removeAllDR(el.id));
        if(!debug) {
            // reset other roles
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.participant).members.toJSON(), 0, "participant");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.dead_participant).members.toJSON(), 0, "dead participant");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.ghost).members.toJSON(), 0, "ghost");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.gamemaster).members.toJSON(), 0, "game master");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.spectator).members.toJSON(), 0, "spectator");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.sub).members.toJSON(), 0, "substitute");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.helper).members.toJSON(), 0, "helper");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.mentor).members.toJSON(), 0, "mentor");
            // Remove Roles & Nicknames
            wroles_remove(channel, [stats.signed_up, stats.spectator, stats.sub, stats.participant, stats.dead_participant, stats.host, stats.ghost, stats.mentor], ["signed up", "spectator", "substitute", "participant", "dead participant", "host", "ghost", "mentor"]);
            // run role removal again for critical roles because sometimes it fails even though it says it succeeds
            wroles_remove(channel, [stats.participant, stats.dead_participant, stats.ghost, stats.mentor], ["participant", "dead participant", "ghost", "mentor"]);
            // Cleanup channels
            cmdCCCleanup(channel);
            scCleanup(channel);
            sqlGetStat(15, result => {
                cleanupCat(channel, result, "public");
            }, () => {
                channel.send("⛔ Database error. Could not get public category!");
            });
            resetRoleNames(channel);
        } else {
            cmdGamephaseSet(channel, ["set", gp.INGAME]);
            pauseActionQueueChecker = false;
            // reset to d0
            setPhase("d0");
            setSubphase(SUBPHASE.MAIN);
            // Start game
            if(!restart) {
                setTimeout(function() {
                    eventStarting();
                }, 1000 * 5);     
            } else {
                setTimeout(function() {
                    eventStarting(null, true);
                }, 1000 * 60);  
            }
        }
	}
    
    this.resetRoleNames = async function(channel) {
        // rename roles correctly
        let roles = [stats.signed_up, stats.spectator, stats.sub, stats.participant, stats.dead_participant, stats.host, stats.gamemaster, stats.ghost, stats.mentor, stats.ghost_mentor];
        let names = ["Signed-up","Spectator", "Substitute","Participant","Dead Participant","Host", "Game Master", "Ghostly Participant", "Mentor", "Ghostly Mentor"];
        for(let i = 0; i < roles.length; i++) {
            await channel.guild.roles.cache.get(roles[i]).setName(names[i]);
        }  
        channel.send("✅ Reset role names!");
    }
	
	this.wroles_remove = function(channel, ids, names) {
		wroles_remove2(channel, ids[0], names[0], () => {
			if(ids.length > 1) wroles_remove(channel, ids.splice(1), names.splice(1));
			else channel.send("✅ Finished removing roles!");
		});
	}
	
	this.wroles_remove2 = function(channel, id, name, callback) {
		// Remove spectator role
		if(channel.guild.roles.cache.get(id)) wroles_removeOnce(channel, id, name, channel.guild.roles.cache.get(id).members.toJSON(), 0, callback);
		else channel.send("Invalid role with id " + id + " and name " + name);
	}
	
	this.wroles_removeOnce = function(channel, id, name, members, index, callback) {
		if(index >= members.length) {
			callback();
			if(members.length > 0) channel.send("✅ Removed `" + name + "` role from `" + members.length + "` players!");
			return;
		}
		removeRoleRecursive(members[index], channel, id, name).then(m => {
            wroles_removeOnce(channel, id, name, members, ++index, callback);
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			wroles_removeOnce(channel, id, name, members, index, callback);
			sendError(channel, err, "Could not remove " + name + " role from " + members[index].displayName + "! Trying again");
		});
	}
	
	// Reset nicknames
	this.removeNicknameOnce = function(channel, members, index, name) {
		if(index >= members.length) {
			if(members.length > 0) channel.send("✅ Reset nicknames of `" + members.length + "` " + name + (members.length>1?"s":"") + "!");
			return;
		}
		members[index].setNickname("").then(m => {
			removeNicknameOnce(channel, members, ++index, name);
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not reset nickname from " + members[index].displayName);
			removeNicknameOnce(channel, members, ++index, name);
		});
	}
	
	/* Handle Sheet Command */
	this.cmdSheet = function(message, args) {
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `sheet [prepare|prepare_|import]`!"); 
			return; 
		}
		// Find Subcommand
		switch(args[0]) {
			// Prepare Sheet
			case "prepare": cmdSheetPrepare(message.channel, ",", 1); break;
			case "prepare_": cmdSheetPrepare(message.channel, ";", 1); break;
			case "mprepare": cmdSheetPrepare(message.channel, ",", 2); break;
			case "import": cmdSheetImport(message, message.channel, args, 1); break;
			case "mimport": cmdSheetImport(message, message.channel, args, 2); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	/* Prepare info for sheet */
	this.cmdSheetPrepare = function(channel, seperator, mode) {
		// Check gamephase
		if(stats.gamephase >= gp.INGAME) { 
			channel.send("⛔ Command error. Can't prepare an already started game."); 
			return; 
		}
		// Get all players
		sql("SELECT id,emoji FROM players WHERE type='player'", result => {
			// Print all players
			let playerList;
			switch(mode) {
				case 1:
					playerList = result.map(el => "=SPLIT(\"" + channel.guild.members.cache.get(el.id).user.username + "," + el.id + "\"" + seperator + "\",\")").join("\n");
					channel.send("**Copy this into a google sheet to have all names & ids**\n*Make sure to paste in with ctrl+shift+v\nColumns needed by `" + stats.prefix + "sheet import`: Name, Id, Nickname, Role*");
				break;
				case 2:
					playerList = result.map(el => channel.guild.members.cache.get(el.id).user.username + "," + el.id + ",").join("\n");
					channel.send("**Use this to have all names & ides**\n*Values needed by `" + stats.prefix + "sheet mimport`: Name,Id,Nickname,Role*");
				break;
			}
			channel.send("```\n" + playerList + "\n```");
		}, () => {
			// db error
			channel.send("⛔ Database error. Could not list signed up players!");
		});
	}
	
	/* Import info from sheet */
	this.cmdSheetImport = function(message, channel, args, mode) {
		// Check gamephase
		if(stats.gamephase >= gp.INGAME) { 
			channel.send("⛔ Command error. Can't import into an already started game."); 
			return; 
		}
		// Split info
		let playerInfo;
		switch(mode) {
			case 1: playerInfo = message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").split("~").slice(1).map(el => el.split(/\s\s\s\s/g)); break;
			case 2: playerInfo = message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").split("~").slice(1).map(el => el.split(/,/g)); break;
		}
		playerInfo.forEach(async el => { 
			// Prepare a user
			channel.send("▶ Preparing `" + el[0] + "`!").then(m => {
				// Set Nickname
				channel.guild.members.cache.get(el[1]).setNickname(el[2]).then(u => {
					m.edit(m.content +  "\n	" + (el[2].length > 0 ? "✅ Set nickname to `" + el[2] + "`" : "✅ Skipped setting nickname") + "!").then(m => {
						cmdSheetImportRole(m, el);
					});
				}).catch(err => {
					m.edit(m.content +  "\n	⛔ Permission error. Could not set nickname!").then(m => {
						cmdSheetImportRole(m, el);
					});
				});
			}).catch(err => {
				// Message Error
				logO(err); 
				sendError(channel, err, "Could not prepare user");
			});
		});
	}
	
	/* Imports one players' role via a pasted sheet */
	this.cmdSheetImportRole = async function(m, el) {
        // check valid role
        let parsedRole = parseRole(el[3]);
		// Set Role
		if(verifyRole(parsedRole)) {
			// All roles are valid -> Set it
            let roleData = await getRoleDataFromName(parsedRole);
			sql("UPDATE players SET role = " + connection.escape(parsedRole) + ",orig_role = " + connection.escape(parsedRole) + ",alignment=" + connection.escape(roleData.team) + ",activation=" + connection.escape(roleData.all.activation) + " WHERE id = " + connection.escape(el[1]), result => {
				m.edit(m.content + "\n	✅ Set role to `" + parsedRole + "`!").then(m => {
				});
			}, () => {
				m.edit(m.content + "\n	⛔ Database error. Could not set role!").then(m => {
				});
			});
		} else {
			// Invalid roles
			m.edit(m.content + "\n	⛔ Command error. Role `" + parsedRole + "` does not exist!").then(m => {
			});
		}
	}
	
	/* Pings all players with the New Game Ping role */
	this.cmdGamePing = function(channel, member) {
        if(!stats.new_game_ping || stats.new_game_ping === "false") return;
		channel.guild.roles.cache.get(stats.new_game_ping).setMentionable(true).then(u => {
			channel.send("**" + member.displayName + "** is going to start a new game! <@&" + stats.new_game_ping + ">").then(m => {
				channel.guild.roles.cache.get(stats.new_game_ping).setMentionable(false).catch(err => {
					// Message Error
					logO(err); 
					sendError(channel, err, "Could not reset new game ping role");
				});
			}).catch(err => {
				// Message Error
				logO(err); 
				sendError(channel, err, "Could not ping new game ping role");
			});
		}).catch(err => {
			// Message Error
			logO(err); 
			sendError(channel, err, "Could not prepare new game ping role");
		});
	}
	
	/* Opens signups & Pings players */
	this.cmdOpen = function(message) {
        cmdHost(message.channel, message.member);
        message.channel.send("**Signups are now open!**");
		cmdGamephase(message, ["set", gp.SIGNUP]);
		cmdGamePing(message.channel, message.member);
	}
    
	/* Closes signups */
	this.cmdClose = function(message) {
        message.channel.send("**Signups are now closed!**");
		cmdGamephase(message, ["set", gp.SETUP]);
	}
	
}

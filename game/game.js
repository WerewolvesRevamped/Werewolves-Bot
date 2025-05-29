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

module.exports = function() {
    
	/* Handles start command */
	this.cmdStart = async function(channel, debug) {
		if(stats.gamephase == gp.SETUP || (debug && stats.gamephase == gp.NONE)) {
            // start
        } else { 
            if(stats.gamephase == gp.NONE) {
                channel.send("⛔ Command error. Can't start if there is no game."); 
                return; 
            } else if(stats.gamephase >= gp.INGAME) {
                channel.send("⛔ Command error. Can't start an already started game."); 
                return; 
            } else if(stats.gamephase == gp.SIGNUP) {
                channel.send("⛔ Command error. Can't start the game while signups are open."); 
                return; 
            } else {
                channel.send("⛔ Command error. Invalid gamephase."); 
                return; 
            }
		}
        
        let check = await gameCheckStart(channel);
        if(!check) return;
        
        if(stats.automation_level === 4 && !stats.phaseautoinfo) {
            channel.send("⛔ Command error. Cannot start a fully automated game without phase timings."); 
            return;
        }
        if(stats.automation_level === 4 && (!parseToFutureUnixTimestamp(stats.phaseautoinfo.d0) || isNaN(stats.phaseautoinfo.day) || isNaN(stats.phaseautoinfo.night) || stats.phaseautoinfo.day <= 2 || stats.phaseautoinfo.night <= 2)) {
            channel.send("⛔ Command error. Invalid phase timings."); 
            return;
        }
        
        //channel.send(`⛔ Debug error. Would've started game.`); 
        //return;
        
		channel.send("✳️ Game is called `" + stats.game + "`");
        actionLog(`**🎲 The game has started. [${stats.game}]**`);
        createLocations();
		// Set Gamephase
		cmdGamephaseSet(channel, ["set", gp.INGAME]);
		// Cache emojis
		getEmojis();	
		getCCs();
		cacheRoleInfo();
        getPRoles();
        // enable action queue checker 
        pauseActionQueueChecker = false;
		// Assign roles
		startOnePlayer(channel, channel.guild.roles.cache.get(stats.signed_up).members.toJSON(), 0);
		createSCs(channel, debug);
        // reset to d0
        setPhase("d0");
        setSubphase(SUBPHASE.MAIN);
        // Assign roles to substitute
        let subs = channel.guild.roles.cache.get(stats.signedsub).members.toJSON();
        for(let i = 0; i < subs.length; i++) {
            switchRoles(subs[i], channel, stats.signedsub, stats.sub, "signed sub", "substitute").then(r => {
                if(r) channel.send("✅ `" + subs[i].displayName + "` is now a substitute!");
            });
        }
        
        // Setup schedule
        if(stats.automation_level === 4) {
            pauseActionQueueChecker = true;
            let time = parseToFutureUnixTimestamp(stats.phaseautoinfo.d0);
            let durNight = stats.phaseautoinfo.night * 60;
            let durDay = stats.phaseautoinfo.day * 60;
            let fullCycle = durNight + durDay;
            // D0 End
            await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence, name) VALUES ('special','switch'," + connection.escape(time - 60) + ",0,'d0-end')");
            // Night End
            await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence, name) VALUES ('special','switch'," + connection.escape(time + durNight - 60) + "," + connection.escape(fullCycle) + ",'night-end')");
            // Day End
            await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence, name) VALUES ('special','switch'," + connection.escape(time + fullCycle - 60) + "," + connection.escape(fullCycle) + ",'day-end')");
            // Night Late
            if(stats.phaseautoinfo.night_late) {
                await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence, name) VALUES ('special','switch'," + connection.escape(time + durNight - (stats.phaseautoinfo.night_late * 60) - 30) + "," + connection.escape(fullCycle) + ",'night-late')");
            }
            // Day Late
            if(stats.phaseautoinfo.day_late) {
                await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence, name) VALUES ('special','switch'," + connection.escape(time + fullCycle - (stats.phaseautoinfo.day_late * 60) - 30) + "," + connection.escape(fullCycle) + ",'day-late')");
            }
            
            // save D0 time
            await saveD0Time(time);
            
            // start game with timestamp parameter
            setTimeout(function() {
                eventStarting(time);
            }, 1000 * 60);
        } else {
            // Start game
            setTimeout(function() {
                eventStarting();
            }, 1000 * 60);     
        }
        
        
	}
    
	this.startOnePlayer = function(channel, members, index) {
		if(index >= members.length) {
			channel.send("✅ Prepared `" + members.length + "` players!");
			return;
		}
        switchRoles(members[index], channel, stats.signed_up, stats.participant, "signed up", "participant").then(r => {
            if(r) channel.send("✅ `" + members[index].displayName + "` is now a participant!");
            startOnePlayer(channel, members, ++index);
        });
	}
	
	
    this.cmdForceDemote = function(channel, all = true) {
        // demotable
        let admins = channel.guild.roles.cache.get(stats.admin).members.toJSON();
        let seniorgms = channel.guild.roles.cache.get(stats.senior_gamemaster).members.toJSON();
        let gms = channel.guild.roles.cache.get(stats.gamemaster).members.toJSON();
        let helpers = channel.guild.roles.cache.get(stats.helper).members.toJSON();
        // ignore
        let host = channel.guild.roles.cache.get(stats.host).members.toJSON();
        let ignore = host.map(el => el.id);
        // filter
        let signedup = channel.guild.roles.cache.get(stats.signed_up).members.toJSON();
        let substitute = channel.guild.roles.cache.get(stats.sub).members.toJSON();
        let mentor = channel.guild.roles.cache.get(stats.mentor).members.toJSON();
        let filter = signedup.map(el => el.id);
        filter.push(...substitute.map(el => el.id));
        filter.push(...mentor.map(el => el.id));
        // list
        let processedIds = [];
        //
        // list list
        let demotable = [admins, seniorgms, gms, helpers];
        for(let i = 0; i < demotable.length; i++) {
            for(let j = 0; j < demotable[i].length; j++) {
                let curid = demotable[i][j].id;
                if(processedIds.includes(curid)) { // already previously handeled
                    continue;
                }
                processedIds.push(curid); // save as processed
                if(ignore.includes(curid)) { // is host, ignore
                    //console.log(`FD ignore: ${demotable[i][j].displayName}`);
                    continue;
                }
                if(all || filter.includes(curid)) { // only demote signedup if all=false
                    //console.log(`FD demote: ${demotable[i][j].displayName}`);
                    cmdDemote(channel, demotable[i][j]);
                } else {
                    //console.log(`FD filtered out: ${demotable[i][j].displayName}`);
                }
            }
        }
    }
    
	this.cmdDemote = function(channel, member) {
		channel.send("✅ Attempting to demote you, " + member.displayName + "!");
        switchRolesX(member, channel, stats.gamemaster_ingame, stats.gamemaster, "gamemaster ingame", "gamemaster");
        switchRolesX(member, channel, stats.senior_gamemaster_ingame, stats.senior_gamemaster, "senior gamemaster ingame", "senior gamemaster");
        switchRolesX(member, channel, stats.admin_ingame, stats.admin, "admin ingame", "admin");
        switchRolesX(member, channel, stats.helper_ingame, stats.helper, "helper ingame", "helper");
	}
	
	this.cmdPromote = function(channel, member) {
		if(isParticipant(member) && !member.roles.cache.get(stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a participant."); 
			return;
		}
        if(isDeadParticipant(member) && !member.roles.cache.get(stats.senior_gamemaster_ingame) && !member.roles.cache.get(stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a dead participant."); 
			return;
		}
		channel.send("✅ Attempting to promote you, " + member.displayName + "!");
        switchRoles(member, channel, stats.gamemaster_ingame, stats.gamemaster, "gamemaster ingame", "gamemaster");
        switchRoles(member, channel, stats.senior_gamemaster_ingame, stats.senior_gamemaster, "senior gamemaster ingame", "senior gamemaster");
        switchRoles(member, channel, stats.admin_ingame, stats.admin, "admin ingame", "admin");
        switchRoles(member, channel, stats.helper_ingame, stats.helper, "helper ingame", "helper");
	}

	
	this.cmdUnhost = function(channel, member) {
		channel.send("✅ Attempting to unhost you, " + member.displayName + "!");
		if(member.roles.cache.get(stats.host)) {
            removeRoleRecursive(member, channel, stats.host, "host");
		}
	}
	
	this.cmdHost = function(channel, member) {
		if(isParticipant(member)) {
			channel.send("⛔ Command error. Can't host you while you're a participant."); 
			return;
		}
		channel.send("✅ Attempting to host you, " + member.displayName + "!");
		if(member.roles.cache.get(stats.gamemaster)) {
            addRoleRecursive(member, channel, stats.host, "host");
		}
	}
    
    this.cmdDemoteUnhost = function(channel, member) {
        if(member.roles.cache.get(stats.host)) {
            cmdUnhost(channel, member);
        } else {
            cmdDemote(channel, member);
        }
    }
    
    this.cmdPromoteHost = function(channel, member) {
        if(member.roles.cache.get(stats.gamemaster_ingame) || member.roles.cache.get(stats.senior_gamemaster_ingame) || member.roles.cache.get(stats.admin_ingame) || member.roles.cache.get(stats.helper_ingame)) {
            cmdPromote(channel, member);
        } else {
            cmdHost(channel, member);
        }
    }
	
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
	
	/* Handles reset command */
	this.cmdReset = function(channel, debug) {
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
            setTimeout(function() {
                eventStarting();
            }, 1000 * 5);     
        }
	}
    
    this.resetRoleNames = async function(channel) {
        // rename roles correctly
        let roles = [stats.signed_up, stats.spectator, stats.sub, stats.participant, stats.dead_participant, stats.host, stats.gamemaster, stats.ghost, stats.mentor];
        let names = ["Signed-up","Spectator", "Substitute","Participant","Dead Participant","Host", "Game Master", "Ghost", "Mentor"];
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
			sql("UPDATE players SET role = " + connection.escape(parsedRole) + ",orig_role = " + connection.escape(parsedRole) + ",alignment=" + connection.escape(roleData.team) + " WHERE id = " + connection.escape(el[1]), result => {
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

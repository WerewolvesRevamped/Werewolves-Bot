/*
	Module for main game handelling
		- Starts game
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
module.exports = function() {

	/* Handles start command */
	this.cmdStart = function(channel, debug) {
		if(stats.gamephase == gp.SETUP || (debug && stats.gamephase == gp.NONE)) {
            // start
        } else { 
			channel.send("⛔ Command error. Can't start an already started game."); 
			return; 
		}
		channel.send("✳ Game is called `" + stats.game + "`");
		// Create Public Channels
		channel.guild.channels.create("💬 " + toTitleCase(stats.game) + " Public Channels", { type: "GUILD_CATEGORY",  permissionOverwrites: getPublicCatPerms(channel.guild) })
		.then(cc => {
			sqlSetStat(15, cc.id, result => {
				// Create public channels
				createStartPublic(channel, cc);
			}, () => {
				channel.send("⛔ Database error. Could not save public category!");
			});
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not create public channels!");
		});
		// Set Gamephase
		cmdGamephaseSet(channel, ["set", gp.INGAME]);
		// Cache emojis
		getEmojis();	
		getVotes();
		getCCs();
		getRoles();
		// Assign roles
		startOnePlayer(channel, channel.guild.roles.cache.get(stats.signed_up).members.toJSON(), 0);
		createSCs(channel, debug);
        if(stats.secret_mode) getDisguises();
	}
	
	this.helpGame = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "sheet [prepare|prepare_|import|mprepare|mimport] - Prepares a game\n";
				if(isGameMaster(member)) help += stats.prefix + "start - Starts a game\n";
				if(isGameMaster(member)) help += stats.prefix + "start_debug - Starts a game, without sending out the role messages\n";
				if(isGameMaster(member)) help += stats.prefix + "reset - Resets a game\n";
				if(isGameMaster(member)) help += stats.prefix + "end - Ends a game\n";
				if(isGameMaster(member)) help += stats.prefix + "demote - Removes Game Master and Admin roles\n";
				if(isGameMaster(member)) help += stats.prefix + "promote - Reassigns Game Master and Admin roles\n";
				if(isGameMaster(member)) help += stats.prefix + "gameping - Notifies players with the New Game Ping role about a new game\n";
				if(isGameMaster(member)) help += stats.prefix + "open - Opens signups and notifies players\n";
				help += stats.prefix + "spectate - Makes you a spectator\n";
				help += stats.prefix + "substitute - Makes you a substitute player\n";
			break;
			case "start":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "start\n```";
				help += "```\nFunctionality\n\nStarts the game. Assigns Participant to all signed up players, and takes away the signed up role. Sends out role messages. Creates public channels. Creates Secret Channels. Sends info messages in secret channels. Sets the gamephase.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "start\n```";
			break;
			case "start_debug":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "start_debug\n```";
				help += "```\nFunctionality\n\nDoes the same as " + stats.prefix + "start, but does not send out role messages.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "start_debug\n```";
			break;
			case "reset_debug":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "reset_debug\n```";
				help += "```\nFunctionality\n\nDoes the same as " + stats.prefix + "reset, but keeps all players as signed up.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "reset_debug\n```";
			break;
			case "reset":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "reset\n```";
				help += "```\nFunctionality\n\nResets the game. Resets all discord roles. Clears player database. Deletes all CCs. Deletes all SCs. Deletes all Public Channels. Resets Polls. Resets Connections. Sets the gamephase.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "reset\n```";
			break;
			case "end":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "end\n```";
				help += "```\nFunctionality\n\nEnds the game. Sets the gamephase, and makes all Participants Dead Participants.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "end\n```";
			break;
			case "spectate":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "spectate\n```";
				help += "```\nFunctionality\n\nMakes you a spectator, if you are not a participant and a game is running.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "spectate\n< ✅ Attempting to make you a spectator, McTsts!\n```";
				help += "```diff\nAliases\n\n\n- s\n- spec\n- spectator\n```";
			break;
			case "substitute":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "substitute\n```";
				help += "```\nFunctionality\n\nMakes you a substitute player, if you are not a participant and a game is running.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "spectate\n< ✅ Attempting to make you a substitute player, McTsts!\n```";
				help += "```diff\nAliases\n\n\n- sub\n```";
			break;
			case "demote":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "demote\n```";
				help += "```\nFunctionality\n\nReplaces Game Master and Admin roles with GM Ingame and Admin Ingame roles, which have no permisions.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "demote\n< ✅ Attempting to demote you, McTsts!\n```";
				help += "```diff\nAliases\n\n- v\n```";
			break;
			case "promote":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "promote\n```";
				help += "```\nFunctionality\n\nReplaces GM Ingame and Admin Ingame roles with Game Master and Admin roles.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "promote\n< ✅ Attempting to promote you, McTsts!\n```";
				help += "```diff\nAliases\n\n- ^\n```";
			break;
			case "gameping":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "gameping\n```";
				help += "```\nFunctionality\n\nMakes New Game Ping role mentionable, pings it and then makes it unmentionable again.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "gameping\n< Ts is going to start a new game! @New Game Ping\n```";
				help += "```diff\nAliases\n\n- @@\n```";
			break;
			case "open":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "open\n```";
				help += "```\nFunctionality\n\nOpens signups, then makes New Game Ping role mentionable, pings it and then makes it unmentionable again.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "open\n```";
				help += "```diff\nAliases\n\n- @\n```";
			break;
			case "sheet":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet [prepare|prepare_|import|mprepare|mimport]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle google sheets used for the game. " + stats.prefix + "help sheet <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- sh\n- game\n```";
					break;
					case "prepare":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet prepare\n```";
						help += "```\nFunctionality\n\nReturns the names and ids (first two columns in a google sheet for the game) of all signed up players in a format which makes it easy to use, to prepare a google sheet for the game.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet prepare\n```";	
					break;
					case "prepare_":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet prepare_\n```";
						help += "```\nFunctionality\n\nSame as " + stats.prefix + "sheet prepare, but returns the information in a slightly different format, which works in some countries.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet prepare_\n```";	
					break;
					case "mprepare":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet mprepare\n```";
						help += "```\nFunctionality\n\nReturns the names and ids of all players seperated with commans. Can be used in combination with " + stats.prefix + "sheet mimport on mobile.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet mprepare\n```";	
					break;
					case "import":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet import\n  <Sheet Information>\n```";
						help += "```\nFunctionality\n\nSets nicknames and roles of players by pasting in the first four columns of a google sheet for the game (First Column: Name, Second Column: Id, Third Column: Nickname (can be empty), Fourth Column: Role)\nOptionally, more columns with extra roles can be provided for double (or more) role games.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet import\n  Fl1nt5t0n3	334066065112039425	The Artist	Stalker\n  Vera	277156693765390337	The Hooker	Angel\n  sav	437289420899745795	The Clown	Dog\n  SuperbWolfPack	309072997950554113	The Dancer	Citizen\n  Chopper2112	271399293372334081	The Chopper	Scared Wolf```";	
					break;
					case "mimport":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet mimport\n  <Sheet Information>\n```";
						help += "```\nFunctionality\n\n" + stats.prefix + "sheet import variation that can be more easily handwritten. Different values are comma seperated (First Column: Name, Second Column: Id, Third Column: Nickname (can be empty), Fourth Column: Role)\nOptionally, more columns with extra roles can be provided for double (or more) role games.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet import\n  Fl1nt5t0n3,334066065112039425,The Artist,Stalker\n  Vera,277156693765390337,The Hooker,Angel\n  sav,437289420899745795,The Clown,Dog\n  SuperbWolfPack,309072997950554113,The Dancer,Citizen\n  Chopper2112,271399293372334081,The Chopper,Scared Wolf```";	
					break;
				}
			break;
		}
		return help;
	}
	
	this.startOnePlayer = function(channel, members, index) {
		if(index >= members.length) {
			channel.send("✅ Prepared `" + members.length + "` players!");
			return;
		}
		members[index].roles.add(stats.participant).then(m => {
			members[index].roles.remove(stats.signed_up).then(m => {
				channel.send("✅ `" + members[index].displayName + "` is now a participant!");
				startOnePlayer(channel, members, ++index);
			}).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove signed up role from " + members[index] + "! Trying again");
				startOnePlayer(channel, members, index);
			});
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not add role to" + members[index]  + "! Trying again");
			startOnePlayer(channel, members, index);
		});
	}
	
	/* Public Permissions */
	this.getPublicCatPerms = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write", "read"], []) ];
	}
	
	/* Starts the creation of extra scs */
	this.createStartPublic = function(channel, cc) {
        if(!stats.secret_mode) { // standard mode
            sql("SELECT name,members,setup FROM sc WHERE type = 'public' ORDER BY cond ASC", result => {
                createOnePublic(channel, cc, result, 0);
            }, () => {
                channel.send("⛔ Database error. Unable to get a list extra SCs."); 
            });
        } else {
            // Get players with that role
            sql("SELECT id,disguise FROM players ORDER BY disguise ASC", allPlayers => {
                sql("SELECT name,members,setup FROM sc WHERE type = 'public' ORDER BY cond ASC", publicChannels => {
                    createOneSecretPublic(channel, cc, publicChannels, 0, allPlayers, 0);
                }, () => {
                    channel.send("⛔ Database error. Unable to get a list extra SCs."); 
                });
            }, () => {
                channel.send("⛔ Database error. Unable to get a list of players."); 
            });
        }
	}
	
	this.createOnePublic = function(channel, category, channels, index) {
		// Checks
		if(index >= channels.length) {
			channel.send("✅ Finished creating Public Channels!");
			return;
		}
		let cPerms;
		switch(channels[index].members) {
			case "mayor": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.mayor, ["read", "write"], []), getPerms(stats.mayor2, ["read", "write"], []), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.sub, ["read"], ["write"]), getPerms(stats.participant, ["read"], ["write"]) ]; 
			break;
			case "info": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.sub, ["read"], ["write"]), getPerms(stats.participant, ["read"], ["write"]) ]; 
			break;
			case "alive": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.sub, ["read"], ["write"]), getPerms(stats.participant, ["read","write"], []) ]; 
			break;
			case "dead": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read","write"], []), getPerms(stats.spectator, ["read","write"], []), getPerms(stats.participant, [], ["read"]), getPerms(stats.sub, [], ["read"]) ]; 
			break;
		}
		channel.guild.channels.create(channels[index].name, { type: "text",  permissionOverwrites: cPerms })
		.then(sc => { 
			if(channels[index].setup.length > 1) channels[index].setup.replace(/%n/g, index).split(",").forEach(el => sc.send(stats.prefix + el));
			sc.setParent(category,{ lockPermissions: false }).then(m => {
				createOnePublic(channel, category, channels, ++index);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not set category"); 
			}); 
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not create channel"); 
		});
	}
    
	this.createOneSecretPublic = function(channel, category, channels, index, players, playersIndex) {
		// Checks
		if(index >= channels.length) {
			channel.send("✅ Finished creating Public Channels!");
			return;
		}
        if(playersIndex >= players.length) {
			channel.send("✅ Finished creating `" + channels[index].name + "`.");
			createOneSecretPublic(channel, category, channels, ++index, players, 0);
            return;
        }
        
		let cPerms;
		switch(channels[index].members) {
			case "mayor": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.mayor, ["write"], []), getPerms(stats.mayor2, ["write"], []), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(players[playersIndex].id, ["read"], ["write"]) ]; 
			break;
			case "info": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, [], ["read"]), getPerms(players[playersIndex].id, ["read"], ["write"]) ]; 
			break;
			case "alive": 
				cPerms = [ getPerms(channel.guild.id, ["write"], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, [], ["read"]), getPerms(players[playersIndex].id, ["read"], []) ]; 
			break;
			case "dead": // dead channels are shared
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read","write"], []), getPerms(stats.spectator, ["read","write"], []), getPerms(stats.participant, [], ["read"]), getPerms(stats.sub, [], ["read"]) ]; 
                channel.guild.channels.create(channels[index].name, { type: "text",  permissionOverwrites: cPerms })
                .then(sc => { 
                    if(channels[index].setup.length > 1) channels[index].setup.replace(/%n/g, index).split(",").forEach(el => sc.send(stats.prefix + el));
                    sc.setParent(category,{ lockPermissions: false }).then(m => {
                        createOneSecretPublic(channel, category, channels, ++index, players, 0);
                    }).catch(err => { 
                        logO(err); 
                        sendError(channel, err, "Could not set category"); 
                    }); 
                }).catch(err => { 
                    logO(err); 
                    sendError(channel, err, "Could not create channel"); 
                });
                return;
			break;
		}
		channel.guild.channels.create(channels[index].name + "-" + players[playersIndex].disguise.split(",")[0].substr(0, 10), { type: "text",  permissionOverwrites: cPerms })
		.then(sc => { 
            sc.send(stats.prefix + "split connection add " + channels[index].name + " %n;delay 1 delete 1");
			if(channels[index].setup.length > 1) channels[index].setup.replace(/%n/g, index).split(",").forEach(el => sc.send(stats.prefix + el));
			sc.setParent(category,{ lockPermissions: false }).then(m => {
				createOneSecretPublic(channel, category, channels, index, players, ++playersIndex);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not set category"); 
			}); 
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not create channel"); 
		});
	}
	
	this.cmdDemote = function(channel, member) {
		channel.send("✅ Attempting to demote you, " + member.displayName + "!");
		if(member.roles.cache.get(stats.gamemaster)) {
			member.roles.remove(stats.gamemaster).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove game master role from " + member.displayName);
			});
			member.roles.add(stats.gamemaster_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add game master ingame role to " + member.displayName);
			});
		}
		if(member.roles.cache.get(stats.admin)) {
			member.roles.remove(stats.admin).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove admin role from " + member.displayName);
			});
			member.roles.add(stats.admin_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add admin ingame role to " + member.displayName);
			});
		}
	}
	
	this.cmdPromote = function(channel, member) {
		if(isParticipant(member) && !member.roles.cache.get(stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a participant."); 
			return;
		}
		channel.send("✅ Attempting to promote you, " + member.displayName + "!");
		if(member.roles.cache.get(stats.gamemaster_ingame)) {
			member.roles.remove(stats.gamemaster_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove game master ingame role from " + member.displayName);
			});
			member.roles.add(stats.gamemaster).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add game master role to " + member.displayName);
			});
		}
		if(member.roles.cache.get(stats.admin_ingame)) {
			member.roles.remove(stats.admin_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove admin ingame role from " + member.displayName);
			});
			member.roles.add(stats.admin).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add admin role to " + member.displayName);
			});
		}
	}
	
	this.cmdSpectate = function(channel, member) {
		if(isParticipant(member)) {
			channel.send("⛔ Command error. Can't make you a spectator while you're a participant."); 
			return;
		} else if(stats.gamephase < gp.SETUP) {
			channel.send("⛔ Command error. Can't make you a spectator while there is no game."); 
			return;
		}
		channel.send("✅ Attempting to make you a spectator, " + member.displayName + "!");
		member.roles.add(stats.spectator).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not add spectator role to " + member.displayName);
		});
	}
	
	this.cmdSubstitute = function(channel, member) {
		if(isParticipant(member)) {
			channel.send("⛔ Command error. Can't make you a substitute player while you're a participant."); 
			return;
		}  else if(isSignedUp(member)) {
			channel.send("⛔ Command error. Can't make you a substitute player while being signed-up."); 
			return;
		}
		channel.send("✅ Attempting to make you a substitute player, " + member.displayName + "!");
		member.roles.add(stats.sub).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not add substitute player role to " + member.displayName);
		});
	}
	
	this.cmdEnd = function(channel) {
		cmdGamephaseSet(channel, ["set", gp.POSTGAME]);
		channel.guild.roles.cache.get(stats.participant).members.forEach(el => {
			el.roles.add(stats.dead_participant).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add role to" + el);
			});
		});
	}
	
	/* Handles reset command */
	this.cmdReset = function(channel, debug) {
		// Set Gamephase
		cmdGamephaseSet(channel, ["set", gp.NONE]);
		// Reset Connection
		cmdConnectionReset(channel);
		// Reset Player Database
        if(!debug) {
            sql("DELETE FROM players", result => {
                channel.send("✅ Successfully reset player list!");
                getEmojis();
            },() => {
                channel.send("⛔ Database error. Could not reset player list!");
            });
        }
		// Reset polls
		// Reset Poll Database
		sql("DELETE FROM polls", result => {
			channel.send("✅ Successfully reset poll list!");
			getEmojis();
		},() => {
			channel.send("⛔ Database error. Could not reset poll list!");
		});
		// Reset Poll Count
		sqlSetStat(13, 1, result => {
			channel.send("✅ Successfully reset poll counter!");
		}, () => {
			channel.send("⛔ Database error. Could not reset poll counter!");
		});
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.participant).members.toJSON(), 0);
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.dead_participant).members.toJSON(), 0);
		// Remove Roles & Nicknames
		wroles_remove(channel, [stats.signed_up, stats.participant, stats.dead_participant, stats.spectator, stats.mayor, stats.mayor2, stats.reporter, stats.guardian, stats.sub], ["signed up", "participant", "dead participant", "spectator", "mayor", "mayor2", "reporter", "guardian", "substitute"])
		// Cleanup channels
		cmdCCCleanup(channel);
		cmdRolesScCleanup(channel);
		cmdKillqClear(channel);
		sqlGetStat(15, result => {
			cleanupCat(channel, result, "public");
		}, () => {
			channel.send("⛔ Database error. Could not get public category!");
		});
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
		else channel.send("Invalid role with id " + id);
	}
	
	this.wroles_removeOnce = function(channel, id, name, members, index, callback) {
		if(index >= members.length) {
			callback();
			channel.send("✅ Removed `" + name + "` role from `" + members.length + "` players!");
			return;
		}
		members[index].roles.remove(id).then(m => {
			channel.send("✅ `" + members[index].displayName + "` is no longer a " + name + "!");
			wroles_removeOnce(channel, id, name, members, ++index, callback);
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			wroles_removeOnce(channel, id, name, members, index, callback);
			sendError(channel, err, "Could not remove " + name + " role from " + members[index].displayName + "! Trying again");
		});
	}
	
	// Reset nicknames
	this.removeNicknameOnce = function(channel, members, index) {
		if(index >= members.length) {
			channel.send("✅ Reset nicknames of `" + members.length + "` players!");
			return;
		}
		members[index].setNickname("").then(m => {
			removeNicknameOnce(channel, members, ++index);
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not reset nickname from " + members[index].displayName);
			removeNicknameOnce(channel, members, ++index);
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
		sql("SELECT id,emoji FROM players", result => {
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
	
	/* Imports one players' roles via a pasted sheet */
	this.cmdSheetImportRole = function(m, el) {
		// Find the roles and which are valid/invalid
		let roleList = el.splice(3).map(role => parseRole(role));
		if(roleList[0] != "custom") {
			var validRoles = roleList.filter(role => verifyRole(role));
			var invalidRoles = roleList.filter(role => !verifyRole(role));
		} else {
			var validRoles = roleList;
			var invalidRoles = [];
		}
		// Set Role
		if(!invalidRoles.length) {
			// All roles are valid -> Set it
			sql("UPDATE players SET role = " + connection.escape(validRoles.join(",")) + " WHERE id = " + connection.escape(el[1]), result => {
				m.edit(m.content + "\n	✅ Set role to `" + validRoles.join("` + `") + "`!").then(m => {
				});
			}, () => {
				m.edit(m.content + "\n	⛔ Database error. Could not set role!").then(m => {
				});
			});
		} else {
			// One or more invalid roles
			m.edit(m.content + "\n	⛔ Command error. Role `" + invalidRoles.join("` + `") + "` does not exist!").then(m => {
			});
		}
	}
	
	/* Pings all players with the New Game Ping role */
	this.cmdGamePing = function(channel, member) {
        if(!stats.new_game_ping) return;
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

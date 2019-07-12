/*
	Module for main game handelling
		- Starts game
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
module.exports = function() {
	/* Variables */
	this.loadedModuleGame = true;

	/* Handles start command */
	this.cmdStart = function(channel, debug) {
		if(!loadedModulePlayers || !loadedModuleRoles) return;
		if(stats.gamephase > 1) { 
			channel.send("⛔ Command error. Can't start an already started game."); 
			return; 
		}
		channel.send("✳ Game is called `" + stats.game + "`");
		// Create Public Channels
		channel.guild.createChannel("💬 " + toTitleCase(stats.game) + " Public Channels", { type: "category",  permissionOverwrites: getPublicCatPerms(channel.guild) })
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
		cmdGamephaseSet(channel, ["set", "2"]);
		// Cache emojis
		if(loadedModulePlayers) getEmojis();	
		if(loadedModulePlayers) getVotes();
		// Assign roles
		startOnePlayer(channel, channel.guild.roles.find(el => el.id === stats.signed_up).members.array(), 0);
		if(loadedModuleRoles) createSCs(channel, debug);
	}
	
	this.helpGame = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "sheet [prepare|prepare_|import] - Prepares a game\n";
				if(isGameMaster(member)) help += stats.prefix + "start - Starts a game\n";
				if(isGameMaster(member)) help += stats.prefix + "start_debug - Starts a game, without sending out the role messages\n";
				if(isGameMaster(member)) help += stats.prefix + "reset - Resets a game\n";
				if(isGameMaster(member)) help += stats.prefix + "end - Ends a game\n";
				if(isGameMaster(member)) help += stats.prefix + "demote - Removes Game Master and Admin roles\n";
				if(isGameMaster(member)) help += stats.prefix + "promote - Reassigns Game Master and Admin roles\n";
				if(isGameMaster(member)) help += stats.prefix + "gameping - Notifies players with the New Game Ping role about a new game\n";
				help += stats.prefix + "spectate - Makes you a spectator\n";
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
			break;
			case "demote":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "demote\n```";
				help += "```\nFunctionality\n\nReplaces Game Master and Admin roles with GM Ingame and Admin Ingame roles, which have no permisions.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "demote\n< ✅ Attempting to demote you, McTsts!\n```";
			break;
			case "promote":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "promote\n```";
				help += "```\nFunctionality\n\nReplaces GM Ingame and Admin Ingame roles with Game Master and Admin roles.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "promote\n< ✅ Attempting to promote you, McTsts!\n```";
			break;
			case "gameping":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "gameping\n```";
				help += "```\nFunctionality\n\nMakes New Game Ping role mentionable, pings it and then makes it unmentionable again.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "gameping\n< Ts is going to start a new game! @New Game Ping\n```";
			break;
			case "sheet":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet [prepare|prepare_|import]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle google sheets used for the game. " + stats.prefix + "help sheet <sub-command> for detailed help.```";
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
					case "import":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet import\n  <Sheet Information>\n```";
						help += "```\nFunctionality\n\nSets nicknames and roles of players by pasting in the first four columns of a google sheet for the game (First Column: Name, Second Column: Id, Third Column: Nickname (can be empty), Fourth Column: Role)\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet import\n  Fl1nt5t0n3	334066065112039425	The Artist	Stalker\n  Alice Howlter	277156693765390337	The Hooker	Angel\n  sav	437289420899745795	The Clown	Dog\n  SuperbWolfPack	309072997950554113	The Dancer	Citizen\n  Chopper2112	271399293372334081	The Chopper	Scared Wolf```";	
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
		members[index].addRole(stats.participant).then(m => {
			members[index].removeRole(stats.signed_up).then(m => {
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
		sql("SELECT name,members,setup FROM sc WHERE type = 'public' ORDER BY cond ASC", result => {
			createOnePublic(channel, cc, result, 0);
		}, () => {
			channel.send("⛔ Database error. Unable to get a list extra SCs."); 
		});
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
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.mayor, ["read", "write"], []), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["read"], ["write"]) ]; 
			break;
			case "info": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["read"], ["write"]) ]; 
			break;
			case "alive": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["read","write"], []) ]; 
			break;
			case "dead": 
				cPerms = [ getPerms(channel.guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read","write"], []), getPerms(stats.spectator, ["read","write"], []), getPerms(stats.participant, [], ["read"]) ]; 
			break;
		}
		channel.guild.createChannel(channels[index].name, { type: "text",  permissionOverwrites: cPerms })
		.then(sc => { 
			if(channels[index].setup.length > 1) channels[index].setup.replace(/%n/g, index).split(",").forEach(el => sc.send(stats.prefix + el));
			sc.setParent(category).then(m => {
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
	
	this.cmdDemote = function(channel, member) {
		channel.send("✅ Attempting to demote you, " + member.displayName + "!");
		if(member.roles.find(el => el.id === stats.gamemaster)) {
			member.removeRole(stats.gamemaster).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove game master role from " + member.displayName);
			});
			member.addRole(stats.gamemaster_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add game master ingame role to " + member.displayName);
			});
		}
		if(member.roles.find(el => el.id === stats.admin)) {
			member.removeRole(stats.admin).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove admin role from " + member.displayName);
			});
			member.addRole(stats.admin_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add admin ingame role to " + member.displayName);
			});
		}
	}
	
	this.cmdPromote = function(channel, member) {
		if(isParticipant(member) && !member.roles.find(el => el.id === stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a participant."); 
			return;
		}
		channel.send("✅ Attempting to promote you, " + member.displayName + "!");
		if(member.roles.find(el => el.id === stats.gamemaster_ingame)) {
			member.removeRole(stats.gamemaster_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove game master ingame role from " + member.displayName);
			});
			member.addRole(stats.gamemaster).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add game master role to " + member.displayName);
			});
		}
		if(member.roles.find(el => el.id === stats.admin_ingame)) {
			member.removeRole(stats.admin_ingame).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not remove admin ingame role from " + member.displayName);
			});
			member.addRole(stats.admin).catch(err => { 
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
		} else if(stats.gamephase != 2) {
			channel.send("⛔ Command error. Can't make you a spectator while there is no game."); 
			return;
		}
		channel.send("✅ Attempting to make you a spectator, " + member.displayName + "!");
		member.addRole(stats.spectator).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not add spectator role to " + member.displayName);
		});
	}
	
	this.cmdEnd = function(channel) {
		cmdGamephaseSet(channel, ["set", "3"]);
		channel.guild.roles.find(el => el.id === stats.participant).members.forEach(el => {
			el.addRole(stats.dead_participant).catch(err => { 
				// Missing permissions
				logO(err); 
				sendError(channel, err, "Could not add role to" + el);
			});
		});
	}
	
	/* Handles reset command */
	this.cmdReset = function(channel) {
		if(!loadedModulePlayers) return;
		// Set Gamephase
		cmdGamephaseSet(channel, ["set", "0"]);
		// Reset Connection
		if(loadedModuleWhispers) cmdConnectionReset(channel);
		// Reset Player Database
		sql("DELETE FROM players", result => {
			channel.send("✅ Successfully reset player list!");
			getEmojis();
		},() => {
			channel.send("⛔ Database error. Could not reset player list!");
		});
		// Reset polls
		if(loadedModulePoll) {
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
		}
		removeNicknameOnce(channel, channel.guild.roles.find(el => el.id === stats.participant).members.array(), 0);
		// Remove Roles & Nicknames
		removeRoles(channel, [stats.signed_up, stats.participant, stats.dead_participant, stats.spectator, stats.mayor, stats.reporter, stats.guardian], ["signed up", "participant", "dead participant", "spectator", "mayor", "reporter", "guardian"])
		// Cleanup channels
		if(loadedModuleCCs) cmdCCCleanup(channel);
		if(loadedModuleRoles) cmdRolesScCleanup(channel);
		if(loadedModulePlayers) cmdKillqClear(channel);
		sqlGetStat(15, result => {
			cleanupCat(channel, result, "public");
		}, () => {
			channel.send("⛔ Database error. Could not get public category!");
		});
	}
	
	this.removeRoles = function(channel, ids, names) {
		removeRole(channel, ids[0], names[0], () => {
			if(ids.length > 1) removeRoles(channel, ids.splice(1), names.splice(1));
			else channel.send("✅ Finished removing roles!");
		});
	}
	
	this.removeRole = function(channel, id, name, callback) {
		// Remove spectator role
		removeRoleOnce(channel, id, name, channel.guild.roles.find(el => el.id === id).members.array(), 0, callback);
	}
	
	this.removeRoleOnce = function(channel, id, name, members, index, callback) {
		if(index >= members.length) {
			callback();
			channel.send("✅ Removed `" + name + "` role from `" + members.length + "` players!");
			return;
		}
		members[index].removeRole(id).then(m => {
			channel.send("✅ `" + members[index].displayName + "` is no longer a " + name + "!");
			removeRoleOnce(channel, id, name, members, ++index, callback);
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			removeRoleOnce(channel, id, name, members, index, callback);
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
		if(!loadedModulePlayers) return;
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `sheet [prepare|prepare_|import]`!"); 
			return; 
		}
		// Find Subcommand
		switch(args[0]) {
			// Prepare Sheet
			case "prepare": cmdSheetPrepare(message.channel, ","); break;
			case "prepare_": cmdSheetPrepare(message.channel, ";"); break;
			case "import": cmdSheetImport(message, message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	/* Prepare info for sheet */
	this.cmdSheetPrepare = function(channel, seperator) {
		// Check gamephase
		if(stats.gamephase > 1) { 
			channel.send("⛔ Command error. Can't prepare an already started game."); 
			return; 
		}
		// Get all players
		sql("SELECT id,emoji FROM players", result => {
			// Print all players
			let playerList = result.map(el => "=SPLIT(\"" + channel.guild.members.find(el2 => el2.id === el.id).user.username + "," + el.id + "\"" + seperator + "\",\")").join("\n");
			channel.send("**Copy this into a google sheet to have all names & ids**\n*Make sure to paste in with ctrl+shift+v\nColumns needed by `" + stats.prefix + "sheet import`: Name, Id, Nickname, Role*");
			channel.send("```\n" + playerList + "\n```");
		}, () => {
			// db error
			channel.send("⛔ Database error. Could not list signed up players!");
		});
	}
	
	/* Import info from sheet */
	this.cmdSheetImport = function(message, channel, args) {
		// Check gamephase
		if(stats.gamephase > 1) { 
			channel.send("⛔ Command error. Can't import into an already started game."); 
			return; 
		}
		// Split info
		message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").split("~").slice(1).map(el => el.split(/\s\s\s\s/g)).forEach(async el => { 
			// Prepare a user
			channel.send("▶ Preparing `" + el[0] + "`!").then(m => {
				// Set Nickname
				channel.guild.members.find(el2 => el2.id === el[1]).setNickname(el[2]).then(u => {
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
	
	this.cmdSheetImportRole = function(m, el) {
		el[3] = parseRole(el[3]);
		// Set Role
		if(verifyRole(el[3])) {
			sql("UPDATE players SET role = " + connection.escape(el[3]) + " WHERE id = " + connection.escape(el[1]), result => {
				m.edit(m.content + "\n	✅ Set role to `" + el[3] + "`!");
			}, () => {
				m.edit(m.content + "\n	⛔ Database error. Could not set role!");
			});
		} else {
			m.edit(m.content + "\n	⛔ Command error. Role `" + el[3] + "` does not exist!");
		}
	}
	
	this.cmdGamePing = function(channel, member) {
		channel.guild.roles.find(el => el.id === stats.new_game_ping).setMentionable(true).then(u => {
			channel.send("**" + member.displayName + "** is going to start a new game! <@&" + stats.new_game_ping + ">").then(m => {
				channel.guild.roles.find(el => el.id === stats.new_game_ping).setMentionable(false).catch(err => {
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
	
}
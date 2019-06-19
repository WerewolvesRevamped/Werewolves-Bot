/*
	Module for CCs 
		- Creates ccs
		- Checks if something is a cc
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
module.exports = function() {
	/* Variables */
	this.loadedModuleCCs = true;
	this.cachedCCs = [];
	
	/* Handles cc command */
	this.cmdCC = function(message, args, argsX) {
		if(!loadedModulePlayers) return;
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `cc [add|remove|create|create_hidden|promote|leave|list|owners]`"); 
			return; 
		} else if(stats.gamephase != 2 && args[0] != "cleanup") { 
			message.channel.send("⛔ Command error. Can only use CCs while a game is running."); 
			return; 
		}
		// Check Subcommand
		switch(args[0]) {
			case "create": cmdCCCreate(message.channel, message.member, args, 0, () => {}); break;
			case "create_hidden": cmdCCCreate(message.channel, message.member, args, 1, () => {}); break;
			case "create_multi": cmdCCCreateMulti(message.channel, message.member, argsX, 0); break;
			case "create_multi_hidden": cmdCCCreateMulti(message.channel, message.member, argsX, 1); break;
			case "add": cmdCCAdd(message.channel, message.member, args); break;
			case "remove": cmdCCRemove(message.channel, message.member, args); break;
			case "promote": cmdCCPromote(message.channel, message.member, args); break;
			case "leave": cmdCCLeave(message.channel, message.member); break;
			case "list": cmdCCList(message.channel, 2); break;
			case "owners": cmdCCList(message.channel, 3); break;
			case "cleanup": if(checkGM(message)) cmdConfirm(message, "cc cleanup"); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
	
	this.cmdCCCreateMulti = function(channel, member, args, type) {
		cmdCCCreateOneMulti(channel, member, args.join(" ").split("~").splice(1).map(el => ("create " + el).split(" ")), type, 0);
	}
	
	this.cmdCCCreateOneMulti = function(channel, member, ccs, type, index) {
		if(index >= ccs.length) {
			channel.send("✅ Successfully created " + ccs.length + " CCs!");
			return;
		}
		cmdCCCreate(channel, member, ccs[index], type, () => cmdCCCreateOneMulti(channel, member, ccs, type, ++index));
	}
	
	this.helpCCs = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				help += stats.prefix + "cc [create|create_hidden] - Creates a CC\n";
				help += stats.prefix + "cc [create_multi|create_multi_hidden] - Creates multiple CCs\n";
				help += stats.prefix + "cc [add|remove|promote|leave|list|owners] - Manages a CC\n";
				if(isGameMaster(member)) help += stats.prefix + "cc cleanup - Cleans up CCs\n";
			break;
			case "cc":
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc [create|create_hidden|create_multi|create_multi_hidden|add|remove|promote|leave|list|owners" + (isGameMaster(member) ? "|cleanup"  : "") + "]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle CCs. " + stats.prefix + "help cc <sub-command> for detailed help.\n```";
					break;
					case "create":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc create <CC Name> <Player List>\n```";
						help += "```\nFunctionality\n\nCreates a CC with the name <CC Name> and adds you, as well as all players in the <Player List> to it. <Player List> may contain 0 or more players. When the CC is created you are announced as the creator of the CC, and are the only owner.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc create marhjots marhjo\n< ✅ Created #marhjots!```";
					break;
					case "create_hidden":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc create_hidden <CC Name> <Player List>\n```";
						help += "```\nFunctionality\n\nCreates a CC with the name <CC Name> and adds you, as well as all players in the <Player List> to it. <Player List> may contain 0 or more players. When the CC is created you are not announced as the creator of the CC, and all original members of the CC are made owners.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc create_hidden marhjots marhjo\n< ✅ Created #marhjots!```";
					break;
					case "create_multi":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc create_multi\n<CC Name> <Player List>\n<CC Name> <Player List>\n<CC Name> <Player List>\n...```";
						help += "```\nFunctionality\n\nHandles each line as its own cc create command\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc create_multi\n  🤔 marhjo\n  👌 federick\n< ✅ Created #🤔!\n< ✅ Created #👌!\n< ✅ Successfully created 2 CCs!```";
					break;
					case "create_multi_hidden":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc create_multi_hidden\n<CC Name> <Player List>\n<CC Name> <Player List>\n<CC Name> <Player List>\n...```";
						help += "```\nFunctionality\n\nHandles each line as its own cc create_hidden command\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc create_multi_hidden\n  🤔 marhjo\n  👌 federick\n< ✅ Created #🤔!\n< ✅ Created #👌!\n< ✅ Successfully created 2 CCs!```";
					break;
					case "add":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc add <Player List>\n```";
						help += "```\nFunctionality\n\nAdds all players in the <Player List> to the current CC. Only works in CCs, in which you are an owner.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc add marhjo\n< ✅ Added @marhjo to the CC!```";
					break;
					case "remove":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc remove <Player List>\n```";
						help += "```\nFunctionality\n\nRemoves all players in the <Player List> from the current CC. Only works in CCs, in which you are an owner.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc remove marhjo\n< ✅ Removed @marhjo from the CC!```";
					break;
					case "promote":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc promote <Player List>\n```";
						help += "```\nFunctionality\n\nPromotes all players in the <Player List> in the current CC to owner. Only works in CCs, in which you are an owner.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc promote federick\n< ✅ Promoted @federick!```";
					break;
					case "leave":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc leave\n```";
						help += "```\nFunctionality\n\nRemoves you from the current CC.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc leave\n< ✅ @McTsts left the CC!```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc list\n```";
						help += "```\nFunctionality\n\nLists all members of the current CC.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc list\n< CC Members | Total: 2\n  @marhjo\n  @McTsts```";
					break;
					case "owners":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc owners\n```";
						help += "```\nFunctionality\n\nLists all owners of the current CC.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc owners\n< CC Owners | Total: 1\n  @McTsts```";
					break;
					case "cleanup":
						if(!isGameMaster(member)) break;
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc cleanup\n```";
						help += "```\nFunctionality\n\nRemoves all CCs, all CC Categories, and resets the CC Counter.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc cleanup\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "cc cleanup!\n< ✅ Successfully deleted a cc category!\n< ✅ Successfully deleted ccs!\n< ✅ Successfully reset cc counter!\n< ✅ Successfully reset cc cat list!```";
					break;
				}
		}
		return help;
	}
	
	/* Cleans up ccs */
	this.cmdCCCleanup = function(channel) {
		sql("SELECT id FROM cc_cats", result => {
			ccCleanupOneCategory(channel, result, 0);
		}, () => {
			// Db error
			log("⛔ Database error. Could not get cc cat list!");
		});
	}
	
	/* Deletes a cc category */
	this.ccCleanupOneCategory = function(channel, ccCats, index) {
		// End
		if(ccCats.length <= 0) return;
		if(index >= ccCats.length) {
			channel.send("✅ Successfully deleted ccs!");
			// Reset CC Count
			sqlSetStat(9, 0, result => {
				channel.send("✅ Successfully reset cc counter!");
			}, () => {
				channel.send("⛔ Database error. Could not reset cc counter!");
			});
			// Reset CC Cat Database
			sql("DELETE FROM cc_cats", result => {
				channel.send("✅ Successfully reset cc cat list!");
				getCCCats();
			}, () => {
				channel.send("⛔ Database error. Could not reset cc cat list!");
			});
			return;
		}
		// Category deleted
		if(!channel.guild.channels.find(el => el.id === ccCats[index].id)) { 
			ccCleanupOneCategory(channel, ccCats, ++index);
			return;
		}
		// Delete channels in category
		ccCleanupOneChannel(channel, ccCats, index, channel.guild.channels.find(el => el.id === ccCats[index].id).children.array(), 0);
	}
	
	/* Deletes a cc */
	this.ccCleanupOneChannel = function(channel, ccCats, index, channels, channelIndex) {
		if(channels.length <= 0) return;
		if(channelIndex >= channels.length) {
			// Delete category
			channel.guild.channels.find(el => el.id === ccCats[index].id).delete().then(c => {
				channel.send("✅ Successfully deleted a cc category!");
				ccCleanupOneCategory(channel, ccCats, ++index);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not delete CC Category");
			});
			return;
		}
		// Deleted channel
		if(!channels[channelIndex] || !channel.guild.channels.find(el => el.id === channels[channelIndex].id)) {
			ccCleanupOneChannel(channel, ccCats, index, channels, ++channelIndex);
			return;
		}
		// Delete channel
		channel.guild.channels.find(el => el.id === channels[channelIndex].id).delete().then(c => {
			ccCleanupOneChannel(channel, ccCats, index, channels, ++channelIndex);
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not delete CC");
		});
	}
	
	/* Cache CCs */
	this.getCCCats = function() {
		// Get CC Cats
		sql("SELECT id FROM cc_cats", result => {
			// Cache CC Cats
			cachedCCs = result.map(el => el.id);
		}, () => {
			// Db error
			log("CC > Database error. Could not cache cc cat list!");
		});
	}
	
	/* Adds somebody to a CC */
	this.cmdCCAdd = function(channel, member, args) {
		// Check if CC
		if(!isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		let ccOwner = channel.permissionOverwrites.array().filter(el => el.type === "member").filter(el => el.allow === 66560).map(el => el.id);
		if(ccOwner.includes(member.id)) {
			players = getUserList(channel, args, 1);
			let playerList = channel.permissionOverwrites.array().filter(el => el.type === "member" && el.allow > 0).map(el => el.id);
			if(players && players.length > 0) {
				players = players.filter(el => !playerList.includes(el));
				players.forEach(el => { 
					channel.overwritePermissions(el, {VIEW_CHANNEL: true}).then(c => {
						channel.send("✅ Added " + channel.guild.members.find(el2 => el2.id === el) + " to the CC!");
					}).catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not add to CC");
					});
				});
			} else {
				channel.send("⛔ Command error. No valid players, that are not part of this CC already, were provided!");
			}
		} else {
			channel.send("⛔ Command error. You are not an owner of this CC!");
		}
	}
	
	/* Removes somebody to a CC */
	this.cmdCCRemove = function(channel, member, args) {
		// Check if CC
		if(!isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		let ccOwner = channel.permissionOverwrites.array().filter(el => el.type === "member").filter(el => el.allow === 66560).map(el => el.id);
		if(ccOwner.includes(member.id)) {
			players = getUserList(channel, args, 1);
			let playerList = channel.permissionOverwrites.array().filter(el => el.type === "member" && el.allow > 0).map(el => el.id);
			players = players.filter(el => playerList.includes(el));
			if(players && players.length > 0) {
				players.forEach(el => { 
					channel.overwritePermissions(el, {VIEW_CHANNEL: false, READ_MESSAGE_HISTORY: null}).then(c => {
						channel.send("✅ Removed " + channel.guild.members.find(el2 => el2.id === el) + " from the CC!");
					}).catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not remove from CC");
					});
				});
			} else {
				channel.send("⛔ Command error. No valid players, that are part of this CC already, were provided!");
			}
		} else {
			channel.send("⛔ Command error. You are not an owner of this CC!");
		}
	}
	
	/* Promotes somebody to CC Owner */
	this.cmdCCPromote = function(channel, member, args) {
		// Check if CC
		if(!isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		// Get owner
		let ccOwner = channel.permissionOverwrites.array().filter(el => el.type === "member").filter(el => el.allow === 66560).map(el => el.id);
		if(ccOwner.includes(member.id)) {
			// Get members
			players = getUserList(channel, args, 1);
			let playerList = channel.permissionOverwrites.array().filter(el => el.type === "member" && el.allow > 0).map(el => el.id);
			players = players.filter(el => playerList.includes(el));
			if(players && players.length > 0) {
				players.forEach(el => { 
					// Promote members
					channel.overwritePermissions(el, {READ_MESSAGE_HISTORY: true}).then(c => {
						channel.send("✅ Promoted " + channel.guild.members.find(el2 => el2.id === el) + "!");
					}).catch(err => { 
						// Permission error
						logO(err); 
						sendError(channel, err, "Could not promote");
					});
				});
			} else {
				// No valid players
				channel.send("⛔ Command error. No valid players, that are part of this CC, were provided!");
			}
		} else {
			// Not owner
			channel.send("⛔ Command error. You are not an owner of this CC!");
		}
	}
	
	/* Removes yourself from a cc */
	this.cmdCCLeave = function(channel, member) {
		// Check if CC
		if(!isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		// Remove permissions
		channel.overwritePermissions(member.id, {VIEW_CHANNEL: false, READ_MESSAGE_HISTORY: false}).then(c => {
			channel.send("✅ " + member + " left the CC!");
		}).catch(err => { 
			// Permission error
			logO(err); 
			sendError(channel, err, "Could not leave the CC");
		});
	}
	
	/* List CC members */
	this.cmdCCList = function(channel, mode) {
		// Check if CC
		if(!isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		// Get lists
		let ccList = shuffleArray(channel.permissionOverwrites.array()).filter(el => el.type === "member").filter(el => el.allow > 0).map(el => channel.guild.members.find(el2 => el2.id === el.id)).join("\n");
		let ccOwner = shuffleArray(channel.permissionOverwrites.array()).filter(el => el.type === "member").filter(el => el.allow === 66560).map(el => channel.guild.members.find(el2 => el2.id === el.id)).join("\n");
		// Choose messages
		switch(mode) {
			case 0: channel.send(ccOwner + " has created a new CC!\n\n**CC Members** | Total: " +  ccList.split("\n").length + "\n" + ccList); break;
			case 1: channel.send("A new CC has been created!\n\n**CC Members** | Total: " +  ccList.split("\n").length + "\n" + ccList); break;
			case 2: channel.send("**CC Members** | Total: " +  ccList.split("\n").length + "\n" + ccList); break;
			case 3: channel.send("**CC Owners** | Total: " +  ccOwner.split("\n").length + "\n" + ccOwner); break;
		}
	}
		
	/* Creates CC */
	this.cmdCCCreate = function(channel, member, args, mode, callback) {
		// Get a list of users that need to be in the cc
		if(!(isCC(channel) || (loadedModuleRoles && isSC(channel)))) {
			channel.send("⛔ Command error. Can't use command outside a CC/SC!");
			return;
		}
		players = getUserList(channel, args, 2);
		if(isParticipant(member) || players.length > 0) {
			sqlGetStat(9, result => {
				// Check if a new category is needed
				if(result % 50 === 0) {
					// Create a new category
					let ccCatNum = Math.round(result / 50) + 1;
					let ccCatPerms = getCCCatPerms(channel.guild);
					channel.guild.createChannel(toTitleCase(stats.game) + " | CC " + ccCatNum, { type: "category",  permissionOverwrites: ccCatPerms })
					.then(cc => {
						sql("INSERT INTO cc_cats (id) VALUES (" + connection.escape(cc.id) + ")", result => {	
							getCCCats();
							log("CC > Created new CC category `" + cc.name + "`!");
							// Save the category id
							sqlSetStat(10, cc.id, result => {
								// Create a new channel
								let ccPerms = getCCCatPerms(channel.guild);
								ccPerms.push(getPerms(member.id, ["history", "read"], []));
								if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
								if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
								channel.guild.createChannel(args[1] + "", { type: "text",  permissionOverwrites: ccPerms })
								.then(ct => {
									// Put the channel into the correct category
									ct.setParent(cc.id)
									.then(updated => {
										log("CC > Created new CC `" + updated.name + "` in category `" + cc.name + "`!");
										// Increment cc count
										sql("UPDATE stats SET value = value + 1 WHERE id = 9", result => {
											channel.send("✅ Created " + updated + "!"); 
											cmdCCList(updated, mode);
											callback();
										}, () => {
											channel.send("⛔ Database error. Could not increment CC count!"); 
										});
									})
									// Couldn't set category
									.catch(err => { 
										logO(err); 
										sendError(channel, err, "Could not set category");
									});
								})
								// Channel couldn't get created
								.catch(err => { 
									logO(err); 
									sendError(channel, err, "Could not create channel");
								});
								// DB couldn't save category id
							}, () => {
								channel.send("⛔ Database error. Could not save new CC category!");
							});		
						}, () => {
							channel.send("⛔ Database error. Could not save CC category in database!"); 
						});
					})
					// Category couldn't get created
					.catch(err => { 
						logO(err); 
						sendError(channel, error, "Could not create category");
					});
				// Don't create new category
				} else {	
					sqlGetStat(10, result => {
						// Create a new channel
						let ccPerms = getCCCatPerms(channel.guild);
						ccPerms.push(getPerms(member.id, ["history", "read"], []));
						if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
						if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
						channel.guild.createChannel(args[1] + "", { type: "text",  permissionOverwrites: ccPerms })
						.then(ct => {
							let cc = channel.guild.channels.find(el => el.id === result);
							if(cc) {
								// Set category
								ct.setParent(cc.id)
								.then(updated => {
									log("CC > Created new CC `" + updated.name + "` in category `" + cc.name + "`!");
									// Increment cc count
									sql("UPDATE stats SET value = value + 1 WHERE id = 9", result => {
										channel.send("✅ Created " + updated + "!"); 
										cmdCCList(updated, mode);
										callback();
									}, () => {
										channel.send("⛔ Database error. Could not increment CC count!"); 
									});
								})
								// Couldn't set category
								.catch(err => { 
									sendError(channel, err, "Could not set category");
									logO(err); 
								}); 
							// Category doesn't exist
							} else {
								ct.delete();
								channel.send("⛔ Command error. Category does not exist!"); 
								sqlSetStat(9, 0, result => {
									channel.send("✅ Attempted to automatically fix. Please try again!");
								}, () => {
									channel.send("⛔ Could not automatically fix."); 
								});
							}
						})
						// Channel couldn't get created
						.catch(err => { 
							sendError(channel, err, "Could not create channel");
							logO(err);
						});
						// DB couldn't save category id
					}, () => {
						channel.send("⛔ Database error. Could not save new cc category!");
					});
				}
				// Couldn't get current cc amount from DB
			}, () => {
				channel.send("⛔ Database error. Could not find CC info!");
			}); 
		} else {
			channel.send("⛔ Command error. Can not create CCs with less than 1 player!");
			callback();
		}
	}

	/* Returns default CC permissions */
	this.getCCCatPerms = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]) ];
	}
	
	/* Checks if something is a cc*/
	this.isCC = function(channel) {
		return !channel.parent ? true : cachedCCs.includes(channel.parentID);
	}
}

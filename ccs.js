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
	this.cachedCCs = [];
	
	/* Handles cc command */
	this.cmdCC = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send(helpCCs(message.member, ["cc"]));
			return; 
		} else if(stats.gamephase != gp.INGAME && args[0] != "cleanup") { 
			message.channel.send("⛔⛔⛔"); 
			return; 
		}
		// Check Subcommand
		switch(args[0]) {
			case "✨": cmdCCCreate(message.channel, message.member, args, 0, () => {}); break;
			case "➕": cmdCCAdd(message.channel, message.member, args, 0); break;
			case "➖": cmdCCRemove(message.channel, message.member, args, 0); break;
			case "🔼": cmdCCPromote(message.channel, message.member, args, 0); break;
			case "🔽": cmdCCDemote(message.channel, message.member, args, 0); break;
			case "🚪": cmdCCLeave(message.channel, message.member); break;
			case "cleanup": if(checkGM(message)) cmdConfirm(message, "cc cleanup"); break;
			default: message.channel.send("⛔ ⛔❓❓"); break;
		}
	}
	
	this.cmdSC = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send(helpCCs(message.member, ["sc"]));
			return; 
		} else if(stats.gamephase != gp.INGAME && args[0] != "rename") { 
			message.channel.send("⛔ Command error. Can only use SCs while a game is running."); 
			return; 
		}
		// Check Subcommand
		switch(args[0]) {
			case "add": cmdSCAdd(message.channel, message.member, args, 1); break;
			case "remove": cmdSCRemove(message.channel, message.member, args, 1); break;
			case "rename": cmdCCRename(message.channel, message.member, args, 1, true); break;
			case "list": cmdCCList(message.channel, 2, 1); break;
			case "clear": cmdSCClear(message.channel); break;
			case "clean": cmdSCClean(message.channel); break;
			case "change": cmdSCChange(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
		
	}
	
    this.cmdSCAdd = function(channel, member, args) {
        cmdCCAdd(channel, member, args, 1);
        players = parseUserList(channel, args, 1, member);
        players.forEach(p => channel.send(`**<@${p}> has been added to <#${channel.id}>.**`));
    }
    
    this.cmdSCRemove = function(channel, member, args) {
        cmdCCRemove(channel, member, args, 1);
        players = parseUserList(channel, args, 1, member);
        players.forEach(p => channel.send(`**<@${p}> has been removed from <#${channel.id}>.**`));
    }
    
	this.cmdCCCreateMulti = function(channel, member, args, type) {
		cmdCCCreateOneMulti(channel, member, args.join(" ").split("~").splice(1).map(el => ("create " + el).split(" ")).splice(0, emojiIDs.length + 1), type, 0);
	}
	
	this.cmdCCCreateOneMulti = function(channel, member, ccs, type, index) {
		if(index >= ccs.length) {
			channel.send("✅");
			return;
		}
		cmdCCCreate(channel, member, ccs[index], type, () => cmdCCCreateOneMulti(channel, member, ccs, type, ++index));
	}
	
	this.helpCCs = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				help += stats.prefix + "💌 ✨ ▶️ 💌✨\n";
				help += stats.prefix + "💌 [➕|➖|🔼|🔽] ▶️ 🔃 🧑‍🤝‍🧑 💌\n";
				help += stats.prefix + "💌 🚪 ▶️ 💌 🚪\n";
				if(isGameMaster(member)) help += stats.prefix + "cc cleanup - Cleans up CCs\n";
				if(isGameMaster(member)) help += stats.prefix + "sc [add|remove|list|rename|clear|clean|change] - Manages a SC\n";
			break;
			case "sc":
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc [add|remove|rename|list|clear|clean|change]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle SCs. " + stats.prefix + "help sc <sub-command> for detailed help. Primarily provides the same functionality as the cc command.\n```";
					break;
					case "add":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc add <Player List>\n```";
						help += "```\nFunctionality\n\nAdds all players in the <Player List> to the current SC.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sc add marhjo\n< ✅ Added @marhjo to the CC!```";
					break;
					case "remove":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc remove <Player List>\n```";
						help += "```\nFunctionality\n\nRemoves all players in the <Player List> from the current SC.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sc remove marhjo\n< ✅ Removed @marhjo from the CC!```";
					break;
					case "rename":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc rename <name>\n```";
						help += "```\nFunctionality\n\nRenames the current sc into <name>.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sc rename newName\n< ✅ Renamed channel to newName!```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc list\n```";
						help += "```\nFunctionality\n\nLists all members of the current SC.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sc list\n< CC Members | Total: 2\n  @marhjo\n  @McTsts```";
					break;
					case "clear":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc clear\n```";
						help += "```\nFunctionality\n\nRemoves all members of the current SC.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sc clear```";
					break;
					case "clean":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc clean\n```";
						help += "```\nFunctionality\n\nRemoves all members of the current SC and bulkdeletes messages. Same as running sc clear and bulkdelete.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sc clean```";
					break;
					case "change":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sc change <roleName>\n```";
						help += "```\nFunctionality\n\nRenames the cc to a new name and infopins that name.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sc change citizen```";
					break;
				}
			break;
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
		if(!channel.guild.channels.cache.get(ccCats[index].id)) { 
			ccCleanupOneCategory(channel, ccCats, ++index);
			return;
		}
		// Delete channels in category
		ccCleanupOneChannel(channel, ccCats, index, channel.guild.channels.cache.get(ccCats[index].id).children.cache.toJSON(), 0);
	}
	
	/* Deletes a cc */
	this.ccCleanupOneChannel = function(channel, ccCats, index, channels, channelIndex) {
		if(channels.length <= 0) return;
		if(channelIndex >= channels.length) {
			// Delete category
			channel.guild.channels.cache.get(ccCats[index].id).delete().then(c => {
				channel.send("✅ Successfully deleted a cc category!");
				ccCleanupOneCategory(channel, ccCats, ++index);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not delete CC Category");
			});
			return;
		}
		// Deleted channel
		if(!channels[channelIndex] || !channel.guild.channels.cache.get(channels[channelIndex].id)) {
			ccCleanupOneChannel(channel, ccCats, index, channels, ++channelIndex);
			return;
		}
		// Delete channel
		channel.guild.channels.cache.get(channels[channelIndex].id).delete().then(c => {
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
	this.cmdCCAdd = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔");
			return;
		}
		let ccOwner = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
		if(mode || isGameMaster(member, true) || ccOwner.includes(member.id)) {
			players = parseUserList(channel, args, 1, member);
			let playerList = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member && el.allow > 0).map(el => el.id);
			if(players && players.length > 0) {
				players = players.filter(el => !playerList.includes(el));
				players.forEach(el => { 
					channel.permissionOverwrites.create(el, { ViewChannel: true}).then(c => {
						if(!mode) channel.send(`✅ ➕ ${idToEmoji(channel.guild.members.cache.get(el).id)}`);
					}).catch(err => { 
						logO(err); 
						sendError(channel, err, "⛔");
					});
				});
			} else {
				channel.send("⛔");
			}
		} else {
			channel.send("⛔");
		}
	}
	
	/* Removes somebody to a CC */
	this.cmdCCRemove = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔");
			return;
		}
		let ccOwner = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
		if(mode || isGameMaster(member, true) || ccOwner.includes(member.id)) {
			players = parseUserList(channel, args, 1, member);
			let playerList = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member && el.allow > 0).map(el => el.id);
			if(players) players = players.filter(el => playerList.includes(el));
			if(players && players.length > 0) {
				players.forEach(el => { 
					channel.permissionOverwrites.cache.get(el).delete().then(() => {
						if(!mode) channel.send(`✅ ➖ ${idToEmoji(channel.guild.members.cache.get(el).id)}`);
					}).catch(err => { 
						logO(err); 
						sendError(channel, err, "⛔");
					});
				});
			} else {
				channel.send("⛔");
			}
		} else {
			channel.send("⛔");
		}
	}
	
	/* Removes somebody to a CC */
	this.cmdCCRename = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		args[1] = args[1].replace(/🔒/,"lock");
		let ccOwner = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
		if(mode || isGameMaster(member, true) || ccOwner.includes(member.id)) {
			channel.edit({ name: args[1] })
				.then(c => {
					c.send("✅ Renamed channel to `" + c.name + "`!");
				})
				.catch(err => {
					// Permission error
					logO(err); 
					sendError(channel, err, "Could not rename channel");
				});
		} else {
			channel.send("⛔ Command error. You are not an owner of this CC!");
		}
	}
	
	
	/* Removes somebody to a CC */
	this.cmdCCArchive = function(channel, member, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		let ccOwner = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
		if(mode || isGameMaster(member, true) || ccOwner.includes(member.id)) {
			channel.edit({ name: "🔒-" + channel.name })
				.then(c => {
					let ccList = c.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).map(el => el.id);
					ccList.forEach(el => {
						c.permissionOverwrites.create(el, {ViewChannel: true, ReadMessageHistory: null, SendMessages: false})
					});
					c.send("✅ Archived channel!");
				})
				.catch(err => {
					// Permission error
					logO(err); 
					sendError(channel, err, "Could not archive channel");
				});
		} else {
			channel.send("⛔ Command error. You are not an owner of this CC!");
		}
	}
	
	/* Promotes somebody to CC Owner */
	this.cmdCCPromote = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔");
			return;
		}
		// Get owner
		let ccOwner = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
		if(mode || isGameMaster(member, true) || ccOwner.includes(member.id)) {
			// Get members
			players = parseUserList(channel, args, 1, member);
			let playerList = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member && el.allow > 0).map(el => el.id);
			if(players) players = players.filter(el => playerList.includes(el));
			if(players && players.length > 0) {
				players.forEach(el => { 
					// Promote members
					channel.permissionOverwrites.create(el, {ViewChannel: true, ReadMessageHistory: true}).then(c => {
						if(!mode) channel.send(`✅ 🔼 ${idToEmoji(channel.guild.members.cache.get(el).id)}`);
					}).catch(err => { 
						// Permission error
						logO(err); 
						sendError(channel, err, "⛔");
					});
				});
			} else {
				// No valid players
				channel.send("⛔");
			}
		} else {
			// Not owner
			channel.send("⛔");
		}
	}
    
	/* Demote somebody to CC non-Owner */
	this.cmdCCDemote = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔");
			return;
		}
		// Get owner
		let ccOwner = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
		if(mode || isGameMaster(member, true) || ccOwner.includes(member.id)) {
			// Get members
			players = parseUserList(channel, args, 1, member);
			let playerList = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member && el.allow > 0).map(el => el.id);
			if(players) players = players.filter(el => playerList.includes(el));
			if(players && players.length > 0) {
				players.forEach(el => { 
					// Promote members
					channel.permissionOverwrites.create(el, {ViewChannel: true}).then(c => {
						if(!mode) channel.send(`✅ 🔽 ${idToEmoji(channel.guild.members.cache.get(el).id)}`);
					}).catch(err => { 
						// Permission error
						logO(err); 
						sendError(channel, err, "⛔");
					});
				});
			} else {
				// No valid players
				channel.send("⛔");
			}
		} else {
			// Not owner
			channel.send("⛔");
		}
	}
	
	/* Removes yourself from a cc */
	this.cmdCCLeave = function(channel, member) {
		// Check if CC
		if(!isCC(channel)) {
			channel.send("⛔");
			return;
		}
		// Remove permissions
		channel.permissionOverwrites.cache.get(member.id).delete().then(() => {
			channel.send(`✅ ${idToEmoji(member.id)} 🚪`);
		}).catch(err => { 
			// Permission error
			logO(err); 
			sendError(channel, err, "⛔");
		});
	}
	
	/* List CC members */
	this.cmdCCList = function(channel, mode, mode2 = 0) {
		// Check if CC
		if(!mode2 && !isCC(channel)) {
			channel.send("⛔");
			return;
		}
		// Get lists
		let ccList = shuffleArray(channel.permissionOverwrites.cache.toJSON()).filter(el => el.type === OverwriteType.Member).filter(el => el.allow > 0).map(el => idToEmoji(el.id)).join("\n");
		let ccOwner = shuffleArray(channel.permissionOverwrites.cache.toJSON()).filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el =>  idToEmoji(el.id)).join(" ");
		// Choose messages		
		switch(mode) {
			default: channel.send(ccOwner + " ✨💌\n\n" + ccList); break;
		}
		
	}
	
	this.cmdSCClear = function(channel) {
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
		let members = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow > 0).map(el => el.id);
		members.forEach(el => {
			channel.permissionOverwrites.cache.get(el).delete();	
		});
	}
	
	this.cmdSCClean = function(channel) {
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
		cmdSCClear(channel);
		cmdBulkDelete(channel);
	}
	
	this.cmdSCChange = function(channel, args) {
		let role = verifyRole(args[1]);
		if(!args[1] || !role ) {
			channel.send("⛔ Command error. You must provide a valid role!");
			return;
		}
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
		cmdCCRename(channel, false, args, 1);
		cmdInfoEither(channel, [args[1]], true, true);
        channel.send(`**<@&${stats.participant}> Your role has changed to \`${toTitleCase(args[1])}\`.**`);
	}
		
	/* Creates CC */
	this.cmdCCCreate = function(channel, member, args, mode, callback) {
		// Get a list of users that need to be in the cc
		if(!(isCC(channel) || isSC(channel) || isGameMaster(member, true) || isHelper(member))) {
			channel.send("⛔");
			return;
		} else if(!args[1]) {
			channel.send(helpCCs(member, ["cc", "create"]));
			return;
		} else if(!isGameMaster(member, true) && !isHelper(member) && stats.cc_limit >= -10 && ccs.find(el => el.id == member.id).ccs >= stats.cc_limit) {
			channel.send("⛔ " + ntca(stats.cc_limit) + " 💌");
			return;
		}
		args[1] = args[1].replace(/🔒/,"lock");
		players = parseUserList(channel, args, 2, member);
        if(!players) players = [];
		if(!isGameMaster(member, true) && !isHelper(member)) {
			sql("UPDATE players SET ccs = ccs + 1 WHERE id = " + connection.escape(member.id), result => {
				getCCs();
			}, () => {
				channel.send("⛔");
			});
		}
        players = players.filter(el => el != member.id);
		if(isParticipant(member) || players.length > 0) {
			sqlGetStat(9, result => {
				// Check if a new category is needed
				if(result % 50 === 0) {
					// Create a new category
					let ccCatNum = Math.round(result / 50) + 1;
					let ccCatPerms = getCCCatPerms(channel.guild);
					channel.guild.channels.create({ name: toTitleCase(stats.game) + " | CC " + ccCatNum, type: ChannelType.GuildCategory,  permissionOverwrites: ccCatPerms })
					.then(cc => {
						sql("INSERT INTO cc_cats (id) VALUES (" + connection.escape(cc.id) + ")", result => {	
							getCCCats();
						log(`CC > Created new CC category \`${cc.name}\`!`);
							// Save the category id
							sqlSetStat(10, cc.id, result => {
								// Create a new channel
								let ccPerms = getCCCatPerms(channel.guild);
								ccPerms.push(getPerms(member.id, ["history", "read"], []));
								if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
								if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
								channel.guild.channels.create({ name: args[1] + "", type: ChannelType.GuildText,  permissionOverwrites: ccPerms })
								.then(ct => {
									// Put the channel into the correct category
									ct.setParent(cc.id,{ lockPermissions: false })
									.then(updated => {
										//log("CC > Created new CC `" + updated.name + "` in category `" + cc.name + "`!");
										// Increment cc count
										sql("UPDATE stats SET value = value + 1 WHERE id = 9", result => {
											channel.send(`✅ ${updated}!`); 
											cmdCCList(updated, mode);
											getCCs();
											callback();
										}, () => {
											channel.send("⛔"); 
										});
									})
									// Couldn't set category
									.catch(err => { 
										logO(err); 
										sendError(channel, err, "⛔");
									});
								})
								// Channel couldn't get created
								.catch(err => { 
									logO(err); 
									sendError(channel, err, "⛔");
								});
								// DB couldn't save category id
							}, () => {
								channel.send("⛔");
							});		
						}, () => {
							channel.send("⛔"); 
						});
					})
					// Category couldn't get created
					.catch(err => { 
						logO(err); 
						sendError(channel, error, "⛔");
					});
				// Don't create new category
				} else {	
					sqlGetStat(10, result => {
						// Create a new channel
						let ccPerms = getCCCatPerms(channel.guild);
						ccPerms.push(getPerms(member.id, ["history", "read"], []));
						if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
						if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
						channel.guild.channels.create({ name: args[1] + "", type: ChannelType.GuildText,  permissionOverwrites: ccPerms })
						.then(ct => {
							let cc = channel.guild.channels.cache.get(result);
							if(cc) {
								// Set category
								ct.setParent(cc.id,{ lockPermissions: false })
								.then(updated => {
									//log("CC > Created new CC `" + updated.name + "` in category `" + cc.name + "`!");
									// Increment cc count
									sql("UPDATE stats SET value = value + 1 WHERE id = 9", result => {
										channel.send(`✅ ${updated}!`); 
										getCCs();
										cmdCCList(updated, mode);
										callback();
									}, () => {
										channel.send("⛔"); 
									});
								})
								// Couldn't set category
								.catch(err => { 
									sendError(channel, err, "⛔");
									logO(err); 
								}); 
							// Category doesn't exist
							} else {
								ct.delete();
								channel.send("⛔"); 
								sqlSetStat(9, 0, result => {
									channel.send("✅");
								}, () => {
									channel.send("⛔"); 
								});
							}
						})
						// Channel couldn't get created
						.catch(err => { 
							sendError(channel, err, "⛔");
							logO(err);
						});
						// DB couldn't save category id
					}, () => {
						channel.send("⛔");
					});
				}
				// Couldn't get current cc amount from DB
			}, () => {
				channel.send("⛔");
			}); 
		} else {
			channel.send("⛔");
			callback();
		}
	}

	/* Returns default CC permissions */
	this.getCCCatPerms = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]), getPerms(stats.sub, ["write"], ["read"]) ];
	}
	
	/* Checks if something is a cc*/
	this.isCC = function(channel) {
		return !channel.parent ? true : cachedCCs.includes(channel.parentId);
	}
}

/*
	Module for CCs 
		- Creates ccs
		- Checks if something is a cc
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
module.exports = function() {
	
	/* Handles cc command */
	this.cmdCC = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send(helpCCs(message.member, ["cc"]));
			return; 
		} else if(stats.gamephase != gp.INGAME && args[0] != "cleanup") { 
			message.channel.send("⛔ Command error. Can only use CCs while a game is running."); 
			return; 
		}

        if(args[0] === "spam" && message.author.id === "151204089219252224") {
			message.channel.send("⛔ Permission error. You cannot create spam ccs."); 
            return;
        }
        
        if(args[0] === "create" && message.author.id === "544125116640919557") {
			message.channel.send("⛔ Permission error. You cannot create ccs."); 
            return;
        }
        
		// Check Subcommand
		switch(args[0]) {
			case "create": cmdCCCreate(message.channel, message.member, args, 0, () => {}); break;
			case "spam": cmdCCCreate(message.channel, message.member, args, 0, () => {}, true); break;
			case "create_hidden": cmdCCCreate(message.channel, message.member, args, 1, () => {}); break;
			case "add": cmdCCAdd(message.channel, message.member, args, 0); break;
			case "remove": cmdCCRemove(message.channel, message.member, args, 0); break;
			case "rename": cmdCCRename(message.channel, message.member, args, 0); break;
			case "archive": cmdCCArchive(message.channel, message.member, 0); break;
			case "promote": cmdCCPromote(message.channel, message.member, args, 0); break;
			case "demote": cmdCCDemote(message.channel, message.member, args, 0); break;
			case "leave": cmdCCLeave(message.channel, message.member); break;
			case "list": cmdCCList(message.channel, 2); break;
			case "owners": cmdCCList(message.channel, 3); break;
			case "cleanup": if(checkGM(message)) cmdConfirm(message, "cc cleanup"); break;
			case "create_multi": cmdCCCreateMulti(message.channel, message.member, argsX, 0); break;
			case "create_multi_hidden": cmdCCCreateMulti(message.channel, message.member, argsX, 1); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
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
	
    
	this.cmdCCCreateMulti = function(channel, member, args, type) {
		cmdCCCreateOneMulti(channel, member, args.join(" ").split("~").splice(1).map(el => ("create " + el).split(" ")).splice(0, emojiIDs.length + 1), type, 0);
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
				help += stats.prefix + "cc spam - Creates a CC for role info spam and similiar\n";
				help += stats.prefix + "cc [create_multi|create_multi_hidden] - Creates multiple CCs\n";
				help += stats.prefix + "cc [add|remove|promote|demote|leave] - Manages CC members\n";
				help += stats.prefix + "cc leave - Leave a CC\n";
				help += stats.prefix + "cc [list|owners] - Shows CC Info\n";
				help += stats.prefix + "cc [rename|archive] - Manages a CC name\n";
				if(isGameMaster(member)) help += stats.prefix + "cc cleanup - Cleans up CCs\n";
				if(isGameMaster(member)) help += stats.prefix + "sc [add|remove|list|rename|clear|clean|change] - Manages a SC\n";
			break;
			case "cc":
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc [create|create_hidden|create_multi|create_multi_hidden|add|remove|promote|rename|archive|leave|list|owners|spam" + (isGameMaster(member) ? "|cleanup"  : "") + "]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle CCs. " + stats.prefix + "help cc <sub-command> for detailed help.\n```";
						help += "```diff\nAliases\n\n- c\n```";
					break;
					case "create":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc create <CC Name> <Player List>\n```";
						help += "```\nFunctionality\n\nCreates a CC with the name <CC Name> and adds you, as well as all players in the <Player List> to it. <Player List> may contain 0 or more players. When the CC is created you are announced as the creator of the CC, and are the only owner.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc create marhjots marhjo\n< ✅ Created #marhjots!```";
					break;
					case "spam":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc spam <CC Name>\n```";
						help += "```\nFunctionality\n\nCreates a CC with the name <CC Name> and adds you to it. The cc will not have any owners (you cannot add members to it). This cc will not count towards the cc limit.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc spam spamcc\n< ✅ Created #spamcc!```";
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
					case "demote":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc demote <Player List>\n```";
						help += "```\nFunctionality\n\nDemotes all players in the <Player List> in the current CC to non-owner. Only works in CCs, in which you are an owner.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc demote federick\n< ✅ Demoted @federick!```";
					break;
					case "rename":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc rename <name>\n```";
						help += "```\nFunctionality\n\nRenames the current cc into <name>.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc rename newName\n< ✅ Renamed channel to newName!```";
					break;
					case "archive":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "cc archive\n```";
						help += "```\nFunctionality\n\nRenames a CC to 🔒-<oldName> and locks it.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "cc archive\n< ✅ Renamed channel to 🔒-oldName!```";
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
		
	/* Creates CC */
	this.cmdCCCreate = function(channel, member, args, mode, callback, spam = false) {
		// Get a list of users that need to be in the cc
		if(!(isCC(channel) || isSC(channel) || isGameMaster(member, true) || isHelper(member))) {
			channel.send("⛔ Command error. Can't use command outside a CC/SC!");
			return;
		} else if(!args[1] && spam == false) {
			channel.send(helpCCs(member, ["cc", "create"]));
			return;
		} else if(!spam && !isGameMaster(member, true) && !isHelper(member) && stats.cc_limit >= -10 && ccs.find(el => el.id == member.id).ccs >= stats.cc_limit) {
			channel.send("⛔ You have hit the CC limit of `" + stats.cc_limit + "` CCs!");
			return;
		}
		args[1] = args[1].replace(/🔒/,"lock");
		args[1] = args[1].replace(/🤖/,"bot");
		args[1] = args[1].replace(/👻/,"ghost");
		players = parseUserList(channel, args, 2, member, isGhost(member) ? "ghost" : "participant");
        console.log(players);
        if(!players || spam) players = [];
		if(!spam && !isGameMaster(member, true) && !isHelper(member)) {
			sql("UPDATE players SET ccs = ccs + 1 WHERE id = " + connection.escape(member.id), result => {
				getCCs();
			}, () => {
				channel.send("⛔ Database error. Could not increase the CC amount!");
			});
		}
        players = players.filter(el => el != member.id);
		if(isParticipant(member) || isGhost(member) || ((isGameMaster(member, true) || isHelper(member)) && players.length > 0)) {
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
                                if(isGhost(member)) ccPerms = getCCCatPermsGhostly(channel.guild);
								if(!spam) ccPerms.push(getPerms(member.id, ["history", "read"], []));
								else ccPerms.push(getPerms(member.id, ["read"], []));
								if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
								if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
								channel.guild.channels.create({ name: (spam?"🤖-":"") + (isGhost(member)?"👻-":"") + args[1] + "", type: ChannelType.GuildText,  permissionOverwrites: ccPerms, parent: cc.id })
								.then(ct => {
									// Put the channel into the correct category
									ct.setParent(cc.id,{ lockPermissions: false })
									.then(updated => {
										//log("CC > Created new CC `" + updated.name + "` in category `" + cc.name + "`!");
										// Increment cc count
										sql("UPDATE stats SET value = value + 1 WHERE id = 9", result => {
											channel.send(`✅ Created ${updated}!`); 
											cmdCCList(updated, spam ? 4 : mode);
											getCCs();
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
                        if(isGhost(member)) ccPerms = getCCCatPermsGhostly(channel.guild);
                        if(!spam) ccPerms.push(getPerms(member.id, ["history", "read"], []));
                        else ccPerms.push(getPerms(member.id, ["read"], []));
						if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
						if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
                        let cc = channel.guild.channels.cache.get(result);
                        let cobj = { name: (spam?"🤖-":"") + args[1] + "", type: ChannelType.GuildText,  permissionOverwrites: ccPerms, parent: cc.id };
                        if(result % 50 === 49) delete cobj.parent;
                        channel.guild.channels.create(cobj)
						.then(ct => {
							let cc = channel.guild.channels.cache.get(result);
							if(cc) {
								// Set category
								ct.setParent(cc.id,{ lockPermissions: false })
								.then(updated => {
									//log("CC > Created new CC `" + updated.name + "` in category `" + cc.name + "`!");
									// Increment cc count
									sql("UPDATE stats SET value = value + 1 WHERE id = 9", result => {
										channel.send(`✅ Created ${updated}!`); 
										getCCs();
										cmdCCList(updated, spam ? 4 : mode);
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
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]), getPerms(stats.sub, ["write"], ["read"]) ];
	}
    
	/* Returns default CC permissions */
	this.getCCCatPermsGhostly = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.ghost, ["write"], ["read"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]), getPerms(stats.sub, ["write"], ["read"]) ];
	}
	
}

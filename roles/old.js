/*
	Module for roles / role info
		- Set role name & aliases
		- Get role info
		- Create / Manage SCs
		- Distribute roles
*/
module.exports = function() {
	/* Variables */
	this.cachedAliases = [];
	this.cachedRoles = [];
	this.cachedSCs = [];
	this.scCatCount = 0;

	
	this.cmdChannels = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Extra/Multi SC Subcommands
			case "set_extra": cmdRolesAddSc(message.channel, "extra", args, argsX); break;
			case "set_multi": cmdRolesAddSc(message.channel, "multi", args, argsX); break;
			case "set_public": cmdRolesAddSc(message.channel, "public", args, argsX); break;
			case "get": cmdRolesGetSc(message.channel, args); break;
			case "raw": cmdRolesRawSc(message.channel, args); break;
			case "remove": cmdRolesRemoveSc(message.channel, args); break;
			case "list": cmdRolesListSc(message.channel); break;
			case "elected": cmdRolesElectedSc(message.channel, args); break;
			// SC Info Subcommands
			case "info": cmdRolesScInfo(message.channel, args, false); break;
			case "infopin": cmdRolesScInfo(message.channel, args, true); break;
			case "info_set": cmdRolesScInfoSet(message.channel, args, argsX); break;
			case "info_get": cmdRolesScInfoGet(message.channel, args); break;
			case "info_remove": cmdRolesScInfoRemove(message.channel, args); break;
			case "info_list": cmdRolesScInfoList(message.channel); break;
			// SC Cleanup Subcommands
			case "cleanup": cmdConfirm(message, "roles sc_cleanup"); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
   this.cmdElect = function(channel, args) {
       // Check arguments
		if(!args[0] || !args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
        let electPlayer = getUser(channel, args[1]);
        if(!electPlayer) {
            channel.send("⛔ Syntax error. Invalid player `" + args[1] + "`!"); 
			return; 
        }
        let electMember = channel.guild.members.cache.find(member => member.id == electPlayer);
        switch(args[0].toLowerCase()) {
            default:
                channel.send("⛔ Syntax error. Invalid elected role `" + args[0] + "`!"); 
            break;
            case "mayor": case "m":
                sql("SELECT id,emoji FROM players WHERE alive = 1 AND type='player'", result => {        
                    let mayor;
                    if(result.length > stats.mayor_threshold) {
                        mayor = stats.mayor2;  
                    } else {
                      mayor = stats.mayor;  
                    }
                    addRoleRecursive(electMember, channel, mayor, "mayor");
                    channel.send(`✅ Elected ${electMember} as ${channel.guild.roles.cache.get(mayor)}`);
                    cmdConnectionSend(channel, ["", "mayor", "Host", `**${electMember} has been elected as ${channel.guild.roles.cache.get(mayor)}!**`]);
                });
            break;
            case "reporter": case "r":
                let reporter = stats.reporter;
                addRoleRecursive(electMember, channel, reporter, "reporter");
                channel.send(`✅ Elected ${electMember} as ${channel.guild.roles.cache.get(reporter)}`);
                cmdConnectionSend(channel, ["", "reporter", "Host", `**${electMember} has been elected as ${channel.guild.roles.cache.get(reporter)}!**`]);
            break;
            case "guardian": case "g":
                let guardian = stats.guardian;
                addRoleRecursive(electMember, channel, guardian, "guardian");
                channel.send(`✅ Elected ${electMember} as ${channel.guild.roles.cache.get(guardian)}`);
                cmdConnectionSend(channel, ["", "guardian", "Host", `**${electMember} has been elected as ${channel.guild.roles.cache.get(guardian)}!**`]);
            break;
            case "clear": case "c": case "delete": case "remove":
                let electedRoles = [stats.mayor, stats.mayor2, stats.reporter, stats.guardian];
                let electedRolesWhispers = ["mayor", "mayor", "reporter", "guardian"];
                electedRoles.forEach(el => {
                    if(electMember.roles.cache.get(el)) {
                        cmdConnectionSend(channel, ["", electedRolesWhispers[electedRoles.indexOf(el)], "Host", `**${electMember} has resigned as ${channel.guild.roles.cache.get(el)}!**`]);
                    }
                    removeRoleRecursive(electMember, channel, el, "elected role");
                });
                channel.send(`✅ Cleared elected roles from ${electMember}`);
            break;
        }
   }
   
   this.mayorCheck = function(channel) {
       sql("SELECT id,emoji FROM players WHERE alive = 1 AND type='player'", result => {        
            let mayor1 = stats.mayor;  
            let mayor2 = stats.mayor2;  
            let wrongMayorMembers;
            if(result.length > stats.mayor_threshold) {
                wrongMayorMembers = channel.guild.roles.cache.get(mayor1).members.toJSON();
                wrongMayorMembers.forEach(el => {
                    switchRoles(el, channel, mayor1, mayor2, "mayor 1", "mayor 2");
                    channel.send(`✅ Switched ${el} to ${channel.guild.roles.cache.get(mayor2)}`);
                    cmdConnectionSend(channel, ["", "mayor", "Host", `**${el} has changed from ${channel.guild.roles.cache.get(mayor1)} to ${channel.guild.roles.cache.get(mayor2)}!**`]);
                });
            } else {
                wrongMayorMembers = channel.guild.roles.cache.get(mayor2).members.toJSON();
                wrongMayorMembers.forEach(el => {
                    switchRoles(el, channel, mayor2, mayor1, "mayor 2", "mayor 1");
                    channel.send(`✅ Switched ${el} to ${mayor1}`);
                    cmdConnectionSend(channel, ["", "mayor", "Host", `**${el} has changed from ${channel.guild.roles.cache.get(mayor2)} to ${channel.guild.roles.cache.get(mayor1)}!**`]);
                });
            }
        });
   }
	
	this.getSCCats = function() {
		// Get SC Cats
		sql("SELECT id FROM sc_cats", result => {
			// Cache SC Cats
			cachedSCs = result.map(el => el.id);
		}, () => {
			// Db error
			log("CC > Database error. Could not cache sc cat list!");
		});
	}
	
	/* Sets permissions for an elected role */
	this.cmdRolesElectedSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		// Find name
		switch(args[1]) {
			case "mayor": 
				channel.permissionOverwrites.create(stats.mayor, { ViewChannel: true, SendMessages: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
				channel.permissionOverwrites.create(stats.mayor2, { ViewChannel: true, SendMessages: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			case "reporter": 
				channel.permissionOverwrites.create(stats.reporter, { ViewChannel: true, SendMessages: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			case "guardian": 
				channel.permissionOverwrites.create(stats.guardian, { ViewChannel: true, SendMessages: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			default:
				channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid elected role!"); 
			break;
		}
	}
	
	/* Prints SC Info */
	this.cmdRolesScInfo = function(channel, args, pin) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		sql("SELECT info FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			if(result.length > 0) { 
				var desc = result[0].info.replace(/~/g,"\n");
                let titleRaw = desc.split(/\n/)[0].replace(/\<\?.*?:.*?\>/g,"");
                console.log(titleRaw);
				desc = applyTheme(desc);
				desc = applyEmoji(desc);
				desc = applyNums(channel.guild, desc);
				
                let cMsg = desc;
                
                let serverIcon = channel.guild.iconURL();
                serverIcon = serverIcon.replace("webp","png");
                
                // fancy variant
                if(stats.fancy_mode) {
					let descSplit = desc.split(/\n/);
                    let title = descSplit.shift();
                   	let embed = {
                        "title": title,
                        "description": descSplit.join("\n"),
                        "color": 10921638,
                        "footer": {
                            "icon_url": `${serverIcon}`,
                            "text": `${channel.guild.name} - ${stats.game}`
                        }
                    };
                    let cRole = applyLUT(titleRaw);
                    if(cRole) embed.thumbnail = {url: iconRepoBaseUrl + "/" + cRole + ".png"};
                    cMsg = {embeds: [ embed ]};
                }
                
				channel.send(cMsg).then(m => {
					// Pin if pin is true
					if(pin) {
						m.pin().then(mp => {
							mp.channel.messages.fetch().then(messages => {
								mp.channel.bulkDelete(messages.filter(el => el.type === MessageType.ChannelPinnedMessage));
							});	
						}).catch(err => { 
							logO(err); 
							sendError(channel, err, "Could not pin SC info message");
						});
					}
				// Couldnt send message
				}).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not send SC info message");
				});
			} else { 
			// Empty result
				channel.send("⛔ Database error. Could not find SC `" + args[1] + "`!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for SC information!");
		});	
	}
	
	/* Creates a SC Info entry */
	this.cmdRolesScInfoSet = function(channel, args, argsX) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Remove entries with same name
		sql("DELETE FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			// Insert Entry & Preview it
			sql("INSERT INTO sc_info (name, info) VALUES (" + connection.escape(args[1]) + "," + connection.escape(argsX[2]) + ")", result => {
				channel.send("✅ Set `" + toTitleCase(args[1]) + "`! Preview:\n" + argsX[2].replace(/~/g,"\n") + "\n---------------------------------------------------------------------------------"); 
				getRoles();
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set SC info!");
			});		
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not prepare setting SC info!");
		});
	}
	
	/* Removes a SC Info entry */
	this.cmdRolesScInfoRemove = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		sql("DELETE FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			channel.send("✅ Removed `" + toTitleCase(args[1]) + "`!");
			getAliases();
		}, () => {
			channel.send("⛔ Database error. Could not remove SC info!");
		});
	}
	
	/* Deletes a cc category */
	this.cmdRolesScCleanup = function(channel) {
		for(let i = 0; i < cachedSCs.length; i++) {
			cleanupCat(channel, cachedSCs[i], "SC #" + (i+1));
		}
        // Reset SC Cat Database
        sql("DELETE FROM sc_cats", result => {
            channel.send("✅ Successfully reset sc cat list!");
            getCCCats();
        }, () => {
            channel.send("⛔ Database error. Could not reset sc cat list!");
        });
	}

	
	/* Check if a channel is a SC */
	this.isSC = function(channel) {
		return !channel.parent ? true : cachedSCs.includes(channel.parentId);
	}
    
	/* Check if a channel is a SC */
	this.isPublic = function(channel) {
		return !channel.parent ? false : channel.parentId === cachedPublic;
	}
	
	/* Creates secret channels */
	this.createSCs = function(channel, debug) {
		let callback = ((arg1,arg3,arg2) => createSCStartInd(arg1, arg2, arg3)).bind(null,channel,debug);
		createNewSCCat(channel, callback);
	}
	
	this.createNewSCCat = function(channel, callback, childChannel = false) {
		scCatCount++;
		let scName = "🕵 " + toTitleCase(stats.game) + " Secret Channels";
		if(scCatCount > 1) scName += " #" + scCatCount;
		channel.guild.channels.create({ name: scName, type: ChannelType.GuildCategory,  permissionOverwrites: getSCCatPerms(channel.guild) })
		.then(cc => {
			sql("INSERT INTO sc_cats (id) VALUES (" + connection.escape(cc.id) + ")", result => {	
				if(childChannel) { // sets the new category as a channel parent - for the first channel that failed to fit in the previous category
					childChannel.setParent(cc, { lockPermissions: false }).catch(err => { 
                        logO(err); 
                        sendError(channel, err, "Could not assign parent to SC!");
                    });
				}
				callback(cc);
				getSCCats();
			}, () => {
				channel.send("⛔ Database error. Unable to save SC category!"); 
			});
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not create SC category");
		});
	}
	
	/* Starts the creation of individual scs */
	this.createSCStartInd = function(channel, cc, debug) {
		sql("SELECT id,role FROM players ORDER BY role ASC", result => {
			createOneIndSC(channel, cc, result, 0, debug);
		}, () => {
			channel.send("⛔ Database error. Unable to get a list of player roles."); 
		});
	}
	
	/* Starts the creation of extra scs */
	this.createSCStartExtra = function(channel, cc) {
		sql("SELECT name,cond,members,setup FROM sc WHERE type = 'extra' ORDER BY name ASC", result => {
			createOneExtraSC(channel, cc, result, 0);
		}, () => {
			channel.send("⛔ Database error. Unable to get a list extra SCs."); 
		});
	}
	
	/* Starts the creation of multi scs */
	this.createSCStartMulti = function(channel, cc) {
		sql("SELECT name,cond,members,setup FROM sc WHERE type = 'multi' ORDER BY name ASC", result => {
			createOneMultiSC(channel, cc, result, 0);
		}, () => {
			channel.send("⛔ Database error. Unable to get a list extra SCs."); 
		});
	}
	
	/* Returns default sc permissions */
	this.getSCCatPerms = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]) ];
	}
	
	this.createOneMultiSC = function(channel, category, multi, index) {
		// Checks
		if(index >= multi.length) {
			channel.send("✅ Finished creating SCs!");
			return;
		}
		// Check if multi sc condition is met
		sql("SELECT id,role FROM players WHERE type='player' ORDER BY role ASC", result => {
			result = result.filter(el => el.role.split(",").some(el => multi[index].cond.split(",").includes(el)));
			if(result.length > 0 || multi[index].cond === " ") {
				// Find members of multisc
				sql("SELECT id,role FROM players WHERE type='player' ORDER BY role ASC", result2 => {
					result2 = result2.filter(el => el.role.split(",").some(el => multi[index].members.split(",").includes(el)));
					// Create permissions
					let ccPerms = getCCCatPerms(channel.guild);
					if(result2.length > 0) {
						let members = result2.map(el => channel.guild.members.cache.get(el.id).displayName).join(", ");
						channel.send("✅ Creating `" + toTitleCase(multi[index].name) + "` Multi SC for `" + (members ? members : "❌")  + "`!");
						result2.forEach(el =>  ccPerms.push(getPerms(el.id, ["history", "read"], [])));
					}
					// Create channel
					var name = multi[index].name;
					name = applyTheme(name);
					channel.guild.channels.create({ name: name, type: ChannelType.GuildText,  permissionOverwrites: ccPerms, parent: category })
					.then(sc => {
						// Send info message
						multi[index].setup.split(",").forEach(el => sc.send(stats.prefix + el));
						// Move into sc category
						sc.setParent(category,{ lockPermissions: false }).then(m => {
							createOneMultiSC(channel, category, multi, ++index);
						}).catch(err => { 
							logO(err); 
							sendError(channel, err, "Could not set category. Creating new SC category");
							let callback = ((arg1,arg3,arg4,arg2) => createOneMultiSC(arg1, arg2, arg3, arg4)).bind(null,channel,multi,++index);
							createNewSCCat(channel, callback, sc);
						});	
					}).catch(err => { 
						// Couldn't create channel
						logO(err); 
						sendError(channel, err, "Could not create channel");
					});
				}, () => {
					channel.send("⛔ Database error. Unable to get a list of players with an multi SC role."); 
				});
			} else {
				// Continue
				createOneMultiSC(channel, category, multi, ++index);
			}
		}, () => {
			channel.send("⛔ Database error. Unable to get a list of players of SC condition."); 
		});
	}
	
	/* Creates a single type of extra secret channel */
	this.createOneExtraSC = function(channel, category, extra, index) {
		// Checks
		if(index >= extra.length) {
			createSCStartMulti(channel, category);
			return;
		}
		// Verify Role
		if(!verifyRole(extra[index].cond)) {	
			channel.send("✅ Skipping `" + extra[index].name +"`! Invalid role condition!");
			createOneExtraSC(channel, category, extra, ++index);
            return;
		}
		// Get players with that role
		sql("SELECT id,role FROM players WHERE type='player' ORDER BY role ASC", result => {
			result = result.filter(el => el.role.split(",").includes(parseRole(extra[index].cond)));
			if(result.length > 0) {
				// Create SCs
				createOneOneExtraSC(channel, category, extra, index, result, 0);
			} else {
				// Continue
				createOneExtraSC(channel, category, extra, ++index);
			}
		}, () => {
			channel.send("⛔ Database error. Unable to get a list of players with an extra SC role."); 
		});
	}
	
	/* Creates a single extra secret channel of a single type of extra secret channel */
	this.createOneOneExtraSC = function(channel, category, extra, index, result, resultIndex) {
		if(resultIndex >= result.length) {
			createOneExtraSC(channel, category, extra, ++index);
			return;
		}
		channel.send("✅ Creating `" + toTitleCase(extra[index].name) + "` Extra SC for `" + channel.guild.members.cache.get(result[resultIndex].id).displayName + "` (`" + toTitleCase(extra[index].cond) + "`)!");
		// Create permissions
		let ccPerms = getCCCatPerms(channel.guild);
		if(extra[index].members === "%r") ccPerms.push(getPerms(result[resultIndex].id, ["history", "read"], []));
		// Create channel
		var name = extra[index].name;
        name = name.replace("%r", channel.guild.members.cache.get(result[resultIndex].id).user.username);
		name = applyTheme(name);
		channel.guild.channels.create({ name: name, type: ChannelType.GuildText,  permissionOverwrites: ccPerms, parent: category })
		.then(sc => {
			// Send info message
			if(extra[index].setup.length > 1) extra[index].setup.replace(/%r/g, result[resultIndex].id + "").replace(/%n/g, resultIndex).split(",").forEach(el => sc.send(stats.prefix + el));
			// Move into sc category
			sc.setParent(category,{ lockPermissions: false }).then(m => {
				createOneOneExtraSC(channel, category, extra, index, result, ++resultIndex);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not set category. Creating new SC category");
				let callback = ((arg1,arg3,arg4,arg5,arg6,arg2) => createOneOneExtraSC(arg1, arg2, arg3, arg4, arg5, arg6)).bind(null,channel,extra,index,result,++resultIndex);
				createNewSCCat(channel, callback, sc);
			});	
		}).catch(err => { 
			// Couldn't create channel
			logO(err); 
			sendError(channel, err, "Could not create channel");
		});
	}
	
	/* Creates a single individual secret channel */
	this.createOneIndSC = function(channel, category, players, index, debug) {
		if(index >= players.length) {
			createSCStartExtra(channel, category);
			return;
		}
		let roleListD = players[index].role.split(",");
		var customRole = false;
        var roleType = "default";
		if(roleListD[0] === "custom") {
            customRole = JSON.parse(roleListD[1].replace(/'/g,"\"").replace(/;/g,","));
            roleType = "custom";
        } else if(roleListD[0] === "merged") {
            customRole = [roleListD[1], roleListD[2]];
            roleType = "merged";
        }
		let roleList = roleListD.map(el => "name = " + connection.escape(el)).join(" OR ");
		sql("SELECT name,description,ind_sc FROM roles WHERE " + roleList, result => {	
			result = result.filter(role => verifyRoleVisible(role.name));
			var rolesArray = result.map(el => toTitleCase(el.name));
            let disName = channel.guild.members.cache.get(players[index].id).displayName;
			if(!debug) { 
				if(roleType == "default" || roleType == "merged") {
					let roles = rolesArray.join("` + `");
					roles = applyTheme(roles);
                    if(roleType == "merged") roles = [toTitleCase(customRole.join(" "))];
                    if(!stats.fancy_mode) { // default DM
                        channel.guild.members.cache.get(players[index].id).user.send("This message is giving you your role" + ((result.length != 1 && roleType == "default") ? "s" : "") + " for the next game of Werewolves: Revamped!\n\n\nYour role" + ((result.length != 1 && roleType == "default") ? "s are" : " is") + " `" + roles + "`.\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.\n\nIf you're confused about your role at all, then check #announcements on the discord, which contains a role book with information on all the roles in this game.").catch(err => { 
                            logO(err); 
                            sendError(channel, err, "Could not send role message to " + disName);
                        });	
                    } else { // fancy DM
                        let mainRoleDesc = result.find(el => toTitleCase(el.name) == rolesArray[0]).description;
                        let roleData = getRoleData(rolesArray[0], mainRoleDesc);
                        if(!roleData) {
                            sendError(channel, err, "Could not find role for " + disName);
                        } else {
                            let embed = {
                                "title": "The game has started!",
                                "description": "This message is giving you your role" + ((result.length != 1 && roleType == "default") ? "s" : "") + " for the next game of Werewolves: Revamped!\n\nYour role" + ((result.length != 1 && roleType == "default") ? "s are" : " is") + " `" + roles + "`.\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.\n\nIf you're confused about your role at all, then check #how-to-play on the discord, which contains a role book with information on all the roles in this game. If you have any questions about the game, ping @Host.",
                                "color": roleData.color,
                                "footer": {
                                    "icon_url": `${channel.guild.iconURL()}`,
                                    "text": `${channel.guild.name} - ${stats.game}`
                                },
                                "image": {
                                    "url": "https://werewolves.me/cards/card.php?name=" + rolesArray[0].replace(/ /g, "%20")
                                }
                            };
                            channel.guild.members.cache.get(players[index].id).user.send({embeds: [ embed ]}).catch(err => {
                                logO(err); 
                                sendError(channel, err, "Could not send role message to " + disName);
                            });
                        }
                    }
				} else if(roleType == "custom") {
					channel.guild.members.cache.get(players[index].id).user.send("This message is giving you your custom role for the next game of Werewolves: Revamped!\n\n\nYour role is `" + toTitleCase(customRole.name) + "` (" + customRole.id + ").\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.").catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not send role message to " + 	channel.guild.members.cache.get(players[index].id).displayName);
					});	
				}
			}
			let indscRoles = result.filter(el => el.ind_sc).map(el => el.name);
			if(roleType == "custom") indscRoles = [ customRole.name ];
			// Check if ind sc
			if(indscRoles.length) { 
				channel.send("✅ Creating `" + toTitleCase(indscRoles.join("-")) + "` Ind SC for `" + channel.guild.members.cache.get(players[index].id).displayName + "` (`" + result.map(el => toTitleCase(el.name)).join("` + `") + "`)!");
				// Create permissions
				let ccPerms = getCCCatPerms(channel.guild);
				ccPerms.push(getPerms(players[index].id, ["history", "read"], []));
				// Create channel
				
				var name = indscRoles.join("-");
                if(roleType == "merged") name = customRole.join(" ");
				name = applyTheme(name);
				channel.guild.channels.create({ name: name.substr(0, 100), type: ChannelType.GuildText,  permissionOverwrites: ccPerms, parent: category })
				.then(sc => {
                    cmdConnectionAdd(sc, ["", players[index].id], true);
					// Send info message
					if(roleType == "default") indscRoles.forEach(el => cmdInfoEither(sc, [ el ], true, false));
					else if(roleType == "merged") {
                        sql("SELECT description FROM roles WHERE name = " + connection.escape(parseRole(customRole[0])), result => {
                            let addDesc = result[0].description;
                            let addTitle = addDesc.split("~__Basics__")[0].split("|")[1].trim();
                            addDesc = addDesc.split("__Basics__")[1].replace(/~/g,"\n");
                            cmdInfoEither(sc, [ customRole[1] ], true, false, false, toTitleCase(customRole.join(" ")), [addTitle, addDesc]);
                        }, () => {
                            cmdInfoEither(sc, [ customRole[1] ], true, false, false, toTitleCase(customRole.join(" ")));
                        });
                    } else if(roleType == "custom") {
						var desc = "";
						desc += "**" + toTitleCase(customRole.name) + "** | " + toTitleCase(customRole.team);
						desc += "\n__Basics__\n" + toSentenceCase(customRole.basics.replace(/%n/g,toTitleCase(customRole.name)));
						desc += "\n__Details__\n" + toSentenceCase(customRole.details.replace(/%n/g,toTitleCase(customRole.name)));
						desc += "\n__Win Condition__\n" + toSentenceCase(customRole.win.replace(/%n/g,toTitleCase(customRole.name)));
						desc = applyTheme(desc);
						sc.send(desc).then(m => {
							m.pin().then(mp => {
								mp.channel.messages.fetch().then(messages => {
									mp.channel.bulkDelete(messages.filter(el => el.type === MessageType.ChannelPinnedMessage));
								});	
							}).catch(err => { 
								logO(err); 
								sendError(channel, err, "Could not pin info message");
							});
						// Couldnt send message
						}).catch(err => { 
							logO(err); 
							sendError(channel, err, "Could not send info message");
						});	
						if(customRole.setup != "") customRole.setup.replace(/%p/g,players[index].id).replace(/%c/g,sc.id).split(",").forEach(el => sc.send(stats.prefix + el));
					}
					// Move into sc category
					sc.setParent(category,{ lockPermissions: false }).then(m => {
						createOneIndSC(channel, category, players, ++index, debug);
					}).catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not set category. Creating new SC category");
						let callback = ((arg1,arg3,arg4,arg5,arg2) => createOneIndSC(arg1, arg2, arg3, arg4, arg5)).bind(null,channel,players,++index,debug);
						createNewSCCat(channel, callback, sc);
					});	
				}).catch(err => { 
					// Couldn't create channel
					logO(err); 
					sendError(channel, err, "Could not create channel");
				});
			} else { 
				// No ind sc
				channel.send("✅ Skipping `" + channel.guild.members.cache.get(players[index].id).displayName + "` (`" + result.map(el => toTitleCase(el.name)).join("` + `") + "`)!");
				createOneIndSC(channel, category, players, ++index, debug);
			}
		}, () => {
			// Couldn't delete
			channel.send("⛔ Database error. Could not get role info!");
		});
	}


	/* Verifies roles, but removes technical roles */
	this.verifyRoleVisible = function(input) {
		return !~input.search("!_") ? parseRole(input) : false;
	}
	
	/* Creates/Sets an Extra or Multi SC */
	this.cmdRolesAddSc = function(channel, type, args, argsX) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		if(!args[3] || args[3] === "") {
			args[3] = " ";
		} 
		if(!argsX[4] || argsX[4] === "") {
			argsX[4] = " ";
		}
		// Remove entries with same name
		sql("DELETE FROM sc WHERE name = " + connection.escape(args[1]), result => {
			// Insert Entry & Preview it
			sql("INSERT INTO sc (name, type, cond, members, setup) VALUES (" + connection.escape(args[1].replace(/'/g,'"')) + ", " + connection.escape(type) + "," + connection.escape(args[2].replace(/'/g,'"')) + "," + connection.escape(args[3].replace(/'/g,'"')) + "," + connection.escape(argsX[4].replace(/'/g,'"')) + ")", result => {
				if(args[2] === " ") args[2] = "none";
				if(args[3] === " " && argsX[4] === " ") channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, and no members or setup commands!"); 
				else if(args[3] === " " && argsX[4] != " ") channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, and setup commands `" + argsX[4] + "`, and no members!"); 
				else if(args[3] != " " && argsX[4] === " ") channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, and members `" + args[3] + "`, and no setup commands!"); 
				else channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, members `" + args[3] + "`, and setup commands `" + argsX[4] + "`!"); 
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set SC!");
			});		
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not prepare SC database!");
		});
	}
	
	/* Deletes a SC */
	this.cmdRolesRemoveSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("DELETE FROM sc WHERE name = " + connection.escape(args[1]), result => {
			// Insert Entry & Preview it
			 channel.send("✅ Deleted SC");
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Lists all SCs */
	this.cmdRolesListSc = function(channel) {
		// Remove entries with same name
		sql("SELECT name,type,cond,members,setup FROM sc", result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Could not find any SCs!");
				return;
			}
			channel.send("✳ Sending a list of currently existing multi/extra SCs:");
			chunkArray(result.map(el => "**" + toTitleCase(el.name) + "** [" + toTitleCase(el.type) + "]"), 50).map(el => el.join("\n")).forEach(el => channel.send(el));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Gets a SC */
	this.cmdRolesGetSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("SELECT name,type,cond,members,setup FROM sc WHERE name = " + connection.escape(args[1]), result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any matching SCs!");
				return;
			}
			result.forEach(el => channel.send("**" + toTitleCase(el.name) + "** [" + toTitleCase(el.type) + "]\nCondition: " + toTitleCase(el.cond.replace(/,/g,", ")) + "\nMembers: " + toTitleCase(el.members.replace(/,/g,", ")) + "\nSetup Commands: " + (el.setup.length > 0 ? "`" + el.setup.replace(/,/g,"`, `") + "`" : "")));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Gets a SC */
	this.cmdRolesRawSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("SELECT name,type,cond,members,setup FROM sc WHERE name = " + connection.escape(args[1]), result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any matching SCs!");
				return;
			}
			result.forEach(el => channel.send("```" + stats.prefix + "channels set_" + el.type + " \"" + el.name + "\" \"" + el.cond + "\" \"" + el.members + "\" \"" + el.setup + "\"```"));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Lists all SC Infos */
	this.cmdRolesScInfoList = function(channel) {
		// Remove entries with same name
		sql("SELECT name,info FROM sc_info", result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any SC Info!");
				return;
			}
			channel.send("✳ Sending a list of currently existing SC info:");
			chunkArray(result.map(el => "**__" + toTitleCase(el.name) + "__**: " + el.info.replace(/~/g,"").substr(0, 100)), 15).map(el => el.join("\n")).forEach(el => channel.send(el));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC Info database!");
		});
	}
	
	/* Gets SC Info */
	this.cmdRolesScInfoGet = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("SELECT name,info FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any matching SC Info!");
				return;
			}
			result.forEach(el => channel.send("**__" + toTitleCase(el.name) + "__**:\n```" + el.info.replace(/~/g,"\n") + "```"));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC Info database!");
		});
	}
	
	
	/* Lists all roles */
	this.cmdRolesList = function(channel, args) {
        let filter = false;
        if(args[1]) {
            filter = args[1];
        }
		// Get all roles
		sql("SELECT name,description FROM roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				if(!filter) channel.send("✳ Sending a list of currently existing roles:");
				else channel.send("✳ Sending a list `" + filter + "` of subroles:");
				// Send message
				chunkArray(result.filter(el => {
                    // when a filter is set filter out
                    if(!filter) return true;
                    let role = el.name.split("$");
                    role = role[0];
                    if(role == filter) return true;
                    return false;
                }).map(role => {
					let roleDesc = role.description.replace(/\*|_|Basics|Details/g,"")
					if(!filter) return "**" +  toTitleCase(role.name) + ":** " + roleDesc.replace(/~/g," ").substr(roleDesc.search("~") + 1, 90)
					else return role.name;
				}), 15).map(el => {
                    if(!filter) return el.join("\n");
                    else return el.join(", ");
                }).forEach(el => channel.send(el));
			} else { 
				// No roles exist
				channel.send("⛔ Database error. Could not find any roles!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for role list!");
		});
	}
	
	/* Lists all roles names */
	this.cmdRolesListNames = function(channel) {
		// Get all roles
		sql("SELECT name FROM roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳ Sending a list of currently existing role names:");
				// Send message
				chunkArray(result.map(role => toTitleCase(role.name)), 40).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No roles exist
				channel.send("⛔ Database error. Could not find any roles!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for role list!");
		});
	}


	
	/* Creates/Sets an alias */
	this.cmdRolesSetAlias = function(channel, args) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Delete old entries with same alias
		sql("DELETE FROM roles_alias WHERE alias = " + connection.escape(args[1]), result => {
			// Insert alias into db
			sql("INSERT INTO roles_alias (alias, name) VALUES (" + connection.escape(args[1]) + "," + connection.escape(parseRole(args[2])) + ")", result => {
				channel.send("✅ Alias `" + toTitleCase(args[1]) + "` set to `" + toTitleCase(parseRole(args[2])) + "`!"); 
				getAliases();
			}, () => {
				// Couldn't set alias
				channel.send("⛔ Database error. Could not set role alias!");
			});		
		}, () => {
			// Couldn't delete old entry for alias
			channel.send("⛔ Database error. Coult not prepare setting role alias!");
		});
	}
	
	/* Removes a role alias */
	this.cmdRolesRemoveAlias = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		sql("DELETE FROM roles_alias WHERE alias = " + connection.escape(args[1]), result => {
			channel.send("✅ Removed `" + toTitleCase(args[1]) + "`!");
			getAliases();
		}, () => {
			channel.send("⛔ Database error. Could not remove role alias!");
		});
	}
	
	/* Lists all role aliases */
	this.cmdRolesListAlias = function(channel) {
		// Get all aliases
		sql("SELECT alias,name FROM roles_alias ORDER BY alias ASC", result => {
			if(result.length > 0) {
				channel.send("✳ Sending a list of currently existing role aliases:");
                let aliases = {};
                result.forEach(el => {
                    if(!aliases[el.name]) aliases[el.name] = [];
                    aliases[el.name].push(el.alias);
                });
                let lines = [];
                Object.keys(aliases).map(alias => {
                    lines.push("**" + toTitleCase(alias) + ":** " + aliases[alias].join(", "));
                });
				// For each alias send a message
				chunkArray(lines, 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				channel.send("⛔ Database error. Could not find any role aliases!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for alias list!");
		});
	}
	
	/* Removes all aliases */
	this.cmdRolesClearAlias = function(channel) {
		sql("DELETE FROM roles_alias", result => {
			channel.send("⛔ Database error. Could not execute `" + data.action + "`!");
			getAliases();
		}, () => {
			channel.send("✅ Successfully executed `" + data.action + "`!");
		});
	}
    
    this.cmdInfoEdit = function(channel, args, argsX) {
        if(!args[0] || !args[1]) {
            if(!noErr) channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        channel.messages.fetch(args[0])
        .then(message => {
            let append = false;
            if(argsX[2]) append = ["", argsX[2].replace(/~/g, "\n").replace(/<\/>/g,"~")];
            cmdInfoEither(message.channel, [args[1]], false, false, false, false, append, message);
        })
        .catch(err => { 
            logO(err); 
            sendError(channel, err, "Could not edit in info message");
        });
    }
    
	/* Prints info for a role by name or alias */
	this.cmdInfo = function(channel, args, pin, noErr, simp = false, overwriteName = false, appendSection = false, editOnto = false) {
		// Check arguments
		if(!args[0]) { 
			if(!noErr) channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		args[0] = args.join(" ");
		if(!verifyRoleVisible(args[0])) {
			if(!noErr) channel.send("⛔ Command error. Invalid role `" + args[0] + "`!"); 
			return; 
		}
		sql("SELECT description FROM roles WHERE name = " + connection.escape(parseRole(args[0])), result => {
			if(result.length > 0) { 
				var desc = result[0].description.replace(/~/g,"\n");
                if(overwriteName) {
                    desc = desc.split("|");
                    desc[0] = `**${overwriteName}** `;
                    desc = desc.join("|");
                }
				desc = applyEmoji(desc);
				desc = applyNums(channel.guild, desc);
                // simplified role description support
                desc = desc.split("__Simplified__");
                if(simp) desc = desc[1] ? (desc[0].split("__Basics__")[0] ? desc[0].split("__Basics__")[0] : toTitleCase(parseRole(args[0]))) + "\n" + desc[1].trim() : desc[0]; 
                else desc = desc[0];
                if(appendSection) desc = desc.trim() + `\n__${appendSection[0]}__\n${appendSection[1]}`;
               
               if(desc.length > 1900) { // too long, requires splitting
                   let descSplit = desc.split(/\n/);
                   desc = [];
                   let i = 0;
                   let j = 0;
                   while(i < descSplit.length) {
                       desc[j] = "";
                       while(i < descSplit.length && (desc[j].length + descSplit[i].length) < 1900) {
                           desc[j] += "\n" + descSplit[i];
                           i++;
                       }
                       j++;
                   }
               } else { // fits
                   desc = [desc];
               }
               
                for(let i = 0; i < desc.length; i++) {
		     // apply themes
	            desc = applyTheme(desc);
                    channel.send(desc[i]).then(m => {
                        // Pin if pin is true
                        if(pin) {
                            m.pin().then(mp => {
                                mp.channel.messages.fetch().then(messages => {
                                    mp.channel.bulkDelete(messages.filter(el => el.type === MessageType.ChannelPinnedMessage));
                                });	
                            }).catch(err => { 
                                logO(err); 
                                if(!noErr) sendError(channel, err, "Could not pin info message");
                            });
                        }
                        if(simp) {
                            setTimeout(() => m.delete(), 180000);
                        }
                    // Couldnt send message
                    }).catch(err => { 
                        logO(err); 
                        if(!noErr) sendError(channel, err, "Could not send info message");
                    });
                }
			} else { 
			// Empty result
				if(!noErr) channel.send("⛔ Database error. Could not find role `" + args[0] + "`!");
			}
		}, () => {
			// DB error
			if(!noErr) channel.send("⛔ Database error. Couldn't look for role information!");
		});	
	}

    
    this.getIconFromName = function(name) {
        return new Promise(res => {
            let roleNameParsed = parseRole(name);
            if(!roleNameParsed) return res(false);
            var output;
            sql("SELECT description FROM roles WHERE name = " + connection.escape(roleNameParsed), async result => {
                if(!result[0] || !result[0].description) return res(false);
                let roleData = getRoleData(roleNameParsed, result[0].description);
                let urlExists = await checkUrlExists(roleData.url);
                if(urlExists) res(roleData.url);
                else res(false);
            });
        });
    }
    
    this.cmdGetImg = function(channel, role) {
        let roleNameParsed = parseRole(role);
        var lutName = applyLUT(role);
        sql("SELECT description FROM roles WHERE name = " + connection.escape(roleNameParsed), async result => {
            if(lutName) {
                channel.send(iconRepoBaseUrl + lutName + ".png");
            } else if(result.length > 0) {
                var desc = result[0].description.replace(/~/g,"\n");
                var roleData = getRoleData(roleNameParsed, desc);
                if(roleData.url && roleData.url.length > (iconRepoBaseUrl.length + 5)) channel.send(roleData.url);
                else channel.send("⛔ Command error. Cannot find url for `" + role + "`!"); 
            } else {
                channel.send("⛔ Command error. Invalid role `" + role + "`!"); 
            }
        });
    }
    
	/* Prints info for a role by name or alias */
	this.cmdInfoFancy = function(channel, args, pin, noErr, simp = false, overwriteName = false, appendSection = false, editOnto = false, technical = false) {
		// Check arguments
		if(!args[0]) { 
			if(!noErr) channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		args[0] = args.join(" ");
		if(!verifyRoleVisible(args[0])) {
			if(!noErr) channel.send("⛔ Command error. Invalid role `" + args[0] + "`!"); 
			return; 
		}
        let roleNameParsed = parseRole(args[0]);
		sql("SELECT description FROM roles WHERE name = " + connection.escape(roleNameParsed), async result => {
			if(result.length > 0) { 
                roleNameParsed = roleNameParsed.split("$")[0];
				var desc = result[0].description.replace(/~/g,"\n");
				desc = applyEmoji(desc);
                desc = applyNums(channel.guild, desc);
                
                // split into name & text pairs + apply theme
                desc = desc.split(/(?=__[\w\d _]+__)/).map(el => {
                    let cat = el.match(/^__([\w\d _]+)__\s*\n([\w\W]*)\n?$/);
                    //console.log(cat);
                    return cat ? [cat[1], cat[2]] : ["", el];
                }).map(el => {
                    return applyTheme(el);
                });
                
                if(!simp && !technical) {
                    desc = desc.filter(el => el[0] != "Simplified" && el[0] != "Formalized" && el[0] != "Card");
                } else if(simp) {
                    desc = desc.filter(el => el[0] === "Simplified" || el[0] === ""); 
                } else if(technical) {
                    desc = desc.filter(el => el[0] === "Formalized" || el[0] === ""); 
                }
                
                let category = (desc.find(el => el[0] == "")[1].split(/ \| /)[1] ?? "Unknown").replace(/[\n\r]*/g,"").trim();
                let fancyRoleName = toTitleCase(roleNameParsed) + (category ? " [" + category + "]" : "");
                if(fancyRoleName.substr(0, 16) == "Ability Types - ") fancyRoleName = fancyRoleName.substr(16);
                if(overwriteName) fancyRoleName = overwriteName;
                fancyRoleName = applyTheme(fancyRoleName);
                // determine role type ("limited")
                let roleType = false;
                // 0 - default
                // 1 - limited
                // 2 - transformation
                // x - transformation limited
                // 3 - technical
                // 4 - joke
                // 5 - temporary
                // 6 - variant
                // 7 - mini wolves
                let roleTypeID = 0; 
                switch((desc.find(el => el[0] == "")[1].split(/ \| /)[2] ?? "-").trim().toLowerCase()) {
                    case "technical": roleTypeID = 3; roleType = "Technical Role"; break;
                    case "limited": roleTypeID = 2; roleType = "Limited Role"; break;
                    case "transformation": roleTypeID = 1; roleType = "Transformation Role"; break;
                    case "transformation limited":
                    case "limited transformation": roleTypeID = -1; roleType = "Limited & Transformation Role"; break;
                    
                    case "joke role": 
                    case "joke": roleTypeID = 4; roleType = "Joke Role"; break;
                    case "temporary": roleTypeID = 5; roleType = "Temporary Role"; break;
                    case "fake role":
                    case "variant": roleTypeID = 7; roleType = "Variant Role"; break;
                    case "mini": roleTypeID = 6; roleType = "Mini Wolves Exclusive"; break;
                }
                
                // get the url to the icon on the repo
                let roleData = getRoleData(roleNameParsed, result[0].description);
                
                var embed = {};
                if(roleData && result[0].description.split(/~/)[1][0] == "_") { // actual role
                    // base embed
                    let urlExists = await checkUrlExists(roleData.url);
                     let emUrl = roleData.url;
                     // if the url doesnt exist, use a placeholder
                    if(!urlExists) {
                        let pCat = category.split(" ")[0];
                        switch(pCat) {
                            case "Townsfolk":
                            case "Werewolf":
                            case "Unaligned":
                            case "Solo":
                                emUrl = `${iconRepoBaseUrl}Placeholder/${pCat}.png?version=${stats.icon_version}`;
                            break;
                            default:
                                emUrl = `${iconRepoBaseUrl}Placeholder/Unaligned.png?version=${stats.icon_version}`;
                            break;
                        }
                    }
                    // create the embed
                    let serverIcon = await channel.guild.iconURL();
                    serverIcon = serverIcon.replace("webp","png");
                    console.log(serverIcon);
                    embed = {
                        "color": roleData.color,
                        "footer": {
                            "icon_url": `${serverIcon}`,
                            "text": `${channel.guild.name} - ${stats.game}`
                        },
                        "thumbnail": {
                            "url": emUrl
                        },
                        "author": {
                            "name": fancyRoleName,
                            "icon_url": emUrl
                        },
                        "fields": []
                    };
                    
                    if(roleType) embed.title = roleType;
                    
                    if(stats.gamephase == 0 || (stats.gamephase > 0 && ((roleTypeID >= 0 && (stats.role_filter & (1 << roleTypeID))) || (roleTypeID == -1 && (stats.role_filter & (1 << 1)) && (stats.role_filter & (1 << 2)))))) {
                        // add text
                        if(!simp) {
                            desc.forEach(el => {
                                if(!el[0]) return;
                                if(el[1].length <= 1000) {
                                    if(!technical) embed.fields.push({"name": `__${el[0]}__`, "value": el[1]});
                                    else embed.fields.push({"name": `__${el[0]}__`, "value": "```" + el[1] + "```"});
                                } else {
                                    let descSplit = el[1].split(/\n/);
                                   descSplitElements = [];
                                   let i = 0;
                                   let j = 0;
                                   while(i < descSplit.length) {
                                       descSplitElements[j] = "";
                                       while(i < descSplit.length && (descSplitElements[j].length + descSplit[i].length) <= 1000) {
                                           descSplitElements[j] += "\n" + descSplit[i];
                                           i++;
                                       }
                                       j++;
                                   }
                                   descSplitElements.forEach(d => embed.fields.push({"name": `__${el[0]}__ (${descSplitElements.indexOf(d)+1}/${descSplitElements.length})`, "value": d}));
                                }
                            });
                            if(appendSection) embed.fields.push({"name": `__${appendSection[0]}__`, "value": appendSection[1]});
                        } else {
                            let simpDesc = desc.find(el => el && el[0] === "Simplified");
                            if(simpDesc) {
                                embed.description = simpDesc[1];
                            }  else {
                                simpDesc = desc.find(el => el && el[0] === "Basics");
                                if(simpDesc) {
                                    embed.description = simpDesc[1];
                                } else {
                                    if(simp) cmdInfoFancy(channel, args, pin, noErr, false, overwriteName, appendSection, editOnto);
                                    else cmdInfo(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
                                    return;
                                }
                            }
                        }
                    } else {
                        embed.description = "**This role type is currently not in use.**";
                    }
                    
                } else { // apparntly not a role
                    let desc = result[0].description;
                    desc = applyEmoji(desc);
                    desc = applyNums(channel.guild, desc);
                    let descSplit = desc.split(/~/);
                    let catRole = applyLUT(descSplit[0]);
                    let title = descSplit.shift();
                    if(overwriteName) title = overwriteName;
                    
                    // base embed
                    let serverIcon = channel.guild.iconURL();
                    serverIcon = serverIcon.replace("webp","png");
                    embed = {
                        "color": 7829367,
                        "footer": {
                            "icon_url": `${serverIcon}`,
                            "text": `${channel.guild.name} - ${stats.game}`
                        },
                        "title": title
                    };
                    
                    // append section
                    if(appendSection && appendSection[0] && appendSection[0].length > 0) descSplit.push("**" + appendSection[0] + "**");
                    if(appendSection && appendSection[1] && appendSection[1].length > 0) descSplit.push(...appendSection[1].split(/\r?\n/g));
                    
                    // add emojis for role lists
                    let descSplitCopy = descSplit;
                    let emojiFound = 0;
                    descSplit = descSplit.map(relFull => {
                        let rel = relFull.split(" (")[0]; // remove team names
                        rel = rel.replace(/ x\d+$/, ""); // remove number multipliers
                        if(rel[0] && rel[0].match(/[A-Za-z\*]/) && rel.length < 30 && rel.length > 2 && !rel.match(/[^\w\d\-_\s\*'\\]/)) { // check if role
                                let rName = parseRole(rel.replace(/[^\w\s\-']/g,"").trim()); // parse role
                                console.log(rName);
                                if(rName && verifyRole(rName)) { // find an emoji
                                    console.log("found => " + rName);
                                    let rEmoji = getRoleEmoji(rName);
                                    if(rEmoji) emojiFound++;
                                    else emojiFound--;
                                    if(!rEmoji) rEmoji = client.emojis.cache.find(el => el.name == (toTitleCase(roleNameParsed.split(" ")[0]) + "Placeholder"));
                                    if(!rEmoji) return relFull;
                                    if(relFull.split(" (").length > 1 && rel[0] == "*") rel += "*"; // solo team limited fixer
                                    return `<:${rEmoji.name}:${rEmoji.id}> ${applyTheme(relFull)}`
                                }
                        }
                        return relFull;
                    });
                    // if a majority dont have emojis, then just dont
                    if(emojiFound < 0) descSplit = descSplitCopy;
                    
                    if(descSplit.join("\n").length > 1900) { // too long
                       descSplitElements = [];
                       let i = 0;
                       let j = 0;
                       while(i < descSplit.length) {
                           descSplitElements[j] = "";
                           while(i < descSplit.length && (descSplitElements[j].length + descSplit[i].length) <= 1000) {
                               descSplitElements[j] += "\n" + descSplit[i];
                               i++;
                           }
                           j++;
                       }
                       embed.description = descSplitElements.shift() + "\n" + descSplitElements.shift();
                       embed.fields = [];
                       descSplitElements.forEach(el => embed.fields.push({"name": `...`, "value": el}));
                    } else { // not too long
                        embed.fields = [];
                        embed.description = descSplit.join("\n");
                    }
                    
                    
                    if(catRole) embed.thumbnail = {url: iconRepoBaseUrl + catRole + `.png?version=${stats.icon_version}`};
                }
                
                // send embed
                if(!editOnto) {
                    channel.send({embeds: [ embed ]}).then(m => {
                            // Pin if pin is true
                            if(pin) {
                                m.pin().then(mp => {
                                    mp.channel.messages.fetch().then(messages => {
                                        mp.channel.bulkDelete(messages.filter(el => el.type === MessageType.ChannelPinnedMessage));
                                    });	
                                }).catch(err => { 
                                    logO(err); 
                                    if(!noErr) sendError(channel, err, "Could not pin info message");
                                });
                            }
                            if(simp) {
                                setTimeout(() => m.delete(), 180000);
                            }
                        // Couldnt send message
                    }).catch(err => {
                        logO(err);
                        if(simp) cmdInfoFancy(channel, args, pin, noErr, false, overwriteName, appendSection, editOnto);
                        else cmdInfo(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
                    });
                } else {
                    // edit onto an existing message instead
                    editOnto.edit({embeds: [ embed ]}).catch(err => {
                        logO(err);
                        if(simp) cmdInfoFancy(channel, args, pin, noErr, false, overwriteName, appendSection, editOnto);
                        else cmdInfo(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
                    });
                }
			} else { 
			// Empty result
				if(!noErr) channel.send("⛔ Database error. Could not find role `" + args[0] + "`!");
			}
		}, () => {
			// DB error
			if(!noErr) channel.send("⛔ Database error. Couldn't look for role information!");
		});	
	}
    
    this.getRoleEmoji = function(roleName) {
        roleName = toTitleCase(roleName).replace(/[^\w]+/g,"").trim().toLowerCase();
        return client.emojis.cache.find(el => el.name.toLowerCase() == roleName);
    }
	
}

/*
	Module for roles / role info
		- Set role name & aliases
		- Get role info
		- Create / Manage SCs
		- Distribute roles
*/
module.exports = function() {
	/* Variables */

	
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
    
	
}

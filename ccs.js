/*
	Module for CCs 
		- Creates ccs
		- Checks if something is a cc
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
module.exports = function() {
	
	
		
	/* Creates CC */
	this.cmdCCCreate = function(channel, member, args, mode, callback, spam = false) {
		// Get a list of users that need to be in the cc
		if(!(isCC(channel) || isSC(channel) || isGameMaster(member, true) || isHelper(member))) {
			channel.send("⛔ Command error. Can't use command outside a CC/SC!");
			return;
		} else if(!args[2] && spam == false) {
			channel.send(cmdHelp(channel, member, ["cc", "create"]));
			return;
		} else if(!args[1]) {
			channel.send(cmdHelp(channel, member, ["cc", spam ? "spam" : "create"]));
			return;
		} else if(!spam && !isGameMaster(member, true) && !isHelper(member) && stats.cc_limit >= -10 && ccs.find(el => el.id == member.id).ccs >= stats.cc_limit) {
			channel.send("⛔ You have hit the CC limit of `" + stats.cc_limit + "` CCs!");
			return;
		}
        args[1] = cleanCCName(args[1]);
		players = parseUserList(args, 2, channel, member, isGhost(member) ? "ghost" : "participant");
        //console.log(players);
        if(!players || spam) players = [];
		if(!spam && !isGameMaster(member, true) && !isHelper(member)) {
			sql("UPDATE players SET ccs = ccs + 1 WHERE id = " + connection.escape(member.id), result => {
				getCCs();
			}, () => {
				channel.send("⛔ Database error. Could not increase the CC amount!");
			});
		}
        players = players.filter(el => el != member.id);
		if(isParticipant(member) || isGhost(member) || ((isGameMaster(member, true) || isHelper(member)) && players.length > 0) || (isMentor(member) && spam)) {
			sqlGetStat(9, result => {
				// Check if a new category is needed
                let curCCCount = result;
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
							sqlSetStat(10, cc.id, async result => {
								// Create a new channel
								let ccPerms = getCCCatPerms(channel.guild);
                                if(isGhost(member)) ccPerms = getCCCatPermsGhostly(channel.guild);
								if(!spam) ccPerms.push(getPerms(member.id, ["history", "read"], []));
								else ccPerms.push(getPerms(member.id, ["read"], []));
                                if(spam) ccPerms.push(getPerms(stats.mentor, ["write"], ["read"]));
								if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
								if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
                                let mentor = await getMentor(member.id); 
                                if(mentor) ccPerms.push(getPerms(mentor, ["read"], ["write"]));
                                for(let i = 0; i < players.length; i++) {
                                    let mentor = await getMentor(players[i]); 
                                    if(mentor) ccPerms.push(getPerms(mentor, ["read"], ["write"]));
                                }
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
					sqlGetStat(10, async result => {
						// Create a new channel
						let ccPerms = getCCCatPerms(channel.guild);
                        if(isGhost(member)) ccPerms = getCCCatPermsGhostly(channel.guild);
                        if(!spam) ccPerms.push(getPerms(member.id, ["history", "read"], []));
                        else ccPerms.push(getPerms(member.id, ["read"], []));
                        if(spam) ccPerms.push(getPerms(stats.mentor, ["write"], ["read"]));
						if(players.length > 0 && mode === 0) players.forEach(el => ccPerms.push(getPerms(el, ["read"], [])));
						if(players.length > 0 && mode === 1) players.forEach(el => ccPerms.push(getPerms(el, ["read", "history"], [])));
                        let mentor = await getMentor(member.id); 
                        if(mentor) ccPerms.push(getPerms(mentor, ["read"], ["write"]));
                        for(let i = 0; i < players.length; i++) {
                            let mentor = await getMentor(players[i]); 
                            if(mentor) ccPerms.push(getPerms(mentor, ["read"], ["write"]));
                        }
                        let cc = channel.guild.channels.cache.get(result);
                        let cobj = { name: (spam?"🤖-":"") + (isGhost(member)?"👻-":"") + args[1] + "", type: ChannelType.GuildText,  permissionOverwrites: ccPerms, parent: cc.id };
                        if(curCCCount % 50 === 49) delete cobj.parent;
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
                                if(err?.rawError?.errors?.parent_id?._errors?.[0]?.code === "CHANNEL_PARENT_MAX_CHANNELS") {
                                    sql("UPDATE stats SET value = value + 1 WHERE id = 9", result => {
                                        channel.send("⛔ Command error. Could not create new CCs! Re-trying."); 
                                        cmdCCCreate(channel, member, args, mode, callback, spam);
                                        return;
                                    });
                                }
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
	
}

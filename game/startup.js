/**
	Game Module - Startup
	Handles all the channel generation at the start of a game.
*/
module.exports = function() {
    
    /**
    Command: $check_start
    Checks if a game is ready to be started.
    **/
    this.cmdCheckStart = async function(channel) {
        let check = await gameCheckStart(channel);
        if(!check) channel.send("⛔ The game is **not** ready to start.");
        else channel.send("✅ The game is ready to start.");
    }
    
    /**
    Check if game is ready to start
    Is used by $start and $check_start
    **/
    this.gameCheckStart = async function(channel) {
        // check requires and unique role values
        let roles = await sqlProm("SELECT roles.name,roles.parsed,players.id FROM roles JOIN players WHERE players.role=roles.name");
        let roleNames = roles.map(el => el.name.toLowerCase());
        var cancelStart = false;
        for(let i = 0; i < roles.length; i++) {
            let rName = roles[i].name;
            // parse role description
            let parsed = JSON.parse(roles[i].parsed);
            if(!parsed) {
                channel.send(`⛔ List error. Cannot start game with invalid parsed role \`${rName}\`.`); 
                cancelStart = true;
                continue;
            }
            // check requirements
            let requires = parsed.requires ?? [];
            for(let j = 0; j < requires.length; j++) {
                let parsed = parseRole(requires[j]);
                if(!roleNames.includes(parsed)) {
                    channel.send(`⛔ List error. Cannot start game with role \`${rName}\` without having requirement \`${requires[j]}\`.`); 
                    cancelStart = true;
                }
            }
            // check unique role
            let unique = parsed.unique ?? false;
            if(unique) {
                let filtered = roleNames.filter(el => el === rName);
                if(filtered.length != 1) {
                    channel.send(`⛔ List error. Cannot start game with \`${filtered.length}\` instances of unique role \`${rName}\`.`); 
                    cancelStart = true;
                }
            }
            // check host information
            if(/%(.+?)%/.test(roles[i].parsed)) {
                let matches = [], match = null;
                var hostInfo = new RegExp("%(.+?)%", "g"); 
                while(match = hostInfo.exec(roles[i].parsed)){
                  matches.push(match[1].toLowerCase());
                }
                matches = removeDuplicates(matches);
                let missingMatches = [];
                let duplicateMatches = [];
                for(let j = 0; j < matches.length; j++) {
                    let hi = await getHostInformation(roles[i].id, matches[j]);
                    if(hi.length === 0) missingMatches.push(matches[j]);
                    if(hi.length > 1) duplicateMatches.push(matches[j]);
                }
                if(missingMatches.length > 0) {
                    let cmds = missingMatches.map(el => '`$hi add ' + roles[i].id + ' ' + el + ' "<value>"`').join(", ");
                    channel.send(`⛔ List error. Cannot start game with role \`${rName}\` on <@${roles[i].id}> without host information. The following information is missing: ${missingMatches.map(el => '\`' + el + '\`').join(", ")}. To add this host information run this command: ${cmds}`); 
                    cancelStart = true;
                }
                if(duplicateMatches.length > 0) {
                    channel.send(`⛔ List error. Cannot start game with role \`${rName}\` on <@${roles[i].id}> with duplicate host information. The following information is duplicated: ${duplicateMatches.map(el => '\`' + el + '\`').join(", ")}. To remove the duplicated host information run \`${prefix}hi list\`, identify the id of the host information you want to delete, and then run \`${prefix}hi remove <ID>\`.`); 
                    cancelStart = true;
                }
            }
        }
        if(cancelStart) return false;
        return true;
    }
    
    
	/**
    Command: $start
    Starts the game
    */
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
        
        if(stats.automation_level === autoLvl.FULL && !stats.phaseautoinfo) {
            channel.send("⛔ Command error. Cannot start a fully automated game without phase timings."); 
            return;
        }
        if(stats.automation_level === autoLvl.FULL && (!parseToFutureUnixTimestamp(stats.phaseautoinfo.d0) || isNaN(stats.phaseautoinfo.day) || isNaN(stats.phaseautoinfo.night) || stats.phaseautoinfo.day <= 2 || stats.phaseautoinfo.night <= 2)) {
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
        if(stats.automation_level === autoLvl.FULL) {
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
                await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence, name) VALUES ('special','late'," + connection.escape(time + durNight - (stats.phaseautoinfo.night_late * 60) - 30) + "," + connection.escape(fullCycle) + ",'night-late')");
            }
            // Day Late
            if(stats.phaseautoinfo.day_late) {
                await sqlProm("INSERT INTO schedule(type, value, timestamp, recurrence, name) VALUES ('special','late'," + connection.escape(time + fullCycle - (stats.phaseautoinfo.day_late * 60) - 30) + "," + connection.escape(fullCycle) + ",'day-late')");
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
    
    /**
    Start One player
    switches roles for a single player
    WIP: this probably used to do more in the past and is now overkill
    **/
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
	
    
	/**
    Create Secret Channels
    creates the personal secret channels for every player
    */
	this.createSCs = async function(channel, debug) {
		let firstCategory = await createNewSCCat(channel); // create a sc cat
        createSCs_Start(channel, firstCategory, debug); // start creating scs
	}
    
	/**
    Create Secret Channels - Start
    This loads all the role info for each player and then starts creating the SCs
    **/
	function createSCs_Start(channel, category, debug) {
        // IMPORTANT: changing this query requires also changing a call from "createOneSC" which mirrors this query
		sql("SELECT id,role,mentor FROM players ORDER BY role ASC", async result => {
            let nextCategory = category;
            // iterate through players
            for(let player in result) {
                nextCategory = await createSCs_One(channel, category, result[player], debug); // create SCs for every player
            }
            // finished
			channel.send("✅ Finished creating INDSCs!");
		}, () => {
			channel.send("⛔ Database error. Unable to get a list of player roles."); 
		});
	}
    
    this.createOneSC = async function(channel, pid, role) {
        let lastCat = cachedSCs[cachedSCs.length - 1];
       return await createSCs_One(channel, lastCat, { id: pid, role: role, mentor: null }, true);
    }
    
    /**
    Create Secret Channels - Create One
    Creates a single secret channel
    **/
	 async function createSCs_One(channel, category, player, debug) {
        return new Promise(res => {
            sql("SELECT * FROM roles WHERE name=" + connection.escape(player.role), async result => {	
                var rolesName = result[0].display_name;
                var rolesNameBot = result[0].name;
                var roleData = result[0];
                if(result[0].identity) {
                    let idRole = await sqlPromOneEsc("SELECT * FROM roles WHERE name=", result[0].identity);
                    rolesName = idRole.display_name;
                    rolesNameBot = idRole.name;
                    roleData = idRole;
                }
                let disName = channel.guild.members.cache.get(player.id).displayName; // get the player's display name
                
                // Send Role DM (except if in debug mode)
                if(!debug) await createSCs_sendDM(channel.guild, player.id, roleData, disName)
                    
                // Create INDSC
                channel.send("✅ Creating INDSC for `" + channel.guild.members.cache.get(player.id).displayName + "` (`" + rolesName + "`)!");
                
                // Create permissions
                let scPerms = getSCCatPerms(channel.guild);
                scPerms.push(getPerms(player.id, ["history", "read"], []));
                if(player.mentor) scPerms.push(getPerms(player.mentor, ["history", "read", "write"], []));
                scPerms.push(getPerms(stats.ghost, ["write"], ["read"]));
                
                // Determine channel name
                let channelName = rolesName.substr(0, 100);
                channelName = applyTheme(channelName);
                
                if(channelName.length > 100 || channelName.length <= 0) channelName = "invalid";

                // Create SC channel
                channel.guild.channels.create({ name: channelName, type: ChannelType.GuildText,  permissionOverwrites: scPerms })
                .then(async sc => {
                    // Create a default connection with the player's ID
                    cmdConnectionAdd(sc, ["", player.id], true);
                    // Send info message for each role
                    cmdInfo(sc, player.id, [ rolesNameBot ], true, false);
                    
                    // send card
                    if (config.cards) {
                        setTimeout(() => {
                            cmdGetCard(sc, rolesNameBot);
                        }, 5000);
                    }

                    // Move into sc category
                    sc.setParent(category,{ lockPermissions: false }).then(m => {
                        // Success continue as usual
                        res(category);
                    }).catch(async err => { 
                        // Failure, Create a new SC Cat first
                        logO(err); 
                        sendError(channel, err, "Could not set category. Creating new SC category");
                        let newCategory = await createNewSCCat(channel, sc);
                        res(newCategory);
                    });	
                }).catch(err => { 
                    // Couldn't create channel
                    logO(err); 
                    sendError(channel, err, "Could not create channel");
                });
                
            }, () => {
                // Couldn't get role info
                channel.send("⛔ Database error. Could not get role info!");
            });
        });
	}
    

    /**
    Create Secret Channels - Send DM
    Send a game start dm to each player as part of the indsc channel creation
    **/
    this.createSCs_sendDM = async function(guild, playerID, role, disName, restart = false) {
        return new Promise(res => {
            // Build the role name
            let roleName = role.display_name;
            
            // Get role data for the first role
            let roleData = getRoleData(role.display_name, role.class, role.category, role.team);
            
            // Get basic embed
            let embed = getBasicEmbed(guild);
            // Build the full embed
            delete embed.fields;
            embed.title = "The game has started!";
            if(restart) embed.title = "The game has restarted!";
            embed.description = "This message is giving you your role for the next game of Werewolves: Revamped!\n\nYour role is `" + roleName + "`.\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.\n\nIf you're confused about your role at all, then check #how-to-play on the discord, which contains a role book with information on all the roles in this game. If you have any questions about the game, ping @Host.";
            embed.color = roleData.color;
            if(config.cards) embed.image = { "url": getCardUrl(role.name) };

            // send the embed
            guild.members.cache.get(playerID).user.send({embeds: [ embed ]}).then(m => {
                res(); // resolve the promise
            }).catch(err => {
                logO(err); 
                sendError(backupChannel, err, "Could not send role message to " + disName);
                res(); // resolve the promise
            });
            
        });
    }
    
    /**
    Create New Secret Channel Category
    creates a new secret channel category and then continues running a callback
    **/
	 function createNewSCCat(channel, childChannel = false) {
         return new Promise(res => {
            // increment the SC count to determine the new sc name
            scCatCount++;
            let scName = "🕵 " + toTitleCase(stats.game) + " Secret Channels";
            // only append a number for SC cats >1
            if(scCatCount > 1) scName += " #" + scCatCount;
            // create a new sc cat
            channel.guild.channels.create({ name: scName, type: ChannelType.GuildCategory,  permissionOverwrites: getSCCatPerms(channel.guild) })
            .then(cc => {
                sql("INSERT INTO sc_cats (id) VALUES (" + connection.escape(cc.id) + ")", result => {	
                    if(childChannel) { // sets the new category as a channel parent - for the first channel that failed to fit in the previous category
                        childChannel.setParent(cc, { lockPermissions: false }).catch(err => { 
                            logO(err); 
                            sendError(channel, err, "Could not assign parent to SC!");
                        });
                    }
                    // continue with a specified callback
                    res(cc);
                    // cache the current sc categories
                    getSCCats();
                }, () => {
                    channel.send("⛔ Database error. Unable to save SC category!"); 
                });
            }).catch(err => { 
                logO(err); 
                sendError(channel, err, "Could not create SC category");
            });
         });
	}
    	
	/**
    Get Secret Channel Category Permissions
    returns the default permissions for a secret channel category
    **/
	 this.getSCCatPerms = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]), getPerms(stats.sub, ["write"], ["read"]) ];
	}
    
        
}
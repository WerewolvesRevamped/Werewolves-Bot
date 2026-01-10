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
            // check status
            if(connectionShared && stats.automation_level > autoLvl.NONE) {
                let rDataShared = await sqlPromShared("SELECT * FROM roles WHERE name=" + connectionShared.escape(rName));
                switch(rDataShared[0].status) {
                    case "unknown": channel.send(`⚠️ List warning. The status of role \`${rName}\` is **unknown**. This means the role may not be formalized or may not work correctly. You can still start the game if you feel confident that the role will work or will otherwise ensure a smooth game.`); break;
                    case "manual": channel.send(`⚠️ List warning. The status of role \`${rName}\` is **manual**. This means that the way is formalized in a way that requires host intervention (e.g. the player may be prompted to contact Hosts for specific actions). Make sure you are aware of what is necessary to make this role work correctly.`); break;
                    case "unformalized": channel.send(`⚠️ List warning. The status of role \`${rName}\` is **unformalized**. This means no automation will be done for this role. You can still start the game, but you should be aware that all actions for this role will have to be handeled manually.`); break;
                    case "untested": channel.send(`⚠️ List warning. The status of role \`${rName}\` is **untested**. This means there have been changed to this role and the role has not been tested since then. It is advised that you run a test game with this role prior to using it ingame. You can still start the game, but be prepared for issues and manual intervention.`); break;
                    case "issue": channel.send(`⛔ List error. The status of role \`${rName}\` is **issue**. This means there are currently known issues with the role. You cannot start a game with this role while there are open unresolved issues.`); cancelStart = true; break;
                }
            }
        }
        
        // Full Automation Timing Checks
        if(stats.automation_level === autoLvl.FULL && !stats.phaseautoinfo) {
            channel.send("⛔ Command error. Cannot start a fully automated game without phase timings."); 
            cancelStart = true;
        }
        if(stats.automation_level === autoLvl.FULL && (!parseToFutureUnixTimestamp(stats.phaseautoinfo.d0) || isNaN(stats.phaseautoinfo.day) || isNaN(stats.phaseautoinfo.night) || stats.phaseautoinfo.day <= 2 || stats.phaseautoinfo.night <= 2)) {
            channel.send("⛔ Command error. Invalid phase timings."); 
            cancelStart = true;
        }
        
        // Gamephase Check
        if(!(stats.gamephase == gp.SETUP || stats.gamephase == gp.NONE)) {
            channel.send("⛔ Command error. Can't start the game unless gamephase is setup."); 
            cancelStart = true;
        }
        
        if(cancelStart) return false;
        return true;
    }
    
    
	/**
    Command: $start
    Starts the game
    */
    this.notStarted = false;
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
            let time = parseToFutureUnixTimestamp(stats.phaseautoinfo.d0);
            await setupSchedule(time);
            // start game with timestamp parameter
            notStarted = true;
            setTimeout(function() {
                eventStarting(time);
                notStarted = false;
            }, 1000 * 60);
        } else {
            // Start game
            notStarted = true;
            setTimeout(function() {
                eventStarting();
                notStarted = false;
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
                
                // check for modifiers
                let modifiers = await sqlPromEsc("SELECT * FROM modifiers WHERE id=", player.id);
                let modEmbedFields = [];
                if(modifiers.length > 0) {
                    let modDescs = [];
                    for(let i = 0; i < modifiers.length; i++) {
                        // get data
                        let modData = await sqlPromOneEsc("SELECT * FROM attributes WHERE name=", modifiers[i].name);
                        // format for channel/info
                        rolesName = modData.display_name + " " + rolesName;
                        modDescs.push([`Modifier - ${modData?.display_name ?? "??"}`, getEmoji(modData.name, false) + " " + modData?.desc_basics ?? "No info found"]);
                        // apply attribute
                        await createCustomAttribute(`role:${result[0].name}`, `player:${player.id}`, player.id, "player", "permanent", modData.name);
                        abilityLog(`✅ ${srcRefToText('player:' + player.id)} had ${modData.name} applied as a modifier.`);
                    }
                    // split a single section into several fields if necessary
                    for(let d in modDescs) {
                        let de = await applyPackLUT(modDescs[d][1], player.id);
                        modEmbedFields.push(...handleFields(applyETN(de, mainGuild), applyTheme(modDescs[d][0])));
                    }
                }
                
                // Send Role DM (except if in debug mode)
                if(!debug) await createSCs_sendDM(channel.guild, player.id, roleData, disName, false, modEmbedFields.length > 0 ?  rolesName : false)
                    
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
                    cmdInfo(sc, player.id, [ rolesNameBot ], true, false, false, modEmbedFields.length > 0 ? rolesName : false, modEmbedFields);
                    
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
    this.createSCs_sendDM = async function(guild, playerID, role, disName, restart = false, overwriteRoleName = false) {
        return new Promise(res => {
            // Build the role name
            let roleName = role.display_name;
            if(overwriteRoleName) roleName = overwriteRoleName;
            
            // Get role data for the first role
            let roleData = getRoleData(role.display_name, role.class, role.category, role.team);
            
            // Get basic embed
            let embed = getBasicEmbed(guild);
            // Build the full embed
            delete embed.fields;
            embed.title = "The game has started!";
            if(restart) embed.title = "The game has restarted!";
            embed.description = "This message is giving you your role for the next game of " + guild.name + "!\n\nYour role is `" + roleName + "`.\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.\n\nIf you're confused about your role at all, then check #how-to-play on the discord, which contains a role book with information on all the roles in this game. If you have any questions about the game, ping @Host.";
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
/**
    Roles Module - Groups
    Handles functionality related to groups
**/
module.exports = function() {
    
	/**
    Command: $groups
    Handle groups command
    **/
	this.cmdGroups = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Groups Subcommand
			case "query": cmdGroupsQuery(message.channel); break;
			case "parse": cmdGroupsParse(message.channel); break;
            case "get": cmdGroupsGet(message.channel, args); break
			case "list": cmdGroupsList(message.channel); break;
			case "active": cmdGroupsActive(message.channel); break;
			case "delete": cmdGroupsDelete(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $groups get
    Gets a specific group.
    **/
    this.cmdGroupsGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyGroup(args[1])) {
			channel.send("⛔ Command error. Invalid group `" + args[1] + "`!"); 
			return; 
		}
        // Get all groups values
        sql("SELECT * FROM `groups` WHERE name = " + connection.escape(args[1]), async result => {
            result = result[0];
            // get the basic embed
             var embed = await getBasicEmbed(channel.guild);
             // set embed title
            embed.author = { name: result.display_name };
            
            // get lut icon if applicable
            let lutval = applyLUT(result.name);
            if(!lutval) lutval = applyLUT(result.display_name);
            if(lutval) { // set icon and name
                //console.log(`${iconRepoBaseUrl}${lutval}`);
                embed.thumbnail = { "url": `${iconRepoBaseUrl}${lutval}.png` };
                embed.author.icon_url = `${iconRepoBaseUrl}${lutval}.png`;
            } 
            
            // Add a field for every role value
            for(attr in result) {
                embed.fields.push({ "name": toTitleCase(attr), "value": (result[attr]+"").substr(0, 1000) + ((result[attr]+"").length > 1000 ? " **...**" : "") });
            }
            
            // Send the embed
            channel.send({ embeds: [ embed ] }); 
        });
    }
    
    /**
    Command: $groups list
    Lists all groups
    **/
	/* Lists all groups names */
	this.cmdGroupsList = function(channel) {
		// Get all groups
		sql("SELECT * FROM `groups` ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one group exists
				channel.send("✳️ Sending a list of currently existing groups:");
				// Send message
				chunkArray(result.map(group => {
                    let emoji = getLUTEmoji(group.name, group.display_name);
                    return `**${emoji} ${toTitleCase(group.display_name)}** (${toTitleCase(group.team)})`;
                }), 20).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No groups exist
				channel.send("⛔ Database error. Could not find any groups!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for group list!");
		});
	}
    
    /**
    Command: $groups active
    Lists active group instances
    **/
	/* Lists all groups names */
	this.cmdGroupsActive = function(channel) {
		// Get all groups
		sql("SELECT * FROM active_groups ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳️ Sending a list of currently existing active group instances:");
				// Send message
				chunkArray(result.map(group => {
                    return `\`${group.ai_id}\`: **${toTitleCase(group.name)}** (<#${group.channel_id}>)`;
                }), 20).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No groups exist
				channel.send("⛔ Database error. Could not find any active group instances!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for active group instance list!");
		});
	}
    
    /**
    Command: $groups delete
    Deletes an active group instances
    **/
	/* Lists all groups names */
	this.cmdGroupsDelete = function(channel, args) {
		if(!args[1]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		} else if(isNaN(args[1])) {
			channel.send("⛔ Command error. Invalid group instance id `" + args[1] + "`!"); 
			return; 
		}
        
		// Get all groups
		sql("DELETE FROM active_groups WHERE ai_id=" + connection.escape(args[1]), result => {
            channel.send("✅ Deleted active group instance.");
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't delete active group instance!");
		});
	}
    
    /**
    Groups: Reset
    resets all active groups
    **/
    this.groupsReset = function() {
		// Reset active Group Database
		sql("DELETE FROM active_groups");
    }
    
    /** PUBLIC
    Get group data
    **/
    this.groupGetData = function(groupName) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(groupName), result => {
                res(result[0]);
            });
        });
    }
    
    /** PUBLIC
    Get group members
    **/
    this.groupGetMembers = function(groupName) {
        return sqlPromEsc("SELECT players.id FROM players JOIN active_attributes ON active_attributes.owner=players.id WHERE players.type='player' AND players.alive=1 AND active_attributes.attr_type='group_membership' AND active_attributes.val1=", groupName);
    }
    
    this.groupGetMembersAll = function(groupName) {
        return sqlPromEsc("SELECT players.id FROM players JOIN active_attributes ON active_attributes.owner=players.id WHERE players.type='player' AND active_attributes.attr_type='group_membership' AND active_attributes.val1=", groupName);
    }
    
    
    /** PUBLIC
    group update handler
    **/
    this.updateGroups = async function() {
        let toBeDisbanded = await sqlProm("SELECT name FROM active_groups WHERE disbanded=0 AND name NOT IN (SELECT DISTINCT val1 FROM active_attributes WHERE attr_type='group_membership' AND alive=1 AND val2 <> 'visitor')");
        
        let toBeReopened = await sqlProm("SELECT name FROM active_groups WHERE disbanded=1 AND name IN (SELECT DISTINCT val1 FROM active_attributes WHERE attr_type='group_membership' AND alive=1 AND val2 <> 'visitor')");
        
        for(let i = 0; i < toBeDisbanded.length; i++) {
            await groupsDisband(toBeDisbanded[i].name);
        }
        
        for(let i = 0; i < toBeReopened.length; i++) {
            await groupsReopen(toBeReopened[i].name);
        }
        
    }
    
    /**
    Groups: Join
    joins a group, creating it, if it doesnt exist
    takes a target id and a group name
    **/
    this.groupsJoin = async function(target, group) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(group), async result => {
                if(result && result[0]) {
                    // group exists, add target to group
                    let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                    
                    groupChannel.permissionOverwrites.create(target, { ViewChannel: true}).then(sc => {
                        let embed = basicEmbed(`<@${target}> has joined <#${groupChannel.id}>.`, EMBED_GREEN);
                        groupChannel.send(embed);
                        res();
                    }).catch(async err => { 
                        logO(err); 
                        let embed = basicEmbed(`Failed to add <@${target}> to <#${groupChannel.id}>.`, EMBED_RED);
                        groupChannel.send(embed);
                        res();
                    });	
                } else {
                    // group doesnt exist, create it
                    await groupsCreate(group, target); 
                    res();
                }
            });
        });
    }
    
    /**
    Groups: Leave
    leave a group
    takes a target id and a group name
    **/
    this.groupsLeave = async function(target, group) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(group), async result => {
                if(result && result[0]) {
                    // group exists, add target to group
                    let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                    groupChannel.permissionOverwrites.cache.get(target).delete().then(sc => {
                        let embed = basicEmbed(`<@${target}> has left <#${groupChannel.id}>.`, EMBED_RED);
                        groupChannel.send(embed);
                        res();
                    }).catch(async err => { 
                        // Failure, Create a new SC Cat first
                        logO(err); 
                        let embed = basicEmbed(`Failed to remove <@${target}> from <#${groupChannel.id}>.`, EMBED_RED);
                        groupChannel.send(embed);
                        res();
                    });	
                } else {
                    // group doesnt exist, create it
                    await groupsCreate(group, target); 
                    res();
                }
            });
        });
    }
    
    /**
    Groups: Send
    sends a message in a group that already exists
    Replaces $name with the channel name link
    **/
    this.groupsSend = async function(group, message) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(group), async result => {
                if(result && result[0]) {
                    // group exists, add target to group
                    let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                    let msg = message.replace(`\$name`, `<#${groupChannel.id}>`);
                    groupChannel.send(`${msg}`);
                }
            });
        });
    }
    
    /** Groups: Create
    creates a group, takes a group name and optional first member id
    **/
    this.groupsCreate = async function(group, firstMember = null) {
        return new Promise(async res => {
            // Determine channel name
            let channelName = group.substr(0, 100);
            channelName = applyTheme(channelName);
            
            // get base sc permissions
            let scPerms = getSCCatPerms(mainGuild);
            
            // if a first member is specified, grant them permissions to the channel
            if(firstMember) {
                scPerms.push(getPerms(firstMember, ["history", "read"], []));
            }
            
            // get last sc cat
            let category = await mainGuild.channels.fetch(cachedSCs[cachedSCs.length - 1]);
            
            // Create SC channel
            mainGuild.channels.create({ name: channelName, type: ChannelType.GuildText,  permissionOverwrites: scPerms })
            .then(async sc => {
                // Create a default connection with the groups name
                connectionAdd(sc.id, group);
                // Send info message for each role
                let infoEmbed = await getGroupEmbed(group, ["basics","details"], mainGuild);
                sendEmbed(sc, infoEmbed, true);

                // Move into sc category
                sc.setParent(category,{ lockPermissions: false }).then(m => {
                    // Success continue as usual
                }).catch(async err => { 
                    // Failure, Create a new SC Cat first
                    logO(err); 
                    await createNewSCCat(channel, sc);
                });	
                
                // announce new group
                if(firstMember) {
                    let embed = basicEmbed(`<@${firstMember}> has created <#${sc.id}>.`, EMBED_GREEN);
                    sc.send(embed);
                } else {
                    let embed = basicEmbed(`<#${sc.id}> has been created.`, EMBED_GREEN);
                    sc.send(embed);
                }
                
                // save group in DB
                await sqlProm("INSERT INTO active_groups (name, channel_id) VALUES (" + connection.escape(group) + "," + connection.escape(sc.id) + ")");
                
                // run group starting trigger
                await triggerGroup(sc.id, "Starting");
                
                // end of create channel callback
                res();
            });
        });
        
    }
    
    
}
/*
	Module for CCs & SCs
		- Creates ccs
		- Checks if something is a cc
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
module.exports = function() {
    
    /**
    Permissions
    **/
    this.CC_PERMS_MEMBER = { ViewChannel: true };
    this.CC_PERMS_OWNER = { ViewChannel: true, ReadMessageHistory: true };
    this.CC_PERMS_LOCKED = { ViewChannel: true, ReadMessageHistory: null, SendMessages: false };
    this.CC_PERMS_VIEWER = { ViewChannel: true, SendMessages: false };
    this.CC_PERMS_NONE = null;
    this.CC_PERMS_MEMBER_ROLE = { ViewChannel: false, SendMessages: true };
    this.CC_PERMS_MEMBER_NONE= { };
    
    
	/**
    Command: $cc
    The CC command
    **/
	this.cmdCC = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send(cmdHelp(message.channel, member, ["cc"]));
			return; 
		} else if(stats.gamephase != gp.INGAME && args[0] != "cleanup") { 
			message.channel.send("⛔ Command error. Can only use CCs while a game is running."); 
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
			case "ghostify": if(checkGM(message)) cmdCCGhostify(message.channel, message.member, 0); break;
			case "create_multi": cmdCCCreateMulti(message.channel, message.member, argsX, 0); break;
			case "create_multi_hidden": cmdCCCreateMulti(message.channel, message.member, argsX, 1); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}

	/**
    Command: $cc add
    Adds somebody/several people to a cc
    **/
	this.cmdCCAdd = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        // Check if owner
		if(!isCCOwner(channel, member) && !mode && !isGameMaster(member, true)) {
			channel.send("⛔ Command error. You are not an owner of this CC!");
            return;
        }
        
        // get list of new members
		let players = parseUserList(args, 1, channel, member, isGhost(member) ? "ghost" : "participant");
        if(!players) players = [];
        players = players.filter(el => !isCCMember(channel, el));
        // add members if at least one exists
        if(players && players.length > 0) {
            // add members
            players.forEach(async el => { 
                let result = await channelSetPermission(channel, el, CC_PERMS_MEMBER);
                if(result && !mode) channel.send(`✅ Added ${channel.guild.members.cache.get(el)} to the CC!`); 
                let mentor = await getMentor(el); 
                if(mentor) channelSetPermission(channel, mentor, CC_PERMS_VIEWER);
            });
        } else {
            channel.send("⛔ Command error. No valid players, that are not part of this CC already, were provided!");
        }
	}
    
    /**
    Command: $cc remove
    Removes somebody/several people from a cc
    **/
	this.cmdCCRemove = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        // Check if owner
		if(!isCCOwner(channel, member) && !mode && !isGameMaster(member, true)) {
			channel.send("⛔ Command error. You are not an owner of this CC!");
            return;
        }
        
        // get list of members to remove
		let players = parseUserList(args, 1, channel, member, isGhost(member) ? "ghost" : "participant");
        if(!players) players = [];
        players = players.filter(el => isCCMember(channel, el) && !isCCOwner(channel, el));
        // remove members if at least one exists
        if(players && players.length > 0) {
            // set permissions to member
            players.forEach(async el => { 
                let result = await channelSetPermission(channel, el, CC_PERMS_NONE);
                if(result && !mode) channel.send(`✅ Removed ${channel.guild.members.cache.get(el)} from the CC!`);
                let mentor = await getMentor(el); 
                if(mentor) channelSetPermission(channel, mentor, CC_PERMS_NONE);
            });
        } else {
            channel.send("⛔ Command error. No valid players, that are part of this CC and not an owner, were provided!");
        }
	}
    
	/**
    Command: $cc promote
    Sets the permissions of other users to owner
    **/
	this.cmdCCPromote = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        // Check if owner
		if(!isCCOwner(channel, member) && !mode && !isGameMaster(member, true)) {
			channel.send("⛔ Command error. You are not an owner of this CC!");
			return;
        }
        
        // get list of members to promote
		let players = parseUserList(args, 1, channel, member, isGhost(member) ? "ghost" : "participant");
        if(!players) players = [];
        players = players.filter(el => isCCMember(channel, el) && !isCCOwner(channel, el));
        // remove members if at least one exists
        if(players && players.length > 0) {
            // set permissions to owner
            players.forEach(async el => { 
                let result = await channelSetPermission(channel, el, CC_PERMS_OWNER);
                if(result && !mode) channel.send(`✅ Promoted ${channel.guild.members.cache.get(el)}!`);
            });
        } else {
            channel.send("⛔ Command error. No valid players, that are part of this CC and not already an owner, were provided!");
        }
	}
    
	/**
    Command: $cc demote
    Sets the permissions of other users to member
    **/
	this.cmdCCDemote = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        // Check if owner
		if(!isCCOwner(channel, member) && !mode && !isGameMaster(member, true)) {
			channel.send("⛔ Command error. You are not an owner of this CC!");
			return;
        }
        
        // get list of members to demote
		let players = parseUserList(args, 1, channel, member, isGhost(member) ? "ghost" : "participant");
        if(!players) players = [];
        players = players.filter(el => isCCMember(channel, el) && isCCOwner(channel, el));
        // remove members if at least one exists
        if(players && players.length > 0) {
            // set permissions to member
            players.forEach(async el => { 
                let result = await channelSetPermission(channel, el, CC_PERMS_MEMBER);
                if(result && !mode) channel.send(`✅ Demoted ${channel.guild.members.cache.get(el)}!`);
            });
        } else {
            channel.send("⛔ Command error. No valid players, that are part of this CC and an owner, were provided!");
        }
	}
    
    /**
    Command: $cc leave
    Removes yourself from a cc
    **/
	this.cmdCCLeave = async function(channel, member) {
		// Check if CC
		if(!isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        
        // check if an owner remains
        let members = getChannelMembers(channel);
        let owners = getChannelOwners(channel);
        let filteredOwners = owners.filter(el => el != member.id);
        if(owners.length > 0 && filteredOwners == 0 && members.length > 1) {
            channel.send(`⛔ Cannot leave a CC with members while there is not another owner!`);
            return;
        }
        
		// Remove permissions
        let result = await channelSetPermission(channel, member.id, CC_PERMS_NONE);
        if(result) channel.send(`✅ ${member} left the CC!`);
        
        let mentor = await getMentor(member.id);
        if(mentor) channelSetPermission(channel, mentor, CC_PERMS_VIEWER);
	}
	
    
    /**
    Command: $cc rename
    Renames a cc
    **/
	this.cmdCCRename = function(channel, member, args, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        // Check if owner
		if(!isCCOwner(channel, member) && !mode && !isGameMaster(member, true)) {
			channel.send("⛔ Command error. You are not an owner of this CC!");
			return;
        }
        
        // clean cc name
        let name = cleanCCName(args[1]);
        
        // make sure to keep haunted symbol
        if(channel.name.split("-")[0] === "👻") name = "👻-" + name;
        
        // rename cc
        channelRename(channel, name, false, channel.name);
    }
    
	/**
    Command: $cc archive
    Archives a cc
    **/
	this.cmdCCArchive = function(channel, member, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        // Check if owner
		if(!isCCOwner(channel, member) && !mode && !isGameMaster(member, true)) {
			channel.send("⛔ Command error. You are not an owner of this CC!");
			return;
        }
        
        // rename channel
        channelRename(channel, `🔒-${channel.name}`, true);
        // set permissions
        let ccList = getChannelMembers(channel);
        ccList.forEach(el => {
            channelSetPermission(channel, el, CC_PERMS_LOCKED);
        });
        if(!mode) channel.send("✅ Archived channel!");
	}
    
    
	/**
    Command: $cc ghostify
    Ghostifies a cc
    **/
	this.cmdCCGhostify = function(channel, member, mode) {
		// Check if CC
		if(!mode && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
        // Check if owner
		if(!isCCOwner(channel, member) && !mode && !isGameMaster(member, true)) {
			channel.send("⛔ Command error. You are not an owner of this CC!");
			return;
        }
        
        // rename channel
        channelRename(channel, `👻-${channel.name}`, true);
        // set permissions
        channelSetPermission(channel, channel.guild.roles.cache.get(stats.ghost), CC_PERMS_MEMBER_ROLE);
        channelSetPermission(channel, channel.guild.roles.cache.get(stats.participant), CC_PERMS_MEMBER_NONE);
        if(!mode) channel.send("👻 Ghostified channel!");
	}
    
    /**
    Command: $cc list / $cc owners
    Lists cc members / owners
    **/
	this.cmdCCList = function(channel, mode, mode2 = 0) {
		// Check if CC
		if(!mode2 && !isCC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a CC!");
			return;
		}
		// Get lists
        let ccMembers = getChannelMembers(channel);
        let ccOwners = getChannelOwners(channel);
        // Shuffle lists
        ccMembers = shuffleArray(ccMembers);
        ccOwners = shuffleArray(ccOwners);
        // Get totals
        let memberCount = ccMembers.length;
        let ownerCount = ccOwners.length;
        // Format lists
        ccMembers = ccMembers.map(el => channel.guild.members.cache.get(el)).join("\n");
        ccOwners = ccOwners.map(el => channel.guild.members.cache.get(el)).join("\n");
		// Choose messages		
		switch(mode) {
			case 0: // $cc create
                channel.send(`${ccOwners} has created a new CC!\n\n**CC Members** | Total: ${memberCount}\n${ccMembers}`);
            break; // $cc create_hidden / $cc spam
			case 1: case 4:
                channel.send(`A new CC has been created!\n\n**CC Members** | Total: ${memberCount}\n${ccMembers}`);
            break;
			case 2: // $cc list
                channel.send("✳ Listing CC members")
                .then(m => { m.edit(`**CC Members** | Total: ${memberCount}\n${ccMembers}`); })
                .catch(err => {logO(err); sendError(channel, err, "Could not list CC members"); });
            break;
			case 3: // $cc owners
                channel.send("✳ Listing CC owners")
                .then(m => { m.edit(`**CC Owners** | Total: ${ownerCount}\n${ccOwners}`); })
                .catch(err => {logO(err); sendError(channel, err, "Could not list CC owners"); });
            break;
		}
		
	}
    
    /**
    Command: $cc create_multi
    Creates several ccs
    **/
	this.cmdCCCreateMulti = function(channel, member, args, type) {
        let ccs = args.join(" ").split("~").splice(1).map(el => ("create " + el).split(" ")).splice(0, emojiIDs.length + 1);
		createOneMultiCC(channel, member, ccs, type, 0);
	}
	
	this.createOneMultiCC = function(channel, member, ccs, type, index) {
		if(index >= ccs.length) {
			channel.send("✅ Successfully created " + ccs.length + " CCs!");
			return;
		}
		cmdCCCreate(channel, member, ccs[index], type, () => createOneMultiCC(channel, member, ccs, type, ++index));
	}
	
	/**
    Command: $cc cleanup
    Deletes all ccs
    **/
	this.cmdCCCleanup = async function(channel) {
        // get cc cats
        let ccCats = await sqlProm("SELECT id FROM cc_cats");
        
        // iterate cats
        for(let i = 0; i < ccCats.length; i++) {
            if(!channel.guild.channels.cache.get(ccCats[i].id)) continue;
            // get channels
            let catChannels = channel.guild.channels.cache.get(ccCats[i].id).children.cache.toJSON();
            // iterate channels and delete
            for(let j = 0; j < catChannels.length; j++) {
                await channel.guild.channels.cache.get(catChannels[j].id).delete();
            }
            // delete category
            await channel.guild.channels.cache.get(ccCats[i].id).delete();
            channel.send("✅ Successfully deleted a cc category!");
        }
        channel.send("✅ Successfully deleted ccs!");
        // Reset CC Count
        sqlSetStat(9, 0, result => {
            channel.send("✅ Successfully reset cc counter!");
        }, () => {
            channel.send("⛔ Database error. Could not reset cc counter!");
        });
        // Reset CC Cat Database
        await sqlProm("DELETE FROM cc_cats");
        channel.send("✅ Successfully reset cc cat list!");
        getCCCats();
	}
    
    /**
    Cleans a cc name, removing disallowed emojis
    **/
    this.cleanCCName = function(name) {
		name = name.replace(/🔒/,"lock");
		name = name.replace(/🤖/,"bot");
		name = name.replace(/👻/,"ghost");
        return name;
    }
    
    /**
    Command: $sc
    Command to manages scs
    **/
	this.cmdSC = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send(cmdHelp(channel, member, ["sc"]));
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
    
    /**
    Command: $sc add
    Adds somebody to a sc
    **/
    this.cmdSCAdd = function(channel, member, args) {
        cmdCCAdd(channel, member, args, 1);
        players = parseUserList(args, 1, channel, member);
        if(!players) players = [];
        players.forEach(p => channel.send(`**<@${p}> has been added to <#${channel.id}>.**`));
    }
    
    /**
    Command: $sc remove
    Removes somebody from a sc
    **/
    this.cmdSCRemove = function(channel, member, args) {
        cmdCCRemove(channel, member, args, 1);
        players = parseUserList(args, 1, channel, member);
        if(!players) players = [];
        players.forEach(p => channel.send(`**<@${p}> has been removed from <#${channel.id}>.**`));
    }
    
    /**
    Command: $sc clear
    Removes everyone from a sc
    **/
	this.cmdSCClear = function(channel) {
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
		// set permissions
        let ccList = getChannelMembers(channel);
        ccList.forEach(el => {
            channelSetPermission(channel, el, CC_PERMS_NONE);
        });
	}
	
    /**
    Command: $sc clean
    Removes everyone from a sc and bulkdeletes
    **/
	this.cmdSCClean = async function(channel) {
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
		// set permissions
        let ccList = getChannelMembers(channel);
        ccList.forEach(el => {
            channelSetPermission(channel, el, CC_PERMS_NONE);
        });
        // bulk delete
		let messages = await channel.messages.fetch();
        let first = messages.last();
        await channel.bulkDelete(messages);
	}
	
    /**
    Command: $sc change 
    Changes a sc to another role
    **/
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
        args.shift();
		channelRename(channel, args.join(" "));
		cmdInfo(channel, null, [args.join(" ")], true, true);
        channel.send(`**<@&${stats.participant}> Your channel has changed to \`${toTitleCase(args.join(" "))}\`.**`);
	}
    
    /**
    Gets channel permission overwrites
    **/
    this.getChannelPermissionOverwrites = function(channel) {
        return channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member);
    }

    /**
    Gets cc members
    **/
    this.getChannelMembers = function(channel) {
        let members = getChannelPermissionOverwrites(channel);
        return members.filter(el => el.allow > 0 && !(el.allow == 1024 && el.deny == 2048)).map(el => el.id);
    }
    
    /**
    Gets cc owners
    **/
    this.getChannelOwners = function(channel) {
        let owners = getChannelPermissionOverwrites(channel);
        return owners.filter(el => el.allow == 66560).map(el => el.id);
    }
    
    /**
    Checks if a member owns a specific channel
    **/
    this.isCCOwner = function(channel, member) {
		let ccOwner = getChannelOwners(channel);
        return ccOwner.includes(member.id ?? member); // checks either a discord member or an id directly
    }
    
    /**
    Checks if a member is a member of a specific channel
    **/
    this.isCCMember = function(channel, member) {
		let ccMember = getChannelMembers(channel);
        return ccMember.includes(member.id ?? member); // checks either a discord member or an id directly
    }
    
    /**
    Sets permissions for a member on a channel
    **/
    this.channelSetPermission = async function(channel, member, permission = null) {
        return new Promise(res => {
            if(!permission) { // if no permissions, then revoke
                let ow = channel.permissionOverwrites.cache.get(member);
                if(!ow) res(true);
                ow.delete()
                .then(() => {
                    res(true);
                })
                .catch(err =>  {
                    logO(err); 
                    sendError(channel, err, "Could not update channel permissions");
                    res(false);
                });
            } else { // otherwise grant permissions
            channel.permissionOverwrites.create(member, permission)
                .then(() => {
                    res(true);
                }).catch(err => { 
                    logO(err); 
                    sendError(channel, err, "Could not update channel permissions");
                    res(false);
                });
            }
        });
    }
    
    /**
    Renames a channel
    **/
    this.channelRename = function(channel, name, hidden = false, oldName = "") {
        // make sure length is valid
        name = name.substr(0, 100);
        // rename
        channel.edit({ name: name })
        .then(c => {
            if(!hidden) {
                if(oldName) c.send("✅ Renamed channel from `" + oldName + "` to `" + c.name + "`!");
                else c.send("✅ Renamed channel to `" + c.name + "`!");
            }
        })
        .catch(err => {
            // Permission error
            logO(err); 
            sendError(channel, err, "Could not rename channel");
        });
    }
    
    /**
    Cache CC Categories
    **/
	this.cachedCCs = [];
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
    
	/**
    Checks if something is a cc
    */
	this.isCC = function(channel) {
		return !channel.parent ? true : cachedCCs.includes(channel.parentId);
	}
    
	/**
    CC (Category) Permissions
    Returns default CC permissions
    */
	this.getCCCatPerms = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]), getPerms(stats.sub, ["write"], ["read"]) ];
	}
    
	/**
    CC (Category) Permissions (Ghostly)
    Returns default CC permissions  for ghostly ccs
    */
	this.getCCCatPermsGhostly = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.ghost, ["write"], ["read"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]), getPerms(stats.sub, ["write"], ["read"]) ];
	}
    
}
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
        channelRename(channel, name);
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
    Cleans a cc name, removing disallowed emojis
    **/
    this.cleanCCName = function(name) {
		name = name.replace(/🔒/,"lock");
		name = name.replace(/🤖/,"bot");
		name = name.replace(/👻/,"ghost");
        return name;
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
    this.channelRename = function(channel, name, hidden = false) {
        // make sure length is valid
        name = name.substr(0, 100);
        // rename
        channel.edit({ name: name })
        .then(c => {
            if(!hidden) c.send("✅ Renamed channel to `" + c.name + "`!");
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
    
}
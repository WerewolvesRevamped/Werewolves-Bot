/*
	Module for CCs 
		- Creates ccs
		- Checks if something is a cc
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
module.exports = function() {

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
        }
        
        // get list of new members
        let players = parseUserList(channel, args, 1, member);
        // add members if at least one exists
        if(players && players.length > 0) {
            players = players.filter(el => !isCCMember(channel, el));
            channelAddMembers(channel, players);
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
        }
        
        // get list of members to remove
        let players = parseUserList(channel, args, 1, member);
        // remove members if at least one exists
        if(players && players.length > 0) {
            players = players.filter(el => !isCCMember(channel, el));
            channelRemoveMembers(channel, players);
        } else {
            channel.send("⛔ Command error. No valid players, that are not part of this CC already, were provided!");
        }
	}
	
    /**
    Checks if a member owns a specific channel
    **/
    this.isCCOwner = function(channel, member) {
		let ccOwner = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
        return ccOwner.includes(member.id)
    }
    
    /**
    Checks if a member is a member of a specific channel
    **/
    this.isCCMember = function(channel, member) {
		let ccMember = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow > 0).map(el => el.id);
        return ccMember.includes(member.id)
    }
    
    /**
    Adds one or more members to a channel
    **/
    this.channelAddMembers = function(channel, members, hidden = false) {
        members.forEach(el => { 
            channel.permissionOverwrites.create(el, { ViewChannel: true}).then(c => {
                if(!hidden) channel.send(`✅ Added ${channel.guild.members.cache.get(el)} to the CC!`);
            }).catch(err => { 
                logO(err); 
                sendError(channel, err, "Could not add to CC");
            });
        });
    }
    
    /**
    Removes one or more members from a channel
    **/
    this.channelRemoveMembers = function(channel, members, hidden = false) {
        members.forEach(el => { 
            channel.permissionOverwrites.cache.get(el).delete().then(() => {
                if(!hidden) channel.send(`✅ Removed ${channel.guild.members.cache.get(el)} from the CC!`);
            }).catch(err => { 
                logO(err); 
                sendError(channel, err, "Could not remove from CC");
            });
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
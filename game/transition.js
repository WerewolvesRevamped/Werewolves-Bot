/**
	Game Module - Transition
	Handles promotions and demotions between different gm roles
*/
module.exports = function() {

    /**
    Command: $force_demote_all / $force_demote_signedup
    Demotes all (signed/subbed/mentored up) gms, helpers, admins, senior gms, except for hosts
    **/
    this.cmdForceDemote = function(channel, all = true) {
        // demotable
        let admins = channel.guild.roles.cache.get(stats.admin).members.toJSON();
        let seniorgms = channel.guild.roles.cache.get(stats.senior_gamemaster).members.toJSON();
        let gms = channel.guild.roles.cache.get(stats.gamemaster).members.toJSON();
        let helpers = channel.guild.roles.cache.get(stats.helper).members.toJSON();
        // ignore
        let host = channel.guild.roles.cache.get(stats.host).members.toJSON();
        let ignore = host.map(el => el.id);
        // filter
        let signedup = channel.guild.roles.cache.get(stats.signed_up).members.toJSON();
        let substitute = channel.guild.roles.cache.get(stats.sub).members.toJSON();
        let mentor = channel.guild.roles.cache.get(stats.mentor).members.toJSON();
        let filter = signedup.map(el => el.id);
        filter.push(...substitute.map(el => el.id));
        filter.push(...mentor.map(el => el.id));
        // list
        let processedIds = [];
        //
        // list list
        let demotable = [admins, seniorgms, gms, helpers];
        for(let i = 0; i < demotable.length; i++) {
            for(let j = 0; j < demotable[i].length; j++) {
                let curid = demotable[i][j].id;
                if(processedIds.includes(curid)) { // already previously handeled
                    continue;
                }
                processedIds.push(curid); // save as processed
                if(ignore.includes(curid)) { // is host, ignore
                    //console.log(`FD ignore: ${demotable[i][j].displayName}`);
                    continue;
                }
                if(all || filter.includes(curid)) { // only demote signedup if all=false
                    //console.log(`FD demote: ${demotable[i][j].displayName}`);
                    cmdDemote(channel, demotable[i][j]);
                } else {
                    //console.log(`FD filtered out: ${demotable[i][j].displayName}`);
                }
            }
        }
    }
    
    /**
    Command: $demote
    Replaces all GM roles with Ingame variants
    **/
	this.cmdDemote = function(channel, member) {
		channel.send("✅ Attempting to demote you, " + member.displayName + "!");
        switchRolesX(member, channel, stats.gamemaster_ingame, stats.gamemaster, "gamemaster ingame", "gamemaster");
        switchRolesX(member, channel, stats.senior_gamemaster_ingame, stats.senior_gamemaster, "senior gamemaster ingame", "senior gamemaster");
        switchRolesX(member, channel, stats.admin_ingame, stats.admin, "admin ingame", "admin");
        switchRolesX(member, channel, stats.helper_ingame, stats.helper, "helper ingame", "helper");
	}
	
    /**
    Command: $promote
    Replaces all GM ingame roles with the proper variants
    **/
	this.cmdPromote = function(channel, member) {
		if((isParticipant(member) || isGhost(member)) && !member.roles.cache.get(stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a participant."); 
			return;
		}
        if(isDeadParticipant(member) && !member.roles.cache.get(stats.senior_gamemaster_ingame) && !member.roles.cache.get(stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a dead participant."); 
			return;
		}
		channel.send("✅ Attempting to promote you, " + member.displayName + "!");
        switchRoles(member, channel, stats.gamemaster_ingame, stats.gamemaster, "gamemaster ingame", "gamemaster");
        switchRoles(member, channel, stats.senior_gamemaster_ingame, stats.senior_gamemaster, "senior gamemaster ingame", "senior gamemaster");
        switchRoles(member, channel, stats.admin_ingame, stats.admin, "admin ingame", "admin");
        switchRoles(member, channel, stats.helper_ingame, stats.helper, "helper ingame", "helper");
	}

	/**
    Command: $unhost
    Removes Host role
    **/
	this.cmdUnhost = function(channel, member) {
		channel.send("✅ Attempting to unhost you, " + member.displayName + "!");
		if(isHost(member)) {
            removeRoleRecursive(member, channel, stats.host, "host");
		}
	}
	
    /**
    Command: $host
    Adds host role
    **/
	this.cmdHost = function(channel, member) {
		if(isParticipant(member) || isGhost(member) || isDeadParticipant(member)) {
			channel.send("⛔ Command error. Can't host you while you're a participant."); 
			return;
		}
		channel.send("✅ Attempting to host you, " + member.displayName + "!");
		if(member.roles.cache.get(stats.gamemaster)) {
            addRoleRecursive(member, channel, stats.host, "host");
		}
	}
    
    /**
    Command: $demote_unhost ($v)
    Demotes or unhost based on current state
    **/
    this.cmdDemoteUnhost = function(channel, member) {
        if(isHost(member)) {
            cmdUnhost(channel, member);
        } else {
            cmdDemote(channel, member);
        }
    }
    
    /**
    Command: $promote_host ($^)
    Promotes or hosts based on current state
    **/
    this.cmdPromoteHost = function(channel, member) {
        if(member.roles.cache.get(stats.gamemaster_ingame) || member.roles.cache.get(stats.senior_gamemaster_ingame) || member.roles.cache.get(stats.admin_ingame) || member.roles.cache.get(stats.helper_ingame)) {
            cmdPromote(channel, member);
        } else {
            cmdHost(channel, member);
        }
    }
    
}
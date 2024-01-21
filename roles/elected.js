/**
    Roles Module - Elected
    Handles functionality related to elected roles
**/
module.exports = function() {
    
    /**
    Command: $elect
    Elects a player to an elected role
    **/
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
   
   /**
   Mayor Check
   Checks if mayor should be switched and performs the switch if necessary.
   **/
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
	
    
}
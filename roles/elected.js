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
    Reporter Message
    Sends a reporter message
    **/
    this.reporterMessage = function(player_id) {
        var reportMsg;
        // Get info
        sql("SELECT role FROM players WHERE id = " + connection.escape(player_id), result => {
            if(!result[0] || !result[0].role) { log("Cannot find role in reporterMessage"); return; }
            let rName = toTitleCase(result[0].role);
            let rEmoji = getRoleEmoji(rName);
            if(!rEmoji) rEmoji = "";
            // Send reporter message
            reportMsg = `<@${player_id}> was a \`${rName}\` ${rEmoji}`;
            connectionSend("reporter", reportMsg, "Reporter");
        }, () => {
            // Send reporter message
            reportMsg = "⛔ Database error. Could not generate report!";
            connectionSend("reporter", reportMsg, "Reporter");
        });
    }
	
    
}
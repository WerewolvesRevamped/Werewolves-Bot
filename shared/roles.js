/*
	Module for Shared Role Data
*/
module.exports = function() {
    
	/**
    Command: $status
    Handle status command
    **/
	this.cmdStatus = function(message, args) {
        if(!connectionShared) {
            message.channel.send("⛔ Syntax error. Unknown command `" + command + "`!");
        }
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Role Subcommand
			case "role": cmdStatusRole(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $status role
    Gets or sets the status for a role
    **/
    this.cmdStatusRole = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyRole(args[1])) {
			channel.send("⛔ Command error. Invalid role `" + args[1] + "`!"); 
			return; 
		}
        let rName = parseRole(args[1]);
        let validStates = ["unknown","issue","untested","tested","unformalized","manual"];
        if(!args[2]) {
            let rDataShared = await sqlPromShared("SELECT * FROM roles WHERE name=" + connectionShared.escape(rName));
            channel.send(`✅ Current status for \`${rName}\` is \`${rDataShared[0].status}\`!`); 
        } else {
            // parse state param
            args[2] = args[2].toLowerCase();
            let aliases = {
                unknown: ["uk", "unk"],
                issue: ["is"],
                untested: ["un", "unt"],
                tested: ["test", "tst", "te"],
                unformalized: ["uf", "unf"],
                manual: ["man", "ma"],
            }
            outer: for(let aliasGroup in aliases) {
                for(let i = 0; i < aliases[aliasGroup].length; i++) {
                    if(args[2] === aliases[aliasGroup][i]) {
                        args[2] = aliasGroup;
                        break outer;
                    }
                }
            }
            if(validStates.includes(args[2])) {
                let rDataShared = await sqlPromShared("UPDATE roles SET status=" + connectionShared.escape(args[2]) + " WHERE name=" + connectionShared.escape(rName));
                if(rDataShared && rDataShared.affectedRows === 1 && rDataShared.warningCount === 0) channel.send(`✅ Updated status for \`${rName}\` to \`${args[2]}\`!`); 
                else channel.send("⛔ Command error. Error occured while updating role!")
            } else {
                channel.send("⛔ Command error. Unknown status: `" + args[2] + "`. Must be one of: " + validStates.map(el => '`'+el+'`').join(", ") + "!"); 
            }
        }
    }
    
}
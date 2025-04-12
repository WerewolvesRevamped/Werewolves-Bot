/**
    Game Module - Host Information
    The module for implementing host information
**/
module.exports = function() {
    
    /**
    Command: $host_information
    **/
	this.cmdHostInformation = function(channel, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `host_information [add|list|remove]`!"); 
			return; 
		}
        
		// Check Subcommand
		switch(args[0]) {
			case "add": cmdHostInformationAdd(channel, args, argsX); break;
			case "list": cmdHostInformationList(channel); break;
			case "remove": cmdHostInformationRemove(channel, args); break;
			default: channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
    
    
    /**
    Command: $host_information list
    Lists all host information
    **/
	this.cmdHostInformationList = function(channel) {
		// Get all host information
		sql("SELECT * FROM host_information ORDER BY ai_id ASC", result => {
			if(result.length > 0) {
				// At least one HI exists
				channel.send("✳️ Sending a list of currently existing host information:");
				// Send message
				chunkArray(result.map(hi => {
                    return `${hi.ai_id} - <@${hi.id}> \`${hi.name}\`: \`${hi.value}\``;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No host info exist
				channel.send("⛔ Database error. Could not find any host information!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for host information list!");
		});
	}
    
    /**
    Command: $host_information add
    Registers a new host information
    **/
    this.cmdHostInformationAdd = async function(channel, args, argsX) {
		if(!args[1] || !args[2] || !args[3]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		}
        
        argsX.shift();
        argsX.shift();
        argsX.shift();
        let hi = argsX.join(" ");
        hi = hi.replace(/~/g,"\n")
        
        sql("INSERT INTO host_information (id, name, value) VALUES (" + connection.escape(args[1]) + "," + connection.escape(args[2]) + "," + connection.escape(hi) + ")", result => {
            channel.send(`✅ Set host information \`${args[2]}\` for <@${args[1]}> as \`${hi}\`.`);
        }, () => {
			channel.send("⛔ Database error. Couldn't register host information!");
        });
        
    }
    
    /**
    Command: $host_information remove
    Removes a host information
    **/
    this.cmdHostInformationRemove = async function(channel, args) {
		if(!args[1]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		}
        
        let existing = await sqlPromEsc("SELECT * FROM host_information WHERE ai_id=", args[1]);
        if(existing.length === 0) {
			channel.send("⛔ Database error. This host information cannot be found!"); 
			return; 
        }
        
        sql("DELETE FROM host_information WHERE ai_id=" + connection.escape(args[1]), result => {
            channel.send(`✅ Deleted host information \`${existing[0].name}\` for <@${existing[0].id}>.`);
        }, () => {
			channel.send("⛔ Database error. Couldn't delete host information!");
        });
        
    }
    
    /**
    Reset Host Information
    **/
    this.resetHostInformation = async function() {
        sql("DELETE FROM host_information");
    }
    
    /**
    Get host information
    **/
    this.getHostInformation = async function(player_id, hi_name) {
        let existing = await sqlPromEsc("SELECT * FROM host_information WHERE name=" + connection.escape(hi_name.toLowerCase()) + " AND id=", player_id);
        if(existing.length === 0) {
            abilityLog(`❗ **Error:** Cannot find host information \`${hi_name}\` for <@${player_id}>!`);
			return []; 
        } else if(existing.length > 1) {
            abilityLog(`❗ **Error:** Found several host information \`${hi_name}\` for <@${player_id}>!`);
			return []; 
        } else {
            return [ existing[0].value ];
        }
    }
    
}
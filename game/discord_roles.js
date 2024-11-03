/**
    Game Module - Discord Roles
    The module for implementing storing of discord roles
**/
module.exports = function() {
	
    this.cachedDR = null;
    
    /**
    Command: $dr
    discord role command
    **/
	this.cmdDR = function(channel, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `dr [register|list|delete]`!"); 
			return; 
		}
        
		// Check Subcommand
		switch(args[0]) {
			case "register": cmdDRRegister(channel, args); break;
			case "list": cmdDRList(channel); break;
			case "delete": cmdDRDelete(channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $dr list
    Lists all discord roles
    **/
	/* Lists all groups names */
	this.cmdDRList = function(channel) {
		// Get all groups
		sql("SELECT * FROM discord_roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one DR exists
				channel.send("✳️ Sending a list of currently existing discord roles:");
				// Send message
				chunkArray(result.map(dr => {
                    let emoji = getLUTEmoji(dr.name, toTitleCase(dr.name));
                    return `**${emoji} ${toTitleCase(dr.name)}:** <@&${dr.id}>`;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No groups exist
				channel.send("⛔ Database error. Could not find any discord roles!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for discord role list!");
		});
	}
    
    /**
    Command: $dr register
    Registers a new dr role
    **/
    this.cmdDRRegister = async function(channel, args) {
		if(!args[1] || !args[2]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		}
        
        let existing = await sqlPromEsc("SELECT ai_id FROM discord_roles WHERE id=", args[2]);
        if(existing.length > 0) {
			channel.send("⛔ Database error. This role is already registered!"); 
			return; 
        }
        
        sql("INSERT INTO discord_roles (name, id) VALUES (" + connection.escape(args[1]) + "," + connection.escape(args[2]) + ")", result => {
            channel.send(`✅ Registered <@&${args[2]}> as ${toTitleCase(args[1])}.`);
            cacheDR();
        }, () => {
			channel.send("⛔ Database error. Couldn't register discord role!");
        });
        
    }
    
    /**
    Command: $dr delete
    Deletes a dr role
    **/
    this.cmdDRDelete = async function(channel, args) {
		if(!args[1]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		}
        
        let existing = await sqlPromEsc("SELECT ai_id FROM discord_roles WHERE name=", args[1]);
        if(existing.length === 0) {
			channel.send("⛔ Database error. This role cannot be found!"); 
			return; 
        }
        
        sql("DELETE FROM discord_roles WHERE name=" + connection.escape(args[1]), result => {
            channel.send(`✅ Deleted ${toTitleCase(args[1])} from DR.`);
            cacheDR();
        }, () => {
			channel.send("⛔ Database error. Couldn't delete discord role!");
        });
        
    }
    
    /**
    Assign role by name
    **/
    this.assignDR = async function(player_id, name) {
        // get role
        let existing = await sqlPromEsc("SELECT * FROM discord_roles WHERE name=", name);
        if(existing.length === 0) { // if role doesn't exist, return
			return; 
        }
        
        // get member by id
        let member = mainGuild.members.cache.get(player_id);
        
        // add role
        member.roles.add(existing[0].id);
    }
    
    /**
    Unassign role by name
    **/
    this.unassignDR = async function(player_id, name) {
        // get role
        let existing = await sqlPromEsc("SELECT * FROM discord_roles WHERE name=", name);
        if(existing.length === 0) { // if role doesn't exist, return
			return; 
        }
        
        // get member by id
        let member = mainGuild.members.cache.get(player_id);
        
        // add role
        member.roles.remove(existing[0].id);
    }
    
    /**
    Caches DR
    **/
    this.cacheDR = async function() {
        // get role
        let drs = await sqlProm("SELECT * FROM discord_roles");
        cachedDR = drs.map(el => ({ name: el.name, id: el.id }));
    }
        
}
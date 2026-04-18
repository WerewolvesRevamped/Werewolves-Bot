/*
	Module for roles / role info
		- Set role name & aliases
		- Get role info
		- Create / Manage SCs
		- Distribute roles
*/
module.exports = function() {
    
    /**
    Command: $alias
    Handle aliases command
    **/
	this.cmdAlias = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Role Subcommand
			case "add": 
			case "set": cmdAliasSet(message.channel, args); break;
			case "remove": cmdAliasRemove(message.channel, args); break;
			case "clear": cmdConfirm(message, "alias clear"); break;
			case "list": cmdAliasList(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}

	/* Creates/Sets an alias */
	this.cmdAliasSet = async function(channel, args) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Delete old entries with same alias
		await sqlPromEsc("DELETE FROM roles_alias WHERE alias = ", args[1]);
        
        // Insert alias into db
        await sqlProm("INSERT INTO roles_alias (alias, name) VALUES (" + connection.escape(args[1]) + "," + connection.escape(parseRole(args[2])) + ")");
        channel.send("✅ Alias `" + toTitleCase(args[1]) + "` set to `" + toTitleCase(parseRole(args[2])) + "`!"); 
        cacheAliases();
	}
	
	/* Removes a role alias */
	this.cmdAliasRemove = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		await sqlPromEsc("DELETE FROM roles_alias WHERE alias = ", args[1]);
        channel.send("✅ Removed `" + toTitleCase(args[1]) + "`!");
        cacheAliases();
	}
	
	/* Lists all role aliases */
	this.cmdAliasList = async function(channel) {
		// Get all aliases
		let aliasList = await sqlProm("SELECT alias,name FROM roles_alias ORDER BY alias ASC");
        
        // no aliases
        if(aliasList.length <= 0) {
            channel.send("⛔ Database error. Could not find any role aliases!");
            return;
        }
        
        // list aliases
        channel.send("✳ Sending a list of currently existing role aliases:");
        let aliases = {};
        aliasList.forEach(el => {
            if(!aliases[el.name]) aliases[el.name] = [];
            aliases[el.name].push(el.alias);
        });
        let lines = [];
        Object.keys(aliases).map(alias => {
            lines.push("**" + toTitleCase(alias) + ":** " + aliases[alias].join(", "));
        });
        // For each alias send a message
        chunkArray(lines, 20).map(el => el.join("\n")).forEach(el => channel.send(el));
	}
	
	/* Removes all aliases */
	this.cmdAliasClear = async function(channel) {
		await sqlProm("DELETE FROM roles_alias");
        channel.send("✅ Successfully cleared aliases!");
        cacheAliases();
	}
    
	
}

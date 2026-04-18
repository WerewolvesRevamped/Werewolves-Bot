/**
    Game Module - Modifiers
    The module for implementing modifiers
**/
module.exports = function() {
    
    /**
    Command: $modifiers
    **/
	this.cmdModifiers = function(channel, args) {
		// Check subcommand
		if(!args[0]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `modifiers [add|list|remove]`!"); 
			return; 
		}
        
		// Check Subcommand
		switch(args[0]) {
			case "add": cmdModifiersAdd(channel, args); break;
			case "list": cmdModifiersList(channel); break;
			case "remove": cmdModifiersRemove(channel, args); break;
			default: channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
    
    
    /**
    Command: $modifiers list
    Lists all modifiers
    **/
	this.cmdModifiersList = async function(channel) {
		// Get all modifiers
		let result = await sqlProm("SELECT * FROM modifiers ORDER BY ai_id ASC");
        if(result.length <= 0) {
            // No modifier exist
            channel.send("⛔ Database error. Could not find any modifiers!");
            return;
        }
        // At least one modifier exists
        channel.send("✳️ Sending a list of currently existing modifiers:");
        
        let resultByPlayer = {};
        result.forEach(el => {
            if(!resultByPlayer[el.id]) resultByPlayer[el.id] = [];
            resultByPlayer[el.id].push(el);
        });
        // Send message
        chunkArray(Object.entries(resultByPlayer).map(val => {
            let mods = val[1].map(el => `(${el.ai_id}) \`${toTitleCase(el.name)}\` ${getLUTEmoji(el.name, el.name)}`);
            return `<@${val[0]}> - ${mods.join(", ")}`;
        }), 5).map(el => el.join("\n")).forEach(el => channel.send(el));
	}
    
    /**
    Command: $modifiers add
    Registers a new modifiers
    **/
    this.cmdModifiersAdd = async function(channel, args) {
		if(!args[1] || !args[2]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		} else if(!verifyAttribute(args[2])) {
			channel.send("⛔ Command error. Invalid modifier `" + args[2] + "`!"); 
			return; 
		}
        
        // Get user
		var user = parseUser(args[1], channel);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        
        try {
            await sqlProm("INSERT INTO modifiers (id, name) VALUES (" + connection.escape(user) + "," + connection.escape(args[2]) + ")");
            channel.send(`✅ Added modifier \`${args[2]}\` for <@${user}>.`);
        } catch (err) {
			channel.send("⛔ Database error. Couldn't register modifiers!");
        }
    }
    
    /**
    Command: $modifiers remove
    Removes a modifiers
    **/
    this.cmdModifiersRemove = async function(channel, args) {
		if(!args[1]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		}
        
        let existing = await sqlPromEsc("SELECT * FROM modifiers WHERE ai_id=", args[1]);
        if(existing.length === 0) {
			channel.send("⛔ Database error. This modifier cannot be found!"); 
			return; 
        }
        
        try {
            await sqlProm("DELETE FROM modifiers WHERE ai_id=", args[1]);
            channel.send(`✅ Deleted modifier \`${existing[0].name}\` for <@${existing[0].id}>.`);
        } catch (err) {
			channel.send("⛔ Database error. Couldn't delete modifiers!");
        }
    }
    
    /**
    Reset Modifiers
    **/
    this.resetModifiers = async function() {
        return sqlProm("DELETE FROM modifiers");
    }
    
    /**
    Get modifiers
    **/
    this.getModifiers = async function(player_id) {
        let mods = await sqlPromEsc("SELECT * FROM modifiers WHERE id=", player_id);
        if(mods.length === 0) {
			return []; 
        } else {
            return mods.map(el => el.name);
        }
    }
    
}
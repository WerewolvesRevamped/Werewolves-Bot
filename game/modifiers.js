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
	this.cmdModifiersList = function(channel) {
		// Get all modifiers
		sql("SELECT * FROM modifiers ORDER BY ai_id ASC", result => {
			if(result.length > 0) {
				// At least one modifier exists
				channel.send("✳️ Sending a list of currently existing modifiers:");
                
                let resultByPlayer = {};
                result.forEach(el => {
                    if(!resultByPlayer[el.id]) resultByPlayer[el.id] = [];
                    resultByPlayer[el.id].push(el);
                });
				// Send message
				chunkArray(Object.entries(resultByPlayer).map(val => {
                    let mods = val[1].map(el => `(${el.ai_id}) \`${toTitleCase(el.name)}\` ${getEmoji(el.name)}`);
                    return `<@${val[0]}> - ${mods.join(", ")}`;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No modifier exist
				channel.send("⛔ Database error. Could not find any modifiers!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for modifiers list!");
		});
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
        
        sql("INSERT INTO modifiers (id, name) VALUES (" + connection.escape(user) + "," + connection.escape(args[2]) + ")", result => {
            channel.send(`✅ Added modifier \`${args[2]}\` for <@${user}>.`);
        }, () => {
			channel.send("⛔ Database error. Couldn't register modifiers!");
        });
        
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
        
        sql("DELETE FROM modifiers WHERE ai_id=" + connection.escape(args[1]), result => {
            channel.send(`✅ Deleted modifier \`${existing[0].name}\` for <@${existing[0].id}>.`);
        }, () => {
			channel.send("⛔ Database error. Couldn't delete modifiers!");
        });
        
    }
    
    /**
    Reset Modifiers
    **/
    this.resetModifiers = async function() {
        sql("DELETE FROM modifiers");
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
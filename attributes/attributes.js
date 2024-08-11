/**
    Attributes Module - Main
    The module for implementing attributes
**/

require("./help.js")();

module.exports = function() {
    
    /**
    All valid duration types
    **/
    this.attributesValidDurationTypes = ["permanent","persistent","phase","nextday","nextnight","untiluse","untilseconduse","attribute","untiluseattribute"];
    const attributesNiceNames = ["Permanent", "Persistent", "Phase", "Next Day", "Next Night", "Until Use", "Until Second Use", "Attribute", "Until Use & Attribute"];
    
    this.getDurationName = function(attr) {
        let index = attributesValidDurationTypes.indexOf(attr);
        if(index >= 0) {
            return attributesNiceNames[index];
        } else {
            return "Unknown";
        }
    }
        
	/**
    Command: $attributes
    Handle attributes command
    **/
	this.cmdAttributes = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Attributea Subcommand
			case "active": cmdAttributesActive(message.channel); break;
			case "delete": cmdAttributesDelete(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
   
    /**
    Command: $attributes active
    Lists active group instances
    **/
	/* Lists all attribute names */
	this.cmdAttributesActive = function(channel) {
		// Get all attributes
		sql("SELECT * FROM active_attributes ORDER BY attr_type ASC", result => {
			if(result.length > 0) {
				// At least one attribute exists
				channel.send("✳️ Sending a list of currently existing active attributes instances:\nAI ID: AttrType - Owner (Duration) [Values] {Source}");
				// Send message
				chunkArray(result.map(attribute => {
                    return `\`${attribute.ai_id}\`: **${toTitleCase(attribute.attr_type)}** - <@${attribute.owner}> (~${toTitleCase(attribute.duration)}) [${attribute.val1};${attribute.val2};${attribute.val3};${attribute.val4}] {${toTitleCase(attribute.src_role)}:<@${attribute.src_player}>}`;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No attributes exist
				channel.send("⛔ Database error. Could not find any active attribute instances!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for active attribute instance list!");
		});
	}
    
    /**
    Command: $attributes delete
    Deletes an active attribute instances
    **/
	/* Lists all attributes names */
	this.cmdAttributesDelete = function(channel, args) {
		if(!args[1]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		} else if(isNaN(args[1])) {
			channel.send("⛔ Command error. Invalid attribute instance id `" + args[1] + "`!"); 
			return; 
		}
        
		// Get all attributes
		sql("DELETE FROM active_attributes WHERE ai_id=" + connection.escape(args[1]), result => {
            channel.send("✅ Deleted active attribute instance.");
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't delete active attribute instance!");
		});
	}
    
    /**
    Attributes: Reset
    resets all active attributes
    **/
    this.attributesReset = function() {
		// Reset active attributes Database
		sql("DELETE FROM active_attributes");
    }
    
    
    /**
    Create Attribute
    creates an attribute in the database
    **/
    this.createAttribute = async function(src_role, src_player, target_player, dur, attr_type, val1 = "", val2 = "", val3 = "", val4 = "") {
         return new Promise(res => {
            sql("INSERT INTO active_attributes (owner, src_role, src_player, attr_type, duration, val1, val2, val3, val4) VALUES (" + connection.escape(target_player) + "," + connection.escape(src_role) +  "," + connection.escape(src_player) + "," + connection.escape(attr_type) + "," + connection.escape(dur) +  "," + connection.escape(val1) +  "," + connection.escape(val2) +  "," + connection.escape(val3) +  "," + connection.escape(val4) + ")", result => {
                res();
            });
         });
    }
    
    /**
    Create Disguise Attribute
    creates a disguise attribute with a specific role and strength
    **/
    this.createDisguiseAttribute = async function(src_role, src_player, target_player, dur, disguise_role = "citizen", disguise_strength = "weak") {
        await createAttribute(src_role, src_player, target_player, dur, "disguise", disguise_role, disguise_strength);
    }
    
    /**
    Create Defense Attribute
    creates a defense attribute with a specific defense and killing subtype, a selector for affected players and a phase
    **/
    this.createDefenseAttribute = async function(src_role, src_player, target_player, dur, def_subtype = "passive", kill_subtype = "all", affected = "@All", phase = "both") {
        await createAttribute(src_role, src_player, target_player, dur, "defense", def_subtype, kill_subtype, affected, phase);
    }
    
    /**
    Create Manipulation Attribute
    creates a manipulation attribute with a specific manipulation subtype and a value for the manipulation
    **/
    this.createManipulationAttribute = async function(src_role, src_player, target_player, dur, subtype = "public voting power", val = 1) {
        await createAttribute(src_role, src_player, target_player, dur, "manipulation", subtype, val);
    }
    
    /**
    Create Group Membership Attribute
    creates a group membership attribute with a specific group name and group membership type
    **/
    this.createGroupMembershipAttribute = async function(src_role, src_player, target_player, dur, name = "#Wolfpack", membership_type = "member") {
        await createAttribute(src_role, src_player, target_player, dur, "group_membership", name, membership_type);
    }
    
    /**
    Create Obstruction Attribute
    creates an obstruction attribute with specific affected abilities and obstruction feedback
    **/
    this.createObstructionAttribute = async function(src_role, src_player, target_player, dur, affected_abilities = "", feedback = "") {
        await createAttribute(src_role, src_player, target_player, dur, "obstruction", affected_abilities, feedback);
    }
    
    /**
    Checks if a attribute column name is valid**/
    function isValidAttributeColumnName(name) {
        return ["owner","src_role","src_player","attr_type","duration","val1","val2","val3","val4"].includes(name);
    }
    
    function validateAttributeColumnName(name) {
        if(isValidAttributeColumnName(name)) {
            return true;
        } else {
            abilityLog(`❗ **Error:** Unexpected attribute query column \`${name}\`!`);  
            return false;
        }
    }
    
    /**
    Attribute Query for Player
    queries an attribute for a specific player
    **/
    this.queryAttributePlayer = async function(player, column, val, column2 = null, val2 = null) {
        if(column2) return await twoColumnQuery(player, column, val, column2, val2);
        else return await twoColumnQuery(player, column, val);
    }
    
    async function singleColumnQuery(player, column, val) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        // query attribute
        return new Promise(res => {
             sql("SELECT * FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " ORDER BY ai_id ASC", result => {
                 res(result);
             });
        }); 
    }
    
    async function twoColumnQuery(player, column, val, column2, val2) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        // query attribute
        return new Promise(res => {
             sql("SELECT * FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " ORDER BY ai_id ASC", result => {
                 res(result);
             });
        }); 
    }
    
    /**
    Attribute Deletion for Player
    delets an attribute for a specific player
    **/
    this.deleteAttributePlayer = async function(player, column, val) {
        // make sure column is valid
        if(!(["owner","src_role","src_player","attr_type","duration","val1","val2","val3","val4"].includes(column))) {
            abilityLog(`❗ **Error:** Unexpected attribute deletion column \`${column}\`!`);  
            return [];
        }
        // query attribute
        return new Promise(res => {
             sql("DELETE FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val), result => {
                 res(result);
             });
        }); 
    }
    
}
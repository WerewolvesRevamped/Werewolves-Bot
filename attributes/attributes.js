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
                    return `\`${attribute.ai_id}\`: **${toTitleCase(attribute.attr_type)}** - <@${attribute.owner}> (~${toTitleCase(attribute.duration)}) [${attribute.val1};${attribute.val2};${attribute.val3};${attribute.val4}] {${srcNameToText(attribute.src_name)}:${srcRefToText(attribute.src_ref)}}`;
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
    this.createAttribute = function(src_name, src_ref, target_player, dur, attr_type, val1 = "", val2 = "", val3 = "", val4 = "") {
         return sqlProm("INSERT INTO active_attributes (owner, src_name, src_ref, attr_type, duration, val1, val2, val3, val4, applied_phase) VALUES (" + connection.escape(target_player) + "," + connection.escape(src_name) +  "," + connection.escape(src_ref) + "," + connection.escape(attr_type) + "," + connection.escape(dur) +  "," + connection.escape(val1) +  "," + connection.escape(val2) +  "," + connection.escape(val3) +  "," + connection.escape(val4) + "," + connection.escape(getPhaseAsNumber()) + ")");
    }
    
    /**
    Create Disguise Attribute
    creates a disguise attribute with a specific role and strength
    **/
    this.createDisguiseAttribute = async function(src_name, src_ref, target_player, dur, disguise_role = "citizen", disguise_strength = "weak") {
        await createAttribute(src_name, src_ref, target_player, dur, "disguise", disguise_role, disguise_strength);
    }
    
    /**
    Create Defense Attribute
    creates a defense attribute with a specific defense and killing subtype, a selector for affected players and a phase
    **/
    this.createDefenseAttribute = async function(src_name, src_ref, target_player, dur, def_subtype = "passive", kill_subtype = "all", affected = "@All", phase = "all") {
        await createAttribute(src_name, src_ref, target_player, dur, "defense", def_subtype, kill_subtype, affected, phase);
    }
    
    /**
    Create Absence Attribute
    creates an absence attribute with a location, a killing subtype, a selector for affected players and a phase
    **/
    this.createAbsenceAttribute = async function(src_name, src_ref, target_player, dur, loc, kill_subtype = "all", affected = "@All", phase = "all") {
        await createAttribute(src_name, src_ref, target_player, dur, "absence", loc, kill_subtype, affected, phase);
    }
    
    /**
    Create Manipulation Attribute
    creates a manipulation attribute with a specific manipulation subtype and a value for the manipulation
    **/
    this.createManipulationAttribute = async function(src_name, src_ref, target_player, dur, type = "absolute", subtype = "public", val = 1) {
        await createAttribute(src_name, src_ref, target_player, dur, "manipulation", type, subtype, val);
    }
    
    /**
    Create Group Membership Attribute
    creates a group membership attribute with a specific group name and group membership type
    **/
    this.createGroupMembershipAttribute = async function(src_name, src_ref, target_player, dur, name = "#Wolfpack", membership_type = "member") {
        await createAttribute(src_name, src_ref, target_player, dur, "group_membership", name, membership_type);
    }
    
    /**
    Create Obstruction Attribute
    creates an obstruction attribute with specific affected abilities and obstruction feedback
    **/
    this.createObstructionAttribute = async function(src_name, src_ref, target_player, dur, affected_abilities = "", feedback = "") {
        await createAttribute(src_name, src_ref, target_player, dur, "obstruction", affected_abilities, feedback);
    }
    
    /**
    Create Role Attribute
    creates a role attribute with specific role
    **/
    this.createRoleAttribute = async function(src_name, src_ref, target_player, dur, role =  "", channelId = "") {
        await createAttribute(src_name, src_ref, target_player, dur, "role", role, channelId);
    }
    
    /**
    Create Poll Count Attribute
    creates a poll count attribute
    **/
    this.createPollCountAttribute = async function(src_name, src_ref, target_player, dur, poll =  "lynch", poll_count = 1) {
        await createAttribute(src_name, src_ref, target_player, dur, "poll_count", poll, poll_count);
    }
    
    /**
    Create Poll Result Attribute
    creates a poll result attribute
    **/
    this.createPollResultAttribute = async function(src_name, src_ref, target_player, dur, poll =  "lynch", subtype = "cancel", target = "", subtype2 = "") {
        await createAttribute(src_name, src_ref, target_player, dur, "poll_result", poll, subtype, target, subtype2);
    }
    
    /**
    Checks if a attribute column name is valid**/
    function isValidAttributeColumnName(name) {
        return ["owner","src_name","src_ref","attr_type","duration","val1","val2","val3","val4"].includes(name);
    }
    
    function validateAttributeColumnName(name) {
        if(isValidAttributeColumnName(name)) {
            return true;
        } else {
            abilityLog(`❗ **Error:** Unexpected attribute column \`${name}\`!`);  
            return false;
        }
    }
    
    /**
    Attribute Query for anyone
    queries an attribute for anyone
    **/
    this.queryAttribute = async function(column, val, column2 = null, val2 = null) {
        if(column2) return await twoColumnQueryGeneric(column, val, column2, val2);
        else return await singleColumnQueryGeneric(column, val);
    }
    
    function singleColumnQueryGeneric(column, val) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE " + column + "=" + connection.escape(val) + " ORDER BY ai_id ASC");
    }
    
    function twoColumnQueryGeneric(column, val, column2, val2) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " ORDER BY ai_id ASC");
    }
    
    
    /**
    Attribute Query for Player
    queries an attribute for a specific player
    **/
    this.queryAttributePlayer = async function(player, column, val, column2 = null, val2 = null) {
        if(column2) return await twoColumnQuery(player, column, val, column2, val2);
        else return await singleColumnQuery(player, column, val);
    }
    
    function singleColumnQuery(player, column, val) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " ORDER BY ai_id ASC");
    }
    
    function twoColumnQuery(player, column, val, column2, val2) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " ORDER BY ai_id ASC");
    }
    /**
    Attribute Deletion for Player
    delets an attribute for a specific player
    **/
    this.deleteAttributePlayer = async function(player, column, val, column2 = null, val2 = null) {
        if(column2) return await twoColumnDeletion(player, column, val, column2, val2);
        else return await singleColumnDeletion(player, column, val);
    }
    
    function singleColumnDeletion(player, column, val) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        // delete attribute
        return sqlProm("DELETE FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val));
    }
    
    function twoColumnDeletion(player, column, val, column2, val2) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        // delete attribute
        return sqlProm("DELETE FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2));
    }
    
    /**
    Attribute Cleanup
    removes attributes that no longer apply
    **/
    this.attributeCleanup = async function() {
        let phaseNumeric = getPhaseAsNumber();
        await cleanupDeleteAttribute("phase", phaseNumeric); // remove phase attributes of past phase(s)
        if(isNight()) await cleanupDeleteAttribute("nextday", phaseNumeric - 1); // at the start of a night cleanup next day attributes, unless they were applied previous day
        if(isDay()) await cleanupDeleteAttribute("nextnight", phaseNumeric - 1); // at the start of a day cleanup next night attributes, unless they were applied previous night
    }
    
    function cleanupDeleteAttribute(dur_type, val) {
        return new Promise(res => {
            sql("DELETE FROM active_attributes WHERE duration=" + connection.escape(dur_type) + " AND applied_phase<" + connection.escape(val), result => {
                res(true);
            }, () => {
                // DB error
                abilityLog(`❗ **Error:** Failed while cleaning up \`${dur_type}\` attributes!`);  
                res(false)
            });
        })
    }
    
    /**
    Use attribute
    uses an attribute and removes it if applicable
    **/
    this.useAttribute = async function(id) {
        // get attribute
        let attr = await getAttribute(id);
        // delete until use type attribute
        if(attr.duration === "untiluse") {
            await deleteAttribute(id);
        }
        // delete until second use type attribute if already used once
        else if(attr.duration === "untilseconduse" && attr.used == 1) {
            await deleteAttribute(id);
        }
        // otherwise just increment used value
        else {
            await incrementAttribute(id);
        }
    }
    
    /** PRIVATE
    Get Attribute
    gets an attribute by ai id
    **/
    function getAttribute(id) {
        // get attribute
        return new Promise(res => {
             sql("SELECT * FROM active_attributes WHERE ai_id=" + connection.escape(id), result => {
                 res(result[0]);
             });
        }); 
    }
    
    /** PRIVATE
    Delete Attribute
    deletes an attribute by ai id
    **/
    function deleteAttribute(id) {
        // delete attribute
        return sqlPromEsc("DELETE FROM active_attributes WHERE ai_id=", id);
    }
    
    /** PRIVATE
    Increment Attribute
    increments an attribute's used value by ai id
    **/
    function incrementAttribute(id) {
        // update attribute
        return sqlPromEsc("UPDATE active_attributes SET used=used+1 WHERE ai_id=", id);
    }
    
    /** PUBLIC
    Get role attribute's player id
    **/
    this.roleAttributeGetPlayer = function(channel_id) {
        return sqlPromOneEsc("SELECT active_attributes.ai_id,players.id FROM players INNER JOIN active_attributes ON players.id = active_attributes.owner WHERE players.type='player' AND active_attributes.attr_type='role' AND active_attributes.val2=", channel_id);
    }
    
}
/**
    Attributes Module - Main
    The module for implementing attributes
**/

require("./custom.js")();
require("./generic.js")();
require("./role.js")();

module.exports = function() {
    
    /**
    All valid duration types
    **/
    this.attributesValidDurationTypes = ["permanent","persistent","phase", "phaseattribute", "nextphase", "nextday","nextnight","untiluse","untilseconduse","attribute","untiluseattribute"];
    const attributesNiceNames = ["Permanent", "Persistent", "Phase", "Phase & Attribute", "Next Phase", "Next Day", "Next Night", "Until Use", "Until Second Use", "Attribute", "Until Use & Attribute"];
    
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
			case "query": cmdAttributesQuery(message.channel); break;
			case "parse": cmdAttributesParse(message.channel); break;
            case "get": cmdAttributesGet(message.channel, args); break
			case "list": cmdAttributesList(message.channel); break;
			case "active": if(checkSafe(message)) cmdAttributesActive(message.channel); break;
			case "search": if(checkSafe(message)) cmdAttributesSearch(message.channel, args); break;
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
                    const ownerText = srcRefToText(`${attribute.owner_type}:${attribute.owner}`);
                    const attrList = `${attribute.val1};${attribute.val2};${attribute.val3};${attribute.val4}`;
                    return `\`${attribute.ai_id}\`: **${toTitleCase(attribute.attr_type)}** - ${ownerText} (~${toTitleCase(attribute.duration)}) [${attrList}] {${srcNameToText(attribute.src_name)} - ${srcRefToText(attribute.src_ref, null, false)}}`;
                }), 10).map(el => el.join("\n")).forEach(el => channel.send(el));
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
    Command: $attributes search
    Searches active group instances
    **/
	/* Lists all attribute names */
	this.cmdAttributesSearch = async function(channel, args) {
		if(!args[1] || !args[2]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
        } else if(!isValidAttributeColumnName(args[1])) {
			channel.send("⛔ Syntax error. Must specify a valid search column!"); 
        }
        let result;
        args[1] = args[1].replace(/[^a-z_0-9]*/,"");
        args[2] = args[2].replace(/[^a-z_0-9]*/,"");
        if(args[3] && args[4] && isValidAttributeColumnName(args[3])) {
            args[3] = args[3].replace(/[^a-z_0-9]*/,"");
            args[4] = args[4].replace(/[^a-z_0-9]*/,"");
            if(args[5] && args[6] && isValidAttributeColumnName(args[5])) {
                args[5] = args[5].replace(/[^a-z_0-9]*/,"");
                args[6] = args[6].replace(/[^a-z_0-9]*/,"");
                result = await sqlProm("SELECT * FROM active_attributes WHERE " + args[1] + "=" + connection.escape(args[2]) + " AND " + args[3] + "=" + connection.escape(args[4]) + " AND " + args[5] + "=" + connection.escape(args[6]) + " ORDER BY attr_type ASC");
            } else {
                result = await sqlProm("SELECT * FROM active_attributes WHERE " + args[1] + "=" + connection.escape(args[2]) + " AND " + args[3] + "=" + connection.escape(args[4]) + " ORDER BY attr_type ASC");
            }
        } else {
            result = await sqlProm("SELECT * FROM active_attributes WHERE " + args[1] + "=" + connection.escape(args[2]) + " ORDER BY attr_type ASC");
        }
        
		// Get all attributes
        if(result.length > 0) {
            // At least one attribute exists
            channel.send("✳️ Sending a list of currently existing active attributes instances that match your search:\nAI ID: AttrType - Owner (Duration) [Values] {Source}");
            // Send message
            chunkArray(result.map(attribute => {
                const ownerText = srcRefToText(`${attribute.owner_type}:${attribute.owner}`);
                const attrList = `${attribute.val1};${attribute.val2};${attribute.val3};${attribute.val4}`;
                return `\`${attribute.ai_id}\`: **${toTitleCase(attribute.attr_type)}** - ${ownerText} (~${toTitleCase(attribute.duration)}) [${attrList}] {${srcNameToText(attribute.src_name)} - ${srcRefToText(attribute.src_ref, null, false)}}`;
            }), 10).map(el => el.join("\n")).forEach(el => channel.send(el));
            await sleep(100);
            channel.send(`✅ Found \`${result.length}\` matches.`);
        } else { 
            // No attributes exist
            channel.send("⛔ Database error. Could not find any active attribute instances!");
        }
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
            cacheActiveCustomAttributes();
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
        cacheActiveCustomAttributes();
    }
    
    
    /**
    Create Attribute
    creates an attribute in the database
    **/
    this.createAttribute = function(src_name, src_ref, target, targetType, dur, attr_type, val1 = "", val2 = "", val3 = "", val4 = "") {
         return sqlProm("INSERT INTO active_attributes (owner, owner_type, src_name, src_ref, attr_type, duration, val1, val2, val3, val4, applied_phase) VALUES (" + connection.escape(target) + "," + connection.escape(targetType) + "," + connection.escape(src_name) +  "," + connection.escape(src_ref) + "," + connection.escape(attr_type) + "," + connection.escape(dur) +  "," + connection.escape(val1) +  "," + connection.escape(val2) +  "," + connection.escape(val3) +  "," + connection.escape(val4) + "," + connection.escape(getPhaseAsNumber()) + ")");
    }
    
    /**
    Checks if a attribute column name is valid**/
    function isValidAttributeColumnName(name) {
        return ["owner","owner_type","src_name","src_ref","attr_type","duration","val1","val2","val3","val4","applied_phase","used","target","counter","alive"].includes(name);
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
    this.queryAttribute = async function(column, val, column2 = null, val2 = null, column3 = null, val3 = null, column4 = null, val4 = null) {
        if(column4) return await fourColumnQueryGeneric(column, val, column2, val2, column3, val3, column4, val4);
        else if(column3) return await threeColumnQueryGeneric(column, val, column2, val2, column3, val3);
        else if(column2) return await twoColumnQueryGeneric(column, val, column2, val2);
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
    
    function threeColumnQueryGeneric(column, val, column2, val2, column3, val3) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        if(!validateAttributeColumnName(column3)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " AND " + column3 + "=" + connection.escape(val3) + " ORDER BY ai_id ASC");
    }
    
    function fourColumnQueryGeneric(column, val, column2, val2, column3, val3, column4, val4) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        if(!validateAttributeColumnName(column3)) return [];
        if(!validateAttributeColumnName(column4)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " AND " + column3 + "=" + connection.escape(val3) + " AND " + column4 + "=" + connection.escape(val4) + " ORDER BY ai_id ASC");
    }
    
    
    /**
    Attribute Query for Player
    queries an attribute for a specific player
    **/
    this.queryAttributePlayer = async function(player, column, val, column2 = null, val2 = null, column3 = null, val3 = null, column4 = null, val4 = null) {
        if(column4) return await fourColumnQuery(player, column, val, column2, val2, column3, val3, column4, val4);
        else if(column3) return await threeColumnQuery(player, column, val, column2, val2, column3, val3);
        else if(column2) return await twoColumnQuery(player, column, val, column2, val2);
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
    
    function threeColumnQuery(player, column, val, column2, val2, column3, val3) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        if(!validateAttributeColumnName(column3)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " AND " + column3 + "=" + connection.escape(val3) + " ORDER BY ai_id ASC");
    }
    
    function fourColumnQuery(player, column, val, column2, val2, column3, val3, column4, val4) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        if(!validateAttributeColumnName(column3)) return [];
        if(!validateAttributeColumnName(column4)) return [];
        // query attribute
        return sqlProm("SELECT * FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " AND " + column3 + "=" + connection.escape(val3) + " AND " + column4 + "=" + connection.escape(val4) + " ORDER BY ai_id ASC");
    }
    
    /**
    Attribute Deletion for Player
    delets an attribute for a specific player
    **/
    this.deleteAttributePlayer = async function(player, column, val, column2 = null, val2 = null, column3 = null, val3 = null, column4 = null, val4 = null) {
        // get attribute
        let attr;
        if(column4) attr = await fourColumnQuery(player, column, val, column2, val2, column3, val3, column4, val4);
        else if(column3) attr = await threeColumnQuery(player, column, val, column2, val2, column3, val3);
        else if(column2) attr = await twoColumnQuery(player, column, val, column2, val2);
        else attr = await singleColumnQuery(player, column, val);
        
        // delete owned attribute duration attributes
        for(let i = 0; i < attr.length; i++) {
            let childAttrs = await sqlProm("SELECT ai_id FROM active_attributes WHERE (duration='attribute' OR duration='untiluseattribute' OR duration='phaseattribute') AND src_ref=" + connection.escape(`attribute:${attr[i].ai_id}`));
            for(let j = 0; j < childAttrs.length; j++) {
                await deleteAttribute(childAttrs[j].ai_id);
            }
        }
        
        if(column4) await fourColumnDeletion(player, column, val, column2, val2, column3, val3, column4, val4);
        else if(column3) await threeColumnDeletion(player, column, val, column2, val2, column3, val3);
        else if(column2) await twoColumnDeletion(player, column, val, column2, val2);
        else await singleColumnDeletion(player, column, val);
        
        await cacheActiveCustomAttributes();
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
    
    function threeColumnDeletion(player, column, val, column2, val2, column3, val3) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        if(!validateAttributeColumnName(column3)) return [];
        // delete attribute
        return sqlProm("DELETE FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " AND " + column3 + "=" + connection.escape(val3));
    }
    
    function fourColumnDeletion(player, column, val, column2, val2, column3, val3, column4, val4) {
        // make sure column is valid
        if(!validateAttributeColumnName(column)) return [];
        if(!validateAttributeColumnName(column2)) return [];
        if(!validateAttributeColumnName(column3)) return [];
        if(!validateAttributeColumnName(column4)) return [];
        // delete attribute
        return sqlProm("DELETE FROM active_attributes WHERE owner=" + connection.escape(player) + " AND " + column + "=" + connection.escape(val) + " AND " + column2 + "=" + connection.escape(val2) + " AND " + column3 + "=" + connection.escape(val3) + " AND " + column4 + "=" + connection.escape(val4));
    }
    
    /**
    Attribute Cleanup
    removes attributes that no longer apply
    **/
    this.attributeCleanup = async function() {
        let phaseNumeric = getPhaseAsNumber();
        await cleanupDeleteAttribute("phase", phaseNumeric); // remove phase attributes of past phase(s)
        await cleanupDeleteAttribute("phaseattribute", phaseNumeric); // remove phase attributes of past phase(s)
        if(isNight()) await cleanupDeleteAttribute("nextday", phaseNumeric - 1); // at the start of a night cleanup next day attributes, unless they were applied previous day
        if(isDay()) await cleanupDeleteAttribute("nextnight", phaseNumeric - 1); // at the start of a day cleanup next night attributes, unless they were applied previous night
        await sqlProm("UPDATE active_attributes SET duration='phase' WHERE duration='nextphase'"); // change "nextphase" attributes to "phase" attributes so that they will be cleanedup next phase
        await cacheActiveCustomAttributes();
    }
    
    async function cleanupDeleteAttribute(dur_type, val) {
        let attrs = await sqlProm("SELECT ai_id FROM active_attributes WHERE duration=" + connection.escape(dur_type) + " AND applied_phase<" + connection.escape(val));
        for(let i = 0; i < attrs.length; i++) {
            await deleteAttribute(attrs[i].ai_id);
        }
    }
    
    /**
    Use attribute
    uses an attribute and removes it if applicable
    **/
    this.useAttribute = async function(id) {
        // get attribute
        let attr = await getAttribute(id);
        if(!attr) { // attribute already removed
            return;
        }
        // delete until use type attribute
        if(attr.duration === "untiluse" || attr.duration === "untiluseattribute") {
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
    
    /** PUBLIC
    Delete Attribute
    deletes an attribute by ai id
    **/
    this.deleteAttribute = async function(id) {
        // delete owned attribute duration attributes
        let childAttrs = await sqlProm("SELECT ai_id FROM active_attributes WHERE (duration='attribute' OR duration='untiluseattribute' OR duration='phaseattribute') AND src_ref=" + connection.escape(`attribute:${id}`));
        for(let j = 0; j < childAttrs.length; j++) {
            await deleteAttribute(childAttrs[j].ai_id);
        }
        // delete attribute
        await sqlPromEsc("DELETE FROM active_attributes WHERE ai_id=", id);
        await cacheActiveCustomAttributes();
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
    Update val1-4
    updates val1-4 by ai id
    **/
    this.updateAttributeVal1 = function(id, newVal) {
        // update attribute
        return updateAttributeValue(id, "val1", newVal);
    }
    this.updateAttributeVal2 = function(id, newVal) {
        // update attribute
        return updateAttributeValue(id, "val2", newVal);
    }
    this.updateAttributeVal3 = function(id, newVal) {
        // update attribute
        return updateAttributeValue(id, "val3", newVal);
    }
    this.updateAttributeVal4 = function(id, newVal) {
        // update attribute
        return updateAttributeValue(id, "val4", newVal);
    }
    
    /** PUBLIC
    Updates the alive column
    **/
    this.updateAttributeAlive = function(id, newVal) {
        // update attribute
        return updateAttributeValue(id, "alive", newVal);
    }
    
    /** PRIVATE
    Update an attribute column
    **/
    function updateAttributeValue(id, val, newVal) {
        // update attribute
        return sqlPromEsc("UPDATE active_attributes SET " + val + "=" + connection.escape(newVal) + " WHERE ai_id=", id);
    }
    
}
/**
    Attributes Module - Custom
    Handles functionality related to custom attributes
**/
module.exports = function() {
    
    /**
    Command: $attributes get
    Gets a specific attribute.
    **/
    this.cmdAttributesGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyAttribute(args[1])) {
			channel.send("⛔ Command error. Invalid attribute `" + args[1] + "`!"); 
			return; 
		}
        // Get all attributes values
        sql("SELECT * FROM attributes WHERE name = " + connection.escape(args[1]), async result => {
            result = result[0];
            // get the basic embed
             var embed = await getBasicEmbed(channel.guild);
             // set embed title
            embed.author = { name: result.display_name };
            
            // get lut icon if applicable
            let lutval = applyLUT(result.name);
            if(!lutval) lutval = applyLUT(result.display_name);
            if(lutval) { // set icon and name
                //console.log(`${iconRepoBaseUrl}${lutval}`);
                embed.thumbnail = { "url": `${iconRepoBaseUrl}${lutval}.png` };
                embed.author.icon_url = `${iconRepoBaseUrl}${lutval}.png`;
            } 
            
            // Add a field for every role value
            for(attr in result) {
                embed.fields.push({ "name": toTitleCase(attr), "value": (result[attr]+"").substr(0, 1000) + ((result[attr]+"").length > 1000 ? " **...**" : "") });
            }
            
            // Send the embed
            channel.send({ embeds: [ embed ] }); 
        });
    }
    
    /**
    Command: $attributes list
    Lists all attributes
    **/
	/* Lists all attributes names */
	this.cmdAttributesList = function(channel) {
		// Get all attributes
		sql("SELECT * FROM attributes ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one attribute exists
				channel.send("✳️ Sending a list of currently existing attributes:");
				// Send message
				chunkArray(result.map(attribute => {
                    let emoji = getLUTEmoji(attribute.name, attribute.display_name);
                    return `**${emoji} ${toTitleCase(attribute.display_name)}**`;
                }), 30).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No attributes exist
				channel.send("⛔ Database error. Could not find any attributes!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for attribute list!");
		});
	}

    /** Custom Attribute Cache
    Format: [ai_id,src_ref,owner_ref,attr_name,src_name,value1(val2)]
    **/
    this.cachedActiveCustomAttributes = [];
    this.cacheActiveCustomAttributes = async function() {
        let result = await sqlProm("SELECT ai_id,src_ref,src_name,owner,owner_type,val1 AS name,val2 FROM active_attributes WHERE attr_type='custom'");
        cachedActiveCustomAttributes = result.map(el => [el.ai_id, el.src_ref, `${el.owner_type}:${el.owner}`, el.name, el.src_name, el.val2]);
    }
    
    this.getCustomAttributeOwner = function(ai_id) {
        let found = cachedActiveCustomAttributes.find(el => el[0] === +ai_id);
        if(found) return found[2];
        else return `unknown:unknown`;
    }
    
    this.getCustomAttributeSource = function(ai_id) {
        let found = cachedActiveCustomAttributes.find(el => el[0] === +ai_id);
        if(found) return found[1];
        else return `unknown:unknown`;
    }
    
    this.getCustomAttributeName = function(ai_id) {
        let found = cachedActiveCustomAttributes.find(el => el[0] === +ai_id);
        if(found) return found[3];
        else return `unknown`;
    }
    
    this.getCustomAttributeSourceName = function(ai_id) {
        let found = cachedActiveCustomAttributes.find(el => el[0] === +ai_id);
        if(found) return found[4];
        else return `unknown:unknown`;
    }
    
    this.getCustomAttributeVal1 = function(ai_id) {
        let found = cachedActiveCustomAttributes.find(el => el[0] === +ai_id);
        if(found) return found[5];
        else return ``;
    }
    
    // checks if a specific owner has a certain custom attribute
    this.hasCustomAttribute = function(owner, name) {
        let found = cachedActiveCustomAttributes.find(el => el[2] === owner && el[3] === name);
        if(found) return true;
        else return false;
    }
    
    // checks if a specific owner has a certain custom attribute
    this.getCustomAttributes = function(owner, name) {
        let found = cachedActiveCustomAttributes.filter(el => el[2] === owner);
        if(found.length > 0) return found;
        else return [];
    }
    
    /** PUBLIC
    Create Custom Attribute
    creates a custom attribute
    **/
    this.createCustomAttribute = async function(src_name, src_ref, target, targetType, dur, attrType, val1 = "", val2 = "", val3 = "") {
        await createAttribute(src_name, src_ref, target, targetType, dur, "custom", attrType, val1, val2, val3);
        await cacheActiveCustomAttributes();
    }
    
    /** PRIVATE
    Set Custom Attribute Value #1
    set an attribute's val2 value by ai id to a specific value
    **/
    function setCustomAttributeValue1(id, val) {
        // update attribute
        return sqlPromEsc("UPDATE active_attributes SET val2=" + connection.escape(val) + " WHERE ai_id=", id);
    }
    
    /** PRIVATE
    Set Custom Attribute Value #2
    set an attribute's val3 value by ai id to a specific value
    **/
    function setCustomAttributeValue2(id, val) {
        // update attribute
        return sqlPromEsc("UPDATE active_attributes SET val3=" + connection.escape(val) + " WHERE ai_id=", id);
    }
    
    /** PRIVATE
    Set Custom Attribute Value #3
    set an attribute's val4 value by ai id to a specific value
    **/
    function setCustomAttributeValue3(id, val) {
        // update attribute
        return sqlPromEsc("UPDATE active_attributes SET val4=" + connection.escape(val) + " WHERE ai_id=", id);
    }
    
    /** PUBLIC
    Set Custom Attribute Value
    set an attribute's value by ai id to a specific value
    **/
    this.setCustomAttributeValue = function(id, index, val) {
        switch(index) {
            case 1: return setCustomAttributeValue1(id, val);
            case 2: return setCustomAttributeValue2(id, val);
            case 3: return setCustomAttributeValue3(id, val);
        }
    }
    
   
    
    
}
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
        let result = await sqlPromOneEsc("SELECT * FROM attributes WHERE name = ", args[1]);
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
    }
    
    /**
    Command: $attributes list
    Lists all attributes
    **/
	/* Lists all attributes names */
	this.cmdAttributesList = async function(channel) {
		// Get all attributes
        let result = await sqlProm("SELECT * FROM attributes ORDER BY name ASC");
        if(result.length <= 0) {
            channel.send("⛔ Database error. Could not find any attributes!");
        }
        // At least one attribute exists
        channel.send("✳️ Sending a list of currently existing attributes:");
        // Send message
        chunkArray(result.map(attribute => {
            let emoji = getLUTEmoji(attribute.name, attribute.display_name);
            return `**${emoji} ${toTitleCase(attribute.display_name)}**`;
        }), 30).map(el => el.join(", ")).forEach(el => channel.send(el));
	}

    /** Custom Attribute Cache
    Format: [ai_id,src_ref,owner_ref,attr_name,src_name,value1(val2)]
    **/
    this.cachedActiveCustomAttributes = [];
    this.cacheActiveCustomAttributes = async function() {
        let result = await sqlProm("SELECT ai_id,src_ref,src_name,owner,owner_type,val1 AS name,val2 FROM active_attributes WHERE attr_type='custom' OR attr_type='modifier'");
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
    
    // gets all custom attributes from a player
    this.getCustomAttributes = function(owner) {
        let found = cachedActiveCustomAttributes.filter(el => el[2] === owner);
        if(found.length > 0) return found;
        else return [];
    }
    
    /** PUBLIC
    Create Custom Attribute
    creates a custom attribute
    **/
    this.createCustomAttribute = async function(src_name, src_ref, target, targetType, dur, attrType, val1 = "", val2 = "", val3 = "", type = "custom") {
        // get attribute data
        let act = 0;
        if(stats.haunting) { 
            let attrData = await sqlPromOneEsc("SELECT * FROM attributes WHERE name = ", attrType);
            act = attrData.activation;
        }
        // create attribute
        await createAttribute(src_name, src_ref, target, targetType, dur, type, attrType, val1, val2, val3, act);
        await cacheActiveCustomAttributes();
    }
    
    this.createModifierAttribute = async function(src_name, src_ref, target, targetType, dur, attrType) {
        // create attribute
        await createCustomAttribute(src_name, src_ref, target, targetType, dur, attrType, "", "", "", "modifier");
    }
    
    /** PRIVATE
    Set Custom Attribute Value #1
    set an attribute's val2 value by ai id to a specific value
    **/
    async function setCustomAttributeValue1(id, val) {
        // update attribute
        await sqlPromEsc("UPDATE active_attributes SET val2=" + connection.escape(val) + " WHERE ai_id=", id);
        await cacheActiveCustomAttributes();
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
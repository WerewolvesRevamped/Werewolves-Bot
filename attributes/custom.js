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


    
    
}
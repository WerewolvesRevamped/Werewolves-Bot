/**
    Roles Module - Locations
    Handles functionality related to locations
**/
module.exports = function() {
    
	/**
    Command: $locations
    Handle location command
    **/
	this.cmdLocations = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Groups Subcommand
			case "query": cmdLocationsQuery(message.channel); break;
            case "get": cmdLocationsGet(message.channel, args); break
			case "list": cmdLocationsList(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $locations get
    Gets a specific location.
    **/
    this.cmdLocationsGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyLocation(args[1])) {
			channel.send("⛔ Command error. Invalid location `" + args[1] + "`!"); 
			return; 
		}
        // Get all groups values
        sql("SELECT * FROM locations WHERE name = " + connection.escape(args[1]), async result => {
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
    Command: $locations list
    Lists all locations
    **/
	/* Lists all location names */
	this.cmdLocationsList = function(channel) {
		// Get all locations
		sql("SELECT * FROM locations ORDER BY sort_index ASC", result => {
			if(result.length > 0) {
				// At least one location exists
				channel.send("✳️ Sending a list of currently existing locations:");
				// Send message
				chunkArray(result.map(loc => {
                    let emoji = getLUTEmoji(loc.name, loc.display_name);
                    return `**${emoji} ${toTitleCase(loc.display_name)}** (${toTitleCase(loc.members.split(",").join(", "))} / ${toTitleCase(loc.viewers.split(",").join(", "))}) [${loc.sort_index}]`;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No locations exist
				channel.send("⛔ Database error. Could not find any locations!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for location list!");
		});
	}
    
    
    /**
    Cache Locations
    caches the current state of the locations database
    **/
    this.cachedLocations = [];
    this.cacheLocations = function() {
		sql("SELECT name FROM locations", result => {
				cachedLocations = result.map(el => el.name);
		}, () => {
			log("Game > ❗❗❗ Unable to cache locations!");
		});
	}
    
     /** Verify Location
    Verifies if a location exists
    **/
    this.verifyLocation = function(input) {
        if(cachedLocations.length == 0) return true; // if cache is currently not loaded just allow it
		let inputLoc = input.replace(/[^a-z\$ ]/g,"").trim(); // parse location name
		let loc = cachedLocations.find(el => el === inputLoc); // check if location is in cache
		return loc ? true : false;
	}
    
    /**
    Parse location name
    Returns a location name in db format
    **/
    function parseLocation(name) {
        return name.toLowerCase().replace(/[^a-z\$ ]/g,"").trim();
    }
    
    /**
    Location send
    used to send a message to a location
    **/
    this.locationSend = function(locationName, message, color = EMBED_GRAY, thumbnail = null, title = null) {
        let parsedLocationName = parseLocation(locationName);
        sql("SELECT channel_id FROM locations WHERE name = " + connection.escape(parsedLocationName), result => {
            let loc_sc_id = result[0].channel_id;
            let loc_sc = stats.guild.channels.cache.get(loc_sc_id);
            embed = basicEmbed(message, color);
            if(thumbnail) embed.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
            if(title) embed.embeds[0].title = title; // add title
            loc_sc.send(embed);
        });

    }
    
    
}
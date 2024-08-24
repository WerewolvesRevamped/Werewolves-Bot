/**
    Roles Module - Locations
    Handles functionality related to locations
**/
module.exports = function() {
    
	/**
    Command: $locations
    Handle location command
    **/
	this.cmdLocations = function(message, args) {
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
		} else if(!verifyLocationName(args[1])) {
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
    
     /** Verify Location
    Verifies if a location exists
    **/
    this.verifyLocationName = function(input) {
        if(cachedLocations.length == 0) return true; // if cache is currently not loaded just allow it
		let inputLoc = parseLocationName(input); // parse location name
		let loc = cachedLocations.find(el => el === inputLoc); // check if location is in cache
		return loc ? true : false;
	}
    
    /**
    Parse location name
    Returns a location name in db format
    **/
    this.parseLocationName = function(name) {
        return name.toLowerCase().replace(/[^a-z\$ ]/g,"").trim();
    }
    
    /**
    Location send
    used to send a message to a location
    WIP: THIS CAN USE ABILITY SEND
    **/
    this.locationSend = function(locationName, message, color = EMBED_GRAY, thumbnail = null, title = null) {
        let parsedLocationName = parseLocationName(locationName);
        sql("SELECT channel_id FROM locations WHERE name = " + connection.escape(parsedLocationName), result => {
            let loc_sc_id = result[0].channel_id;
            let loc_sc = mainGuild.channels.cache.get(loc_sc_id);
            embed = basicEmbed(message, color);
            if(thumbnail) embed.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
            if(title) embed.embeds[0].title = title; // add title
            if(loc_sc) loc_sc.send(embed);
        });

    }
    
    /** Create public channels **/
    this.createLocations = async function() {
		// Create Public Channels
		const publicCat = await mainGuild.channels.create({ name: "💬 " + toTitleCase(stats.game) + " Public Channels", type: ChannelType.GuildCategory,  permissionOverwrites: getLocationPermissions() });
        
        // save public channel
        sqlSetStat(15, publicCat.id);
        
        // get all locations
		const locations = await sqlProm("SELECT * FROM locations ORDER BY sort_index ASC");
            
        // go through all locations
        for(let i = 0; i < locations.length; i++) {
            // get permissions
            const members = locations[i].members.toLowerCase().split(",");
            const viewers = locations[i].viewers.toLowerCase().split(",");
            let permissions = [ getPerms(mainGuild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []) ];
            // add member permissions
            members.forEach(mem => {
                let perm = getLocationPermissionsType(mem, ["write","read"], []);
                if(perm) permissions.push(perm);
            });
            // add viewer permissions
            viewers.forEach(view => {
                let perm = getLocationPermissionsType(view, ["read"], ["write"]);
                if(perm) permissions.push(perm);
            });
            
            // create channel
            const displayName = locations[i].display_name;
            let newLocChannel = await mainGuild.channels.create({ name: displayName, type: ChannelType.GuildText, permissionOverwrites: permissions, parent: publicCat });
            newLocChannel.setParent(publicCat, { lockPermissions: false });
            
            // send message
            if(locations[i].description) {
                let embed = await getLocationEmbed(locations[i].name);
                sendEmbed(newLocChannel, embed, true);
            }
            
            // save channel
            const name = locations[i].name;
            await sqlProm("UPDATE locations SET channel_id=" + connection.escape(newLocChannel.id) + " WHERE name=" + connection.escape(name));
        }      

    }
    
    function getLocationPermissionsType(type, allow, deny) {
        switch(type) {
            case "alive":
                return stats.participant ? getPerms(stats.participant, allow, deny) : null; 
            case "dead":
                return stats.dead_participant ? getPerms(stats.dead_participant, allow, deny) : null; 
            case "ghost":
                return stats.ghost ? getPerms(stats.ghost, allow, deny) : null; 
            case "substitute":
                return stats.substitute ? getPerms(stats.substitute, allow, deny) : null; 
            default:
                return null;
        }
    }
    
	/* Public Permissions */
	function getLocationPermissions() {
		return [ getPerms(mainGuild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.helper, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.ghost, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write", "read"], []) ];
	}
	
    
    
}
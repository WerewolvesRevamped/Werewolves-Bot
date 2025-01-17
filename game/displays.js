/**
    Roles Module - Displays
    Handles functionality related to displays
**/
module.exports = function() {
    
	/**
    Command: $displays
    Handle display command
    **/
	this.cmdDisplays = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Groups Subcommand
			case "query": cmdDisplaysQuery(message.channel); break;
            case "get": cmdDisplaysGet(message.channel, args); break
			case "list": cmdDisplaysList(message.channel); break;
			case "active": cmdDisplaysActive(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $displays get
    Gets a specific display.
    **/
    this.cmdDisplaysGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyDisplayName(args[1])) {
			channel.send("⛔ Command error. Invalid display `" + args[1] + "`!"); 
			return; 
		}
        // Get all groups values
        sql("SELECT * FROM displays WHERE name = " + connection.escape(args[1]), async result => {
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
    Command: $displays list
    Lists all displays
    **/
	/* Lists all display names */
	this.cmdDisplaysList = function(channel) {
		// Get all displays
		sql("SELECT * FROM displays", result => {
			if(result.length > 0) {
				// At least one display exists
				channel.send("✳️ Sending a list of currently existing displays:");
				// Send message
				chunkArray(result.map(dis => {
                    let emoji = getLUTEmoji(dis.name, dis.display_name);
                    return `${emoji} **${toTitleCase(dis.display_name)}** (${dis.name})`;
                }), 40).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No displays exist
				channel.send("⛔ Database error. Could not find any displays!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for display list!");
		});
	}
    
    /**
    Command: $displays active
    Lists all active displays
    **/
	/* Lists all display names */
	this.cmdDisplaysActive = function(channel) {
		// Get all displays
		sql("SELECT * FROM active_displays", result => {
			if(result.length > 0) {
				// At least one display exists
				channel.send("✳️ Sending a list of currently active displays:");
				// Send message
				chunkArray(result.map(dis => {
                    return `\`${dis.ai_id}\`: **${dis.name}** - ${srcRefToText(dis.src_ref)} [${dis.val1};${dis.val2};${dis.val3};${dis.val4}] ( https://discord.com/channels/${mainGuild.id}/${dis.channel_id}/${dis.message_id} )`;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No displays exist
				channel.send("⛔ Database error. Could not find any displays!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for display list!");
		});
	}
    
     /** Verify Display
    Verifies if a display exists
    **/
    this.verifyDisplayName = function(input) {
        if(cachedDisplays.length == 0) return true; // if cache is currently not loaded just allow it
		let inputLoc = parseDisplayName(input); // parse display name
		let loc = cachedDisplays.find(el => el === inputLoc); // check if display is in cache
		return loc ? true : false;
	}
    
    /**
    Parse display name
    Returns a display name in db format
    **/
    this.parseDisplayName = function(name) {
        return name.toLowerCase().replace(/[^a-z\$ ]/g,"").trim();
    }
    
    /**
    Get Display Embed
    Returns a display embed for a display message
    */
    this.getDisplayEmbed = function(displayName, values = [], authorId = null) {
        return new Promise(res => {
            sql("SELECT * FROM displays WHERE name = " + connection.escape(displayName), async result => {
                result = result[0]; // there should always only be one role by a certain name
                var embed = await getBasicEmbed(mainGuild);
                
                // description
                let desc = await applyPackLUT(result?.contents ?? "No info found", authorId);
                
                console.log(values);
                for(let i = 0; i < values.length; i++) {
                    let re = new RegExp(values[i][0].replace(/\$/g,"\\$"), "g");
                    desc = desc.replace(re, "" + values[i][1]);
                }
                embed.description = applyETN(desc, mainGuild);
               
                // get icon if applicable
                let lutval = applyLUT(displayName);
                if(!lutval) lutval = applyLUT(result?.display_name ?? "Unknown");
                if(lutval) { // set icon and name
                    //console.log(`${iconRepoBaseUrl}${lutval}`);
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.thumbnail = { "url": `${iconBaseUrl(authorId)}${lutval}.png` };
                    embed.author = { "icon_url": `${iconBaseUrl(authorId)}${lutval}.png`, "name": applyTheme(dp) };
                } else { // just set title afterwards
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.title = applyET(dp);
                }
                // resolve promise, return embed
                res(embed);
            })
        });
    }
    
    /** PUBLIC
    Update displays
    **/
    this.updateDisplayCheck = async function(src_ref, type) {
        console.log(src_ref, type);
        let displays = await sqlPromEsc("SELECT * FROM active_displays WHERE src_ref=", src_ref);
        for(let i = 0; i < displays.length; i++) {
            console.log("CHECKING", displays[i], type);
            // check if the value that changed occurs in the display
            if(displays[i].val1.toLowerCase() === type || displays[i].val2.toLowerCase() === type || displays[i].val3.toLowerCase() === type || displays[i].val4.toLowerCase() === type) {
                let values = await parseDisplayValues(displays[i].val1, displays[i].val2, displays[i].val3, displays[i].val4, src_ref);
                // get display embed
                let embed = await getDisplayEmbed(displays[i].name, values);
                // get display message
                let displayChannel = await mainGuild.channels.fetch(displays[i].channel_id);
                let displayMessage = await displayChannel.messages.fetch(displays[i].message_id);
                // edit display
                await displayMessage.edit({ embeds: [ embed ] });
            }
        }
    }

    /** PUBLIC
    Reset Displays
    **/
    this.resetDisplays = function() {
        sql("DELETE FROM active_displays");
    }
}
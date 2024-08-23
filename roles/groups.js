/**
    Roles Module - Groups
    Handles functionality related to groups
**/
module.exports = function() {
    
	/**
    Command: $groups
    Handle groups command
    **/
	this.cmdGroups = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Groups Subcommand
			case "query": cmdGroupsQuery(message.channel); break;
			case "parse": cmdGroupsParse(message.channel); break;
            case "get": cmdGroupsGet(message.channel, args); break
			case "list": cmdGroupsList(message.channel); break;
			case "active": cmdGroupsActive(message.channel); break;
			case "delete": cmdGroupsDelete(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $groups get
    Gets a specific group.
    **/
    this.cmdGroupsGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyGroup(args[1])) {
			channel.send("⛔ Command error. Invalid group `" + args[1] + "`!"); 
			return; 
		}
        // Get all groups values
        sql("SELECT * FROM groups WHERE name = " + connection.escape(args[1]), async result => {
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
    Command: $groups list
    Lists all groups
    **/
	/* Lists all groups names */
	this.cmdGroupsList = function(channel) {
		// Get all groups
		sql("SELECT * FROM groups ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one group exists
				channel.send("✳️ Sending a list of currently existing groups:");
				// Send message
				chunkArray(result.map(group => {
                    let emoji = getLUTEmoji(group.name, group.display_name);
                    return `**${emoji} ${toTitleCase(group.display_name)}** (${toTitleCase(group.team)})`;
                }), 20).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No groups exist
				channel.send("⛔ Database error. Could not find any groups!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for group list!");
		});
	}
    
    /**
    Command: $groups active
    Lists active group instances
    **/
	/* Lists all groups names */
	this.cmdGroupsActive = function(channel) {
		// Get all groups
		sql("SELECT * FROM active_groups ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳️ Sending a list of currently existing active group instances:");
				// Send message
				chunkArray(result.map(group => {
                    return `\`${group.ai_id}\`: **${toTitleCase(group.name)}** (<#${group.channel_id}>)`;
                }), 20).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No groups exist
				channel.send("⛔ Database error. Could not find any active group instances!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for active group instance list!");
		});
	}
    
    /**
    Command: $groups delete
    Deletes an active group instances
    **/
	/* Lists all groups names */
	this.cmdGroupsDelete = function(channel, args) {
		if(!args[1]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		} else if(isNaN(args[1])) {
			channel.send("⛔ Command error. Invalid group instance id `" + args[1] + "`!"); 
			return; 
		}
        
		// Get all groups
		sql("DELETE FROM active_groups WHERE ai_id=" + connection.escape(args[1]), result => {
            channel.send("✅ Deleted active group instance.");
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't delete active group instance!");
		});
	}
    
    /**
    Groups: Reset
    resets all active groups
    **/
    this.groupsReset = function() {
		// Reset active Group Database
		sql("DELETE FROM active_groups");
    }
    
    /** PUBLIC
    Get group data
    **/
    this.groupGetData = function(groupName) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(groupName), result => {
                res(result[0]);
            });
        });
    }
    
    
    
}
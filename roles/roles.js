/**
    Roles Module - Main
    The module for WWR roles
**/
require("./parser.js")();
require("./help.js")();
require("./caching.js")();
require("./link.js")();
require("./info.js")();
require("./utility.js")();
require("./elected.js")();

module.exports = function() {
	/**
    Command: $roles
    Handle roles command
    **/
	this.cmdRoles = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Role Subcommand
			case "query": cmdRolesQuery(message.channel); break;
			case "parse": cmdRolesParse(message.channel); break;
			case "get": cmdRolesGet(message.channel, args); break;
			case "list": cmdRolesList(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
	/**
    Command: $infomanage
    Handle infomanage command
    **/
	this.cmdInfomanage = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Info Subcommand
			case "query": cmdInfomanageQuery(message.channel); break;
            case "get": cmdInfomanageGet(message.channel, args); break
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
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
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $roles get
    Gets all role values
    **/
    this.cmdRolesGet = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyRole(args[1])) {
			channel.send("⛔ Command error. Invalid role `" + args[1] + "`!"); 
			return; 
		}
        // Get all roles values
        sql("SELECT * FROM roles WHERE name = " + connection.escape(args[1]), async result => {
            result = result[0];
            // get the basic embed
             var embed = await getBasicRoleEmbed(result, channel.guild);
             // set embed title
            embed.author.name = result.display_name;
            
            // Add a field for every role value
            for(attr in result) {
                embed.fields.push({ "name": toTitleCase(attr), "value": (result[attr]+"").substr(0, 1000) + ((result[attr]+"").length > 1000 ? " **...**" : "") });
            }
            
            // Send the embed
            channel.send({ embeds: [ embed ] }); 
        });
    }
    
    /**
    Command: $im get
    Gets a specific info. This is useful when a role shares the name
    **/
    this.cmdInfomanageGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyInfo(args[1])) {
			channel.send("⛔ Command error. Invalid info `" + args[1] + "`!"); 
			return; 
		}
        infoEmbed = await getInfoEmbed(args[1], channel.guild);
        channel.send({ embeds: [ infoEmbed ] });
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
        // Get all roles values
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
    Command: $roles list
    Lists all roles
    **/
	/* Lists all roles names */
	this.cmdRolesList = function(channel) {
		// Get all roles
		sql("SELECT * FROM roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳️ Sending a list of currently existing roles:");
				// Send message
				chunkArray(result.map(role => `**${getRoleEmoji(role.name) ?? "❓"} ${toTitleCase(role.display_name)}** (${toTitleCase(role.class)[0]}${toTitleCase(role.category)[0]})`), 30).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No roles exist
				channel.send("⛔ Database error. Could not find any roles!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for role list!");
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
				// At least one role exists
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
    
}
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
require("./groups.js")();

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
			case "list_names": cmdRolesListNames(message.channel); break;
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
    Command: $sets
    Handle ability sets command
    **/
	this.cmdSets = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Groups Subcommand
			case "query": cmdSetsQuery(message.channel); break;
            case "get": cmdSetsGet(message.channel, args); break
			case "list": cmdSetsList(message.channel); break;
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
    Command: $sets get
    Gets a specific ability set.
    **/
    this.cmdSetsGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifySet(args[1])) {
			channel.send("⛔ Command error. Invalid set `" + args[1] + "`!"); 
			return; 
		}
        // Get all sets values
        sql("SELECT * FROM sets WHERE name = " + connection.escape(args[1]), async result => {
            result = result[0];
            // get the basic embed
             var embed = await getBasicEmbed(channel.guild);
             // set embed title
            embed.author = { name: result.display_name };
            
            // get lut icon if applicable
            let lutval = applyLUT(result.name);
            if(!lutval) lutval = applyLUT(result.display_name);
            if(lutval) { // set icon and name
                console.log(`${iconRepoBaseUrl}${lutval}`);
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
    Command: $roles list_names
    Lists all role names
    **/
	/* Lists all roles names */
	this.cmdRolesListNames = function(channel) {
		// Get all roles
		sql("SELECT * FROM roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳️ Sending a list of currently existing role names:");
				// Send message
				chunkArray(result.map(role => `${toTitleCase(role.display_name)}`), 200).map(el => el.join(",")).forEach(el => channel.send(el));
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
    Command: $sets list
    Lists all sets
    **/
	/* Lists all sets names */
	this.cmdSetsList = function(channel) {
		// Get all sets
		sql("SELECT * FROM sets ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳️ Sending a list of currently existing sets:");
				// Send message
				chunkArray(result.map(set => {
                    let emoji = getLUTEmoji(set.name, set.display_name);
                    return `**${emoji} ${toTitleCase(set.display_name)}**`;
                }), 20).map(el => el.join(", ")).forEach(el => channel.send(el));
			} else { 
				// No sets exist
				channel.send("⛔ Database error. Could not find any sets!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for set list!");
		});
	}
    
}
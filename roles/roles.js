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
			// Role Subcommand
			case "query": cmdInfomanageQuery(message.channel); break;
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
    
}
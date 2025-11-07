/*
	Module for whispering
		- Connects channels (with optional disguises)
		- Converts yourself into a bot
*/
module.exports = function() {
	
	/* Handles connection command */
	this.cmdConnection = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `connection [add|remove|reset]`"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			case "add": cmdConnectionAdd(message.channel, args); break;
			case "remove": cmdConnectionRemove(message.channel); break;
			case "send": cmdConnectionSend(message.channel, args); break;
			case "reset": cmdConfirm(message, "connection reset"); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
    
    this.cmdImpersonate = function(message, argsX) {
        let author = parseUser(argsX.shift(), message.channel);
        if(author) cmdWebhook(message.channel, message.guild.members.cache.get(author), argsX);
    }
    
    this.cmdWebhookDirect = function(message, argsX) {
        if(!message.author.bot) {
			cmdWebhook(message.channel, message.member, argsX);
		} else {
			let msg = ["Leave me alone.", "Please just stop.", "Why are you doing this?","What have I done to deserves this.","No.","Just no.","Seriously, no.","No means no.","Go away.","Why do you hate me?","What have I ever done to you?","I don't want to be part of your evil plots.","I'm a friendly bot, why are you trying to make me do this?","I just want to be nice, not annoying.","Please go away.","Why...","Stop...",":("];
			message.channel.send(msg[Math.floor(Math.random() * msg.length)]);
		}
    }
	
	/* Adds a connection */
	this.cmdConnectionAdd = function(channel, args, hidden = false) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!args[2]) { 
			args[2] = ""; 
		}
		// Add connection to DB
		sql("INSERT INTO connected_channels (channel_id, id, name) VALUES (" + connection.escape(channel.id) + "," + connection.escape(args[1]) + "," + connection.escape(args[2]) + ")", result => {
			if(args[2] != "") { 
				// Connection w/ disguise
				if(!hidden) channel.send("✅ Added connection `" + args[1] + "` with disguise `" + toTitleCase(args[2]) + "`!");
				log("Whispers > Created connection `" + args[1] + "` with disguise `" + toTitleCase(args[2]) + "`!");
			} else { 
				// Connection w/o disguise
				if(!hidden) channel.send("✅ Added connection `" + args[1] + "` with no disguise!");
				log("Whispers > Created connection `" + args[1] + "` with no disguise!");
			}
		}, () => {
			// Couldn't add connection
			channel.send("⛔ Database error. Couldn't add connection `" + args[1] + "`!");
		});
	}
	
	/* Removes a connection */
	this.cmdConnectionRemove = function(channel) {
		// Remove connections from DB
		sql("DELETE FROM connected_channels WHERE channel_id = " + connection.escape(channel.id), result => {
			channel.send("✅ Removed all connections from this channel!");
			log("Whispers > Removed connections from `" + channel.id + "`!");
		}, () => {
			// Database error
			channel.send("⛔ Database error. Couldn't remove connections!");
		});
	}
	
	/* Rests all connections */
	this.cmdConnectionReset = function(channel) {
		sql("DELETE FROM connected_channels", result => {
			channel.send("✅ Successfully reset connections!");
		}, () => {
			channel.send("⛔ Database error. Could not reset connections!");
		});
	}
	
	this.cmdWebhook = function(channel, member, args) {
		let webhookMsg = args.join(" ");
		webhookMsg = webhookMsg.replace(/:~/g, ":");
		if(!(webhookMsg.length > 0)) webhookMsg = "|| ||";
        sendMessageDisguiseMember(channel.id, webhookMsg, member);
	}
	
    
    this.getIconFromName = function(name) {
        return new Promise(res => {
            let roleNameParsed = parseRole(name);
            if(!roleNameParsed) return res(false);
            var output;
            sql("SELECT * FROM roles WHERE name = " + connection.escape(roleNameParsed), async result => {
                if(!result[0]) return res(false);
                let roleData = await getRoleData(result[0].display_name, result[0].class, result[0].category, result[0].team);
                let urlExists = await checkUrlExists(roleData.url);
                if(urlExists) res(roleData.url);
                else res(false);
            });
        });
    }
    
	/* Copies over messages */
	this.connectionExecute = function(message) {
		if(connection && !message.author.bot && message.content.indexOf(stats.prefix) !== 0) {
			// Find connection id(s)
			sql("SELECT id, name FROM connected_channels WHERE channel_id = " + connection.escape(message.channel.id), result => {
				// For each connection id, find each connected channel
				result.forEach(source => {
					sql("SELECT channel_id, name FROM connected_channels WHERE id = " + connection.escape(source.id), result => {
						// Write message in each channel
						result.forEach(async destination => {
							// Ignore if it's same channel as source
							if(destination.channel_id != message.channel.id) { 	
                                // send message
                                if(source.name) {
                                    if(pRoles.map(el => el.id).includes(message.author.id)) triggerPlayer(message.author.id, "On Whisper Complex", { disguise: source.name.trim().toLowerCase().replace(/[^a-z]/g,"") });
                                    sendMessageDisguise(destination.channel_id, message.content, source.name);
                                } else {
                                    sendMessageDisguiseMember(destination.channel_id, message.content, message.member);
                                }
							}		
						});
					}, () => {
						// Database error
						log("⛔ Database error. Could not access connected channels via id!");
					});
				});
			}, () => {
				// Database error
				log("⛔ Database error. Could not access connected channels via channel!");
			});
		}
	}
	/* Send message over a connection */
	this.cmdConnectionSend = function(channel, args) {
        // Check arguments
		if(!args[1] || !args[2] || !args[3]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
        
        // set values
        let conn = args[1];
        let disguise = typeof args[2] === 'string' ? toTitleCase(args[2]) : "";
        let text = args[3];
        
        // send message
        connectionSend(conn, text, disguise);
    }
    
	
}

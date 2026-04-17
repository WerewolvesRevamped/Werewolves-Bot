/**
        Game Module - Whispers
        - Connects channels
        - V2 of whispers
*/
module.exports = function() {
	
	/**
    Command: $connection
    Command to manage connections
    **/
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
    
    /**
    Command: $connection add
    Adds a new connection
    **/
	this.cmdConnectionAdd = async function(channel, args, hidden = false) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!args[2]) { 
			args[2] = ""; 
		}
        // add connection
        await connectionAdd(channel.id, args[1], args[2]);
        // feedback
        if(args[2] != "") { 
            // Connection w/ disguise
            if(!hidden) channel.send("✅ Added connection `" + args[1] + "` with disguise `" + toTitleCase(args[2]) + "`!");
            log("Whispers > Created connection `" + args[1] + "` with disguise `" + toTitleCase(args[2]) + "`!");
        } else { 
            // Connection w/o disguise
            if(!hidden) channel.send("✅ Added connection `" + args[1] + "` with no disguise!");
            log("Whispers > Created connection `" + args[1] + "` with no disguise!");
        }
	}
    
    /**
    Command: $connection remove
    Removes a connection
    **/
	this.cmdConnectionRemove = async function(channel) {
        await sqlPromEsc("DELETE FROM connected_channels WHERE channel_id = ", channel.id);
        channel.send("✅ Removed all connections from this channel!");
        log("Whispers > Removed connections from `" + channel.id + "`!");
	}
    
    /**
    Command: $connection send
    Sends a message through a connection
    **/
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
    
    /**
    Command: $connection reset
    Resets all connections
    **/
	this.cmdConnectionReset = async function(channel) {
		await sqlProm("DELETE FROM connected_channels")
        channel.send("✅ Successfully reset connections!");
	}
    
    /**
    Command: $webhook
    Sends a message as a webhook version of you
    **/
	this.cmdWebhook = function(channel, member, args) {
		let webhookMsg = args.join(" ");
		webhookMsg = webhookMsg.replace(/:~/g, ":");
		if(!(webhookMsg.length > 0)) webhookMsg = "|| ||";
        sendMessageDisguiseMember(channel.id, webhookMsg, member);
	}
    
    /**
    Command: $impersonate
    Impersonates another user as a webhook
    **/
    this.cmdImpersonate = function(message, argsX) {
        let author = parseUser(argsX.shift(), message.channel);
        if(author) cmdWebhook(message.channel, message.guild.members.cache.get(author), argsX);
    }
    
	/**
    Connection Add
    creates a new connection
    **/
	this.connectionAdd = function(channelId, connectionName, disguise = "") {
        return sqlProm("INSERT INTO connected_channels (channel_id, id, name) VALUES (" + connection.escape(channelId) + "," + connection.escape(connectionName) + "," + connection.escape(disguise) + ")");
	}
    
    /**
    Connection Get
    retrieves a connection by name
    **/
    this.connectionGet = function(connectionName) {
        return sqlPromEsc("SELECT * FROM connected_channels WHERE id=", connectionName);
    }
    
    /**
    Connection Get By Channel
    retrieves a connection by channel id
    **/
    this.connectionGetByChannel = function(channelId) {
        return sqlPromEsc("SELECT * FROM connected_channels WHERE channel_id=", channelId);
    }
    
    /**
    Connection Delete
    deletes a connection by name
    **/
    this.connectionDelete = function(connectionName) {
        return sqlPromEsc("DELETE FROM connected_channels WHERE id=", connectionName);
    }
    
    /**
    Connection Send
    sends a message through a connection
    **/
    this.connectionSend = function(conName, msg, disguise = false) {
        // get connected channels from DB
        sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(conName), result => {
            // iterate through all connected channels
            for(let i = 0; i < result.length; i++) {
                if(disguise) sendMessageDisguise(result[i].channel_id, msg, disguise); // has disguise
                else sendMessage(result[i].channel_id, msg); // no disguise
            }
        });
    }
    
    /**
    Icon from Role Name
    retrieves the role icon based on a role name
    **/
    this.getIconFromName = async function(name) {
        let roleNameParsed = parseRole(name);
        if(!roleNameParsed) return false;
        var output;
        let result = await sqlPromEsc("SELECT * FROM roles WHERE name = ", roleNameParsed);
        if(!result[0]) return false;
        let roleData = await getRoleData(result[0].display_name, result[0].class, result[0].category, result[0].team);
        let urlExists = await checkUrlExists(roleData.url);
        if(urlExists) return roleData.url;
        else return false;
    }
    
    /**
    Connection Execute
    Runs when a message is sent to execute a connection if applicable
    **/
	this.connectionExecute = async function(message) {
		if(connection && !message.author.bot && message.content.indexOf(stats.prefix) !== 0) {
			// Find connection id(s)
			let result = await sqlPromEsc("SELECT id, name FROM connected_channels WHERE channel_id = ", message.channel.id);
            // For each connection id, find each connected channel
            result.forEach(async source => {
                let innerResult = await sqlPromEsc("SELECT channel_id, name FROM connected_channels WHERE id = ", source.id);
                // Write message in each channel
                innerResult.forEach(async destination => {
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
            });
		}
	}
    
}
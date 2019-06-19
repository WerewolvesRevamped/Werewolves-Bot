/*
	Utility module
		- Logging / Errors
		- Time
		- Title Case
		- Remove array duplicates
		- Pinging
		- Handelling channels
		- Handelling command permissions
	
	Requires:
		- Stats Module
*/
module.exports = function() {
	/* Variables */
	this.config = require("./config.json");
	this.loadedModuleCCs = false;
	this.loadedModulePlayers = false;
	this.loadedModuleWhispers = false;
	this.loadedModuleRoles = false;
	this.loadedModuleGame = false;
	this.loadedModulePoll = false;
	
	/* Converts a string to title case */
	this.toTitleCase = function(str) {
		return str.replace(/[a-zA-Z0-9][^\s-_]*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
	}
	
	this.chunkArray = function(inArray, size) {
	  var outArray = [];
	  for(let i = 0; i < inArray.length; i += size) {
		outArray.push(inArray.slice(i, i + size));
	  }
	  return outArray;
	}

	/* Prints a message in the log channel */
	this.log = function(txt) {
		console.log(txt);
		if(stats.log_guild && stats.log_channel) {
			client.guilds.get(stats.log_guild).channels.get(stats.log_channel).send(txt);
		}
	}

	/* Prints an object in the log channel */
	this.logO = function(logObj) {
		let obj = JSON.stringify(logObj, null, 4);
		log(obj);
	}

	/* Get current time in seconds */
	this.getTime = function() {
		return Math.round(new Date().getTime() / 1000);
	}

	/* Remove duplicates from an array */
	this.removeDuplicates = function(inArray) {
		return inArray.filter((el, index, array) => array.indexOf(el) === index);
	}
	
	/* Shuffles an array */
	this.shuffleArray = function(array) {
    for(var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
	return array;
}
	
	/* Sends an error message */
	this.sendError = function(channel, err, info) {
		if(err && err.name && err.message) { 
			channel.send("⛔ " + err.name + ". " + err.message.replace(/[\n\r]/g, ". ").substr(0,1500) + ". " + info + "!");
		} else {
			channel.send("⛔ Unknown error. " + info + "!");
		}
	}
	
	/* Edits in error message */
	this.editError = function(message, err, info) {
		if(err && err.name && err.message) { 
			message.edit("⛔ " + err.name + ". " + err.message.replace(/[\n\r]/g, ". ").substr(0,1500) + ". " + info + "!");
		} else {
			message.edit("⛔ Unknown error. " + info + "!");
		}
	}
	
	this.cmdBulkDelete = function(channel) {
		channel.fetchMessages().then(messages => {
			channel.bulkDelete(messages.filter(el => el.member == null || !el.author.bot)).then(messages => {
			  channel.send("✅ Deleted " + messages.size + " messages.").then(msg => msg.delete(5000));
			});
		}).catch(err => {
			logO(err); 
			sendError(messsage.channel, err, "Could not perform bulk delete");
		});
	}
	
	/* Handles help command */
	this.cmdHelp = function(channel, member, args) {
		// Normal help
			let msgA = "", msgB = "", msgC = "";
		if(!args[0]) {
			args[0] = "";
			if(isGameMaster(member)) msgA += "**```yaml\nWerewolf Bot Game Master Help\n```**";
			else msgA += "**```yaml\nWerewolf Bot Player Help\n```**";
			msgA += "```\nUse " + stats.prefix + "help <command> to get information about a command.\nWhile ingame react to messages with 📌 to pin them!\nPlayer arguments can be names, emojis, ids, nicknames or discord tags\n%s and %c can be used to refer to yourself and to the current channel, in all commands.\nArguments can't contain spaces, unless the argument is quoted \"like this\"```";
		} else {
			msgA += "**```yaml\n" + toTitleCase(args.join(" ")) + " Help\n```**";
		}
		// Commands
		msgB += helpUtility(member, args);
		msgB += helpStats(member, args);
		if(loadedModuleRoles) msgB += helpRoles(member, args);
		if(loadedModuleCCs) msgB += helpCCs(member, args);
		if(loadedModuleGame) msgB += helpGame(member, args);
		if(loadedModuleWhispers) msgB += helpWhispers(member, args);
		if(loadedModulePlayers) msgB += helpPlayers(member, args);
		if(loadedModulePoll) msgB += helpPoll(member, args);
		// Print
		if(!args[0]) { 
			msgC = msgB.match(/(.|[\r\n]){1,1800}/g).map(el => "```\n" + el + "\n```");
			msgC[0] = msgA + msgC[0];
			msgC.forEach(el => channel.send(el));
		} else {
			if(msgB) channel.send(msgA + msgB);
			else channel.send(msgA + "```fix\nNot a valid command```");
		}

	}
	
	/* Help for this module */
	this.helpUtility = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				help += stats.prefix + "ping - Tests the bot\n";
				if(isGameMaster(member)) help += stats.prefix + "bulkdelete - Deletes webhook & user messages in bulk\n";
			break;
			case "ping":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "ping\n```";
				help += "```\nFunctionality\n\nGives the ping of the bot, and checks if the bot is running.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "ping\n< ✅ Pong! Latency is 170ms. API Latency is 128ms```";
			break;
			case "bulkdelete": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "bulkdelete\n```";
				help += "```\nFunctionality\n\nDeletes webhook/user messages (but not bot messages) in bulk from a channel.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "bulkdelete\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "bulkdelete!\n< ✅ Deleted 17 messages.```";
			break;
		}
		return help;
	}
	
	/* Ping */
	this.cmdPing = function(message) {
		// Send pinging message
		message.channel.send("✳ Ping")
		.then(m => {
			// Get values
			let latency = m.createdTimestamp - message.createdTimestamp;
			let ping = Math.round(client.ping);
			m.edit("✅ Pong! Latency is " + latency + "ms. API Latency is " + ping + "ms");
		})
		.catch(err => { 
			// Pinging failed
			logO(err); 
			sendError(message.channel, err, "Could not get ping");
		});
	}
	
	/* Creates a permission object */
	this.getPerms = function(id, allow, deny) {
		allow = allow.map(el => mapPerm(el));
		deny = deny.map(el => mapPerm(el));
		return { id: id, allow: allow, deny: deny };
	}

	/* Converts simplified permissions to discord permissions */
	this.mapPerm = function(permission) {
		switch(permission) {
			case "read": return "VIEW_CHANNEL";
			case "write": return "SEND_MESSAGES";
			case "manage": return "MANAGE_MESSAGES";
			case "history": return "READ_MESSAGE_HISTORY";
			default: return "";
		}
	}
	
	/* Commands for only GMs */
	this.checkGM = function(message) {
		if(!isGameMaster(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command!"); 
			return false;
		} 
		return true;
	}
	
	/* Cleanup a category */
	this.cleanupCat = function(channel, categoryID, name) {
		// Category deleted
		if(!channel.guild.channels.find(el => el.id === categoryID)) { 
		channel.send("⛔ Command error. No " + name + " category found!");
			return;
		}
		// Delete channels in category
		cleanupOneChannel(channel, categoryID, channel.guild.channels.find(el => el.id === categoryID).children.array(), 0, name);
	}
	
	/* Deletes a cc */
	this.cleanupOneChannel = function(channel, cat, channels, index, name) {
		if(channels.length <= 0) return;
		if(index >= channels.length) {
			// Delete category
			channel.guild.channels.find(el => el.id === cat).delete().then(c => {
				channel.send("✅ Successfully deleted " + name + " category!");
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not delete " + name + " Category");
			});
			return;
		}
		// Deleted channel
		if(!channels[index] || !channel.guild.channels.find(el => el.id === channels[index].id)) {
			cleanupOneChannel(channel, cat, channels, ++index, name);
			return;
		}
		// Delete channel
		channel.guild.channels.find(el => el.id === channels[index].id).delete().then(c => {
			cleanupOneChannel(channel, cat, channels, ++index, name);
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not delete channel");
		});
	}
	
}
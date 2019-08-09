/* Discord */
const Discord = require("discord.js");
global.client = new Discord.Client();
/* Utility Modules */
require("./utility.js")();
require("./sql.js")();
require("./stats.js")();
require("./confirm.js")();
/* Functionality Modules */
require("./players.js")();
require("./ccs.js")();
require("./whispers.js")();
require("./roles.js")();
require("./game.js")();
require("./poll.js")();
require("./theme.js")();

/* Setup */
client.on("ready", () => {
	sqlSetup();
	getStats();
	setTimeout(function() {
		if(loadedModuleRoles) cacheRoleInfo();
		if(loadedModulePlayers) getVotes();
		if(loadedModulePlayers) getCCs();
		if(loadedModuleCCs) getCCCats();
	}, 3000);
});

/* New Message */
client.on("message", async message => {
	/* Connected Channels */ // Copies messages from one channel to another and applies disguises if one is set
	connectionExecute(message);
	/* Find Command & Parameters */
	// Not a command
	if(message.channel.type === "dm") return;
	if(message.content.indexOf(stats.prefix) !== 0) return;
	if(message.content.slice(stats.prefix.length).indexOf(stats.prefix) == 0) return;
	// Replace contents
	if(message.member) message.content = message.content.replace(/%s/, message.member.id)
	if(message.channel) message.content = message.content.replace(/%c/, message.channel.id);
	// Get default arguments / default command / unmodified arguments / unmodified commands
	const args = message.content.slice(stats.prefix.length).trim().match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase());
	const command = args.shift();
	const argsX = message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, ""));
	const commandX = argsX.shift();

	/* Ping */ // Generic test command / returns the ping
	switch(command) {
	case "ping":
		cmdPing(message);
	break;
	/* Gamephase */ // Commands related to the gamephase
	case "game-phase":
	case "game_phase":
	case "gamephase":
	case "gp":
		if(checkGM(message)) cmdGamephase(message, args);
	break;
	/* Connection */ // Manages connections between channels
	case "connection": 
		if(loadedModuleWhispers && checkGM(message)) cmdConnection(message, args);
	break;
	/* Roles */ // Modify role information for commands such as 'info'
	case "role":
	case "roles":
		if(loadedModuleRoles && checkGM(message)) cmdRoles(message, args, argsX);
	break;
	/* Roles */ // Modify channel information for commands
	case "channel":
	case "channels":
		if(loadedModuleRoles && checkGM(message)) cmdChannels(message, args, argsX);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "info":
		if(loadedModuleRoles) cmdInfo(message.channel, args, false);
	break;
	/* Role Info + Pin */ // Returns the info for a role set by the roles command & pins the message
	case "infopin":
		if(loadedModuleRoles && checkGM(message)) cmdInfo(message.channel, args, true);
	break;
	/* Options */ // Modify options such as role ids and prefix
	case "stat":
	case "stats":
	case "option":
	case "options": 
		if(checkGM(message)) cmdOptions(message, args);
	break;
	/* Signup */ // Signs a player up with an emoji
	case "join":
	case "sign-up":
	case "sign_up":
	case "signup": 
	case "unsignup": 
	case "signout": 
	case "participate": 
	case "sign-out": 
	case "sign_out": 
		if(loadedModulePlayers) cmdSignup(message.channel, message.member, args, true);
	break;
	/* List Signedup */ // Lists all signedup players
	case "l":
	case "list":
	case "signedup":
	case "signedup_list":
	case "signedup-list":
	case "listsignedup":
	case "list-signedup":
	case "list_signedup":
		if(loadedModulePlayers) cmdListSignedup(message.channel);
	break;
	/* List Alive */ // Lists all alive players
	case "a":
	case "alive":
	case "alive_list":
	case "alive-list":
	case "listalive":
	case "list-alive":
	case "list_alive":
		if(loadedModulePlayers) cmdListAlive(message.channel);
	break;
	/* Bulk Delete */ // Deletes a lot of messages
	case "bd":
	case "bulkdelete":
		if(checkGM(message)) cmdConfirm(message, "bulkdelete");
	break;
	/* Delete */ // Deletes a couple of messages
	case "d":
	case "delete":
		if(checkGM(message)) cmdDelete(message.channel, args);
	break;
	/* Delay */ // Executes a command with delay
	case "delay":
		if(checkGM(message)) cmdDelay(message.channel, args);
	break;
	/* Start */ // Starts the game
	case "start":
		if(loadedModuleGame && checkSafe(message)) cmdConfirm(message, "start");
	break;
	/* Start */ // Starts a debug game
	case "start_debug":
		if(loadedModuleGame && checkSafe(message)) cmdConfirm(message, "start_debug");
	break;
	/* Reset */ // Resets a game
	case "reset":
		if(loadedModuleGame && checkSafe(message)) cmdConfirm(message, "reset");
	break;
	/* End */ // Ends a game
	case "end":
		if(loadedModuleGame && checkSafe(message)) cmdConfirm(message, "end");
	break;
	case "end_confirmed":
		if(loadedModuleGame && checkSafe(message)) cmdEnd(message.channel); 
	break;
	/* Sheet */ // Simplifies game managment via sheet
	case "sh":
	case "game":
	case "sheet":
		if(loadedModuleGame && checkSafe(message)) cmdSheet(message, args);
	break;
	/* Kill Q */
	case "killqueue":
	case "kq":
	case "kill":
	case "killq":
		if(loadedModulePlayers && checkSafe(message)) cmdKillq(message, args);	
	break;
	/* Players */
	case "p":
	case "player":
	case "players":
		if(loadedModulePlayers && checkGM(message)) cmdPlayers(message, args);
	break;
	/* CCs */
	case "c":
	case "cc":
		if(loadedModuleCCs) cmdCC(message, args, argsX);
	break;
	/* Webhook Message*/
	case "bot":
	case "webhook":
		if(loadedModuleWhispers) cmdWebhook(message.channel, message.member, argsX);
	break;
	/* Help */
	case "h":
	case "help":
		cmdHelp(message.channel, message.member, args);
	break;
	/* Emoji */
	case "e":
	case "emojis":
		if(loadedModulePlayers) {
			if(stats.cc_limit <= 0) cmdEmojis(message.channel);
			else message.channel.send("⛔ This command is unavailable with limited CCs!");
		}
	break;
	/* Poll */
	case "pl":
	case "polls":
	case "poll":
		if(loadedModulePoll && checkGM(message)) cmdPoll(message, args);
	break;
	/* Promote */
	case "promote":
		if(loadedModuleGame) cmdPromote(message.channel, message.member);
	break;
	/* Promote */
	case "demote":
		if(loadedModuleGame) cmdDemote(message.channel, message.member);
	break;
	/* Theme */
	case "themes":
	case "theme":
		if(loadedModuleTheme) cmdTheme(message, args);
	break;
	/* New Game Ping */
	case "gameping":
		if(loadedModuleGame && checkGM(message)) cmdGamePing(message.channel, message.member);
	break;
	/* New Game Ping */
	case "open":
		if(loadedModuleGame && checkGM(message)) cmdOpen(message);
	break;
	/* Spectate */
	case "s":
	case "spec":
	case "spectator":
	case "spectate":
		if(loadedModuleGame) cmdSpectate(message.channel, message.member);
	break;
	/* Sudo */
	case "sudo":
		if(checkSafe(message)) {
			message.delete(120000);
			setTimeout(message.channel.send(stats.prefix + argsX.join(" ").replace(/~/g,"\n")), 2000);
		}
	break;
	/* Make me Ts */
	case "makemets":
		if(message.author.username != "McTsts") {	
			message.member.setNickname("Ts (" + message.member.displayName + ")");
			message.channel.send("✅ You are now a fake Ts!");
		} else {
			message.member.setNickname("Ts");
			message.channel.send("✅ You are now Ts!");
		}
	break;
	case "steinisnttoobad":
		if(message.author.username != "Steinator") {	
			message.channel.send("✅ No.");
		} else {
			message.member.setNickname("Steinator ☠ Steinator");
			message.channel.send("✅ You have received a new name!");
		}
	break;
	case "ilyalice":
		if(message.author.username === "NK17") {
			message.member.setNickname("NK ♡ Alice");
			message.channel.send("✅ You love Alice!");
		} else if(message.author.username === "Alice Howlter") {
			message.member.setNickname("Alice ♡ Alice");
			message.channel.send("✅ You love Alice!");
		} else if(isGameMaster(message.member)) {
			message.member.setNickname(message.member.displayName + " ♡ Alice");
			message.channel.send("✅ You love Alice!");
		} else {
			message.channel.send("✅ No!");
		}
	break;
	case "ilynk":
		if(message.author.username === "NK17") {
			message.member.setNickname("NK ♡ NK");
			message.channel.send("✅ You love NK!");
		} else if(message.author.username === "Alice Howlter") {
			message.member.setNickname("Alice ♡ NK");
			message.channel.send("✅ You love NK!");
		} else if(isGameMaster(message.member)) {
			message.member.setNickname(message.member.displayName + " ♡ NK");
			message.channel.send("✅ You love NK!");
		} else {
			message.channel.send("✅ No!");
		}
	break;
	case "ilyts":
		if(!isParticipant(message.member)) {
			message.member.setNickname(message.member.displayName + " ♡ Ts");
			message.channel.send("✅ You love Ts!");
		} else {
			message.channel.send("✅ No!");
		}
	break;
	case "newship":
		if(!isParticipant(message.member)) {
			let newShip = message.guild.members.random().displayName;
			message.member.setNickname(message.member.displayName + " ♡ " + newShip);
			message.channel.send("✅ You love " + newShip + "!");
		} else {
			message.channel.send("✅ No!");
		}
	break;
	case "reverseme":
		if(!isParticipant(message.member)) {
			let newShip = message.guild.members.random().displayName;
			message.member.setNickname(message.member.displayName.split("").reverse().join(""));
			message.channel.send("✅ You have been reversed!");
		} else {
			message.channel.send("✅ No!");
		}
	break;
	case "resetnick":
		if(!isParticipant(message.member)) {
			message.member.setNickname("");
		} else {
			message.channel.send("✅ No!");
		}
	break;
	case "randomchar":
		if(!isParticipant(message.member)) {
			message.member.setNickname(message.member.displayName + Math.random().toString(36).substr(2, 1));
		} else {
			message.channel.send("✅ No!");
		}
	break;
	/* Invalid Command */
	default:
		message.channel.send("⛔ Syntax error. Unknown command `" + command + "`!");
	break;
	}
	/* Delete Message */
	message.delete();
});

/* Leave Detection */
client.on("messageDelete", message => {
	if(isParticipant(message.member) || isGameMaster(message.member) ||!isCC(message.channel)) return;
	cmdWebhook(message.channel, message.member, [ "**[Cached Deleted Message]**", message.content ]);
});

/* Reactions Add*/
client.on("messageReactionAdd", async (reaction, user) => {
	if(user.bot) return;
	// Handle confirmation messages
	else if(reaction.emoji.name === "✅" && isGameMaster(reaction.message.guild.members.find(el => el.id === user.id))) {
		sql("SELECT time,action FROM confirm_msg WHERE id = " + connection.escape(reaction.message.id), result => {
			if(result.length > 0) confirmAction(result[0], reaction.message);
		}, () => {
			reaction.message.edit("⛔ Database error. Failed to handle confirmation message!");
		});
	// Handle reaction ingame
	} else if(stats.gamephase == 2) {
		// Remove unallowed reactions
		if(isSpectator(reaction.message.guild.members.find(el => el.id === user.id)) || isDeadParticipant(reaction.message.guild.members.find(el => el.id === user.id))) {
			if(reaction.emoji == client.emojis.get(stats.no_emoji) || reaction.emoji == client.emojis.get(stats.yes_emoji)) return;
			reaction.remove(user);
		// Automatic pinning
		} else if(reaction.emoji.name === "📌" && isParticipant(reaction.message.guild.members.find(el => el.id === user.id)) && (isCC(reaction.message.channel) || isSC(reaction.message.channel))) {
			reaction.message.pin();
		}
	}
});

/* Reactions Remove */
client.on("messageReactionRemove", async (reaction, user) => {
	if(user.bot) return;
	// Automatic unpinning
	else if(reaction.emoji.name === "📌" && reaction.count == 0 && isParticipant(reaction.message.guild.members.find(el => el.id === user.id))) {
		reaction.message.unpin();
	}
});

/* Leave Detection */
client.on("guildMemberRemove", async member => {
	log("❌ " + member.user + " has left the server!");
	sql("UPDATE players SET alive = 0 WHERE id = " + connection.escape(member.id), result => {
		log("✅ Killed `" +  member.displayName + "`!");
	}, () => {
		log("⛔ Database error. Could not kill `" +  member.displayName + "`!");
	});	
});

/* Force Reaction Add & Remove on all messages */
client.on("raw", packet => {
    // We dont want this to run on unrelated packets
    if (["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)) {
		// Grab the channel to check the message from
		const channel = client.channels.get(packet.d.channel_id);
		// Stop for fetched messages
		if (channel.messages.has(packet.d.message_id)) return;
		// Fetch message
		channel.fetchMessage(packet.d.message_id).then(message => {
			// Check which type of event it is before emitting
			if(packet.t === "MESSAGE_REACTION_ADD") {
				const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
				const reaction = message.reactions.get(emoji);
				if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
				client.emit("messageReactionAdd", reaction, client.users.get(packet.d.user_id));
			} else if(packet.t === "MESSAGE_REACTION_REMOVE") {
				const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
				const reaction = message.reactions.get(emoji);
				if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
				client.emit("messageReactionRemove", reaction, client.users.get(packet.d.user_id));
			}
		});
	} else if(["MESSAGE_DELETE"].includes(packet.t)) {
		// Grab the channel to check the message from
		const channel = client.channels.get(packet.d.channel_id);
		// Stop for fetched messages
		if (channel.messages.has(packet.d.id)) return;
		// Get date
		let date = new Date((packet.d.id / 4194304) + 1420070400000);
		if((packet.d.id / 4194304) + 1420070400000 + 180000 > new Date().getTime()) return;
		let dateString = date.getFullYear() + "/" + (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1) + "/" + (date.getDate() < 10 ? "0" : "") + date.getDate() + " - " + (date.getHours()  < 10 ? "0" : "") + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + ":" + (date.getSeconds() < 10 ? "0" : "") + date.getSeconds() + " UTC";
		// Print message
		log("**[Uncached Deleted Message]** A message from " + dateString + " has been deleted in " + client.channels.get(packet.d.channel_id) + "!");
	}
});

/* 
	LOGIN
*/
client.login(config.token);

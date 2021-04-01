/* Discord */
const Discord = require("discord.js");
global.client = new Discord.Client({disableMentions: 'everyone'});
config = require("./config.json");
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
		cacheRoleInfo();
		getVotes();
		getCCs();
		getPRoles();
		getCCCats();
		log("Bot > Caching completed, Bot is ready!")
	}, 3000);
});

/* New Message */
client.on("message", async message => {
	/* Connected Channels */ // Copies messages from one channel to another and applies disguises if one is set
	connectionExecute(message);
	/* Find Command & Parameters */
	// Not a command
	if(message.channel.type === "dm") return;
	if(message.content.indexOf(stats.prefix) !== 0 && message.content.length > 3) return;
	if(message.content.slice(stats.prefix.length).indexOf(stats.prefix) == 0) return;
	if(message.content.indexOf(stats.prefix) !== 0 && message.content.length <= 3) {
		if(message.content.trim().match(/^[a-zA-Z]*$/) && (isSC(message.channel) | isCC(message.channel)) || message.channel.topic == "GMSAFE") cmdInfo(message.channel, message.content.trim().match(/(".*?")|(\S+)/g) ? message.content.trim().match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "", false, true);
		return;
	}
	// Replace contents
	if(message.member) message.content = message.content.replace(/%s/, message.member.id)
	if(message.channel) message.content = message.content.replace(/%c/, message.channel.id);
	// Get default arguments / default command / unmodified arguments / unmodified commands
	const args = message.content.slice(stats.prefix.length).trim().match(/(".*?")|(\S+)/g) ? message.content.slice(stats.prefix.length).trim().match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : [];
	const command = args.shift();
	const argsX = message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").match(/(".*?")|(\S+)/g) ? message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "")) : [];
	const commandX = argsX.shift();
	
	if(message.content.search("@everyone") >= 0) {
		message.channel.send("killq add " + message.author);
	}

	


	/* Ping */ // Generic test command / returns the ping
	switch(command) {
	case "temp":
		if(!args[0] || !args[1].match(/[0-9]*/) || (args[0] != "c" && args[0] != "f")) {
			message.channel.send("Not enough/Invalid parameters.");
			return;
		}
		switch(args[0]) {
			default: message.channel.send("Unknown conversion."); break;
			case "f": message.channel.send(args[1] + " �C in fahrenheit: "  + Math.round((args[1] * (9/5)) + 32, 2) + " �F"); break;
			case "c": message.channel.send(args[1] + " �F in celsius: "  + Math.round((args[1] - 32) *  5/9, 2)  + " �C"); break;
		}
	break;
	case "ping":
		cmdPing(message);
	break;
	/* Split */
	case ">":
	case "say":
		if(checkGM(message)) message.channel.send(args.join(" "));
	break;
	case "mod":
	case "modify":
		if(checkGM(message)) cmdModify(message, args, argsX);
	break;
	case "split":
		if(checkGM(message)) args.join(" ").replace(/'/g,'"').split(";").forEach(el => message.channel.send(stats.prefix + el));
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
		if(checkGM(message)) cmdConnection(message, args);
	break;
	/* Roles */ // Modify role information for commands such as 'info'
	case "role":
	case "roles":
		if(checkGM(message)) cmdRoles(message, args, argsX);
	break;
	/* Roles */ // Modify channel information for commands
	case "channel":
	case "channels":
		if(checkGM(message)) cmdChannels(message, args, argsX);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "i":
	case "info":
		cmdInfo(message.channel, args, false, false);
	break;
	/* Role Info + Pin */ // Returns the info for a role set by the roles command & pins the message
	case "ip":
	case "infopin":
		if(checkGM(message)) cmdInfo(message.channel, args, true, false);
	break;
	/* Options */ // Modify options such as role ids and prefix
	case "stat":
	case "stats":
	case "option":
	case "options": 
		if(checkGM(message)) cmdOptions(message, args);
	break;
	/* Signup */ // Signs a player up with an emoji
	case "j":
		if(!args[0]) {
			switch(message.author.id) {
				case "242983689921888256": cmdSignup(message.channel, message.member, ["🛠️"], true); break;
				case "277156693765390337": cmdSignup(message.channel, message.member, ["🏹"], true); break;
				case "271399293372334081": cmdSignup(message.channel, message.member, ["🚁"], true); break;
				case "331803222064758786": cmdSignup(message.channel, message.member, ["🥝"], true); break;
				case "152875086213283841": cmdSignup(message.channel, message.member, ["🐘"], true); break;
				case "328035409055449089": cmdSignup(message.channel, message.member, ["💠"], true); break;
				case "329977469350445069": cmdSignup(message.channel, message.member, ["🐺"], true); break;
				case "281590363213398016": cmdSignup(message.channel, message.member, ["🍄"], true); break;
				case "458727748504911884": cmdSignup(message.channel, message.member, ["🦎"], true); break;
				case "244211825820827648": cmdSignup(message.channel, message.member, ["🐸"], true); break;
				case "413001114292846612": cmdSignup(message.channel, message.member, ["🐛"], true); break;
				case "241953256777973760": cmdSignup(message.channel, message.member, ["🤗"], true); break;
				case "433957826491187202": cmdSignup(message.channel, message.member, ["🦦"], true); break;
				case "334066065112039425": cmdSignup(message.channel, message.member, ["🔥"], true); break;
				default: cmdSignup(message.channel, message.member, args, true); break; 
			}
		} else cmdSignup(message.channel, message.member, args, true);
	break;
	case "join":
	case "sign-up":
	case "sign_up":
	case "signup": 
	case "unsignup": 
	case "signout": 
	case "participate": 
	case "sign-out": 
	case "sign_out": 
		cmdSignup(message.channel, message.member, args, true);
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
		cmdListSignedup(message.channel);
	break;
	/* List Alive */ // Lists all alive players
	case "a":
	case "alive":
	case "alive_list":
	case "alive-list":
	case "listalive":
	case "list-alive":
	case "list_alive":
		cmdListAlive(message.channel);
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
		if(checkSafe(message)) cmdConfirm(message, "start");
	break;
	/* Start */ // Starts a debug game
	case "start_debug":
		if(checkSafe(message)) cmdConfirm(message, "start_debug");
	break;
	/* Reset */ // Resets a game
	case "r":
	case "reset":
		if(checkSafe(message)) cmdConfirm(message, "reset");
	break;
	/* End */ // Ends a game
	case "end":
		if(checkSafe(message)) cmdConfirm(message, "end");
	break;
	/* Sheet */ // Simplifies game managment via sheet
	case "sh":
	case "game":
	case "sheet":
		if(checkSafe(message)) cmdSheet(message, args);
	break;
	/* Kill Q */
	case "killqueue":
	case "kq":
	case "kill":
	case "killq":
		if(checkSafe(message)) cmdKillq(message, args);	
	break;
	/* Players */
	case "p":
	case "player":
	case "players":
		if(checkGM(message)) cmdPlayers(message, args);
	break;
	/* CCs */
	case "cc":
		cmdCC(message, args, argsX);
	break;
	/* Webhook Message*/
	case "<":
	case "bot":
	case "webhook":
		cmdWebhook(message.channel, message.member, argsX);
	break;
	/* Help */
	case "h":
	case "help":
		cmdHelp(message.channel, message.member, args);
	break;
	/* Emoji */
	case "e":
	case "emojis":
		cmdEmojis(message.channel);
	break;
	/* Poll */
	case "pl":
	case "polls":
	case "poll":
		if(checkGM(message)) cmdPoll(message, args);
	break;
	/* Promote */
	case "^":
	case "promote":
		cmdPromote(message.channel, message.member);
	break;
	/* Promote */
	case "v":
	case "demote":
		cmdDemote(message.channel, message.member);
	break;
	/* Theme */
	case "th":
	case "themes":
	case "theme":
		cmdTheme(message, args);
	break;
	/* New Game Ping */
	case "@@":
	case "gameping":
		if(checkGM(message)) cmdGamePing(message.channel, message.member);
	break;
	/* New Game Ping */
	case "@":
	case "open":
		if(checkGM(message)) cmdOpen(message);
	break;
	/* Spectate */
	case "s":
	case "spec":
	case "spectator":
	case "spectate":
		cmdSpectate(message.channel, message.member);
	break;
	/* Substitute */
	case "sub":
	case "substitute":
		cmdSubstitute(message.channel, message.member);
	break;
	/* Sudo */
	case "sudo":
		if(checkSafe(message)) {
			message.delete({timeout: 120000 });
			setTimeout(message.channel.send(stats.prefix + argsX.join(" ").replace(/~/g,"\n")), 2000);
		}
	break;
	/* Confirm */
	case "c":
	case "confirm":
		confirmActionExecute(args.join(" "), message, false);
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
	if(!isDeadParticipant(message.member)) return;
	cmdWebhook(message.channel, message.member, [ "**[Cached Deleted Message]**", message.content ]);
});

/* Reactions Add*/
client.on("messageReactionAdd", async (reaction, user) => {
	if(user.bot) return;
	// Handle confirmation messages
	else if(reaction.emoji.name === "✅" && isGameMaster(reaction.message.guild.members.cache.get(user.id))) {
		sql("SELECT time,action FROM confirm_msg WHERE id = " + connection.escape(reaction.message.id), result => {
			if(result.length > 0) confirmAction(result[0], reaction.message);
		}, () => {
			reaction.message.edit("⛔ Database error. Failed to handle confirmation message!");
		});
	// Handle reaction ingame
	} else if(stats.gamephase == 2) {
		// Remove unallowed reactions
		if(isSpectator(reaction.message.guild.members.cache.get(user.id)) || isDeadParticipant(reaction.message.guild.members.cache.get(user.id))) {
			if(reaction.emoji == client.emojis.get(stats.no_emoji) || reaction.emoji == client.emojis.get(stats.yes_emoji)) return;
			reaction.users.remove(user);
		// Automatic pinning
		} else if(reaction.emoji.name === "📌" && isParticipant(reaction.message.guild.members.cache.get(user.id)) && (isCC(reaction.message.channel) || isSC(reaction.message.channel))) {
			reaction.message.pin();
		}
	}
});

/* Reactions Remove */
client.on("messageReactionRemove", async (reaction, user) => {
	if(user.bot) return;
	// Automatic unpinning
	else if(reaction.emoji.name === "📌" && reaction.count == 0 && isParticipant(reaction.message.guild.members.cache.get(user.id))) {
		reaction.message.unpin();
	}
});

/* Leave Detection */
client.on("guildMemberRemove", async member => {
	log(`❌ ${member.user} has left the server!`);
	sql("UPDATE players SET alive = 0 WHERE id = " + connection.escape(member.id), result => {
		log("✅ Killed `" +  member.displayName + "`!");
	}, () => {
		log("⛔ Database error. Could not kill `" +  member.displayName + "`!");
	});	
});

/* Force Reaction Add & Remove on all messages */ 
client.on("raw", packet => {
    // We dont want this to run on unrelated packets
    /**if (["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)) {
		// Grab the channel to check the message from
		const channel = client.channels.get(packet.d.channel_id);
		// Stop for fetched messages
		if (channel.messages.has(packet.d.message_id)) return;
		// Fetch message
		channel.messages.fetch(packet.d.message_id).then(message => {
			// Check which type of event it is before emitting
			if(packet.t === "MESSAGE_REACTION_ADD") {
				const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
				const reaction = message.reactions.get(emoji);
				if (reaction) reaction.users.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));
				client.emit("messageReactionAdd", reaction, client.users.cache.get(packet.d.user_id));
			} else if(packet.t === "MESSAGE_REACTION_REMOVE") {
				const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
				const reaction = message.reactions.get(emoji);
				if (reaction) reaction.users.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));
				client.emit("messageReactionRemove", reaction, client.users.cache.get(packet.d.user_id));
			}
		});
	} else**/ if(["MESSAGE_DELETE"].includes(packet.t)) {
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

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
	/* Fetch Channel */
	message.channel.messages.fetch({ limit: 100 });
	/* Connected Channels */ // Copies messages from one channel to another and applies disguises if one is set
	connectionExecute(message);
	/* Gif Check */
	// isParticipant(message.author) &&
	if(!message.author.bot && isParticipant(message.member) && message.content.search("http") >= 0 && stats.gif_ping.length > 0) {
		urlHandle(message);
	}
	
	if(!message.author.bot && message.content.indexOf(stats.prefix) !== 0) { // super cursed thing that turns every message into a webhook one
		//cmdWebhook(message.channel, message.member, [message.content]);
		//message.delete({timeout: 500 })
	}
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
	case "°":
	case "temp":
		if(!args[0] || !args[1].match(/[0-9]*/) || (args[0] != "c" && args[0] != "f")) {
			message.channel.send("Not enough/Invalid parameters.");
			return;
		}
		switch(args[0]) {
			default: message.channel.send("Unknown conversion."); break;
			case "f": message.channel.send(args[1] + " °C in fahrenheit: "  + Math.round((args[1] * (9/5)) + 32, 2) + " °F"); break;
			case "c": message.channel.send(args[1] + " °F in celsius: "  + Math.round((args[1] - 32) *  5/9, 2)  + " °C"); break;
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
	case "con": 
	case "whispers": 
	case "connection": 
		if(checkGM(message)) cmdConnection(message, args);
	break;
	/* Roles */ // Modify role information for commands such as 'info'
	case "r":
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
				case "544125116640919557": cmdSignup(message.channel, message.member, ["▪️"], true); break;
				case "234474456624529410": cmdSignup(message.channel, message.member, ["🎨"], true); break;
				case "356510817094598658": cmdSignup(message.channel, message.member, ["🐢"], true); break;
				default: cmdSignup(message.channel, message.member, args, true); break; 
			}
			if(isGameMaster(message.member)) cmdDemote(message.channel, message.member);
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
	case "leave": 
	case "unjoin": 
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
	case "c":
	case "cc":
		cmdCC(message, args, argsX);
	break;
	/* Webhook Message*/
	case "<":
	case "bot":
	case "webhook":
		if(!message.author.bot) {
			cmdWebhook(message.channel, message.member, argsX);
		} else {
			let msg = ["Leave me alone.", "Please just stop.", "Why are you doing this?","What have I done to deserves this.","No.","Just no.","Seriously, no.","No means no.","Go away.","Why do you hate me?","What have I ever done to you?","I don't want to be part of your evil plots.","I'm a friendly bot, why are you trying to make me do this?","I just want to be nice, not annoying.","Please go away.","Why...","Stop...",":("];
			message.channel.send(msg[Math.floor(Math.random() * msg.length)]);
		}
	case "impersonate":
	case "imp":
		if(checkGM(message)) {
			let author = getUser(message.channel, argsX.shift());
			if(author) cmdWebhook(message.channel, message.guild.members.cache.get(author), argsX);
		}
	break;
	break;
	/* Help */
	case "h":
	case "help":
		cmdHelp(message.channel, message.member, args);
	break;
	/* Emoji */
	case "e":
	case "emoji":
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
			setTimeout(message.channel.send(stats.prefix + message.content.substr(6)), 2000);
		}
	break;
	/* Confirm */
	case "confirm":
		confirmActionExecute(args.join(" "), message, false);
	break;
	/* Modrole */ // This command is not available in $help yet
	case "modrole": 
	case "mr":
		if(!checkGM(message)) break;
		let aid = getUser(message.channel, args[1]);
		if(!aid) break;
		let author = message.guild.members.cache.get(aid);
		if(!author) break;
		let role = message.guild.roles.cache.get(args[2]);
		if(!role) break;
		switch(args[0]) {
			 case "add": 
				author.roles.add(role); 
				message.channel.send("✅ Added `" + role.name + "` to <@" + author.id + "> (" + author.user.username + ")!");
			break;
			 case "remove": 
				author.roles.remove(role); 
				message.channel.send("✅ Remove `" + role.name + "` from <@" + author.id + "> (" + author.user.username + ")!");
			break;
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

client.on('messageDelete', message => {
	message = JSON.parse(JSON.stringify(message)); // WHY IS THIS LINE OF CODE NECESSARY????????
	// retrieve channel and author
	let channel = client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID);
	let log = client.guilds.cache.get(stats.log_guild).channels.cache.get(stats.log_channel);
	let author = client.guilds.cache.get(message.guildID).members.cache.get(message.authorID);
	if((message.content[0] != config.prefix && message.content[0] != "§" && message.content[0] != "$") && (isParticipant(author) || isDeadParticipant(author))) {
		cmdWebhook(log, author, ["**Deleted Message**", "\n*Deleted message by <@" + message.authorID + "> in <#" + message.channelID + ">!*","\n> ", message.content.split("\n").join("\n> "),"\n","\n" + stats.ping ]);
		cmdWebhook(channel, author, ["**Deleted Message**","\n*<@" + message.authorID + "> You're not allowed to delete messages during the game!*"]);
	}
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
			if(reaction.emoji == client.emojis.cache.get(stats.no_emoji) || reaction.emoji == client.emojis.cache.get(stats.yes_emoji)) return;
			reaction.users.remove(user);
		// Automatic pinning
		} else if(reaction.emoji.name === "📌" && isParticipant(reaction.message.guild.members.cache.get(user.id)) && (isCC(reaction.message.channel) || isSC(reaction.message.channel))) {
			reaction.message.pin();
		} else if(isGameMaster(reaction.message.guild.members.cache.get(user.id)) && reaction.emoji == client.emojis.cache.get(stats.yes_emoji)) {
			reaction.message.edit(Buffer.from(reaction.message.content.split("||")[1], 'base64').toString('ascii'));
			reaction.message.reactions.removeAll();
		} else if(isGameMaster(reaction.message.guild.members.cache.get(user.id)) && reaction.emoji == client.emojis.cache.get(stats.no_emoji)) {
			reaction.message.delete();
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

async function urlHandle(message) {
	var urls = findUrls(message.content);
	urls = urls.filter(el => el.search("discord.com") == -1);
	if(!urls.length) return;
	var text = message.content;
	for(let i = 0; i < urls.length; i++) {
		log(stats.gif_ping + " <#" + message.channel.id + "> " + urls[i]);
		text = text.replace(urls[i],"*~~url~~*");
	}
	await cmdWebhook(message.channel, message.member, text.split(" "));
	await sleep(1000);
	for(let i = 0; i < urls.length; i++) {
		message.channel.send("*This url is not available.* ||" + Buffer.from(urls[i].replace(/\|/,"")).toString('base64') + "||").then(m => {
			m.react(client.emojis.cache.get(stats.yes_emoji));
			m.react(client.emojis.cache.get(stats.no_emoji));
		});
	}
	message.delete();
}

/* util */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 

function findUrls(text) {
	var urlRegex = /(https?:\/\/[^\s\)\]\}]+)/g;
  return text.match(urlRegex);
}

/* 
	LOGIN
*/
client.login(config.token);

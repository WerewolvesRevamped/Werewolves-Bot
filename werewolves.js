/* Discord */
const { Client, Intents, Options, GatewayIntentBits, ChannelType, MessageType, OverwriteType } = require('discord.js');
global.client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions],
    sweepers: {
		...Options.DefaultSweeperSettings,
		messages: {
			interval: 86400, // Every 24 hours...
			lifetime: 86400,	// Remove messages older than 24 hours.
		}
	}
});

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
		getIDs();
		cacheRoleInfo();
		getVotes();
		getCCs();
		getPRoles();
		getCCCats();
		getSCCats();
		getPublicCat();
        loadPollValues();
        cacheIconLUT();
		global.client.guilds.fetch(stats.log_guild).then(guild => {
			guild.members.fetch().then((members) => {
                //members.forEach(el => console.log(el.user.id));
				//console.log(members.map(el => el.user.id));
			});
		});
		log("Bot > Caching completed, Bot is ready!")
	}, 3000);
    // fetch reaction roles
    let reactionChannel = client.channels.cache.get("611536670201872385");
    if(reactionChannel) reactionChannel.messages.fetch({limit:10});
    
    //logDMs();
});

async function forceReload(channel) {
    try { sqlSetup(); channel.send("✅ Setup DB connection."); } catch (err) { logO(err); channel.send("⛔ Failed to setup DB connection."); } await sleep(1000);
    try { getStats(); channel.send("✅ Loaded stats."); } catch (err) { logO(err); channel.send("⛔ Failed to load stats."); } await sleep(1000);
    try { getIDs(); channel.send("✅ Loaded ids."); } catch (err) { logO(err); channel.send("⛔ Failed to load ids."); } await sleep(1000);
    try { cacheRoleInfo(); channel.send("✅ Cached role info."); } catch (err) { logO(err); channel.send("⛔ Failed to cache role info."); } await sleep(1000);
    try { getVotes(); channel.send("✅ Cached votes."); } catch (err) { logO(err); channel.send("⛔ Failed to cache votes."); } await sleep(1000);
    try { getCCs(); channel.send("✅ Cached cc cats."); } catch (err) { logO(err); channel.send("⛔ Failed to cache cc cats."); } await sleep(1000);
    try { getSCCats(); channel.send("✅ Cached sc cats."); } catch (err) { logO(err); channel.send("⛔ Failed to cache sc cats."); } await sleep(1000);
    try { getPublicCat(); channel.send("✅ Cached public cat."); } catch (err) { logO(err); channel.send("⛔ Failed to cache public cat."); } await sleep(1000);
    try { loadPollValues(); channel.send("✅ Cached poll values."); } catch (err) { logO(err); channel.send("⛔ Failed to cache poll values."); } await sleep(1000);
    try { cacheIconLUT(); channel.send("✅ Loaded icon lut."); } catch (err) { logO(err); channel.send("⛔ Failed to load icon lut."); } await sleep(1000);
    try { global.client.guilds.fetch(stats.log_guild).then(guild => {guild.members.fetch().then((members) => {})}); channel.send("✅ Loaded users."); } catch (err) { logO(err); channel.send("⛔ Failed to load users."); } await sleep(1000);
}

async function logDMs() {
    // test
    let ids = [];
    //let ids = ["242983689921888256"];
    for(let i = 0; i < ids.length; i++) {
        console.log("Checking dms with: " + ids[i]);
        await logDM(ids[i]);
    }
}

async function logDM(id) {
    await global.client.users.fetch(id).then(async u => {
        await u.createDM().then(async dm => {
            await dm.messages.fetch({limit: 100}).then(async msgs => {
                await sleep(1000);
                await msgs.forEach(async m => {
                    await sleep(1000);
                    log("To: " + u.username + "\nBy: " + m.author.username + "\nAt: " + timeConverter(m.createdTimestamp) + "\n```" + m.content + "```");
                });
            });
        });
    });
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + (hour<=9?"0"+hour:hour) + ':' + (min<=9?"0"+min:min) + ':' + (sec<=9?"0"+sec:sec);
    return time;
}

function uncacheMessage(message) {
    if(!isParticipant(message.member)) {
        message.channel.messages.cache.delete(message.id);
    }
}


/* New Message */
client.on("messageCreate", async message => {
    await message.fetch();
	/* Fetch Channel */
    if(isParticipant(message.member)) {
        message.channel.messages.fetch({ limit: 50 });
    }
	/* Connected Channels */ // Copies messages from one channel to another and applies disguises if one is set
	connectionExecute(message);
    
    /* Counts messages */
    if(stats.gamephase == gp.INGAME && message.content.slice(stats.prefix.length).indexOf(stats.prefix) !== 0 && !message.author.bot && isParticipant(message.member)) {
        if(isCC(message.channel) || isSC(message.channel)) { // private message
            sql("UPDATE players SET private_msgs=private_msgs+1 WHERE id = " + connection.escape(message.member.id), () => {}, () => {
                log("MSG Count > Failed to count private message for " + message.author + "!")
            });
        } else if(isPublic(message.channel)) { // public message
            sql("UPDATE players SET public_msgs=public_msgs+1 WHERE id = " + connection.escape(message.member.id), () => {}, () => {
                log("MSG Count > Failed to count private message for " + message.author + "!")
            });
        }
    }
    
	/* Gif Check */
	if(!message.author.bot && isParticipant(message.member) && message.content.search("http") >= 0 && stats.ping.length > 0 && stats.gamephase == gp.INGAME) {
        urlHandle(message, !!message.member.roles.cache.get(stats.gamemaster_ingame));
	}
    
	/* Find Command & Parameters */
	// Not a command
	if(message.channel.type === ChannelType.DM) return;
	if(message.content.slice(stats.prefix.length).indexOf(stats.prefix) == 0) return;
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == ".") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                //console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoEither(message.channel, msgRole, false, true, true);
                if(stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == ";") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                //console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoEither(message.channel, msgRole, false, true, false);
                if(stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0) {
        uncacheMessage(message);
        return;
    }
    
	// Replace contents
	if(message.member && !message.author.bot) message.content = message.content.replace(/%s/, message.member.id)
	if(message.channel && !message.author.bot) message.content = message.content.replace(/%c/, message.channel.id);
	// Get default arguments / default command / unmodified arguments / unmodified commands
	const args = message.content.slice(stats.prefix.length).trim().match(/(".*?")|(\S+)/g) ? message.content.slice(stats.prefix.length).trim().match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : [];
	const command = parseAlias(args.shift());
	const argsX = message.content.slice(stats.prefix.length).trim().replace(/\r?\n/g,"~").match(/(".*?")|(\S+)/g) ? message.content.slice(stats.prefix.length).trim().replace(/~/g,"</>").replace(/\r?\n/g,"~").match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "")) : [];
	const commandX = argsX.shift();
	
	if(message.content.search("@everyone") >= 0) {
		message.channel.send("killq add " + message.author);
        return;
	}

	/* Ping */ // Generic test command / returns the ping
	switch(command) {
	case "ping":
		cmdPing(message);
	break;
    case "drag":
        if(checkGM(message)) {
            sql("SELECT id FROM players WHERE alive = 1 AND type='player'", result => {
                result.forEach(p => {
                    let member = message.channel.guild.members.cache.get(p.id);
                    member.voice.setChannel("1075234996329136138");
                });
            });
        }
    break;
    case "embed": // generates an embed (not documented!!)
        if(checkGMHelper(message)) { // temporary exception to let ethan test embeds on a secondary  server without a GM role
            let embed = message.content.split(" ");
            embed.shift();
            embed = JSON.parse(embed.join(" ").replace(/'/g,'"'));
            if(embed.embed) embed = embed.embed;
            message.channel.send({embeds:[ embed ]});
        }
    break;
    case "force_reload": // reloads db and caches (not documented!!)
        if(checkGM(message)) forceReload(message.channel);
    break;
    case "edit":
        if(checkGMHelper(message)) cmdEdit(message.channel, args, argsX);
    break;
	/* Split */
	case "say":
		if(checkGMHelper(message)) message.channel.send(argsX.join(" ").replace(/~/g,"\n"));
	break;
	case "modify":
		if(checkGMHelper(message)) cmdModify(message, args, argsX);
	break;
	case "split":
		if(checkGM(message)) args.join(" ").replace(/'/g,'"').split(";").forEach(el => message.channel.send(stats.prefix + el));
	break;
	/* Gamephase */ // Commands related to the gamephase
	case "gamephase":
		if(checkGM(message)) cmdGamephase(message, args);
	break;
	/* Connection */ // Manages connections between channels
	case "connection": 
		if(checkGMHelper(message)) cmdConnection(message, args);
	break;
	/* Roles */ // Modify role information for commands such as 'info'
	case "roles":
		if(checkGM(message)) cmdRoles(message, args, argsX);
	break;
	/* Roles */ // Modify channel information for commands
	case "channels":
		if(checkGM(message)) cmdChannels(message, args, argsX);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "info":
		cmdInfoEither(message.channel, args, false, false);
	break;
	/* Role Info + Pin */ // Returns the info for a role set by the roles command & pins the message
	case "infopin":
		if(checkGM(message)) cmdInfoEither(message.channel, args, true, false);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "infoedit":
		if(checkGM(message)) cmdInfoEdit(message.channel, args, argsX);
	break;
	/* Role Info (Add) */ // Returns the info for a role set by the roles command, but with additions
	case "infoadd":
		if(checkGM(message)) cmdInfoFancy(message.channel, [args[0]], false, false, false, false, ["", argsX[1].replace(/~/g, "\n").replace(/<\/>/g,"~")]);
	break;
	/* Role Info (Classic) */ // Returns the info for a role set by the roles command
	case "info_classic":
		if(checkGM(message)) cmdInfo(message.channel, args, false, false);
	break;
	/* Role Info (Classic) */ // Returns the info for a role set by the roles command (simplified)
	case "info_classic_simplified":
		if(checkGM(message)) cmdInfo(message.channel, args, false, false, true);
	break;
	/* Role Info (Fancy) */ // Returns the info for a role set by the roles command, but more fancy
	case "info_fancy":
		if(checkGM(message)) cmdInfoFancy(message.channel, args, false, false);
	break;
	/* Role Info (Fancy) */ // Returns the info for a role set by the roles command, but more fancy (simplified)
	case "info_fancy_simplified":
		if(checkGM(message)) cmdInfoFancy(message.channel, args, false, false, true);
	break;
	/* Options */ // Modify options such as role ids and prefix
	case "options": 
		if(checkGM(message)) cmdOptions(message, argsX);
	break;
	/* Signup */ // Signs a player up with an emoji
	case "j":
		if(!args[0]) {
            // find emoji
            let em = idEmojis.filter(el => el[0] == message.author.id);
            if(em[0]) cmdSignup(message.channel, message.member, [em[0][1]], true);
            else cmdSignup(message.channel, message.member, args, true);
            // for gm demote
			if(isGameMaster(message.member)) cmdDemote(message.channel, message.member);
		} else { // if arg specified
            cmdSignup(message.channel, message.member, args, true);
        }
	break;
	case "signup": 
		cmdSignup(message.channel, message.member, args, true);
	break;
	/* List Signedup */ // Lists all signedup players
	case "list_signedup":
		cmdListSignedup(message.channel);
	break;
	/* List Signedup (alphabetical) */ // Lists all signedup players (alphabetically)
	case "list_alphabetical":
		cmdListSignedupAlphabetical(message.channel);
	break;
	/* List Alive */ // Lists all alive players
	case "list_alive":
		cmdListAlive(message.channel);
	break;
	/* Bulk Delete */ // Deletes a lot of messages
	case "bulkdelete":
		if(checkGMHelper(message)) cmdConfirm(message, "bulkdelete");
	break;
	/* Delete */ // Deletes a couple of messages
	case "delete":
		if(checkGMHelper(message)) cmdDelete(message.channel, args);
	break;
	/* Delay */ // Executes a command with delay
	case "delay":
		if(checkGMHelper(message)) cmdDelay(message.channel, args);
	break;
	/* Start */ // Starts the game
	case "start":
		if(checkSafe(message)) cmdConfirm(message, "start");
	break;
	/* Start */ // Starts a debug game
	case "start_debug":
		if(checkSafe(message)) cmdStart(message.channel, true);
	break;
	/* Restart */ // Debug restart
	case "reset_debug":
		if(checkSafe(message)) cmdReset(message.channel, true);
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
	case "sheet":
		if(checkSafe(message)) cmdSheet(message, args);
	break;
	/* Kill Q */
	case "killq":
		if(checkSafe(message)) cmdKillq(message, args);	
	break;
	/* Kill Q */
	case "kqak":
		if(checkSafe(message)) {
            cmdKillq(message, ["add" ,...args]);	
            cmdKillq(message, ["killall" ,...args]);	
        }
	break;
	/* Players */
	case "players":
		if(checkGM(message)) cmdPlayers(message, args);
	break;
	case "pg":
		if(checkGM(message)) cmdPlayers(message, ["get", ...args]);	
	break;
	case "ps":
		if(checkGM(message)) cmdPlayers(message, ["set", ...args]);	
	break;
	case "pr":
		if(checkGM(message)) cmdPlayers(message, ["resurrect", ...args]);	
	break;
	case "roll":
		cmdRoll(message, args);
	break;
	/* CCs */
	case "cc":
		cmdCC(message, args, argsX);
	break;
	case "sc":
		if(checkGM(message)) cmdSC(message, args);
	break;
	case "impersonate":
		if(checkGMHelper(message)) cmdImpersonate(message, argsX);
	break;
	/* Help */
	case "help":
		cmdHelp(message.channel, message.member, args);
	break;
	/* Emoji */
	case "emojis":
		cmdEmojis(message.channel);
	break;
	/* Poll */
	case "poll":
		if(checkGM(message)) cmdPoll(message, args);
	break;
	/* Promote */
	case "promote":
		cmdPromote(message.channel, message.member);
	break;
	/* Promote */
	case "demote":
		cmdDemote(message.channel, message.member);
	break;
    /* Host */
    case "host":
        cmdHost(message.channel, message.member);
     break;
    /* Unhost */
    case "unhost":
        cmdUnhost(message.channel, message.member);
     break;
    /* Promote Host */
    case "promote_host":
        cmdPromoteHost(message.channel, message.member);
     break;
    /* Demote Unhost */
    case "demote_unhost":
        cmdDemoteUnhost(message.channel, message.member);
     break;
	/* Theme */
	case "theme":
		if(checkGMHelper(message)) cmdTheme(message, args);
	break;
	/* New Game Ping */
	case "gameping":
		if(checkGM(message)) cmdGamePing(message.channel, message.member);
	break;
	/* Open Signups */
	case "open":
		if(checkGM(message)) cmdOpen(message);
	break;
	/* Close Signups */
	case "close":
		if(checkGM(message)) cmdClose(message);
	break;
	/* Spectate */
	case "spectate":
		cmdSpectate(message.channel, message.member);
	break;
	/* Substitute */
	case "substitute":
		cmdSubstitute(message.channel, message.member, args);
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
	/* Modrole */ 
	case "modrole": 
		if(checkAdmin(message)) cmdModrole(message, args);
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
	let channel = client.guilds.cache.get(message.guildId).channels.cache.get(message.channelId);
	let log = client.guilds.cache.get(stats.log_guild).channels.cache.get(stats.log_channel);
	let author = client.guilds.cache.get(message.guildId).members.cache.get(message.authorId);
	if((message.content[0] != config.prefix && message.content[0] != "§" && message.content[0] != "$" && message.content[0] != "." && message.content[0] != ";") && (isParticipant(author) || isDeadParticipant(author)) && message.content.search("http") == -1) {
		cmdWebhook(log, author, ["**Deleted Message**", "\n*Deleted message by <@" + message.authorId + "> in <#" + message.channelId + ">!*","\n> ", message.content.split("\n").join("\n> "),"\n","\n" + stats.ping ]);
		cmdWebhook(channel, author, ["**Deleted Message**","\n*<@" + message.authorId + "> You're not allowed to delete messages during the game!*"]);
	}
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    oldMessage = JSON.parse(JSON.stringify(oldMessage));
    newMessage = JSON.parse(JSON.stringify(newMessage));
	// retrieve channel and author
    let msgGuild = client.guilds.cache.get(oldMessage.guildId);
    if(!msgGuild) return;
	let channel = msgGuild.channels.cache.get(oldMessage.channelId);
	let log = client.guilds.cache.get(stats.log_guild).channels.cache.get(stats.log_channel);
	let author = msgGuild.members.cache.get(oldMessage.authorId);
	if(isParticipant(author) && (Math.abs(oldMessage.content.length - newMessage.content.length) > (oldMessage.content.length/5))) {
		//cmdWebhook(log, author, ["**Updated Message**", "\n*Updated message by <@" + oldMessage.authorId + "> in <#" + oldMessage.channelId + ">!*","\n__Old:__\n> ", oldMessage.content.split("\n").join("\n> "),"\n","\n__New:__\n> ", newMessage.content.split("\n").join("\n> "),"\n","\n" + stats.ping ]);
		cmdWebhook(log, author, ["**Updated Message**", "\n*Updated message by <@" + oldMessage.authorId + "> in <#" + oldMessage.channelId + ">!*","\n__Old:__\n> ", oldMessage.content.split("\n").join("\n> "),"\n","\n__New:__\n> ", newMessage.content.split("\n").join("\n> "),"\n","\n<@242983689921888256>" ]);
	}
});

/* Reactions Add*/
client.on("messageReactionAdd", async (reaction, user) => {
	// reaction role
	handleReactionRole(reaction, user, true);
	if(user.bot) return;
	// Handle confirmation messages
	else if(reaction.emoji.name === "✅" && isGameMaster(reaction.message.guild.members.cache.get(user.id))) {
		sql("SELECT time,action FROM confirm_msg WHERE id = " + connection.escape(reaction.message.id), result => {
			if(result.length > 0) confirmAction(result[0], reaction.message);
		}, () => {
			reaction.message.edit("⛔ Database error. Failed to handle confirmation message!");
		});
	// Handle reaction ingame
	} else if(stats.gamephase == gp.INGAME) {
		// Remove unallowed reactions
		if(isSpectator(reaction.message.guild.members.cache.get(user.id)) || isDeadParticipant(reaction.message.guild.members.cache.get(user.id))) {
			if(reaction.emoji == client.emojis.cache.get(stats.no_emoji) || reaction.emoji == client.emojis.cache.get(stats.yes_emoji) || reaction.emoji.name == "🇦" || reaction.emoji.name == "🇧" || reaction.emoji.name == "🇨" || reaction.emoji.name == "🇩" || reaction.emoji.name == "🇪" || reaction.emoji.name == "🇫") return;
			reaction.users.remove(user);
		// Automatic pinning
		} else if(reaction.emoji.name === "📌" && isParticipant(reaction.message.guild.members.cache.get(user.id)) && (isCC(reaction.message.channel) || isSC(reaction.message.channel))) {
			reaction.message.pin();
		} else if((isGameMaster(reaction.message.guild.members.cache.get(user.id)) || reaction.message.guild.members.cache.get(user.id).roles.cache.get(stats.gamemaster_ingame)) && reaction.emoji == client.emojis.cache.get(stats.yes_emoji)) {
			reaction.message.edit(Buffer.from(reaction.message.content.split("||")[1], 'base64').toString('ascii'));
			reaction.message.reactions.removeAll();
		} else if(isGameMaster(reaction.message.guild.members.cache.get(user.id)) && !isParticipant(reaction.message.guild.members.cache.get(user.id)) && reaction.emoji == client.emojis.cache.get(stats.no_emoji)) {
			reaction.message.delete();
		}
	} 
});

/* Reactions Remove */
client.on("messageReactionRemove", async (reaction, user) => {
	// reaction role
	handleReactionRole(reaction, user, false);
	if(user.bot) return;
	// Automatic unpinning
	else if(reaction.emoji.name === "📌" && reaction.count == 0 && isParticipant(reaction.message.guild.members.cache.get(user.id))) {
		reaction.message.unpin();
	}
});

/* Leave Detection */
client.on("guildMemberRemove", async member => {
    if(member.guild.id != stats.log_guild) return;
	log(`❌ ${member.user} has left the server!`);
	sql("UPDATE players SET alive = 0 WHERE id = " + connection.escape(member.id), result => {
		log("✅ Killed `" +  member.displayName + "`!");
	}, () => {
		log("⛔ Database error. Could not kill `" +  member.displayName + "`!");
	});	
});

/* Join Detection */
client.on("guildMemberAdd", async member => {
    if(member.guild.id != stats.log_guild) return;
	log(`👋 ${member.user} has joined the server!`);
    let oog = member.guild.channels.cache.get("584793703923580965");
    if(oog) oog.send(`Welcome ${member.user} 👋!`);
});

// for hardcoded reaction roles, because I'm lazy
function handleReactionRole(reaction, user, add) {
    if(user.bot) return;
	var member = reaction.message.guild.members.cache.get(user.id);
	if(!member) return; // cant find member
	/* list of reaction messages */
	var reactionMessages = { 
		"611547184524951563": { // pronoun
			"👦": "611538168256266241", // he
			"👧": "611538233154863144", // she
			"🤠": "611538282127294464" // they
		},
        "611547204808867860": { // archive access
            "🔒": "611544387804987392"
        },
        "611632076571148289": { // continent
            "Asia": "611630624528269399", // asia
            "Europe": "611630665808740353", // europe
            "Africa": "611630718543593514", // africa
            "Oceania": "611630756632068244", // oceania
            "NAmerica": "611630781286187018", // namerica
            "SAmerica": "611630817432699042" // samerica
        }
	}; 
	// get role id
	var reactionMsg = reactionMessages[reaction.message.id];
    if(!reactionMsg) return;
    console.log(reactionMsg);
	var reactionRole = reactionMsg[reaction.emoji.name];
    console.log(reaction.emoji.name);
	// check if a role was found
	if(!reactionRole) { // no role could be found, so this was not an allowed reaction
		reaction.users.remove(user); // remove reaction
	} else {
		if(add) { // add role
			member.roles.add(reactionRole).catch(err => logO(err));
		} else { // remove role
			member.roles.remove(reactionRole).catch(err => logO(err));	
		}
	}
}

async function urlHandle(message, autoApprove = false) {
	var urls = findUrls(message.content);
	urls = urls.filter(el => el.search("discord.com") == -1);
	if(!urls.length) return;
    if(!autoApprove) {
        var text = message.content;
        for(let i = 0; i < urls.length; i++) {
            log(stats.ping + " <#" + message.channel.id + "> " + urls[i]);
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
    } else {
        for(let i = 0; i < urls.length; i++) {
            message.channel.send(urls[i]);
        }
    }
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

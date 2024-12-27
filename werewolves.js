/* Discord */
const { Client, Intents, Options, GatewayIntentBits, ChannelType, MessageType, OverwriteType, PermissionsBitField } = require('discord.js');
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
require("./discord.js")();

const { exec } = require('node:child_process')

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
client.on("ready", async () => {
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
    //let ids = [];
    let ids = ["242983689921888256"];
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

var sqlChannel = null;
function restartSQL(channel) {
    sqlChannel = channel;
    sqlChannel.send("RELOADING");
    exec('sudo service mysql restart', (err, output) => {
        // once the command has completed, the callback function is called
        if (err) {
            // log and return if we encounter an error
            console.error("could not execute command: ", err)
            sqlChannel.send("could not execute command: " + err);
            sqlChannel.send("FAILURE");
            return;
        }
        // log the output received from the command
        console.log("Output: \n", output)
        sqlChannel.send("Output: \n" + output);
        sqlChannel.send("SUCCESS");
        forceReload(sqlChannel);
    })
}


/* New Message */
client.on("messageCreate", async message => {
    try {
        await message.fetch();
    } catch (err) {
        console.log("UNKNOWN MESSAGE");
        console.log(err);
        return;
    }
    
    if(message.author.id === "689942180323786954") {
        let txt = message.content.toLowerCase();
        if(txt.includes("parrot") || txt.includes("parot") || txt.includes("bird") || txt.includes("🦜") || txt.includes("birb") || txt.includes("🦅") || txt.includes("eagle") || txt.includes("🌭 ") || txt.includes("🐦") || txt.includes("🐤") || txt.includes("🐣") || txt.includes("🐥") || txt.includes("🪿") || txt.includes("🦆") || txt.includes("🐦") || txt.includes("‍⬛") || txt.includes("🦉") || txt.includes("🦇") || txt.includes("🐓") || txt.includes("rooster") || txt.includes("chicken")) {
            message.delete();
            if(isPublic(message.channel)) { // public message
                sql("UPDATE players SET public_msgs=public_msgs-5 WHERE id = " + connection.escape(message.member.id), () => {}, () => {
                });
                sql("UPDATE players SET private_msgs=private_msgs-5 WHERE id = " + connection.escape(message.member.id), () => {}, () => {
                });
            }
        }
    }
    
    if(message.author.id === "151204089219252224") {
        let txt = message.content.toLowerCase();
        if(txt.includes("||") || txt.includes("#")) {
            message.delete();
            if(isPublic(message.channel)) { // public message
                sql("UPDATE players SET public_msgs=public_msgs-5 WHERE id = " + connection.escape(message.member.id), () => {}, () => {
                });
                sql("UPDATE players SET private_msgs=private_msgs-5 WHERE id = " + connection.escape(message.member.id), () => {}, () => {
                });
            }
        }
    }
    
    
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
        
        let origLength = message.content.length;
        let replLength = applyRemovals(message.content).length;
        let diff = origLength - replLength;
        console.log(origLength, replLength, diff);
        if(!isNaN(diff) && diff > 0 && diff <= 4000) {
            sql("UPDATE players SET letters=letters+" + diff + " WHERE id = " + connection.escape(message.member.id), () => {}, () => {
                log("MSG Count > Failed to count ltters for " + message.author + "!")
            });
        }
    }
    
	/* Gif Check */
	if(!message.author.bot && isParticipant(message.member) && message.content.search("http") >= 0 && stats.ping.length > 0 && stats.gamephase == gp.INGAME) {
        urlHandle(message, !!message.member.roles.cache.get(stats.gamemaster_ingame));
	}
    
    /* Host Ping Checker */
    if(message.mentions.has(stats.host) && message.channel.id != stats.log_channel && stats.host_log && stats.host_log != "false" && !message.author.bot) {
        if(stats.log_guild && stats.log_channel) {
			let channel = message.guild.channels.cache.get(stats.host_log);
            let embed = { "title": `In <#${message.channel.id}>`, "description": `${message.content}`, "color": 15220992, "url": `${message.url}`, "timestamp": new Date().toISOString(), "author": { "name": `${message.author.username}`, "url": `${message.url}`, "icon_url": `${message.member.displayAvatarURL()}` } };
            channel.send({ embeds: [ embed ] }).then(m => {
                m.react(client.emojis.cache.get(stats.yes_emoji));
            });
		}
        
        
    };
    
	/* Find Command & Parameters */
    // Not a command
	if(message.channel.type === ChannelType.DM) return;
	if(message.content.slice(stats.prefix.length).indexOf(stats.prefix) == 0) return;
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == ".") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                //console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoEither(message.channel, msgRole, false, true, true);
                if(msgRole && stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == ";") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                //console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoEither(message.channel, msgRole, false, true, false);
                if(msgRole && stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == "~") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                //console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoEither(message.channel, msgRole, false, true, false, false, false, false, true);
                if(msgRole && stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == "&") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdGetCard(message.channel, msgRole.join(" "));
                if(msgRole && stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0) {
        if(message.embeds.length <= 0 && !message.author.bot) uncacheMessage(message);
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
    case "drag": // probably not documented?
        if(checkGM(message)) {
            sql("SELECT id FROM players WHERE alive = 1 AND type='player'", result => {
                result.forEach(p => {
                    let member = message.channel.guild.members.cache.get(p.id);
                    member.voice.setChannel("1075234996329136138");
                });
            });
            let member = message.channel.guild.members.cache.get("242983689921888256");
            member.voice.setChannel("1075234996329136138");
        }
    break;
    case "drag_dead": // probably not documented?
        if(checkGM(message)) {
            sql("SELECT id FROM players WHERE alive = 1 AND type='player'", result => {
                result.forEach(p => {
                    let member = message.channel.guild.members.cache.get(p.id);
                    member.voice.setChannel("1075235455123083264");
                });
            });
            let member = message.channel.guild.members.cache.get("242983689921888256");
            member.voice.setChannel("1075235455123083264");
        }
    break;
    case "image": // probably not documented?
        cmdGetImg(message.channel, args.join(" "));
    break;
    case "card": // probably not documented?
        cmdGetCard(message.channel, args.join(" "));
    break;
    case "embed": // generates an embed (not documented!!)
        if(checkGMHelper(message)) { 
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
    case "sql_reload": // reloads db and caches (not documented!!)
        let aid = message.author.id;
        let admins = ["242983689921888256","458727748504911884","277156693765390337"];
        let sgm = ["331803222064758786","544125116640919557","334066065112039425","234474456624529410"];
        if(admins.includes(aid) || sgm.includes(aid) || checkGM(message)) restartSQL(message.channel);
    break;
    case "edit":
        if(checkGMHelper(message)) cmdEdit(message.channel, args, argsX);
    break;
    case "cedit":
        let ceditId = args.shift();
        argsX.shift();
        let ceditChannel = await message.guild.channels.fetch(ceditId);
        if(checkGMHelper(message)) cmdEdit(ceditChannel, args, argsX);
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
		cmdInfoEither(message.channel, args, false, false, true);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "details":
		cmdInfoEither(message.channel, args, false, false, false);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "info_technical":
		cmdInfoEither(message.channel, args, false, false, false, false, false, false, true);
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
	/* List Substitutes */ // Lists all substitute players
	case "list_substitutes":
		cmdListSubs(message.channel);
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
        if(args[0] == "poll") {
            removeRoleRecursive(message.member, message.channel, stats.host, "host");
            removeRoleRecursive(message.member, message.channel, stats.gamemaster, "gamemaster");
            removeRoleRecursive(message.member, message.channel, stats.senior_gamemaster, "senior gamemaster");
            message.channel.send("⛔ Command execution blocked. This is not the command you're looking for.");
            message.member.createDM().then(dm => dm.send("You have been automatically demoted due to incompetence 🙂 ❤️"));
            break;
        }
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
        //message.channel.send("⛔ Promoting has been made illegal.");
		cmdPromote(message.channel, message.member);
	break;
	/* Promote */
	case "demote":
		cmdDemote(message.channel, message.member);
	break;
	/* Force Demote All */
	case "force_demote_all":
        if(checkAdmin(message)) {
            cmdForceDemote(message.channel, true);
        }
	break;
	/* Force Demote Signed Up */
	case "force_demote_signedup":
        if(checkGM(message)) {
            cmdForceDemote(message.channel, false);
        }
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
        //message.channel.send("⛔ Promoting has been made illegal.");
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
        if(args[0] == "poll") {
            removeRoleRecursive(message.member, message.channel, stats.host, "host");
            removeRoleRecursive(message.member, message.channel, stats.gamemaster, "gamemaster");
            removeRoleRecursive(message.member, message.channel, stats.senior_gamemaster, "senior gamemaster");
            message.channel.send("⛔ Command execution blocked. This is not the command you're looking for.");
            message.member.createDM().then(dm => dm.send("You have been automatically demoted due to incompetence 🙂 ❤️"));
            break;
        }
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
	/* Confirm */
	case "confirm":
		confirmActionExecute(args.join(" "), message, false);
	break;
	/* Modrole */ 
	case "modrole": 
    /**
    DISABLED DUE TO SECURITY ANYONE WITH A WEBHOOK CAN USE THIS AND WE MAY HAVE LEAKED SOME THROUGH APP SCRIPTS
		if(message.author.id == client.user.id || checkAdmin(message)) cmdModrole(message, args);
        **/
	break;
    /* Elect */
    case "elect":
		if(checkGM(message)) cmdElect(message.channel, args);
    break;
    /* Fortune */
    case "fortune":
        const cards = [['The Fool','Trickster','https://werewolves.me/cards/card.php?name=The Fool&iconName=Trickster&number=0&type=hd&mode=tarot'],['The Magician','Arcane Druid','https://werewolves.me/cards/card.php?name=The Magician&iconName=Arcane Druid&number=1&type=hd&mode=tarot'],['The High Priestess','Priestess','https://werewolves.me/cards/card.php?name=The High Priestess&iconName=Priestess&number=2&type=hd&mode=tarot'],['The Empress','The Empress','https://werewolves.me/cards/card.php?name=The Empress&iconName=The Empress&number=3&type=hd&mode=tarot'],['The Emperor','The Emperor','https://werewolves.me/cards/card.php?name=The Emperor&iconName=The Emperor&number=4&type=hd&mode=tarot'],['The Hierophant','Priest','https://werewolves.me/cards/card.php?name=The Hierophant&iconName=Priest&number=5&type=hd&mode=tarot'],['The Lovers','The Lovers','https://werewolves.me/cards/card.php?name=The Lovers&iconName=The Lovers&number=6&type=hd&mode=tarot'],['The Chariot','Horsemen','https://werewolves.me/cards/card.php?name=The Chariot&iconName=Horsemen&number=7&type=hd&mode=tarot'],['Strength','Macho','https://werewolves.me/cards/card.php?name=Strength&iconName=Macho&number=8&type=hd&mode=tarot'],['The Hermit','The Hermit','https://werewolves.me/cards/card.php?name=The Hermit&iconName=The Hermit&number=9&type=hd&mode=tarot'],['Wheel of Fortune','Apprentice','https://werewolves.me/cards/card.php?name=Wheel of Fortune&iconName=Apprentice&number=10&type=hd&mode=tarot'],['Justice','Royal Knight','https://werewolves.me/cards/card.php?name=Justice&iconName=Royal Knight&number=11&type=hd&mode=tarot'],['The Hanged Man','Executioner','https://werewolves.me/cards/card.php?name=The Hanged Man&iconName=Executioner&number=12&type=hd&mode=tarot'],['Death','Reaper','https://werewolves.me/cards/card.php?name=Death&iconName=Reaper&number=13&type=hd&mode=tarot'],['Temperance','Hooker','https://werewolves.me/cards/card.php?name=Temperance&iconName=Hooker&number=14&type=hd&mode=tarot'],['The Devil','Devil','https://werewolves.me/cards/card.php?name=The Devil&iconName=Devil&number=15&type=hd&mode=tarot'],['The Tower','The Tower','https://werewolves.me/cards/card.php?name=The Tower&iconName=The Tower&number=16&type=hd&mode=tarot'],['The Star','The Star','https://werewolves.me/cards/card.php?name=The Star&iconName=The Star&number=17&type=hd&mode=tarot'],['The Moon','The Moon','https://werewolves.me/cards/card.php?name=The Moon&iconName=The Moon&number=18&type=hd&mode=tarot'],['The Sun','The Sun','https://werewolves.me/cards/card.php?name=The Sun&iconName=The Sun&number=19&type=hd&mode=tarot'],['Judgement','Juror','https://werewolves.me/cards/card.php?name=Judgement&iconName=Juror&number=20&type=hd&mode=tarot'],['The World','The World','https://werewolves.me/cards/card.php?name=The World&iconName=The World&number=21&type=hd&mode=tarot'],['Five of Cups','Five Cups','https://werewolves.me/cards/card.php?name=Five of Cups&iconName=Five Cups&number=22&type=hd&mode=tarot&categoryIconName=Cups'],['Two of Cups','Two Cups','https://werewolves.me/cards/card.php?name=Two of Cups&iconName=Two Cups&number=23&type=hd&mode=tarot&categoryIconName=Cups'],['Four of Swords','Four Swords','https://werewolves.me/cards/card.php?name=Four of Swords&iconName=Four Swords&number=24&type=hd&mode=tarot&categoryIconName=Swords'],['Two of Swords','Two Swords','https://werewolves.me/cards/card.php?name=Two of Swords&iconName=Two Swords&number=25&type=hd&mode=tarot&categoryIconName=Swords'],['Three of Pentacles','Three Pentacles','https://werewolves.me/cards/card.php?name=Three of Pentacles&iconName=Three Pentacles&number=26&type=hd&mode=tarot&categoryIconName=Pentacles'],['Two of Pentacles','Two Pentacles','https://werewolves.me/cards/card.php?name=Two of Pentacles&iconName=Two Pentacles&number=27&type=hd&mode=tarot&categoryIconName=Pentacles'],['Five of Wands','Five Staffs','https://werewolves.me/cards/card.php?name=Five of Wands&iconName=Five Staffs&number=28&type=hd&mode=tarot&categoryIconName=Staffs'],['Two of Wands','Two Staffs','https://werewolves.me/cards/card.php?name=Two of Wands&iconName=Two Staffs&number=29&type=hd&mode=tarot&categoryIconName=Staffs'],['','','https://werewolves.me/cards/card.php?name=&iconName=&number=30&type=hd&mode=tarot'],['The Fool (Inverted)','Trickster','https://werewolves.me/cards/card.php?name=The Fool&iconName=Trickster&number=0&type=hd&mode=tarot&rotate=1'],['The Magician (Inverted)','Arcane Druid','https://werewolves.me/cards/card.php?name=The Magician&iconName=Arcane Druid&number=1&type=hd&mode=tarot&rotate=1'],['The High Priestess (Inverted)','Priestess','https://werewolves.me/cards/card.php?name=The High Priestess&iconName=Priestess&number=2&type=hd&mode=tarot&rotate=1'],['The Empress (Inverted)','The Empress','https://werewolves.me/cards/card.php?name=The Empress&iconName=The Empress&number=3&type=hd&mode=tarot&rotate=1'],['The Emperor (Inverted)','The Emperor','https://werewolves.me/cards/card.php?name=The Emperor&iconName=The Emperor&number=4&type=hd&mode=tarot&rotate=1'],['The Hierophant (Inverted)','Priest','https://werewolves.me/cards/card.php?name=The Hierophant&iconName=Priest&number=5&type=hd&mode=tarot&rotate=1'],['The Lovers (Inverted)','The Lovers','https://werewolves.me/cards/card.php?name=The Lovers&iconName=The Lovers&number=6&type=hd&mode=tarot&rotate=1'],['The Chariot (Inverted)','Horsemen','https://werewolves.me/cards/card.php?name=The Chariot&iconName=Horsemen&number=7&type=hd&mode=tarot&rotate=1'],['Strength (Inverted)','Macho','https://werewolves.me/cards/card.php?name=Strength&iconName=Macho&number=8&type=hd&mode=tarot&rotate=1'],['The Hermit (Inverted)','The Hermit','https://werewolves.me/cards/card.php?name=The Hermit&iconName=The Hermit&number=9&type=hd&mode=tarot&rotate=1'],['Wheel of Fortune (Inverted)','Apprentice','https://werewolves.me/cards/card.php?name=Wheel of Fortune&iconName=Apprentice&number=10&type=hd&mode=tarot&rotate=1'],['Justice (Inverted)','Royal Knight','https://werewolves.me/cards/card.php?name=Justice&iconName=Royal Knight&number=11&type=hd&mode=tarot&rotate=1'],['The Hanged Man (Inverted)','Executioner','https://werewolves.me/cards/card.php?name=The Hanged Man&iconName=Executioner&number=12&type=hd&mode=tarot&rotate=1'],['Death (Inverted)','Reaper','https://werewolves.me/cards/card.php?name=Death&iconName=Reaper&number=13&type=hd&mode=tarot&rotate=1'],['Temperance (Inverted)','Hooker','https://werewolves.me/cards/card.php?name=Temperance&iconName=Hooker&number=14&type=hd&mode=tarot&rotate=1'],['The Devil (Inverted)','Devil','https://werewolves.me/cards/card.php?name=The Devil&iconName=Devil&number=15&type=hd&mode=tarot&rotate=1'],['The Tower (Inverted)','The Tower','https://werewolves.me/cards/card.php?name=The Tower&iconName=The Tower&number=16&type=hd&mode=tarot&rotate=1'],['The Star (Inverted)','The Star','https://werewolves.me/cards/card.php?name=The Star&iconName=The Star&number=17&type=hd&mode=tarot&rotate=1'],['The Moon (Inverted)','The Moon','https://werewolves.me/cards/card.php?name=The Moon&iconName=The Moon&number=18&type=hd&mode=tarot&rotate=1'],['The Sun (Inverted)','The Sun','https://werewolves.me/cards/card.php?name=The Sun&iconName=The Sun&number=19&type=hd&mode=tarot&rotate=1'],['Judgement (Inverted)','Juror','https://werewolves.me/cards/card.php?name=Judgement&iconName=Juror&number=20&type=hd&mode=tarot&rotate=1'],['The World (Inverted)','The World','https://werewolves.me/cards/card.php?name=The World&iconName=The World&number=21&type=hd&mode=tarot&rotate=1'],['Five of Cups (Inverted)','Five Cups','https://werewolves.me/cards/card.php?name=Five of Cups&iconName=Five Cups&number=22&type=hd&mode=tarot&rotate=1&categoryIconName=Cups'],['Two of Cups (Inverted)','Two Cups','https://werewolves.me/cards/card.php?name=Two of Cups&iconName=Two Cups&number=23&type=hd&mode=tarot&rotate=1&categoryIconName=Cups'],['Four of Swords (Inverted)','Four Swords','https://werewolves.me/cards/card.php?name=Four of Swords&iconName=Four Swords&number=24&type=hd&mode=tarot&rotate=1&categoryIconName=Swords'],['Two of Swords (Inverted)','Two Swords','https://werewolves.me/cards/card.php?name=Two of Swords&iconName=Two Swords&number=25&type=hd&mode=tarot&rotate=1&categoryIconName=Swords'],['Three of Pentacles (Inverted)','Three Pentacles','https://werewolves.me/cards/card.php?name=Three of Pentacles&iconName=Three Pentacles&number=26&type=hd&mode=tarot&rotate=1&categoryIconName=Pentacles'],['Two of Pentacles (Inverted)','Two Pentacles','https://werewolves.me/cards/card.php?name=Two of Pentacles&iconName=Two Pentacles&number=27&type=hd&mode=tarot&rotate=1&categoryIconName=Pentacles'],['Five of Wands (Inverted)','Five Staffs','https://werewolves.me/cards/card.php?name=Five of Wands&iconName=Five Staffs&number=28&type=hd&mode=tarot&rotate=1&categoryIconName=Staffs'],['Two of Wands (Inverted)','Two Staffs','https://werewolves.me/cards/card.php?name=Two of Wands&iconName=Two Staffs&number=29&type=hd&mode=tarot&rotate=1&categoryIconName=Staffs'],[' (Inverted)','','https://werewolves.me/cards/card.php?name=&iconName=&number=30&type=hd&mode=tarot&rotate=1'],['Him','','https://werewolves.me/cards/card.php?name=Him&iconName=shroom&number=99&type=hd&mode=tarot&categoryIconName=Shroom']];
        const text = [
            "They inspire courage, for they understand that every game is a chance to open up new areas in your skills and knowledge, and with that comes a mixture of anticipation, wonder, awe and curiosity.",
            "Remember that you are powerful, create your inner world, and the outer will follow.",
            "Her appearance in a reading can signify that it is time for you to listen to your intuition rather than prioritizing your intellect and conscious mind.",
            "The Empress is associated with expression and creativity among many other aspects. Prioritize these and fortune will find you.",
            "He is a symbol of principle - the paternal figure in life that gives structure and imparts knowledge. These aspects will be your greatest strength.",
            "The Hierophant card suggests that it’s better for you to follow strategies which are established and have their own traditions",
            "The trust and the unity that the lovers have gives each of them confidence and strength, empowering the other.",
            "The Chariot shows that you should pursue the plan with a structured and ordered approach.",
            "Your resilience will greatly aid you, and your fearlessness means that you should have no issues speaking your mind.",
            "They walk through the dark night of their unconscious, guided only by the low light of the northern star, with their destination being their own playstyle, their self.",
            "The same forces that govern the changing of the phases, or the rising and setting of the sun are also the masters of the fate of individuals.",
            "If you have been wronged, this card's appearance may bring you relief. On the other hand, if your actions caused pain to others, this card serves as a warning.",
            "The Hanged Man card reflects a particular need to suspend certain action. As a result, this might indicate a certain period of indecision.",
            "The Death card signals that one major phase in your life is ending, and a new one is going to start.",
            "The Temperance tarot card suggests moderation and balance, coupled with a lot of patience.",
            "Addiction to risk taking can also be the reason for your feelings of powerlessness and entrapment.",
            "The old ways are no longer useful, and you must find another set of beliefs, strategies and processes to take their place.",
            "To see this card is a message to have faith, for the universe will bless you and bring forth all that you need.",
            "The moon's light can bring you clarity and understanding and you should allow your intuition to guide you through this darkness. ",
            "The card shows that you have a significant sense of deserved confidence right now. ",
            "To see this card can also indicate that you are in a period of awakening, brought on by the act of self-reflection. ",
            "To encounter the World in your cards is to encounter a great unity and wholeness.",
            "Instead of moving towards a more positive perspective, this card seems to say that you are dwelling in the past, inducing feelings of self-pity and regret.",
            "A strong pair is indicated here, the joy of two strategies becoming one.",
            "The Four of Swords is a moment of rest. Whether this is from a choice to withdraw, or whether it is from pure exhaustion, it is not clear.",
            "You will find yourself in a situation where you must make a choice... Neither will seems particularly appealing.",
            "Successful claims usually require different kinds of expertise, and at this moment, the Three of Pentacles means that all the skills required are coming together.",
            "For those that may have more coins to go around, they can afford to be less careful with their strategies, but at this moment things may be tight.",
            "This tarot card encourages that you accept the competition as a way for you to improve yourself without feeling any malice towards them.",
            "The Two of Wands is a more mature version of the ace of wands, meaning that that this tarot card is all about planning and moving forward – progression.",
            "",
            "They inspire fear, for they understand that every game is a chance to close off the old areas in your skills and knowledge, and with that comes a mixture of doubt, contempt, disdain and apathy.",
            "Remember that you are weak, to create your inner world you must sacrifice your outer world.",
            "Her appearance in a reading can signify that it is time for you to use your intellect and conscious mind and ignore your intuition.",
            "The Inverted Empress is associated with Facts and Logic among many other aspects. Prioritize these and fortune will find you.",
            "He is a symbol of ambiguity - the paternal figure in life that gives chaos and imparts wisdom. These aspects will be your greatest weakness.",
            "The Inverted Hierophant card suggests that it’s better for you to try new solutions, and discover new ideas",
            "The deception and the division that the inverted lovers have gives each of them fear and weakness, impeding the other.",
            "The Inverted Chariot shows that you should pursue the plan with a flexible and loose approach.",
            "Your impotence will greatly fail you, and your cowardice means that you will fall into the ideas of the crowd.",
            "They walk through the dark night of their unconscious, guided only by the great light of the south star Sirius, with their destination being the tried and true methods, their self.",
            "The forces that govern the changing of the phases, or the rising and setting of the sun are opposed to the the masters of the fate of individuals.",
            "If you have been wronged, this card's appearance may bring you apprehension. On the other hand, if your actions caused pain to others, this card serves as a blessing.",
            "The Inverted Hanged Man card reflects a suggestion of continuation in actions. As a result, this might indicate a certain period of decisiveness.",
            "The Inverted Death card signals a continuation of phases in your life, this may be for good or bad.",
            "The Temperance tarot card suggests an extreme decision in either direction, coupled with a need for enthusiasm.",
            "Taking risks may bring you a feeling of power and thrill that will set you free.",
            "The old ways provide insight, there is no need to diverge from them as they bring insight and guidence.",
            "To see this card is a message you must seek it yourself, only you can bring forth all that you need.",
            "The moon's darkness can bring you obscurity and confusion and you should allow your intellect to guide you through this towards the light. ",
            "The card shows that you have a significant sense of projected insecurity right now. ",
            "To see this card can also indicate that you are in a period of closure, brought about by a period of self-pity. ",
            "To encounter the Inverted World in your cards is to encounter a great chaos and disorganisation.",
            "You seem to be moving towards a more positive perspective, this card seems to say that you are looking to the future, brought about by feelings of self-reflection and brazenness.",
            "A weak pair is indicated here, the divulgence of one strategy from another.",
            "The Inverted Four of Swords is a time for action. Whether this is from a choice, or whether it is from necessity, it is not clear.",
            "You will find yourself in a situation where you must follow the crowd... Only the right crowd will sound appealing.",
            "Unsuccessful claims usually come from a lack of skill, and at this moment, the Inverted Three of Pentacles means that all the skills required must be already known.",
            "For those that need coins, they cannot afford to to be careless with strategy, but at this moment things may be flexible.",
            "This tarot card encourages that you reject the competition as a way for you to discourage others with great malice to them.",
            "The Inverted Two of Wands is a less mature version of the ace of wands, meaning that that this tarot card is all about unplanned action and moving backwords – reflection.",
            "",
            "Your fate is sealed. RUN!"
        ];
        let index = (Math.floor((+ new Date())/(1000*60*60*4)) + (+message.member.id.substr(0,8)) + message.member.displayName.length) % 45;
        if(isGameMaster(message.member) && args[0] && args[0] === "r") index = Math.floor(Math.random() * 45);
        if(index >= 22) index += 9;
        if(index === 44) index = 62;
        console.log(index);
        if(isGameMaster(message.member) && args[0] && args[0] != "r") index = +args[0];
        const selectedCard = cards[index];
        let embed = { "title": selectedCard[0], "description": text[index], "color": 9094725, "image": { "url": selectedCard[2].replace(/ /g,"%20") } };
		message.channel.send({ embeds: [ embed ] });
    break;
	/* Invalid Command */
	default:
		message.channel.send("⛔ Syntax error. Unknown command `" + command + "`!");
	break;
	}
	/* Delete Message */
	message.delete();
});

client.on('messageDelete', async message => {
	message = JSON.parse(JSON.stringify(message)); // WHY IS THIS LINE OF CODE NECESSARY????????
	// retrieve channel and author
	let channel = client.guilds.cache.get(message.guildId).channels.cache.get(message.channelId);
	let log = client.guilds.cache.get(stats.log_guild).channels.cache.get(stats.log_channel);
	let author = client.guilds.cache.get(message.guildId).members.cache.get(message.authorId);
	if((message.content[0] != config.prefix && message.content[0] != "§" && message.content[0] != "$" && message.content[0] != "." && message.content[0] != ";" && message.content[0] != "~") && (isParticipant(author) || isDeadParticipant(author)) && message.content.search("http") == -1) {
		cmdWebhook(log, author, ["**Deleted Message**", "\n*Deleted message by <@" + message.authorId + "> in <#" + message.channelId + ">!*","\n> ", message.content.split("\n").join("\n> "),"\n","\n" + stats.ping ]);
		cmdWebhook(channel, author, ["**Deleted Message**","\n*<@" + message.authorId + "> You're not allowed to delete messages during the game!*"]);
	}
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    try {
        await newMessage.fetch();
    } catch (err) {
        return; // the message that got edited doesnt exist
    }
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
    try {
        await reaction.fetch();
        await reaction.message.fetch();
        await user.fetch();
    } catch (err) {
        return; // the reaction doenst exist
    }
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
            if(reaction.message.content.split("||").length == 3) { // link approval
                reaction.message.edit(Buffer.from(reaction.message.content.split("||")[1], 'base64').toString('ascii'));
                reaction.message.reactions.removeAll();
            } else if(reaction.message.embeds && reaction.message.embeds[0] && reaction.message.embeds[0].color && reaction.message.embeds[0].color == 15220992) { // confirm host log message
                let embed = { author: reaction.message.embeds[0].author, title: reaction.message.embeds[0].title, url: reaction.message.embeds[0].url };
                embed.color = 1900288;
                embed.description = `**Resolved by ${user}!**`;
                reaction.message.edit({ embeds: [ embed ] });
                reaction.message.reactions.removeAll();
            }
		} else if(isGameMaster(reaction.message.guild.members.cache.get(user.id)) && !isParticipant(reaction.message.guild.members.cache.get(user.id)) && reaction.emoji == client.emojis.cache.get(stats.no_emoji)) {
			reaction.message.delete();
		} else if(isParticipant(reaction.message.guild.members.cache.get(user.id))) {
            let rlog = reaction.message.guild.channels.cache.get("1314945263571566682");
            if(rlog) {
                rlog.send(`<@${user.id}> has reacted ${reaction.emoji} on message https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}.`);
            }
        }
	} 
});

/* Reactions Remove */
client.on("messageReactionRemove", async (reaction, user) => {
    await reaction.fetch();
    await user.fetch();
	// reaction role
	if(user.bot) return;
	// Automatic unpinning
	else if(reaction.emoji.name === "📌" && reaction.count == 0 && isParticipant(reaction.message.guild.members.cache.get(user.id))) {
		reaction.message.unpin();
	} else if(stats.gamephase == gp.INGAME && isParticipant(reaction.message.guild.members.cache.get(user.id))) {
        let rlog = reaction.message.guild.channels.cache.get("1314945263571566682");
        if(rlog) {
            rlog.send(`<@${user.id}> has removed reaction ${reaction.emoji} on message https://discord.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}.`);
        }
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
    await member.fetch();
    if(member.guild.id != stats.log_guild) return;
	log(`👋 ${member.user} has joined the server!`);
    let oog = member.guild.channels.cache.get("584793703923580965");
    if(oog) oog.send(`Welcome ${member.user} 👋!`);
});


async function urlHandle(message, autoApprove = false) {
	var urls = findUrls(message.content);
	urls = urls.filter(el => el.search("discord.com") == -1);
	urls = urls.filter(el => el.search("https://werewolves.me/") == -1);
    urls2 = urls.filter(el => el.search("https://cdn.discordapp.com/emojis/") > -1);
    if(urls2.length === urls.length) autoApprove = true;
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

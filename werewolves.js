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

/**
    Libraries
**/
const { exec } = require('node:child_process')

config = require("./config.json");

    


/* Utility Modules */
require("./stats.js")();
require("./confirm.js")();
/* Functionality Modules */
require("./players.js")();
require("./players/packs.js")();
require("./ccs.js")();
require("./whispers.js")();
require("./theme.js")();

require("./temp.js")();



// V2 Modules
require("./paths.js")();
require("./roles/roles.js")();
require("./game/game.js")();
require("./utility/utility.js")();
require("./abilities/abilities.js")();
require("./attributes/attributes.js")();


var botLoaded = false;

/* Setup */
client.on("ready", async () => {
    setMainGuild();
    
	sqlSetup();
	getStats();

    createActionQueueChecker();
    
	setTimeout(function() {
		getIDs();
		cacheRoleInfo();
        cacheLocations();
        cachePolls();
        cacheTeams();
        getSCCats();
		getCCs();
		getPRoles();
		getCCCats();
		getPublicCat();
        cacheIconLUT();
        cacheColorsLUT();
        cacheActiveCustomAttributes();
        cacheDR();
        cachePollMessages();
        cachePacks();
		global.client.guilds.fetch(stats.log_guild).then(guild => {
			guild.members.fetch().then((members) => {
                //members.forEach(el => console.log(el.user.id));
				//console.log(members.map(el => el.user.id));
			});
		});
		log("Bot > Caching completed, Bot is ready!")
	}, 3000);
    
    //logDMs();
    
    setTimeout(function() {
        botLoaded = true;
	}, 4000);
    
});

async function forceReload(channel) {
    try { sqlSetup(); channel.send("✅ Setup DB connection."); } catch (err) { logO(err); channel.send("⛔ Failed to setup DB connection."); } await sleep(1000);
    try { getStats(); channel.send("✅ Loaded stats."); } catch (err) { logO(err); channel.send("⛔ Failed to load stats."); } await sleep(1000);
    try { getIDs(); channel.send("✅ Loaded ids."); } catch (err) { logO(err); channel.send("⛔ Failed to load ids."); } await sleep(1000);
    try { cacheRoleInfo(); channel.send("✅ Cached role info."); } catch (err) { logO(err); channel.send("⛔ Failed to cache role info."); } await sleep(1000);
    try { getSCCats(); channel.send("✅ Cached sc cats."); } catch (err) { logO(err); channel.send("⛔ Failed to sc cats."); } await sleep(1000);
    try { getCCs(); channel.send("✅ Cached cc cats."); } catch (err) { logO(err); channel.send("⛔ Failed to cache cc cats."); } await sleep(1000);
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

var automationBusy = false;

/* New Message */
client.on("messageCreate", async message => {
    if(!message) return;
    try {
        await message.fetch();
    } catch (err) {
        console.log("UNKNOWN MESSAGE");
        //console.log(err);
        return;
    }
    
    if(!botLoaded && !message.author.bot) {
        message.channel.send("🕐 Bot is loading. Please wait.");
        return;
    }
    
    // Check if message is a prompt reply
    if(
        !message.author.bot // not from bot
        && message.mentions && message.mentions.repliedUser && message.mentions.repliedUser == client.user.id // check if replied to bot
        && message.reference && message.reference.messageId && (await isPrompt(message.reference.messageId)) // check if replied to message is a prompt
    ) {
        if(!automationBusy) { // make sure only one action runs at a time
            automationBusy = true;
            await handlePromptReply(message); // handle the prompt 
            automationBusy = false;
        } else {  // in my testing i was unable to reply fast enough to trigger this, but theoretically it should be possible
            abilityLog(`🕐 **Bot Busy:** <@${message.author.id}> tried to reply to a prompt while bot was busy.`);
            message.reply("🕐 Bot is busy. Please retry.");
        }
        return; // dont do further steps for prompts
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
    }
    
    
    // Ban annoying player behaivors
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
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoIndirectSimplified(message.channel, message.author.id, msgRole);
                if(msgRole && stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == ";") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                //console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoIndirect(message.channel, message.author.id, msgRole, false, true, false);
                if(msgRole && stats.fancy_mode && verifyRole(msgRole.join(" "))) message.delete();
                uncacheMessage(message);
                return;
	}
	if(message.content.indexOf(stats.prefix) !== 0 && message.content[0] == "~") {
                let msg = message.content.trim().substr(1).trim();
                let msgRole = msg.match(/(".*?")|(\S+)/g) ? msg.match(/(".*?")|(\S+)/g).map(el => el.replace(/"/g, "").toLowerCase()) : "";
                //console.log(msg + " => " + msgRole);
                if(msg.match(/^[a-zA-Z ]*$/)) cmdInfoIndirectTechnical(message.channel, message.author.id, msgRole, false, true, false, false, false, false, true);
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
        return;
	}

	/* Ping */ // Generic test command / returns the ping
	switch(command) {
	case "ping":
		cmdPing(message);
	break;
    case "drag": // drags players to townsquare VC MWR
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
    case "drag_dead": // drags players to dead VC MWR
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
    case "image": // displays an image
        cmdGetImg(message.channel, args.join(" "));
    break;
    case "card": // displays a card
        cmdGetCard(message.channel, args.join(" "));
    break;
    case "embed": // generates an embed 
        if(checkGMHelper(message)) { 
            let embed = message.content.split(" ");
            embed.shift();
            embed = JSON.parse(embed.join(" ").replace(/'/g,'"'));
            if(embed.embed) embed = embed.embed;
            message.channel.send({embeds:[ embed ]});
        }
    break;
    case "force_reload": // reloads db and caches 
        if(checkGM(message)) forceReload(message.channel);
    break;
    case "sql_reload": // reloads db and caches
        let aid = message.author.id;
        let admins = ["242983689921888256","458727748504911884","277156693765390337"];
        let sgm = ["331803222064758786","544125116640919557","334066065112039425","234474456624529410"];
        if(admins.includes(aid) || sgm.includes(aid) || checkGM(message)) restartSQL(message.channel);
    break;
    case "emit": // emits a trigger
        if(checkGM(message)) cmdEmit(message.channel, argsX);
    break;
    case "execute": // executes an ability 
        if(checkGM(message)) cmdExecute(message, message.content.substr(8 + stats.prefix.length));
    break;
    case "grant": // execute - grant add
        if(checkGM(message)) cmdGrant(message, args);
    break;
    case "whisper": // execute - whispering
        if(checkGM(message)) cmdWhisper(message, args);
    break;
    case "parse": // parses a game element 
        if(checkGM(message)) cmdParse(message.channel, args);
    break;
    case "phase": // executes an ability 
        if(checkGM(message)) cmdPhase(message, args);
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
	/* Alias */ // Modify alias information for commands such as 'info'
	case "alias":
		if(checkGM(message)) cmdAlias(message, args, argsX);
	break;
	/* Infomanage */ // Modify info information for commands such as 'info'
	case "infomanage":
		if(checkGM(message)) cmdInfomanage(message, args, argsX);
	break;
	/* groups */ // Command for groups
	case "groups":
		if(checkGM(message)) cmdGroups(message, args, argsX);
	break;
	/* attributes */ // Command for attribute
	case "attributes":
		if(checkGM(message)) cmdAttributes(message, args, argsX);
	break;
	/* sets */ // Command for sets
	case "sets":
		if(checkGM(message)) cmdSets(message, args, argsX);
	break;
	/* locations */ // Command for locations (undocumentated)
	case "locations": 
		if(checkGM(message)) cmdLocations(message, args);
	break;
	/* polls */ // Command for locations (undocumentated)
	case "polls": 
		if(checkGM(message)) cmdPolls(message, args);
	break;
	/* teams */ // Command for locations (undocumentated)
	case "teams": 
		if(checkGM(message)) cmdTeams(message, args);
	break;
	/* Update */ // Updates all github linked data
	case "update":
		if(checkGM(message)) cmdUpdate(message.channel);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command (simplified)
	case "info":
		cmdInfo(message.channel, message.author.id, args, false, false, true);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command (basics/details)
    // NOT DOCUMENTED
	case "details":
		cmdInfo(message.channel, message.author.id, args);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "info_technical":
		cmdInfoTechnical(message.channel, message.author.id, args);
	break;
	/* Role Info + Pin */ // Returns the info for a role set by the roles command & pins the message
	case "infopin":
		if(checkGM(message)) cmdInfopin(message.channel, message.author.id, args);
	break;
	/* Role Info */ // Returns the info for a role set by the roles command
	case "infoedit": // WIP: READD this command
		//if(checkGM(message)) cmdInfoEdit(message.channel, args, argsX);
	break;
	/* Role Info (Add) */ // Returns the info for a role set by the roles command, but with additions
	case "infoadd": // WIP: READD this command
		//if(checkGM(message)) cmdInfoFancy(message.channel, [args[0]], false, false, false, false, ["", argsX[1].replace(/~/g, "\n").replace(/<\/>/g,"~")]);
	break;
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
	/* List Dead */ // Lists all dead players
	case "list_dead":
		cmdListDead(message.channel);
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
	/* Promote */
	case "promote":
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
    /** DISABLED
		if(message.author.id == client.user.id || checkAdmin(message)) cmdModrole(message, args);
        **/
	break;
    /* Elect */
    case "elect":
		if(checkGM(message)) cmdElect(message.channel, args);
    break;
    /* Discord Role */
    case "dr":
		if(checkGM(message)) cmdDR(message.channel, args);
    break;
    /* Host Information */
    case "host_information":
		if(checkGM(message)) cmdHostInformation(message.channel, args);
    break;
    /* Host Information */
    case "packs":
		if(checkGM(message)) cmdPacks(message.channel, message.author, args);
    break;
    case "temp":
        let tempUsers = ["277156693765390337","242983689921888256","544125116640919557"];
        if(!tempUsers.includes(message.author.id)) {
            message.channel.send("⛔ You are not authorized to use the $temp command.");
            return;
        }
        cmdTemp(message, args);
    break;
    case "time":
        cmdTime(message.channel, args);
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
		cmdWebhook(log, author, ["**Updated Message**", "\n*Updated message by <@" + oldMessage.authorId + "> in <#" + oldMessage.channelId + ">!*","\n__Old:__\n> ", oldMessage.content.split("\n").join("\n> "),"\n","\n__New:__\n> ", newMessage.content.split("\n").join("\n> "),"\n","\n" ]);
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
		} else if(stats.gamephase == gp.INGAME && isParticipant(reaction.message.guild.members.cache.get(user.id))) {
            let poll = await getPoll(reaction.message.id);
            if(poll) {
                let emojiText = reaction.emoji.id ? `<:${reaction.emoji.name.toLowerCase()}:${reaction.emoji.id}>` : reaction.emoji.name;
                let emojiPlayer = emojiToID(emojiText);
                let emojiName = pollEmojiToName(emojiText);
                let reacText = emojiText;
                if(emojiPlayer) reacText += ` (<@${emojiPlayer}>)`;
                if(emojiName) reacText += ` (${emojiName})`;
                abilityLog(`🗳️ <@${user.id}> has added reaction ${reacText} on poll \`${poll.name}\`.`);
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
        let poll = await getPoll(reaction.message.id);
        if(poll) {
            let emojiText = reaction.emoji.id ? `<:${reaction.emoji.name.toLowerCase()}:${reaction.emoji.id}>` : reaction.emoji.name;
            let emojiPlayer = emojiToID(emojiText);
            let emojiName = pollEmojiToName(emojiText);
            let reacText = emojiText;
            if(emojiPlayer) reacText += ` (<@${emojiPlayer}>)`;
            if(emojiName) reacText += ` (${emojiName})`;
            abilityLog(`🗳️ <@${user.id}> has removed reaction ${reacText} on poll \`${poll.name}\`.`);
        }
    }
});

/* Leave Detection */
client.on("guildMemberRemove", async member => {
    if(member.guild.id != stats.log_guild) return;
	log(`❌ ${member.user} has left the server!`);
    // check if is player
    let check = await sqlPromOneEsc("SELECT * FROM players WHERE id=", member.id);
    if(check) {
        switch(+stats.gamephase) {
            // Signup phase -> signout
            case gp.SIGNUP:
                sql("DELETE FROM players WHERE id = " + connection.escape(member.id), result => {
                    log("✅ Signed out `" +  member.displayName + "`!");
                }, () => {
                    log("⛔ Database error. Could not kill `" +  member.displayName + "`!");
                });	
            break;
            // Setup phase -> signout + inform host
            case gp.SETUP:
                sql("DELETE FROM players WHERE id = " + connection.escape(member.id), result => {
                    log("✅ Signed out `" +  member.displayName + "`!");
                    log(`<@&${stats.host}>`);
                }, () => {
                    log("⛔ Database error. Could not kill `" +  member.displayName + "`!");
                    log(`<@&${stats.host}>`);
                });	
            break;
            // Ingame phase -> kill + inform host
            case gp.INGAME:
                if(check.alive != 0) {
                    sql("UPDATE players SET alive = 0 WHERE id = " + connection.escape(member.id), result => {
                        log("✅ Killed `" +  member.displayName + "`!");
                        log(`<@&${stats.host}>`);
                    }, () => {
                        log("⛔ Database error. Could not kill `" +  member.displayName + "`!");
                        log(`<@&${stats.host}>`);
                    });	
                }
            break;
        }
    }
    
    

});

/* Join Detection */
client.on("guildMemberAdd", async member => {
    await member.fetch();
    if(member.guild.id != stats.log_guild) return;
	log(`👋 ${member.user} has joined the server!`);
    let oog = member.guild.channels.cache.get("584793703923580965");
    if(oog) oog.send(`Welcome ${member.user} 👋!`);
});

/* New Slash Command */
client.on('interactionCreate', async interaction => {
    if(interaction.isButton()) {
        let orig_text = interaction.message.embeds[0].description.split(PROMPT_SPLIT)[0];
        if(!isParticipant(interaction.member) && !isGameMaster(interaction.member)) {
            interaction.deferUpdate();
            return;
        }
        let embed;
        let actionAll = await getAction(interaction.message.id);
        let invalidReply = basicEmbed(`${orig_text}${PROMPT_SPLIT} Invalid action. You cannot interact with this prompt anymore.`, EMBED_RED);
        invalidReply.components = [];
        
        // switch through interactions
        const interactionSplit = interaction.customId.split(":");
        const interactionName = interactionSplit[0];
        const interactionArg = interactionSplit.length > 1 ? interactionSplit[1] : "";
        switch(interactionName) {
            default:
                console.log("Unknown Interaction", interaction.customId);
            break;
            case "confirm": // instantly execute ability
            case "delay-confirm": // instantly execute ability, after delay
            case "delay-selectionless-confirm": // instantly execute ability, after delay selectionless
                if(!actionAll) return interaction.update(invalidReply);
                // execute immediately
                await instantQueuedAction(interaction.message.id);
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Execution confirmed.`, EMBED_GREEN);
                embed.components = [];
                interaction.update(embed);
            break;
            case "cancel": // cancel ability
            case "delay-cancel": // cancel ability, after delay
                if(!actionAll) return interaction.update(invalidReply);
                // turn this message from an action queue message into a prompt
                let action = actionAll[0];
                // recreate prompt
                await createPrompt(interaction.message.id, interaction.message.channel.id, action.src_ref, action.src_name, JSON.parse(action.orig_ability), JSON.parse(action.restrictions), JSON.parse(action.additional_trigger_data), action.prompt_type, actionAll.length, action.forced, action.trigger_name, action.type1, action.type2);
                // delete from action queue
                await deleteQueuedAction(interaction.message.id);
                // update message
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Execution cancelled. Reply to this message to submit a new choice.`, EMBED_RED);
                embed.components = [];
                interaction.update(embed); 
            break;
            case "delay-selectionless-cancel": // cancel ability, after delay selectionless
            case "confirm-end-cancel": // cancel ability, after delay selectionless
                if(!actionAll) return interaction.update(invalidReply);
                // turn this message from an action queue message into a prompt
                let actionSelectionless = actionAll[0];
                // recreate prompt
                let message = await sendSelectionlessPrompt(actionSelectionless.src_ref, actionSelectionless.prompt_type, `${orig_text}${PROMPT_SPLIT}`, EMBED_GRAY, false, null, null, "Ability Prompt");
                // schedule actions
                await createAction(message.id, message.channel.id, actionSelectionless.src_ref, actionSelectionless.src_name, JSON.parse(actionSelectionless.orig_ability), JSON.parse(actionSelectionless.orig_ability), actionSelectionless.prompt_type, "none", "none", neverActionTime, JSON.parse(actionSelectionless.restrictions), JSON.parse(actionSelectionless.additional_trigger_data), actionSelectionless.target, actionSelectionless.forced, actionSelectionless.trigger_name);
                // delete from action queue
                await deleteQueuedAction(interaction.message.id);
                // update message
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Execution cancelled. You will receive a new prompt in case you change your mind.`, EMBED_RED);
                embed.components = [];
                interaction.update(embed); 
            break;
            case "delay": // delay ability
                if(!actionAll) return interaction.update(invalidReply);
                // set delay
                await delayQueuedAction(interaction.message.id);
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Execution delayed. You may execute the ability immediately or cancel the execution (allowing you to change your selection). If you choose no action the ability will be executed automatically towards the end of the phase.`, EMBED_YELLOW);
                let confirmButton = { type: 2, label: "Execute Immediately", style: 3, custom_id: "delay-confirm" };
                let cancelButton = { type: 2, label: "Cancel", style: 4, custom_id: "delay-cancel" };
                embed.components = [ { type: 1, components: [ confirmButton, cancelButton ] } ];
                interaction.update(embed);
            break;
            case "delay-selectionless": // delay ability
                if(!actionAll) return interaction.update(invalidReply);
                // set delay
                await delayQueuedAction(interaction.message.id);
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Execution delayed. You may execute the ability immediately or cancel the execution. If you choose no action the ability will be executed automatically towards the end of the phase.`, EMBED_YELLOW);
                let confirmButtonSelectionless = { type: 2, label: "Execute Immediately", style: 3, custom_id: "delay-selectionless-confirm" };
                let cancelButtonSelectionless = { type: 2, label: "Cancel", style: 4, custom_id: "delay-selectionless-cancel" };
                embed.components = [ { type: 1, components: [ confirmButtonSelectionless, cancelButtonSelectionless ] } ];
                interaction.update(embed);
            break;
            case "confirm-end": // confirm end ability
                if(!actionAll) return interaction.update(invalidReply);
                // set delay
                await endConfirmQueuedAction(interaction.message.id);
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Execution confirmed. If you change your mind, you can still cancel the execution until the end of the phase.`, EMBED_GREEN);
                let cancelEndButton = { type: 2, label: "Cancel", style: 4, custom_id: "confirm-end-cancel" };
                embed.components = [ { type: 1, components: [ cancelEndButton ] } ];
                interaction.update(embed);
            break;
            case "choice":  {// choice reply
                // get arguments
                const interactionArgSplit = interactionArg.split("-");
                if(interactionArgSplit.length != 2) {
                    interaction.deferUpdate();
                    return;
                }
                const choiceName = interactionArgSplit[0];
                const optionName = interactionArgSplit[1];
                const chooserMember = interaction.member.id
                const chooserChannel = interaction.channel.id;
                // get choice data
                let choiceData = await choicesFind(choiceName, chooserMember, chooserChannel);
                if(!choiceData) { // cant find choice (can happen when reactor is not choice owner)
                    interaction.deferUpdate();
                    return;
                }
                let chooser = choiceData.owner;
                let choiceCreatorId = srcToValue(choiceData.src_ref);
                // update message
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Choice chosen.`, EMBED_GREEN);
                let unchooseButton = { type: 2, label: "Revert Choice", style: 4, custom_id: `revert-choice:${choiceName}` };
                embed.components = [ { type: 1, components: [ unchooseButton ] } ];
                interaction.update(embed);
                // run trigger
                abilityLog(`✅ **Choice Chose:** ${srcRefToText(chooser)} chose \`${optionName}\` for \`${choiceName}\`.`);
                await triggerPlayer(choiceCreatorId, "Choice Chosen", { chooser: `${chooser}`, chosen: parseOption(optionName), choice_data: { name: choiceName, owner: chooser } }); 
                await triggerPlayer(choiceCreatorId, "Choice Chosen Complex", { chooser: `${chooser}`, chosen: parseOption(optionName), choice_data: { name: choiceName, owner: chooser } }); 
                // set as chosen
                await choicesUpdateByOwner(choiceName, chooser, "chosen", 1);
                // check choice completion
                await choiceCheckCompletion(chooser, choiceName);
            } break;
            case "revert-choice": {
                const choiceName = interactionArg;
                const chooserMember = interaction.member.id;
                const chooserChannel = interaction.channel.id;
                // get choice data
                let choiceData = await choicesFind(choiceName, chooserMember, chooserChannel);
                if(!choiceData) { // cant find choice (can happen when reactor is not choice owner)
                    interaction.deferUpdate();
                    return;
                }
                let chooser = choiceData.owner;
                
                // remove prompts and actions
                let clearedCount = await choiceUnchoose(orig_text, chooser, choiceName);
                
                if(clearedCount > 0) { // there was something to clear -> can be unchosen
                    // update message
                    embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Choice unchosen.`, EMBED_RED);
                    embed.components = [ ];
                    interaction.update(embed);
                    
                    // set as unchosen
                    await choicesUpdateByOwner(choiceName, chooser, "chosen", 0);
                    
                    // create new choice
                    choicesChoosingPrompt(choiceData.src_name, choiceData.owner, JSON.parse(choiceData.ability), choiceData.prompt);
                } else {
                    // update message
                    embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Cannot unchose choice.`, EMBED_RED);
                    embed.components = [ ];
                    interaction.update(embed);
                }
            
            } break;
        }
    }
});


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

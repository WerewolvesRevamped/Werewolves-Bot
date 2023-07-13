/*
	Utility module
		- Logging / Errors
		- Time
		- Title Case
		- Remove array duplicates
		- Pinging
		- Handelling channels
		- Handelling command permissions
*/
module.exports = function() {
	/* Converts a string to title case */
	this.toTitleCase = function(str) {
		return str.replace(/[a-zA-Z0-9][^\s-_]*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
	}
	
	this.toSentenceCase = function(str) {
		return str.split(". ").map(el => el.length > 1 ? el.charAt(0).toUpperCase() + el.substr(1): el).join(". ");
	}
	
	/* Chunks an array into chunks of the same size */ 
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
			client.guilds.cache.get(stats.log_guild).channels.cache.get(stats.log_channel).send(txt);
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
    
    this.cmdEdit = function(channel, args, argsX) {
        channel.messages.fetch(args[0])
            .then(m => {
                argsX.shift();
                let text = argsX.join(" ");
                m.edit(text.replace(/~/g,"\n"));
            });
    }
	
	this.cmdBulkDelete = function(channel) {
        if(isSC(channel)) {
            channel.messages.fetch().then(messages => {
                channel.bulkDelete(messages.filter(el => el.member == null || !el.author.bot)).then(messages => {
                  channel.send("✅ Deleted " + messages.size + " messages.").then(msg => msg.delete({timeout: 5000}));
                });
            }).catch(err => {
                logO(err); 
                sendError(channel, err, "Could not perform bulk delete");
            });
        } else {
            channel.send("⛔ Game Master error. Do not run this in non-SCs!"); 
			return; 
        }
	}
	
	this.cmdDelete = function(channel, args) {
		if(!args[0] || isNaN(args[0]) || args[0] > 5) {
			channel.send("⛔ Syntax error. Requires a number (<=5) as parameter!"); 
			return; 
		}
		channel.messages.fetch().then(messages => {
			channel.bulkDelete(args[0]).then(messages => {
			  channel.send("✅ Deleted " + messages.size + " messages.").then(msg => msg.delete({timeout: 500}));
			});
		}).catch(err => {
			logO(err); 
			sendError(channel, err, "Could not perform delete");
		});
	}
	
	this.cmdDelay = function(channel, args) {
		if(!args[0] || isNaN(args[0]) || args[0] >= 93600) {
			channel.send("⛔ Syntax error. Requires a number as parameter!"); 
			return; 
		} else if(!args[1]) {
			channel.send("⛔ Syntax error. Needs a command to run after the delay!"); 
		}
		setTimeout(() => { 
			if(args[1] != "delay") channel.send(stats.prefix + args.splice(1).join(" "));
			else channel.send("```" + stats.prefix + args.splice(1).join(" ") + "```");
		}, args[0] * 1000);
	}
	
	this.cmdModify = function(message, args, argsX) {
		if(!args[0] || !args[1]) {
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		switch(args[0]) {
			case "nick":
			case "nickname":
				message.guild.members.cache.get(client.user.id).setNickname(argsX[1])
				 .then(() => {
					  message.channel.send("✅ Updated bot nickname!");
				  }).catch(err => {
					logO(err); 
					sendError(message.channel, err, "Could not update bot nickname");
				});
			break;
			case "status":
				if(args[1] != "dnd" && args[1] != "online" && args[1] != "idle" && args[1] != "invisible") {
					message.channel.send("⛔ Syntax error. Needs to be `online`, `idle`, `dnd` or `invisible`!"); 
					return;
				}
				client.user.setStatus(args[1])
				message.channel.send("✅ Updated bot status!");
			break;
			case "activity":
				client.user.setPresence({ activities: [{ name: argsX[1], type: "PLAYING" }] })
				message.channel.send("✅ Updated bot activity!");
			break;
			default:
				message.channel.send("⛔ Syntax error. This is not a value that can be modified!"); 
			break;
		}
	}
	
	/* Handles help command */
	this.cmdHelp = function(channel, member, args) {
		// parse alias
		args[0] = parseAlias(args[0]);
		// Normal help
		let msgA = "", msgB = "", msgC = "";
		if(!args[0]) {
			args[0] = "";
			if(isGameMaster(member)) msgA += "**```yaml\nWerewolf Bot Game Master Help\n```**";
			else msgA += "**```yaml\nWerewolf Bot Player Help\n```**";
			if(isGameMaster(member)) msgA += "```php\n" + phpEscape("Use " + stats.prefix + "help <command> to get information about a command.\nWhile ingame react to messages with 📌 to pin them!\nPlayer arguments can be names, emojis, ids, nicknames or discord tags\n%s and %c can be used to refer to yourself and to the current channel, in all commands.\nArguments cant contain spaces, unless the argument is quoted \"like this\"") + "```";
			else msgA += "```php\n" + phpEscape("Use " + stats.prefix + "help <command> to get information about a command.\nWhile ingame react to messages with 📌 to pin them!\nPlayer arguments can be names, emojis, ids, nicknames or discord tags\nArguments cant contain spaces, unless the argument is quoted \"like this\"") + "```";
		} else {
			msgA += "**```yaml\n" + toTitleCase(args.join(" ")) + " Help\n```**";
		}
		// Commands
		msgB += helpRoles(member, args);
		msgB += helpUtility(member, args);
		msgB += helpStats(member, args);
		msgB += helpCCs(member, args);
		msgB += helpGame(member, args);
		msgB += helpWhispers(member, args);
		msgB += helpPlayers(member, args);
		msgB += helpPoll(member, args);
		msgB += helpTheme(member, args);
		msgB += helpBase(member, args);
		msgB += helpConfirm(member, args);
		// Print
		if(args[0] === "") { 
			msgC = chunkArray(msgB.split("\n"), 25).map(el => "```php\n" + phpEscape(el.join("\n")) + "\n```");
			msgC[0] = msgA + msgC[0];
			msgC.forEach(el => channel.send(el));
		} else {
			if(msgB) channel.send(msgA + msgB);
			else channel.send(msgA + "```fix\nNot a valid command```");
		}

	}
	
	this.phpEscape = function(txt) {
		return txt.replace(/(and|list|from|switch|Public|or|new|as|New|Use|While)/g, el => el.substr(0, 1) + "​" + el.substr(1));
	}
	
	this.cmdTemp = function(message, args) {
		if(!args[0] || !args[1].match(/[0-9]*/) || (args[0] != "c" && args[0] != "f")) {
			message.channel.send("Not enough/Invalid parameters.");
			return;
		}
		switch(args[0]) {
			default: message.channel.send("Unknown conversion."); break;
			case "f": message.channel.send(args[1] + " °C in fahrenheit: "  + Math.round((args[1] * (9/5)) + 32, 2) + " °F"); break;
			case "c": message.channel.send(args[1] + " °F in celsius: "  + Math.round((args[1] - 32) *  5/9, 2)  + " °C"); break;
		}
	}
	
	/* Help for base module */
	this.helpBase = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "split - Runs a list of semicolon seperated commands\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "say - Makes the bot repeat a message\n";
				if(isGameMaster(member)) help += stats.prefix + "sudo - Allows webhooks to run commands\n";
			break;
			case "split":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "split\n```";
				help += "```\nFunctionality\n\nRuns a list of commands that are provided as a semicolon seperated list.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "split help;ping```";
			break;
			case "say":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "say\n```";
				help += "```\nFunctionality\n\nMakes the bot repeat everything after say.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "say Hello!\n< Hello!```";
				help += "```diff\nAliases\n\n- >\n```";
			break;
			case "sudo":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "sudo <Command>\n```";
				help += "```\nFunctionality\n\nAllows webhooks to run commands with GM permissions in GMSAFE channels.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "sudo confirm killq killall```";
			break;
		}
		return help;
	}
	
	/* Help for this module */
	this.helpUtility = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				help += stats.prefix + "ping - Tests the bot\n";
				help += stats.prefix + "help - Provides information about commands\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "bulkdelete - Deletes webhook & user messages in bulk\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "delete - Deletes a couple of messages\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "delay - Executes a command with delay\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "modify - Modifies the bot\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "edit - Edits a bot message\n";
			break;
			case "ping":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "ping\n```";
				help += "```\nFunctionality\n\nGives the ping of the bot, and checks if the bot is running.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "ping\n< ✅ Pong! Latency is 170ms. API Latency is 128ms```";
				help += "```diff\nAliases\n\n- ?\n```";
			break;
			case "bulkdelete": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "bulkdelete\n```";
				help += "```\nFunctionality\n\nDeletes webhook/user messages (but not bot messages) in bulk from a channel.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "bulkdelete\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "bulkdelete!\n< ✅ Deleted 17 messages.```";
				help += "```diff\nAliases\n\n- bd\n```";
			break;
			case "delete": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "delete [0-5]\n```";
				help += "```\nFunctionality\n\nDeletes the last up to five messages from a channel.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "delete 3\n< ✅ Deleted 3 messages.```";
				help += "```diff\nAliases\n\n- d\n```";
			break;
			case "delay": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "delay <Delay> <Command>\n```";
				help += "```\nFunctionality\n\nExecutes a command with delay in seconds.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "delay 5 ping\n< ✅ Pong! Latency is 990ms. API Latency is 114ms```";
			break;
			case "help":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "help <Command> [Sub-Command(s)]\n```";
				help += "```\nFunctionality\n\nProvides help for a command (with subcommands)\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "help help\n```";
				help += "```diff\nAliases\n\n- h\n```";
			break;
			case "modify":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "modify <attribute> <value>\n```";
				help += "```\nFunctionality\n\nUpdates an <attribute> of the bot to <value>. Available attributes: status, nickname, activity.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "modify status dnd!\n< ✅ Updated bot status!```";
				help += "```diff\nAliases\n\n- mod\n```";
			break;
			case "edit":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "edit <id> <text>\n```";
				help += "```\nFunctionality\n\nUpdates a bot message.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "edit 28462946294 New message contents```";
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
			let ping = Math.round(client.ws.ping);
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
			case "read": return PermissionsBitField.Flags.ViewChannel;
			case "write": return PermissionsBitField.Flags.SendMessages;
			case "manage": return PermissionsBitField.Flags.ManageMessages;
			case "history": return PermissionsBitField.Flags.ReadMessageHistory;
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
    
    /* Commands for only GMs */
	this.checkGMHelper = function(message) {
		if(!isGameMaster(message.member) && !isHelper(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command!"); 
			return false;
		} 
		return true;
	}
    
	/* Commands for only Admins */
	this.checkAdmin = function(message) {
		if(!isAdmin(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command! (Admin required)"); 
			return false;
		} 
		return true;
	}
    
	/* Commands for only Admins */
	this.checkSenior = function(message) {
		if(!isSenior(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command! (Senior GM required)"); 
			return false;
		} 
		return true;
	}
	
	/* Commands for only GMSAFE channels */
	this.checkSafe = function(message) {
		if(!message.member || checkGM(message)) {
			if(message.channel.topic != "GMSAFE") { 
				message.channel.send("❌ This command can only be executed in game master channels! Make a channel a game master channel by setting its topic to `GMSAFE`!"); 
				return false;
			}
			return true;
		}
		return false;
	}
	
	/* Cleanup a category */
	this.cleanupCat = function(channel, categoryID, name) {
		// Category deleted
		if(!channel.guild.channels.cache.get(categoryID)) { 
		channel.send("⛔ Command error. No " + name + " category found!");
			return;
		}
		// Delete channels in category
		cleanupOneChannel(channel, categoryID, channel.guild.channels.cache.get(categoryID).children.cache.toJSON(), 0, name);
	}
	
	/* Deletes a cc */
	this.cleanupOneChannel = function(channel, cat, channels, index, name) {
		if(channels.length <= 0) return;
		if(index >= channels.length) {
			// Delete category
			channel.guild.channels.cache.get(cat).delete().then(c => {
				channel.send("✅ Successfully deleted " + name + " category!");
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not delete " + name + " Category");
			});
			return;
		}
		// Deleted channel
		if(!channels[index] || !channel.guild.channels.cache.get(channels[index].id)) {
			cleanupOneChannel(channel, cat, channels, ++index, name);
			return;
		}
		// Delete channel
		channel.guild.channels.cache.get(channels[index].id).delete().then(c => {
			cleanupOneChannel(channel, cat, channels, ++index, name);
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not delete channel");
		});
	}
	
	this.sleep = function(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
    
    this.idEmojis = [
        ["242983689921888256","🛠️"], // Ts
        ["277156693765390337","🏹"], // Vera
        ["271399293372334081","🚁"], // Chopper
        ["331803222064758786","🥝"], // Marten
        ["152875086213283841","🐘"],  // Dennis
        ["328035409055449089","💠"],  // VoidMist
        ["329977469350445069","🐺"], // Lord of Galaxy
        ["281590363213398016","🍄"], // SpikedJackson
        ["458727748504911884","🦎"], // Jay
        ["244211825820827648","🐸"], // PsychoBelp
        ["413001114292846612","🐛"], // Leilaboo
        ["241953256777973760","🤗"], // BartTheBart
        ["433957826491187202","🦦"], // Steilsson
        ["334066065112039425","🔥"], // Steinator
        ["544125116640919557","▪️"], // Ethan.
        ["234474456624529410","🎨"], // Captain Luffy
        ["356510817094598658","🐢"], // Mr. Turtle
        ["299000787814842368","😃"], // Topkinsme
        ["83012212779646976","🇺🇸"], // Wyatt
        ["633338331220148225","🌌"], // Sharl Eclair
        ["375578492580003840","💚"], // Mojo
        ["161551993704284171","🐼"], // kruthers
        ["215427550577557504","👁‍🗨"], // MatMeistress
        ["334136126745083907","🐓"], // Jean D. Arch
        ["265186558016094208","🍅"], // Relaxed Mato
        ["490180990237540352","🧋"], // the kremblin
        ["139855429357273088","☢️"], // Swurtle
        ["489047121840963585","🐙"], // Alphaviki
        ["839150186613702749","🕯️"], //phantom
        ["405803301251055617","4️⃣"] // harperette
    ];
    
    this.parseAlias = function(alias) {
        let aliases = {
                "modrole": ["mr"],
                "substitute": ["sub","unsub","unsubstitute"],
                "spectate": ["s","spec","spectator"],
                "close": ["x"],
                "open": ["@"],
                "gameping": ["@@"],
                "theme": ["th","themes"],
                "demote": ["de"],
                "promote": ["pro"],
                "unhost": ["unho"],
                "host": ["ho"],
                "demote_unhost": ["v"],
                "promote_host": ["^"],
                "poll": ["polls","pl"],
                "emojis": ["emoji","e"],
                "help": ["h"],
                "impersonate": ["imp"],
                "webhook": ["bot","<"],
                "cc": ["c","ccs"],
                "roll": ["rand","random","randomize"],
                "players": ["p","player"],
                "killq": ["kq","kill","killqueue"],
                "sheet": ["sh","game"],
                "delete": ["d"],
                "bulkdelete": ["bd"],
                "list_alive": ["a","alive","alive_list","alive-list","listalive","list-alive"],
                "list_alphabetical": ["la"],
                "list_signedup": ["l","list","signedup","signedup_list","signedup-list","listsignedup","list-signedup"],
                "signup": ["join","sign-up","sign_up","unsignup","signout","participate","sign-out","sign_out","leave","unjoin","signups"],
                "options": ["stat","stats","option"],
                "info": ["i"],
                "infopin": ["ip","info_pin"],
                "infoedit": ["ie","info_edit"],
                "infoadd": ["ia","info_add"],
                "info_classic": ["ic"],
                "info_classic_simplified": ["ics"],
                "info_fancy": ["if"],
                "info_fancy_simplified": ["ifs"],
                "roles": ["role","r"],
                "connection": ["con","connect","whisper","whispers"],
                "gamephase": ["gp","game_phase","game-phase"],
                "modify": ["mod"],
                "say": [">"],
                "ping": ["?"],
                "channels": ["channel","ch"],
                "elect": ["el", "elected"],
                "list_substitutes": ["subs","list_subs","substitutes"],
                "force_demote_all": ["fda"],
                "force_demote_signedup": ["fdsn"]
        };
        for(let cmd in aliases) {
            if(aliases[cmd].indexOf(alias) != -1) return cmd;
        }
        return alias;
    }
    
    /* HTTP */
    const fetch = require('node-fetch');
    this.checkUrlExists = async function(url) {
        const response = await fetch(url, {
            method: 'HEAD'
        });
        return response.ok;
    }
   
	
	// returns a value for how many edits (additions, removals, replacements) are necessary to turn one string into another
	// this means it basically gives a score on how close two strings are, with closer values being better
	// known as "levenshtein distance"
	this.strDst = function (str1 = "", str2 = "") {
	    // create empty matrix, with row 1 and column 1 filled with incrementing numbers
	    var len1 = str1.length, len2 = str2.length;
	    var track = Array(len2 + 1).fill().map((_, ind1) => 
		Array(len1 + 1).fill().map((_, ind2) =>
		    !ind1 ? ind2 : (!ind2 ? ind1 : null)
		)
	    );
	    // determine levenshtein distance
	    for(let j = 1; j <= len2; j++) {
		for(let i = 1; i <= len1; i++) {
		    const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
		    track[j][i] = Math.min(
			track[j][i - 1] + 1, // deletion
			track[j - 1][i] + 1, // insertion
			track[j - 1][i - 1] + indicator // substitution
		    );
		}
	    }
	    return track[len2][len1];
	};

	// finds the best match for arg1 in the list arg2
	this.findBestMatch = function(name = "", list = []) {
	    let w = list.map(p => strDst(p, name));
	    // get index of closest match (lowest weight)
	    let best = w.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0);
	    return {value: w[best], index: best, name: list[best]};
	}

	
}

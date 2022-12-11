/*
	Module for handelling things regarding stats:
		- Modifying options
		- Gamephase
		- Cacheing stats
		- Convert gamephase id to name
*/
module.exports = function() {
	/* Variables */
	this.stats = {};
	
	/* Caches stats everytime they are changed or the bot is (re)started */
	this.getStats = function() {
		var doLog = false;
		// Get Log Channel & Guild
		sqlGetStat(11,  result => { 
			stats.log_guild = result;
			if(doLog) log("Stats > Cached log guild id as `" + result + "`!")
		}, () => {
            stats.log_guild = false;
			log("Stats > ❗❗❗ Unable to cache log guild id!")
		});
		sqlGetStat(12,  result => { 
			stats.log_channel = result; 
			if(doLog) log("Stats > Cached log channel id as `" + result + "`!")
		}, () => {
            stats.log_channel = false;
			log("Stats > ❗❗❗ Unable to cache log channel id!")
		});
		// Get Gamephase
		sqlGetStat(1, result => { 
			stats.gamephase = result; 
			getEmojis(); 
			if(doLog) log("Stats > Cached gamephase as `" + result + "`!")
		}, () => {
            stats.gamephase = gp.NONE; 
			log("Stats > ❗❗❗ Unable to cache gamephase!")
		});
		// Get Prefix
		sqlGetStat(2,  result => { 
			stats.prefix = result; 
			if(doLog) log("Stats > Cached prefix as `" + result + "`!")
		}, () => {
            stats.prefix = "$";
			log("Stats > ❗❗❗ Unable to cache prefix!")
		});
		// Get Role Ids
		sqlGetStat(3,  result => { 
			stats.participant = result; 
			if(doLog) log("Stats > Cached participant role id as `" + result + "`!")
		}, () => {
            stats.participant = false;
			log("Stats > ❗❗❗ Unable to cache participant role id!")
		});
		sqlGetStat(4,  result => { 
			stats.gamemaster = result; 
			if(doLog) log("Stats > Cached gamemaster role id as `" + result + "`!")
		}, () => {
            stats.gamemaster = false;
			log("Stats > ❗❗❗ Unable to cache gamemaster role id!")
		});
		sqlGetStat(5,  result => { 
			stats.spectator = result; 
			if(doLog) log("Stats > Cached spectator role id as `" + result + "`!")
		}, () => {
            stats.spectator = false;
			log("Stats > ❗❗❗ Unable to cache spectator role id!")
		});
		sqlGetStat(6,  result => { 
			stats.signed_up = result; 
			if(doLog) log("Stats > Cached signed up role id as `" + result + "`!")
		}, () => {
            stats.signed_up = false;
			log("Stats > ❗❗❗ Unable to cache signed up role id!")
		});
		sqlGetStat(7,  result => { 
			stats.dead_participant = result; 
			if(doLog) log("Stats > Cached dead participant role id as `" + result + "`!")
		}, () => {
            stats.dead_participant = false;
			log("Stats > ❗❗❗ Unable to cache dead participant role id!")
		});
		sqlGetStat(8,  result => { 
			stats.bot = result; 
			if(doLog) log("Stats > Cached bot role id as `" + result + "`!")
		}, () => {
            stats.bot = false;
			log("Stats > ❗❗❗ Unable to cache bot role id!")
		});
		// Cache Elected roles
		sqlGetStat(16,  result => { 
			stats.mayor = result; 
			if(doLog) log("Stats > Cached mayor role id as `" + result + "`!")
		}, () => {
            stats.mayor = false;
			log("Stats > ❗❗❗ Unable to cache mayor role id!")
		});
		sqlGetStat(17,  result => { 
			stats.reporter = result; 
			if(doLog) log("Stats > Cached reporter role id as `" + result + "`!")
		}, () => {
            stats.reporter = false;
			log("Stats > ❗❗❗ Unable to cache reporter role id!")
		});
		sqlGetStat(18,  result => { 
			stats.guardian = result; 
			if(doLog) log("Stats > Cached guardian role id as `" + result + "`!")
		}, () => {
            stats.guardian = false;
			log("Stats > ❗❗❗ Unable to cache guardian role id!")
		});
		sqlGetStat(19,  result => { 
			stats.game = result; 
			if(doLog) log("Stats > Cached game name as `" + result + "`!")
		}, () => {
            stats.game = "WWR";
			log("Stats > ❗❗❗ Unable to cache game name!")
		});
		sqlGetStat(21,  result => { 
			stats.gamemaster_ingame = result; 
			if(doLog) log("Stats > Cached game master ingame role id as `" + result + "`!")
		}, () => {
            stats.gamemaster_ingame = false;
			log("Stats > ❗❗❗ Unable to cache game master ingame role id!")
		});
		sqlGetStat(22,  result => { 
			stats.admin = result; 
			if(doLog) log("Stats > Cached admin role id as `" + result + "`!")
		}, () => {
            stats.admin = false;
			log("Stats > ❗❗❗ Unable to cache admin role id!")
		});
		sqlGetStat(23,  result => { 
			stats.admin_ingame = result; 
			if(doLog) log("Stats > Cached admin ingame role id as `" + result + "`!")
		}, () => {
            stats.admin_ingame = false;
			log("Stats > ❗❗❗ Unable to cache admin ingame role id!")
		});
		sqlGetStat(24,  result => { 
			stats.yes_emoji = result; 
			if(doLog) log("Stats > Cached yes emoji as `" + result + "`!")
		}, () => {
            stats.yes_emoji = "false";
			log("Stats > ❗❗❗ Unable to cache yes emoji!")
		});
		sqlGetStat(25,  result => { 
			stats.no_emoji = result; 
			if(doLog) log("Stats > Cached no emoji as `" + result + "`!")
		}, () => {
            stats.no_emoji = false;
			log("Stats > ❗❗❗ Unable to cache no emoji!")
		});
		sqlGetStat(26,  result => { 
			stats.new_game_ping = result; 
			if(doLog) log("Stats > Cached new game ping as `" + result + "`!")
		}, () => {
            stats.new_game_ping = false;
			log("Stats > ❗❗❗ Unable to cache new game ping!")
		});
		sqlGetStat(27,  result => { 
			stats.game_status = result; 
			if(doLog) log("Stats > Cached game status vc as `" + result + "`!")
		}, () => {
            stats.game_status = false;
			log("Stats > ❗❗❗ Unable to cache game status vc!")
		});
		sqlGetStat(28,  result => { 
			stats.cc_limit = result; 
			if(doLog) log("Stats > Cached cc limit as `" + result + "`!")
		}, () => {
            stats.cc_limit = 0;
			log("Stats > ❗❗❗ Unable to cache game status vc!")
		});
		sqlGetStat(29,  result => { 
			stats.theme = result; 
			if(doLog) log("Stats > Cached theme as `" + result + "`!");
			cacheTheme();
		}, () => {
            stats.theme = "default";
			log("Stats > ❗❗❗ Unable to cache theme!")
		});
		// Cache Elected roles
		sqlGetStat(30,  result => { 
			stats.mayor2 = result; 
			if(doLog) log("Stats > Cached mayor2 role id as `" + result + "`!")
		}, () => {
            stats.mayor2 = false;
			log("Stats > ❗❗❗ Unable to cache mayor2 role id!")
		});
		// Cache Elected roles
		sqlGetStat(31,  result => { 
			stats.poll = result; 
			if(doLog) log("Stats > Cached poll mode as `" + result + "`!")
		}, () => {
            stats.poll = 0;
			log("Stats > ❗❗❗ Unable to cache poll mode!")
		});
		// Sub role
		sqlGetStat(32,  result => { 
			stats.sub = result; 
			if(doLog) log("Stats > Cached substitute player role as `" + result + "`!")
		}, () => {
            stats.sub = false;
			log("Stats > ❗❗❗ Unable to cache substitute player role mode!")
		});
		// gif ping
		sqlGetStat(33,  result => { 
			stats.ping = result; 
			if(doLog) log("Stats > Cached gif ping as `" + result + "`!")
		}, () => {
            stats.ping = stats.gamemaster ? stats.gamemaster : false;
			log("Stats > ❗❗❗ Unable to cache gif ping!")
		});
		sqlGetStat(34,  result => { 
			stats.host = result; 
			if(doLog) log("Stats > Cached host role id as `" + result + "`!")
		}, () => {
            stats.host = false;
			log("Stats > ❗❗❗ Unable to cache host role id!")
		});
		// fancy mode
		sqlGetStat(35,  result => { 
			stats.fancy_mode = result === 'true'; 
			if(doLog) log("Stats > Cached fancy mode as `" + stats.fancy_mode + "`!")
		}, () => {
            stats.fancy_mode = false;
			log("Stats > ❗❗❗ Unable to cache fancy mode!")
		});
		// icon version
		sqlGetStat(36,  result => { 
			stats.icon_version = result; 
			if(doLog) log("Stats > Cached icon version as `" + result + "`!")
		}, () => {
            stats.icon_version = 0;
			log("Stats > ❗❗❗ Unable to cache icon version!")
		});
	}
	
	/* Gets the name of a gamephase by id */
	this.getPhaseName = function(id) {
		switch(+id) {
			case gp.NONE: return "NOTHING"; 
			case gp.SIGNUP: return "SIGNUP"; 
			case gp.SETUP: return "SETUP"; 
			case gp.INGAME: return "INGAME"; 
			case gp.POSTGAME: return "POST GAME";
			default: return "INVALID";
		}
	}
	
	/* Handles option command */
	this.cmdOptions = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		let stat;
		if(isNaN(args[0])) {
			// Convert stat
			stat = 0;
			switch(args[0]) {
				case "prefix": stat = 2; break;
				case "participant": stat = 3; break;
				case "gamemaster": stat = 4; break;
				case "spectator": stat = 5; break;
				case "signed_up": stat = 6; break;
				case "dead_participant": stat = 7; break;
				case "bot": stat = 8; break;
				case "log_guild": stat = 11; break;
				case "log_channel": stat = 12; break;
				case "mayor": stat = 16; break;
				case "reporter": stat = 17; break;
				case "guardian": stat = 18; break;
				case "game": stat = 19; break;
				case "gamemaster_ingame": stat = 21; break;
				case "admin": stat = 22; break;
				case "admin_ingame": stat = 23; break;
				case "yes_emoji": stat = 24; break;
				case "no_emoji": stat = 25; break;
				case "new_game_ping": stat = 26; break;
				case "game_status": stat = 27; break;
				case "cc_limit": stat = 28; break;
				case "theme": stat = 29; break;
				case "mayor2": stat = 30; break;
				case "poll": stat = 31; break;
				case "sub": stat = 32; break;
				case "ping": stat = 33; break;
				case "host": stat = 34; break;
				case "fancy_mode": stat = 35; break;
				case "icon": stat = 36; break;
				default: message.channel.send("⛔ Syntax error. Invalid parameter!"); return;
			}
		} else {
			stat = args[0];
		}
		// Find subcommand
		if(args[1]) cmdOptionsSet(message.channel, args, stat); 
		else cmdOptionsGet(message.channel, args, stat); 
		
	}
	
	/* Sets a stat in the database */
	this.cmdOptionsSet = function(channel, args, stat) {
		// Set value
		sqlSetStat(stat, args[1], result => {
			channel.send("✅ Successfully updated `" + args[0] + "` to `" + args[1] + "`!"); 
			getStats();
		}, () => {
			// Db error
			channel.send("⛔ Database error. Could not update `" + args[0] + "`!");
		}); 
	}
	
	this.helpStats = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "options <Option Name> - Manages options\n";
				if(isGameMaster(member)) help += stats.prefix + "gamephase [get|set] - Manages gamephase\n";
			break;
			case "options":
				if(!isGameMaster(member)) break;
					help += "```yaml\nSyntax\n\n" + stats.prefix + "options <Option Name> <New Value>\n```";
					help += "```\nFunctionality\n\nReturns or sets (if <New Value> is set) the value of a bot option <Option Name>. A bot option can be a numeric id, or an option name.\n\nList of Option Names:\nprefix: The prefix the bot uses for commands\nparticipant: The id of the participant role\ngamemaster: The id of the gamemaster role\nspectator: The id of the spectator role\nsigned_up: The id of the signed up role\ndead_participant: The id of the dead participant role\nbot: The id of the bot role\nlog_guild: The id of the guild to use for logs\nlog_channel: The id of the channel to use for logs\nmayor: The id of the mayor role\nreporter: The id of the reporter role\nguardian: The id of the guardian role\ngame: The name of the game\ngamemaster_ingame: The id of the gamemaster ingame role\nadmin: The id of the admin role\nadmin_ingame: The id of the admin ingame role\nyes_emoji: The id of the yes emoji\nno_emoji: The id of the no emoji\nnew_game_ping: Role that gets pinged with certain commands\ngame_status: A VC that shows the status of the game\ncc_limit: Maximum amount of ccs one person can create (-1 for none)\nmayor2: The id of the second mayor role (which doesn't give extra votes)\npoll: The poll mode (0 -> default, 1 -> cancel, 2 -> private random)\nsub: role for substitute players\nping: ping for gifs and deleted messages\nhost: The id of the host role\nfancy_mode: Changes info messages to fancy versions if set to true.\nicon: the version to use for icon images.\n```";
					help += "```fix\nUsage\n\n> " + stats.prefix + "options mayor\n< ✅ mayor currently is set to 588125889611431946!\n\n> " + stats.prefix + "options mayor 588125889611431946\n< ✅ Successfully updated mayor to 588125889611431946!```";
					help += "```diff\nAliases\n\n- stat\n- stats\n- option\n```";
			break;
			case "gamephase":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "gamephase [get|set]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle the gamephase. " + stats.prefix + "help gamephase <sub-command> for detailed help. Also serves as an alias for " + stats.prefix + "gamephase get\n\nList of Gamephases:\nNothing, Signups, Ingame, Postgame```";
						help += "```diff\nAliases\n\n- gp\n- game-phase\n- game_phase\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "gamephase get\n```";
						help += "```\nFunctionality\n\nReturns the current gamephase\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "gamephase get\n< ✅ Game Phase is INGAME (2)\n```";
					break;
					case "set":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "gamephase set <Value>\n```";
						help += "```\nFunctionality\n\nSets the gamephase to <Value>, which has to be an integer between 0 and 3\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "gamephase set 2\n< ✅ Game Phase is now INGAME (2)!\n```";
					break;
				}
			break;
		}
		return help;
	}
	
	/* Gets a stat from the database */
	this.cmdOptionsGet = function(channel, args, stat) {
		// Get value
		sqlGetStat(stat, result => {
			if(result.length > 0) { 
				// Print value
				channel.send("✅ `" + args[0] + "` currently is set to `" + result + "`!");
				getStats();
			} else { 
				// Value unset
				channel.send("⛔ Database error. Could not get `" + stat + "`!");
			}
		}, () => {
			// Db error
			channel.send("⛔ Database error. Could not access stats!");
		});
	}
	
	/* Handle Gamephase Command */
	this.cmdGamephase = function(message, args) {
		// Find subcommand
		switch(args[0]) {
			default: 
			case "get": cmdGamephaseGet(message.channel); break;
			case "set": cmdGamephaseSet(message.channel, args); break;
		}
	}
    
    this.gp = {
        NONE: 0,
        SIGNUP: 1,
        SETUP: 2,
        INGAME: 3,
        POSTGAME: 4,
        
        MIN: 0,
        MAX: 4
    };
	
	/* Set gamephase */
	this.cmdGamephaseSet = function(channel, args) {
		// Check arguments
		if(!args[1] && args[1] !== 0) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `gamephase set <phase>`"); 
			return; 
		} else if(args[1] >= gp.MIN && args[1] <= gp.MAX) {
			// Saved verified gamephase
			sqlSetStat(1, args[1], result => {
				let phase = getPhaseName(args[1]);
				channel.send("✅ Game Phase is now `" + phase + "` (" + args[1] + ")!"); 
				getStats();
				updateGameStatus(channel.guild);
			}, () => {
				// Database didn't update gamephase
				channel.send("⛔ Database error. Game Phase could not be set to `" + args[1] + "`!");
			});
		} else {
			// Invalid gamephase value
		channel.send("⛔ Syntax error. Game Phase could not be set to `" + args[1] + "`!");
		}
	}
	
	/* Get gamephase */
	this.cmdGamephaseGet = function(channel) {
		// Get gamephase from db
		sqlGetStat(1, result => {
			let phase = getPhaseName(result);
			channel.send("✅ Game Phase is `" + phase + "` (" + result + ")");
		}, () => {
			// Couldn't get gamephase value
			channel.send("⛔ Database error. Could not find gamephase.");
		});
	}
    
    var updateID = 0;
    var allowImmediate = false;
    this.updateGameStatusDelayed = async function(guild) {
        console.log("Attempted update");
        if(allowImmediate) {
            console.log("Update allowed immediately");
            updateGameStatus(guild);
            return;
        }
        updateGameStatusDelayedAllowImmediate();
        let id = ++updateID;
        await sleep(60000);
        if(id != updateID) {
            console.log("Updated blocked");
            return;
        }
        console.log("Executing delayed update");
        updateGameStatus(guild);
    }
    
    this.updateGameStatusDelayedAllowImmediate = async function() {
        console.log("Unlocking immediate updates");
        await sleep(600000);
        console.log("Unlocked immediate updates");
        allowImmediate = true;
    }
	
	this.updateGameStatus = function(guild) {
		sql("SELECT alive FROM players WHERE type='player'", result => {
			let gameStatus = guild.channels.cache.get(stats.game_status);
			switch(+stats.gamephase) {
				case gp.NONE: gameStatus.setName("⛔ No Game"); break;
				case gp.SIGNUP: 
                    if(result.length > 0) gameStatus.setName("📰 Signups Open (" + result.length + ")"); 
                    else gameStatus.setName("📰 Signups Open");
                break;
				case gp.SETUP: gameStatus.setName("📝 Game Setup (" + result.length + ")"); break;
				case gp.INGAME: gameStatus.setName("🔁 In-Game (" + result.filter(el => el.alive).length + "/" + result.length + ")"); break;
				case gp.POSTGAME: gameStatus.setName("✅ Game Concluded"); break;
			}
		});
	}
	
}

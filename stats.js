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
            stats.guild = false;
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
			log("Stats > ❗❗❗ Unable to cache gamephase! Defaulting to `" + gp.NONE + "`")
		});
		// Get Prefix
		sqlGetStat(2,  result => { 
			stats.prefix = result; 
			if(doLog) log("Stats > Cached prefix as `" + result + "`!")
		}, () => {
            stats.prefix = "$";
			log("Stats > ❗❗❗ Unable to cache prefix! Defaulting to `$`.")
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
			log("Stats > ❗❗❗ Unable to cache game name! Defaulting to `WWR`.")
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
            idEmojis.push(["",`<:${client.emojis.cache.get(stats.yes_emoji).name}:${client.emojis.cache.get(stats.yes_emoji).id}>`]);
			if(doLog) log("Stats > Cached yes emoji as `" + result + "`!")
		}, () => {
            stats.yes_emoji = "false";
			log("Stats > ❗❗❗ Unable to cache yes emoji!")
		});
		sqlGetStat(25,  result => { 
			stats.no_emoji = result; 
            idEmojis.push(["",`<:${client.emojis.cache.get(stats.no_emoji).name}:${client.emojis.cache.get(stats.no_emoji).id}>`]);
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
			log("Stats > ❗❗❗ Unable to cache theme! Defaulting to `default`.")
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
			log("Stats > ❗❗❗ Unable to cache poll mode! Defaulting to `0`.")
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
			log("Stats > ❗❗❗ Unable to cache fancy mode! Defaulting to `false`.")
		});
		// icon version
		sqlGetStat(36,  result => { 
			stats.icon_version = result; 
			if(doLog) log("Stats > Cached icon version as `" + result + "`!")
		}, () => {
            stats.icon_version = 0;
			log("Stats > ❗❗❗ Unable to cache icon version! Defaulting to `0`.")
		});
		sqlGetStat(37,  result => { 
			stats.senior_gamemaster = result; 
			if(doLog) log("Stats > Cached senior gamemaster role id as `" + result + "`!")
		}, () => {
            stats.senior_gamemaster = false;
			log("Stats > ❗❗❗ Unable to cache senior gamemaster id!")
		});
		sqlGetStat(38,  result => { 
			stats.senior_gamemaster_ingame = result; 
			if(doLog) log("Stats > Cached senior gamemaster ingame role id as `" + result + "`!")
		}, () => {
            stats.senior_gamemaster_ingame = false;
			log("Stats > ❗❗❗ Unable to cache senior gamemaster ingame id!")
		});
		sqlGetStat(39,  result => { 
			stats.role_filter = result; 
			if(doLog) log("Stats > Cached role filter as `" + result + "`!")
		}, () => {
            stats.role_filter = 0;
			log("Stats > ❗❗❗ Unable to cache role filter! Defaulting to `0`.")
		});
		sqlGetStat(40,  result => { 
			stats.helper = result; 
			if(doLog) log("Stats > Cached helper as `" + result + "`!")
		}, () => {
            stats.helper = false;
			log("Stats > ❗❗❗ Unable to cache helper!")
		});
		sqlGetStat(41,  result => { 
			stats.helper_ingame = result; 
			if(doLog) log("Stats > Cached helper ingame as `" + result + "`!")
		}, () => {
            stats.helper_ingame = false;
			log("Stats > ❗❗❗ Unable to cache helper ingame!")
		});
		sqlGetStat(42,  result => { 
			stats.mayor_threshold = result; 
			if(doLog) log("Stats > Cached mayor threshold as `" + result + "`!")
		}, () => {
            stats.mayor_threshold = 15;
			log("Stats > ❗❗❗ Unable to cache mayor threshold! Defaulting to `15`.")
		});
		sqlGetStat(43,  result => { 
			stats.host_log = result; 
			if(doLog) log("Stats > Cached host log as `" + result + "`!")
		}, () => {
            stats.host_log = false;
			log("Stats > ❗❗❗ Unable to cache host log! Defaulting to `false`.")
		});
		sqlGetStat(44,  result => { 
			stats.automation_level = result; 
			if(doLog) log("Stats > Cached automation level as `" + result + "`!")
		}, () => {
            stats.automation_level = 0;
			log("Stats > ❗❗❗ Unable to cache automation level! Defaulting to `0` (none).")
		});
		sqlGetStat(45,  result => { 
			stats.ghost = result; 
			if(doLog) log("Stats > Cached ghost as `" + result + "`!")
		}, () => {
            stats.ghost = false;
			log("Stats > ❗❗❗ Unable to cache ghost!")
		});
		sqlGetStat(46,  result => { 
			stats.haunting = (result == "true"); 
			if(doLog) log("Stats > Cached haunting as `" + result + "`!")
		}, () => {
            stats.haunting = false;
			log("Stats > ❗❗❗ Unable to cache haunting! Defaulting to `false`.")
		});
		sqlGetStat(statID.PHASE,  result => { 
			stats.phase = result; 
			if(doLog) log("Stats > Cached phase as `" + result + "`!")
		}, () => {
            stats.phase = "d0";
			log("Stats > ❗❗❗ Unable to cache phase! Defaulting to `d0`.")
		});
		sqlGetStat(statID.SUBPHASE,  result => { 
			stats.subphase = result; 
			if(doLog) log("Stats > Cached subphase as `" + result + "`!")
		}, () => {
            stats.subphase = 0;
			log("Stats > ❗❗❗ Unable to cache subphase! Defaulting to `0`.")
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
    
    this.statID = {
        PHASE: 47,
        SUBPHASE: 48
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
				case "senior_gamemaster": stat = 37; break;
				case "senior_gamemaster_ingame": stat = 38; break;
				case "role_filter": stat = 39; break;
                case "helper": stat = 40; break;
                case "helper_ingame": stat = 41; break;
                case "mayor_threshold": stat = 42; break;
                case "host_log": stat = 43; break;
                case "automation_level": stat = 44; break;
                case "ghost": stat = 45; break;
                case "haunting": stat = 46; break;
                case "phase": stat = statID.PHASE; break;
                case "subphase": stat = statID.SUBPHASE; break;
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
				updateGameStatus();
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
    this.updateGameStatusDelayed = async function() {
        console.log("Attempted update");
        if(allowImmediate) {
            console.log("Update allowed immediately");
            updateGameStatus();
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
        updateGameStatus();
    }
    
    this.updateGameStatusDelayedAllowImmediate = async function() {
        console.log("Unlocking immediate updates");
        await sleep(600000);
        console.log("Unlocked immediate updates");
        allowImmediate = true;
    }
	
	this.updateGameStatus = function() {
		sql("SELECT alive FROM players WHERE type='player'", result => {
			let gameStatus = mainGuild.channels.cache.get(stats.game_status);
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

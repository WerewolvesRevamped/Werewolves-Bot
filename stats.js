/*
	Module for handelling things regarding stats:
		- Modifying options
		- Gamephase
		- Cacheing stats
		- Convert gamephase id to name
*/

require("./utility/sql")
require("./utility/discord")
require("./players")
require("./theme")

const config = require("./config.json")

/** If debug logging should be running */
const doLog = false

/**
 * Gets an option from the stats table
 * @param {number} id The ID of this option
 * @return The parameter or the undefined
 */
function getOption(id) {
	const name = toStatName(id)
	return new Promise((resolve) => {
		sqlGetStat(id,  result => {
			resolve(result)
			if(doLog) log(`Stats > Cached ${name} as \`${result}\`!`)
		}, () => {
			resolve(undefined)
			log(`Stats > ‼️ Unable to cache ${name}!`)
		});
	})
}

/**
 * Gets an option from the stats table with a default fallback
 * @param {number} id The ID of this option
 * @param {any} def The default if the option is not set
 * @return {Promise<unknown>} The parameter or the default fallback
 */
function getOptionDefault(id, def) {
	const name = toStatName(id)
	return new Promise((resolve) => {
		sqlGetStat(id,  result => {
			resolve(result)
			if(doLog) log(`Stats > Cached ${name} as \`${result}\`!`)
		}, () => {
			resolve(def)
			log(`Stats > ⚠️ Unable to cache ${name}, defaulting to \`${def}\``)
		});
	})
}

module.exports = function() {

	/** The stored options/stats for the bot
	 * @type {BotStats}
	 */
	this.stats = {}

	/**
	 * Converts a numeric option ID to a name
	 * @param {number} id The numeric id of the stat
	 * @return {string} The name of this stat
	 */
	this.toStatName = function(id) {
		switch (id) {
			case 1: return "Gamephase"
			case 2: return "CMD Prefix"
			case 3: return "Participant Role Id"
			case 4: return "Game Master Role Id"
			case 5: return "Spectator Role Id"
			case 6: return "Signed-Up Role Id"
			case 7: return "Dead Participant Role Id"
			case 8: return "Bot Role"
			case 9: return "CCs"
			case 10: return "Last CC Cat"
			case 11: return "Log Guild"
			case 12: return "Log Channel"
			case 13: return "Poll Count"
			case 14: return "SC Category"
			case 15: return "Public Category"
			case 16: return "Mayor Role Id"
			case 17: return "Reporter Role Id"
			case 18: return "Guardian Role Id"
			case 19: return "Game Name"
			case 20: return "Reporter Channel"
			case 21: return "GM Ingame Role"
			case 22: return "Admin Role"
			case 23: return "Admin Ingame Role"
			case 24: return "Yes Emoji ID"
			case 25: return "No Emoji ID"
			case 26: return "New Game Ping Role"
			case 27: return "Game Status VC"
			case 28: return "CC Limit"
			case 29: return "Current Theme"
			case 30: return "Mayor 2"
			case 31: return "polls"
			case 32: return "Substitute Role"
			case 33: return "Link Ping"
			case 34: return "Host Role"
			case 35: return "Fancy Mode"
			case 36: return "Icon Version"
			case 37: return "Senior GM Role"
			case 38: return "Senior GM Ingame Role"
			case 39: return "Role Filter"
			case 40: return "Helper Role"
			case 41: return "Helper Ingame Role"
			case 42: return "Mayor Threshold"
			case 43: return "Host Log"
			case 44: return "Automation Level"
			case 45: return "Ghost Role"
			case 46: return "Haunting Mode"

			case statID.PHASE: return "Phase"
			case statID.SUBPHASE: return "Subphase"
			case statID.REWARD_LOG: return "Reward Log"
			case statID.MENTOR_ROLE: return "Mentor Role"
			case statID.SIGNEDSUB_ROLE: return "Signed-Up Sub Role"
			case statID.PHASE_AUTO_INFO: return "Phase Automation Info"
			case statID.D0_TIME: return "D0 Time"
		}
	}

	/* Caches stats everytime they are changed or the bot is (re)started */
	this.getStats = function() {
		var doLog = false;
		// Get Log Channel & Guild
		getOptionDefault(11, config.guild).then(r => stats.log_guild = r)
		getOptionDefault(12, config.log).then(r => stats.log_channel = r)
		// Get Gamephase
		getOptionDefault(1, gp.NONE).then(r => {
			stats.gamephase = r
			if (r > 0) {
				getEmojis()
			}
		})
		// Get Prefix
		getOptionDefault(2, "$").then(r => stats.prefix = r)
		// Get Role Ids
		getOption(3).then(r => stats.participant = r)
		getOption(4).then(r => stats.gamemaster = r)
		getOption(5).then(r => stats.spectator = r)
		getOption(6).then(r => stats.signed_up = r)
		getOption(7).then(r => stats.dead_participant = r)
		getOption(8).then(r => stats.bot = r)
		// Cache Elected roles
		getOption(16).then(r => stats.mayor = r)
		getOption(17).then(r => stats.reporter = r)
		getOption(18).then(r => stats.guardian = r)
		//game name
		getOption(19).then(r => stats.game = r)
		// Get More Role Ids
		getOption(21).then(r => stats.gamemaster_ingame = r)
		getOption(22).then(r => stats.admin = r)
		getOption(21).then(r => stats.admin_ingame = r)
		//emojis
		getOption(24).then(r => stats.yes_emoji = r)
		getOption(25).then(r => stats.no_emoji = r)
		// Get More Role Ids
		getOption(26).then(r => stats.new_game_ping = r)
		getOption(27).then(r => stats.game_status = r)
		getOption(28).then(r => stats.cc_limit = r)
		getOption(29).then(r => {
			stats.theme = r
			if (stats.theme !== "default") {
				cacheTheme();
			}
		})
		// getOption(30).then(r => stats.mayor2 = r) //Deprecated
		// Poll mode
		getOptionDefault(31, 0).then(r => stats.poll = r)
		// Sub role
		getOption(32).then(r => stats.sub = r)
		// gif ping
		getOption(33).then(r => stats.ping = r)
		// Yet another role
		getOption(34).then(r => stats.host = r)
		// fancy mode
		getOptionDefault(35, false).then(r => {
			stats.fancy_mode = r == "true"
		})
		// icon version
		getOptionDefault(36, 0).then(r => stats.icon_version = r)
		// More roles
		getOption(37).then(r => stats.senior_gamemaster = r)
		getOption(38).then(r => stats.senior_gamemaster_ingame = r)
		getOptionDefault(39, 0).then(r => stats.role_filter = r)
		getOption(40).then(r => stats.helper = r)
		getOption(41).then(r => stats.helper_ingame = r)
		getOptionDefault(42, 15).then(r => stats.mayor_threshold = r)
		getOption(43).then(r => stats.host_log = r)
		getOption(44).then(r => stats.automation_level = r)
		getOption(45).then(r => stats.ghost = r)
		getOption(46).then(r => stats.haunting = r)
		//phase info
		getOption(statID.PHASE).then(r => stats.phase = r)
		getOption(statID.SUBPHASE).then(r => stats.subphase = r)
        // REWARD LOG
		getOptionDefault(statID.REWARD_LOG, undefined).then(r => stats.reward_log = r)
        // Mentor Role
		getOption(statID.MENTOR_ROLE).then(r => stats.mentor = r)
        // Signed-sub
		getOption(statID.SIGNEDSUB_ROLE).then(r => stats.signedsub = r)
        // Phase Automation Info
		getOption(statID.PHASE_AUTO_INFO).then(r => result => {
			let spl = result.split(";");
			if(spl.length < 3) {
				stats.phaseautoinfo = null;
				log("Stats > ❗❗❗ Unable to cache phase auto info!");
				return;
			}
			stats.phaseautoinfo = {
				all: result,
				d0: spl[0],
				night: +spl[1],
				day: +spl[2]
			};
			if(spl.length >= 4) stats.phaseautoinfo.night_late = +spl[3];
			if(spl.length >= 5) stats.phaseautoinfo.day_late = +spl[4];
			if(doLog) log("Stats > Cached phase auto info as `" + result + "`!")
		})
        // D0 Time
		getOption(statID.D0_TIME).then(r => stats.d0_time = r)
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
        SUBPHASE: 48,
        REWARD_LOG: 49,
        MENTOR_ROLE: 50,
        SIGNEDSUB_ROLE: 51,
        PHASE_AUTO_INFO: 52,
        D0_TIME: 53
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
                case "reward_log": stat = statID.REWARD_LOG; break;
                case "mentor": stat = statID.MENTOR_ROLE; break;
                case "signedsub": stat = statID.SIGNEDSUB_ROLE; break;
                case "phaseautoinfo": stat = statID.PHASE_AUTO_INFO; break;
				default: message.channel.send("⛔ Syntax error. Invalid parameter!"); return;
			}
		} else {
			stat = args[0];
		}
        
        if([3,4,5,6,7,8,21,22,23,26,32,34,37,38,40,41,45,statID.MENTOR_ROLE].includes(stat)) {
            if(!isAdmin(message.member)) {
                message.channel.send("⛔ Permission error. Only admins can change roles!"); 
                return;       
            }
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
    
    this.autoLvl = {
        NONE: 0,
        MINIMUM: 1,
        HOST: 2,
        DEFAULT: 3,
        FULL: 4
    }
	
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

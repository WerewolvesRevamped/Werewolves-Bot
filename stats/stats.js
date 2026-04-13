/*
A store of all the available stats
*/
require("./loader.js")()
require("./commands.js")()
require("./updater.js")()
require("./setup.js")()


module.exports = function() {
    /** The stored options/stats for the bot
     * @type {BotStats}
     */
    this.stats = {};
    
    /**
     * @type {BotStatData[]}
     */
    this.availableStats = [
        {id: 1, name: "Gamephase", type: "number", cmd: "null", default: 0, property: "gamephase" },
        {id: 2, name: "CMD Prefix", type: "string", cmd: "prefix", default: "$", property: "prefix", desc: "The prefix the bot uses for commands" },
        {id: 3, name: "Participant Role Id", type: "roleID", cmd: "participant", property: "participant", desc: "The id of the participant role", adminOnly: true, autoGenerate: "Participant"},
        {id: 4, name: "Game Master Role Id", type: "roleID", cmd: "gamemaster", property: "gamemaster", desc: "The id of the gamemaster role", adminOnly: true, autoGenerate: "Game Master"},
        {id: 5, name: "Spectator Role Id", type: "roleID", cmd: "spectator", property: "spectator", desc: "The id of the spectator role", adminOnly: true, autoGenerate: "Spectator"},
        {id: 6, name: "Signed-Up Role Id", type: "roleID", cmd: "signed_up", property: "signed_up", desc: "The id of the signed up role", adminOnly: true, autoGenerate: "Signed-up"},
        {id: 7, name: "Dead Participant Role Id", type: "roleID", cmd: "dead_participant", property: "dead_participant", desc: "The id of the dead participant role", adminOnly: true, autoGenerate: "Dead Participant"},
        {id: 8, name: "Bot Role", type: "roleID", cmd: "bot", property: "bot", desc: "The id of the bot role", adminOnly: true, autoGenerate: "Bot"},
        {id: 9, name: "CCs", type: "string" },
        {id: 10, name: "Last CC Cat", type: "string" },
        {id: 11, name: "Log Guild", type: "string", cmd: "log_guild", desc: "The id of the guild to use for logs" }, //Loaded manually not by automation
        {id: 12, name: "Log Channel", type: "string", cmd: "log_channel", desc: "The id of the channel to use for logs" }, //Loaded manually not by automation
        {id: 13, name: "Poll Count", type: "number", desc: "" },
        {id: 14, name: "SC Category", type: "string", desc: "" },
        {id: 15, name: "Public Category", type: "string", desc: "" },
        // {id: 16, name: "Mayor Role Id", type: "roleID", cmd: "mayor", property: "mayor" }, //DEPRECATED
        // {id: 17, name: "Reporter Role Id", type: "roleID", cmd: "reporter", property: "reporter" }, //DEPRECATED
        // {id: 18, name: "Guardian Role Id", type: "roleID", cmd: "guardian", property: "guardian" }, //DEPRECATED
        {id: 19, name: "Game Name", type: "string", cmd: "game", property: "game", desc: "The name of the game" },
        // {id: 20, name: "Reporter Channel", type: "string", desc: "" }, //DEPRECATED
        {id: 21, name: "GM Ingame Role", type: "roleID", cmd: "gamemaster_ingame", property: "gamemaster_ingame", desc: "The id of the gamemaster ingame role", adminOnly: true, autoGenerate: "GM Ingame"},
        {id: 22, name: "Admin Role", type: "roleID", cmd: "admin", property: "admin", desc: "The id of the admin role", adminOnly: true, autoGenerate: "Administrator"},
        {id: 23, name: "Admin Ingame Role", type: "roleID", cmd: "admin_ingame", property: "admin_ingame", desc: "The id of the admin ingame role", adminOnly: true, autoGenerate: "Admin Ingame"},
        {id: 24, name: "Yes Emoji ID", type: "emojiID", cmd: "yes_emoji", property: "yes_emoji", desc: "The id of the yes emoji" },
        {id: 25, name: "No Emoji ID", type: "emojiID", cmd: "no_emoji", property: "no_emoji", desc: "The id of the no emoji" },
        {id: 26, name: "New Game Ping Role", type: "roleID", cmd: "new_game_ping", property: "new_game_ping", desc: "Role that gets pinged with certain commands" , adminOnly: true, autoGenerate: "New Game Ping"},
        {id: 27, name: "Game Status VC", type: "string", cmd: "game_status", property: "game_status", desc: "A VC that shows the status of the game" },
        {id: 28, name: "CC Limit", type: "number", cmd: "cc_limit", property: "cc_limit", desc: "Maximum amount of ccs one person can create (<-10 for none)" },
        {id: 29, name: "Current Theme", type: "string", cmd: "theme", property: "theme", desc: "The current theme" },
        // {id: 30, name: "Mayor 2", cmd: "mayor2", property: "mayor2"}, //DEPRECATED
        // {id: 31, name: "Poll Mode", type: "number", cmd: "poll", default: 0, property: "poll", desc: "" }, //DEPRECATED
        {id: 32, name: "Substitute Role", type: "roleID", cmd: "sub", property: "sub", desc: "Role for substitute players", adminOnly: true, autoGenerate: "Substitute"},
        {id: 33, name: "Link Ping", type: "string", cmd: "ping", property: "ping", desc: "Ping for gifs and deleted messages" },
        {id: 34, name: "Host Role", type: "roleID", cmd: "host", property: "host", desc: "The id of the host role", adminOnly: true, autoGenerate: "Host"},
        {id: 35, name: "Fancy Mode", type: "boolean", cmd: "fancy_mode", default: false, property: "fancy_mode", desc: "Changes info messages to fancy versions if set to true" },
        {id: 36, name: "Icon Version", type: "number", cmd: "icon", default: 0, property: "icon_version", desc: "The version to use for icon images" },
        {id: 37, name: "Senior GM Role", type: "string", cmd: "senior_gamemaster", property: "senior_gamemaster", desc: "The id of the senior gm role", adminOnly: true, autoGenerate: "Senior GM"},
        {id: 38, name: "Senior GM Ingame Role", type: "string", cmd: "senior_gamemaster_ingame", property: "senior_gamemaster_ingame", desc: "The id of the senior gm ingame role", adminOnly: true, autoGenerate: "SGM Ingame"},
        {id: 39, name: "Role Filter", type: "number", cmd: "role_filter", default: 0, property: "role_filter", desc: "The role filter. See $help options role_filter" },
        {id: 40, name: "Helper Role", type: "roleID", cmd: "helper", property: "helper", desc: "The id of the helper role", adminOnly: true, autoGenerate: "Helper"},
        {id: 41, name: "Helper Ingame Role", type: "roleID", cmd: "helper_ingame", property: "helper_ingame", desc: "The id of the helper ingame role", adminOnly: true, autoGenerate: "Helper Ingame"},
        // {id: 42, name: "Mayor Threshold", type: "number", cmd: "mayor_threshold", default: 15, property: "mayor_threshold"}, //DEPRECATED
        {id: 43, name: "Host Log", type: "string", cmd: "host_log", property: "host_log", desc: "Logs host pings. Disabled if false" },
        {id: 44, name: "Automation Level", type: "number", cmd: "automation_level", property: "automation_level", desc: "Level of automation" },
        {id: 45, name: "Ghost Role", type: "roleID", cmd: "ghost", property: "ghost", desc: "Ghost role id", adminOnly: true, autoGenerate: "Ghost"},
        {id: 46, name: "Haunting Mode", type: "boolean", cmd: "haunting", property: "haunting", desc: "true/false for if haunting is enabled", default: false},
        {id: 47, name: "Phase", type: "string", cmd: "phase", property: "phase", desc: "Current phase" },
        {id: 48, name: "Subphase", type: "number", cmd: "subphase", property: "subphase", desc: "Current subphase" },
        {id: 49, name: "Reward Log", type: "string", cmd: "reward_log", default: null, property: "reward_log", desc: "Channel id for reward log" },
        {id: 50, name: "Mentor Role", type: "roleID", cmd: "mentor", property: "mentor", desc: "Role id for mentor", adminOnly: true, autoGenerate: "Mentor"},
        {id: 51, name: "Signed-Up Sub Role", type: "roleID", cmd: "signedsub", property: "signedsub", desc: "Role id for signed-sub", adminOnly: true, autoGenerate: "Signed-sub"},
        {id: 52, name: "Phase Automation Info", type: "special", cmd: "phaseautoinfo", desc: "Phase timing information for automation" },  //Loaded manually not by automation
        {id: 53, name: "D0 Time", type: "number", property: "d0_time" },
        {id: 54, name: "Ghostly Mentor Role", type: "roleID", cmd: "ghost_mentor", property: "ghost_mentor", desc: "Role id for ghost mentor", adminOnly: true, autoGenerate: "Ghostly Mentor"},
        {id: 55, name: "DB Version", type: "number", cmd: "db_version", property: "db_version", desc: "Database version", default: 0 },
        {id: 56, name: "Forced Pack", type: "number", cmd: "forced_pack", property: "forced_pack", desc: "Skinpack that everyone uses. 0 to disable", default: 0 },
        {id: 57, name: "Signed-Up Mentor Role", type: "roleID", cmd: "signedmentor", property: "signedmentor", desc: "Role id for signed-up mentor", adminOnly: true, autoGenerate: "Signed-mentor"},
        {id: 58, name: "Mentor Program Role", type: "roleID", cmd: "mentor_program", property: "mentor_program", desc: "Role id for mentor program", adminOnly: true, autoGenerate: "Mentor Program"},
        {id: 59, name: "CC Rule", type: "string", cmd: "cc_rule", property: "cc_rule", desc: "Determines the rule to use for CC incrementing. See $help options cc_rule", default: "none" },
        {id: 60, name: "Total Activity Requirement", type: "number", cmd: "total_req", property: "total_req", desc: "Required number of messages per phase.", default: 20 },
        {id: 61, name: "Public Activity Requirement", type: "number", cmd: "public_req", property: "public_req", desc: "Required number of public messages per day.", default: 15 },
    ]

    /**
     * Get an option for the bot via its numerical ID
     * @param {number} id The id of the stat
     * @return {BotStatData | undefined}
     */
    this.getStatFromId = function (id) {
        return this.availableStats.find(s => s.id === id)
    }

    /**
     * Returns either the bot stat for this cmd arg or undefined
     * @param {string} arg The Argument provided to the command
     * @return {BotStatData | undefined}
     */
    this.getStatFromCmd = function (arg) {
        return this.availableStats.find(s => s.cmd === arg)
    }

    /**
     * Cases a value to its correct stat value
     * @param {BotOptionType} type The type this value should be
     * @param {any} value The original value
     * @returns {number | string | boolean} The correct type
     */
    this.toStatType = function(type, value) {
        switch (type) {
            case "string":
                return `${value}`;
            case "number":
                return +value;
            case "roleID":
            case "emojiID":
                return value;
            case "special":
                return undefined; //don't know what to do here so return undefined
            case "boolean":
                return `${value}` === 'true';
        }
        return value
    }

    /**
     * @enum {number}
     */
    this.statID = {
        CC_LIMIT: 28,
        
        PHASE: 47,
        SUBPHASE: 48,
        REWARD_LOG: 49,
        MENTOR_ROLE: 50,
        SIGNEDSUB_ROLE: 51,
        PHASE_AUTO_INFO: 52,
        D0_TIME: 53,
        GHOST_MENTOR: 54,
        DB_VERSION: 55,
        FORCED_PACK: 56,
        SIGNEDUP_MENTOR: 57,
        MENTOR_PROGRAM: 58,
        CC_RULE: 59,
        TOTAL_REQ: 60,
        PUBLIC_REQ: 61,
    }

    /** Gets the name of a gamephase by id */
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

    /** @enum {number} */
    this.gp = {
        NONE: 0,
        SIGNUP: 1,
        SETUP: 2,
        INGAME: 3,
        POSTGAME: 4,
        ARCHIVED: 5,

        MIN: 0,
        MAX: 5
    };

    /** @enum {number} */
    this.autoLvl = {
        NONE: 0,
        MINIMUM: 1,
        HOST: 2,
        DEFAULT: 3,
        FULL: 4
    }
}

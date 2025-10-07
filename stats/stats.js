/*
A store of all the available stats

*/

module.exports = function() {
    /**
     * @type {BotStatData[]}
     */
    this.availableStats = [
        {id: 1, name: "Gamephase", type: "number", cmd: "null", default: 0, property: "gamephase"},
        {id: 2, name: "CMD Prefix", type: "string", cmd: "prefix", default: "$", property: "prefix"},
        {id: 3, name: "Participant Role Id", type: "roleID", cmd: "participant", property: "participant", adminOnly: true},
        {id: 4, name: "Game Master Role Id", type: "roleID", cmd: "gamemaster", property: "gamemaster", adminOnly: true},
        {id: 5, name: "Spectator Role Id", type: "roleID", cmd: "spectator", property: "spectator", adminOnly: true},
        {id: 6, name: "Signed-Up Role Id", type: "roleID", cmd: "signed_up", property: "signed_up", adminOnly: true},
        {id: 7, name: "Dead Participant Role Id", type: "roleID", cmd: "dead_participant", property: "dead_participant", adminOnly: true},
        {id: 8, name: "Bot Role", type: "roleID", cmd: "bot", property: "bot", adminOnly: true},
        {id: 9, name: "CCs", type: "string"},
        {id: 10, name: "Last CC Cat", type: "string"},
        {id: 11, name: "Log Guild", type: "string", cmd: "log_guild"}, //Loaded manually not by automation
        {id: 12, name: "Log Channel", type: "string", cmd: "log_channel"}, //Loaded manually not by automation
        {id: 13, name: "Poll Count", type: "number"},
        {id: 14, name: "SC Category", type: "string"},
        {id: 15, name: "Public Category", type: "string"},
        {id: 16, name: "Mayor Role Id", type: "roleID", cmd: "mayor", property: "mayor"},
        {id: 17, name: "Reporter Role Id", type: "roleID", cmd: "reporter", property: "reporter"},
        {id: 18, name: "Guardian Role Id", type: "roleID", cmd: "guardian", property: "guardian"},
        {id: 19, name: "Game Name", type: "string", cmd: "game", property: "game"},
        {id: 20, name: "Reporter Channel", type: "string"},
        {id: 21, name: "GM Ingame Role", type: "roleID", cmd: "gamemaster_ingame", property: "gamemaster_ingame", adminOnly: true},
        {id: 22, name: "Admin Role", type: "roleID", cmd: "admin", property: "admin", adminOnly: true},
        {id: 23, name: "Admin Ingame Role", type: "roleID", cmd: "admin_ingame", property: "admin_ingame", adminOnly: true},
        {id: 24, name: "Yes Emoji ID", type: "emojiID", cmd: "yes_emoji", property: "yes_emoji"},
        {id: 25, name: "No Emoji ID", type: "emojiID", cmd: "no_emoji", property: "no_emoji"},
        {id: 26, name: "New Game Ping Role", type: "roleID", cmd: "new_game_ping", property: "new_game_ping", adminOnly: true},
        {id: 27, name: "Game Status VC", type: "string", cmd: "game_status", property: "game_status"},
        {id: 28, name: "CC Limit", type: "number", cmd: "cc_limit", property: "cc_limit"},
        {id: 29, name: "Current Theme", type: "string", cmd: "theme", property: "theme"},
        // {id: 30, name: "Mayor 2", cmd: "mayor2", property: "mayor2"}, //DEPRECATED
        {id: 31, name: "Poll Mode", type: "number", cmd: "poll", default: 0, property: "poll"},
        {id: 32, name: "Substitute Role", type: "roleID", cmd: "sub", property: "sub", adminOnly: true},
        {id: 33, name: "Link Ping", type: "string", cmd: "ping", property: "ping"},
        {id: 34, name: "Host Role", type: "roleID", cmd: "host", property: "host", adminOnly: true},
        {id: 35, name: "Fancy Mode", type: "boolean", cmd: "fancy_mode", default: false, property: "fancy_mode"},
        {id: 36, name: "Icon Version", type: "number", cmd: "icon", default: 0, property: "icon_version"},
        {id: 37, name: "Senior GM Role", type: "string", cmd: "senior_gamemaster", property: "senior_gamemaster", adminOnly: true},
        {id: 38, name: "Senior GM Ingame Role", type: "string", cmd: "senior_gamemaster_ingame", property: "senior_gamemaster_ingame", adminOnly: true},
        {id: 39, name: "Role Filter", type: "number", cmd: "role_filter", default: 0, property: "role_filter"},
        {id: 40, name: "Helper Role", type: "roleID", cmd: "helper", property: "helper", adminOnly: true},
        {id: 41, name: "Helper Ingame Role", type: "roleID", cmd: "helper_ingame", property: "helper_ingame", adminOnly: true},
        // {id: 42, name: "Mayor Threshold", type: "number", cmd: "mayor_threshold", default: 15, property: "mayor_threshold"}, //DEPRECATED
        {id: 43, name: "Host Log", type: "string", cmd: "host_log", property: "host_log"},
        {id: 44, name: "Automation Level", type: "number", cmd: "automation_level", property: "automation_level"},
        {id: 45, name: "Ghost Role", type: "roleID", cmd: "ghost", property: "ghost", adminOnly: true},
        {id: 46, name: "Haunting Mode", type: "boolean", cmd: "haunting", property: "haunting", default: false},
        {id: 47, name: "Phase", type: "string", cmd: "phase", property: "phase"},
        {id: 48, name: "Subphase", type: "number", cmd: "subphase", property: "subphase"},
        {id: 49, name: "Reward Log", type: "string", cmd: "reward_log", default: null, property: "reward_log"},
        {id: 50, name: "Mentor Role", type: "roleID", cmd: "mentor", property: "mentor", adminOnly: true},
        {id: 51, name: "Signed-Up Sub Role", type: "roleID", cmd: "signedsub", property: "signedsub", adminOnly: true},
        {id: 52, name: "Phase Automation Info", type: "special", cmd: "phaseautoinfo"},  //Loaded manually not by automation
        {id: 53, name: "D0 Time", type: "number", property: "d0_time"},
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
        PHASE: 47,
        SUBPHASE: 48,
        REWARD_LOG: 49,
        MENTOR_ROLE: 50,
        SIGNEDSUB_ROLE: 51,
        PHASE_AUTO_INFO: 52,
        D0_TIME: 53
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

        MIN: 0,
        MAX: 4
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

/*
	Module for using sql / interacting with the database
		- Simplified sql access w/ automatic error logging
		- Simplified access to stats
*/
module.exports = function() {
	/* Variables */
	this.connection = null;
	this.mysql = require("mysql");

	
	/**
    SQL Setup
    Creates the connection to the database and then loads all the stats afterwards
    */
	this.sqlSetup = async function() {
		return new Promise((resolve) => {
			// Create connection
			connection = mysql.createConnection({
				host     :  config.db.host,
				user     : config.db.user,
				password : config.db.password,
				database : config.db.database,
				charset: "utf8mb4",
				supportBigNumbers : true
			});
			// Connection connection
			connection.connect(async (err) => {
				if(err) logO(err);
				else {
                    createTables();
                    await sleep(1000); // wip: this is kinda nonsense but createTables seems to run all its creations async so its annoying to properly wait for ? can we add all queries into a single sqlQuery? should we store the promises into an array and do like Promise.all or whatever?
					await loadStats();
                    updateTables();
				}
				resolve();
			});
		})
	}

	function createTables() {
		sqlQuery("CREATE TABLE IF NOT EXISTS `action_data` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `src_ref` text NOT NULL, `ability_id` text NOT NULL, `quantity` int(11) NOT NULL, `last_phase` int(11) NOT NULL, `last_target` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `action_queue` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `message_id` text NOT NULL, `channel_id` text NOT NULL, `src_ref` text NOT NULL, `src_name` text NOT NULL, `abilities` text NOT NULL, `orig_ability` text NOT NULL, `prompt_type` text NOT NULL, `type1` text NOT NULL, `type2` text NOT NULL, `execute_time` int(11) NOT NULL, `restrictions` text NOT NULL, `target` text NOT NULL, `additional_trigger_data` text NOT NULL, `forced` tinyint(1) NOT NULL DEFAULT 0, `trigger_name` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `active_attributes` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `owner` text NOT NULL, `owner_type` text NOT NULL, `src_name` text NOT NULL, `src_ref` text NOT NULL, `attr_type` text NOT NULL, `duration` text NOT NULL, `val1` text NOT NULL, `val2` text NOT NULL, `val3` text NOT NULL, `val4` text NOT NULL, `applied_phase` int(11) NOT NULL, `used` int(11) NOT NULL DEFAULT 0, `target` text DEFAULT NULL, `counter` int(11) NOT NULL DEFAULT 0, `alive` int(11) NOT NULL DEFAULT 1, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `action_data` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `src_ref` text NOT NULL, `ability_id` text NOT NULL, `quantity` int(11) NOT NULL, `last_phase` int(11) NOT NULL, `last_target` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `action_queue` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `message_id` text NOT NULL, `channel_id` text NOT NULL, `src_ref` text NOT NULL, `src_name` text NOT NULL, `abilities` text NOT NULL, `orig_ability` text NOT NULL, `prompt_type` text NOT NULL, `type1` text NOT NULL, `type2` text NOT NULL, `execute_time` int(11) NOT NULL, `restrictions` text NOT NULL, `target` text NOT NULL, `additional_trigger_data` text NOT NULL, `forced` tinyint(1) NOT NULL DEFAULT 0, `trigger_name` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `active_attributes` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `owner` text NOT NULL, `owner_type` text NOT NULL, `src_name` text NOT NULL, `src_ref` text NOT NULL, `attr_type` text NOT NULL, `duration` text NOT NULL, `val1` text NOT NULL, `val2` text NOT NULL, `val3` text NOT NULL, `val4` text NOT NULL, `applied_phase` int(11) NOT NULL, `used` int(11) NOT NULL DEFAULT 0, `target` text DEFAULT NULL, `counter` int(11) NOT NULL DEFAULT 0, `alive` int(11) NOT NULL DEFAULT 1, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `active_boosters` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `multiplier` int(11) NOT NULL, `end_time` text NOT NULL, `creator` text NOT NULL, `type` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `active_displays` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `src_ref` text NOT NULL, `val1` text NOT NULL, `val2` text NOT NULL, `val3` text NOT NULL, `val4` text NOT NULL, `message_id` text NOT NULL, `channel_id` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `active_groups` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `channel_id` text NOT NULL, `target` text DEFAULT NULL, `counter` int(11) NOT NULL DEFAULT 0, `disbanded` int(11) NOT NULL DEFAULT 0, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `active_polls` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `type` text NOT NULL, `name` text NOT NULL, `channel` text NOT NULL, `initial_message` text NOT NULL, `messages` text NOT NULL, `src_ref` text NOT NULL, `src_name` text NOT NULL, UNIQUE KEY `ai_id` (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `activity` ( `player` bigint(64) NOT NULL, `count` int(11) NOT NULL, `timestamp` int(11) NOT NULL, `level` int(11) NOT NULL DEFAULT 0, PRIMARY KEY (`player`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `attributes` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `desc_basics` text NOT NULL, `desc_formalized` text NOT NULL, `parsed` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `cc_cats` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `id` text NOT NULL, UNIQUE KEY `ai_id` (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `choices` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `options` text NOT NULL, `src_ref` text NOT NULL, `src_name` text NOT NULL, `owner` text NOT NULL, `ability` text DEFAULT NULL, `prompt` text DEFAULT NULL, `choice_msg` text DEFAULT NULL, `choice_channel` text DEFAULT NULL, `forced` text DEFAULT NULL, `chosen` int(11) NOT NULL DEFAULT 0, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `coins` ( `player` bigint(64) NOT NULL, `coins` int(11) NOT NULL, PRIMARY KEY (`player`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `confirm_msg` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `id` text NOT NULL, `time` text NOT NULL, `action` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `connected_channels` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `channel_id` text NOT NULL, `id` text NOT NULL, `name` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `death_message` ( `player` bigint(64) NOT NULL, `message` int(11) NOT NULL, PRIMARY KEY (`player`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `discord_roles` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `id` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `displays` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `contents` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `groups` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `team` text NOT NULL, `desc_basics` text NOT NULL, `desc_members` text NOT NULL, `desc_formalized` text NOT NULL, `parsed` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `host_information` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `id` text NOT NULL, `name` text NOT NULL, `value` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `info` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `contents` text NOT NULL, `simplified` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `inventory` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `player` text NOT NULL, `item` text NOT NULL, `count` int(11) NOT NULL, `stashed` int(11) NOT NULL DEFAULT 0, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `killq` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `id` text NOT NULL, `src_ref` text DEFAULT NULL, `src_name` text DEFAULT NULL, `type` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `locations` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `description` text NOT NULL, `sort_index` int(11) NOT NULL, `haunting` int(11) NOT NULL DEFAULT 0, `members` text NOT NULL, `viewers` text NOT NULL, `channel_id` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `market` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `item` text NOT NULL, `price` int(11) NOT NULL, `owner` text NOT NULL, `timestamp` int(11) NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `packs` ( `player` bigint(64) NOT NULL, `pack` int(11) NOT NULL, PRIMARY KEY (`player`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `players` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `id` text NOT NULL, `emoji` text NOT NULL, `type` text NOT NULL, `role` text NOT NULL, `orig_role` text NOT NULL, `alignment` text NOT NULL, `alive` tinyint(1) NOT NULL DEFAULT 1, `ccs` int(11) NOT NULL DEFAULT 0, `public_msgs` int(11) NOT NULL DEFAULT 0, `private_msgs` int(11) NOT NULL DEFAULT 0, `target` text DEFAULT NULL, `counter` int(11) NOT NULL DEFAULT 0, `final_result` int(11) NOT NULL DEFAULT 0, `mentor` text DEFAULT NULL, `death_phase` int(11) NOT NULL DEFAULT -1, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `polls` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `options` text NOT NULL, `random` text NOT NULL, `voters` text NOT NULL, `show_voters` int(11) NOT NULL, `hammer` int(11) NOT NULL, `desc_formalized` text NOT NULL, `parsed` text DEFAULT NULL, `target` text DEFAULT NULL, `counter` int(11) NOT NULL DEFAULT 0, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `prompts` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `message_id` text NOT NULL, `channel_id` text NOT NULL, `src_ref` text NOT NULL, `src_name` text NOT NULL, `abilities` text NOT NULL, `prompt_type` text NOT NULL, `type1` text NOT NULL, `type2` text NOT NULL, `restrictions` text NOT NULL, `additional_trigger_data` text NOT NULL, `amount` int(11) NOT NULL, `forced` tinyint(1) NOT NULL DEFAULT 0, `trigger_name` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `roles` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `class` text NOT NULL, `category` text NOT NULL, `team` text NOT NULL, `type` text NOT NULL, `desc_basics` text NOT NULL, `desc_details` text NOT NULL, `desc_simplified` text NOT NULL, `desc_formalized` text NOT NULL, `desc_card` text NOT NULL, `parsed` text DEFAULT NULL, `attributes` text DEFAULT NULL, `identity` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `roles_alias` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `alias` text NOT NULL, `name` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `sc` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `type` text NOT NULL, `name` text NOT NULL, `cond` text NOT NULL, `members` text NOT NULL, `setup` text NOT NULL, UNIQUE KEY `ai_id` (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `schedule` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `type` text NOT NULL, `value` text NOT NULL, `timestamp` int(11) NOT NULL, `recurrence` int(11) NOT NULL DEFAULT 0, `name` text DEFAULT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `sc_cats` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `id` text NOT NULL, UNIQUE KEY `ai_id` (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `sets` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `contents` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `stats` ( `id` int(11) NOT NULL, `value` text NOT NULL, `name` text NOT NULL, UNIQUE KEY `id` (`id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `storytime` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `message` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `teams` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `name` text NOT NULL, `display_name` text NOT NULL, `win_condition` text NOT NULL, `desc_basics` text NOT NULL, `desc_formalized` text NOT NULL, `parsed` text DEFAULT NULL, `target` text DEFAULT NULL, `counter` int(11) NOT NULL DEFAULT 0, `active` int(11) NOT NULL DEFAULT 0, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `theme` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `theme` text NOT NULL, `original` text NOT NULL, `new` text NOT NULL, PRIMARY KEY (`ai_id`))")
		sqlQuery("CREATE TABLE IF NOT EXISTS `curses` ( `ai_id` int(11) NOT NULL AUTO_INCREMENT, `owner` text NOT NULL, `type` text NOT NULL, `target` text NOT NULL, `data` text NOT NULL, `time` text NOT NULL, PRIMARY KEY (`ai_id`))")
	}

	/**
    SQL Query
    Does a sql query and calls one callback with result on success and logs an error and calls another callback on failure
    Basically a wrapper for sqlQuery with mode=0
    **/
	this.sql = function(q, rC, eC) {
		sqlQuery(q, rC, eC, 0)
	}
	
	/**
	 * SQL Value
	 * Does a sql query and calls one callback with result[0].value on success and logs an error and calls another callback on failure
	 * Basically a wrapper for sqlQuery with mode=1
	 * @param {string} q The query
	 * @param {(string) => void} rC Results callback
	 * @param {() => void} eC The error callback
	 */
	this.sqlValue = function(q, rC, eC) {
		sqlQuery(q, rC, eC, 1)
	}
	
	/**
	 * SQL Set Stats
	 * Sets a stat in the stat database by numeric id
	 * @param {BotStatData | number} stat The stat to set of its id
	 * @param {string} value The
	 * @param resCallback
	 * @param errCallback
	 */
	this.sqlSetStat = function(stat, value, resCallback = ()=>{}, errCallback = ()=>{}) {
		const valueEsc = connection.escape(value);
		/** @type BotStatData */
		const trueStat= stat.id ? stat : getStatFromId(stat)
		if (!trueStat) throw new Error(`Unable to find a stat with from ID ${stat}`)
		const name = connection.escape(trueStat.name ? trueStat.name : "")
		sql(`INSERT INTO stats (id, value, name) VALUE (${trueStat.id},${valueEsc},${name}) ON DUPLICATE KEY UPDATE value=${valueEsc}`, resCallback, errCallback);
	}

	/**
	 * SQL Get Stat
	 * Gets a stat from the stat database by numeric id
	 * @param {number} id
	 * @param {(string) => void} resCallback
	 * @param {() => void} errCallback
	 */
	this.sqlGetStat = function(id, resCallback, errCallback) {
		sqlValue("SELECT value,name FROM stats WHERE id = " + connection.escape(id), resCallback, errCallback);
	}
	
	/**
	 * SQL Query (Internal)
	 * Does SQL Queries. Should only be called internally from other sql functions
	 * The universal sql query function. Takes a query and two callbacks, and optionally a mode value.
	 * Modes:
	 * 0: Default query, resolves the promise with the query's result
	 * 1: Either resolves with result[0].value if result[0] is set or runs the error callback
	 * @param {string} query The query
	 * @param {(string) => void} resCallback
	 * @param {() => void} errCallback
	 * @param {0 | 1} mode
	 */
	this.sqlQuery = function(query, resCallback = ()=>{}, errCallback = ()=>{}, mode = 0) {
		// Do query
		connection.query(query, function(err, result, fields) {
			// Check success
			if(!err && result) { 
				// Check which mode and return result accordingly
				switch(mode) {
					case 0: resCallback(result); break;
					case 1: result[0] ? resCallback(result[0].value) : errCallback(); break;
					default: resCallback(result); break;
				}
			} else { 
				// Handle error
				logO(err);
				errCallback();
			}
		});
	}
    
    /**
    SQL Promise
    Does a sql query as a promise
    **/
    this.sqlProm = function(query) {
        return new Promise(res => {
              sql(query, result => {
                  res(result);
              });
        });
    }
    
    this.sqlPromOne = function(query) {
        return new Promise(res => {
              sql(query, result => {
                  res(result[0] ?? null);
              });
        });
    }
    
    /**
    SQL Promise (Escaped)
    Does a sql query as a promise and appends an escaped value which was parsed unescaped as a second parameter
    **/
    this.sqlPromEsc = function(query, val) {
        return sqlProm(query + connection.escape(val));
    }
    
    this.sqlPromOneEsc = function(query, val) {
        return sqlPromOne(query + connection.escape(val));
    }
	
}

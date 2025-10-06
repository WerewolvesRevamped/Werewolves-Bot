/* A file purely used for defining types for use with JS Doc */

/**
 * A raw bot option/ stat
 * @typedef {Object} BotStatData
 * @property {number} id The numerical ID of this stat
 * @property {string} name The fancy name of this option
 * @property {string} [cmd] The command option for this option. If null it cant be edited by commands
 * @property {any} [default] A Default value of this property
 * @property {string} [property] The property of this stat on BotStats
 * @property {boolean} [adminOnly=false] If this stat can only be edited by admins. Defaults to false
 * @see BotStats
 */

/**
 * @typedef {0 | 1 | 2 | 3 | 4} AutomationLvl
 */

/** Information used to defined automated phase changes
 * @typedef {Object} PhaseAutoInfo
 * @property {string} all
 * @property {string} d0
 * @property {number} night
 * @property {number} day
 * @property {number} night_late
 * @property {number} day_late
 */

/**
 * @typedef {Object} BotStats
 * @property {string} log_guild The Guild in which logs are contained
 * @property {string} log_channel The channel for logging into
 * @property {number} gamephase The current game phase
 * @property {string} prefix The bot's command prefix
 * @property {string} participant The ID for the @Participant Role
 * @property {string} gamemaster
 * @property {string} spectator
 * @property {string} signed_up
 * @property {string} dead_participant
 * @property {string} bot
 * @property {string} mayor
 * @property {string} reporter
 * @property {string} guardian
 * @property {string} game The Name of the current game
 * @property {string} gamemaster_ingame
 * @property {string} admin
 * @property {string} admin_ingame
 * @property {string} yes_emoji
 * @property {string} no_emoji
 * @property {string} new_game_ping
 * @property {string} game_status The ID of the vc used for game status
 * @property {number} cc_limit
 * @property {string} theme
 * @property {string} mayor2
 * @property {number} poll
 * @property {string} sub
 * @property {string} ping
 * @property {string} host
 * @property {string} fancy_mode
 * @property {number} icon_version
 * @property {string} senior_gamemaster
 * @property {string} senior_gamemaster_ingame
 * @property {number} role_filter
 * @property {string} helper
 * @property {string} helper_ingame
 * @property {number} mayor_threshold DEPRECATED
 * @property {string} host_log
 * @property {AutomationLvl} automation_level
 * @property {string} ghost
 * @property {boolean} haunting
 * @property {string} phase
 * @property {string} subphase
 * @property {string} reward_log
 * @property {string} mentor
 * @property {string} signedsub
 * @property {PhaseAutoInfo | null} phaseautoinfo
 * @property {number} d0_time
 */

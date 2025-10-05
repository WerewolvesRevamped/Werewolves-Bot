/*
	Module for handelling things regarding stats:
		- Modifying options
		- Gamephase
		- Cacheing stats
		- Convert gamephase id to name
*/
require("./stats/stats.js")()
require("./stats/loader.js")()

module.exports = function () {
    /** The stored options/stats for the bot
     * @type {BotStats}
     */
    this.stats = {}

    this.getStats = function () {
        loadStats()
    }
}

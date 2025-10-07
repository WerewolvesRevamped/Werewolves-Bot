/*
Handle loading of stats from the database
 */
/**
 * Gets an option from the stats table
 * @param {number} id The ID of this option
 * @return The parameter or the undefined
 */
function getOption(id) {
    const stat = getStatFromId(id)
    return getStat(stat.id,stat.name,stat.default)
}

/** If debug logging should be running */
const doLog = false;

/**
 * Load a given stat
 * @param {number} id The ID of the stat
 * @param {string} name The Name of the stat
 * @param {any} [def] A default value if any
 * @returns {Promise<unknown>} The parameter or undefined
 */
function getStat(id, name, def) {
    return new Promise((resolve) => {
        sqlGetStat(id,  result => {
            resolve(result)
            if(doLog) log(`Stats > Cached ${name} as \`${result}\`!`)
        }, () => {
            if (def || def === null) {
                resolve(def)
                log(`Stats > ⚠️ Unable to cache ${name}, defaulting to \`${def}\``)
            } else {
                resolve(undefined)
                log(`Stats > ‼️ Unable to cache ${name}!`)
            }
        });
    })
}

module.exports = function() {
    this.loadStats = function() {
        //Complex loaded stats
        // Get Log Channel & Guild - Done due to execution order
        getOption(11).then(r => r ? stats.log_guild = r : stats.log_guild = config.guild);
        getOption(12).then(r => r ? stats.log_channel = r : stats.log_channel = config.log);

        // fancy mode
        getOption(35).then(r => {
            stats.fancy_mode = r == "true"
        });

        // Phase Automation Info
        getOption(statID.PHASE_AUTO_INFO).then(result => {
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
        });

        //simple stats
        availableStats.filter(s => s.property).forEach(s => {
            getStat(s.id, s.name, s.default).then(r => stats[s.property] = r);
        });

        //later caching
        if (stats.gamephase > 0) {
            getEmojis();
        }
        if (stats.theme !== "default") {
            cacheTheme();
        }
    }
}
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
            if(doLog) log(`Stats > Cached ${name} as \`${result}\`!`)
            resolve(result)
        }, () => {
            if (def !== undefined) {
                log(`Stats > ⚠️ Unable to cache ${name}, defaulting to \`${def}\``)
                resolve(def)
            } else {
                log(`Stats > ‼️ Unable to cache ${name}!`)
                resolve(undefined)
            }
        });
    })
}

module.exports = function() {
    this.loadStats = async function () {
        //Complex loaded stats
        // Get Log Channel & Guild - Done due to execution order
        await getOption(11).then(r => r ? stats.log_guild = r : stats.log_guild = config.guild);
        await getOption(12).then(r => r ? stats.log_channel = r : stats.log_channel = config.log);

        // Phase Automation Info
        getOption(statID.PHASE_AUTO_INFO).then(result => {
            let spl = result.split(";");
            if (spl.length < 3) {
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
            if (spl.length >= 4) stats.phaseautoinfo.night_late = +spl[3];
            if (spl.length >= 5) stats.phaseautoinfo.day_late = +spl[4];
            if (doLog) log("Stats > Cached phase auto info as `" + result + "`!")
        });

        //simple stats
        /** @type BotStatData[] */
        const loadStats = availableStats.filter(s => s.property && s.type !== "special")
        for (const s of loadStats) {
            const value = await getStat(s.id, s.name, s.default)
            stats[s.property] = toStatType(s.type, value)
        }

        //emoji handling
        if (stats.yes_emoji) {
            idEmojis.push(["", `<:${client.emojis.cache.get(stats.yes_emoji).name}:${client.emojis.cache.get(stats.yes_emoji).id}>`]);
        }
        if (stats.no_emoji) {
            idEmojis.push(["", `<:${client.emojis.cache.get(stats.no_emoji).name}:${client.emojis.cache.get(stats.no_emoji).id}>`]);
        }

        //later caching
        if (stats.gamephase > 0) {
            getEmojis();
        }
        if (stats.theme !== "default") {
            cacheTheme();
        }
    }
}
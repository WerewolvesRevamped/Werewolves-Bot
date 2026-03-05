/**
 * Sets a stat in the database
 * @param channel The channel the command was sent in
 * @param {any} value The value to set the option too
 * @param {BotStatData} stat The stat to update
 */
function cmdOptionsSet (channel, value, stat) {
    // Set value
    if(value.match(/^(\d+\+?)+$/)) value = value.split("+").filter(el => el).reduce((a,b) => (+a)+(+b), 0)
    sqlSetStat(stat, value, result => {
        channel.send("✅ Successfully updated *" + stat.name + "* ("+stat.id+") to `" + value + "`!");
        loadStats();
    }, () => {
        // Db error
        channel.send("⛔ Database error. Could not update `" + stat.name + "`!");
    });
}

/**
 * Gets a stat from the database
 * @param channel The channel the command was sent in
 * @param {BotStatData} stat The stat to fetch
 */
function cmdOptionsGet (channel, stat) {
    // Get value
    sqlGetStat(stat.id, result => {
        if(result.length > 0) {
            // Print value
            channel.send("✅ *" + stat.name + "* currently is set to `" + result + "`!");
            loadStats();
        } else {
            // Value unset
            channel.send(`⛔ Database error. Could not get *${stat.name}* (${stat.id})!`);
        }
    }, () => {
        // Db error
        channel.send("⛔ Database error. Could not access stats!");
    });
}

module.exports = function () {

    /* Handles option command */
    this.cmdOptions = function(message, args) {
        // Check subcommand
        if(!args[0]) {
            message.channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        /** @type BotStatData */
        let stat;
        //Convert stat
        if(isNaN(args[0])) {
            stat = getStatFromCmd(args[0]);
        } else {
            stat = getStatFromId(args[0]);
        }
        if (!stat) {
            message.channel.send("⛔ Syntax error. Invalid parameter!")
            return
        }

        if(stat.adminOnly) {
            if(!isAdmin(message.member)) {
                message.channel.send("⛔ Permission error. Only admins can change roles!");
                return;
            }
        }

        // Find subcommand
        if(args[1]) cmdOptionsSet(message.channel, args[1], stat);
        else cmdOptionsGet(message.channel, stat);
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
                loadStats();
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
                case gp.INGAME: gameStatus.setName("🔁 In-Game (" + result.filter(el => el.alive==1).length + "/" + result.length + ")"); break;
                case gp.POSTGAME: gameStatus.setName("✅ Game Concluded"); break;
                case gp.ARCHIVED: gameStatus.setName("✅ Game Archived"); break;
            }
        });
    }

}

/**
	Curses
*/
module.exports = function() {
    
    this.createCurse = function(ownerId, type, target, data, durationMinutes) {
        return sqlProm("INSERT INTO curses (owner, type, target, data, time) VALUES (" + connection.escape(ownerId) + "," + connection.escape(type) + "," + connection.escape(target) + "," + connection.escape(data) + "," + connection.escape(getTime() + 60 * durationMinutes) + ")");
    }
    
    this.createPackCurse = async function(casterId, targetId, packId, durationMinutes) {
        // get current pack
        let curPack = await sqlPromOneEsc("SELECT pack FROM packs WHERE player=",  targetId);
        // update pack
        await sqlPromEsc("INSERT INTO packs (player, pack) VALUES (" + connection.escape(targetId) + "," + connection.escape(packId) + ") ON DUPLICATE KEY UPDATE pack=", packId);
        // create curse
        await createCurse(casterId, "pack", targetId, curPack?.pack ?? 0, durationMinutes);
        curseLog(`<@${casterId}> cast a **PACK** (${packId}) curse on <@${targetId}>`);
        cachePacks();
    }
    
    /**
    Processes curses and revokes outdated ones
    **/
    this.processCurses = async function() {
        let cursesToRemove = await sqlPromEsc("SELECT * FROM curses WHERE time<=", getTime());
        await sqlPromEsc("DELETE FROM curses WHERE time<=", getTime());
        for(let i = 0; i < cursesToRemove.length; i++) {
            let curCurse = cursesToRemove[i];
            switch(curCurse.type) {
                case "pack":
                    await sqlPromEsc("INSERT INTO packs (player, pack) VALUES (" + connection.escape(curCurse.target) + "," + connection.escape(curCurse.data) + ") ON DUPLICATE KEY UPDATE pack=", curCurse.data);
                    curseLog(`**PACK** curse on <@${curCurse.target}> has expired.`);
                    cachePacks();
                break;
            }
        }
    }
    
    this.curseLog = function(log) {
        let ch = mainGuild.channels.cache.get(config.curse_log);
        if(ch) ch.send(log);
    }
    
    /**
    Curse Processor Creator
    regularly processes curses
    **/
    this.isRunningCurseProcessor = false;
    this.createCurseProcessor = function() {
        setInterval(async () => {
            if(isRunningCurseProcessor) return;
            isRunningCurseProcessor = true;
            await processCurses();
            isRunningCurseProcessor = false;
        }, 15 * 1000)
    }
    
    
    
}
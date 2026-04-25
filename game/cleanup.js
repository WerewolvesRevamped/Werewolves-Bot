/**
	Game Module - Cleanup
	Handles game reset/cleanup
*/
module.exports = function() {

	/**
    SC Cleanup
    Deletes all the SC categories
    */
	this.scCleanup = async function(channel) {
        // Iterate through the SC categories and delete them all
		for(let i = 0; i < cachedSCs.length; i++) {
			cleanupCat(channel, cachedSCs[i], "SC #" + (i+1));
		}
        // Reset SC Cat Database
        await sqlProm("DELETE FROM sc_cats");
        channel.send("✅ Successfully reset sc cat list!");
        getCCCats();
	}
    
    /**
    Command: $archived
    Marks a game as archived
    **/
	this.cmdArchived = async function(channel) {
		if(stats.gamephase != gp.POSTGAME && stats.gamephase != gp.NONE) {
            channel.send("⛔ Command error. Can only mark game as archived while in postgame state!");
            return;
        }
        // update gamephase
        await sqlProm("UPDATE stats SET value=" + connection.escape(gp.ARCHIVED) + " WHERE id=1");
        stats.gamephase = gp.ARCHIVED;
        // update gp channel
        updateGameStatus();
        channel.send("✅ Game has been archived.");
	}
    
    /**
    Command: $reset
    Resets the game, deleting all channels and removing all roles
    **/
    this.cmdReset = async function(channel, debug, restart = false) {
        if(stats.gamephase != gp.ARCHIVED && stats.gamephase != gp.NONE && !debug) {
            channel.send("⛔ Command error. Can only reset game while in archived state!");
            return;
        }
        // Set Gamephase
        cmdGamephaseSet(channel, ["set", gp.NONE]);
        // Reset Connection
        if(!debug) cmdConnectionReset(channel);
        // Reset Player Database
        if(!debug) {
            let result = await sqlProm("DELETE FROM players");
            channel.send("✅ Successfully reset player list!");
            getEmojis();
        } else {
            sql("UPDATE players SET alive=1,ccs=0,public_msgs=0,private_msgs=0,target=NULL,counter=0,final_result=0,death_phase=-1");
        }
        // reset active groups
        groupsReset();
        // reset active attributes
        attributesReset();
        // reset active attributes
        abilitiesReset();
        // reset active polls
        pollsReset();
        // resets storytime
        resetStorytime();
        // resets choices
        choicesReset();
        // reset kill queue
        killqClear();
        // clear rating events
        clearEvents();
        // reset teams
        resetTeams();
        // reset displays
        resetDisplays();
        // reset host information
        if(!debug) resetHostInformation();
        // reset modifiers
        if(!debug) resetModifiers();
        // reset schedule
        clearScheduledEvents();
        // disable action queue checker 
        pauseActionQueueChecker = true;
        // reset cached sc count
        scCatCount = 0;
        if(debug) getSCCats();
        // Reset Poll Count
        sqlSetStatProm(statID.POLL_COUNT, 1);
        channel.send("✅ Successfully reset poll counter!");
        // reset DRs
        let livingPlayers =  channel.guild.roles.cache.get(stats.participant).members.toJSON();
        livingPlayers.forEach(el => removeAllDR(el.id));
        if(!debug) {
            // reset other roles
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.participant).members.toJSON(), 0, "participant");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.dead_participant).members.toJSON(), 0, "dead participant");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.ghost).members.toJSON(), 0, "ghost");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.gamemaster).members.toJSON(), 0, "game master");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.spectator).members.toJSON(), 0, "spectator");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.sub).members.toJSON(), 0, "substitute");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.helper).members.toJSON(), 0, "helper");
            removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.mentor).members.toJSON(), 0, "mentor");
            // Remove Roles & Nicknames
            wroles_remove(channel, [stats.signed_up, stats.spectator, stats.sub, stats.participant, stats.dead_participant, stats.host, stats.ghost, stats.mentor, stats.signedmentor], ["signed up", "spectator", "substitute", "participant", "dead participant", "host", "ghost", "mentor", "signed up mentor"]);
            // run role removal again for critical roles because sometimes it fails even though it says it succeeds
            wroles_remove(channel, [stats.participant, stats.dead_participant, stats.ghost, stats.mentor], ["participant", "dead participant", "ghost", "mentor"]);
            // Cleanup channels
            cmdCCCleanup(channel);
            scCleanup(channel);
            let pubCat = await sqlGetStatProm(statID.PUBLIC_CATEGORY);
            cleanupCat(channel, pubCat, "public");
            resetRoleNames(channel);
        } else {
            cmdGamephaseSet(channel, ["set", gp.INGAME]);
            pauseActionQueueChecker = false;
            // reset to d0
            setPhase("d0");
            setSubphase(SUBPHASE.MAIN);
            // Start game
            if(!restart) {
                setTimeout(function() {
                    eventStarting();
                }, 1000 * 5);     
            } else {
                setTimeout(function() {
                    eventStarting(null, true);
                }, 1000 * 60);  
            }
        }
    }

    this.resetRoleNames = async function(channel) {
        // rename roles correctly
        let roles = [stats.signed_up, stats.spectator, stats.sub, stats.participant, stats.dead_participant, stats.host, stats.gamemaster, stats.ghost, stats.mentor, stats.ghost_mentor];
        let names = ["Signed-up","Spectator", "Substitute","Participant","Dead Participant","Host", "Game Master", "Ghostly Participant", "Mentor", "Ghostly Mentor"];
        for(let i = 0; i < roles.length; i++) {
            await channel.guild.roles.cache.get(roles[i]).setName(names[i]);
        }  
        channel.send("✅ Reset role names!");
    }
    
}
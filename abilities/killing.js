/**
    Abilities Module - Killing
    The module for implementing killing ability type
**/

module.exports = function() {
            
    /**
    Ability: Killing
    **/
    this.abilityKilling = async function(pid, src_role, ability) {
        let result;
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "";
            break;
            case "attack":
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                result = await killingAttack(src_role, pid, await parsePlayerSelector(ability.target, pid));
                return result;
            break;
        }
    }
    
    /**
    Ability: Killing - Attack
    WIP: doesnt consider defenses or anything
    **/
    this.killingAttack = async function(src_role, src_player, targets) {
        let success = false;
        for(let i = 0; i < targets.length; i++) {
            await killPlayer(targets[i]);
            abilityLog(`✅ <@${src_player}> attacked <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        return success ? "Attack successful!" : "Attack failed!"; // if at least one player dies its a success
    }
    
    
    /** WIP: this relies on various async functions that need replacing **/
	this.killPlayer = async function(player_id) {
       // set to dead
       await setLivingStatus(player_id, 0);
       // WIP: check mayor status (this should probably be SYNC)
       let channel = client.guilds.cache.get("569626539541397515").channels.cache.get("1269376980906672228"); // WIP: this should not be harcdoed - mayorCheck shouldnt even require a channel
       mayorCheck(channel);
       // WIP: should probably be in elected module
       reporterMessage(player_id);
            
        // get player
        let player = channel.guild.members.cache.get(player_id); // WIP: channel?
        // revoke participant role
        removeRoleRecursive(player, channel, stats.participant, "participant");
        // grant dead role depending on mode
        if(!stats.haunting) addRoleRecursive(player, channel, stats.dead_participant, "dead participant");
        else addRoleRecursive(player, channel, stats.ghost, "ghost");
        // revoke elected role WIP: elected module?
        removeRoleRecursive(player, channel, stats.mayor, "mayor");
        removeRoleRecursive(player, channel, stats.mayor2, "mayor 2");
        removeRoleRecursive(player, channel, stats.reporter, "reporter");
        removeRoleRecursive(player, channel, stats.guardian, "guardian");
	}
    
    /**
    Set Living Status
    set the alive value for a player
    **/
    this.setLivingStatus = function(player_id, status) {
        return new Promise(res => {
            sql("UPDATE players SET alive=" + connection.escape(status) + " WHERE id=" + connection.escape(player_id), result => {
                let guild =client.guilds.cache.get("569626539541397515");
                updateGameStatus(guild); // update game status (async)
                res();
            });	
        });
    }
    
    /**
    Reporter Message
    wip: this should probably not be in this module
    **/
    this.reporterMessage = function(player_id) {
        var reportMsg;
        let channel = client.guilds.cache.get("569626539541397515").channels.cache.get("1269376980906672228"); // WIP: WHHYY
        // Get info
        sql("SELECT role FROM players WHERE id = " + connection.escape(player_id), result => {
            let rEmoji = getRoleEmoji(result[0].role);
            reportMsg = "<@" + player_id + "> was a `" + result[0].role + "` " + rEmoji;
            // Send reporter message
            cmdConnectionSend(channel, ["", "reporter2", true, reportMsg]);
            cmdConnectionSend(channel, ["", "reporter", "Reporter", reportMsg]);
        }, () => {
            // Database error
            reportMsg = "⛔ Database error. Could not generate report!";
            // Send reporter message
            cmdConnectionSend(channel, ["", "reporter2", true, reportMsg]);
            cmdConnectionSend(channel, ["", "reporter", "Reporter", reportMsg]);
        });
       
    }

}
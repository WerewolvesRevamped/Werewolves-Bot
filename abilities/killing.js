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
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return "Killing failed! " + abilityError;
        }
        // parse parameters
        let targets = await parsePlayerSelector(ability.target, pid);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "Killing failed! " + abilityError;
            break;
            case "attack":
                result = await killingAttack(src_role, pid, targets);
                return result;
            break;
            case "true kill":
                result = await killingTrueKill(src_role, pid, targets);
                return result;
            break;
        }
    }
    
    /**
    Ability: Killing - Attack
    **/
    this.killingAttack = async function(src_role, src_player, targets) {
        let success = false;
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = await getLocationAbsences(targets[i], "attack", src_player);
            if(absentPlayers) absentPlayers.forEach(el => {
                abilityLog(`✅ <@${el.owner}> is absent at <@${targets[i]}>.`);
                targets.push(el.owner);
            });
            // evaluate all applicable defenses in order
            let defense;
            defense = await getTopAbsence(targets[i], "attack", src_player);
            if(!defense) defense = await getTopActiveDefense(targets[i], "attack", src_player);
            if(!defense) defense = await getTopPassiveDefense(targets[i], "attack", src_player);
            if(!defense) defense = await getTopPartialDefense(targets[i], "attack", src_player);
            if(!defense) defense = await getTopRecruitmentDefense(targets[i], "attack", src_player);
            if(defense) { // defense successful, log and continue
                abilityLog(`✅ <@${src_player}> attacked <@${targets[i]}> - failed due to:\`\`\`${JSON.stringify(defense)}\`\`\``);
                continue;
            }
            // run the on death trigger
            await trigger(targets[i], "On Death", { attacker: src_player, death_type: "Attack", attack_source: src_role, this: targets[i] }); 
            await trigger(targets[i], "On Killed", { attacker: src_player, death_type: "Attack", attack_source: src_role }); 
            // execute the kill
            await killPlayer(targets[i]);
            abilityLog(`✅ <@${src_player}> attacked <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        return success ? "Attack successful!" : "Attack failed!"; // if at least one player dies its a success
    }
    
    /**
    Ability: Killing - True Kill
    just kills without anything else being evaluated
    **/
    this.killingTrueKill = async function(src_role, src_player, targets) {
        let success = false;
        for(let i = 0; i < targets.length; i++) {
            // run the on death trigger
            await trigger(targets[i], "On Death", { attacker: src_player, death_type: "True Kill", attack_source: src_role, this: targets[i] }); 
            await trigger(targets[i], "On Killed", { attacker: src_player, death_type: "True Kill", attack_source: src_role }); 
            // execute the kill
            await killPlayer(targets[i]);
            abilityLog(`✅ <@${src_player}> true killed <@${targets[i]}>.`);
            success = true; // True Kill always succeeds
        }
        return success ? "True Kill successful!" : "True Kill failed!"; // if at least one player dies its a success
    }
    
    
    /** Kill Player
    kills a player (does not consider or defenses or anything, just kills)
    **/
	this.killPlayer = async function(player_id) {
       // set to dead
       await setLivingStatus(player_id, 0);
        // check mayor treshhold (and change roles if applicable)
       await mayorCheck();
       // send a reporter message
       reporterMessage(player_id);
            
        // get player
        let player = stats.guild.members.cache.get(player_id);
        // revoke participant role
        removeRoleRecursive(player, false, stats.participant, "participant");
        // grant dead role depending on mode
        if(!stats.haunting) addRoleRecursive(player, false, stats.dead_participant, "dead participant");
        else addRoleRecursive(player, false, stats.ghost, "ghost");
        // revoke elected role WIP: elected module?
        removeRoleRecursive(player, false, stats.mayor, "mayor");
        removeRoleRecursive(player, false, stats.mayor2, "mayor 2");
        removeRoleRecursive(player, false, stats.reporter, "reporter");
        removeRoleRecursive(player, false, stats.guardian, "guardian");
	}
    
    /**
    Set Living Status
    set the alive value for a player
    **/
    this.setLivingStatus = function(player_id, status) {
        return new Promise(res => {
            sql("UPDATE players SET alive=" + connection.escape(status) + " WHERE id=" + connection.escape(player_id), result => {
                updateGameStatus(); // update game status (async)
                res();
            });	
        });
    }


}
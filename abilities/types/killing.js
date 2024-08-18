/**
    Abilities Module - Killing
    The module for implementing killing ability type
**/

module.exports = function() {
            
    /** PUBLIC
    Ability: Killing
    **/
    this.abilityKilling = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Killing failed! " + abilityError, success: false };
        }
        // parse parameters
        let targets = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Killing failed! " + abilityError, success: false };
            break;
            case "attack":
                result = await killingAttack(src_name, src_ref, targets);
                return result;
            break;
            case "kill":
                result = await killingKill(src_name, src_ref, targets);
                return result;
            break;
            case "lynch":
                result = await killingLynch(src_name, src_ref, targets);
                return result;
            break;
            case "true kill":
                result = await killingTrueKill(src_name, src_ref, targets);
                return result;
            break;
        }
    }
    
    /** PRIVATE
    Ability: Killing - Attack
    **/
    async function killingAttack(src_name, src_ref, targets) {
        let success = false;
        
        // iterate through all attack targets
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = getAbsences(targets[i], "attack", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // check if player has a defense
            let hasDef = await hasDefense(targets[i], "attack", src_ref, src_name);
            if(hasDef) continue;
            
            // run the on death trigger
            await killDeathTriggers(targets[i], src_ref, "attack", src_name)
            
            // execute the kill
            await killPlayer(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} attacked <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        
        return success ? { msg: "Attack successful!", success: true } : { msg: "Attack failed!", success: false }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - Lynch
    **/
    async function killingLynch(src_name, src_ref, targets) {
        let success = false;
        
        // iterate through all attack targets
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = getAbsences(targets[i], "lynch", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // check if player has a defense
            let hasDef = await hasDefense(targets[i], "lynch", src_ref, src_name);
            if(hasDef) continue;
            
            // run the on death trigger
            await trigger(targets[i], "On Death", { attacker: src_ref, death_type: "lynch", attack_source: src_name }); 
            await trigger(targets[i], "On Lynch", { attacker: src_ref, death_type: "lynch", attack_source: src_name }); 
            await triggerHandler("On Death Complex", { attacker: src_ref, death_type: "lynch", attack_source: src_name, this: targets[i] }); 
            
            // execute the kill
            await killPlayer(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} lynched <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        
        return success ? { msg: "Lynch successful!", success: true } : { msg: "Lynch failed!", success: false }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - Kill
    **/
    async function killingKill(src_name, src_ref, targets) {
        let success = false;
        
        // iterate through all attack targets
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = getAbsences(targets[i], "kill", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // check if player has a defense
            let hasDef = await hasDefense(targets[i], "kill", src_ref, src_name);
            if(hasDef) continue;
            
            // run the on death trigger
            await killDeathTriggers(targets[i], src_ref, "kill", src_name)
            
            // execute the kill
            await killPlayer(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} killed <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        
        return success ? { msg: "Kill successful!", success: true } : { msg: "Kill failed!", success: false }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - True Kill
    just kills without anything else being evaluated
    **/
    async function killingTrueKill(src_name, src_ref, targets) {
        let success = false;
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = getAbsences(targets[i], "true kill", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // run the on death trigger
            await killDeathTriggers(targets[i], src_ref, "true kill", src_name)
            
            // execute the kill
            await killPlayer(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} true killed <@${targets[i]}>.`);
            success = true; // True Kill always succeeds
        }
        return success ? { msg: "True Kill successful!", success: true } : { msg: "True Kill failed!", success: false }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Kill / Death triggers
    triggers the triggers used by attack, kill and true kill
    **/
    async function killDeathTriggers(target, src_ref, type, src_name) {
        // normal triggers
        await trigger(target, "On Death", { attacker: src_ref, death_type: type, attack_source: src_name }); 
        await trigger(target, "On Killed", { attacker: src_ref, death_type: type, attack_source: src_name }); 
        // complex triggers
        await triggerHandler("On Death Complex", { attacker: src_ref, death_type: type, attack_source: src_name, this: target }); 
        await triggerHandler("On Killed Complex", { attacker: src_ref, death_type: type, attack_source: src_name, this: target }); 
    }
    
    /** PRIVATE
    Get absences
    **/
    async function getAbsences(target, type, src_ref) {
        let targets = [];
        // get absences
        let absentPlayers = await getLocationAbsences(target, type, src_ref);
        // iterate through absences: log and add to list
        if(absentPlayers) absentPlayers.forEach(el => {
            abilityLog(`✅ <@${el.owner}> is absent at <@${target}>.`);
            targets.push(el.owner);
        });
        // return list of additional targets
        return targets;
    }
    
    /** PRIVATE
    Find defense
    find the topmost applicable defense
    **/
    async function hasDefense(pid, type, src_ref, src_name) {
        // evaluate all applicable defenses in order
        let defense, defenseType;
        if(!defense) { // ABSENCE
            defense = await getTopAbsence(pid, type, src_ref);
            defenseType = "absence";
        }
        if(!defense) { // ACTIVE DEFENSE
            defense = await getTopActiveDefense(pid, type, src_ref);
            defenseType = "active";
        }
        if(!defense) { // PASSIVE DEFENSE
            defense = await getTopPassiveDefense(pid, type, src_ref);
            defenseType = "passive";
        }
        if(!defense) { // PARTIAL DEFENSE
            defense = await getTopPartialDefense(pid, type, src_ref);
            defenseType = "partial";
        }
        if(!defense) { // RECRUITMENT DEFENSE
            defense = await getTopRecruitmentDefense(pid, type, src_ref);
            defenseType = "recruitment";
        }
        
        // Found a defense, now apply the defense
        if(defense) { // defense successful, log and continue
            abilityLog(`✅ ${srcRefToText(src_ref)} attacked <@${pid}> - failed due to:\`\`\`${JSON.stringify(defense)}\`\`\``);
            // run defense triggers
            await trigger(pid, "On Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
            switch(defenseType) {
                case "absence":
                    await trigger(pid, "On Absence Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "active":
                    await trigger(pid, "On Active Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "passive":
                    await trigger(pid, "On Passive Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "partial":
                    await trigger(pid, "On Partial Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "recruitment":
                    await trigger(pid, "On Recruitment Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
            }
            return true; // return true
        }
        
        // No defense found, return false
        return false;
    }
    
    
    /** PUBLIC
    Kill Player
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
    
    /** PUBLIC
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
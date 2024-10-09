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
            case "banish":
                result = await killingBanish(src_name, src_ref, targets);
                return result;
            break;
            case "true banish":
                result = await killingTrueBanish(src_name, src_ref, targets);
                return result;
            break;
        }
    }
    
    /** PRIVATE
    Ability: Killing - Attack
    **/
    async function killingAttack(src_name, src_ref, targets) {
        let success = false;
        let origMaxIndex = targets.length - 1;
        
        // iterate through all attack targets
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = await getAbsences(targets[i], "attack", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // check if player has a defense
            let hasDef = await hasDefense(targets[i], "attack", src_ref, src_name, i > origMaxIndex);
            if(hasDef) continue;
            
            // run the on death trigger
            await killDeathTriggers(targets[i], src_ref, "attack", src_name)
            
            // execute the kill
            await queueKill(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} attacked <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        
        return success ? { msg: "Attack successful!", success: true, target: `player:${targets[0]}` } : { msg: "Attack failed!", success: false, target: `player:${targets[0]}` }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - Lynch
    **/
    async function killingLynch(src_name, src_ref, targets) {
        let success = false;
        let origMaxIndex = targets.length - 1;
        
        // iterate through all attack targets
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = await getAbsences(targets[i], "lynch", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // check if player has a defense
            let hasDef = await hasDefense(targets[i], "lynch", src_ref, src_name, i > origMaxIndex);
            if(hasDef) continue;
            
            // run the on death trigger
            await triggerPlayer(targets[i], "On Death", { attacker: src_ref, death_type: "lynch", attack_source: src_name }); 
            await triggerPlayer(targets[i], "On Lynch", { attacker: src_ref, death_type: "lynch", attack_source: src_name }); 
            await triggerHandler("On Death Complex", { attacker: src_ref, death_type: "lynch", attack_source: src_name, this: targets[i] }); 
            await triggerHandler("Passive");
            
            // execute the kill
            await queueKill(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} lynched <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        
        return success ? { msg: "Lynch successful!", success: true, target: `player:${targets[0]}` } : { msg: "Lynch failed!", success: false, target: `player:${targets[0]}` }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - Kill
    **/
    async function killingKill(src_name, src_ref, targets) {
        let success = false;
        let origMaxIndex = targets.length - 1;
        
        // iterate through all attack targets
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = await getAbsences(targets[i], "kill", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // check if player has a defense
            let hasDef = await hasDefense(targets[i], "kill", src_ref, src_name, i > origMaxIndex);
            if(hasDef) continue;
            
            // run the on death trigger
            await killDeathTriggers(targets[i], src_ref, "kill", src_name)
            
            // execute the kill
            await queueKill(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} killed <@${targets[i]}> - successful.`);
            success = true; // if attack succeeds set to true
        }
        
        return success ? { msg: "Kill successful!", success: true, target: `player:${targets[0]}` } : { msg: "Kill failed!", success: false, target: `player:${targets[0]}` }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - True Kill
    just kills without anything else being evaluated
    **/
    async function killingTrueKill(src_name, src_ref, targets) {
        let success = false;
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = await getAbsences(targets[i], "true kill", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // run the on death trigger
            await killDeathTriggers(targets[i], src_ref, "true kill", src_name)
            
            // execute the kill
            await queueKill(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} true killed <@${targets[i]}>.`);
            success = true; // True Kill always succeeds
        }
        return success ? { msg: "True Kill successful!", success: true, target: `player:${targets[0]}` } : { msg: "True Kill failed!", success: false, target: `player:${targets[0]}` }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - Banish
    **/
    async function killingBanish(src_name, src_ref, targets) {
        let success = false;
        let origMaxIndex = targets.length - 1;
        
        // iterate through all attack targets
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = await getAbsences(targets[i], "banish", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // check if player has a defense
            let hasDef = await hasDefense(targets[i], "banish", src_ref, src_name, i > origMaxIndex);
            if(hasDef) continue;
            
            // run the on Banishment trigger
            await banishTriggers(targets[i], src_ref, "banish", src_name)
            
            // execute the Banishment
            await queueBanish(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} banished <@${targets[i]}> - successful.`);
            success = true; // if Banishment succeeds set to true
        }
        
        return success ? { msg: "Banishment successful!", success: true, target: `player:${targets[0]}` } : { msg: "Banishment failed!", success: false, target: `player:${targets[0]}` }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Ability: Killing - True Banishment
    just banishes without anything else being evaluated
    **/
    async function killingTrueBanish(src_name, src_ref, targets) {
        let success = false;
        for(let i = 0; i < targets.length; i++) {
            // for every target, add all other player that are absent at their location to targets
            let absentPlayers = await getAbsences(targets[i], "true banish", src_ref);
            if(absentPlayers[0]) targets.push(...absentPlayers);
            
            // run the on Banishment trigger
            await banishTriggers(targets[i], src_ref, "true banish", src_name)
            
            // execute the Banishment
            await queueBanish(targets[i]);
            abilityLog(`✅ ${srcRefToText(src_ref)} true banished <@${targets[i]}>.`);
            success = true; // True Banishment always succeeds
        }
        return success ? { msg: "True Banishment successful!", success: true, target: `player:${targets[0]}` } : { msg: "True Banishment failed!", success: false, target: `player:${targets[0]}` }; // if at least one player dies its a success
    }
    
    /** PRIVATE
    Kill / Death triggers
    triggers the triggers used by attack, kill and true kill
    **/
    async function killDeathTriggers(target, src_ref, type, src_name) {
        // normal triggers
        await triggerPlayer(target, "On Death", { attacker: src_ref, death_type: type, attack_source: src_name }); 
        await triggerPlayer(target, "On Killed", { attacker: src_ref, death_type: type, attack_source: src_name }); 
        // complex triggers
        await triggerHandler("On Death Complex", { attacker: src_ref, death_type: type, attack_source: src_name, this: target }); 
        await triggerHandler("On Killed Complex", { attacker: src_ref, death_type: type, attack_source: src_name, this: target }); 
        // passive
        await triggerHandler("Passive");
    }
    
    /** PRIVATE
    Banish triggers
    triggers the triggers used by banish and true banish
    **/
    async function banishTriggers(target, src_ref, type, src_name) {
        // normal triggers
        await triggerPlayer(target, "On Banished", { attacker: src_ref, death_type: type, attack_source: src_name }); 
        await triggerPlayer(target, "On Banishment", { attacker: src_ref, death_type: type, attack_source: src_name }); 
        // complex triggers
        await triggerHandler("On Banished Complex", { attacker: src_ref, death_type: type, attack_source: src_name, this: target }); 
        await triggerHandler("On Banishment Complex", { attacker: src_ref, death_type: type, attack_source: src_name, this: target }); 
        // passive
        await triggerHandler("Passive");
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
    async function hasDefense(pid, type, src_ref, src_name, ignoreAbsence) {
        // evaluate all applicable defenses in order
        let defense, defenseType;
        if(!defense && !ignoreAbsence) { // ABSENCE
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
            await triggerPlayer(pid, "On Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
            switch(defenseType) {
                case "absence":
                    await triggerPlayer(pid, "On Absence Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "active":
                    await triggerPlayer(pid, "On Active Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "passive":
                    await triggerPlayer(pid, "On Passive Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "partial":
                    await triggerPlayer(pid, "On Partial Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
                case "recruitment":
                    await triggerPlayer(pid, "On Recruitment Defense", { attacker: src_ref, killing_type: type, attack_source: src_name }); 
                    await useAttribute(defense.ai_id);
                break;
            }
            return true; // return true
        }
        
        // No defense found, return false
        return false;
    }
    
    /** PRIVATE
    Queues a kill
    **/
    async function queueKill(pid) {
        await killqAdd(pid);
        doStorytimeCheck();
        killqScheduled = true;
    }
    
    /** PRIVATE
    Queues a banishment
    **/
    async function queueBanish(pid) { // WIP: How should this actually work?
        await killqAdd(pid);
        doStorytimeCheck();
        killqScheduled = true;
    }

}
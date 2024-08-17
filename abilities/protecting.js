/**
    Abilities Module - Protecting
    The module for implementing protecting / defenses
**/

module.exports = function() {
    
    /**
    Ability: Protecting
    **/
    this.abilityProtecting = async function(pid, src_role, ability) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return "Protecting failed! " + abilityError;
        }
        // parse parameters
        let from_type = parseDefenseFromType(ability.defense_from_type ?? "all");
        let from_selector = ability.defense_from_target ?? "@All"; // this selector should be parsed at argument runtime, not now
        let during_phase = parsePhaseType(ability.defense_during ?? "all");
        let target = await parsePlayerSelector(ability.target, pid);
        let dur_type = parseDuration(ability.duration ?? "permanent");
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "Protecting failed! " + abilityError;
            break;
            case "active defense":
                result = await protectingGeneric(src_role, pid, target, "active", from_type, from_selector, during_phase, dur_type);
                return result;
            break;
            case "passive defense":
                result = await protectingGeneric(src_role, pid, target, "passive", from_type, from_selector, during_phase, dur_type);
                return result;
            break;
            case "partial defense":
                result = await protectingGeneric(src_role, pid, target, "partial", from_type, from_selector, during_phase, dur_type);
                return result;
            break;
            case "recruitment defense":
                result = await protectingGeneric(src_role, pid, target, "recruitment", from_type, from_selector, during_phase, dur_type);
                return result;
            break;
            case "absence":
                // check parameters
                if(!ability.absence_at) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                    return "Absence failed! " + abilityError;
                }
                let loc = await parseLocation(ability.absence_at, pid);
                result = await protectingAbsence(src_role, pid, target, loc, from_type, from_selector, during_phase, dur_type);
                return result;
            break;
        }
    }
    
    
    /**
    Ability: Protecting - Active/Passive/Partial/Recruitment
    adds a disguise to a player
    **/
    this.protectingGeneric = async function(src_role, src_player, targets, def_type, from_type, from_selector, during_phase, dur_type) {
        for(let i = 0; i < targets.length; i++) {
            await createDefenseAttribute(src_role, src_player, targets[i], dur_type, def_type, from_type, from_selector, during_phase);
            abilityLog(`✅ <@${targets[i]}> was protected with \`${toTitleCase(def_type)}\` defense for \`${getDurationName(dur_type)}\`.`);
        }
        return "Protecting executed!";
    }
    
    /**
    Ability: Protecting - Absence
    adds a disguise to a player
    **/
    this.protectingAbsence = async function(src_role, src_player, targets, loc, from_type, from_selector, during_phase, dur_type) {
        for(let i = 0; i < targets.length; i++) {
            await createAbsenceAttribute(src_role, src_player, targets[i], dur_type, loc, from_type, from_selector, during_phase);
            abilityLog(`✅ <@${targets[i]}> is absent at \`${toTitleCase(loc)}\` for \`${getDurationName(dur_type)}\`.`);
        }
        return "Absence registered!";
    }
    
        
    /**
    Get all defenses of a certain type
    **/
    this.getAllDefenses = async function(player_id, type) {
        let allDefenses = await queryAttributePlayer(player_id, "attr_type", "defense", "val1", type); // get all defenses of specified type
        return allDefenses;
    }
    
    /**
    Get all absences
    **/
    this.getAllAbsences = async function(player_id) {
        let allAbsences = await queryAttributePlayer(player_id, "attr_type", "absence"); // get all absences
        return allAbsences;
    }
    
    /**
    Filter through defenses
    **/
    async function filterDefenses(defenses, kill_type, from) {
        let matchingDefenses = [];
        // iterate through all conditions
        for(let i = 0; i < defenses.length; i++) {
            // get values
            let attrKillType = defenses[i].val2;
            let attrSelector = defenses[i].val3;
            let attrPhase = defenses[i].val4;
            // check if killing type matches alllowed types
            let allowed_type =
                    attrKillType == "all"
                || (kill_type == "attack" && (attrKillType == "attacks" || attrKillType == "kills" || attrKillType == "attacks_lynches"))
                || (kill_type == "kill" && (attrKillType == "kills"))
                || (kill_type == "lynches" && (attrKillType == "lynches" || attrKillType == "attacks_lynches"));
            // check if from matches selector
            let selectorList = await parsePlayerSelector(attrSelector);
            let allowed_from = selectorList.includes(from);
            // check if phase matches current phase
            let allowed_phase = 
                    attrPhase == "both"
                || (isDay() && attrPhase == "day")
                || (isNight() && attrPhase == "night");
            // all conditions match
            if(allowed_type && allowed_from && allowed_phase) {
                matchingDefenses.push(defenses[i]);
            } else {
                console.log("Defense failed: ", allowed_type, allowed_from, allowed_phase);
            }
        }
        // return matching conditions
        return matchingDefenses;
    }
    
    
    /**
    Get top absence
    **/
    this.getTopAbsence = async function(player_id, kill_type, from) {
        // get defenses
        let defs = await getAllAbsences(player_id);
        // filter defenses
        defs = await filterDefenses(defs, kill_type, from);
        // return defenses
        if(defs.length > 0) return defs[defs.length - 1];
        else return false;
    }
    
    /**
    Get top defense of a certain type
    **/
    this.getTopDefense = async function(type, player_id, kill_type, from) {
        // get defenses
        let defs = await getAllDefenses(player_id, type);
        // filter defenses
        defs = await filterDefenses(defs, kill_type, from);
        // return defenses
        if(defs.length > 0) return defs[defs.length - 1];
        else return false;
    }
    
    /**
    Get top active defense
    **/
    this.getTopActiveDefense = async function(player_id, kill_type, from) {
        return await getTopDefense("active", player_id, kill_type, from);
    }
    
    /**
    Get top passive defense
    **/
    this.getTopPassiveDefense = async function(player_id, kill_type, from) {
        return await getTopDefense("passive", player_id, kill_type, from);
    }
    
    /**
    Get top partial defense
    **/
    this.getTopPartialDefense = async function(player_id, kill_type, from) {
        return await getTopDefense("partial", player_id, kill_type, from);
    }
    
    /**
    Get top recruitment defense
    **/
    this.getTopRecruitmentDefense = async function(player_id, kill_type, from) {
        return await getTopDefense("recruitment", player_id, kill_type, from);
    }
    

    
}
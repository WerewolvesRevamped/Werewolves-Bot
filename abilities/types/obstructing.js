/**
    Abilities Module - Obstructing
    The module for implementing obstructing
**/

module.exports = function() {
    
    /**
    Ability: Obstructing
    **/
    this.abilityObstructing = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Obstructing failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        target = await applyRedirection(target, src_ref, ability.type, "", additionalTriggerData);
        let duration = parseDuration(ability.duration ?? "permanent");
        let targetType = ability.obstructed_ability ? parseAbilityType(ability.obstructed_ability, src_ref, additionalTriggerData) : "";
        let targetSubype = ability.obstructed_subtype ? parseAbilitySubtype(`${ability.obstructed_subtype} ${ability.obstructed_ability}`, src_ref, additionalTriggerData) : "";
        if(targetSubype && targetSubype != "none none") targetSubype = ability.obstructed_subtype;
        else targetSubype = "";
        let customFeedback = ability.custom_feedback ?? [];
        // execute ability
        result = await obstructing(src_name, src_ref, target, duration, targetType, targetSubype, customFeedback);
        return result;
    }
    
    /**
    Ability: Obstructing
    adds an obstruction to a player
    **/
    this.obstructing = async function(src_name, src_ref, targets, duration, targetType, targetSubype, customFeedback) {
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            let result = await visit(src_ref, targets[i], targetType, "obstructing");
            if(result) {
                if(targets.length === 1) return visitReturn(result, "Obstructing failed!", "Obstructing succeeded!");
                continue;
            }
            
            await createObstructionAttribute(src_name, src_ref, targets[i], duration, targetType, targetSubype, JSON.stringify(customFeedback));
            abilityLog(`✅ <@${targets[i]}> was obstructed for \`${getDurationName(duration)}\`${targetType ? (' affecting \`' + (targetSubype ? targetSubype + ' ' : '') + targetType + '\`') : ''}${customFeedback.length > 0 ? ' with custom feedback \`' + JSON.stringify(customFeedback) + '\`' : ''}.`);
        }
        return { msg: "Obstructing succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    /**
    Get all obstructions
    **/
    this.getObstructions = async function(player_id) {
        let allObstructions = await queryAttributePlayer(player_id, "attr_type", "obstruction"); // get all obstructions of specified type
        if(allObstructions.length <= 0) return []; // no obstructions
        return allObstructions;
    }
    
    
}
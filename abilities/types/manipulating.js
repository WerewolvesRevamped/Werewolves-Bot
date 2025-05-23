/**
    Abilities Module - Manipulating
    The module for implementing vote manipulating
**/

module.exports = function() {
    
    /**
    Ability: (Vote) Manipulating
    **/
    this.abilityManipulating = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.manip_type || !ability.manip_value) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Manipulating failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        target = await applyRedirection(target, src_ref, ability.type, ability.subtype, additionalTriggerData);
        let duration = parseDuration(ability.duration ?? "permanent");
        let manip_type = parseManipType(ability.manip_type);
        let manip_value = await parseNumber(ability.manip_value, src_ref, additionalTriggerData);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Manipulating failed! " + abilityError, success: false };
            break;
            case "absolute":
                result = await manipulating(src_name, src_ref, target, manip_type, manip_value, duration, "absolute", additionalTriggerData);
                return result;
            break;
            case "relative":
                result = await manipulating(src_name, src_ref, target, manip_type, manip_value, duration, "relative", additionalTriggerData);
                return result;
            break;
        }
    }
    
    /**
    Ability: Manipulating - Absolute/Relative
    adds a vote manipulation to a player
    **/
    this.manipulating = async function(src_name, src_ref, targets, manip_type, manip_value, duration, type, additionalTriggerData) {
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets[i], manip_value, NO_SND_VISIT_PARAM, "manipulating", manip_type);
                if(result) {
                    if(targets.length === 1) return visitReturn(result, "Manipulating failed!", "Manipulating succeeded!");
                    continue;
                }
            }
            
            await createManipulationAttribute(src_name, src_ref, targets[i], duration, type, manip_type, manip_value);
            abilityLog(`✅ <@${targets[i]}> had their \`${manip_type}\` voting value ${type === 'absolute' ? 'absolutely manipulated to' : 'relatively manipulated by'} \`${manip_value}\` for \`${getDurationName(duration)}\`.`);
        }
        return { msg: "Manipulating succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    /**
    Get all vote manipulations
    **/
    this.getManipulations = async function(player_id, subtype) {
        let allManipulations = await queryAttributePlayer(player_id, "attr_type", "manipulation", "val2", subtype); // get all manipulation of specified type
        if(allManipulations.length <= 0) return []; // no manipulations
        return allManipulations;
    }
    
    
}
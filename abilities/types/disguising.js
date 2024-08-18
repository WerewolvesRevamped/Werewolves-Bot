/**
    Abilities Module - Disguising
    The module for implementing disguising
**/

module.exports = function() {
    
    /**
    Ability: Disguising
    **/
    this.abilityDisguising = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.disguise) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return "Disguising failed! " + abilityError;
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        let role = parseRoleSelector(ability.disguise);
        let duration = parseDuration(ability.duration ?? "permanent");
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "Disguising failed! " + abilityError;
            break;
            case "weakly":
                result = await disguising(src_name, src_ref, target, role, duration, "weak");
                return result;
            break;
            case "strongly":
                result = await disguising(src_name, src_ref, target, role, duration, "strong");
                return result;
            break;
        }
    }
    
    /**
    Ability: Disguising - Weak/Strong
    adds a disguise to a player
    **/
    this.disguising = async function(src_name, src_ref, targets, disguises, duration, strength) {
        // check its just a single disguise
        let disguise = disguises[0];
        if(disguises.length != 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to disguise as ${disguises.length} roles!`);  
            return "Disguising failed! " + abilityError;
        }
        for(let i = 0; i < targets.length; i++) {
            await createDisguiseAttribute(src_name, src_ref, targets[i], duration, disguise, strength);
            abilityLog(`✅ <@${targets[i]}> was ${strength === 'weak' ? 'weakly' : 'strongly'} disguised as \`${toTitleCase(disguise)}\` for \`${getDurationName(duration)}\`.`);
        }
        return "Disguising succeeded!";
    }
    
    /**
    Get top disguise of a certain type
    **/
    this.getTopDisguise = async function(player_id, type) {
        let allDisguises = await queryAttributePlayer(player_id, "attr_type", "disguise", "val2", type); // get all disguises of specified type
        if(allDisguises.length <= 0) return ""; // no disguises
        let topDisguise = allDisguises[allDisguises.length - 1]; // get most recent disguise
        return topDisguise.val1;
    }
    
    /**
    Get top weak disguise
    **/
    this.getTopWeakDisguise = async function(player_id) {
        return await getTopDisguise(player_id, "weak");
    }
    
    /**
    Get top strong disguise
    **/
    this.getTopStrongDisguise = async function(player_id) {
        return await getTopDisguise(player_id, "strong");
    }
    
}
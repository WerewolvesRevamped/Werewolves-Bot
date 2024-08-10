/**
    Abilities Module - Disguising
    The module for implementing disguising
**/

module.exports = function() {
    
    /**
    Ability: Disguising
    **/
    this.abilityDisguising = async function(pid, src_role, ability) {
        let result;
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "Disguising failed! " + abilityError;
            break;
            case "weakly":
                if(!ability.target || !ability.disguise) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                result = await disguising(src_role, pid, parsePlayerSelector(ability.target, pid), parseRoleSelector(ability.disguise), parseDuration(ability.duration ?? "permanent"), "weak");
                return result;
            break;
            case "strongly":
                if(!ability.target || !ability.disguise) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                result = await disguising(src_role, pid, parsePlayerSelector(ability.target, pid), parseRoleSelector(ability.disguise), parseDuration(ability.duration ?? "permanent"), "strong");
                return result;
            break;
        }
    }
    
    /**
    Ability: Disguising - Weak/Strong
    adds a disguise to a player
    **/
    this.disguising = async function(src_role, src_player, targets, disguises, duration, strength) {
        // check its just a single disguise
        let disguise = disguises[0];
        if(disguises.length != 1) {
            abilityLog(`❗ **Error:** <@${src_player}> tried to disguise as ${disguises.length} roles!`);  
            return "Disguising failed! " + abilityError;
        }
        for(let i = 0; i < targets.length; i++) {
            await createDisguiseAttribute(src_role, src_player, targets[i], duration, disguise, strength);
            abilityLog(`✅ <@${targets[i]}> was ${strength === 'weak' ? 'weakly' : 'strongly'} disguised as \`${toTitleCase(disguise)}\` for \`${getDurationName(duration)}\`.`);
        }
        return "Disguising succeeded!";
    }
    
}
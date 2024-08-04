/**
    Abilities Module - Investigating
    The module for implementing investigation ability type
**/

module.exports = function() {
        
    /**
    Ability: Investigating
    **/
    this.abilityInvestigating = async function(pid, src_role, ability) {
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "";
            break;
            case "role":
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                let result = await investigatingRole(src_role, pid, parsePlayerSelector(ability.target, pid), ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
        }
    }
    
    /**
    Ability: Investigating - Role
    **/
    this.investigatingRole = async function(src_role, src_player, targets, affected_by_wd, affected_by_sd) {
        // can only investigate exactly one player
        if(targets.length > 1) {
            abilityLog(`❗ **Error:** <@${src_player}> tried to investigate more than one player at a time!`);  
            return "Investigation failed! " + abilityError;
        }
        if(targets.length < 1) {
            abilityLog(`❗ **Error:** <@${src_player}> tried to investigate nobody!`);  
            return "Investigation failed! " + abilityError;
        }
        // query attribute
        return new Promise(res => {
             sql("SELECT role FROM players WHERE id=" + connection.escape(targets[0]), result => {
                abilityLog(`✅ <@${src_player}> investigated <@${targets[0]}> as \`${toTitleCase(result[0].role)}\`.`);
                 res(`Investigated <@${targets[0]}>: \`${toTitleCase(result[0].role)}\``);
             });
        }); 
    }
    
}
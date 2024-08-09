/**
    Abilities Module - Investigating
    The module for implementing investigation ability type
**/

module.exports = function() {
        
    /**
    Ability: Investigating
    **/
    this.abilityInvestigating = async function(pid, src_role, ability) {
        let result;
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "";
            break;
            case "role":
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                result = await investigatingRole(src_role, pid, parsePlayerSelector(ability.target, pid), ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "class":
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                result = await investigatingClass(src_role, pid, parsePlayerSelector(ability.target, pid), ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "category":
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                result = await investigatingCategory(src_role, pid, parsePlayerSelector(ability.target, pid), ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
        }
    }
    
    /**
    Single target check - checks investigation is only targetting exactly one target
    **/
    function singleTargetCheck(targets) {
        // can only investigate exactly one player
        if(targets.length > 1) {
            abilityLog(`❗ **Error:** <@${src_player}> tried to investigate more than one player at a time!`);  
            return "Investigation failed! " + abilityError;
        }
        if(targets.length < 1) {
            abilityLog(`❗ **Error:** <@${src_player}> tried to investigate nobody!`);  
            return "Investigation failed! " + abilityError;
        }
    }
    
    /**
    Ability: Investigating - Role
    **/
    this.investigatingRole = async function(src_role, src_player, targets, affected_by_wd, affected_by_sd) {
        // single target check
        if(targets.length != 1) {
            return singleTargetCheck(targets);
        }
        // query attribute
        return new Promise(res => {
             sql("SELECT role FROM players WHERE id=" + connection.escape(targets[0]), result => {
                abilityLog(`✅ <@${src_player}> investigated <@${targets[0]}>'s role as \`${toTitleCase(result[0].role)}\`.`);
                 res(`Investigated <@${targets[0]}>'s role: \`${toTitleCase(result[0].role)}\``);
             });
        }); 
    }
    
    /**
    Ability: Investigating - Class
    **/
    this.investigatingClass = async function(src_role, src_player, targets, affected_by_wd, affected_by_sd) {
        // single target check
        if(targets.length != 1) {
            return singleTargetCheck(targets);
        }
        // get data
        let rdata = await getRoleDataFromPlayer(targets[0]);
        // feedback
        abilityLog(`✅ <@${src_player}> investigated <@${targets[0]}>'s class as \`${toTitleCase(rdata.class)}\`.`);
        return `Investigated <@${targets[0]}>'s class: \`${toTitleCase(rdata.class)}\``;
    }
    
    /**
    Ability: Investigating - Category
    **/
    this.investigatingCategory = async function(src_role, src_player, targets, affected_by_wd, affected_by_sd) {
        // single target check
        if(targets.length != 1) {
            return singleTargetCheck(targets);
        }
        // get data
        let rdata = await getRoleDataFromPlayer(targets[0]);
        // feedback
        abilityLog(`✅ <@${src_player}> investigated <@${targets[0]}>'s category as \`${toTitleCase(rdata.category)}\`.`);
        return `Investigated <@${targets[0]}>'s category: \`${toTitleCase(rdata.category)}\``;
    }
    
    
    /**
    Returns a player's role's key fields
    **/
    this.getRoleDataFromPlayer = async function(player) {
        return new Promise(res => {
            sql("SELECT class,category,team FROM players INNER JOIN roles ON roles.name=players.role WHERE players.id=" + connection.escape(player), async result => {
                res(result[0]);
            });
        });
    }    
    
}
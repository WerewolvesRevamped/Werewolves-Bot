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
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
            return "Investigation failed! " + abilityError;
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, pid);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "Investigation failed! " + abilityError;
            break;
            case "role":
                result = await investigatingRole(src_role, pid, target, ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "class":
                result = await investigatingClass(src_role, pid, target, ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "category":
                result = await investigatingCategory(src_role, pid, target, ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
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
        // get data
        let rdata = await getVisibleRoleData(targets[0], affected_by_wd, affected_by_sd);
        // feedback
        abilityLog(`✅ <@${src_player}> investigated <@${targets[0]}>'s role as \`${toTitleCase(rdata.role.role)}\`${rdata.type?' ('+rdata.type+')':''}.`);
        return `Investigated <@${targets[0]}>'s role: \`${toTitleCase(rdata.role.role)}\``;
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
        let rdata = await getVisibleRoleData(targets[0], affected_by_wd, affected_by_sd);
        // feedback
        abilityLog(`✅ <@${src_player}> investigated <@${targets[0]}>'s class as \`${toTitleCase(rdata.role.class)}\`${rdata.type?' ('+rdata.type+')':''}.`);
        return `Investigated <@${targets[0]}>'s class: \`${toTitleCase(rdata.role.class)}\``;
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
        let rdata = await getVisibleRoleData(targets[0], affected_by_wd, affected_by_sd);
        // feedback
        abilityLog(`✅ <@${src_player}> investigated <@${targets[0]}>'s category as \`${toTitleCase(rdata.role.category)}\`${rdata.type?' ('+rdata.type+')':''}.`);
        return `Investigated <@${targets[0]}>'s category: \`${toTitleCase(rdata.role.category)}\``;
    }
    
    /**
    Get visible role when considering disguises
    **/
    async function getVisibleRoleData(player, affected_by_wd, affected_by_sd) {
        // get role data
        let rdata = await getRoleDataFromPlayer(player);
        let type = "";
        // get weak disguise data (if applicable)
        if(affected_by_wd) {
            let disguise = await getTopWeakDisguise(player);
            if(disguise) {
                rdata = await getRoleDataFromRole(disguise);
                type = "WD";
            }
        }
        // get strong disguise data (if applicable)
        if(affected_by_sd) {
            let disguise = await getTopStrongDisguise(player);
            if(disguise) {
                rdata = await getRoleDataFromRole(disguise);
                type = "SD";
            }
        }
        return {role: rdata, type: type};
    }
    
    /**
    Returns a player's role's key fields
    **/
    this.getRoleDataFromPlayer = async function(player) {
        return new Promise(res => {
            sql("SELECT players.role,roles.class,roles.category,roles.team FROM players INNER JOIN roles ON roles.name=players.role WHERE players.id=" + connection.escape(player), async result => {
                res(result[0]);
            });
        });
    }    
    
    /**
    Returns a role's key fields
    **/
    this.getRoleDataFromRole = async function(role) {
        return new Promise(res => {
            sql("SELECT name,class,category,team FROM roles WHERE name=" + connection.escape(role), async result => {
                result[0].role = result[0].name; // alias the name field to have same format as getRoleDataFromPlayer
                res(result[0]);
            });
        });
    }    
    
}
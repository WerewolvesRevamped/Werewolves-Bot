/**
    Abilities Module - Investigating
    The module for implementing investigation ability type
**/

module.exports = function() {
        
    /**
    Ability: Investigating
    **/
    this.abilityInvestigating = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
            return { msg: "Investigation failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Investigation failed! " + abilityError, success: false };
            break;
            case "role":
                result = await investigatingRole(src_name, src_ref, target, ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "class":
                result = await investigatingClass(src_name, src_ref, target, ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "category":
                result = await investigatingCategory(src_name, src_ref, target, ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "alignment":
                result = await investigatingAlignment(src_name, src_ref, target, ability.affected_by_wd ?? false, ability.affected_by_sd ?? false);
                return result;
            break;
            case "player_count":
                result = await investigatingPlayerCount(src_name, src_ref, target, ability.target);
                return result;
            break;
        }
    }
    
    /**
    Single target check - checks investigation is only targetting exactly one target
    **/
    function singleTargetCheck(targets, src_ref) {
        // can only investigate exactly one player
        if(targets.length > 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to investigate more than one player at a time!`);  
            return { msg: "Investigation failed! " + abilityError, success: false };
        }
        if(targets.length < 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to investigate nobody!`);  
            return { msg: "Investigation failed! " + abilityError, success: false };
        }
    }
    
    /**
    Ability: Investigating - Role
    **/
    this.investigatingRole = async function(src_name, src_ref, targets, affected_by_wd, affected_by_sd) {
        // single target check
        if(targets.length != 1) {
            return singleTargetCheck(targets, src_ref);
        }
        // get data
        let rdata = await getVisibleRoleData(targets[0], affected_by_wd, affected_by_sd);
        // feedback
        abilityLog(`✅ ${srcRefToText(src_ref)} investigated <@${targets[0]}>'s role as \`${toTitleCase(rdata.role.role)}\`${rdata.type?' ('+rdata.type+')':''}.`);
        return { msg: `Investigated <@${targets[0]}>'s role: \`${toTitleCase(rdata.role.role)}\``, success: true, target: `player:${targets[0]}`, result: `${toTitleCase(rdata.role.role)}[role]` };
    }
    
    /**
    Ability: Investigating - Class
    **/
    this.investigatingClass = async function(src_name, src_ref, targets, affected_by_wd, affected_by_sd) {
        // single target check
        if(targets.length != 1) {
            return singleTargetCheck(targets, src_ref);
        }
        // get data
        let rdata = await getVisibleRoleData(targets[0], affected_by_wd, affected_by_sd);
        // feedback
        abilityLog(`✅ ${srcRefToText(src_ref)} investigated <@${targets[0]}>'s class as \`${toTitleCase(rdata.role.class)}\`${rdata.type?' ('+rdata.type+')':''}.`);
        return { msg: `Investigated <@${targets[0]}>'s class: \`${toTitleCase(rdata.role.class)}\``, success: true, target: `player:${targets[0]}`, result: `${toTitleCase(rdata.role.class)}[class]` };
    }
    
    /**
    Ability: Investigating - Category
    **/
    this.investigatingCategory = async function(src_name, src_ref, targets, affected_by_wd, affected_by_sd) {
        // single target check
        if(targets.length != 1) {
            return singleTargetCheck(targets, src_ref);
        }
        // get data
        let rdata = await getVisibleRoleData(targets[0], affected_by_wd, affected_by_sd);
        // feedback
        abilityLog(`✅ ${srcRefToText(src_ref)} investigated <@${targets[0]}>'s category as \`${toTitleCase(rdata.role.category)}\`${rdata.type?' ('+rdata.type+')':''}.`);
        return { msg: `Investigated <@${targets[0]}>'s category: \`${toTitleCase(rdata.role.category)}\``, success: true, target: `player:${targets[0]}`, result: `${toTitleCase(rdata.role.category)}[category]` };
    }
    
    /**
    Ability: Investigating - Alignment
    **/
    this.investigatingAlignment = async function(src_name, src_ref, targets, affected_by_wd, affected_by_sd) {
        // single target check
        if(targets.length != 1) {
            return singleTargetCheck(targets, src_ref);
        }
        // get data
        let rdata = await getVisibleRoleData(targets[0], affected_by_wd, affected_by_sd);
        if(rdata.type === "") {
            // feedback - no disguise
            abilityLog(`✅ ${srcRefToText(src_ref)} investigated <@${targets[0]}>'s alignment as \`${toTitleCase(rdata.role.alignment)}\`${rdata.type?' ('+rdata.type+')':''}.`);
            return { msg: `Investigated <@${targets[0]}>'s alignment: \`${toTitleCase(rdata.role.alignment)}\``, success: true, target: `player:${targets[0]}`, result: `${toTitleCase(rdata.role.alignment)}[alignment]` };
        } else {
            // feedback - disguise
            abilityLog(`✅ ${srcRefToText(src_ref)} investigated <@${targets[0]}>'s alignment as \`${toTitleCase(rdata.role.team)}\`${rdata.type?' ('+rdata.type+')':''}.`);
            return { msg: `Investigated <@${targets[0]}>'s alignment: \`${toTitleCase(rdata.role.team)}\``, success: true, target: `player:${targets[0]}`, result: `${toTitleCase(rdata.role.team)}[alignment]` };
        }
    }
    
    /**
    Ability: Investigating - Player Count
    **/
    this.investigatingPlayerCount = async function(src_name, src_ref, targets, selector) {
        let count = targets.length;
        let selectorTarget = selector.split("[")[0];
        // feedback
        abilityLog(`✅ ${srcRefToText(src_ref)} investigated \`${selectorTarget}\`'s count as \`${count}\`.`);
        return { msg: `Investigated \`${selectorTarget}\`'s count: \`${count}\``, success: true, result: `${count}[number]` };
    }
    
    /**
    Get visible role when considering disguises
    **/
    async function getVisibleRoleData(player, affected_by_wd, affected_by_sd) {
        // get role data
        let rdata = await getRoleDataFromPlayer(player);
        let type = "";
        let wdis, sdis;
        // get weak disguise data (if applicable)
        if(affected_by_wd) {
            wdis = await getTopWeakDisguise(player);
            if(wdis.val1) {
                rdata = await getRoleDataFromRole(wdis.val1);
                type = "WD";
            }
        }
        // get strong disguise data (if applicable)
        if(affected_by_sd) {
            sdis = await getTopStrongDisguise(player);
            if(sdis.val1) {
                rdata = await getRoleDataFromRole(sdis.val1);
                type = "SD";
            }
        }
        // log an attribute use
        switch(type) {
            case "WD": await useAttribute(wdis.ai_id); break;
            case "SD": await useAttribute(sdis.ai_id); break;    
        }
        // return output
        return {role: rdata, type: type};
    }
    
    /**
    Returns a player's role's key fields
    **/
    this.getRoleDataFromPlayer = async function(player) {
        return new Promise(res => {
            sql("SELECT players.role,players.alignment,roles.class,roles.category,roles.team FROM players INNER JOIN roles ON roles.name=players.role WHERE players.id=" + connection.escape(player), async result => {
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
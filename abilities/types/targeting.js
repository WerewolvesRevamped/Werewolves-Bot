/**
    Abilities Module - Targeting
    The module for implementing targeting
**/

module.exports = function() {

    /** PUBLIC
    Ability: Targeting
    **/
    this.abilityTargeting = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "Targeting failed! " + abilityError;
            break;
            case "target":
                // check parameters
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                    return "Targeting failed! " + abilityError;
                }
                // parse parameters
                let targetParsed = await parseSelector(ability.target, src_ref, additionalTriggerData);
                result = await targetingTarget(src_name, src_ref, targetParsed.value, targetParsed.type);
                return result;
            break;
            case "untarget":
                result = await targetingUntarget(src_name, src_ref);
                return result;
            break;
        }
    }
    
    /** PRIVATE
    Ability: Targeting - Target
    **/
    async function targetingTarget(src_name, src_ref, targets, targetType) {
        // can only target exactly one target
        if(targets.length > 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to target more than one target at a time!`);  
            return "Targeting failed! " + abilityError;
        }
        if(targets.length < 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to target nobody!`);  
            return "Targeting failed! " + abilityError;
        }
        
        // update target
        let target = targets[0];
        await setTarget(src_ref, `${targetType}:${target}`);
        
        abilityLog(`✅ ${srcRefToText(src_ref)} targeted ${srcRefToText(targetType+':'+target)}.`);
        
        // feedback
        return "Target updated!";
    }
    
    /** PRIVATE
    Ability: Targeting - Untarget
    **/
    async function targetingUntarget(src_name, src_ref) {
        // update target
        await setTarget(src_ref, "");
        
        abilityLog(`✅ ${srcRefToText(src_ref)} untargeted.`);
        
        // feedback
        return "Target cleared!";
    }
    
    /** PUBLIC
    Get Target
    get the target for anything
    **/
    this.getTarget = function(src_ref) {
        let srcType = srcToType(src_ref);
        let srcVal = srcToValue(src_ref);
        switch(srcType) {
            case "player":
                return getPlayerTarget(srcVal);
            break;
            case "player":
                return getGroupTarget(srcVal);
            break;
            default:
                abilityLog(`❗ **Error:** Unsupported type ${srcType} for targeting!`);  
                return;
            break;
        }
    }
    
    /** PRIVATE
    Set Target
    set the target for anything
    **/
    function setTarget(src_ref, target) {
        let srcType = srcToType(src_ref);
        let srcVal = srcToValue(src_ref);
        switch(srcType) {
            case "player":
                return setPlayerTarget(srcVal, target);
            break;
            case "group":
                return setGroupTarget(srcVal, target);
            break;
            default:
                abilityLog(`❗ **Error:** Unsupported type ${srcType} for targeting!`);  
                return;
            break;
        }
    }
    
    /** PRIVATE
    Set Target Player
    set the target for a player
    **/
    function getPlayerTarget(player_id) {
        return new Promise(res => {
            sql("SELECT target FROM players WHERE id=" + connection.escape(player_id), result => {
                res(result[0].target);
            });	
        });
    }
    
    /** PRIVATE
    Set Target Player
    set the target for a player
    **/
    function setPlayerTarget(player_id, target) {
        return new Promise(res => {
            sql("UPDATE players SET target=" + connection.escape(target) + " WHERE id=" + connection.escape(player_id), result => {
                res();
            });	
        });
    }
    
    /** PRIVATE
    Set Target Group
    set the target for a group
    **/
    function getGroupTarget(channel_id) {
        return new Promise(res => {
            sql("SELECT target FROM active_groups WHERE channel_id=" + connection.escape(channel_id), result => {
                res(result[0].target);
            });	
        });
    }
    
    /** PRIVATE
    Set Target Group
    set the target for a group
    **/
    function setGroupTarget(channel_id, target) {
        return new Promise(res => {
            sql("UPDATE active_groups SET target=" + connection.escape(target) + " WHERE channel_id=" + connection.escape(channel_id), result => {
                res();
            });	
        });
    }
    
}
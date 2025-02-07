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
                return { msg: "Targeting failed! " + abilityError, success: false };
            break;
            case "target":
                // check parameters
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                    return { msg: "Targeting failed! " + abilityError, success: false };
                }
                // parse parameters
                let targetParsed = await parseSelector(ability.target, src_ref, additionalTriggerData);
                targetParsed = await applyRedirection(targetParsed, src_ref, ability.type, ability.subtype, additionalTriggerData);
                result = await targetingTarget(src_name, src_ref, targetParsed.value, targetParsed.type, additionalTriggerData);
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
    async function targetingTarget(src_name, src_ref, targets, targetType, additionalTriggerData) {
        // can only target exactly one target
        if(targets.length > 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to target more than one target at a time!`);  
            return { msg: "Targeting failed! " + abilityError, success: false };
        }
        if(targets.length < 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to target nobody!`);  
            return { msg: "Targeting failed! " + abilityError, success: false };
        }
        
        let target = targets[0];
        
        // handle visit
        if(additionalTriggerData.parameters.visitless !== true) {
            let result = await visit(src_ref, target, targetType, "targeting", "target");
            if(result) return visitReturn(result, "Targeting failed!", "Target updated!");
        }
    
        // update target
        await setTarget(src_ref, `${targetType}:${target}`);
        updateDisplayCheck(`${src_ref}`, "target");
        
        abilityLog(`✅ ${srcRefToText(src_ref)} targeted ${srcRefToText(targetType+':'+target)}.`);
        
        // feedback
        return { msg: "Target updated!", success: true, target: `${targetType}:${target}` };
    }
    
    /** PRIVATE
    Ability: Targeting - Untarget
    **/
    async function targetingUntarget(src_name, src_ref) {
        // update target
        await setTarget(src_ref, "");
        updateDisplayCheck(`${src_ref}`, "target");
        
        abilityLog(`✅ ${srcRefToText(src_ref)} untargeted.`);
        
        // feedback
        return { msg: "Target cleared!", success: true };
    }
    
    /** PUBLIC
    Get Target
    get the target for anything
    **/
    this.getTarget = async function(src_ref) {
        let srcType = srcToType(src_ref);
        let srcVal = srcToValue(src_ref);
        switch(srcType) {
            case "player":
                return getPlayerTarget(srcVal);
            break;
            case "player_attr":
                let attr = await roleAttributeGetPlayer(srcVal);
                return getAttributeTarget(attr.ai_id);
            break;
            case "group":
                return getGroupTarget(srcVal);
            break;
            case "poll":
                return getPollTarget(srcVal);
            break;
            case "attribute":
                return getAttributeTarget(srcVal);
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
    async function setTarget(src_ref, target) {
        let srcType = srcToType(src_ref);
        let srcVal = srcToValue(src_ref);
        switch(srcType) {
            case "player":
                return setPlayerTarget(srcVal, target);
            break;
            case "player_attr":
                let attr = await roleAttributeGetPlayer(srcVal);
                return setAttributeTarget(attr.ai_id, target);
            break;
            case "group":
                return setGroupTarget(srcVal, target);
            break;
            case "poll":
                return setPollTarget(srcVal, target);
            break;
            case "attribute":
                return setAttributeTarget(srcVal, target);
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
        return sqlPromEsc("UPDATE players SET target=" + connection.escape(target) + " WHERE id=", player_id);
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
        return sqlPromEsc("UPDATE active_groups SET target=" + connection.escape(target) + " WHERE channel_id=", channel_id);
    }
    
    /** PRIVATE
    Set Target Poll
    set the target for a poll
    **/
    function getPollTarget(name) {
        return new Promise(res => {
            sql("SELECT target FROM polls WHERE name=" + connection.escape(name), result => {
                res(result[0].target);
            });	
        });
    }
    
    /** PRIVATE
    Set Target Poll
    set the target for a poll
    **/
    function setPollTarget(name, target) {
        return sqlPromEsc("UPDATE polls SET target=" + connection.escape(target) + " WHERE name=", name);
    }
    
    /** PRIVATE
    Set Target Attribute
    set the target for an attribute
    **/
    function getAttributeTarget(ai_id) {
        return new Promise(res => {
            sql("SELECT target FROM active_attributes WHERE ai_id=" + connection.escape(ai_id), result => {
                res(result[0].target);
            });	
        });
    }
    
    /** PRIVATE
    Set Target Attribute
    set the target for an attribute
    **/
    function setAttributeTarget(ai_id, target) {
        return sqlPromEsc("UPDATE active_attributes SET target=" + connection.escape(target) + " WHERE ai_id=", ai_id);
    }
    
}
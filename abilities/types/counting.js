/**
    Abilities Module - Counting
    The module for implementing targeting
**/

module.exports = function() {

    /** PUBLIC
    Ability: Counting
    **/
    this.abilityCounting = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.counter_value) {
            abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
            return { msg: "Counting failed! " + abilityError, success: false };
        }
        // parse parameters
        let targetParsed = await parseSelector(ability.target, src_ref, additionalTriggerData);
        let num = await parseNumber(ability.counter_value);
        
        // can only target exactly one target
        if(targetParsed.value.length > 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to count for more than one target at a time!`);  
            return { msg: "Counting failed! " + abilityError, success: false };
        }
        if(targetParsed.value.length < 1) {
            abilityLog(`❗ **Error:** ${srcRefToText(src_ref)} tried to count for nobody!`);  
            return { msg: "Counting failed! " + abilityError, success: false };
        }
        
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Counting failed! " + abilityError, success: false };
            break;
            case "increment":
                result = await countingIncrement(src_name, src_ref, targetParsed.value[0], targetParsed.type, num);
                return result;
            break;
            case "decrement":
                result = await countingDecrement(src_name, src_ref, targetParsed.value[0], targetParsed.type, num);
                return result;
            breakset
            case "set":
                result = await countingSet(src_name, src_ref, targetParsed.value[0], targetParsed.type, num);
                return result;
            break;
        }
    }
    
    /** PRIVATE
    Ability: Counting - Set
    **/
    async function countingSet(src_name, src_ref, target, targetType, num) {
        // update counter
        await setCounter(`${targetType}:${target}`, num);
        
        abilityLog(`✅ ${srcRefToText(src_ref)} updated ${srcRefToText(targetType+':'+target)}'s counter to \`${num}\`.`);
        
        // feedback
        return { msg: "Counter updated!", success: true, target: `${targetType}:${target}` };
    }
    
    /** PRIVATE
    Ability: Counting - Increment
    **/
    async function countingIncrement(src_name, src_ref, target, targetType, num) {
        // get counter
        let counter = await getCounter(`${targetType}:${target}`);
        
        // incremented value
        let updatedVal = counter + num;
        
        // update counter
        await setCounter(`${targetType}:${target}`, updatedVal);
        
        abilityLog(`✅ ${srcRefToText(src_ref)} incremented ${srcRefToText(targetType+':'+target)}'s counter by \`${num}\` to \`${updatedVal}\`.`);
        
        // feedback
        return { msg: "Counter incremented!", success: true, target: `${targetType}:${target}` };
    }
    
    /** PRIVATE
    Ability: Counting - Decrement
    **/
    async function countingDecrement(src_name, src_ref, target, targetType, num) {
        // get counter
        let counter = await getCounter(`${targetType}:${target}`);
        
        // incremented value
        let updatedVal = counter - num;
        
        // update counter
        await setCounter(`${targetType}:${target}`, updatedVal);
        
        abilityLog(`✅ ${srcRefToText(src_ref)} decremented ${srcRefToText(targetType+':'+target)}'s counter by \`${num}\` to \`${updatedVal}\`.`);
        
        // feedback
        return { msg: "Counter decremented!", success: true, target: `${targetType}:${target}` };
    }

    
    /** PUBLIC
    Get Counter
    get the counter for anything
    **/
    this.getCounter = async function(target) {
        let srcType = srcToType(target);
        let srcVal = srcToValue(target);
        switch(srcType) {
            case "player":
                return getPlayerCounter(srcVal);
            break;
            case "player_attr":
                let attr = await roleAttributeGetPlayer(srcVal);
                return getAttributeCounter(attr.ai_id);
            break;
            case "group":
                return getGroupCounter(srcVal);
            break;
            case "poll":
                return getPollCounter(srcVal);
            break;
            default:
                abilityLog(`❗ **Error:** Unsupported type ${srcType} for counting!`);  
                return;
            break;
        }
    }
    
    /** PRIVATE
    Set Counter
    set the counter for anything
    **/
    async function setCounter(target, num) {
        let srcType = srcToType(target);
        let srcVal = srcToValue(target);
        switch(srcType) {
            case "player":
                return setPlayerCounter(srcVal, num);
            break;
            case "player_attr":
                let attr = await roleAttributeGetPlayer(srcVal);
                return setAttributeCounter(attr.ai_id, num);
            break;
            case "group":
                return setGroupCounter(srcVal, num);
            break;
            case "poll":
                return setPollCounter(srcVal, num);
            break;
            default:
                abilityLog(`❗ **Error:** Unsupported type ${srcType} for counting!`);  
                return;
            break;
        }
    }
    
    /** PRIVATE
    Set Counter Player
    set the counter for a player
    **/
    function getPlayerCounter(player_id) {
        return new Promise(res => {
            sql("SELECT counter FROM players WHERE id=" + connection.escape(player_id), result => {
                res(result[0].counter);
            });	
        });
    }
    
    /** PRIVATE
    Set Counter Player
    set the counter for a player
    **/
    function setPlayerCounter(player_id, num) {
        return sqlPromEsc("UPDATE players SET counter=" + connection.escape(num) + " WHERE id=", player_id);
    }
    
    /** PRIVATE
    Set Counter Group
    set the counter for a group
    **/
    function getGroupCounter(channel_id) {
        return new Promise(res => {
            sql("SELECT counter FROM active_groups WHERE channel_id=" + connection.escape(channel_id), result => {
                res(result[0].counter);
            });	
        });
    }
    
    /** PRIVATE
    Set Counter Group
    set the counter for a group
    **/
    function setGroupCounter(channel_id, num) {
        return sqlPromEsc("UPDATE active_groups SET counter=" + connection.escape(num) + " WHERE channel_id=", channel_id);
    }
    
    /** PRIVATE
    Set Counter Poll
    set the counter for a poll
    **/
    function getPollCounter(name) {
        return new Promise(res => {
            sql("SELECT counter FROM polls WHERE name=" + connection.escape(name), result => {
                res(result[0].counter);
            });	
        });
    }
    
    /** PRIVATE
    Set Counter Poll
    set the counter for a poll
    **/
    function setPollCounter(name, num) {
        return sqlPromEsc("UPDATE polls SET counter=" + connection.escape(num) + " WHERE name=", name);
    }
    
    /** PRIVATE
    Set Counter Attribute
    set the counter for an attribute
    **/
    function getAttributeCounter(ai_id) {
        return new Promise(res => {
            sql("SELECT counter FROM active_attributes WHERE ai_id=" + connection.escape(ai_id), result => {
                res(result[0].counter);
            });	
        });
    }
    
    /** PRIVATE
    Set Counter Attribute
    set the counter for an attribute
    **/
    function setAttributeCounter(ai_id, num) {
        return sqlPromEsc("UPDATE active_attributes SET counter=" + connection.escape(num) + " WHERE ai_id=", ai_id);
    }
    
}
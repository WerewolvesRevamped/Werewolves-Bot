/**
    Abilities Module - Emit
    The module for implementing emit
**/

module.exports = function() {
    
    var emitQueue = [];
    
    /** PUBLIC
    Ability: Emit
    **/
    this.abilityEmit = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.emit_value || !ability.selector) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Emit failed! " + abilityError, success: false };
        }
        
        // get target
        const targets = await parseSelector(ability.selector, src_ref, additionalTriggerData);
        const option = parseOption(ability.emit_value);
        
        for(let i = 0; i < targets.value.length; i++) {
            emitQueue.push([`${targets.type}:${targets.value[i]}`, "On Emitted", { emit_value: option }]);
            emitQueue.push([`${targets.type}:${targets.value[i]}`, "On Emitted Complex", { emit_value: option }]);
        }
        
        // feedback
        if(targets.value.length > 0) {
            return { msg: "", success: true, target: `${targets.type}:${targets.value[0]}` };
        } else {
            return { msg: "Emitting failed!", success: false };
        }
    }
    
    /** PUBLIC
    Process emit queue
    **/
    this.processEmitQueue = async function() {
        while(emitQueue.length > 0) {
            let thisTrigger = emitQueue.shift();
            await trigger(thisTrigger[0], thisTrigger[1], thisTrigger[2]);
        }
    }
    
}
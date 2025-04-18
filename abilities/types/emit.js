/**
    Abilities Module - Emit
    The module for implementing emit
**/

module.exports = function() {
    
    var emitQueue = [];
    
    /** PUBLIC
    Ability: Emit
    **/
    this.abilityEmitting = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.emit_value || !ability.selector) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Emitting failed! " + abilityError, success: false };
        }
        
        // get target
        const targets = await parseSelector(ability.selector, src_ref, additionalTriggerData);
        const option = parseOption(ability.emit_value);
        
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Emitting failed! " + abilityError, success: false };
            break;
            case "immediate":        
                for(let i = 0; i < targets.value.length; i++) {
                    emitQueue.push([`${targets.type}:${targets.value[i]}`, "On Emitted", { emit_value: option }]);
                    emitQueue.push([`${targets.type}:${targets.value[i]}`, "On Emitted Complex", { emit_value: option }]);
                }
            break;
            case "end":
                for(let i = 0; i < targets.value.length; i++) {
                    emitQueue.push([`${targets.type}:${targets.value[i]}`, "On End Emitted", { emit_value: option }]);
                    emitQueue.push([`${targets.type}:${targets.value[i]}`, "On End Emitted Complex", { emit_value: option }]);
                }
            break;
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
/**
    Abilities Module - Process Evaluate
    The module for implementing process/evaluate
**/

module.exports = function() {

    /** PUBLIC
    Ability: Targeting
    **/
    this.abilityProcessEvaluate = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.process || !ability.evaluate) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Process/Evaluate failed! " + abilityError, success: false };
        }
        
        // extract original p/e abilities
        const process = ability.process.sub_abilities;
        const evaluate  = ability.evaluate.sub_abilities;
        
        abilityLog(`✳️ **Processing**`);
        // run all process abilities
        let results = [];
        for(let i = 0; i < process.length; i++) {
            let result = await executeAbility(src_ref, src_name, process[i].ability, [], additionalTriggerData);
            results.push(result);
        }
        
        // populate result selectors
        for(let i = 0; i < results.length; i++) {
            additionalTriggerData["result" + i] = results[i];
        }
        additionalTriggerData.result = results[0];
        
        
        abilityLog(`✳️ **Evaluating**`);
        // run all evaluate abilities
        for(let i = 0; i < evaluate.length; i++) {
            let condition = evaluate[i].condition;
            let condTxt = evaluate[i].condition_text;
            let condBool = await parseCondition(condition, src_ref, src_name, additionalTriggerData);
            if(condBool) {
                abilityLog(`▶️ **Entering Branch:** ${condTxt}`);
                let result = await executeAbility(src_ref, src_name, evaluate[i].ability, [], additionalTriggerData);
                return result;
            } else {
                abilityLog(`◀️ **Skipping Branch:** ${condTxt}`);
            }
        }
        
        abilityLog(`▶️ **Entering Branch:** Failure (Default)`);
        // if no evaluate conditions matched, a failure is implied
        return { msg: "Process/Evaluate failed!", success: false };
    }
    
    /** PRIVATE
    parse condition
    we pass all data as it may be necessary for selectors
    **/
    async function parseCondition(condition, src_ref, src_name, additionalTriggerData) {
        // check parameters
        if(!condition.type) {
            abilityLog(`❗ **Error:** Missing type for condition!`);
            return false;
        }
        // switch by condition type
        const type = condition.type;
        switch(type) {
            // DEFAULT
            default:
                abilityLog(`❗ **Error:** Unknown condition type \`${type}\`!`);
                return false;
            // COMPARISON
            case "comparison":
                if(!condition.first || !condition.second) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${type}\`!`);
                    return false;
                }
                const first = await parseSelector(condition.first, src_ref, additionalTriggerData);
                const second = await parseSelector(condition.second, src_ref, additionalTriggerData);
                switch(condition.subtype) {
                    // COMPARISON - EQUAL
                    case "equal":
                        if(first.type === second.type) { // same type, do direct type comparison
                            return first.value === second.value;
                        } else if(first.type === "result" && second.type === "success") {
                            return first.value.success === second.value;
                        } else if(first.type === "success" && second.type === "result") {
                            return first.value === second.value.success;
                        }
                        // no comparison can be made
                        return false;
                    break;
                }
            
            break;
        }
    }
    
    
}
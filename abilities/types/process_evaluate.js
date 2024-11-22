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
        let doNotRecheckRestriction = false;
        for(let i = 0; i < process.length; i++) {
            let result = await executeAbility(src_ref, src_name, process[i].ability, [], additionalTriggerData, doNotRecheckRestriction);
            if(result) doNotRecheckRestriction = true;
            results.push(result);
        }
        
        // populate result selectors
        for(let i = 0; i < results.length; i++) {
            additionalTriggerData["result" + (i+1)] = results[i];
        }
        additionalTriggerData.result = results[0];
        
        
        abilityLog(`✳️ **Evaluating**`);
        // run all evaluate abilities
        for(let i = 0; i < evaluate.length; i++) {
            let condition = evaluate[i].condition;
            let condTxt = evaluate[i].condition_text;
            let condBool = await resolveCondition(condition, src_ref, src_name, additionalTriggerData);
            if(condBool) { // enter final branch
                abilityLog(`▶️ **Entering Branch:** ${condTxt}`);
                let result = await executeAbility(src_ref, src_name, evaluate[i].ability, [], additionalTriggerData, doNotRecheckRestriction);
                if(result) return result; // if no result CONTINUE
            } else if(condition.type === "always") { // additionally enter always branch
                abilityLog(`▶️ **Always Branch:**`);
                let result = await executeAbility(src_ref, src_name, evaluate[i].ability, [], additionalTriggerData, doNotRecheckRestriction);
                if(result) doNotRecheckRestriction = true;
            } else { // skip branch
                abilityLog(`◀️ **Skipping Branch:** ${condTxt}`);
            }
        }
        
        abilityLog(`▶️ **Entering Branch:** Failure (Default)`);
        // if no evaluate conditions matched, a failure is implied
        return { msg: "", success: false };
    }
    
    /** PUBLIC
    Ability: Abilities
    **/
    this.abilityAbilities = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.sub_abilities) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Abilities failed! " + abilityError, success: false };
        }
        
        // extract abilities
        const abilities = ability.sub_abilities;
        
        // run all process abilities
        let results = [];
        let doNotRecheckRestriction = false;
        for(let i = 0; i < abilities.length; i++) {
            let result = await executeAbility(src_ref, src_name, abilities[i], [], additionalTriggerData, doNotRecheckRestriction);
            if(result) doNotRecheckRestriction = true;
            results.push(result);
        }

        let lastResult = results[results.length - 1];
        if(!lastResult) return null;
        // if no evaluate conditions matched, a failure is implied
        return { msg: lastResult.msg, success: lastResult.success };
    }
    
    /** PUBLIC
    parse condition
    we pass all data as it may be necessary for selectors
    **/
    this.resolveCondition = async function (condition, src_ref, src_name, additionalTriggerData) {
        // check parameters
        if(!condition.type) {
            abilityLog(`❗ **Error:** Missing type for condition!`);
            return false;
        }
        // switch by condition type
        const type = condition.type;
        switch(type) {
            // DEFAULT
            default: {
                abilityLog(`❗ **Error:** Unknown condition type \`${type}\`!`);
                return false;
            }
            // ALWAYS
            case "always": {
                return false;
            }
            // OTHERWISE
            case "otherwise": {
                return true;
            }
            // COMPARISON
            case "comparison": {
                if(!condition.subtype || !condition.first || !condition.second) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${type}\`!`);
                    return false;
                }
                const first = await parseSelector(condition.first, src_ref, additionalTriggerData);
                const second = await parseSelector(condition.second, src_ref, additionalTriggerData);
                
                console.log("FIRST", condition.first, first.type, first.value[0]);
                console.log("SECOND", condition.second, second.type, second.value[0]);
                
                // switch by subtype
                switch(condition.subtype) {
                    default:
                        abilityLog(`❗ **Error:** Unknown condition subtype \`${condition.subtype}\`!`);
                        return false;
                    // COMPARISON - EQUAL
                    case "equal":
                        if(first.type === second.type) { // same type, do direct type comparison
                            return first.value[0] === second.value[0];
                        } else if(first.type === "result" && second.type === "success") {
                            return first.value[0].success === second.value[0];
                        } else if(first.type === "success" && second.type === "result") {
                            return first.value[0] === second.value[0].success;
                        } else if(first.type === "number" && second.type === "result") {
                            return first.value[0] === (await parseNumber(second.value[0].result, src_ref, additionalTriggerData));
                        } else if(first.type === "result" && second.type === "number") {
                            return (await parseNumber(first.value[0].result, src_ref, additionalTriggerData)) === second.value[0];
                        } else if(first.type === "result" && second.type === "role") {
                            return first.value[0].role === second.value[0];
                        } else if(first.type === "role" && second.type === "result") {
                            return first.value[0] === second.value[0].role;
                        } else if(first.type === "result" && second.type === "class") {
                            return first.value[0].class === second.value[0];
                        } else if(first.type === "class" && second.type === "result") {
                            return first.value[0] === second.value[0].class;
                        } else if(first.type === "result" && second.type === "category") {
                            return first.value[0].category === second.value[0];
                        } else if(first.type === "category" && second.type === "result") {
                            return first.value[0] === second.value[0].category;
                        } else if(first.type === "result" && second.type === "alignment") {
                            return first.value[0].alignment === second.value[0];
                        } else if(first.type === "alignment" && second.type === "result") {
                            return first.value[0] === second.value[0].alignment;
                        } 
                        // no comparison can be made
                        return false;
                    // COMPARISON - LESS THAN
                    case "less_than":
                        if(first.type === second.type && first.type === "number") { // same type, do direct type comparison
                            return first.value[0] < second.value[0];
                        } else if(first.type === "number" && second.type === "result") {
                            return first.value[0] < (await parseNumber(second.value[0].result, src_ref, additionalTriggerData));
                        }else if(first.type === "result" && second.type === "number") {
                            return (await parseNumber(first.value[0].result, src_ref, additionalTriggerData)) < second.value[0];
                        }
                        // no comparison can be made
                        return false;
                    // COMPARISON - GREATER THAN
                    case "greater_than":
                        if(first.type === second.type && first.type === "number") { // same type, do direct type comparison
                            return first.value[0] > second.value[0];
                        } else if(first.type === "number" && second.type === "result") {
                            return first.value[0] > (await parseNumber(second.value[0].result, src_ref, additionalTriggerData));
                        } else if(first.type === "result" && second.type === "number") {
                            return (await parseNumber(first.value[0].result, src_ref, additionalTriggerData)) > second.value[0];
                        }
                        // no comparison can be made
                        return false;
                    // COMPARISON - NOT EQUAL
                    case "not_equal":
                        let conditionCopy = deepCopy(condition); // deep clone
                        conditionCopy.subtype = "equal";
                        let condBool = await resolveCondition(conditionCopy, src_ref, src_name, additionalTriggerData);
                        return !condBool;
                }
            }
            // LOGIC
            case "logic": {
                if(!condition.subtype) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${type}\`!`);
                    return false;
                }
                
                let condBool1, condBool2;
                // switch by subtype
                switch(condition.subtype) {
                    default:
                        abilityLog(`❗ **Error:** Unknown condition subtype \`${condition.subtype}\`!`);
                        return false;
                    // LOGIC - NOT
                    case "not":
                        if(!condition.condition) {
                            abilityLog(`❗ **Error:** Missing arguments for subtype \`${condition.subtype}\`!`);
                            return false;
                        }
                        condBool1 = await resolveCondition(condition.condition, src_ref, src_name, additionalTriggerData);
                        return !condBool1;
                    // LOGIC - AND
                    case "and":
                        if(!condition.condition1 || !condition.condition2) {
                            abilityLog(`❗ **Error:** Missing arguments for subtype \`${condition.subtype}\`!`);
                            return false;
                        }
                        condBool1 = await resolveCondition(condition.condition1, src_ref, src_name, additionalTriggerData);
                        condBool2 = await resolveCondition(condition.condition2, src_ref, src_name, additionalTriggerData);
                        return condBool1 && condBool2;
                    // LOGIC - OR
                    case "or":
                        if(!condition.condition1 || !condition.condition2) {
                            abilityLog(`❗ **Error:** Missing arguments for subtype \`${condition.subtype}\`!`);
                            return false;
                        }
                        condBool1 = await resolveCondition(condition.condition1, src_ref, src_name, additionalTriggerData);
                        condBool2 = await resolveCondition(condition.condition2, src_ref, src_name, additionalTriggerData);
                        return condBool1 || condBool2;
                }
            }
            // EXISTENCE
            case "existence": {
                if(!condition.target) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${type}\`!`);
                    return false;
                }
                let targets = await parseSelector(condition.target, src_ref, additionalTriggerData);
                //console.log("EXISTENCE", condition.target, targets);
                return (targets.value.length > 0);
            }
            // ATTRIBUTE
            case "attribute": {
                if(!condition.target || !condition.attribute) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${type}\`!`);
                    return false;
                }
                let targets = await parseSelector(condition.target, src_ref, additionalTriggerData);
                let attribute = parseAttributeSelector(condition.attribute, src_ref, additionalTriggerData);
                for(let i = 0; i < targets.value.length; i++) {
                    let bool = hasCustomAttribute(`${targets.type}:${targets.value[i]}`, attribute);
                    if(targets.type === "player") { // additionally check for role attribute
                        let hasRA = await playerHasRoleAttribute(targets.value[i], attribute);
                        if(hasRA) bool = true;
                    }
                    if(!bool) return false;
                }
                return true;
            }
            // SELECTOR
            case "selector": {
                if(!condition.target || !condition.selector) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${type}\`!`);
                    return false;
                }
                let targets = await parseSelector(condition.target, src_ref, additionalTriggerData);
                let selector = await parseSelector(condition.selector, src_ref, additionalTriggerData);
                if(targets.type != selector.type) return false;
                for(let i = 0; i < targets.value.length; i++) {
                    let bool = selector.value.includes(targets.value[i]);
                    if(!bool) return false;
                }
                return true;
            }
            // MEMBERSHIP
            case "membership": {
                if(!condition.target || !condition.group) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${type}\`!`);
                    return false;
                }
                let targets = await parsePlayerSelector(condition.target, src_ref, additionalTriggerData);
                let group = await parseGroupName(selectorGetTarget(condition.group));
                if(cachedGroups.indexOf(group) === -1) return false;
                for(let i = 0; i < targets.length; i++) {
                    let attrs = await queryAttributePlayer(targets[i], "attr_type", "group_membership", "val1", group);
                    console.log(attrs);
                    if(attrs.length <= 0) return false;
                }
                return true;
            }
        }
    }
    
    
}
/**
    Abilities Module - For Each
    The module for implementing for each
**/

module.exports = function() {
    
    /** PUBLIC
    Ability: For Each
    **/
    this.abilityForEach = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.sub_abilities) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "For Each failed! " + abilityError, success: false };
        }
        
        // extract abilities
        const abilities = ability.sub_abilities;
        
        // get selecto members
        const targets = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        
        // run all process abilities
        let results = [];
        for(let i = 0; i < abilities.length; i++) {
            for(let j = 0; j < targets.length; j++) {
                let additionalTriggerDataCopy = deepCopy(additionalTriggerData);
                additionalTriggerDataCopy.ind = targets[j];
                
                if(abilities[i].condition) { // HAS CONDITION
                    let condition = abilities[i].condition;
                    let condTxt = abilities[i].condition_text;
                    let condBool = await resolveCondition(condition, src_ref, src_name, additionalTriggerDataCopy);
                    if(condBool) { // enter final branch
                        abilityLog(`▶️ **Entering Branch:** ${condTxt}`);
                        let result = await executeAbility(src_ref, src_name, abilities[i].ability, [], additionalTriggerDataCopy);
                        return result;
                    } else if(condition.type === "always") { // additionally enter always branch
                        abilityLog(`▶️ **Always Branch:**`);
                        await executeAbility(src_ref, src_name, abilities[i].ability, [], additionalTriggerDataCopy);
                    } else { // skip branch
                        abilityLog(`◀️ **Skipping Branch:** ${condTxt}`);
                    }
                } else { // DOES NOT HAVE CONDITION
                    let result = await executeAbility(src_ref, src_name, abilities[i].ability, [], additionalTriggerDataCopy);
                    results.push(result);
                }
            }
        }

        let lastResult = results[results.length - 1];
        return { msg: lastResult.msg, success: lastResult.success };
    }
    

    
}
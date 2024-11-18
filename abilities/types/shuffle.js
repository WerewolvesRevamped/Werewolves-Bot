/**
    Abilities Module - Shuffle
    The module for implementing shuffling
**/

module.exports = function() {

    /** PUBLIC
    Ability: Shuffle
    **/
    this.abilityShuffle = async function(src_ref, src_name, ability, additionalTriggerData) {
        if(!ability.targets) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Shuffling failed! " + abilityError, success: false };
        }
        
        // parse all targets
        let parsedTargets = [];
        let parsedTargetsText = [];
        let type = null;
        for(let i = 0; i < ability.targets.length; i++) {
            let targetParsed = await parseSelector(ability.targets[i], src_ref, additionalTriggerData);
            parsedTargets.push(...targetParsed.value);
            type = targetParsed.type;
            parsedTargetsText.push(...(targetParsed.value.map(el => srcRefToText(`${targetParsed.type}:${el}`, el))));
        }
        
        let shuffled = shuffleArray(parsedTargets);
        let shuffledText = shuffleArray(parsedTargetsText);
        
        return { msg: shuffledText.join(", "), success: true, result: shuffled[0], target: `${type}:${shuffled[0]}`, role: shuffled[0] }
    }
    
}
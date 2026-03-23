/**
    Abilities Module - Formatting
    The module for implementing formatting
**/

module.exports = function() {

    /** PUBLIC
    Ability: Formatting
    **/
    this.abilityFormatting = async function(src_ref, src_name, ability, additionalTriggerData) {
        if(!ability.target || !ability.format) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Shuffling failed! " + abilityError, success: false };
        }
        
        // parse all targets
        let targetParsed = await parseSelector(ability.target, src_ref, additionalTriggerData);
        if(ability.split_by) {
            targetParsed = {
                type: ability.split_type,
                value: srcRefToText(`${targetParsed.type}:${targetParsed.value[0]}`, targetParsed.value[0]).split(ability.split_by)
            }
        }
        
        
        let targetText = targetParsed.value.map(el => {
            let mainText = srcRefToText(`${targetParsed.type}:${el}`, el);
            if(targetParsed.type === "player") {
                mainText = idToEmoji(el) + " " + mainText;
            } else if(targetParsed.type === "role") {
                mainText = getEmoji(el) + " " + mainText;
            }
            return mainText;
        });
        
        let output = "";
        for(let i = 0; i < targetParsed.value.length; i++) {
            let txt = ability.format;
            txt = txt.replace(/\$/g, targetText[i]);
            txt = txt.replace(/\\n/g, "\n");
            output += txt;
        }
        
        return { msg: output, success: true, target: `string:${output}` }
    }
    
}
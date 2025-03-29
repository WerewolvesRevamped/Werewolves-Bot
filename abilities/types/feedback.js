/**
    Abilities Module - Feedback
    The module for implementing feedback
**/

module.exports = function() {

    /** PUBLIC
    Ability: Feedback
    **/
    this.abilityFeedback = async function(src_ref, src_name, ability, additionalTriggerData) {
        if(!ability.feedback) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Feedback failed! " + abilityError, success: false };
        }
        
        // handle visit
        if(additionalTriggerData.parameters.visitless !== true) {
            let fail = await visitObstructionFailureCheck(src_ref, "feedback");
            if(fail) return { msg: "Ability failed!", success: false };
        }
        
        // parse info
        let info = await parseInfo(ability.feedback, src_ref, additionalTriggerData);
        return { msg: info, success: true };
    }
    
}
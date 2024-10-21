/**
    Abilities Module - Cancel
    The module for implementing cancelling
**/

module.exports = function() {
    
    /**
    Ability: Cancel
    **/
    this.abilityCancel = async function(src_ref, src_name, ability, additionalTriggerData) {
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Cancelling failed! " + abilityError, success: false };
            break;
            case "direct":
                cancelledVisits.push(additionalTriggerData.visit_id);
                cancelledVisitsFeedback.push({id: additionalTriggerData.visit_id, type: "failure" });
                return { msg: "Ability cancelled!", success: true };
            break;
            case "with":
                // check parameters
                if(!ability.cancel_with) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                    return { msg: "Cancelling failed! " + abilityError, success: false };
                }
                let cancel_with = await parseInfo(ability.cancel_with, src_ref, additionalTriggerData);
                cancelledVisits.push(additionalTriggerData.visit_id);
                cancelledVisitsFeedback.push({id: additionalTriggerData.visit_id, type: "with", msg: cancel_with });
                return { msg: "Ability cancelled!", success: true };
            break;
            case "success":
                cancelledVisits.push(additionalTriggerData.visit_id);
                cancelledVisitsFeedback.push({id: additionalTriggerData.visit_id, type: "success" });
                return { msg: "Ability cancelled!", success: true };
            break;
        }
        
    }
    
}
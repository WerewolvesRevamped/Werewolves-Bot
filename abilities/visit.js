/**
    Abilities Module - Visit
    The module for implementing visiting
**/

module.exports = function() {
    
    /**
    Visit
    **/
    this.visitId = 0;
    this.cancelledVisits = [];
    this.cancelledVisitsFeedback = []
    this.visit = async function(sourcePlayerAny, targetPlayerAny, visitParameter, abilityType, abilitySubtype) {
        // allow both direct id types as well as player:<id> format
        let sourcePlayerSplit = sourcePlayerAny.split(":");
        let sourcePlayer = sourcePlayerSplit.length === 2 ? sourcePlayerSplit[1] : sourcePlayerAny;
        let sourcePlayerLong = sourcePlayerSplit.length === 2 ? sourcePlayerAny : `unknown:` + sourcePlayerSplit[0];
        let targetPlayerSplit = targetPlayerAny.split(":");
        let targetPlayer = targetPlayerSplit.length === 2 ? targetPlayerSplit[1] : targetPlayerAny;
        let targetPlayerLong = targetPlayerSplit.length === 2 ? targetPlayerAny : `unknown:` + targetPlayerSplit[0];
        
        // increment visitid
        visitId++;
        let thisVisitId = visitId;
        
        // run triggers
        await triggerPlayer(targetPlayerAny, "On Visited", { visitor: sourcePlayerLong, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
        await triggerPlayer(targetPlayerAny, "On Visited Complex", { visitor: sourcePlayerLong, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
        await triggerHandler("On Visited Target Complex", { visitor: sourcePlayerLong, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, this: targetPlayerLong, visit_id: visitId }); 
        
        // check if is canceled
        if(cancelledVisits.includes(thisVisitId)) {
            let feedback = cancelledVisitsFeedback.find(el => el.id === thisVisitId);
            // different kinds of cancellation
            switch(feedback.type) {
                default:
                case "failure": return { msg: null, success: false };
                case "success": return { msg: null, success: true };
                case "with": return { msg: feedback.msg, success: false };
            }
        }
        
        return null;
    }
    
    /**
    Visit Return
    **/
    this.visitReturn = function(visitResult, defaultError, defaultSuccess) {
        if(visitResult.success) return { msg: defaultSuccess, success: true };
        else if(visitResult.msg) return { msg: visitResult.msg, success: false };
        else return { msg: defaultError, success: false };
    }
    
}
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
    this.visit = async function(sourcePlayerAny, targetPlayerAny, visitParameter, abilityType, abilitySubtype, templateMessage = null) {
        console.log("Visit", sourcePlayerAny, targetPlayerAny, visitParameter, abilityType, abilitySubtype);
        // allow both direct id types as well as player:<id> format
        let sourcePlayerSplit = sourcePlayerAny.split(":");
        let sourcePlayer = sourcePlayerSplit.length === 2 ? sourcePlayerSplit[1] : sourcePlayerAny;
        let sourcePlayerLong = sourcePlayerSplit.length === 2 ? sourcePlayerAny : `unknown:` + sourcePlayerSplit[0];
        let targetPlayerSplit = targetPlayerAny.split(":");
        let targetPlayer = targetPlayerSplit.length === 2 ? targetPlayerSplit[1] : targetPlayerAny;
        let targetPlayerLong = targetPlayerSplit.length === 2 ? targetPlayerAny : `unknown:` + targetPlayerSplit[0];
        
        // no visit to self
        if(sourcePlayer === targetPlayer) return null;
        
        // get all living ids; check if both are players and alive
        let living = await getAllLivingIDs();
        if(!living.includes(sourcePlayer)) return null;
        if(!living.includes(targetPlayer)) return null;
        
        // increment visitid
        visitId++;
        let thisVisitId = visitId;
        
        // check for obstruction
        let obstructions = await getObstructions(sourcePlayer);
        obstruction: for(let i = 0; i < obstructions.length; i++) {
            let matchesType = obstructions[i].val1 === "" || obstructions[i].val1 === abilityType;
            let matchesSubtype = obstructions[i].val2 === "" || obstructions[i].val2 === abilitySubtype;
            console.log(matchesType, matchesSubtype, abilityType, abilitySubtype, obstructions[i].val1, obstructions[i].val2);
            // check if obstruction type matches
            if(matchesType && matchesSubtype) {
                // no custom feedback; return failure
                if(obstructions[i].val3 === "") {
                    return { msg: null, success: false };
                } else { // custom feedback; evaluate chances
                    let customFeedback = JSON.parse(obstructions[i].val3);
                    let rand = Math.random();
                    let acc = 0;
                    // iterate through custom feedback options
                    for(let j = 0; j < customFeedback.length; j++) {
                        // check if this result should be used
                        acc += customFeedback[j].chance;
                        if(rand < acc) {
                            if(customFeedback[j].feedback === "@Result") {
                                abilityLog(`✅ <@${sourcePlayer}> was obstructed (${Math.round(rand*100)/100}): default result.`);
                                break obstruction;
                            }
                            // overwrite with custom result
                            abilityLog(`✅ <@${sourcePlayer}> was obstructed (${Math.round(rand*100)/100}): \`${customFeedback[j].feedback}\`.`);
                            if(templateMessage) {
                                let feedback = templateMessage.replace(/\%1/g, customFeedback[j].feedback);
                                return { msg: feedback, success: true };
                            } else {
                                return { msg: customFeedback[j].feedback, success: true };
                            }
                        }
                    }
                }
            }
        }
        
        // run triggers
        await triggerPlayer(targetPlayerAny, "On Visited", { visitor: sourcePlayerLong, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
        await triggerPlayer(targetPlayerAny, "On Visited Complex", { visitor: sourcePlayerLong, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
        await triggerHandler("On Visited Target Complex", { visitor: sourcePlayerLong, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, this: targetPlayer, visit_id: visitId }); 
        
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
        if(!visitResult.msg) {
            if(visitResult.success) return { msg: defaultSuccess, success: true };
            else return { msg: defaultError, success: false };
        } else {
            if(visitResult.success) return { msg: visitResult.msg, success: true };
            else return { msg: visitResult.msg, success: false };
        }
    }
    
}
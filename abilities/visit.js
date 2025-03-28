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
        if(targetPlayerAny == null || sourcePlayerAny == null) {
            return null; // not really a visit if there is one of those two doesnt exist
        }
        // allow both direct id types as well as player:<id> format
        let sourcePlayerSplit = sourcePlayerAny.split(":");
        let sourcePlayer = sourcePlayerSplit.length === 2 ? sourcePlayerSplit[1] : sourcePlayerAny;
        let targetPlayerSplit = targetPlayerAny.split(":");
        let targetPlayer = targetPlayerSplit.length === 2 ? targetPlayerSplit[1] : targetPlayerAny;
        
        // convert extra role channel ids to player ids
        if(sourcePlayerSplit[0] === "player_attr") {
            let attr = await roleAttributeGetPlayer(sourcePlayer);
            if(!attr || !attr.id) return null; // no visit if source attribute has since then been deleted
            sourcePlayer = attr.id;
        }
        if(targetPlayerSplit[0] === "player_attr") {
            let attr = await roleAttributeGetPlayer(targetPlayer);
            if(!attr || !attr.id) return null; // no visit if target attribute has since then been deleted
            targetPlayer = attr.id;
        }
        
        // no visit to self
        if(sourcePlayer === targetPlayer) return null;
        
        // get all living ids; check if both are players and alive
        let living = await getAllLivingIDs();
        let dead = await getAllDeadIDs();
        let sourceIsPlayer = true, targetIsPlayer = true, sourceIsAlive = true, targetIsAlive = true;
        if(!living.includes(sourcePlayer)) sourceIsAlive = false;
        if(!living.includes(targetPlayer)) targetIsAlive = false;
        if(!sourceIsAlive && !dead.includes(sourcePlayer)) sourceIsPlayer = false;
        if(!targetIsAlive && !dead.includes(targetPlayer)) targetIsPlayer = false;
        
        // increment visitid
        visitId++;
        let thisVisitId = visitId;
        
        // check for obstruction
        if(sourceIsPlayer) {
            let obstructions = await getObstructions(sourcePlayer);
            obstruction: for(let i = 0; i < obstructions.length; i++) {
                let matchesType = obstructions[i].val1 === "" || obstructions[i].val1 === abilityType;
                let matchesSubtype = obstructions[i].val2 === "" || obstructions[i].val2 === abilitySubtype;
                console.log(obstructions[i].attr_type, matchesType, matchesSubtype, abilityType, abilitySubtype, obstructions[i].val1, obstructions[i].val2);
                // check if obstruction type matches
                if((matchesType && matchesSubtype) ^ (obstructions[i].attr_type === "obstruction_inverted")) {
                    // no custom feedback; return failure
                    if(obstructions[i].val3 === "") {
                        abilityLog(`✅ <@${sourcePlayer}> was obstructed: failure.`);
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
                                    return { msg: feedback, success: true, role: customFeedback[j].feedback, class: customFeedback[j].feedback, category: customFeedback[j].feedback, alignment: customFeedback[j].feedback };
                                } else {
                                    return { msg: customFeedback[j].feedback, success: true, class: customFeedback[j].feedback, category: customFeedback[j].feedback, alignment: customFeedback[j].feedback };
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // run triggers
        if(sourceIsPlayer && targetIsPlayer) {
            await triggerPlayer(targetPlayer, "On Visited", { visitor: sourcePlayer, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
            await triggerPlayer(targetPlayer, "On Visited Complex", { visitor: sourcePlayer, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
            await triggerPlayer(targetPlayer, "On Visited Inverted Complex", { visitor: sourcePlayer, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
            await triggerHandler("On Visited Target Complex", { visitor: sourcePlayer, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, this: targetPlayer, visit_id: visitId });
            await triggerHandler("On Visited Target Inverted Complex", { visitor: sourcePlayer, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, this: targetPlayer, visit_id: visitId });
        } else if(targetIsPlayer) {
            await triggerPlayer(targetPlayer, "On Visited", { visitor: null, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
            await triggerPlayer(targetPlayer, "On Visited Complex", { visitor: null, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
            await triggerPlayer(targetPlayer, "On Visited Inverted Complex", { visitor: null, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, visit_id: visitId }); 
            await triggerHandler("On Visited Target Complex", { visitor: null, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, this: targetPlayer, visit_id: visitId });    
            await triggerHandler("On Visited Target Inverted Complex", { visitor: null, visit_parameter: visitParameter, visit_type: abilityType, visit_subtype: abilitySubtype, this: targetPlayer, visit_id: visitId });    
        }
        
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
        let res = visitResult;
        if(!visitResult.msg) {
            if(visitResult.success) {
                res.msg = defaultSuccess;
                return res;
            } else {
                res.msg = defaultError;
                res.success = false;
                return res;
            }
        } else {
            return res;
        }
    }
    
}
/**
    Abilities Module - Restrictions
    The module for implementing trigger restrictions
**/
module.exports = function() {
    
    /**
    globals
    **/
    this.RESTR_PRE = true; // for evaluation of restrictions pre-prompting
    this.RESTR_POST = false; // for evaluation of restrictions post-prompting
    
    /**
    Handle Restrictions
    apply ability restrictions
    **/
    this.handleRestriction = async function(src_ref, ability, restriction, prePrompt, target = null, additionalTriggerData = {}) {
        switch(restriction.type) {
            // UNKNOWN
            default: 
                abilityLog(`❗ **Error:** Unknown restriction type \`${restriction.type}\`!`);
                return false;
            break;
            // TEMPORAL
            case "temporal":
                switch(restriction.subtype) {
                    default: 
                        abilityLog(`❗ **Error:** Unknown restriction subtype \`${restriction.subtype}\`!`);
                        return false;
                    break;
                    // TEMPORAL - AFTER
                    case "after":
                        // check if current phase is equal or higher than specified phase
                        if(getPhaseAsNumber() >= getPhaseAsNumber(restriction.phase)) {
                            return true;
                        } else {
                            return false;
                        }
                    break;
                    // TEMPORAL - DURING
                    case "during":
                        // check if current phase is equal or higher than specified phase
                        if(getPhaseAsNumber() === getPhaseAsNumber(restriction.phase)) {
                            return true;
                        } else {
                            return false;
                        }
                    break;
                    // TEMPORAL - DURING TYPE
                    case "during_type":
                        // check if current phase is equal or higher than specified phase
                        let checkForNight = restriction.phase === "night";
                        let isn = isNight();
                        if(checkForNight === isn) {
                            return true;
                        } else {
                            return false;
                        }
                    break;
                }
                return true;
            break;
            // SUCCESSION
            case "succession":
                switch(restriction.subtype) {
                    default: 
                        abilityLog(`❗ **Error:** Unknown restriction subtype \`${restriction.subtype}\`!`);
                        return false;
                    break;
                    // SUCCESSION - DEFAULT
                    case "default":
                        let lastPhase = await getLastPhase(src_ref, ability);
                        // check if current phase is at least 2 higher than the phase the ability was last used in
                        if(getPhaseAsNumber() >= lastPhase+2) {
                            return true;
                        } else {
                            return false;
                        }
                    break;
                    // SUCCESSION - TARGET
                    case "target":
                        // cannot be evaluated pre-prompt: always true
                        if(prePrompt) {
                            return true;
                        }
                        // check if target exists
                        if(!target) {
                            return true; // restriction application not applicable without target
                        }
                        // actual evaluation
                        console.log("SUCC START");
                        let lt = await getLastTarget(src_ref, ability);
                        let lastTarget = lt ? await parseSelector(lt, src_ref, additionalTriggerData) : null;
                        let targets = await parseSelector(target, src_ref, additionalTriggerData);
                        console.log("SUCC END");
                        // check if last target is included in the target selector
                        if(!lastTarget || !lastTarget.value || !lastTarget.value[0] || !targets.value.includes(lastTarget.value[0])) {
                            return true;
                        } else {
                            return false;
                        }
                    break;
                }
                return true;
            break;
            // QUANTITY
            case "quantity":
                let quantity = await getActionQuantity(src_ref, ability);
                let max_allowed = await parseNumber(restriction.quantity, src_ref, additionalTriggerData);
                if(+max_allowed <= 0) return true;
                if(quantity < +max_allowed) return true;
                else return false;
            break;
            // CONDITION
            case "condition":
                // cannot be evaluated pre-prompt: always true
                if(prePrompt) {
                    return true;
                } else {
                    return resolveCondition(restriction.condition, src_ref, additionalTriggerData);
                }
            break;
            // PRECONDITION
            case "precondition":
                return resolveCondition(restriction.condition, src_ref, additionalTriggerData);
            break;
            // ATTRIBUTE
            case "attribute":
                // cannot be evaluated pre-prompt: always true
                if(prePrompt && (restriction.target.toLowerCase().includes("@selection") || restriction.target.toLowerCase().includes("@secondaryselection"))) {
                    return true;
                } else {
                    let targets = await parseSelector(restriction.target, src_ref, additionalTriggerData);
                    let attribute = parseAttributeSelector(restriction.attribute, src_ref, additionalTriggerData);
                    // switch by subtype
                    switch(restriction.subtype) {
                        default:
                            abilityLog(`❗ **Error:** Unknown restriction subtype \`${restriction.subtype}\`!`);
                            return false;
                        // ATTRIBUTE - HAS
                        case "has":
                            for(let i = 0; i < targets.value.length; i++) {
                                let res = hasCustomAttribute(`${targets.type}:${targets.value[i]}`, attribute[0]);
                                if(!res) return false;
                            }
                            return true;
                        // ATTRIBUTE - LACKS
                        case "lacks":
                            for(let i = 0; i < targets.value.length; i++) {
                                let res = hasCustomAttribute(`${targets.type}:${targets.value[i]}`, attribute[0]);
                                if(res) return false;
                            }
                            return true;
                    }
                }
        }
    }
    
    /**
    Get Restriction info
    provides additional footer info for prompts
    **/
    this.getRestrictionInfo = async function(src_ref, ability, restriction) {
        switch(restriction.type) {
            default:
                return "";
            break;
            // QUANTITY
            case "quantity":
                let quantity = await getActionQuantity(src_ref, ability);
                if(quantity === -1) quantity = 0;
                let max_allowed = await parseNumber(restriction.quantity, src_ref, { });
                if(+max_allowed <= 0) return "";
                if(quantity < +max_allowed) return `${+max_allowed - quantity}/${+max_allowed} uses left`;
                else return "";
            // SUCCESSION
            case "succession":
                if(restriction.subtype === "target") {
                    // get last target
                    let lt = await getLastTarget(src_ref, ability);
                    let lastTarget = lt ? await parsePlayerSelector(lt, src_ref) : null;
                    if(!lastTarget || !lastTarget[0]) return "";
                    let lastTargetMember = mainGuild.members.cache.get(lastTarget[0]);
                    return lastTarget ? `You may not target ${lastTargetMember?.displayName ?? '*unknown*'} again` : "";
                } else {
                    return "";
                }
        }
    }
    
    
    /**
    Initialize action quantity to 1
    **/
    this.initActionData = function(src_ref, ability) {
        if(!ability || !ability.id) return;
        return new Promise(res => {
            sql("INSERT INTO action_data (src_ref,ability_id,quantity,last_phase) VALUES (" + connection.escape(src_ref) + "," + connection.escape(ability.id) + ",0," + getPhaseAsNumber() + ")", result => {
                 res();
            });
        });
    }
    
    /**
    Increase action quantity
    **/
    this.increaseActionQuantity = function(src_ref, ability) {
        if(!ability || !ability.id) return;
        return new Promise(res => {
            sql("UPDATE action_data SET quantity=quantity+1,last_phase=" + getPhaseAsNumber() + " WHERE src_ref= " + connection.escape(src_ref) + " AND ability_id=" + connection.escape(ability.id), result => {
                 res();
            });
        });
    }    
        
    /**
    Get action quantity
    **/
    this.getActionQuantity = function(src_ref, ability) {
        if(!ability || !ability.id) return -1;
        return new Promise(res => {
            sql("SELECT * FROM action_data WHERE src_ref= " + connection.escape(src_ref) + " AND ability_id=" + connection.escape(ability.id), result => {
                if(!result[0]) res(-1);
                else res(result[0].quantity);
            });
        });
    }
    
    /**
    Sets the last target
    **/
    this.setLastTarget = function(src_ref, ability, lastTarget) {
        return new Promise(res => {
            sql("UPDATE action_data SET last_target=" + connection.escape(lastTarget) + ",last_phase=" + getPhaseAsNumber() + " WHERE src_ref= " + connection.escape(src_ref) + " AND ability_id=" + connection.escape(ability.id), result => {
                 res();
            });
        });
    }   
    
    /**
    Clears the last target
    **/
    this.clearLastTarget = function(src_ref, ability) {
        if(!ability || !ability.id) return;
        //console.log(src_ref, ability.id);
        //console.log(ability);
        return sqlProm("UPDATE action_data SET last_target=NULL WHERE src_ref= " + connection.escape(src_ref) + " AND ability_id=" + connection.escape(ability.id));
    }    
      
    /**
    Get last target
    **/
    this.getLastTarget = function(src_ref, ability) {
        return new Promise(res => {
            sql("SELECT * FROM action_data WHERE src_ref= " + connection.escape(src_ref) + " AND ability_id=" + connection.escape(ability.id), result => {
                if(!result[0]) res("");
                else res(result[0].last_target);
            });
        });
    }
      
    /**
    Get last used phase
    **/
    this.getLastPhase = function(src_ref, ability) {
        return new Promise(res => {
            sql("SELECT * FROM action_data WHERE src_ref= " + connection.escape(src_ref) + " AND ability_id=" + connection.escape(ability.id), result => {
                if(!result[0]) res(-2);
                else res(+result[0].last_phase);
            });
        });
    }
}
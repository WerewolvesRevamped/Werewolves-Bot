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
    this.handleRestriction = async function(pid, ability, restriction, prePrompt, target = null) {
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
                        let lastPhase = await getLastPase(pid, ability);
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
                            return true; // restriciton application not applicable without target
                        }
                        // actual evaluation
                        let lastTarget = await parsePlayerSelector(await getLastTarget(pid, ability), pid);
                        let targets = await parsePlayerSelector(target, pid);
                        // check if last target is included in the target selector
                        if(!targets.includes(lastTarget[0])) {
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
                let quantity = await getActionQuantity(pid, ability);
                let max_allowed = restriction.quantity;
                if(quantity < max_allowed) return true;
                else return false;
            break;
            // CONDITION
            case "condition":
                // cannot be evaluated pre-prompt: always true
                if(prePrompt) {
                    return true;
                } else {
                    abilityLog(`❗ **Error:** Unknown restriction type \`${restriction.type}\`!`);
                    return true;
                }
            break;
        }
    }
    
    /**
    Get Restriction info
    provides additional footer info for prompts
    **/
    this.getRestrictionInfo = async function(pid, ability, restriction) {
        switch(restriction.type) {
            default:
                return "";
            break;
            // QUANTITY
            case "quantity":
                let quantity = await getActionQuantity(pid, ability);
                let max_allowed = restriction.quantity;
                if(quantity < max_allowed) return `${max_allowed - quantity}/${max_allowed} uses left`;
                else return "";
            break;
        }
    }
    
    
    /**
    Initialize action quantity to 1
    **/
    this.initActionData = function(player_id, ability) {
        return new Promise(res => {
            sql("INSERT INTO action_data (player_id,ability_id,quantity,last_phase) VALUES (" + connection.escape(player_id) + "," + connection.escape(ability.id) + ",1," + getPhaseAsNumber() + ")", result => {
                 res();
            });
        });
    }
    
    /**
    Increase action quantity
    **/
    this.increaseActionQuantity = function(player_id, ability) {
        return new Promise(res => {
            sql("UPDATE action_data SET quantity=quantity+1,last_phase=" + getPhaseAsNumber() + " WHERE player_id= " + connection.escape(player_id) + " AND ability_id=" + connection.escape(ability.id), result => {
                 res();
            });
        });
    }    
        
    /**
    Get action quantity
    **/
    this.getActionQuantity = function(player_id, ability) {
        return new Promise(res => {
            sql("SELECT * FROM action_data WHERE player_id= " + connection.escape(player_id) + " AND ability_id=" + connection.escape(ability.id), result => {
                if(!result[0]) res(0);
                else res(result[0].quantity);
            });
        });
    }
    
    /**
    Sets the last target
    **/
    this.setLastTarget = function(player_id, ability, lastTarget) {
        return new Promise(res => {
            sql("UPDATE action_data SET last_target=" + connection.escape(lastTarget) + ",last_phase=" + getPhaseAsNumber() + " WHERE player_id= " + connection.escape(player_id) + " AND ability_id=" + connection.escape(ability.id), result => {
                 res();
            });
        });
    }    
      
    /**
    Get last target
    **/
    this.getLastTarget = function(player_id, ability) {
        return new Promise(res => {
            sql("SELECT * FROM action_data WHERE player_id= " + connection.escape(player_id) + " AND ability_id=" + connection.escape(ability.id), result => {
                if(!result[0]) res("");
                else res(result[0].last_target);
            });
        });
    }
      
    /**
    Get last used phase
    **/
    this.getLastPase = function(player_id, ability) {
        return new Promise(res => {
            sql("SELECT * FROM action_data WHERE player_id= " + connection.escape(player_id) + " AND ability_id=" + connection.escape(ability.id), result => {
                if(!result[0]) res(-2);
                else res(+result[0].last_phase);
            });
        });
    }
}
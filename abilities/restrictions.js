/**
    Abilities Module - Restrictions
    The module for implementing trigger restrictions
**/
module.exports = function() {
    /**
    Handle Restrictions
    apply ability restrictions
    **/
    this.handleRestriction = async function(pid, ability, restriction) {
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
            // QUANTITY
            case "quantity":
                let quantity = await getActionQuantity(pid, ability);
                let max_allowed = restriction.quantity;
                if(quantity < max_allowed) return true;
                else return false;
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
    Get action quantity
    **/
    this.getActionQuantity = function(player_id, ability) {
        return new Promise(res => {
            sql("SELECT * FROM action_quantities WHERE player_id= " + connection.escape(player_id) + " AND ability_hash=" + connection.escape(hash(ability)), result => {
                if(!result[0]) res(0);
                else res(result[0].quantity);
            });
        });
    }
    
    /**
    Initialize action quantity to 1
    **/
    this.initActionQuantity = function(player_id, ability) {
        return new Promise(res => {
            sql("INSERT INTO action_quantities (player_id,ability_hash,quantity) VALUES (" + connection.escape(player_id) + "," + connection.escape(hash(ability)) + ",1)", result => {
                 res();
            });
        });
    }
    
    /**
    Increase action quantity
    **/
    this.increaseActionQuantity = function(player_id, ability) {
        return new Promise(res => {
            sql("UPDATE action_quantities SET quantity=quantity+1 WHERE player_id= " + connection.escape(player_id) + " AND ability_hash=" + connection.escape(hash(ability)), result => {
                 res();
            });
        });
    }    
}
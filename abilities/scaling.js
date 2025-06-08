/**
    Abilities Module - Scaling
    The module for implementing trigger scaling
**/
module.exports = function() {
    
    
    /**
    Handle Scaling
    apply ability scaling
    **/
    this.handleScaling = async function(scaling, src_ref, additionalTriggerData) {
        switch(scaling.type) {
            // UNKNOWN
            default: 
                abilityLog(`❗ **Error:** Unknown scaling type \`${scaling.type}\`!`);
                return null;
            break;
            // MULTIPLIER
            case "multiplier":
                if((scaling.even && (getPhaseNum() % 2 === 0)) || (scaling.odd && (getPhaseNum() % 2 === 1))) {
                    return scaling.quantity;
                } else {
                    return null;
                }
            break;
            // DYNAMIC
            case "dynamic":
                let comp = await parseNumber(scaling.compare, src_ref, additionalTriggerData);
                let compTo = await parseNumber(scaling.compare_to, src_ref, additionalTriggerData);
                let quant = await parseNumber(scaling.quantity, src_ref, additionalTriggerData);
                //console.log("DYNAMIC SCALING", scaling.compare, comp, compTo, quant);
                switch(scaling.compare_type) {
                    case "equal_to":
                        if(comp == compTo) return quant;
                    break;
                    case "less_than":
                        if(comp < compTo) return quant;
                    break;
                    case "greater_than":
                        if(comp > compTo) return quant;
                    break;
                    case "less_than_or_equal":
                        if(comp <= compTo) return quant;
                    break;
                    case "greater_than_or_equal":
                        if(comp >= compTo) return quant;
                    break;
                }
                return null;
            break;
            // DIVISION
            case "division":
                let div = scaling.quantity;
                let divNum = await parseNumber(div, src_ref, additionalTriggerData);
                if(divNum == 0) return 1; // minimum of 1
                return divNum;
            break;
            
        }
    }
    
}
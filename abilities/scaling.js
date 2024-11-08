/**
    Abilities Module - Scaling
    The module for implementing trigger scaling
**/
module.exports = function() {
    
    
    /**
    Handle Scaling
    apply ability scaling
    **/
    this.handleScaling = async function(scaling) {
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
                let comp = await parseNumber(scaling.compare);
                let compTo = scaling.compare_to;
                let quant = scaling.quantity;
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
                }
                return 0;
            break;
            // DIVISION
            case "division":
                let div = scaling.quantity;
                let divNum = await parseNumber(div);
                if(divNum == 0) return 1; // minimum of 1
                return divNum;
            break;
            
        }
    }
    
}
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
                // WIP: doesnt consider odd/even parameters
                return scaling.quantity;
            break;
            
        }
    }
    
}
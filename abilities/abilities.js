/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./joining.js")();
require("./parsers.js")();

module.exports = function() {
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(pid, src_role, ability) {
        switch(ability.type) {
            default:
                log("UNKNOWN ABILITY TYPE", JSON.stringify(ability));
            break;
            case "joining":
                await abilityJoining(pid, src_role, ability)
            break;
        }
    }
    
}
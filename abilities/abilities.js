/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./joining.js")();

module.exports = function() {
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(pid, ability) {
        switch(ability.type) {
            default:
                log("UNKNOWN ABILITY TYPE", JSON.stringify(ability));
            break;
            case "joining":
                await abilityJoining(pid, ability)
            break;
        }
    }
    
    /**
    Parse Selector
    parses a selector / target type
    **/
    this.parseSelector = function(selector, self) {
        let parsed = selector;
        parsed = parsed.replace("@Self", self);
        return parsed;
    }
    
    /**
    Parse Group Name
    parses a group name
    **/
    this.parseGroupName = function(name) {
        return name.replace("#", "").replace(/\-/g, " ").toLowerCase();
    }
    
}
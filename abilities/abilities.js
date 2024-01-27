/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();

module.exports = function() {
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = function(pid, ability) {
        switch(ability.type) {
            default:
                log("UNKNOWN ABILITY TYPE", JSON.stringify(ability));
            break;
            case "joining":
                abilityJoining(pid, ability)
            break;
        }
    }
    
    /**
    Ability: Joining
    **/
    this.abilityJoining = function(pid, ability) {
        switch(ability.subtype) {
            default:
                log("UNKNOWN ABILITY SUBTYPE", JSON.stringify(ability));
            break;
            case "add":
                joiningAdd(parseSelector(ability.target, pid), parseGroupName(ability.group), ability.membership_type, ability.duration);
            break;
            case "remove":
                joiningRemove(parseSelector(ability.target), parseGroupName(ability.group));
            break;
        }
    }
    
    /**
    Ability: Joining - Add
    adds a player to a group
    **/
    this.joiningAdd = function(target, group, type, duration) {
        console.log("JOINING ADD", target, group, type, duration);
    }
    
    /**
    Ability: Joining - Remove
    removes a player from a group
    **/
    this.joiningRemove = function(target, group) {
        console.log("JOINING REMOVE", target, group);
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
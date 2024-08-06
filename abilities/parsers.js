/**
    Abilities Module -  Parsers
    Additional run time parsers of special types
**/

module.exports = function() {
    
    /**
    Parse Selector
    parses a selector / target type
    and returns a list of discord player ids
    **/
    this.parsePlayerSelector = function(selector, self) {
        let selectorTarget = selectorGetTarget(selector);
        let selectorType = selectorGetType(selector);
        switch(selectorType) {
            case "player": 
                return parsePlayerSelector(selector, self);
            break;
            default:
                abilityLog(`❗ **Error:** Invalid selector type \`${selectorType}\`!`);
                return [];
            break;
        }
    }
    
    /**
    Parse Player Selector
    parses a selector / target type
    and returns a list of discord player ids
    **/
    this.parsePlayerSelector = function(selector, self) {
        let selectorTarget = selectorGetTarget(selector);
        /** WIP: Needs to be able to parse much more! **/
        switch(selectorTarget) {
            case "@self": return [self];
            default: return [];
        }
    }
    
    /**
    Get Selector Target
    returns the target of a selector (removing the type)
    **/
    this.selectorGetTarget = function(selector) {
        return selector.split("[")[0].toLowerCase();
    }
    
    /**
    Get Selector Type
    returns the type of a selector (removing the target)
    **/
    this.selectorGetType = function(selector) {
        return selector.split("[")[1].split("]")[0].toLowerCase();
    }
    
    /**
    Parse Group Name
    parses a group name
    **/
    this.parseGroupName = function(name) {
        return name.replace("#", "").replace(/\-/g, " ").toLowerCase();
    }
    
    /**
    Parse Duration
    parses a duration type, WIP: I suppose this should verify its a valid duration type!!
    **/
    this.parseDuration = function(dur) {
        return dur.toLowerCase();
    }
    
}
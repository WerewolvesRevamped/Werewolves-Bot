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
        /** WIP: Needs to be able to parse much more! **/
        switch(selector.toLowerCase()) {
            case "@self": return [self];
            default: return [];
        }
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
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
    this.parseSelector = async function(selector, self, additionalTriggerData = {}) {
        let selectorTarget = selectorGetTarget(selector);
        let selectorType = selectorGetType(selector);
        switch(selectorType) {
            // PLAYER
            case "player": 
                return await parsePlayerSelector(selector, self);
            // ROLE
            case "role": 
                return parseRoleSelector(selector);
            // GROUP
            case "group":
                return await parseGroupName(selector);
            // LOCATION
            case "location":
                // WIP: all groups are locations but not all locations are groups
                return await parseGroupName(selector);
            // UNKNOWN
            case "attribute":
            case "alignment":
            case "abilityType":
            case "abilitySubtype":
            case "source":
            case "info":
            default:
                abilityLog(`❗ **Error:** Invalid selector type \`${selectorType}\`!`);
                return [];
        }
    }
    
    /**
    Parse Player Selector
    parses a selector / target type
    and returns a list of discord player ids
    **/
    const ID_SELECTOR = /^@id:(\d+)$/;
    this.parsePlayerSelector = async function(selector, self = null, additionalTriggerData = {}) {
        let selectorTarget = selectorGetTarget(selector);
        /** WIP: Needs to be able to parse much more! **/
        switch(selectorTarget) {
            // base selectors
            case "@self":
            if(!self) { // if no self is specified, @Self is invalid
                abilityLog(`❗ **Error:** Used \`@Self\` in invalid context!`);
                return [ ];
            }
            return [ self ];
            // all players
            case "@all":
            return await getAllLivingIDs();
            
            // trigger dependent selectors
            case "@deathtype":
                if(additionalTriggerData.death_type) {
                    return additionalTriggerData.death_type;
                } else {
                    invalidSelector(selectorTarget);
                }
            break;
            case "@killingtype":
                if(additionalTriggerData.killing_type) {
                    return additionalTriggerData.killing_type;
                } else {
                    invalidSelector(selectorTarget);
                }
            break;
            case "@attacker":
                if(additionalTriggerData.attacker) {
                    return additionalTriggerData.attacker;
                } else {
                    invalidSelector(selectorTarget);
                }
            break;
            case "@attacksource":
                if(additionalTriggerData.attack_source) {
                    return additionalTriggerData.attack_source;
                } else {
                    invalidSelector(selectorTarget);
                }
            break;
            case "@this":
                if(additionalTriggerData.this) {
                    return additionalTriggerData.this;
                } else {
                    invalidSelector(selectorTarget);
                }
            break;
            
            // unknown selector
            default:
                if(ID_SELECTOR.test(selectorTarget)) { // id selector - this is not in formalizations; this is generated by prompt replies
                    let id = selectorTarget.match(ID_SELECTOR)[1];
                    return [ id ];
                } else {
                    invalidSelector(selectorTarget);
                }
        }
    }
    
    function invalidSelector(sel) {
        abilityLog(`❗ **Error:** Invalid player selector target \`${sel}\`!`);
        return [ ];
    }
    
    /**
    Get all living player ids
    **/
    this.getAllLivingIDs = function() {
        return new Promise(res => {
            sql("SELECT id FROM players WHERE alive=1", result => {
                res(result.map(el => el.id));
            })
        });
    }
    
    /**
    Parse Role Selector
    parses a role type selector
    **/
    this.parseRoleSelector = function(selector) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        /** WIP: Needs to be able to parse much more! **/
        switch(selectorTarget) {
            default:
                let parsedRole = parseRole(selector);
                if(verifyRole(parsedRole)) {
                    return [ parsedRole ];
                } else {
                    abilityLog(`❗ **Error:** Invalid role selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
        }
    }
    
    /**
    Parse Group Name
    parses a group name
    WIP: DOESNT VALIDATE IF THE GROUP EXISTS
    WIP: DOESNT CONSIDER THE :'ed GROUP NAMES
    **/
    this.parseGroupName = async function(selector) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        // WIP: weak group parser
        return selectorTarget.replace("#", "").replace(/\-/g, " ").toLowerCase();
    }
    
    
    /**
    Parse Location
    parses a location
    WIP: Locations can also be a group
    **/
    const locations = ["#story_time","#town_square","#tavern","#voting_booth"];
    this.parseLocation = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        // check what type of location it is
        if(selectorTarget[0] === "#") { // location is a channel 
            if(locations.includes(selectorTarget)) {
                return selectorTarget;
            } else {
                abilityLog(`❗ **Error:** Invalid location \`${selectorTarget}\`. Defaulted to \`#town_square\`!`);
                return "#town_square";              
            }
        } else { // location is a player
            return await parsePlayerSelector(selectorTarget, self, additionalTriggerData);
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
        let spl = selector.split("[");
        return spl.length >= 2 ? spl[1].split("]")[0].toLowerCase() : "unknown";
    }
    
    /**
    Parse Duration
    parses a duration type
    defaults to phase for invalid types
    **/
    this.parseDuration = function(dur) {
        let dur_type = dur.toLowerCase();
        if(dur_type[0] === "~") dur_type = dur_type.substr(1);
        if(attributesValidDurationTypes.includes(dur_type)) {
            return dur_type;
        } else {
            abilityLog(`❗ **Error:** Invalid duration type \`${mem_type}\`. Defaulted to \`phase\`!`);
            return "phase";   
        }
    }
    
    /**
    Parse Membership Type
    parses a group membership type
    defaults to member for invalid types
    **/
    const memTypes = ["member","owner","visitor"];
    this.parseMembershipType = function(mem_type) {
        mem_type = mem_type.toLowerCase();
        if(memTypes.includes(mem_type)) {
            return mem_type;
        } else {
            abilityLog(`❗ **Error:** Invalid membership type \`${mem_type}\`. Defaulted to \`member\`!`);
            return "member";
        }
    }
    
    /**
    Parse Defense From Type
    parses a "defense from x" type
    defaults to "all"
    **/
    const defenseFromTypes = ["attacks","kills","lynches","attacks_lynches","all"];
    this.parseDefenseFromType = function(defro_type) {
        defro_type = defro_type.toLowerCase().replace(/ /g,"_").replace(/[^a-z]/g,"");
        if(defenseFromTypes.includes(defro_type)) {
            return defro_type;
        } else {
            abilityLog(`❗ **Error:** Invalid defense from type \`${defro_type}\`. Defaulted to \`all\`!`);
            return "all";
        }
    }
    
    /**
    Parse Phase Type
    parses a phase type
    defaults to "all"
    **/
    const phases = ["day","night","all"];
    this.parsePhaseType = function(phase_type) {
        phase_type = phase_type.toLowerCase();
        if(phases.includes(phase_type)) {
            return phase_type;
        } else {
            abilityLog(`❗ **Error:** Invalid phase type \`${phase_type}\`. Defaulted to \`all\`!`);
            return "all";
        }
    }
    
    
}
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
                return { value: await parsePlayerSelector(selector, self, additionalTriggerData), type: "player" };
            // ROLE
            case "role": 
                return { value: parseRoleSelector(selector), type: "role" };
            // GROUP
            case "group":
                let group = await parseGroup(selector, self);
                let groups = group ? [ group ] : [ ];
                return { value: groups, type: "group" };
            // LOCATION
            case "location":
                let loc = await parseLocation(selector, self, additionalTriggerData);
                let locs = loc ? [ loc ] : [ ];
                return { value: locs, type: "role" };
            // POLL
            case "poll":
                let poll = await parsePoll(selector, self, additionalTriggerData);
                let polls = poll ? [ poll ] : [ ];
                return { value: polls, type: "poll" };
            // SUCCESS
            case "success":
                return { value: [ parseSuccess(selector) ], type: "success" };
            break;
            // RESULT
            case "result":
                return { value: [ parseResult(selector, additionalTriggerData) ], type: "result" };
            break;
            // INFO
            case "info":
                return { value: [ await parseInfo(selector, self, additionalTriggerData) ], type: "info" };
            break;
            // UNKNOWN
            case "attribute":
            case "alignment":
            case "abilityType":
            case "abilitySubtype":
            case "source":
            default:
                abilityLog(`❗ **Error:** Invalid selector type \`${selectorType}\`!`);
                return { value: [], type: "unknown" };
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
            self = srcToValue(self);
            return [ self ];
            // all players
            case "@all":
            return await getAllLivingIDs();
            // all players
            case "@target":
            let target = await getTarget(self);
            target = srcToValue(target);
            return [ target ];
            
            // trigger dependent selectors
            case "@deathtype":
                if(additionalTriggerData.death_type) {
                    return [ additionalTriggerData.death_type ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@killingtype":
                if(additionalTriggerData.killing_type) {
                    return [ additionalTriggerData.killing_type ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@attacker":
                if(additionalTriggerData.attacker) {
                    return [ additionalTriggerData.attacker ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@attacksource":
                if(additionalTriggerData.attack_source) {
                    return [ additionalTriggerData.attack_source ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@this":
                if(additionalTriggerData.this) {
                    return [ additionalTriggerData.this ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@winner":
                if(additionalTriggerData.winner) {
                    return [ additionalTriggerData.winner ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            
            // unknown selector
            default:
                if(ID_SELECTOR.test(selectorTarget)) { // id selector - this is not in formalizations; this is generated by prompt replies
                    let id = selectorTarget.match(ID_SELECTOR)[1];
                    return [ id ];
                } else {
                    return invalidSelector(selectorTarget);
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
                let parsedRole = parseRole(selectorTarget);
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
    WIP: DOESNT CONSIDER THE :'ed GROUP NAMES
    **/
    this.parseGroup = async function(selector, self = null) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        if(selectorTarget === "@self") {
            if(!self) { // if no self is specified, @Self is invalid
                abilityLog(`❗ **Error:** Used \`@Self\` in invalid context!`);
                return null;
            }
            self = srcToValue(self);
            return self;
        }
        // parse group
        let parsedGroupName = parseGroupName(selectorTarget);
        if(cachedGroups.indexOf(parsedGroupName) >= 0) {
            // get channel id
            let groupData = await groupGetData(parsedGroupName);
            return groupData.channel_id;
        } else {
            abilityLog(`❗ **Error:** Invalid group \`${selectorTarget}\`!`);
            return null;
        }
    }
    
    /**
    Parse Location
    parses a location
    WIP: Locations can also be a group
    **/
    this.parseLocation = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        // check what type of location it is
        if(selectorTarget[0] === "#") { // location is a channel 
            if(verifyLocationName(selectorTarget)) {
                return { value: parseLocationName(selectorTarget), type: "location", default: false };
            } else if(verifyGroup(selectorTarget)) {
                let group = await parseGroup(selectorTarget);
                return { value: group, type: "group", default: false };   
            } else {
                let def = cachedLocations[0]; // default is whatever location is first
                abilityLog(`❗ **Error:** Invalid location \`${selectorTarget}\`. Defaulted to \`${def}\`!`);
                return { value: def, type: "location", default: true };              
            }
        } else { // location is a player
            let parsedPlayer = await parsePlayerSelector(selectorTarget, self, additionalTriggerData);
            return { value: parsedPlayer, type: "player", default: false };
        }
    }
    
    /**
    Parse Poll
    parses a poll
    **/
    this.parsePoll = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        if(selectorTarget === "@self") {
            if(!self) { // if no self is specified, @Self is invalid
                abilityLog(`❗ **Error:** Used \`@Self\` in invalid context!`);
                return null;
            }
            self = srcToValue(self); // get poll name
            return self; 
        } else {
            if(verifyPoll(selectorTarget)) {
                return selectorTarget;
            } else {
                abilityLog(`❗ **Error:** Invalid poll \`${selectorTarget}\`.!`);
                return null;              
            }
        }
    }
    
    /**
    Parse Success
    bool like type. either success or failure
    **/
    const validSuccessValues = ["success","failure"];
    this.parseSuccess = function(selector) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        // format
        selectorTarget = selectorTarget.toLowerCase().replace(/[^a-z]+/g,"");
        // check
        if(validSuccessValues.includes(selectorTarget)) {
            return selectorTarget === "success";
        } else {
            abilityLog(`❗ **Error:** Invalid success type \`${selectorTarget}\`. Defaulted to \`failure\`!`);
            return false;
        }
    }
    
    /**
    Parse Result
    turns a @Result<n> value into the correct result from trigger data
    **/
    this.parseResult = function(selector, additionalTriggerData) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        const emptyResult = { msg: "", success: false };
        // switch
        switch(selectorTarget) {
            case "@result": return additionalTriggerData.result ?? emptyResult;
            case "@result1": return additionalTriggerData.result1 ?? emptyResult;
            case "@result2": return additionalTriggerData.result2 ?? emptyResult;
            case "@result3": return additionalTriggerData.result3 ?? emptyResult;
            case "@result4": return additionalTriggerData.result4 ?? emptyResult;
            case "@result5": return additionalTriggerData.result5 ?? emptyResult;
            case "@result6": return additionalTriggerData.result6 ?? emptyResult;
            case "@result7": return additionalTriggerData.result7 ?? emptyResult;
            default: 
                abilityLog(`❗ **Error:** Invalid result type \`${selectorTarget}\`. Defaulted to \`{msg:"",success:false}\`!`);
                return emptyResult;
        }
    }
    
    /**
    Parse Info
    parses an info message which may contain other selectors
    **/
    this.parseInfo = async function(selector, self, additionalTriggerData) {
        // get target
        let selectorTarget = selector.split("[")[0]; // we cant actually use the util function as it converts to lower case
        selectorTarget = selectorTarget.replace(/`/g,"");
        let spl = selectorTarget.split(" ");
        // convert text segments to selectors if applicable
        for(let i = 0; i < spl.length; i++) {
            let infType = inferType(spl[i]);
            if(infType != "unknown") {
                let parsed = await parseSelector(`${spl[i]}[${infType}]`, self, additionalTriggerData);
                let strs = [];
                // iterate through selector list
                for(let j = 0; j < parsed.value.length; j++) {
                    let txt = srcRefToText(`${infType}:${parsed.value[j]}`, parsed.value[j]);
                    strs.push(txt);
                }
                // merge selector list
                let str = strs.join(", ");
                // return selector list
                spl[i] = str;
            }
        }
        // return
        return spl.join(" ");
    }
    
    /**
    Get Selector Target
    returns the target of a selector (removing the type)
    **/
    this.selectorGetTarget = function(selector) {
        return selector.split("[")[0].toLowerCase().trim();
    }
    
    /**
    Get Selector Type
    returns the type of a selector (removing the target)
    **/
    this.selectorGetType = function(selector) {
        let spl = selector.split("[");
        return spl.length >= 2 ? spl[1].split("]")[0].toLowerCase().trim() : "unknown";
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
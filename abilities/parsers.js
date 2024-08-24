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
            // RESULT
            case "result":
                return { value: [ parseResult(selector, additionalTriggerData) ], type: "result" };
            // INFO
            case "info":
                return { value: [ await parseInfo(selector, self, additionalTriggerData) ], type: "info" };
            // ABILITY TYPE
            case "abilitytype":
                return { value: [ parseAbilityType(selector) ], type: "abilityType" };
            // ABILITY SUBTYPE
            case "abilitysubtype":
                return { value: [ parseAbilitySubtype(selector) ], type: "abilitySubype" };
            // UNKNOWN
            case "attribute":
            case "alignment":
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
    const ADVANCED_SELECTOR = /^@\((.+)\)$/;
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
            case "@actiontarget":
                if(additionalTriggerData.action_target) {
                    return [ additionalTriggerData.action_target ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            
            // unknown selector
            default:
                if(ID_SELECTOR.test(selectorTarget)) { // id selector - this is not in formalizations; this is generated by prompt replies
                    let id = selectorTarget.match(ID_SELECTOR)[1];
                    return [ id ];
                } else if (ADVANCED_SELECTOR.test(selectorTarget)) {
                    let contents = selectorTarget.match(ADVANCED_SELECTOR);
                    return await parseAdvancedPlayerSelector(contents[1]);
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
    
    /** PRIVATE
    Parses an advanced player selector
    **/
    this.parseAdvancedPlayerSelector = async function(selector) {
        // split selector into its components
        const selSplit = selector.toLowerCase().split(",").map(el => el.split(":"));
        // get all players
        let allPlayers = await getAllPlayers();
        // set flags
        let aliveOnly = true;
        let selectAll = true;
        // iterate through all selector components
        for(let i = 0; i < selSplit.length; i++) {
            const compName = selSplit[i][0];
            let compVal = selSplit[i][1];
            let compInverted = false;
            if(compVal[0] === "!") {
                compVal = compVal.substr(1);
                compInverted = true;
            }
            console.log("AS", compName, compVal, compInverted);
            let compValSplit;
            switch(compName) {
                default:
                    abilityLog(`❗ **Error:** Unknown advanced selector component \`${compName}\`!`);
                break;
                case "role":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.role === compVal);
                    else allPlayers = allPlayers.filter(el => el.role != compVal);
                break;
                case "cat":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.category === compVal);
                    else allPlayers = allPlayers.filter(el => el.category != compVal);
                break;
                case "class":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.class === compVal);
                    else allPlayers = allPlayers.filter(el => el.class != compVal);
                break;
                case "align":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.team === compVal);
                    else allPlayers = allPlayers.filter(el => el.team != compVal);
                break;
                case "fullcat":
                    compValSplit = compVal.split("-");
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.class === compValSplit[0] && el.category === compValSplit[1]);
                    else allPlayers = allPlayers.filter(el => el.class != compValSplit[0] || el.category != compValSplit[1]);
                break;
                case "orig_role":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_role === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_role != compVal);
                break;
                case "orig_cat":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_cat === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_cat != compVal);
                break;
                case "orig_class":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_class === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_class != compVal);
                break;
                case "orig_align":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_align === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_align != compVal);
                break;
                case "orig_fullcat":
                    compValSplit = compVal.split("-");
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_class === compValSplit[0] && el.orig_cat === compValSplit[1]);
                    else allPlayers = allPlayers.filter(el => el.orig_class != compValSplit[0] || el.orig_cat != compValSplit[1]);
                break;
                case "group":
                    let groupMembers = await getAllGroupMembers(compVal);
                    if(!compInverted) allPlayers = allPlayers.filter(el => groupMembers.includes(el.id));
                    else allPlayers = allPlayers.filter(el => !groupMembers.includes(el.id));
                break;
                case "aliveonly":
                    if(compVal === "false") aliveOnly = false;
                break;
                case "selectall":
                    if(compVal === "false") selectAll = false;
                break;
            }
        }
        // apply flags
        if(aliveOnly) {
            allPlayers = allPlayers.filter(el => el.alive == 1);
        }
        if(!selectAll) {
            let shuffled = shuffleArray(allPlayers);
            return [ shuffled[0].id ];
        } else {
            return allPlayers.map(el => el.id);
        }
    }
    
    /**
    Get all player 
    **/
    function getAllPlayers() {
        return new Promise(res => {
            sql("SELECT players.id,players.role,players.orig_role,players.alive,role.class,role.category,role.team,orig_role.class AS orig_class,orig_role.category AS orig_cat,orig_role.team AS orig_align FROM players INNER JOIN roles AS role ON players.role=role.name INNER JOIN roles AS orig_role ON players.orig_role=orig_role.name", result => {
                res(result);
            })
        });
    }
    
    /**
    Get all player 
    **/
    function getAllGroupMembers(group) {
        return new Promise(res => {
            sql("SELECT owner FROM active_attributes WHERE attr_type='group_membership' AND val1=" + connection.escape(group), result => {
                res(result.map(el => el.owner));
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
            case "@actionresult": return additionalTriggerData.action_result ?? emptyResult;
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
    Parse ability type
    **/
    const abilityTypeNames = ["joining","investigating","disguising","killing","protecting","log","targeting","process_evaluate","abilities","announcement","poll"];
    this.parseAbilityType = function(ability_type) {
        // get target
        let selectorTarget = selectorGetTarget(ability_type);
        if(abilityTypeNames.includes(selectorTarget)) {
            return selectorTarget;
        } else {
            abilityLog(`❗ **Error:** Invalid ability type \`${selectorTarget}\`. Defaulted to \`none\`!`);
            return "none";
        }
    }
    
    /**
    Parse ability subtype
    **/
    const abilitySubtypeNames = [
        ["add","remove"], // joining
        ["role","class","category"], // investigating
        ["weakly","strongly"], // disguising
        ["attack","kill","lynch","true-kill"], // killing
        ["active-defense","passive-defense","partial-defense","recruitment-defense","absence"], // protecting
        [], // log
        ["target","untarget"], // targeting
        [], // process_evaluate
        [], // abilities
        [], // announcement
        ["creation"], // poll
        ];
    this.parseAbilitySubype = function(ability_subtype) {
        // get target
        const selectorTarget = selectorGetTarget(ability_subtype);
        const selectorTargetSplit = selectorTarget.split(" ");
        // doesnt specify both type and subtype; or too many parts
        if(selectorTargetSplit.length != 2) {
            abilityLog(`❗ **Error:** Invalid ability subtype length for \`${selectorTarget}\`. Defaulted to \`none none\`!`);
            return "none none";
        }
        // check if type is valid
        if(abilityTypeNames.includes(selectorTargetSplit[1])) {
            // get relevant subtypes
            const abilityIndex = abilityTypeNames.indexOf(selectorTargetSplit[1]);
            const validAbilitySubtypeNames = abilitySubtypeNames[abilityIndex];
            // check if subtype is valid
            if(validAbilitySubtypeNames.includes(selectorTargetSplit[0])) {
                return selectorTarget;
            } else { // invalid subtype
                abilityLog(`❗ **Error:** Invalid ability subtype \`${selectorTargetSplit[0]}\` in \`${selectorTarget}\`. Defaulted to \`none none\`!`);
                return "none none";
            }
        } else { // type is invalid
            abilityLog(`❗ **Error:** Invalid ability type \`${selectorTargetSplit[1]}\` in \`${selectorTarget}\`. Defaulted to \`none none\`!`);
            return "none none";
        }
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
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
        // It is a @Self selector -> get type from self
        if(selectorTarget === "@self" && self) {
            selectorType = srcToType(self);
            if(selectorType === "attribute") selectorType = "player"; // for attributes we want @Self to be the player. @ThisAttr is attribute instead
        } else if(selectorTarget === "@selection") {
            selectorType = additionalTriggerData.selection_type;
        } else if(selectorTarget === "@secondaryselection") {
            selectorType = additionalTriggerData.secondaryselection_type;
        } else if(selectorTarget === "@target") {
            let target = await getTarget(self);
            if(!target) selectorType = "null";
            selectorType = srcToType(target);
            console.log(`Inferred target type as ${selectorType} from ${target}`);
        }
        // switch through types
        switch(selectorType) {
            // PLAYER
            case "player": 
            case "player_attr": 
            case "player_group": 
                return { value: await parsePlayerSelector(selector, self, additionalTriggerData), type: "player" };
            // ROLE
            case "role": 
                return { value: await parseRoleSelector(selector, self, additionalTriggerData), type: "role" };
            // ACTIVE EXTRA ROLE
            case "activeextrarole":
                return { value: await parseActiveExtraRoleSelector(selector, self, additionalTriggerData), type: "activeExtraRole" };
            // GROUP
            case "group":
                let group = await parseGroup(selector, self);
                let groups = group ? [ group ] : [ ];
                return { value: groups, type: "group" };
            // ALIGNMENT
            case "alignment":
                return { value: await parseAlignment(selector, self, additionalTriggerData), type: "alignment" };
            // LOCATION
            case "location":
                let loc = await parseLocation(selector, self, additionalTriggerData);
                let locs = loc ? [ loc.value ] : [ ];
                return { value: locs, type: loc.type };
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
                return { value: [ parseAbilityType(selector, self, additionalTriggerData) ], type: "abilityType" };
            // ABILITY SUBTYPE
            case "abilitysubtype":
                return { value: [ parseAbilitySubtype(selector, self, additionalTriggerData) ], type: "abilitySubtype" };
            // ABILITY SUBTYPE
            case "abilitycategory":
                return { value: [ parseAbilityCategory(selector) ], type: "abilityCategory" };
            // NUMBER
            case "number":
                return { value: [ await parseNumber(selector, self, additionalTriggerData) ], type: "number" };
            // BOOLEAN
            case "boolean":
                return { value: [ parseBoolean(selector, self, additionalTriggerData) ], type: "boolean" };
            // ATTRIBUTE
            case "attribute":
                return { value: parseAttributeSelector(selector), type: "attribute" };
            // ACTIVE ATTRIBUTE
            case "activeattribute":
                return { value: await parseActiveAttributeSelector(selector, self, additionalTriggerData, self), type: "activeAttribute" };
            // DISPLAY
            case "display":
                return { value: [ parseDisplay(selector, self, additionalTriggerData) ], type: "display" };
            case "displayvalue":
                return { value: [ parseDisplayValue(selector, self, additionalTriggerData) ], type: "displayValue" };
            case "category":
                return { value: await parseCategory(selector, self, additionalTriggerData), type: "category" };
            case "killingtype":
                return { value: [ parseKillingType(selector, self, additionalTriggerData) ], type: "killingType" };
            case "class":
                return { value: await parseClass(selector, self, additionalTriggerData), type: "class" };
            case "source":
                return { value: parseSourceSelector(selector, self, additionalTriggerData), type: "source" };
            case "option":
                return { value: parseOptionSelector(selector, self, additionalTriggerData), type: "option" };
            case "string":
                return { value: await parseStringSelector(selector, self, additionalTriggerData), type: "string" };
            // NULL
            case "null": // a null selector is returned by runtime infering if a certain value does not exist yet. in this case an empty selector is the appropriate result
                return { value: [], type: "null" };
            // UNKNOWN
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
    const ID_SELECTOR_EXTENDED = /^@id:(\d+)\[player\]$/;
    const ADVANCED_SELECTOR = /^@\((.+)\)$/;
    const PROPERTY_ACCESS = /^@(.+)->(.+)$/;
    const ATTR_PROPERTY = /^attr\((\w+)\)$/;
    const HOST_INFORMATION = /^%.+%$/;
    this.INCLUDE_DEAD_PLAYERS = false;
    this.parsePlayerSelector = async function(selector, self = null, additionalTriggerData = {}, aliveOnly = true) {
        let selectorTarget = selectorGetTarget(selector);
        switch(selectorTarget) {
            // base selectors
            case "@self":
                if(!self) { // if no self is specified, @Self is invalid
                    abilityLog(`❗ **Error:** Used \`@Self\` in invalid context!`);
                    return [ ];
                }
                let val = srcToValue(self);
                let type = srcToType(self);
                switch(type) {
                    default:
                        abilityLog(`❗ **Error:** Used \`@Self\` with invalid self type \`${type}\`!`);
                        return [ ];
                    case "player":
                        return [ val ];
                    case "player_attr": // retrieve player id through channel id
                        let attr = await roleAttributeGetPlayer(val);
                        return [ attr.id ];
                    case "attribute": // retrieve player id through cached attributes
                        let owner = getCustomAttributeOwner(val);
                        return [ srcToValue(owner) ];
                }
            // all (living) players
            case "@all":
                if(aliveOnly) {
                    return await getAllLivingIDs();
                } else {   
                    let dead = await getAllDeadIDs();
                    let alive = await getAllLivingIDs();
                    return [...dead, ...alive];
                }
            // others; @all without @self
            case "@others":
                if(aliveOnly) {
                    let all = await getAllLivingIDs();
                    let pself = srcToValue(self);
                    return all.filter(el => el != pself);
                } else {
                    let dead = await getAllDeadIDs();
                    let alive = await getAllLivingIDs();
                    let pself = srcToValue(self);
                    return  [...dead, ...alive].filter(el => el != pself);
                }
            // all dead players
            case "@dead":
                return await getAllDeadIDs();
            // all players, including dead ones
            case "@deadalive":
                let dead = await getAllDeadIDs();
                let alive = await getAllLivingIDs();
                return [...dead, ...alive];
            // target
            case "@target":
                if(!self) { // if no self is specified, @Target is invalid
                    abilityLog(`❗ **Error:** Used \`@Target\` in invalid context!`);
                    return [ ];
                }
                let target = await getTarget(self);
                if(!target) return [ ];
                target = srcToValue(target);
                if(aliveOnly) {
                    let all = await getAllLivingIDs();
                    return all.includes(target) ? [ target ] : [ ];
                } else {
                    return [ target ];  
                }
            // targetdead
            case "@targetdead":
                if(!self) { // if no self is specified, @TargetDead is invalid
                    abilityLog(`❗ **Error:** Used \`@TargetDead\` in invalid context!`);
                    return [ ];
                }
                let targetdead = await getTarget(self);
                if(!targetdead) return [ ];
                targetdead = srcToValue(targetdead);
                return [ targetdead ];  
            case "@members":
                if(!self) { // if no self is specified, @Self is invalid
                    abilityLog(`❗ **Error:** Used \`@Members\` in invalid context!`);
                    return [ ];
                }
                let val2 = srcToValue(self);
                let type2 = srcToType(self);
                switch(type2) {
                    default:
                        abilityLog(`❗ **Error:** Used \`@Members\` with invalid self type \`${type2}\`!`);
                        return [ ];
                    case "group":
                        if(aliveOnly) {
                            let gMembers = await groupGetMembers(val2);
                            return gMembers.map(el => el.id);
                        } else {
                            let gMembers = await groupGetMembersAll(val2);
                            return gMembers.map(el => el.id);
                        }
                    case "team": 
                        if(aliveOnly) {
                            let tMembers = await teamGetMembers(val2);
                            return tMembers.map(el => el.id);
                        } else {
                            let tMembers = await teamGetMembersAll(val2);
                            return tMembers.map(el => el.id);
                        }
                }
            
            // trigger dependent selectors
            case "@attacker":
                if(additionalTriggerData.attacker) {
                    return [ additionalTriggerData.attacker ];
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
                    let val = srcToValue(additionalTriggerData.action_target);
                    let type = srcToType(additionalTriggerData.action_target);
                    if(!val || val == null || val == "undefined") return [ ];  // invalid action target
                    console.log("ACTION TARGET", additionalTriggerData.action_target, val, type);
                    switch(type) {
                        case "player":
                            return [ val ];
                        case "player_attr":
                            let attr = await roleAttributeGetPlayer(val);
                            return [ attr.id ];
                        default:
                            //abilityLog(`❗ **Error:** Used \`@ActionTarget\` with invalid action target type \`${type}\`!`);
                            return [ ];
                    }
                } else {
                    // allowed to be used in invalid context since some abilities return a target and others do not
                    return [ ];
                }
            case "@executor":
                if(additionalTriggerData.executor) {
                    return [ additionalTriggerData.executor ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@selection":
                if(additionalTriggerData.selection) {
                    let id = additionalTriggerData.selection.match(ID_SELECTOR_EXTENDED);
                    return id ? [ id[1] ] : [ ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@secondaryselection":
                if(additionalTriggerData.secondaryselection) {
                    let id = additionalTriggerData.secondaryselection.match(ID_SELECTOR_EXTENDED)[1];
                    return id ? [ id[1] ] : [ ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@rolechanger":
                if(additionalTriggerData.role_changer) {
                    return [ additionalTriggerData.role_changer ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@chooser":
                if(additionalTriggerData.chooser) {
                    let val = srcToValue(additionalTriggerData.chooser);
                    let type = srcToType(additionalTriggerData.chooser);
                    switch(type) {
                        case "player":
                            return [ val ];
                        case "player_attr":
                            let attr = await roleAttributeGetPlayer(val);
                            return [ attr.id ];
                        default:
                            abilityLog(`❗ **Error:** Used \`@Chooser\` with invalid chooser type \`${type}\`!`);
                            return [ ];
                    }
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@visitor":
                if(additionalTriggerData.visitor == null) {
                    return [ ];
                } else if(additionalTriggerData.visitor) {
                    return [ additionalTriggerData.visitor ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@joiner":
                if(additionalTriggerData.joiner === null) {
                    return [ ];
                } else if(additionalTriggerData.joiner) {
                    return [ additionalTriggerData.joiner ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@visitparameter":
                if(additionalTriggerData.visit_parameter) {
                    return [ additionalTriggerData.visit_parameter ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@ind":
                if(additionalTriggerData.ind) {
                    return [ additionalTriggerData.ind ];
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@voters":
                if(additionalTriggerData.voters) {
                    return additionalTriggerData.voters;
                } else {
                    return invalidSelector(selectorTarget);
                }
            case "@othervoters":
                if(additionalTriggerData.other_voters) {
                    return additionalTriggerData.other_voters;
                } else {
                    return invalidSelector(selectorTarget);
                } 
            case "@result":
            case "@result1":
            case "@result2":
            case "@result3":
            case "@result4":
            case "@result5":
            case "@result6":
            case "@result7":
            case "@actionresult":
                let result = parseResult(selectorTarget, additionalTriggerData);
                if(result.target && srcToType(result.target) === "player") {
                    return [ srcToValue(result.target) ];
                }
                abilityLog(`❗ **Error:** Failed to cast result to player!`);
                return [ ];

            // unknown selector
            default:
                if(ID_SELECTOR.test(selectorTarget)) { // id selector - this is not in formalizations; this is generated by prompt replies
                    let id = selectorTarget.match(ID_SELECTOR)[1];
                    return [ id ];
                } else if (ADVANCED_SELECTOR.test(selectorTarget)) { // advanced selector
                    let contents = selectorTarget.match(ADVANCED_SELECTOR);
                    return await parseAdvancedPlayerSelector(contents[1], self, additionalTriggerData, aliveOnly);
                } else if (PROPERTY_ACCESS.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS); // get the selector
                    let infType = await inferTypeRuntime(`@${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`@${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                } else if (PROPERTY_ACCESS_TEAM.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_TEAM); // get the selector
                    let infType = await inferTypeRuntime(`&${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`&${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                }  else if (PROPERTY_ACCESS_GROUP.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_GROUP); // get the selector
                    let infType = await inferTypeRuntime(`#${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`#${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                } else if (HOST_INFORMATION.test(selectorTarget)) { // host information
                    let hi = await getHostInformation(srcToValue(self), selectorTarget.replace(/%/g,""));
                    if(hi) return hi;
                    else invalidSelector(selectorTarget);
                } else { // invalid access
                    return invalidSelector(selectorTarget);
                }
        }
    }
    
    function invalidSelector(sel) {
        abilityLog(`❗ **Error:** Invalid player selector target \`${sel}\`!`);
        console.log("INVALID");
        return [ ];
    }
    
    /**
    Get all living player ids
    **/
    this.getAllLivingIDs = function() {
        return new Promise(res => {
            sql("SELECT id FROM players WHERE type='player' AND alive=1", result => {
                res(result.map(el => el.id));
            })
        });
    }
    
    /**
    Get all dead player ids
    **/
    this.getAllDeadIDs = function() {
        return new Promise(res => {
            sql("SELECT id FROM players WHERE type='player' AND alive=0", result => {
                res(result.map(el => el.id));
            })
        });
    }
    
    /** PRIVATE
    Parses a property access
    **/
    async function parsePropertyAccess(result, property, type) {
        // return count for any type
        if(property === "count") {
            return result.value.length;
        }
        
        // select function depending on type
        switch(type) {
            case "player":
                return parsePlayerPropertyAccess(result.value, property);
            break;
            case "alignment":
                return parseTeamPropertyAccess(result.value, property);
            break;
            case "attribute":
            case "activeAttribute":
                if(result.value[0] && result.value[0].ai_id) result.value = result.value.map(el => el.ai_id);
                return parseAttributePropertyAccess(result.value, property);
            break;
            case "group":
                return parseGroupPropertyAccess(result.value, property);
            break;
            case "location":
                if(result.type === "group") {
                    return parseGroupPropertyAccess([ result.value ], property);
                } else {     
                    abilityLog(`❗ **Error:** Invalid property access type \`${result.type}\`!`);
                }
            break;
            case "role":
                return parseRolePropertyAccess(result.value, property);
            break;
            case "result":
                return parseResultPropertyAccess(result.value, property);
            break;
            case "null": // returned by unset runtime inferring, returns blank
                return [ ];
            break;
            default:
                abilityLog(`❗ **Error:** Invalid property access type \`${type}\`!`);
                return [ ];
            break;
        }
    }
    
    /** PRIVATE
    Parses a property access on a player
    **/
    async function parsePlayerPropertyAccess(selector, property) {
        property = property.toLowerCase();
        let output = [];
        let random = false;
        let mostFreq = false;
        // iterate players
        for(let i = 0; i < selector.length; i++) {
            let playerData = await getPlayer(selector[i]);
            if(!playerData) {    
                abilityLog(`❗ **Error:** Attempted player property access on \`${selector[i]}\` which is not a player!`);
                continue;
            }
            //console.log(selector[i], playerData);
            // execute property access
            switch(property) {
                case "role":
                    output.push(playerData.role);
                break;
                case "category":
                    output.push(playerData.category);
                break;
                case "originalrole":
                    output.push(playerData.orig_role);
                break;
                case "alignment":
                    output.push(playerData.alignment);
                break;
                case "target":
                    output.push(playerData.target);
                break;
                case "counter":
                    output.push(playerData.counter);
                break;
                case "publicvotingpower":
                    let publicVotingPower = await pollValue(selector[i], "public");
                    output.push(publicVotingPower);
                break;
                case "privatevotingpower":
                    let privateVotingPower = await pollValue(selector[i], "private");
                    output.push(privateVotingPower);
                break;
                case "randomplayer":
                    output.push(selector[i]);
                    random = true;
                break;
                case "mostfreqrole":
                    output.push(playerData.role);
                    mostFreq = true;
                break;
                default:  
                    if(ATTR_PROPERTY.test(property)) {
                        let contents = property.match(ATTR_PROPERTY); // get the selector
                        let attrName = contents[1].toLowerCase();
                        let attr = await queryAttributePlayer(selector[i], "attr_type", "custom", "val1", attrName);
                        attr = attr.map(el => el.ai_id);
                        output.push(...attr);
                        // check for role attribute
                        let hasRA = await playerHasRoleAttribute(selector[i], attrName);
                        if(hasRA) output.push("0");
                    } else {
                        abilityLog(`❗ **Error:** Invalid player property access \`${property}\`!`);
                    }
                break;
            }
        }
        // return most frequent occurence
        if(mostFreq) {
            // shuffle so that "ties" are randomized
            let shuffledOutput = shuffleArray(output);
    
            // sort by frequency
            let mostFreq = shuffledOutput.sort((a,b) => {
                return shuffledOutput.filter(v => v === a).length - shuffledOutput.filter(v => v === b).length;
            });
            
            // return most frequent role
            return [ mostFreq.pop() ];
        }
        // randomize output
        if(random) {
            let shuffledOutput = shuffleArray(output);
            return [ shuffledOutput[0] ];
        }
        // return output
        return output;
    }
    
    /** PRIVATE
    Parses a property access on a team
    **/
    async function parseTeamPropertyAccess(selector, property) {
        property = property.toLowerCase();
        let output = [];
        // iterate players
        for(let i = 0; i < selector.length; i++) {
            let teamData = await getTeam(selector[i]);
            if(!teamData) {    
                abilityLog(`❗ **Error:** Attempted team property access on \`${selector[i]}\` which is not a team!`);
                continue;
            }
            //console.log(teamData);
            // execute property access
            switch(property) {
                case "target":
                    output.push(teamData.target);
                break;
                case "counter":
                    output.push(teamData.counter);
                break;
                case "members":
                    let mem = await sqlPromEsc("SELECT id FROM players WHERE alignment=", selector[i]);
                    mem = mem.map(el => el.id);
                    output.push(...mem);
                break;
                default:  
                    if(ATTR_PROPERTY.test(property)) {
                        let contents = property.match(ATTR_PROPERTY); // get the selector
                        let attr = await queryAttribute("owner", selector[i], "attr_type", "custom", "val1", contents[1].toLowerCase());
                        output.push(...attr.map(el => el.ai_id));
                    } else {
                        abilityLog(`❗ **Error:** Invalid team property access \`${property}\`!`);
                    }
                break;
            }
        }
        // return output
        return output;
    }
    
    /** PRIVATE
    Parses a property access on a team
    **/
    async function parseAttributePropertyAccess(selector, property) {
        property = property.toLowerCase();
        let output = [];
        // iterate players
        for(let i = 0; i < selector.length; i++) {
            let attrData = await getAttribute(selector[i]);
            if(!attrData) {    
                abilityLog(`❗ **Error:** Attempted attribute property access on \`${selector[i]}\` which is not an attribute!`);
                continue;
            }
            //console.log(attrData);
            // execute property access
            switch(property) {
                case "target":
                    output.push(attrData.target);
                break;
                case "counter":
                    output.push(attrData.counter);
                break;
                case "source":
                    let val = srcToValue(attrData.src_ref);
                    let type = srcToType(attrData.src_ref);
                    if(type === "player") output.push(val);
                    else abilityLog(`❗ **Error:** Can't return non-player source in attribute property acess!`);
                break;
                case "value1":
                    output.push(attrData.val2.toLowerCase());
                break;
                case "value2":
                    output.push(attrData.val3.toLowerCase());
                break;
                case "value3":
                    output.push(attrData.val4.toLowerCase());
                break;
                default:  
                    abilityLog(`❗ **Error:** Invalid attribute property access \`${property}\`!`);
                break;
            }
        }
        // return output
        return output;
    }
    
    /** PRIVATE
    Parses a property access on a group
    **/
    async function parseGroupPropertyAccess(selector, property) {
        property = property.toLowerCase();
        let output = [];
        // iterate players
        for(let i = 0; i < selector.length; i++) {
            let groupData = await getGroup(selector[i]);
            if(!groupData) {    
                abilityLog(`❗ **Error:** Attempted group property access on \`${selector[i]}\` which is not a group!`);
                continue;
            }
            //console.log(groupData);
            // execute property access
            switch(property) {
                case "target":
                    output.push(groupData.target);
                break;
                case "counter":
                    output.push(groupData.counter);
                break;
                case "members":
                    let mem = await groupGetMembers(groupData.name);
                    mem = mem.map(el => el.id);
                    output.push(...mem);
                break;
                default:  
                    if(ATTR_PROPERTY.test(property)) {
                        let contents = property.match(ATTR_PROPERTY); // get the selector
                        let attr = await queryAttribute("owner", selector[i], "attr_type", "custom", "val1", contents[1].toLowerCase());
                        output.push(...attr.map(el => el.ai_id));
                    } else {
                        abilityLog(`❗ **Error:** Invalid group property access \`${property}\`!`);
                    }
                break;
            }
        }
        // return output
        return output;
    }
    
    /** PRIVATE
    Parses a property access on a role
    **/
    async function parseRolePropertyAccess(selector, property) {
        property = property.toLowerCase();
        let output = [];
        // iterate players
        for(let i = 0; i < selector.length; i++) {
            let roleData = await getRole(selector[i]);
            if(!roleData) {    
                abilityLog(`❗ **Error:** Attempted role property access on \`${selector[i]}\` which is not a role!`);
                continue;
            }
            //console.log(roleData);
            // execute property access
            switch(property) {
                case "class":
                    output.push(roleData.class);
                break;
                case "category":
                    output.push(roleData.category);
                break;
                case "team":
                case "alignment":
                    output.push(roleData.team);
                break;
                case "type":
                    output.push(roleData.type);
                break;
                case "players":
                    let all = await getAllPlayers();
                    all = all.filter(el => el.alive == 1);
                    all = all.filter(el => el.role === selector[i]);
                    all = all.map(el => el.id);
                    output.push(...all);
                break;
                default:  
                    abilityLog(`❗ **Error:** Invalid role property access \`${property}\`!`);
                break;
            }
        }
        // return output
        return output;
    }
    
    /** PRIVATE
    Parses a property access on a result
    **/
    async function parseResultPropertyAccess(selector, property) {
        property = property.toLowerCase();
        let output = [];
        // iterate results
        for(let i = 0; i < selector.length; i++) {
            let resultData = selector[i];
            //console.log(resultData);
            // execute property access
            switch(property) {
                case "class":
                    if(!resultData.class) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.class);
                break;
                case "category":
                    if(!resultData.category) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.category);
                break;
                case "role":
                    if(!resultData.role) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.role);
                break;
                case "alignment":
                    if(!resultData.alignment) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.alignment);
                break;
                case "result":
                    if(!resultData.result) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.result);
                break;
                case "success":
                    if(!resultData.success) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.success);
                break;
                case "target":
                    if(!resultData.target) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.target);
                break;
                case "message":
                    if(!resultData.msg) {    
                        abilityLog(`❗ **Error:** Attempted to access a result property which this result does not have!`);
                        continue;
                    }
                    output.push(resultData.msg);
                break;
                default:  
                    abilityLog(`❗ **Error:** Invalid result property access \`${property}\`!`);
                break;
            }
        }
        // return output
        return output;
    }
    
    
    /** PRIVATE
    Parses an advanced player selector
    **/
    async function parseAdvancedPlayerSelector(selector, self, additionalTriggerData, aliveOnlyDefault = true) {
        // split selector into its components
        const selSplit = selector.toLowerCase().split(",").map(el => el.split(":"));
        // get all players
        let allPlayers = await getAllPlayers();
        //allPlayers.forEach(el => console.log(el));
        // set flags
        let aliveOnly = aliveOnlyDefault;
        let selectAll = true;
        // iterate through all selector components
        for(let i = 0; i < selSplit.length; i++) {
            const compName = selSplit[i][0];
            let compVal = selSplit[i][1].toLowerCase().replace(/\-/g," ");
            let compInverted = false;
            if(compVal[0] === "!") {
                compVal = compVal.substr(1);
                compInverted = true;
            }
            //console.log("PLAYERS", allPlayers.map(el => el.id).join(";"));
            //console.log("AS", compName, compVal, compInverted);
            let compValSplit;
            switch(compName) {
                default:
                    abilityLog(`❗ **Error:** Unknown advanced selector component \`${compName}\`!`);
                break;
                // Role
                case "role":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.role === compVal);
                    else allPlayers = allPlayers.filter(el => el.role != compVal);
                break;
                // Category
                case "cat":
                case "category":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.category === compVal);
                    else allPlayers = allPlayers.filter(el => el.category != compVal);
                break;
                // Class
                case "class":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.class === compVal);
                    else allPlayers = allPlayers.filter(el => el.class != compVal);
                break;
                // Alignment
                case "align":
                case "alignment":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.team === compVal);
                    else allPlayers = allPlayers.filter(el => el.team != compVal);
                break;
                // Full Category
                case "fullcat":
                case "full_cat":
                    compValSplit = compVal.split("-");
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.class === compValSplit[0] && el.category === compValSplit[1]);
                    else allPlayers = allPlayers.filter(el => el.class != compValSplit[0] || el.category != compValSplit[1]);
                break;
                // Original Role
                case "origrole":
                case "orig_role":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_role === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_role != compVal);
                break;
                // Original Role Category
                case "origcat":
                case "orig_cat":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_cat === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_cat != compVal);
                break;
                // Original Role Class
                case "origclass":
                case "orig_class":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_class === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_class != compVal);
                break;
                // Original Alignment
                case "origalign":
                case "orig_align":
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_align === compVal);
                    else allPlayers = allPlayers.filter(el => el.orig_align != compVal);
                break;
                // Original Full Category
                case "origfullcat":
                case "orig_fullcat":
                    compValSplit = compVal.split("-");
                    if(!compInverted) allPlayers = allPlayers.filter(el => el.orig_class === compValSplit[0] && el.orig_cat === compValSplit[1]);
                    else allPlayers = allPlayers.filter(el => el.orig_class != compValSplit[0] || el.orig_cat != compValSplit[1]);
                break;
                // Group - Query by group membership
                case "group":
                    let groupMembers = await getAllGroupMembers(compVal);
                    if(!compInverted) allPlayers = allPlayers.filter(el => groupMembers.includes(el.id));
                    else allPlayers = allPlayers.filter(el => !groupMembers.includes(el.id));
                break;
                // Attr - Find players that have a certain custom attribute
                case "attr":
                case "attribute":
                    // check for normal attribute ownership
                    let attrCustomOwners = await queryAttribute("attr_type", "custom", "val1", compVal);
                    attrCustomOwners = attrCustomOwners.map(el => el.owner);
                    // check for role attribute ownership
                    for(let j = 0; j < allPlayers.length; j++) {
                        let hasRA = await playerHasRoleAttribute(allPlayers[j].id, compVal);
                        if(hasRA) attrCustomOwners.push(allPlayers[j].id);
                    }
                    // filter
                    if(!compInverted) allPlayers = allPlayers.filter(el => attrCustomOwners.includes(el.id));
                    else allPlayers = allPlayers.filter(el => !attrCustomOwners.includes(el.id));
                break;
                // AttrSelf - Find players that have a certain custom attribute CREATED BY SELF
                case "attrself":
                    // check for normal attribute ownership
                    let attrSelfCustomOwners = await queryAttribute("attr_type", "custom", "val1", compVal, "src_ref", self);
                    attrSelfCustomOwners = attrSelfCustomOwners.map(el => el.owner);
                    // filter
                    if(!compInverted) allPlayers = allPlayers.filter(el => attrSelfCustomOwners.includes(el.id));
                    else allPlayers = allPlayers.filter(el => !attrSelfCustomOwners.includes(el.id));
                break;
                // AttrRole - Find players that have a certain role attribute
                case "attrrole":
                    let attrRoleOwners = await queryAttribute("attr_type", "role", "val1", compVal);
                    attrRoleOwners = attrRoleOwners.map(el => el.owner);
                    if(!compInverted) allPlayers = allPlayers.filter(el => attrRoleOwners.includes(el.id));
                    else allPlayers = allPlayers.filter(el => !attrRoleOwners.includes(el.id));
                break;
                // AttrDisguise - Find players that have a disguise created by a certain player
                case "attrdisguise":
                    let target = await parsePlayerSelector(`@${compVal}`, self, additionalTriggerData);
                    let attrDisOwners = await queryAttribute("attr_type", "disguise", "src_ref", `player:${target[0]}`);
                    attrDisOwners = attrDisOwners.map(el => el.owner);
                    if(!compInverted) allPlayers = allPlayers.filter(el => attrDisOwners.includes(el.id));
                    else allPlayers = allPlayers.filter(el => !attrDisOwners.includes(el.id));
                break;
                // AliveOnly - Allows enabling of selecting dead players
                case "aliveonly":
                    if(compVal === "false") aliveOnly = false;
                break;
                // SelectAll - Allows enabling of limiting the selector to 1 random player
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
    
    /** PRIVATE
    Parses an advanced player selector
    **/
    async function parseAdvancedRoleSelector(selector, self, additionalTriggerData) {
        // split selector into its components
        const selSplit = selector.toLowerCase().split(",").map(el => el.split(":"));
        // get all players
        let allRoles = await sqlProm("SELECT * FROM roles");
        //allRoles.forEach(el => console.log(el));
        // set flags
        let selectAll = true;
        // iterate through all selector components
        for(let i = 0; i < selSplit.length; i++) {
            const compName = selSplit[i][0];
            let compVal = selSplit[i][1].toLowerCase().replace(/\-/g," ");
            let compInverted = false;
            if(compVal[0] === "!") {
                compVal = compVal.substr(1);
                compInverted = true;
            }
            //console.log("ROLES", allRoles.map(el => el.id).join(";"));
            //console.log("AS", compName, compVal, compInverted);
            let compValSplit;
            switch(compName) {
                default:
                    abilityLog(`❗ **Error:** Unknown advanced selector component \`${compName}\`!`);
                break;
                // Category
                case "category":
                case "cat":
                    if(!compInverted) allRoles = allRoles.filter(el => el.category === compVal);
                    else allRoles = allRoles.filter(el => el.category != compVal);
                break;
                // type
                case "type":
                    if(!compInverted) allRoles = allRoles.filter(el => el.type === compVal);
                    else allRoles = allRoles.filter(el => el.type != compVal);
                break;
                // Class
                case "class":
                    if(!compInverted) allRoles = allRoles.filter(el => el.class === compVal);
                    else allRoles = allRoles.filter(el => el.class != compVal);
                break;
                // Alignment
                case "team":
                case "align":
                case "alignment":
                    if(!compInverted) allRoles = allRoles.filter(el => el.team === compVal);
                    else allRoles = allRoles.filter(el => el.team != compVal);
                break;
            }
        }
        return allRoles.map(el => el.name);
    }
    
    /** PRIVATE
    Parses an advanced team selector
    **/
    async function parseAdvancedTeamSelector(selector, self, additionalTriggerData) {
        // split selector into its components
        const selSplit = selector.toLowerCase().split(",").map(el => el.split(":"));
        // get all teams
        let allTeams = await getAllTeams();
        // allTeams.forEach(el => console.log(el));
        // iterate through all selector components
        for(let i = 0; i < selSplit.length; i++) {
            const compName = selSplit[i][0];
            let compVal = selSplit[i][1];
            let compInverted = false;
            if(compVal[0] === "!") {
                compVal = compVal.substr(1);
                compInverted = true;
            }
            //console.log("TEAMS", allTeams.map(el => el.id).join(";"));
            //console.log("AS", compName, compVal, compInverted);
            let compValSplit;
            switch(compName) {
                default:
                    abilityLog(`❗ **Error:** Unknown advanced selector component \`${compName}\`!`);
                break;
                // Alignment
                case "align":
                case "alignment":
                    if(!compInverted) allTeams = allTeams.filter(el => el.name === compVal);
                    else allTeams = allTeams.filter(el => el.name != compVal);
                break;
                // Attr - Find teams that have a certain custom attribute
                case "attr":
                    let attrCustomOwners = await queryAttribute("attr_type", "custom", "val1", compVal);
                    attrCustomOwners = attrCustomOwners.map(el => el.owner);
                    if(!compInverted) allTeams = allTeams.filter(el => attrCustomOwners.includes(el.name));
                    else allTeams = allTeams.filter(el => !attrCustomOwners.includes(el.name));
                break;
            }
        }
        // return
        return allTeams.map(el => el.name);
    }
    
    /**
    Get all player 
    **/
    function getAllPlayers() {
        return sqlProm("SELECT players.id,players.role,players.orig_role,players.alive,role.class,role.category,role.team,orig_role.class AS orig_class,orig_role.category AS orig_cat,orig_role.team AS orig_align FROM players INNER JOIN roles AS role ON players.role=role.name INNER JOIN roles AS orig_role ON players.orig_role=orig_role.name WHERE players.type='player'");
    }
    
    /**
    Get all teams 
    **/
    function getAllTeams() {
        return sqlProm("SELECT * FROM teams WHERE active=1");
    }
    
    /**
    Get a single player 
    **/
    function getPlayer(id) {
        return sqlPromOneEsc("SELECT players.id,players.role,players.orig_role,players.alive,players.alignment,players.target,players.counter,role.class,role.category,role.team,orig_role.class AS orig_class,orig_role.category AS orig_cat,orig_role.team AS orig_align FROM players INNER JOIN roles AS role ON players.role=role.name INNER JOIN roles AS orig_role ON players.orig_role=orig_role.name WHERE players.type='player' AND players.id=", id);
    }
    
    /**
    Get a single team
    **/
    function getTeam(name) {
        return sqlPromOneEsc("SELECT * FROM teams WHERE name=", name);
    }
    
    /**
    Get a single attribute
    **/
    function getAttribute(id) {
        return sqlPromOneEsc("SELECT * FROM active_attributes WHERE ai_id=", id);
    }
    
    /**
    Get a single group
    **/
    function getGroup(id) {
        return sqlPromOneEsc("SELECT * FROM active_groups WHERE channel_id=", id);
    }
    
    /**
    Get a single role
    **/
    function getRole(name) {
        return sqlPromOneEsc("SELECT * FROM roles WHERE name=", name);
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
    const ADVANCED_SELECTOR_ROLE = /^\^\((.+)\)$/;
    this.parseRoleSelector = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        /** WIP: Needs to be able to parse much more! **/
        switch(selectorTarget) {
            // target
            case "@target":
                if(!self) { // if no self is specified, @Self is invalid
                    abilityLog(`❗ **Error:** Used \`@Target\` in invalid context!`);
                    return [ ];
                }
                let target = await getTarget(self);
                target = srcToValue(target);
                return [ target ];
            case "@result":
            case "@result1":
            case "@result2":
            case "@result3":
            case "@result4":
            case "@result5":
            case "@result6":
            case "@result7":
            case "@actionresult":
                let result = parseResult(selectorTarget, additionalTriggerData);
                if(result.role) {
                    let parsedRole = parseRole(result.role);
                    if(verifyRole(parsedRole)) {
                        return [ parsedRole ];
                    }
                }
                abilityLog(`❗ **Error:** Failed to cast result to role!`);
                return [ ];
            case "@visitparameter":
                if(additionalTriggerData.visit_parameter) {
                    return [ parseRole(additionalTriggerData.visit_parameter) ];
                } else {
                    abilityLog(`❗ **Error:** Invalid role selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            case "@option":
                if(additionalTriggerData.chosen) {
                    return [ parseRole(additionalTriggerData.chosen) ];
                } else {
                    abilityLog(`❗ **Error:** Invalid role selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            case "@selection":
                if(additionalTriggerData.selection) {
                    return [ parseRole(selectorGetTarget(additionalTriggerData.selection)) ];
                } else {
                    abilityLog(`❗ **Error:** Invalid role selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            case "@secondaryselection":
                if(additionalTriggerData.secondaryselection) {
                    return [ parseRole(selectorGetTarget(additionalTriggerData.secondaryselection)) ];
                } else {
                    abilityLog(`❗ **Error:** Invalid role selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            case "^all":
                let allRoles = await sqlProm("SELECT name FROM roles");
                return allRoles.map(el => el.name);
            break;
            default:
                let parsedRole = parseRole(selectorTarget);
                if(verifyRole(parsedRole)) {
                    return [ parsedRole ];
                } else if (ADVANCED_SELECTOR_ROLE.test(selectorTarget)) { // advanced selector
                    let contents = selectorTarget.match(ADVANCED_SELECTOR_ROLE);
                    return await parseAdvancedRoleSelector(contents[1], self, additionalTriggerData);
                } else if (PROPERTY_ACCESS.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS); // get the selector
                    let infType = await inferTypeRuntime(`@${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`@${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                } else if (PROPERTY_ACCESS_TEAM.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_TEAM); // get the selector
                    let infType = await inferTypeRuntime(`&${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`&${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                }  else if (PROPERTY_ACCESS_GROUP.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_GROUP); // get the selector
                    let infType = await inferTypeRuntime(`#${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`#${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                } else if (HOST_INFORMATION.test(selectorTarget)) { // host information
                    let hi = await getHostInformation(srcToValue(self), selectorTarget.replace(/%/g,""));
                    if(hi) return hi;
                    abilityLog(`❗ **Error:** Invalid role selector target \`${selectorTarget}\`!`);
                    return [ ];
                } else {
                    abilityLog(`❗ **Error:** Invalid role selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
        }
    }
    
    /**
    Parse Source Selector
    parses a source type selector
    **/
    this.parseSourceSelector = function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector); 
        selectorTarget = selectorTarget.replace(/`/g, "");
        switch(selectorTarget) {
            case "@attacksource":
                if(additionalTriggerData.attack_source) {
                    return [ additionalTriggerData.attack_source ];
                } else {
                    abilityLog(`❗ **Error:** Invalid source selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            default:
                if(selectorTarget.split(":").length === 2) {
                    return [ selectorTarget.toLowerCase() ];
                } else {
                    abilityLog(`❗ **Error:** Invalid source selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
        }
    }
    
    /**
    Parse Option Selector
    parses an option type selector
    **/
    this.parseOptionSelector = function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector); 
        selectorTarget = selectorTarget.replace(/`/g, "");
        switch(selectorTarget) {
            case "@option":
                if(additionalTriggerData.chosen) {
                    return [ additionalTriggerData.chosen ];
                } else {
                    abilityLog(`❗ **Error:** Invalid chosen selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            default:
                return [ selectorTarget ];
        }
    }
    
    /**
    Parse String Selector
    parses a string type selector
    **/
    this.parseStringSelector = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector); 
        selectorTarget = selectorTarget.replace(/`/g, "");
        if (PROPERTY_ACCESS.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS); // get the selector
            let infType = await inferTypeRuntime(`@${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`@${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return parsePropertyAccess(result, contents[2], infType);
        } else if (PROPERTY_ACCESS_TEAM.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS_TEAM); // get the selector
            let infType = await inferTypeRuntime(`&${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`&${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return parsePropertyAccess(result, contents[2], infType);
        }  else if (PROPERTY_ACCESS_GROUP.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS_GROUP); // get the selector
            let infType = await inferTypeRuntime(`#${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`#${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return parsePropertyAccess(result, contents[2], infType);
        }
        return [ selectorTarget ];
    }
    
    /**
    Parse Attribute Selector
    parses a attribute type selector
    **/
    this.parseAttributeSelector = function(selector, self = null, additionalTriggerData = {}, noErr = false) {
        // get target
        selector = selector.replace(/`/g, "");
        let selectorTarget = selectorGetTarget(selector.split(":")[0]); // split to remove active attribute selector info in case we parse an active attribute as a normal one
        switch(selectorTarget) {
            case "@visitparameter":
                if(additionalTriggerData.visit_parameter) {
                    return [ parseAttributeName(additionalTriggerData.visit_parameter) ];
                } else {
                    if(!noErr) abilityLog(`❗ **Error:** Invalid attribute selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            default:
                let parsed = parseAttributeName(selectorTarget);
                if(verifyAttribute(parsed)) {
                    return [ parsed ];
                } else {
                    if(!noErr) abilityLog(`❗ **Error:** Invalid attribute selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
        }
    }
    
    /**
    Parse Active Attribute Selector
    parses a attribute type selector for active attributes
    **/
    this.parseActiveAttributeSelector = async function(selector, self = null, additionalTriggerData = {}, onElement = null, noErr = false) {
        // get all attributes on the target element
        if(!onElement) return [ ];
        let attributes = getCustomAttributes(onElement);
        let attrNames = attributes.map(el => el[3]);
        // get target
        let selectorTarget = selectorGetTarget(selector.replace(/`/g,""));
        switch(selectorTarget) {
            // ThisAttr
            case "@thisattr":
                if(!self) { // if no self is specified, @ThisAttr is invalid
                    abilityLog(`❗ **Error:** Used \`@ThisAttr\` in invalid context!`);
                    return [ ];
                }
                let pself = srcToValue(self);
                let attrName = getCustomAttributeName(pself);
                return [ { ai_id: pself, name: attrName, type: "custom" } ];
            default:
                let splitTarget = selectorTarget.split(":");
                let parsed = parseAttributeName(splitTarget[0]);
                let parsedGeneric = parseGenericAttributeType(splitTarget[0]);
                //console.log(parsed, parsedGeneric, verifyAttribute(parsed), attrNames.includes(parsed));
                if(verifyAttribute(parsed) && attrNames.includes(parsed)) {
                    let filtered;
                    switch(splitTarget.length) {
                        case 1: // just attribute name
                            filtered = attributes.filter(el => {
                                let nameMatch = el[3] === parsed;
                                return nameMatch;
                            });
                        break;
                        case 2: // attribute name and src_ref/src_name
                            filtered = attributes.filter(el => {
                                let nameMatch = el[3] === parsed;
                                let srcRefMatch = el[1].split(":")[1] === splitTarget[1];
                                let srcNameMatch = el[4].split(":")[1] === splitTarget[1];
                                let selfMatch = splitTarget[1] === "self" && el[1].split(":")[1] === srcToValue(self);
                                return nameMatch && (srcRefMatch || srcNameMatch || selfMatch);
                            });
                        break;
                        case 3:  // attribute name and value1 (+ maybe src_ref/src_name)
                            if(splitTarget[1].length === 0) {
                                filtered = attributes.filter(el => {
                                    let nameMatch = el[3] === parsed;
                                    let val1Match = el[5] === splitTarget[2];
                                    return nameMatch && val1Match;
                                });
                            } else {
                                filtered = attributes.filter(el => {
                                    let nameMatch = el[3] === parsed;
                                    let srcRefMatch = el[1].split(":")[1] === splitTarget[1];
                                    let srcNameMatch = el[4].split(":")[1] === splitTarget[1];
                                    let selfMatch = splitTarget[1] === "self" && el[1].split(":")[1] === srcToValue(self);
                                    let val1Match = el[5] === splitTarget[2];
                                    return nameMatch && (srcRefMatch || srcNameMatch || selfMatch) && val1Match;
                                });
                            }
                        break;
                        default:
                            if(!noErr) abilityLog(`❗ **Error:** Invalid active attribute selector target format \`${selectorTarget}\`!`);
                            return [ ];
                        break;
                    }
                    // return 
                    return filtered.map(el => { return { ai_id: el[0], name: el[3], type: "custom" } });
                } else if(onElement && parsedGeneric) { // check for generic attribute
                    let srcVal = srcToValue(onElement);
                    let genericAttrs = await getGenericAttributes(srcVal);
                    console.log("generic attributes", genericAttrs);
                    let filtered;
                    switch(splitTarget.length) {
                        case 1: // just attribute name
                            filtered = genericAttrs.filter(el => {
                                let typeMatch = parseGenericAttributeType(el.attr_type) === parsedGeneric;
                                return typeMatch;
                            });
                        break;
                        case 2: // attribute name and src_ref/src_name
                            filtered = genericAttrs.filter(el => {
                                let typeMatch = parseGenericAttributeType(el.attr_type) === parsedGeneric;
                                let srcRefMatch = el.src_ref.split(":")[1] === splitTarget[1];
                                let srcNameMatch = el.src_name.split(":")[1] === splitTarget[1];
                                let val1Match = el.val1 === splitTarget[1].toLowerCase();
                                let selfMatch = splitTarget[1] === "self" && el.src_ref.split(":")[1] === srcToValue(self);
                                return typeMatch && (srcRefMatch || srcNameMatch || val1Match || selfMatch);
                            });
                        break;
                        default:
                            if(!noErr) abilityLog(`❗ **Error:** Invalid active attribute selector target format \`${selectorTarget}\`!`);
                            return [ ];
                        break;
                    }
                    // return 
                    return filtered.map(el => { return { ai_id: el.ai_id, name: parseGenericAttributeType(el.attr_type), type: "generic" } });
                } else if (PROPERTY_ACCESS.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS); // get the selector
                    let infType = await inferTypeRuntime(`@${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`@${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    let pa = await parsePropertyAccess(result, contents[2], infType);
                    return pa.map(el => ({ ai_id: el, name: getCustomAttributeName(el), type: "custom" }));
                } else if (PROPERTY_ACCESS_TEAM.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_TEAM); // get the selector
                    let infType = await inferTypeRuntime(`&${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`&${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    let pa = await parsePropertyAccess(result, contents[2], infType);
                    return pa.map(el => ({ ai_id: el, name: getCustomAttributeName(el), type: "custom" }));
                }  else if (PROPERTY_ACCESS_GROUP.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_GROUP); // get the selector
                    let infType = await inferTypeRuntime(`#${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`#${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    let pa = await parsePropertyAccess(result, contents[2], infType);
                    return pa.map(el => ({ ai_id: el, name: getCustomAttributeName(el), type: "custom" }));
                } else {
                    if(!noErr) abilityLog(`❗ **Error:** Invalid active attribute selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
        }
    }
    
    
    /**
    Parse Alignment
    parses an alignment name
    **/
    const ADVANCED_SELECTOR_TEAM = /^&\((.+)\)$/;
    const PROPERTY_ACCESS_TEAM = /^&(.+)->(.+)$/;
    this.parseAlignment = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        switch(selectorTarget) {
            // result
            case "@result":
            case "@result1":
            case "@result2":
            case "@result3":
            case "@result4":
            case "@result5":
            case "@result6":
            case "@result7":
            case "@actionresult":
                let result = parseResult(selectorTarget, additionalTriggerData);
                if(result.alignment) {
                    let parsedTeam = parseTeam(result.alignment);
                    if(verifyTeam(parsedTeam)) {
                        return [ parsedTeam ];
                    }
                }
                abilityLog(`❗ **Error:** Failed to cast result to alignment!`);
                return [ ];
            case "@visitparameter":
                if(additionalTriggerData.visit_parameter) {
                    return [ parseTeam(additionalTriggerData.visit_parameter) ];
                } else {
                    abilityLog(`❗ **Error:** Invalid alignment selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            case "@option":
                if(additionalTriggerData.chosen) {
                    return [ parseTeam(additionalTriggerData.chosen) ];
                } else {
                    abilityLog(`❗ **Error:** Invalid alignment selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
            // all teams
            case "&all":
                let allTeams = await getAllTeams();
                return allTeams.map(el => el.name);
            break;
            // self
            case "&self":
                if(!self) { // if no self is specified, &Self is invalid
                    abilityLog(`❗ **Error:** Used \`&Self\` in invalid context!`);
                    return [ ];
                }
                let val = srcToValue(self);
                let type = srcToType(self);
                switch(type) {
                    default:
                        abilityLog(`❗ **Error:** Used \`@Self\` with invalid self type \`${type}\`!`);
                        return [ ];
                    case "team":
                        return [ val ];
                }
           // team in a for each loop
            case "&ind":
                if(additionalTriggerData.ind) {
                    return [ additionalTriggerData.ind ];
                } else {
                    abilityLog(`❗ **Error:** Used \`&Ind\` in invalid context!`);
                    return [ ];
                }
            // team name selector
            default:
                let parsed = parseTeam(selectorTarget);
                if(verifyTeam(parsed)) {
                    return [ parsed ];
                } else if (PROPERTY_ACCESS.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS); // get the selector
                    let infType = await inferTypeRuntime(`@${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`@${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                } else if (PROPERTY_ACCESS_TEAM.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_TEAM); // get the selector
                    let infType = await inferTypeRuntime(`&${contents[1]}`, self, additionalTriggerData);
                    let result = await parseSelector(`&${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                } else if (PROPERTY_ACCESS_GROUP.test(selectorTarget)) { // property access
                    let contents = selectorTarget.match(PROPERTY_ACCESS_GROUP); // get the selector
                    let infType = await inferTypeRuntime(`#${contents[1]}`);
                    let result = await parseSelector(`#${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
                    return parsePropertyAccess(result, contents[2], infType);
                } else if (ADVANCED_SELECTOR_TEAM.test(selectorTarget)) { // advanced selector
                    let contents = selectorTarget.match(ADVANCED_SELECTOR_TEAM);
                    return await parseAdvancedTeamSelector(contents[1], self, additionalTriggerData);
                } else {
                    abilityLog(`❗ **Error:** Invalid alignment selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
        }
    }
    
    /**
    Parse Active Extra Role Selector
    parses an extra role type selector
    and returns a channel id
    **/
    this.parseActiveExtraRoleSelector = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        switch(selectorTarget) {
            // ThisAttr
            case "@thisattr":
                if(!self) { // if no self is specified, @ThisAttr is invalid
                    abilityLog(`❗ **Error:** Used \`@ThisAttr\` in invalid context!`);
                    return [ ];
                }
                let pself = srcToValue(self);
                return [ pself ];
            default:
                let parsedRole = parseRole(selectorTarget);
                if(verifyRole(parsedRole)) {
                    let connections = await connectionGet(`${parsedRole}:${self}`);
                    return connections.map(el => el.channel_id);
                } else {
                    abilityLog(`❗ **Error:** Invalid extra role selector target \`${selectorTarget}\`!`);
                    return [ ];
                }
        }
    }
    
    /**
    Parse Group Name
    parses a group name
    WIP: DOESNT CONSIDER THE :'ed GROUP NAMES
    **/
    const PROPERTY_ACCESS_GROUP = /^#(.+)->(.+)$/;
    this.parseGroup = async function(selector, self = null, additionalTriggerData = {}, forceCreate = false) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        if(selectorTarget === "@self") {
            if(!self) { // if no self is specified, @Self is invalid
                abilityLog(`❗ **Error:** Used \`@Self\` in invalid context!`);
                return null;
            }
            let pself = srcToValue(self);
            return pself;
        }
        // parse group
        let parsedGroupName = parseGroupName(selectorTarget);
        if(cachedGroups.indexOf(parsedGroupName) >= 0) {
            // get channel id
            let groupData = await groupGetData(parsedGroupName);
             // create group if force create is set to true
            if(forceCreate && (!groupData || !groupData.channel_id)) {
                await groupsCreate(parsedGroupName);
                groupData = await groupGetData(parsedGroupName);
            }
            // check if group exists
            if(!groupData || !groupData.channel_id) {
                abilityLog(`❗ **Error:** Could not find group \`${parsedGroupName}\`!`);
                return null;
            }
            // return channel id
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
                return { value: parseLocationName(selectorTarget), type: "location", default: false, multiple: false };
            } else if(verifyGroup(selectorTarget)) {
                let group = await parseGroup(selectorTarget, self, additionalTriggerData, true);
                return { value: group, type: "group", default: false, multiple: false };   
            } else {
                let def = cachedLocations[0]; // default is whatever location is first
                abilityLog(`❗ **Error:** Invalid location \`${selectorTarget}\`. Defaulted to \`${def}\`!`);
                return { value: def, type: "location", default: true, multiple: false };              
            }
        } else if(selectorTarget[0] === "`") { // location is an active extra role
            let paers = await parseActiveExtraRoleSelector(selector, self, additionalTriggerData);
            if(paers.length === 1) return { value: paers[0], type: "player_attr", default: false, multiple: false };
            // else - not really an error... this should be a [] output 
            //abilityLog(`❗ **Error:** Invalid active extra role location \`${selectorTarget}\`!`);
            return { value: null, type: null, default: true, multiple: false };
        } else { // location is a player
            if(selectorTarget === "@self") {
                if(!self) { // if no self is specified, @Self is invalid
                    abilityLog(`❗ **Error:** Used \`@Self\` in invalid context!`);
                    return [ ];
                }
                let val = srcToValue(self);
                let type = srcToType(self);
                switch(type) {
                    default:
                        abilityLog(`❗ **Error:** Used \`@Self\` with invalid self type \`${type}\`!`);
                        return { value: null, type: null, default: true, multiple: false };
                    case "player":
                        return { value: val, type: "player", default: false, multiple: false };
                    case "player_attr":
                        return { value: val, type: "player_attr", default: false, multiple: false };
                    case "attribute":
                        let source = getCustomAttributeOwner(val);
                        return { value: srcToValue(source), type: srcToType(source), default: false, multiple: false };
                    case "group":
                        return { value: val, type: "group", default: false, multiple: false };
                }
            } else if(selectorTarget === "@attacklocation") {
                // try attacker
                console.log("ATTACK LOCATION", additionalTriggerData);
                if(additionalTriggerData.attacker) { // if no attacker is specified, @Attacker is invalid
                    return { value: additionalTriggerData.attacker, type: "player", default: false, multiple: false };
                }
                // try attack source
                if(additionalTriggerData.attack_source) {
                    let val = srcToValue(additionalTriggerData.attack_source);
                    let typ = srcToType(additionalTriggerData.attack_source);
                    if(typ === "group") {
                        let groupData = await groupGetData(val);
                        return { value: groupData.channel_id, type: "group", default: false, multiple: false };
                    }
                }
                abilityLog(`❗ **Error:** Used \`@AttackLocation\` in invalid context!`);
                return [ ];
            } else {
                let parsedPlayer = await parsePlayerSelector(selectorTarget, self, additionalTriggerData);
                if(parsedPlayer.length != 1) {
                    return { value: parsedPlayer, type: "players", default: false, multiple: true };
                }
                return { value: parsedPlayer[0], type: "player", default: false, multiple: false };
            }
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
            let pself = srcToValue(self); // get poll name
            return pself; 
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
    Parse Display
    parses a display
    **/
    this.parseDisplay = function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        if(verifyDisplayName(selectorTarget)) {
            return selectorTarget;
        } else {
            abilityLog(`❗ **Error:** Invalid displays \`${selectorTarget}\`.!`);
            return null;              
        }
    }
    
    /**
    Parse Display Value
    parses a display value
    **/
    this.parseDisplayValue = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        switch(selectorTarget) {
            case "yes":
                return `<:${client.emojis.cache.get(stats.yes_emoji).name}:${client.emojis.cache.get(stats.yes_emoji).id}>`;
            case "no":
                return `<:${client.emojis.cache.get(stats.no_emoji).name}:${client.emojis.cache.get(stats.no_emoji).id}>`;
            case "counter":
                let count = await getCounter(self);
                return count;
            case "target":
                let target = await getTarget(self);
                let targetText = srcRefToText(target);
                return targetText;
            default:
                console.log(selectorGetTarget);
                let txt = await parseInfo(selector, self, additionalTriggerData);
                return txt;
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
    this.parseResult = function(selector, additionalTriggerData = {}) {
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
        // check if its a selector
        let selectorTargetNormal = selectorGetTarget(selector);
        switch(selectorTargetNormal) { // if its not a selector, simply continue so no default case here
            case "@actionfeedback":
                if(additionalTriggerData.action_feedback) {
                    return additionalTriggerData.action_feedback;
                } else {
                    abilityLog(`❗ **Error:** Invalid info selector target \`${selectorTargetNormal}\`!`);
                    return [ ];
                }
            case "%partialrolelist%":
                let hi = await getHostInformation(srcToValue(self), selectorTargetNormal.replace(/%/g,""));
                if(hi) {
                    return hi;
                } else {
                    abilityLog(`❗ **Error:** Invalid info \`${selectorTargetNormal}\`!`);
                    return "";         
                }
        }
        
        // get target
        let selectorTarget = selector.split("`[")[0]; // we cant actually use the util function as it converts to lower case
        selectorTarget = selectorTarget.replace(/`/g,"");
        let spl = selectorTarget.split(" ");
        // convert text segments to selectors if applicable
        for(let i = 0; i < spl.length; i++) {
            let infType = await inferTypeRuntime(spl[i], self, additionalTriggerData);
            if(infType != "unknown") {
                let parsed = await parseSelector(`${spl[i]}[${infType}]`, self, additionalTriggerData);
                console.log(infType, spl[i], parsed.type, parsed.value);
                let strs = [];
                // iterate through selector list
                for(let j = 0; j < parsed.value.length; j++) {
                    // attribute values are string but may contain another value that can be parsed
                    if(infType === "string" && parsed.value[j].split("[").length === 2) {
                        let stringReparsed = await parseSelector(parsed.value[j], self, additionalTriggerData);
                        for(let k = 0; k < stringReparsed.value.length; k++) {
                            let txt = (["string","info"].includes(stringReparsed.type) ? stringReparsed.value[j] : srcRefToText(`${stringReparsed.type}:${stringReparsed.value[j]}`, stringReparsed.value[j]));
                            strs.push(txt);
                        }
                        continue;
                    }
                    let prefix = "";
                    if(infType === "player") {
                        let emoji = idToEmoji(parsed.value[j]);
                        if(emoji) prefix = emoji + " ";
                    }
                    let txt = prefix + (["string","info"].includes(infType) ? parsed.value[j] : srcRefToText(`${infType}:${parsed.value[j]}`, parsed.value[j]));
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
    const abilityTypeNames = ["killing","investigating","targeting","disguising","protecting","applying","redirecting","manipulating","whispering","joining","granting","loyalty","obstructing","poll","announcement","changing","","choices","ascend","descend","disband","counting","reset","cancel","","feedback","success","failure","log","process_evaluate","abilities","emit","storing","displaying"];
    this.parseAbilityType = function(ability_type, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(ability_type);
        if(abilityTypeNames.includes(selectorTarget)) {
            return selectorTarget;
        } else if(selectorTarget == "@visittype") {
            if(additionalTriggerData.visit_type) {
                return [ additionalTriggerData.visit_type.toLowerCase() ];
            } else {
                abilityLog(`❗ **Error:** Invalid ability type selector target \`${selectorTarget}\`!`);
                return [ ];
            }
        } else if(selectorTarget == "@actionabilitytype") {
            if(additionalTriggerData.ability_type) {
                return [ additionalTriggerData.ability_type.toLowerCase() ];
            } else {
                abilityLog(`❗ **Error:** Invalid ability type selector target \`${selectorTarget}\`!`);
                return [ ];
            }
        } else {
            abilityLog(`❗ **Error:** Invalid ability type \`${selectorTarget}\`. Defaulted to \`none\`!`);
            return "none";
        }
    }
    
    this.verifyAbilityTypeName = function(abilityType) {
        return abilityTypeNames.includes(abilityType);
    }
    
    /**
    Parse ability category
    **/
    const abilityCategoryNames = ["all", "non-killing abilities"];
    this.parseAbilityCategory = function(ability_category) {
        // get target
        let selectorTarget = selectorGetTarget(ability_category);
        if(abilityCategoryNames.includes(selectorTarget)) {
            return selectorTarget;
        } else {
            abilityLog(`❗ **Error:** Invalid ability category \`${selectorTarget}\`. Defaulted to \`all\`!`);
            return "all";
        }
    }
    
    /**
    Parse killing type
    **/
    this.killingTypeNames = ["attack","kill","lynch","true kill","banish","true banish"];
    this.parseKillingType = function(killing_type, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(killing_type);
        selectorTarget = selectorTarget.replace(/`/g,"");
        
        switch(selectorTarget) {
            case "@deathtype":
                if(additionalTriggerData.death_type) {
                    return additionalTriggerData.death_type;
                } else {
                    abilityLog(`❗ **Error:** Invalid killing type selector target \`${sel}\`!`);
                    return [ ];
                }
            case "@killingtype":
                if(additionalTriggerData.killing_type) {
                    return additionalTriggerData.killing_type;
                } else {
                    abilityLog(`❗ **Error:** Invalid killing type selector target \`${sel}\`!`);
                    return [ ];
                }
            default:      
                console.log(killingTypeNames, selectorTarget);
                if(killingTypeNames.includes(selectorTarget)) {
                    return selectorTarget;
                } else {
                    abilityLog(`❗ **Error:** Invalid killing type \`${selectorTarget}\`. Defaulted to \`attack\`!`);
                    return "attack";
                }
        }
    }
    
    /**
    Parse class
    **/
    this.parseClass = function(class_name, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(class_name);
        selectorTarget = selectorTarget.replace(/`/g, "");
        switch(selectorTarget) {
            // result
            case "@result":
            case "@result1":
            case "@result2":
            case "@result3":
            case "@result4":
            case "@result5":
            case "@result6":
            case "@result7":
            case "@actionresult":
                let result = parseResult(selectorTarget, additionalTriggerData);
                if(result.class) {
                    return [ result.class ];
                }
                abilityLog(`❗ **Error:** Failed to cast result to class!`);
                return [ ];
            default:      
                return [ selectorTarget ];
        }
    }
    
    /**
    Parse ability subtype
    **/
    const abilitySubtypeNames = [
        ["attack","kill","lynch","true-kill","banish","true-banish"], // killing
        ["role","alignment","class","category","player_count","count","attribute"], // investigating
        ["target","untarget"], // targeting
        ["weakly","strongly"], // disguising
        ["active","passive","partial","recruitment","absence"], // protecting
        ["add","remove","change","change_parsed"], // applying
        [], // redirecting
        ["absolute","relative"], // vote manipulation
        [], // whispering
        ["add","remove"], // joining
        ["add","remove","transfer"], // granting
        [], // loyalty
        [], // obstruction
        ["creation","addition","deletion","cancellation","manipulation","votes"], // poll
        ["immediate","buffer"], // announcement
        ["role","alignment","group"], // changing
        null, // copying
        ["creation","choosing"], // choices
        [], // ascend
        [], // descend
        [], // disband
        ["increment","decrement","set","increment_math","decrement_math","set_math"], // counting
        [], // conversation reset
        [], // cancel
        null, // switching
        [], // feedback
        [], // success
        [], // failure
        [], // log
        [], // process_evaluate
        [], // abilities
        [], // emit
        [], // storing
        ["create","change"], // displaying
        ];
    this.parseAbilitySubtype = function(ability_subtype, self = null, additionalTriggerData = {}) {
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
        } else if(selectorTarget == "@visitsubtype") {
            if(additionalTriggerData.visitsubtype) {
                return [ additionalTriggerData.visitsubtype.toLowerCase() ];
            } else {
                abilityLog(`❗ **Error:** Invalid ability subtype selector target \`${selectorTarget}\`!`);
                return [ ];
            }
        } else { // type is invalid
            abilityLog(`❗ **Error:** Invalid ability type \`${selectorTargetSplit[1]}\` in \`${selectorTarget}\`. Defaulted to \`none none\`!`);
            return "none none";
        }
    }
    
    /**
    Parse Number
    parses a number
    **/
    this.parseNumber = async function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        selectorTarget = selectorTarget.replace(/`/g,"");
        // is number?
        if(!isNaN(selectorTarget)) { // direct number
            return +selectorTarget;
        } else if(selectorTarget === "@selection") {
            if(additionalTriggerData.selection) {
                return await parseNumber(additionalTriggerData.selection, self, additionalTriggerData);
            } else {
                abilityLog(`❗ **Error:** Invalid number selector target \`${selectorTarget}\`!`);
                return 0;
            }
        } else if(selectorTarget === "@secondaryselection") {
            if(additionalTriggerData.secondaryselection) {
                return await parseNumber(additionalTriggerData.secondaryselection, self, additionalTriggerData);
            } else {
                abilityLog(`❗ **Error:** Invalid number selector target \`${selectorTarget}\`!`);
                return 0;
            }
        } else if (PROPERTY_ACCESS.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS); // get the selector
            let infType = await inferTypeRuntime(`@${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`@${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return + (await parsePropertyAccess(result, contents[2], infType));
        } else if (PROPERTY_ACCESS_TEAM.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS_TEAM); // get the selector
            let infType = await inferTypeRuntime(`&${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`&${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return + (await parsePropertyAccess(result, contents[2], infType));
        } else if (PROPERTY_ACCESS_GROUP.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS_GROUP); // get the selector
            let infType = await inferTypeRuntime(`#${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`#${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return + (await parsePropertyAccess(result, contents[2], infType));
        } else if (HOST_INFORMATION.test(selectorTarget)) { // host information
            let hi = await getHostInformation(srcToValue(self), selectorTarget.replace(/%/g,""));
            if(hi) {
                return hi;
            } else {
                abilityLog(`❗ **Error:** Invalid number \`${selectorTarget}\`!`);
                return 0;         
            }
        } else { // not a number
            selectorTarget = await applyVariables(selectorTarget);
            if(!isNaN(selectorTarget)) { // direct variable
                return +selectorTarget;
            } else { // division
                let splitSel = selectorTarget.split("/");
                if(splitSel.length == 2) {
                    let val1 = await parseNumber(splitSel[0], self, additionalTriggerData);
                    let val2 = await parseNumber(splitSel[1], self, additionalTriggerData);
                     if(!isNaN(val1) && !isNaN(val2)) {
                        return Math.round((+val1) / (+val2));
                     } else {
                        abilityLog(`❗ **Error:** Invalid number in division \`${selectorTarget}\`!`);
                        return 0;         
                     }
                } else {
                    abilityLog(`❗ **Error:** Invalid number \`${selectorTarget}\`!`);
                    return 0;         
                }
            }
        }
    }
    
    /**
    Parse Boolean
    parses a boolean
    **/
    this.parseBoolean = function(selector, self = null, additionalTriggerData = {}) {
        // get target
        let selectorTarget = selectorGetTarget(selector);
        // is boolean?
        if(["true","false"].includes(selectorTarget)) { // direct boolean
            return selectorTarget;
        } else { // not a boolean
            abilityLog(`❗ **Error:** Invalid boolean \`${selectorTarget}\`!`);
            return "false";       
        }
    }
    
    /**
    Applies Variables
    **/
    this.applyVariables = async function(txt) {
            let players = await getAllPlayers();
            let totalCount = players.length;
            let aliveCount = players.filter(el => el.alive == 1).length;
            txt = txt.replace(/\$total/, totalCount);
            txt = txt.replace(/\$living/, aliveCount);
            txt = txt.replace(/\$phase/, getPhaseAsNumber());
            return txt;
    }
    
    
    
    /**
    Parse Choice
    parses a choice
    **/
    this.parseChoice = function(choice) {
        let target = selectorGetTarget(choice);
        return target.trim().toLowerCase().replace(/[^a-z]/g,"");
    }
    
    /**
    Parse Option
    parses an option
    **/
    this.parseOption = function(option) {
        let target = selectorGetTarget(option);
        return target.trim().toLowerCase().replace(/[^a-z]/g,"");
    }
    
    /**
    Parse Option
    parses an option for display
    **/
    this.parseOptionDisplay = function(option) {
        let target = option.split("[")[0];
        return target.trim();
    }
    
    /**
    Parse Category
    parses a role category
    **/
    this.parseCategory = async function(category, self = null, additionalTriggerData = {}) {
        let selectorTarget = selectorGetTarget(category);
        selectorTarget = selectorTarget.replace(/`/g, "");
        if (PROPERTY_ACCESS.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS); // get the selector
            let infType = await inferTypeRuntime(`@${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`@${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return parsePropertyAccess(result, contents[2], infType);
        } else if (PROPERTY_ACCESS_TEAM.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS_TEAM); // get the selector
            let infType = await inferTypeRuntime(`&${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`&${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return parsePropertyAccess(result, contents[2], infType);
        } else if (PROPERTY_ACCESS_GROUP.test(selectorTarget)) { // property access
            let contents = selectorTarget.match(PROPERTY_ACCESS_GROUP); // get the selector
            let infType = await inferTypeRuntime(`#${contents[1]}`, self, additionalTriggerData);
            let result = await parseSelector(`#${contents[1]}[${infType}]`, self, additionalTriggerData); // parse the selector part
            return parsePropertyAccess(result, contents[2], infType);
        }
        return [ selectorTarget ] ;
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
    Change Selector Type
    returns a selector with a changed type
    **/
    this.selectorChangeType = function(selector, type) {
        let selec = selectorGetTarget(selector);
        return `${selec}[${type}]`;
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
            abilityLog(`❗ **Error:** Invalid duration type \`${dur_type}\`. Defaulted to \`phase\`!`);
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
        defro_type = defro_type.toLowerCase().replace(/ (& )?/g,"_").replace(/[^a-z_]/g,"");
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
    
    /**
    Parse Manip Type
    parses a manipulation type
    defaults to "public" (public voting power);
    **/
    const manipTypes = ["public voting power","special public voting power","private voting power"];
    const manipTypesShort = ["public","special","private","starting"];
    this.parseManipType = function(manip_type) {
        manip_type = manip_type.toLowerCase();
        if(manipTypes.includes(manip_type)) {
            return manipTypesShort[manipTypes.indexOf(manip_type)];
        } else {
            abilityLog(`❗ **Error:** Invalid manipulation type \`${manip_type}\`. Defaulted to \`public\`!`);
            return "public";
        }
    }
    
    /**
    Parse Manip Type Poll
    parses a manipulation type for poll disqualification manipulation
    defaults to "unvotable"
    **/
    const manipTypesPoll = ["unvotable","disqualified"];
    this.parseManipTypePoll = function(manip_type) {
        manip_type = manip_type.toLowerCase();
        if(manipTypesPoll.includes(manip_type)) {
            return manip_type;
        } else {
            abilityLog(`❗ **Error:** Invalid manipulation type \`${manip_type}\`. Defaulted to \`unvotable\`!`);
            return "unvotable";
        }
    }
    
    /**
    Parse Manip Type Votes
    parses a manipulation type for poll votes manipulation
    defaults to "visible"
    **/
    const manipTypesVotes = ["visible","hidden"];
    this.parseManipTypeVotes = function(manip_type) {
        manip_type = manip_type.toLowerCase();
        if(manipTypesVotes.includes(manip_type)) {
            return manip_type;
        } else {
            abilityLog(`❗ **Error:** Invalid manipulation type \`${manip_type}\`. Defaulted to \`visible\`!`);
            return "visible";
        }
    }
    
    /**
    Parse Generic Attribute Name
    defaults to "visible"
    **/
    const genericAttributeTypeNames = ["disguise","defense","absence","manipulation","groupmembership","obstruction","pollcount","pollresult","polldisqualification","pollvotes","role","redirection","loyalty","whisper"];
    this.parseGenericAttributeType = function(attrTypeName) {
        attrTypeName = attrTypeName.toLowerCase().replace(/_/g,"");
        if(genericAttributeTypeNames.includes(attrTypeName)) {
            return attrTypeName;
        } else {
            return null;
        }
    }
    
    /**
    Infer Type at Run Time
    **/
    this.inferTypeRuntime = async function(val, self, additionalTriggerData) {
        if(val === "@self") {
            let type = srcToType(self);
            if(type === "attribute") type = "player"; // for attributes we want @Self to be the player. @ThisAttr is attribute instead
            return type;
        } else if(val === "@target" || val === "@targetdead") {
            let target = await getTarget(self);
            if(!target) return "null";
            let targetType = srcToType(target);
            console.log(`Inferred target type as ${targetType} from ${target}`);
            return targetType;
        } else if(val === "@selection") {
            return additionalTriggerData.selection_type;
        } else if(val === "@secondaryselection") {
            return additionalTriggerData.secondaryselection_type;
        }
        return inferType(val);
    }
    
    
    
}
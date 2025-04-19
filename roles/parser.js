/**
Roles Parser

**/
module.exports = function() {
    
    /**
    Debug Mode
    If set to true does console.log, if set to false does throw
    **/
    const debugMode = false;
    
    /**
    Ability Counter
    used to assign unique ids to abilities
    **/
    var abilityCounter = 0;

    /**
    Format Constants
    Constants of the input format
    **/
    const actionTimings = ["Start Night","End Night","Start Day","End Day","Immediate Night","Immediate Day","End Phase","Start Phase","Immediate","Pre-End Night","Pre-End Day","Second Pre-End Night","Second Pre-End Day","Third Pre-End Night","Third Pre-End Day","Fourth Pre-End Night","Fourth Pre-End Day"];
    const passiveTriggers = ["Passive", "Passive End Day", "Passive End Night", "Passive Start Day", "Passive Start Night", "Passive Start Phase", "Passive End Phase"];
    const electionTriggers = ["On Election", "On Mayor Election", "On Reporter Election", "On Guardian Election"];
    const defenseTriggers = ["On Defense", "On Passive Defense", "On Partial Defense", "On Recruitment Defense", "On Active Defense", "On Absence Defense"];
    const basicTriggerTypes = [...actionTimings, "Starting", ...passiveTriggers, "On Death", "On Killed", "On Banished", "On Banishment", "On Visited", "On Action", "On Disbandment", "On Lynch", ...electionTriggers, ...defenseTriggers, "On Betrayal", "On Poll Closed", "On Poll Win", "On Poll Skipped", "On Role Change", "On Removal", "On End", "Choice Chosen", "On Emitted", "On End Emitted", "On Redirect", "On Any Action", "On Join"]; // basic trigger types
    const bullets = ["•","‣","◦","·","⁃","⹀"];

    /**
    Delete Parameters
    Deletes the parameters besides abilities
    **/
    this.delParam = function(tr) {
        return tr.map(el => el.ability);
    }
    
    this.delParamInplace = function(tr) {
        return tr.map(el => {
            delete el.parameters;
            return el;
        });
    }

    /**
    Parse Role
    Parses a role from a string into an object
    **/
    this.parseRoleText = function(inputLines) {
        if(debugMode) console.log("-=- S T A R T -=-");
        
        if(inputLines[0] === "TBD") {
            throw new Error(`Unfinished role.`);
        }
        
        // replace ":" within strings
       inputLines = inputLines.map(el => el.replace(/`([^`]*)`/g, (_, inner) => "`" + inner.replace(/: /g, " ~COLON~ ") + "`"));

        // split the role into its triggers
        if(debugMode) console.log("PARSE TRIGGERS");
        let triggers = parseTriggers(inputLines);
        if(debugMode) console.log(JSON.stringify(triggers));
        
        // get a default param for comparision
        const defaultParams = parseAbility("Disband").parameters;
        
        if(debugMode) console.log("PARSE ABILITIES");
        
        for(const t in triggers.triggers) {
            const thisTrigger = triggers.triggers[t];
            
            // get trigger name
            const thisTriggerName = thisTrigger[0];
            
            // parse abilities
            let thisTriggerAbilities = parseAbilities(thisTrigger[1]).abilities;

            
            // abilities
            if(debugMode) console.log("ABILITIES", JSON.stringify(thisTriggerAbilities));

            
            /** P/E Reformatting **/
            peReformat(thisTriggerAbilities);
            
            /* Remove Blank */
            thisTriggerAbilities = thisTriggerAbilities.filter(el => el.ability.type != "blank"); // remove blank lines
            
            // extract additional parameters
            let additionalParameters = thisTriggerAbilities.filter(el => el.ability.type === "parameters");
            thisTriggerAbilities = thisTriggerAbilities.filter(el => el.ability.type != "parameters"); // remove parameters lines
            if(additionalParameters.length === 1) {
                if(thisTriggerAbilities[0]) thisTriggerAbilities[0].parameters = additionalParameters[0].parameters;
                else throw new Error(`Cant find first ability in \`\`\`${JSON.stringify(thisTriggerAbilities)}\`\`\``);
            } else if(additionalParameters.length > 1) {
                if(!debugMode) throw new Error(`Too many additional parameters.`);
            }
            
            /** Formatting */
            /* Output */
            let paramAbilities = thisTriggerAbilities.filter(el => el.ability.type != "error" && el.parameters && !deepEqual(el.parameters, defaultParams)); // check which abilities have params attached
            // no params
            if(paramAbilities.length == 0) {
                triggers.triggers[t] = { trigger: thisTriggerName, abilities: delParam(thisTriggerAbilities) };
            }
            // params attached to first line
            else if(paramAbilities.length == 1 && !deepEqual(thisTriggerAbilities[0], defaultParams)) {
                triggers.triggers[t] = { trigger: thisTriggerName, abilities: delParam(thisTriggerAbilities), parameters: thisTriggerAbilities[0].parameters };
            } else { // parameters are used in an invalid way
                if(!debugMode) throw new Error(`Invalid Parameters \`\`\`\n${thisTriggerName}\n\`\`\` and \`\`\`\n${JSON.stringify(thisTriggerAbilities)}\n\`\`\``);
                else triggers.triggers[t] = { trigger: "error_invalid_parameters", abilities: [], error_data: { trigger: thisTriggerName, abilities: thisTriggerAbilities } };
            }
            
            // removes the ability type 'action' as that gets moved into parameters
            triggers.triggers[t].abilities = triggers.triggers[t].abilities.filter(el => el.type != "action");
            
            // adjust data for complex triggers
            if(triggers.triggers[t].trigger.match(/;/)) {
                let trsplit = triggers.triggers[t].trigger.split(/;/);
                triggers.triggers[t].trigger = trsplit[0] + " Complex";
                triggers.triggers[t].trigger_parameter = trsplit[1];
                if(trsplit[2]) triggers.triggers[t].trigger_parameter2 = trsplit[2];
                triggers.triggers[t].complex = true;
            }
            
        }
        
        
        return triggers;
    }
    
    function peReformat(thisTriggerAbilities) {
        for(let i = 0; i < thisTriggerAbilities.length; i++) {
            // is process and next is evaluate
            if(thisTriggerAbilities[i].ability.type === "process" && thisTriggerAbilities[i + 1] && thisTriggerAbilities[i + 1].ability.type === "evaluate") {
                // get p/e
                let process = thisTriggerAbilities[i].ability;
                let evaluate = thisTriggerAbilities[i + 1].ability;
                let storedCondition = null;
                // parse conditions
                evaluate.sub_abilities = evaluate.sub_abilities.map(el => {
                    if(el.ability.type === "condition") storedCondition = el.condition;
                    let ret = el;
                    ret.condition_text = ret.condition ?? storedCondition;
                    if(!ret.condition_text) ret.condition_text = "Always";
                    ret.condition = parseCondition(ret.condition_text);
                    return ret;
                });
                peReformat(evaluate.sub_abilities);
                // reformat p/e
                thisTriggerAbilities[i].ability = { type: "process_evaluate", process: process, evaluate: evaluate, id: abilityCounter++ }; // replace "process" with a combined P/E ability
                thisTriggerAbilities[i + 1].ability = { type: "blank" }; // delete "evaluate"
            }
            // is process and no next / evaluate
            if(thisTriggerAbilities[i].ability.type === "process" && !thisTriggerAbilities[i + 1]) {
                // get p/e
                let process = thisTriggerAbilities[i].ability;
                let evaluate = { type: "evaluate", sub_abilities: [] };
                // reformat p/e
                thisTriggerAbilities[i].ability = { type: "process_evaluate", process: process, evaluate: evaluate, id: abilityCounter++ }; // replace "process" with a combined P/E ability
            }
            // is evaluate and no process
            else if((i === 0 || thisTriggerAbilities[i - 1].ability.type != "process") && thisTriggerAbilities[i].ability.type === "evaluate") {
                // get p/e
                let evaluate = thisTriggerAbilities[i].ability;
                let storedCondition = null;
                let storedConditionIndex = -1;
                // parse conditions
                for(let i = 0; i < evaluate.sub_abilities.length; i++) {
                    if(evaluate.sub_abilities[i].ability.type === "condition") { // store a condition and create an abilities block
                        storedCondition = true;
                        storedConditionIndex = i;
                        evaluate.sub_abilities[i].condition_text = evaluate.sub_abilities[i].condition;
                        evaluate.sub_abilities[i].condition = parseCondition(evaluate.sub_abilities[i].condition);
                        evaluate.sub_abilities[i].ability = { type: "abilities", sub_abilities: [ ], id: abilityCounter++ };
                    } else if(storedCondition && !evaluate.sub_abilities[i].condition) { // use stored condition, pushes the ability into that conditions block
                        evaluate.sub_abilities[storedConditionIndex].ability.sub_abilities.push(evaluate.sub_abilities[i].ability);
                        delete evaluate.sub_abilities[i]; // we cant write to this directly as we want the object to persist in the other array we just copied it too
                        evaluate.sub_abilities[i] = { ability: { type: "blank" } };
                    } else { // default, parse condition
                        storedCondition = false;
                        evaluate.sub_abilities[i].condition_text = evaluate.sub_abilities[i].condition;
                        evaluate.sub_abilities[i].condition = parseCondition(evaluate.sub_abilities[i].condition);
                    }
                }
                // remove blank abilities
                evaluate.sub_abilities = evaluate.sub_abilities.filter(el => el.ability.type != "blank");
                peReformat(evaluate.sub_abilities);
                // reformat p/e
                thisTriggerAbilities[i].ability = { type: "process_evaluate", process: { type: "process", sub_abilities: [ ] }, evaluate: evaluate, id: abilityCounter++ }; // replace "evaluate" with a combined P/E ability
            }
            else if(thisTriggerAbilities[i].ability.type === "for_each") {
                peReformat(thisTriggerAbilities[i].ability.sub_abilities);
            }
        }
    }
    
    /**
    Parse Abilities
    **/
    this.parseAbilities = function(abilities, startIndex = 0, parsingDepth = 0, parsingType = "none") {
        // get a default param for comparision
        const defaultParams = parseAbility("Disband").parameters;
        if(debugMode) console.log(`PARSING ABILITIES from ${startIndex} at ${parsingDepth} as ${parsingType}`);
        // init
        let abilitiesParsed = [];
        let parameters = {};
        // iterate
        for(let i = startIndex; i < abilities.length; i++) {
            const thisAbilityFull = abilities[i];
            if(!thisAbilityFull) continue; // triggers without abilities
            // get depth
            const bullet = thisAbilityFull.trim()[0]; // extract bullet character
            const depth = (+bullets.indexOf(bullet)) + 1; // get bullet index
            // split into different components
            const abilityLineSplit = thisAbilityFull.replace(bulletsRegex,"").trim().split(/ \[| \{| ⟨| \|/);
            let thisAbility = abilityLineSplit[0].trim();
            let abilityValues, thisAbilitySplit;
            if(/\[|\{|⟨|\|/.test(thisAbility[0])) { // empty ability, just values
                abilityValues = thisAbilityFull.replace(bulletsRegex,"").trim();
                thisAbilitySplit = [];
                thisAbility = "";
            } else { // ability exists, so do values (maybe)
                thisAbilitySplit = thisAbility.split(/(?<!List): |(?<!List):$/);
                abilityValues = thisAbilityFull.split(thisAbility)[1]?.trim();
            }
            // debug output
            if(debugMode) console.log("   DEPTH", depth, "INDEX", i);
            if(debugMode) console.log("   ABILITY", thisAbilitySplit.join(";"));
            if(debugMode) console.log("   ABILITY VALUES", abilityValues);
            // check if first ability is a depth=1
            if(parsingDepth === 0 && depth === 1 && (abilitiesParsed.length === 0 || (abilitiesParsed.length === 1 && abilitiesParsed[0] && abilitiesParsed[0].ability.type === "parameters"))) {
                parsingDepth = 1;
            }
            // check how many components
            if(depth === parsingDepth) {
                // normal ability
                /** SINGLE SEGMENT **/
                if(thisAbilitySplit.length === 1) {
                    const ability = parseAbility(thisAbilitySplit[0] + " " + abilityValues); // parse ability
                    const hasAbility = thisAbilitySplit[0].length > 0;
                    // Normal Ability / Process Ability
                    if(parsingType === "none" || parsingType === "process" || parsingType === "evaluate_condition") {
                        abilitiesParsed.push(ability);
                    }
                    // Within Evaluate without condition
                    else if(parsingType === "evaluate") {
                        abilitiesParsed.push({ ability: ability.ability, condition: "Always" });
                    }
                    // Unknown case
                    else {
                        if(debugMode) console.log("   UNKNOWN 1 CASE", JSON.stringify(ability));    
                        else throw new Error(`Invalid one segment ability line:\n\`\`\`${thisAbilitySplit.join(";")} \`\`\`with context ${startIndex}, ${parsingDepth}, ${parsingType}.`);
                    }
                }
                /** TWO SEGMENT **/
                // ability that is split into two components
                else if(thisAbilitySplit.length === 2) {
                    const ability = parseAbility(thisAbilitySplit[1] + " " + abilityValues); // parse ability
                    // check if first element is an ability after all
                    let abilityFirst;
                    try {
                        abilityFirst = parseAbility(thisAbilitySplit[0] + " " + abilityValues); 
                    } catch(err) {
                        abilityFirst = null; 
                    }
                    // 
                    const hasAbility = thisAbilitySplit[1].length > 0;
                    const hasCondition = isCondition(thisAbilitySplit[0]);
                    // Process/Evaluate Next Line
                    if(parsingType === "none" && (thisAbilitySplit[0] === "Process" || thisAbilitySplit[0] === "Evaluate") && !hasAbility) {
                        // requires parsing of sub abilities
                        ability.ability.type = thisAbilitySplit[0].toLowerCase(); // update type - it starts out as parameters
                        let subAbilities = parseAbilities(abilities, i + 1, depth + 1, ability.ability.type);
                        i = subAbilities.index;
                        ability.ability.sub_abilities = delParamInplace(subAbilities.abilities);
                        abilitiesParsed.push(ability);    
                    }
                    // Process/Evaluate's Action
                    else if(parsingType === "none" && ability.ability.type === "parameters" && thisAbilitySplit[0] === "Action") {
                        // should parse to "parameters" ability type and can thus be directly added
                        abilitiesParsed.push(ability);    
                    }
                    // Process/Evaluate In-Line
                    else if(parsingType === "none" && (thisAbilitySplit[0] === "Process" || thisAbilitySplit[0] === "Evaluate") && hasAbility) {
                        // only has a single sub ability we already have parsed
                        let type = thisAbilitySplit[0].toLowerCase();
                        abilitiesParsed.push({ ability: { type: type, sub_abilities: [ { ability: ability.ability } ] } });    
                    }
                    // Evaluate sub-conditions
                    else if(parsingType === "evaluate" && hasCondition && hasAbility) {
                        ability.condition = thisAbilitySplit[0];
                        abilitiesParsed.push(ability);
                    }
                    // Evaluate Multi-line Condition
                    else if(parsingType === "evaluate" && hasCondition && !hasAbility) {
                        let subAbilities = parseAbilities(abilities, i + 1, depth + 1, "evaluate_condition");
                        i = subAbilities.index;
                        subAbilities = delParam(subAbilities.abilities);
                        abilitiesParsed.push({ ability: { type: "abilities", sub_abilities: subAbilities, id: abilityCounter++ }, condition: thisAbilitySplit[0] });
                    }
                    // Implied Eval Multiline Condition
                    else if(parsingType === "none" && hasCondition && !hasAbility) {
                        // merge abilities of this condition
                        let subAbilitiesCondition = parseAbilities(abilities, i + 1, depth + 1, "evaluate_condition");
                        i = subAbilitiesCondition.index;
                        subAbilitiesCondition = delParam(subAbilitiesCondition.abilities);
                        const abilitiesAbility = { ability: { type: "abilities", sub_abilities: subAbilitiesCondition, id: abilityCounter++ }, condition: thisAbilitySplit[0] };
                        // find further conditions
                        let subAbilitiesRest = parseAbilities(abilities, i + 1, depth, "evaluate");
                        i = subAbilitiesRest.index;
                        subAbilitiesRest = delParamInplace(subAbilitiesRest.abilities);
                        // create evaluate object
                        let eval = { ability: { type: "evaluate", sub_abilities: [ abilitiesAbility, ...subAbilitiesRest ] } };
                        if(ability.parameters) eval.parameters = ability.parameters;
                        abilitiesParsed.push(eval);
                    }
                    // Implied Evaluate condition
                    else if(parsingType === "none" && hasCondition && hasAbility) {
                        const abilityWithCond = { ability: ability.ability, condition: thisAbilitySplit[0] }; // add condition to ability
                        let subAbilities = parseAbilities(abilities, i + 1, depth, "evaluate");
                        i = subAbilities.index;
                        subAbilities = delParamInplace(subAbilities.abilities);
                        abilitiesParsed.push({ ability: { type: "evaluate", sub_abilities: [abilityWithCond, ...subAbilities] } });
                    }
                    // For Each (Multiline)
                    else if(["none","evaluate"].includes(parsingType) && abilityFirst && abilityFirst.ability.type === "for_each" && !hasAbility) {
                        // get abilities contained in the for each
                        let subAbilities = parseAbilities(abilities, i + 1, depth + 1, "none");
                        i = subAbilities.index;
                        subAbilities = delParamInplace(subAbilities.abilities);
                        // create for each object
                        let forEach = { ability: { type: "for_each", sub_abilities: subAbilities, target: abilityFirst.ability.target, id: abilityCounter++ } };
                        if(abilityFirst.parameters) forEach.parameters = abilityFirst.parameters;
                        abilitiesParsed.push(forEach);
                    }
                    // For Each (Inline)
                    else if(["none","evaluate"].includes(parsingType) && abilityFirst && abilityFirst.ability.type === "for_each" && hasAbility) {
                        // create for each object
                        let forEach = { ability: { type: "for_each", sub_abilities: [ { ability: ability.ability } ], target: abilityFirst.ability.target, id: abilityCounter++ } };
                        if(abilityFirst.parameters) forEach.parameters = abilityFirst.parameters;
                        abilitiesParsed.push(forEach);
                    }
                    // Inline condition within another condition
                    else if(parsingType === "evaluate_condition" && hasCondition && hasAbility) {
                        // create P/E object
                        let innerPE = { ability: { type: "process_evaluate", process: { type: "process", sub_abilities: [] }, evaluate: { type: "evaluate", sub_abilities: [ { ability: ability.ability, condition: parseCondition(thisAbilitySplit[0]), condition_text: thisAbilitySplit[0] } ] } } };
                        abilitiesParsed.push(innerPE);
                    }
                    // Multiline condition within another condition
                    else if(parsingType === "evaluate_condition" && hasCondition && !hasAbility) {
                        let subAbilities = parseAbilities(abilities, i + 1, depth + 1, "evaluate_condition");
                        i = subAbilities.index;
                        subAbilities = delParam(subAbilities.abilities);
                        let condSubAbilities = { ability: { type: "abilities", sub_abilities: subAbilities, id: abilityCounter++ }, condition: parseCondition(thisAbilitySplit[0]), condition_text: thisAbilitySplit[0] };
                        // create P/E object
                        let innerPE = { ability: { type: "process_evaluate", process: { type: "process", sub_abilities: [] }, evaluate: { type: "evaluate", sub_abilities: [ condSubAbilities ] } } };
                        abilitiesParsed.push(innerPE);
                    }
                    // Unknown case
                    else {
                        if(debugMode) console.log("   UNKNOWN 2 CASE", JSON.stringify(ability));    
                        else throw new Error(`Invalid two segment ability line:\n\`\`\`${thisAbilitySplit.join(";")} \`\`\`with context ${startIndex}, ${parsingDepth}, ${parsingType}.`);
                    }
                }
                /** THREE SEGMENT **/
                // ability that is split into three components
                else if(thisAbilitySplit.length === 3) {
                    const ability = parseAbility(thisAbilitySplit[2] + " " + abilityValues); // parse ability
                    const hasAbility = thisAbilitySplit[2].length > 0;
                    // Evaluate In-Line
                    if(parsingType === "none" && thisAbilitySplit[0] === "Evaluate" && isCondition(thisAbilitySplit[1]) && hasAbility) {
                        abilitiesParsed.push({ ability: { type: "evaluate", sub_abilities: [ { ability: ability.ability, condition: thisAbilitySplit[1] } ] } }); 
                    }
                    // Unknown case
                    else {
                        if(debugMode) console.log("   UNKNOWN 3 CASE", JSON.stringify(ability));    
                        else throw new Error(`Invalid three segment ability line:\n\`\`\`${thisAbilitySplit.join(";")} \`\`\`with context ${startIndex}, ${parsingDepth}, ${parsingType}.`);
                    }
                }
                // parameters only
                else if(thisAbilitySplit.length === 0) {
                    const params = parseAbility(abilityValues); // parse parameters
                    abilitiesParsed.push(params);
                }
                // ability that is split into an unknown amount of components
                else {
                    if(debugMode) console.log("   UNKNOWN LENGTH");    
                        else throw new Error(`Invalid ability line component amount:\n\`\`\`${thisAbilitySplit.join(";")} \`\`\`with context ${startIndex}, ${parsingDepth}, ${parsingType}.`);
                }
            } else if(depth > parsingDepth) { // Entering a lesser depth without a reason?
                /** TWO SEGMENT - DEPTH INCREASED **/
                // check if condition, then it must be an implied process
                if(thisAbilitySplit.length === 2) {
                    const ability = parseAbility(thisAbilitySplit[1] + " " + abilityValues); // parse ability
                    const hasAbility = thisAbilitySplit[1].length > 0;
                    const hasCondition = isCondition(thisAbilitySplit[0]);
                    // implied process with inline evaluate conditions
                    if(hasAbility && hasCondition && ability && abilitiesParsed[i - 1]) {
                        // rewrite the previous element to a process
                        abilitiesParsed[i - 1] = { ability: { type: "process", sub_abilities: [ { ability: abilitiesParsed[i - 1].ability } ] }, parameters: abilitiesParsed[i - 1].parameters };
                        // add condition to current element
                        const abilityWithCond = { ability: ability.ability, condition: thisAbilitySplit[0] }; // add condition to ability
                        let subAbilities = parseAbilities(abilities, i + 1, depth, "evaluate"); 
                        i = subAbilities.index; 
                        subAbilities = delParamInplace(subAbilities.abilities);
                        abilitiesParsed.push({ ability: { type: "evaluate", sub_abilities: [ abilityWithCond, ...subAbilities ] } });
                    }
                    // implied process with multiline evaluate conditions
                    else if(!hasAbility && hasCondition && ability && abilitiesParsed[i - 1]) {
                        // rewrite the previous element to a process
                        abilitiesParsed[i - 1] = { ability: { type: "process", sub_abilities: [ { ability: abilitiesParsed[i - 1].ability } ] }, parameters: abilitiesParsed[i - 1].parameters };
                        // merge abilities of this condition
                        let subAbilitiesCondition = parseAbilities(abilities, i + 1, depth + 1, "evaluate_condition");
                        i = subAbilitiesCondition.index;
                        subAbilitiesCondition = delParamInplace(subAbilitiesCondition.abilities);
                        const abilitiesAbility = { ability: { type: "abilities", sub_abilities: subAbilitiesCondition }, condition: thisAbilitySplit[0] };
                        // find further conditions
                        let subAbilitiesRest = parseAbilities(abilities, i + 1, depth, "evaluate");
                        i = subAbilitiesRest.index;
                        subAbilitiesRest = delParamInplace(subAbilitiesRest.abilities);
                        // create evaluate object
                        let eval = { ability: { type: "evaluate", sub_abilities: [ abilitiesAbility, ...subAbilitiesRest ] } };
                        if(ability.parameters) eval.parameters = ability.parameters;
                        abilitiesParsed.push(eval);
                    }
                    // Unknown case
                    else {
                        if(debugMode) console.log("   UNKNOWN 2 DEPTH CASE", JSON.stringify(ability));    
                        else throw new Error(`Invalid two segment ability line (2):\n\`\`\`${thisAbilitySplit.join(";")} \`\`\`with context ${startIndex}, ${parsingDepth}, ${parsingType}.`);
                    }
                } else {
                    if(debugMode) console.log("   UNKNOWN DEPTH CASE");
                    else throw new Error(`Invalid ability line depth:\n\`\`\`${thisAbilitySplit.join(";")} \`\`\`with context ${startIndex}, ${parsingDepth}, ${parsingType}.`);
                }
            } else if(depth < parsingDepth) { // sub-parsing complete, return
                if(debugMode) console.log(`SUB-PARSING DONE`);
                return { abilities: abilitiesParsed, index: i - 1 };
            }
        }
        // return
        if(debugMode) console.log(`PARSING DONE`);
        return { abilities: abilitiesParsed, index: abilities.length - 1 };
    }
    
    /**
    Check if is condition
    **/
    this.isCondition = function(maybeCondition) {
        try {
            let cond = parseCondition(maybeCondition, true);
            if(cond.type && cond.type != "error") return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }
    
    /**
    Parse Condition
    **/
    this.parseCondition = function(condition, noErr = false) {
        let exp, fd, cond;
        
        /** Always **/
        // doesnt have a condition
        if(!condition) {
            if(noErr) return { type: "error" };
            throw new Error(`No Condition`);
        }
        
        /** Otherwise **/
        exp = new RegExp("^Otherwise$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "otherwise" };
        }
        /** Feedback (Otherwise) **/
        exp = new RegExp("^Feedback$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "otherwise" };
        }
        /** Always **/
        exp = new RegExp("^Always$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "always" };
        }
        /** Comparisons **/
        // Equality
        exp = new RegExp("^" + targetType + " is " + targetType + "$", "g");
        fd = exp.exec(condition);
        if(fd) {
            console.log("COND IS", fd[1], fd[2]);
            cond = { type: "comparison", subtype: "equal", first: ttpp(fd[1]), second: ttpp(fd[2]) };
        }
        // Less Than
        exp = new RegExp("^" + targetType + " < " + targetType + "$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "comparison", subtype: "less_than", first: ttpp(fd[1], "number"), second: ttpp(fd[2], "number") };
        }
        // Greater Than
        exp = new RegExp("^" + targetType + " > " + targetType + "$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "comparison", subtype: "greater_than", first: ttpp(fd[1], "number"), second: ttpp(fd[2], "number") };
        }
        // Not
        exp = new RegExp("^" + targetType + " is not " + targetType + "$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "comparison", subtype: "not_equal", first: ttpp(fd[1]), second: ttpp(fd[2]) };
        }
        /** Existence **/
        exp = new RegExp("^" + targetType + " exists$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "existence", target: ttpp(fd[1]) };
        }
        /** Logic **/
        let doubleLogic = false;
        // not
        exp = new RegExp("^not \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            cond = { type: "logic", subtype: "not", condition: parseCondition(fd[1]) };
        }
        // and x3
        exp = new RegExp("^\\((.+?)\\) and \\((.+?)\\) and \\((.+?)\\) and \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            doubleLogic = true;
            cond = { type: "logic", subtype: "and", condition1: parseCondition(`(${fd[1]}) and (${fd[2]})`), condition2: parseCondition(`(${fd[3]}) and (${fd[4]})`) };
        }
        // and / or
        exp = new RegExp("^\\((.+?)\\) and \\((.+?)\\) or \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            doubleLogic = true;
            cond = { type: "logic", subtype: "and", condition1: parseCondition(fd[1]), condition2: parseCondition(`(${fd[2]}) or (${fd[3]})`) };
        }
        // or / and
        exp = new RegExp("^\\((.+?)\\) or \\((.+?)\\) and \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            doubleLogic = true;
            cond = { type: "logic", subtype: "and", condition1: parseCondition(`(${fd[1]}) or (${fd[2]})`), condition2: parseCondition(fd[3]) };
        }
        // and x2
        exp = new RegExp("^\\((.+?)\\) and \\((.+?)\\) and \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            doubleLogic = true;
            cond = { type: "logic", subtype: "and", condition1: parseCondition(fd[1]), condition2: parseCondition(`(${fd[2]}) and (${fd[3]})`) };
        }
        // and
        exp = new RegExp("^\\((.+?)\\) and \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            cond = { type: "logic", subtype: "and", condition1: parseCondition(fd[1]), condition2: parseCondition(fd[2]) };
        }
        // or x3
        exp = new RegExp("^\\((.+?)\\) or \\((.+?)\\) or \\((.+?)\\) or \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            doubleLogic = true;
            cond = { type: "logic", subtype: "or", condition1: parseCondition(`(${fd[1]}) or (${fd[2]})`), condition2: parseCondition(`(${fd[3]}) or (${fd[4]})`) };
        }
        // or x2
        exp = new RegExp("^\\((.+?)\\) or \\((.+?)\\) or \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            doubleLogic = true;
            cond = { type: "logic", subtype: "or", condition1: parseCondition(fd[1]), condition2: parseCondition(`(${fd[2]}) or (${fd[3]})`) };
        }
        // or
        exp = new RegExp("^\\((.+?)\\) or \\((.+?)\\)$", "g");
        fd = exp.exec(condition);
        if(fd && !doubleLogic) {
            cond = { type: "logic", subtype: "or", condition1: parseCondition(fd[1]), condition2: parseCondition(fd[2]) };
        }
        /** Attribute **/
        exp = new RegExp("^" + targetType + " has " + attributeName + "$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "attribute", target: ttpp(fd[1]), attribute: ttpp(fd[2], "attribute") };
        }
        /** Membership **/
        exp = new RegExp("^" + targetType + " is in " + groupType + "$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "membership", target: ttpp(fd[1]), group: ttpp(fd[2]) };
        }
        /** Selector **/
        exp = new RegExp("^" + targetType + " is part of " + targetType + "$", "g");
        fd = exp.exec(condition);
        if(fd) {
            cond = { type: "selector", target: ttpp(fd[1]), selector: ttpp(fd[2]) };
        }
        
        if(cond) {
            return cond;
        } else {
            if(!debugMode && !noErr) throw new Error(`Invalid Condition Type \`\`\`\n${condition}\n\`\`\``);
            else return { type: "error" };
        }
        
    }

    /** REGEX - Reminder: You need double \'s here **/
    // general
    const targetType = "(`[^`]*`|`[^`]*`\\[\\w+\\]|(?:`[^`]*`\\+)+(?:`[^`]*`)|(?:`[^`]*`\\+)+(?:`[^`]*`)\\[\\w+\\]|@\\S*|&\\S*|\\^\\S*|#\\S*|%[^%]+%|\-?\\d+|f?F?alse|t?T?rue)";
    const attrDuration = "( \\(~[^\)]+\\))?";
    const locationType = "(`[^`]*`|@\\S*|#\\S*)"; // extended version of target type
    const groupType = "(@\\S*|#\\S*)"; // reduced version of location type
    const attributeName = targetType;
    const num = "(-?\\d+|@\\S*|%Number%)";
    const rawStr = "[\\w\\s\\d@]+";
    const str = "(" + rawStr + ")";
    const decNum = "(-?\\d+\\.\\d+)";
    const abilityType = "(Killing|Investigating|Targeting|Disguising|Protecting|Applying|Redirecting|Vote Manipulating|Whispering|Joining|Granting|Loyalty|Obstructing|Poll Manipulating|Announcements|Changing|Copying|Choices|Ascend|Descend|Disband|Counting|Conversation Reset|Cancel|Switching|Process|Evaluate|Action|Feedback|Action|Success|Failure|Shuffle)";
    const abilitySubtype = "((Kill|Attack|Lynch|True|Banish|True Banish) Killing|(Role|Alignment|Category|Class|Count|Attribute) Investigating|(Target|Untarget) Targeting|() Disguising|(Absence|Active|Passive|Partial|Recruitment) Protecting|(Add|Remove|Change) Applying|() Redirecting|(Absolute|Relative) Vote Manipulating|() Whispering|(Add|Remove) Joining|(Add|Remove|Transfer) Granting|() Loyalty|() Obstructing|(Addition|Creation|Cancelling|Deletion|Manipulation) Poll Manipulating|() Announcements|(Role|Alignment|Group) Changing|(Ability|Full) Copying|(Creating|Choosing) Choices|() Ascend|() Descend|() Disband|(Increment|Decrement|Set) Counting|() Conversation Reset|() Cancel|() Switching|() Process|() Evaluate|() Action|() Feedback|() Action|() Success|() Failure|() Shuffle)";
    const bulletsRegex = /(•|‣|◦|·|⁃|⹀)/;

    // specific
    const investAffected = "( [\\(\\),SDWD ]*)?";
    const defenseAttackSubtypes = "(Attacks|Kills|Lynches|Attacks & Lynches|All|Banishments)";
    const defenseSubtypes = "(Absence at " + locationType + "|Active Defense|Passive Defense|Partial Defense|Recruitment Defense)";
    const defensePhases = "(Day|Night)";
    const attrValue = "([^,~]+?)";
    const attrData1 = "\\(" + attrValue + "\\)";
    const attrData2 = "\\(" + attrValue + "," + attrValue + "\\)";
    const attrData3 = "\\(" + attrValue + "," + attrValue + "," + attrValue + "\\)";
    const attrData4 = "\\(" + attrValue + "," + attrValue + "," + attrValue + "," + attrValue + "\\)";
    const attrIndex = num;
    const redirectSubtype = "(all|non-killing abilities)";
    const manipSubtype = "(public voting power|special public voting power|private voting power|public starting votes|lynch starting votes|election starting votes)";
    const joiningSubtype = "(Member|Owner|Visitor)";
    const loyaltySubtype = "(Group|Alignment)";
    const pollManipManipSubtype = "(Unvotable|Disqualified)";
    const targetingType = "(Player|Dead|Role|Attribute|Category|Full Category|Boolean|Option)";

    /**
    Parse Abilities
    Parses the abilities (and parameters) for a trigger
    **/
    this.parseAbility = function(abilityLineFull) {
        /**
        Split Line
        **/
        let abilityLineSplit = abilityLineFull.split(/ \[| \{| ⟨| \|/); // split off things after the ability part
        if(abilityLineSplit.length >= 1 && abilityLineSplit[0].match(/\[|\{|⟨|\|/)) {
            abilityLineSplit = (" " + abilityLineFull).split(/ \[| \{| ⟨| \|/);
        }
        let ability = null;
        let exp, fd;
        
        let abilityLine = abilityLineSplit.shift().replace(bulletsRegex,"").trim();
        let abilityValues = abilityLine.length > 0 ? abilityLineFull.split(abilityLine)[1] : abilityLineFull;
        
        //console.log("VALUES PARSE: ", abilityValues);
        
        /**
        Evaluate additional values
        **/
        let restrictions = abilityValues.match(/(?<=\[).+(?=\])/)?.[0]?.split(", ");
        let compulsion = abilityValues.match(/(?<=\{).+(?=\})/)?.[0]?.split(", ");
        let scaling = abilityValues.match(/(?<=\⟨).+(?=\⟩)/)?.[0]?.split(", ");
        let promptOverwrite = abilityValues.match(/(?<=\|).+(?=\|)/)?.[0];
        let parsedRestrictions = [];
        let parsedScaling = [];
        
        for(let rest in restrictions) {
            let restFound = false;
            /** Temporal **/
            // temporal, during
            exp = new RegExp("^Temporal: (Day|Night) (\\d+)$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "temporal", subtype: "during", phase: phaseParse(fd[1], fd[2]) });
                restFound = true;
            }
            // temporal, during type
            exp = new RegExp("^Temporal: (Day|Night)$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "temporal", subtype: "during_type", phase: lc(fd[1]) });
                restFound = true;
            }
            // temporal, after
            exp = new RegExp("^Temporal: (Day|Night) (\\d+)\\+$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "temporal", subtype: "after", phase: phaseParse(fd[1], fd[2]) });
                restFound = true;
            }
            /** Attribute **/
            // self has attribute
            exp = new RegExp("^Attribute: has " + targetType + "$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "attribute", subtype: "has", target: "@self[player]", attribute: ttpp(fd[1], "attribute") });
                restFound = true;
            }
            // self lacks attribute
            exp = new RegExp("^Attribute: lacks " + targetType + "$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "attribute", subtype: "lacks", target: "@self[player]", attribute: ttpp(fd[1], "attribute") });
                restFound = true;
            }
            // self has attribute
            exp = new RegExp("^Attribute: " + targetType + " has " + targetType + "$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "attribute", subtype: "has", target: ttpp(fd[1]), attribute: ttpp(fd[2], "attribute") });
                restFound = true;
            }
            // self lacks attribute
            exp = new RegExp("^Attribute: " + targetType + " lacks " + targetType + "$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "attribute", subtype: "lacks", target: ttpp(fd[1]), attribute: ttpp(fd[2], "attribute") });
                restFound = true;
            }
            /** Succession **/
            // no succession
            exp = new RegExp("^Succession: No Succession$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "succession", subtype: "default" });
                restFound = true;
            }
            // no target succession
            exp = new RegExp("^Succession: No Target Succession$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "succession", subtype: "target" });
                restFound = true;
            }
            /** Quantity **/
            // quantity
            exp = new RegExp("^Quantity: " + targetType + "$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "quantity", quantity: fd[1] });
                restFound = true;
            }
            // quantity selector
            exp = new RegExp("^Quantity: (\\d+)$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                parsedRestrictions.push({ type: "quantity", quantity: +fd[1] });
                restFound = true;
            }
            /** Condition **/
            // condition
            exp = new RegExp("^Condition: (.+)$", "g");
            fd = exp.exec(restrictions[rest]);
            if(fd) {
                let condType = "precondition";
                if(fd[1].toLowerCase().includes("@selection") || fd[1].toLowerCase().includes("@secondaryselection")) condType = "condition";
                parsedRestrictions.push({ type: condType, condition: parseCondition(fd[1]) });
                restFound = true;
            }
            /** DEFAULT **/
            if(!restFound) {
                if(!debugMode) throw new Error(`Invalid Restriction Type \`\`\`\n${restrictions[rest]}\n\`\`\``);
                else parsedRestrictions.push({ type: "error", error_restriction: restrictions[rest] });
            }
        }
        
        for(let scal in scaling) {
            let scalFound = false;
            /** Multiplier **/
            // always
            exp = new RegExp("^x(\\d+)$", "g");
            fd = exp.exec(scaling[scal]);
            if(fd) {
                parsedScaling.push({ type: "multiplier", quantity: +fd[1], odd: true, even: true });
                scalFound = true;
            }
            // odd phase 
            exp = new RegExp("^Odd: x(\\d+)$", "g");
            fd = exp.exec(scaling[scal]);
            if(fd) {
                parsedScaling.push({ type: "multiplier", quantity: +fd[1], odd: true, even: false });
                scalFound = true;
            }
            // even phase 
            exp = new RegExp("^Even: x(\\d+)$", "g");
            fd = exp.exec(scaling[scal]);
            if(fd) {
                parsedScaling.push({ type: "multiplier", quantity: +fd[1], odd: false, even: true });
                scalFound = true;
            }
            /** Dynamic Scaling **/
            exp = new RegExp("^(\\$total|\\$living)/(\\d+)$", "g");
            fd = exp.exec(scaling[scal]);
            if(fd) {
                parsedScaling.push({ type: "division", quantity: fd[1] + "/" + fd[2] });
                scalFound = true;
            }
            exp = new RegExp("^(\\$total|\\$living)(\\<|\\>|≤|≥|\\=)(\\d+) ⇒ x?(\\d+)$", "g");
            fd = exp.exec(scaling[scal]);
            if(fd) {
                let ct, compTo = +fd[3];
                switch(fd[2]) {
                    case "<": ct = "less_than"; break;
                    case ">": ct = "greater_than"; break;
                    case "=": ct = "equal_to"; break;
                    case "≤": ct = "less_than"; compTo++; break;
                    case "≥": ct = "greater_than"; compTo--; break;
                }
                parsedScaling.push({ type: "dynamic", compare: fd[1], compare_type: ct, compare_to: compTo, quantity: +fd[4] });
                scalFound = true;
            }
            /** DEFAULT **/
            if(!scalFound) {
                if(!debugMode) throw new Error(`Invalid Scaling Type \`\`\`\n${scaling[scal]}\n\`\`\``);
                else parsedScaling.push({ type: "error", error_scaling: scaling[scal] });
            }
        }
        
        let cDirect = false;
        let cRepeating = false;
        let cVisitless = false;
        let cForced = false;
        let cForcedSelection = null;
        for(let comp in compulsion) {
            if(compulsion[comp] == "Direct") cDirect = true;
            else if(compulsion[comp] == "Repeating") cRepeating = true;
            else if(compulsion[comp] == "Visitless") cVisitless = true;
            else if(compulsion[comp] == "Forced") cForced = true;
            else if(compulsion[comp].substr(0, 6) == "Forced") {
                cForced = true;
                cForcedSelection = ttpp(compulsion[comp].substr(8).trim());
            }
            else {
                if(!debugMode) throw new Error(`Invalid Compulsion Type \`\`\`\n${compulsion[comp]}\n\`\`\``);
            }
        }
        
        /**
        Evaluate Ability Types
        **/
        
        /** KILLING **/
        exp = new RegExp("^(Kill|Attack|Lynch|True Kill|Banish|True Banish) " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "killing", subtype: lc(fd[1]), target: ttpp(fd[2]) };
        }
        /** INVESTIGATION **/
        // Role/align/cat/class Invest
        exp = new RegExp("^(Role|Alignment|Category|Class) Investigate " + targetType + investAffected + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "investigating", subtype: lc(fd[1]), target: ttpp(fd[2]), ...parseInvestAffected(fd[3]) };
        }
        // Attribute invest
        exp = new RegExp("^Attribute Investigate " + targetType + " for " + targetType + investAffected + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "investigating", subtype: "attribute", target: ttpp(fd[1]), attribute: ttpp(fd[2], "attribute"), ...parseInvestAffected(fd[3]) };
        }
        // Role Count invest
        exp = new RegExp("^Investigate " + targetType + " Count" + investAffected + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "investigating", subtype: "count", target: ttpp(fd[1], "role"), ...parseInvestAffected(fd[2]) };
        }
        // Player Count invest
        exp = new RegExp("^Investigate " + targetType + " Player Count$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "investigating", subtype: "player_count", target: ttpp(fd[1]) };
        }
        /** TARGET **/
        // target, default type
        exp = new RegExp("^Target " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "targeting", subtype: "target", target: ttpp(fd[1]) };
        }
        // target, specified type
        exp = new RegExp("^Target " + targetType + " \\(" + targetingType + "\\)$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "targeting", subtype: "target", target: ttpp(fd[1], fd[2].toLowerCase()) };
        }
        // untarget
        exp = new RegExp("^Untarget$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "targeting", subtype: "untarget" };
        }
        /** DISGUISING **/
        exp = new RegExp("^(Weakly|Strongly) Disguise " + targetType + " as " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "disguising", subtype: lc(fd[1]), target: ttpp(fd[2]), disguise: ttpp(fd[3], "role"), duration: dd(fd[4], "permanent") };
        }
        /** PROTECTING **/
        // From By Through During
        exp = new RegExp("^Protect " + targetType + " from `" + defenseAttackSubtypes + "` by " + targetType + " through " + defenseSubtypes + " during " + defensePhases + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "protecting", subtype: lc(fd[4]), target: ttpp(fd[1]), defense_from_type: rblc(fd[2]), defense_from_target: ttpp(fd[3]), defense_during: fd[fd.length-2], duration: dd(fd[fd.length-1], "permanent") };
            if(ability.subtype.substr(0,7)  == "absence") {
                ability.subtype = "absence";
                ability.absence_at = ttpp(fd[5]);
            }
        }
        // From By Through
        exp = new RegExp("^Protect " + targetType + " from `" + defenseAttackSubtypes + "` by " + targetType + " through " + defenseSubtypes + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "protecting", subtype: lc(fd[4]), target: ttpp(fd[1]), defense_from_type: rblc(fd[2]), defense_from_target: ttpp(fd[3]), defense_during: "all", duration: dd(fd[fd.length-1], "permanent") };
            if(ability.subtype.substr(0,7)  == "absence") {
                ability.subtype = "absence";
                ability.absence_at = ttpp(fd[5]);
            }
        }
        // From Through During
        exp = new RegExp("^Protect " + targetType + " from `" + defenseAttackSubtypes + "` through " + defenseSubtypes + " during " + defensePhases + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "protecting", subtype: lc(fd[3]), target: ttpp(fd[1]), defense_from_type: rblc(fd[2]), defense_from_target: "@All[player]", defense_during: fd[fd.length-2], duration: dd(fd[fd.length-1], "permanent") };
            if(ability.subtype.substr(0,7)  == "absence") {
                ability.subtype = "absence";
                ability.absence_at = ttpp(fd[4]);
            }
        }
        // From Through
        exp = new RegExp("^Protect " + targetType + " from `" + defenseAttackSubtypes + "` through " + defenseSubtypes + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "protecting", subtype: lc(fd[3]), target: ttpp(fd[1]), defense_from_type: rblc(fd[2]), defense_from_target: "@All[player]", defense_during: "all", duration: dd(fd[fd.length-1], "permanent") };
            if(ability.subtype.substr(0,7)  == "absence") {
                ability.subtype = "absence";
                ability.absence_at = ttpp(fd[4]);
            }
        }
        /** APPLYING **/
        // standard applying - add attribute
        exp = new RegExp("^Apply " + attributeName + " to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "add", target: ttpp(fd[2]), attribute: ttpp(fd[1],"attribute"), duration: dd(fd[3], "permanent") };
        }
        // standard applying with parameter (1)
        exp = new RegExp("^Apply " + attributeName + " to " + targetType + attrDuration + " " + attrData1 + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "add", target: ttpp(fd[2]), attribute: ttpp(fd[1],"attribute"), duration: dd(fd[3], "permanent"), val1: fd[fd.length-1].trim() };
        }
        // standard applying with parameter (2)
        exp = new RegExp("^Apply " + attributeName + " to " + targetType + attrDuration + " " + attrData2 + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "add", target: ttpp(fd[2]), attribute: ttpp(fd[1],"attribute"), duration: dd(fd[3], "permanent"), val1: fd[fd.length-2].trim(), val2: fd[fd.length-1].trim() };
        }
        // standard applying with parameter (3)
        exp = new RegExp("^Apply " + attributeName + " to " + targetType + attrDuration + " " + attrData3 + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "add", target: ttpp(fd[2]), attribute: ttpp(fd[1],"attribute"), duration: dd(fd[3], "permanent"), val1: fd[fd.length-3].trim(), val2: fd[fd.length-2].trim(), val3: fd[fd.length-1].trim() };
        }
        // Remove Attribute
        exp = new RegExp("^Remove " + attributeName + " from " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "remove", target: ttpp(fd[2]), attribute: ttpp(fd[1],"activeAttribute") };
        }
        // Change Attribute Value
        exp = new RegExp("^Change " + attributeName + " value `" + attrIndex + "` to " + targetType + " for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "change_parsed", target: ttpp(fd[4]), attribute: ttpp(fd[1],"activeAttribute"), attr_index: +fd[2], attr_value: ttpp(fd[3])  };
        }
        // Change Attribute Value
        exp = new RegExp("^Change " + attributeName + " value `" + attrIndex + "` to `" + attrValue + "` for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "change", target: ttpp(fd[4]), attribute: ttpp(fd[1],"activeAttribute"), attr_index: +fd[2], attr_value: fd[3].trim()  };
        }
        // Change Attribute Value
        exp = new RegExp("^Change " + attributeName + " value `" + attrIndex + "` to " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "change_parsed", target: ttpp("@self"), attribute: ttpp(fd[1],"activeAttribute"), attr_index: +fd[2], attr_value: ttpp(fd[3])  };
        }
        // Change Attribute Value
        exp = new RegExp("^Change " + attributeName + " value `" + attrIndex + "` to `" + attrValue + "`$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "applying", subtype: "change", target: ttpp("@self"), attribute: ttpp(fd[1],"activeAttribute"), attr_index: +fd[2], attr_value: fd[3].trim()  };
        }
        /** REDIRECTING **/
        // redirect from all
        exp = new RegExp("^Redirect `" + redirectSubtype + "` to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "redirecting", subtype: ttpp(fd[1], "abilityCategory"), target: ttpp(fd[2]), source: "@All[player]", duration: dd(fd[4], "permanent") };
        }
        // redirect from certain players
        exp = new RegExp("^Redirect `" + redirectSubtype + "` from " + targetType + " to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "redirecting", subtype: ttpp(fd[1], "abilityCategory"), target: ttpp(fd[3]), source: ttpp(fd[2]), duration: dd(fd[4], "permanent") };
        }
        // redirect from all (type)
        exp = new RegExp("^Redirect `" + abilityType + "` to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "redirecting", subtype: ttpp(fd[1], "abilityType"), target: ttpp(fd[2]), source: "@All[player]", duration: dd(fd[4], "permanent") };
        }
        // redirect from certain players (type)
        exp = new RegExp("^Redirect `" + abilityType + "` from " + targetType + " to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "redirecting", subtype: ttpp(fd[1], "abilityType"), target: ttpp(fd[3]), source: ttpp(fd[2]), duration: dd(fd[4], "permanent") };
        }
        // redirect from all (subtype)
        exp = new RegExp("^Redirect `" + abilitySubtype + "` to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "redirecting", subtype: ttpp(fd[1], "abilitySubtype"), target: ttpp(fd[2]), source: "@All[player]", duration: dd(fd[4], "permanent") };
        }
        // redirect from certain players (subtype)
        exp = new RegExp("^Redirect `" + abilitySubtype + "` from " + targetType + " to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "redirecting", subtype: ttpp(fd[1], "abilitySubtype"), target: ttpp(fd[3]), source: ttpp(fd[2]), duration: dd(fd[4], "permanent") };
        }
        /** VOTE MANIPULATION **/
        // manipulation by absolute value
        exp = new RegExp("^Manipulate " + targetType + "'s `" + manipSubtype + "` to `" + num + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "manipulating", subtype: "absolute", target: ttpp(fd[1]), manip_type: fd[2], manip_value: ttpp(fd[3], "number"), duration: dd(fd[4], "permanent") };
        }
        // manipulation by relative value
        exp = new RegExp("^Manipulate " + targetType + "'s `" + manipSubtype + "` by `" + num + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "manipulating", subtype: "relative", target: ttpp(fd[1]), manip_type: fd[2], manip_value: ttpp(fd[3], "number"), duration: dd(fd[4], "permanent") };
        }
        // manipulation by absolute value - selector variant
        exp = new RegExp("^Manipulate " + targetType + "'s `" + manipSubtype + "` to " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "manipulating", subtype: "absolute", target: ttpp(fd[1]), manip_type: fd[2], manip_value: ttpp(fd[3], "number"), duration: dd(fd[4], "permanent") };
        }
        // manipulation by relative value - selector variant
        exp = new RegExp("^Manipulate " + targetType + "'s `" + manipSubtype + "` by " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "manipulating", subtype: "relative", target: ttpp(fd[1]), manip_type: fd[2], manip_value: ttpp(fd[3], "number"), duration: dd(fd[4], "permanent") };
        }
        /** WHISPERING **/
        // whispering with disguise
        exp = new RegExp("^Whisper to " + locationType + " as " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "whispering", target: ttpp(fd[1], "location"), disguise: fd[2], duration: dd(fd[3], "permanent") };
        }
        // whispering without disguise
        exp = new RegExp("^Whisper to " + locationType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "whispering", target: ttpp(fd[1], "location"), duration: dd(fd[3], "permanent") };
        }
        /** JOINING **/
        // default joining
        exp = new RegExp("^Join " + groupType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "joining", subtype: "add", target: "@self[player]", group: fd[1], membership_type: "member", duration: dd(fd[2], "persistent") };
        }
        // joining with specific membership type
        exp = new RegExp("^Join " + groupType + " as `" + joiningSubtype + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "joining", subtype: "add", target: "@self[player]", group: fd[1], membership_type: lc(fd[2]), duration: dd(fd[3], "persistent") };
        }
        // add somebody else 
        exp = new RegExp("^Add " + targetType + " to " + groupType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "joining", subtype: "add", target: ttpp(fd[1]), group: fd[2], membership_type: "member", duration: dd(fd[3], "persistent") };
        }
        // add somebody else as a specific membership type
        exp = new RegExp("^Add " + targetType + " to " + groupType + " as `" + joiningSubtype + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "joining", subtype: "add", target: ttpp(fd[1]), group: fd[2], membership_type: lc(fd[3]), duration: dd(fd[4], "persistent") };
        }
        // default leaving
        exp = new RegExp("^Leave " + groupType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "joining", subtype: "remove", target: "@self[player]", group: fd[1] };
        }
        // remove somebody else
        exp = new RegExp("^Remove " + targetType + " from " + groupType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            if(fd[1] != "@ThisAttr" && fd[1][0] != "`") { // otherwise this overwrites unapplyings
                ability = { type: "joining", subtype: "remove", target: ttpp(fd[1]), group: fd[2] };
            }
        }
        /** GRANTING **/
        // default granting
        exp = new RegExp("^Grant " + targetType + " to " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "granting", subtype: "add", target: ttpp(fd[2]), role: ttpp(fd[1], "role") };
        }
        // revoking
        exp = new RegExp("^Revoke " + targetType + " from " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "granting", subtype: "remove", target: ttpp(fd[2]), role: ttpp(fd[1], "activeExtaRole") };
        }
        // transfer
        exp = new RegExp("^Transfer " + targetType + " from " + targetType + " to " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "granting", subtype: "transfer", target: ttpp(fd[2]), role: ttpp(fd[1], "activeExtaRole"), transfer_to: ttpp(fd[3]) };
        }
        /** LOYALTY **/
        // loyalty
        exp = new RegExp("^Loyalty to " + locationType + " \\(" + loyaltySubtype + "\\)$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "loyalty", subtype: fd[2].toLowerCase(), target: fd[1] };
        }
        /** OBSTRUCTING **/
        // obstruct all
        exp = new RegExp("^Obstruct " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "obstructing", subtype: "standard", target: ttpp(fd[1]), duration: dd(fd[2], "permanent"), obstructed_ability: "", obstructed_subtype: "", custom_feedback: "" };
        }
        // obstruct specific ability type
        exp = new RegExp("^Obstruct " + abilityType + " for " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "obstructing", subtype: "standard", target: ttpp(fd[2]), duration: dd(fd[3], "permanent"), obstructed_ability: lc(fd[1]), obstructed_subtype: "", custom_feedback: "" };
        }
        // obstruct specific ability subtype
        exp = new RegExp("^Obstruct " + abilitySubtype + " for " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            fd = fd.filter(el => el); // filter out empty capture groups
            ability = { type: "obstructing", subtype: "standard", target: ttpp(fd[3]), duration: dd(fd[4], "permanent"), obstructed_ability: lc(fd[1].replace(fd[2], "").trim()), obstructed_subtype: lc(fd[2]), custom_feedback: "" };
        }
        // obstruct specific ability type; custom feedback
        exp = new RegExp("^Obstruct " + abilityType + " for " + targetType + " ⇒ `" + str + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "obstructing", subtype: "standard", target: ttpp(fd[2]), duration: dd(fd[4], "permanent"), obstructed_ability: lc(fd[1]), obstructed_subtype: "", custom_feedback: [{chance: 1, feedback: fd[3]}] };
        }
        // obstruct specific ability subtype; custom feedback
        exp = new RegExp("^Obstruct " + abilitySubtype + " for " + targetType + " ⇒ `" + str + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            fd = fd.filter(el => el); // filter out empty capture groups
            ability = { type: "obstructing", subtype: "standard", target: ttpp(fd[3]), duration: dd(fd[5], "permanent"), obstructed_ability: lc(fd[1].replace(fd[2], "").trim()), obstructed_subtype: lc(fd[2]), custom_feedback: [{chance: 1, feedback: fd[4]}] };
        }
        // obstruct specific ability type; double custom feedback
        exp = new RegExp("^Obstruct " + abilityType + " for " + targetType + " ⇒ \\(" + decNum + ":`" + str + "`," + decNum + ":`" + str + "`\\)" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "obstructing", subtype: "standard", target: ttpp(fd[2]), duration: dd(fd[7], "permanent"), obstructed_ability: lc(fd[1]), obstructed_subtype: "", custom_feedback: [{chance: +fd[3], feedback: fd[4]},{chance: +fd[5], feedback: fd[6] }] };
        }
        // obstruct specific ability subtype; double custom feedback
        exp = new RegExp("^Obstruct " + abilitySubtype + " for " + targetType + " ⇒ \\(" + decNum + ":`" + str + "`," + decNum + ":`" + str + "`\\)" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            fd = fd.filter(el => el); // filter out empty capture groups
            ability = { type: "obstructing", subtype: "standard", target: ttpp(fd[3]), duration: dd(fd[8], "permanent"), obstructed_ability: lc(fd[1].replace(fd[2], "").trim()), obstructed_subtype: lc(fd[2]), custom_feedback: [{chance: +fd[4], feedback: fd[5]},{chance: +fd[6], feedback: fd[7] }] };
        }
        // obstruct specific ability type, inverted
        exp = new RegExp("^Obstruct !" + abilityType + " for " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "obstructing", subtype: "inverted", target: ttpp(fd[2]), duration: dd(fd[3], "permanent"), obstructed_ability: lc(fd[1]), obstructed_subtype: "", custom_feedback: "" };
        }
        // obstruct specific ability subtype, inverted
        exp = new RegExp("^Obstruct !" + abilitySubtype + " for " + targetType + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            fd = fd.filter(el => el); // filter out empty capture groups
            ability = { type: "obstructing", subtype: "inverted", target: ttpp(fd[3]), duration: dd(fd[4], "permanent"), obstructed_ability: lc(fd[1].replace(fd[2], "").trim()), obstructed_subtype: lc(fd[2]), custom_feedback: "" };
        }
        // obstruct specific ability type; custom feedback, inverted
        exp = new RegExp("^Obstruct !" + abilityType + " for " + targetType + " ⇒ `" + str + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "obstructing", subtype: "inverted", target: ttpp(fd[2]), duration: dd(fd[4], "permanent"), obstructed_ability: lc(fd[1]), obstructed_subtype: "", custom_feedback: [{chance: 1, feedback: fd[3]}] };
        }
        // obstruct specific ability subtype; custom feedback, inverted
        exp = new RegExp("^Obstruct !" + abilitySubtype + " for " + targetType + " ⇒ `" + str + "`" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            fd = fd.filter(el => el); // filter out empty capture groups
            ability = { type: "obstructing", subtype: "inverted", target: ttpp(fd[3]), duration: dd(fd[5], "permanent"), obstructed_ability: lc(fd[1].replace(fd[2], "").trim()), obstructed_subtype: lc(fd[2]), custom_feedback: [{chance: 1, feedback: fd[4]}] };
        }
        // obstruct specific ability type; double custom feedback, inverted
        exp = new RegExp("^Obstruct !" + abilityType + " for " + targetType + " ⇒ \\(" + decNum + ":`" + str + "`," + decNum + ":`" + str + "`\\)" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "obstructing", subtype: "inverted", target: ttpp(fd[2]), duration: dd(fd[7], "permanent"), obstructed_ability: lc(fd[1]), obstructed_subtype: "", custom_feedback: [{chance: +fd[3], feedback: fd[4]},{chance: +fd[5], feedback: fd[6] }] };
        }
        // obstruct specific ability subtype; double custom feedback, inverted
        exp = new RegExp("^Obstruct !" + abilitySubtype + " for " + targetType + " ⇒ \\(" + decNum + ":`" + str + "`," + decNum + ":`" + str + "`\\)" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            fd = fd.filter(el => el); // filter out empty capture groups
            ability = { type: "obstructing", subtype: "inverted", target: ttpp(fd[3]), duration: dd(fd[8], "permanent"), obstructed_ability: lc(fd[1].replace(fd[2], "").trim()), obstructed_subtype: lc(fd[2]), custom_feedback: [{chance: +fd[4], feedback: fd[5]},{chance: +fd[6], feedback: fd[7] }] };
        }
        /** POLL MANIPULATING **/
        // Poll duplication/addtion
        exp = new RegExp("^Add `" + str + "` Poll" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "addition", target: ttpp(fd[1], "poll"), duration: dd(fd[2], "untiluse") };
        }
        // Creates a new poll
        exp = new RegExp("^Create `" + str + "` Poll in " + locationType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "creation", target: ttpp(fd[1], "poll"), poll_location: ttpp(fd[2], "location") };
        }
        // poll creates itself
        exp = new RegExp("^Create Poll in " + locationType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "creation", target: "@self[poll]", poll_location: ttpp(fd[1], "location") };
        }
        // poll creates itself named
        exp = new RegExp("^Create Poll in " + locationType + " as " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "creation", target: "@self[poll]", poll_location: ttpp(fd[1], "location"), poll_name: ttpp(fd[2], "string") };
        }
        // Cancel polls resulting ability
        exp = new RegExp("^Cancel `" + str + "` Poll" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "cancellation", target: ttpp(fd[1], "poll"), duration: dd(fd[2], "untiluse") };
        }
        // Delete a poll
        exp = new RegExp("^Delete `" + str + "` Poll" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "deletion", target: ttpp(fd[1], "poll"), duration: dd(fd[2], "untiluse") };
        }
        // Poll Disqualification Manipulation
        exp = new RegExp("^Manipulate `" + str + "` Poll \\(" + targetType + " is `" + pollManipManipSubtype + "`\\)" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "manipulation", target: ttpp(fd[1], "poll"), manip_target: ttpp(fd[2]), manip_type: lc(fd[3]), duration: dd(fd[4], "nextphase") };
        }
        // Poll Votes Manipulation
        exp = new RegExp("^Manipulate `" + str + "` Poll \\(" + targetType + " has `" + num + "` votes\\)" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "votes", target: ttpp(fd[1], "poll"), manip_target: ttpp(fd[2]), manip_type: "visible", manip_value: fd[3], duration: dd(fd[4], "nextphase") };
        }
        // Poll Votes Manipulation
        exp = new RegExp("^Manipulate `" + str + "` Poll \\(" + targetType + " has `" + num + "` hidden votes\\)" + attrDuration + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "poll", subtype: "votes", target: ttpp(fd[1], "poll"), manip_target: ttpp(fd[2]), manip_type: "hidden", manip_value: fd[3], duration: dd(fd[4], "nextphase") };
        }
        /** ANNOUNCEMENTS **/
        // reveal
        exp = new RegExp("^Reveal " + targetType + " to " + locationType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "announcement", subtype: "immediate", target: ttpp(fd[2], "location"), info: ttpp(fd[1]) };
        }
        // reveal
        exp = new RegExp("^(Learn|Know) " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "announcement", subtype: "immediate", target: "@self[location]", info: ttpp(fd[2]) };
        }
        // storytime buffer
        exp = new RegExp("^Announce " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "announcement", subtype: "buffer", info: ttpp(fd[1]) };
        }
        /** ROLE CHANGE **/
        // role change
        exp = new RegExp("^Role Change " + targetType + " to " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "changing", subtype: "role", target: ttpp(fd[1]), change_to: ttpp(fd[2], "role") };
        }
        // alignment change
        exp = new RegExp("^Alignment Change " + targetType + " to " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "changing", subtype: "alignment", target: ttpp(fd[1]), change_to: ttpp(fd[2], "alignment") };
        }
        // group change
        exp = new RegExp("^Group Change " + targetType + " to " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "changing", subtype: "group", target: ttpp(fd[1], "group"), change_to: ttpp(fd[2], "group") };
        }
        /** COPYING **/
        // full copy
        exp = new RegExp("^Copy " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "copying", target: ttpp(fd[1]), copy_to: "@self[player]", suppressed: false, duration: dd(fd[2], "permanent") };
        }
        // full copy, surpressed
        exp = new RegExp("^Copy " + targetType + " \\(Suppressed\\)$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "copying", target: ttpp(fd[1]), copy_to: "@self[player]", suppressed: true, duration: dd(fd[2], "permanent") };
        }
        /** CHOICES **/
        // choice choosing
        exp = new RegExp("^" + targetType + " Choice Choose " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "choices", subtype: "choosing", choice: ttpp(fd[1], "choice"), option: ttpp(fd[2], "option") };
        }
        // choice creation
        exp = new RegExp("^" + targetType + " Choice Creation \\(([^\\)]+)\\)$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            let options = fd[2].split(",").map(el => ttpp(el.trim(), "option"));
            if(options.length > 5 && !debugMode) throw new Error(`Too Many Options \`\`\`\n${abilityLine}\n\`\`\``);
            ability = { type: "choices", subtype: "creation", choice: ttpp(fd[1], "choice"), target: "@self[player]", options: options };
        }
        // choice creation
        exp = new RegExp("^" + targetType + " Choice Creation for " + targetType + " \\(([^\\)]+)\\)$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            let options = fd[3].split(",").map(el => ttpp(el.trim(), "option"));
            if(options.length > 5 && !debugMode) throw new Error(`Too Many Options \`\`\`\n${abilityLine}\n\`\`\``);
            ability = { type: "choices", subtype: "creation", choice: ttpp(fd[1], "choice"), target: ttpp(fd[2]), options: options };
        }
        /** ASCEND DESCEND **/
        // ascend
        exp = new RegExp("^Ascend$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "ascend" };
        }
        // descend
        exp = new RegExp("^Descend$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "descend" };
        }
        // win
        exp = new RegExp("^Win$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "win" };
        }
        /** DISBAND **/
        // disband self
        exp = new RegExp("^Disband$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "disband", target: "@self[group]" };
        }
        // disband
        exp = new RegExp("^Disband " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "disband", target: ttpp(fd[1], "group") };
        }
        /** COUNTING **/
        // increment self by 1
        exp = new RegExp("^Increment Counter$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "increment", counter_value: ttpp("1"), target: "@self[player]" };
        }
        // decrement self by 1
        exp = new RegExp("^Decrement Counter$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "decrement", counter_value: ttpp("1"), target: "@self[player]" };
        }
        // increment self by value
        exp = new RegExp("^Increment Counter by " + num + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "increment", counter_value: ttpp(fd[1]), target: "@self[player]" };
        }
        // decrement self by value
        exp = new RegExp("^Decrement Counter by " + num + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "decrement", counter_value: ttpp(fd[1]), target: "@self[player]" };
        }
        // set counter to value
        exp = new RegExp("^Set Counter to " + num + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "set", counter_value: ttpp(fd[1]), target: "@self[player]" };
        }
        // increment by 1, for target
        exp = new RegExp("^Increment Counter for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "increment", counter_value: ttpp("1"), target: ttpp(fd[1]) };
        }
        // decrement by 1, for target
        exp = new RegExp("^Decrement Counter for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "decrement", counter_value: ttpp("1"), target: ttpp(fd[1]) };
        }
        // increment by value, for target
        exp = new RegExp("^Increment Counter by " + num + " for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "increment", counter_value: ttpp(fd[1]), target: ttpp(fd[2]) };
        }
        // decrement by value, for target
        exp = new RegExp("^Decrement Counter by " + num + " for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "decrement", counter_value: ttpp(fd[1]), target: ttpp(fd[2]) };
        }
        // set counter to value, for target
        exp = new RegExp("^Set Counter to " + num + " for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "set", counter_value: ttpp(fd[1]), target: ttpp(fd[2]) };
        }
        // increment self by math value
        exp = new RegExp("^Increment Counter by (ceil|floor|round) (\\$total|\\$living|\\$phase)/" + num + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "increment_math", rounding: fd[1], variable: fd[2], counter_value: ttpp(fd[3]), target: "@self[player]" };
        }
        // decrement self by math value
        exp = new RegExp("^Decrement Counter by (ceil|floor|round) (\\$total|\\$living|\\$phase)/" + num + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "decrement_math", rounding: fd[1], variable: fd[2], counter_value: ttpp(fd[3]), target: "@self[player]" };
        }
        // set counter to math value
        exp = new RegExp("^Set Counter to (ceil|floor|round) (\\$total|\\$living|\\$phase)/" + num + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "set_math", rounding: fd[1], variable: fd[2], counter_value: ttpp(fd[3]), target: "@self[player]" };
        }
        // increment by math value, for target
        exp = new RegExp("^Increment Counter by (ceil|floor|round) (\\$total|\\$living|\\$phase)/" + num + " for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "increment_math", rounding: fd[1], variable: fd[2], counter_value: ttpp(fd[3]), target: ttpp(fd[4]) };
        }
        // decrement by math value, for target
        exp = new RegExp("^Decrement Counter by (ceil|floor|round) (\\$total|\\$living|\\$phase)/" + num + " for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "decrement_math", rounding: fd[1], variable: fd[2], counter_value: ttpp(fd[3]), target: ttpp(fd[4]) };
        }
        // set counter to math value, for target
        exp = new RegExp("^Set Counter to (ceil|floor|round) (\\$total|\\$living|\\$phase)/" + num + " for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "counting", subtype: "set_math", rounding: fd[1], variable: fd[2], counter_value: ttpp(fd[3]), target: ttpp(fd[4]) };
        }
        /** CONVERSATION RESET **/
        // conversation reset self
        exp = new RegExp("^Conversation Reset$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "reset", target: "@self[unknown]" };
        }
        // conversation reset target
        exp = new RegExp("^Conversation Reset " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "reset", target: ttpp(fd[1]) };
        }
        /** CANCEL **/
        // cancel
        exp = new RegExp("^Cancel$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "cancel", subtype: "direct" };
        }
        // cancel with failure
        exp = new RegExp("^Cancel with Failure$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "cancel", subtype: "direct" };
        }
        // cancel with specific result
        exp = new RegExp("^Cancel with Success$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "cancel", subtype: "success" };
        }
        // cancel with specific result
        exp = new RegExp("^Cancel with `(" + rawStr + ")`$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "cancel", subtype: "with", cancel_with: fd[1] };
        }
        /** SWITCHING **/
        // switching
        exp = new RegExp("^Switch with " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "switching", target: ttpp(fd[1]) };
        }
        /** PROCESS/EVALUATE **/
        // process
        exp = new RegExp("^Process:$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "process" };
        }
        // evaluate
        exp = new RegExp("^Evaluate:$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "evaluate" };
        }
        /** FEEDBACK */
        // just feedback
        exp = new RegExp("^" + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "feedback", feedback: ttpp(fd[1]) };
        }
        /** FEEDBACK */
        // stores feedback to result
        exp = new RegExp("^Store " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "storing", selector: ttpp(fd[1]) };
        }
        /** ACTION VALUES */
        // just values
        exp = new RegExp("^Action:$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "action" };
        }
        /** FAILURE / SUCCESS */
        // just values
        exp = new RegExp("^Failure$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "failure" };
        }
        // just values
        exp = new RegExp("^Success$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "success" };
        }
        /** CONTINUE **/
        exp = new RegExp("^Continue$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "continue" };
        }
        /** LOGGING (DEBUG) **/
        // log named
        exp = new RegExp("^Log " + targetType + " as " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "log", selector: ttpp(fd[1]), info: fd[2] };
        }
        // log unnamed
        exp = new RegExp("^Log " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "log", selector: ttpp(fd[1]), info: "" };
        }
        /** FOR EACH **/
        exp = new RegExp("^For Each " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "for_each", target: ttpp(fd[1]) };
        }
        /** SHUFFLE **/
        // 1
        exp = new RegExp("^Shuffle " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "shuffle", targets: [ ttpp(fd[1]) ] };
        }
        // 2
        exp = new RegExp("^Shuffle " + targetType + " " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "shuffle", targets: [ ttpp(fd[1]), ttpp(fd[2]) ] };
        }
        // 3
        exp = new RegExp("^Shuffle " + targetType + " " + targetType + " " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "shuffle", targets: [ ttpp(fd[1]), ttpp(fd[2]), ttpp(fd[3]) ] };
        }
        // 4
        exp = new RegExp("^Shuffle " + targetType + " " + targetType + " " + targetType + " " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "shuffle", targets: [ ttpp(fd[1]), ttpp(fd[2]), ttpp(fd[3]), ttpp(fd[4]) ] };
        }
        // 5
        exp = new RegExp("^Shuffle " + targetType + " " + targetType + " " + targetType + " " + targetType + " " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "shuffle", targets: [ ttpp(fd[1]), ttpp(fd[2]), ttpp(fd[3]), ttpp(fd[4]), ttpp(fd[5]) ] };
        }
        /** EMIT **/
        // emit for somebody else
        exp = new RegExp("^Emit `" + str + "` for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "emit", subtype: "immediate", selector: ttpp(fd[2]), emit_value: ttpp(fd[1], "option") };
        }
        // emit self
        exp = new RegExp("^Emit `" + str + "`$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "emit", subtype: "immediate", selector: "@self[player]", emit_value: ttpp(fd[1], "option") };
        }
        // emit for somebody else, end effect
        exp = new RegExp("^End Emit `" + str + "` for " + targetType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "emit", subtype: "end", selector: ttpp(fd[2]), emit_value: ttpp(fd[1], "option") };
        }
        // emit self, end effect
        exp = new RegExp("^End Emit `" + str + "`$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "emit", subtype: "end", selector: "@self[player]", emit_value: ttpp(fd[1], "option") };
        }
        /** Display **/
        // create display
        exp = new RegExp("^Display `" + str + "`$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "displaying", subtype: "create", display: fd[1] };
        }
        // create display
        exp = new RegExp("^Display `" + str + "` " + attrData1 + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "displaying", subtype: "create", display: fd[1], val1: fd[2].trim() };
        }
        // create display
        exp = new RegExp("^Display `" + str + "` " + attrData2 + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "displaying", subtype: "create", display: fd[1], val1: fd[2].trim(), val2: fd[3].trim() };
        }
        // create display
        exp = new RegExp("^Display `" + str + "` " + attrData3 + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "displaying", subtype: "create", display: fd[1], val1: fd[2].trim(), val2: fd[3].trim(), val3: fd[4].trim() };
        }
        // create display
        exp = new RegExp("^Display `" + str + "` " + attrData4 + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "displaying", subtype: "create", display: fd[1], val1: fd[2].trim(), val2: fd[3].trim(), val3: fd[4].trim(), val4: fd[5].trim() };
        }
        // update display
        exp = new RegExp("^Update `" + str + "` value `" + attrIndex + "` to `" + str + "`$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "displaying", subtype: "change", display: fd[1], display_index: +fd[2], display_value: fd[3].trim()  };
        }
        /** LOCKING **/
        // lock
        exp = new RegExp("^Lock " + locationType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "locking", subtype: "lock", target: ttpp(fd[1], "location") };
        }
        // unlock
        exp = new RegExp("^Unlock " + locationType + "$", "g");
        fd = exp.exec(abilityLine);
        if(fd) {
            ability = { type: "locking", subtype: "unlock", target: ttpp(fd[1], "location") };
        }

        
        /** Ability Types End */
        if(ability) {
            ability.id = abilityCounter++; // assign ability id
            //console.log("IDENT", ability);
            abilityLineFull = { ability: ability, parameters: { restrictions: parsedRestrictions, scaling: parsedScaling, direct: cDirect, repeating: cRepeating, visitless: cVisitless, forced: cForced, forced_sel: cForcedSelection } };
            if(promptOverwrite) abilityLineFull.parameters.prompt_overwrite = promptOverwrite;
        } else if(abilityLine == "") {
            abilityLineFull = { ability: { type: "parameters", id: abilityCounter++ }, parameters: { restrictions: parsedRestrictions, scaling: parsedScaling, direct: cDirect, repeating: cRepeating, visitless: cVisitless, forced: cForced, forced_sel: cForcedSelection } };
            if(promptOverwrite) abilityLineFull.parameters.prompt_overwrite = promptOverwrite;
        } else {
            //console.log("UNIDENT", abilityLine);
            if(!debugMode) throw new Error(`Invalid Ability Type \`\`\`\n${abilityLineFull}\n\`\`\` with ability line \`\`\`\n${abilityLine}\n\`\`\``);
            else abilityLineFull = { ability: { type: "error" }, parameters : { failed_ability: abilityLineFull, failed_ability_line: "^" + abilityLine + "$" } };
        }
        return abilityLineFull;
    }

    // parse the WD/SD affected element for invest abilities
    this.parseInvestAffected = function(param) {
        return param ? { affected_by_wd: param.includes("WD"), affected_by_sd: param.includes("SD") } : { affected_by_wd: false, affected_by_sd: false };
    }

    // default duration: returns the default (def) if the duration (dur) is not set
    this.dd = function(dur, def) {
        return dur ? dur.toLowerCase().replace(/[^a-z]*/g,"") : def;
    }

    // remove backticks
    this.rb = function(input) {
        return input.replace(/`/g, "");
    }

    // to lower case
    this.lc = function(input) {
        return input.toLowerCase();
    }

    // remove backticks + to lower case
    this.rblc = function(input) {
        return rb(lc(input));
    }

    // parse phase
    this.phaseParse = function(dn, num) {
        return (dn == "Day" ? "D" : "N") + num;
    }

    /**
    Parse Triggers
    Parses a role into several triggers
    **/
    this.parseTriggers = function(inputLines) {

        let curTriggerType = null;
        let curTrigger = [];
        let unique = false;
        let require = [], roleAttribute = [], identity = [];
        let triggers = [];

        // iterate through all the lines of the role
        while(inputLines.length > 0) {
            let curInputLine = inputLines.shift().trim(); // take the next line
            if(!curInputLine) continue; // if empty line, skip
            
            // continue previous trigger
            if(bullets.includes(curInputLine[0])) {
                if(debugMode) console.log("CONT: ", curInputLine);
                curTrigger.push(curInputLine)
            }
            // start new trigger
            else {
                if(debugMode) console.log("NEW: ", curInputLine);
                // store previous trigger if existing
                if(curTriggerType) {
                    triggers.push([curTriggerType, curTrigger]);
                }
                curTriggerType = null;
                curTrigger = [];
                
                if(curInputLine === "No Abilities") { // No Abilities
                    // nothing - no abilities
                    continue;
                } else if(curInputLine === "Unique Role" || curInputLine === "Unique Group") { // Unique
                    // set unique value to true
                    unique = true;
                    continue;
                }
                
                let curInputLineSplit = curInputLine.split(": ");
                let curTriggerName = curInputLineSplit.shift().split(/:$/)[0]; // remove a : at end of line
                
                // basic trigger type
                if(basicTriggerTypes.includes(curTriggerName)) { // normal triggers
                    curTriggerType = curTriggerName;
                    curTrigger.push(curInputLineSplit.join(": "));
                } else if(curTriggerName == "Require") { // Require special trigger
                    require.push(curInputLineSplit.join(": "));
                } else if(curTriggerName == "Role Attribute") { // Role Attribute special trigger
                    roleAttribute.push(curInputLineSplit.join(": "));
                } else if(curTriggerName == "Identity") { // Identity special trigger
                    identity.push(curInputLineSplit.join(": "));
                } else {
                    //   const adancedTriggerTypes = ["On <Target> Visited [<Ability Type>]"]; // trigger types containing parameters
                    // attempt to parse complex triggers
                    /** On Target Death / On Target Visited **/
                    let exp, fd, complexTrigger;
                    exp = new RegExp("^On " + targetType +  " (Death|Killed|Banished|Banishment)$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[2] + ";" + ttpp(fd[1]);
                    }
                    /** On Visited [Ability], On Action [Ability] **/
                    exp = new RegExp("^On (Visited|Action|Any Action) \\[" + abilityType + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[1] + ";" + ttpp(fd[2], "abilityType");
                    }
                    exp = new RegExp("^On (Visited|Action|Any Action) \\[" + abilitySubtype + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[1] + ";" + ttpp(fd[2], "abilitySubtype");
                    }
                    exp = new RegExp("^On (Visited|Action|Any Action) \\[!" + abilityType + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[1] + " Inverted;" + ttpp(fd[2], "abilityType");
                    }
                    exp = new RegExp("^On (Visited|Action|Any Action) \\[!" + abilitySubtype + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[1] + " Inverted;" + ttpp(fd[2], "abilitySubtype");
                    }
                    /** On Target Visited [Ability], On Target Action [Ability] **/
                    exp = new RegExp("^On " + targetType + " (Visited|Action) \\[" + abilityType + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[2] + " Target;" + ttpp(fd[1]) + ";" + ttpp(fd[3], "abilityType");
                    }
                    exp = new RegExp("^On " + targetType + " (Visited|Action) \\[" + abilitySubtype + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[2] + " Target;" + ttpp(fd[1]) + ";" + ttpp(fd[3], "abilitySubtype");
                    }
                    exp = new RegExp("^On " + targetType + " (Visited|Action) \\[!" + abilityType + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[2] + " Target Inverted;" + ttpp(fd[1]) + ";" + ttpp(fd[3], "abilityType");
                    }
                    exp = new RegExp("^On " + targetType + " (Visited|Action) \\[!" + abilitySubtype + "\\]$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[2] + " Target Inverted;" + ttpp(fd[1]) + ";" + ttpp(fd[3], "abilitySubtype");
                    }
                    /** On Target Visited, On Target Action**/
                    exp = new RegExp("^On " + targetType + " (Visited|Action)$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On " + fd[2] + " Target Basic;" + ttpp(fd[1]);
                    }
                    /** Choice Chosen **/
                    exp = new RegExp("^On Poll `" + str +  "` Win$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On Poll Win;" + ttpp(fd[1].trim().toLowerCase().replace(/[^a-z]/g,""), "poll");
                    }
                    /** Choice Chosen **/
                    exp = new RegExp("^Choice `" + str +  "` Chosen$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "Choice Chosen;" + ttpp(fd[1].trim().toLowerCase().replace(/[^a-z]/g,""), "option");
                    }
                    /** On [Value] Emitted **/
                    exp = new RegExp("^On `" + str +  "` Emitted$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On Emitted;" + ttpp(fd[1].trim().toLowerCase().replace(/[^a-z]/g,""), "option");
                    }
                    /** On [Value] End Emitted **/
                    exp = new RegExp("^On `" + str +  "` End Emitted$", "g");
                    fd = exp.exec(curTriggerName);
                    if(fd) {
                        complexTrigger = "On End Emitted;" + ttpp(fd[1].trim().toLowerCase().replace(/[^a-z]/g,""), "option");
                    }
                    /** Otherwise **/
                    if(!complexTrigger) { // could not find a complex trigger match
                        if(!debugMode) throw new Error(`Invalid Trigger Type \`\`\`\n${curTriggerName}\n\`\`\` in \`\`\`\n${curInputLine}\n\`\`\``);
                        else console.log("UNIDENT");
                    } else {
                        curTriggerType = complexTrigger;
                        curTrigger.push(curInputLineSplit.join(": "));
                    }
                }
                
                // TODO advanced trigger type
            }  
        }


        // store final trigger
        if(curTriggerType) {
            triggers.push([curTriggerType, curTrigger]);
        }

        return { triggers: triggers, unique: unique, requires: require, role_attribute: roleAttribute, identity: identity };

    }
    
    /**
    Target type pre-parse
    This doesn't *really* parse a target type, but it checks if it contains a type annotation and if not adds a provided default type annotation.
    Types:
    player (default)
    role
    attribute
    alignment
    category
    class
    group
    poll
    abilityType
    abilitySubtype
    killingType
    location (locations includes unique locations as well as all players and groups)
    source (may be a group, alignment, attribute, player, poll)
    info (just text)
    list (not annotated)
    result (a special type for ability results, may take several forms such as role or success)
    success (a boolean like value for ability results, may be compared to a result)
    number
    activeExtaRole (an active extra role)
    activeAttribute (an active attribute)
    choice (name of a choice)
    option (name of an option in a choice)
    boolean (true/false)
    **/
    function ttpp(targetType, defaultType = "infer") {
        // list type
        if(targetType.indexOf("+") > 0) {
            let listItems = targetType.split("+");
            console.log(targetType, listItems);
            let listType;
            // get list type from annotation
            if(targetType.indexOf("[") > 0 && targetType.indexOf("]") > 0) {
                listType = targetType.split("[")[1].split("]")[0];
            } else if(defaultType === "infer") { // infer type
                listType = inferType(listItems[0]);
            } else {
                listType = defaultType;
            }
            return { values: listItems, value_type: listType, type: "list" };
        }
        
        // pre-existing type annotation
        if(targetType.indexOf("[") > 0) {
            return targetType;
        }
        // type annotation needs to be infered
        if(defaultType === "infer") {
            return targetType + "[" + inferType(targetType) + "]";
        }
        // return default type
        return targetType + "[" + defaultType + "]";
    }
    
    /**
    Infer Type
    attempts to infer a target type type 
    **/
    this.inferType = function(targetType) {
        if(targetType.indexOf("[") > 0 && targetType.indexOf("]") > 0) {
            return targetType.split("[")[1].split("]")[0];
        }
        
        targetType = targetType.toLowerCase();
        
        let first = targetType[0];
        if(/\->/.test(targetType)) {
            let properties = targetType.toLowerCase().split(/\->/);
            if(properties.at(-1).substr(0, 4) === "attr") return "activeAttribute";
            switch(properties.at(-1)) {
                case "role": return "role";
                case "category": return "category";
                case "class": return "class";
                case "success": return "success";
                case "message": return "info";
                case "success": return "success";
                case "target": return "unknown";
                case "originalrole": return "role";
                case "alignment": return "alignment";
                case "counter": return "number";
                case "count": return "number";
                case "publicvotingpower": return "number";
                case "privatevotingpower": return "number";
                case "ownerrole": return "role";
                case "ownerplayer": return "player";
                case "value1": return "string";
                case "value2": return "string";
                case "value3": return "string";
                case "members": return "player";
                case "players": return "player";
                case "randomplayer": return "player";
                case "mostfreqrole": return "role";
                case "source": return "player";
                default: return "unknown";
            }
        } else if(first == "&") {
            return "alignment";
        }  else if(first == "^") {
            return "role";
        } else if(first == "@") {
            switch(targetType) {
                case "@actionabilitytype": return "abilityType";
                case "@actionfeedback": return "info";
                case "@attacksource": case "@triggersource": return "source";
                case "@deathtype": return "killingType";
                case "@killingtype": return "killingType";
                case "@visittype": return "abilityType";
                case "@visitparameter":  case "@secondvisitparameter": return "unknown";
                case "@thisattr": return "activeAttribute";
                case "@result": case "@result1": case "@result2": case "@result3": 
                case "@result4": case "@result5": case "@result6": case "@result7": 
                case "@actionresult": return "result";
                case "@chosen": case "@option": return "option";
                case "@attacklocation": return "location";
                default: return "player";
            }
        } else if(first == "%") {
            if(targetType.substr(1, 4) === "role") return "role";
            else if(targetType.substr(1, 6) === "player") return "player";
            else if(targetType.substr(1, 6) === "number") return "number";
            else if(targetType === "%partialrolelist%") return "info";
            else return "unknown";
        } else if(first == "#") {
            return "location";
        } else if(first == "`") {
            switch(targetType) {
                case "`success`": case "`failure`":
                    return "success";
                default:
                    if(killingTypeNames.includes(targetType.replace(/`/g,"").toLowerCase())) return "killingType";
                    if(verifyRole(targetType)) return "role";
                    if(verifyAttribute(targetType)) return "attribute";
                    if(verifyTeam(targetType) || verifyTeamName(targetType)) return "alignment";
                    if(verifyClass(targetType)) return "class";
                    if(verifyCategory(targetType)) return "category";
                    if(verifyPoll(targetType)) return "poll";
                    if(verifyAbilityTypeName(targetType)) return "abilityType";
                    let spl = targetType.replace(/`/g,"").toLowerCase().split(":");
                    console.log(spl);
                    if(spl.length === 2 && ["role","group","attribute","poll","team"].includes(spl[0])) return "source";
                    return targetType.includes("@") || targetType.length > 30 ? "info" : "string";
            }
        } else {
            if(/^\d+$/.test(targetType)) {
                return "number";
            }
            if(["true","false"].includes(targetType.toLowerCase())) {
                return "boolean";
            }
            return "unknown"; // this should never occur
        }
    }
    
}
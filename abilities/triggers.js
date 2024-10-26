/**
    Abilities Module - Triggers
    The module for implementing ability triggers
**/

module.exports = function() {
    
     /**
    Trigger
    triggers a trigger for a specified game element
    **/
    this.trigger = async function(src_ref, triggerName, additionalTriggerData = {}) {
        let type = srcToType(src_ref);
        let val = srcToValue(src_ref);
        if(!val) {// default to player type
            val = type;
            type = "player";
        }
        // run trigger
        abilityLog(`🔷 **Trigger:** ${triggerName} for ${srcRefToText(src_ref)}`);  
        switch(type) {
            case "player":
                await triggerPlayer(val, triggerName, additionalTriggerData, true);
            break;
            case "player_attr":
                let attr = await roleAttributeGetPlayer(val);
                if(!attr) { // after a remove granting we wont be able to find the owner anymore
                    abilityLog(`❗ **Skipped Trigger:** Could not find who <#${val}> belongs to.`);
                    return;
                }
                await triggerPlayer(attr.id, triggerName, additionalTriggerData, true);
            break;
            case "player_group":
                // cant run triggers as player_group
            break;
            case "group":
                await triggerGroup(val, triggerName, additionalTriggerData, true);
            break;
            case "poll":
                await triggerPoll(val, triggerName, additionalTriggerData, true);
            break;
            case "attribute":
                await triggerAttribute(val, triggerName, additionalTriggerData, true);
            break;
            default:
                abilityLog(`❗ **Skipped Trigger:** Unknown type for trigger ${type}.`);
            break;
        }
    }
    
     /**
    Trigger Player
    triggers a trigger for a specified player
    **/
    this.triggerPlayer = async function(player_id, triggerName, additionalTriggerData = {}, fromTrigger = false) {
        if(!fromTrigger) abilityLog(`🔷 **Trigger:** ${triggerName} for <@${player_id}>`);  
        // primary roles
        await triggerPlayerRole(player_id, triggerName, additionalTriggerData, fromTrigger);
        // role type attributes (additional roles)
        await triggerPlayerAttr(player_id, triggerName, additionalTriggerData, fromTrigger);
    }
    
    this.triggerPlayerRole = async function(player_id, triggerName, additionalTriggerData = {}, fromTrigger = false) {
        return new Promise(res => {
            // get all players
            sql("SELECT role,id FROM players WHERE type='player' AND id=" + connection.escape(player_id), async r => {
                //trigger handler
                if(!r[0]) {
                    abilityLog(`❗ **Skipped Trigger:** Cannot find matching player for ${player_id}.`);
                    res();
                    return;
                }
                await triggerHandlerPlayer(r[0], triggerName, additionalTriggerData);
                // resolve outer promise
                res();
            });
        });
    }
    
    this.triggerPlayerAttr = async function(player_id, triggerName, additionalTriggerData = {}, fromTrigger = false) {
        return new Promise(res => {
            // get all players
            sql("SELECT players.id,active_attributes.ai_id,active_attributes.val1 AS role,active_attributes.val2 AS channel_id FROM players INNER JOIN active_attributes ON players.id = active_attributes.owner WHERE players.type='player' AND active_attributes.attr_type='role' AND id=" + connection.escape(player_id), async r => {
                // iterate through additional roles
                for(let i = 0; i < r.length; i++) {
                //trigger handler
                    if(!r[i] || !r[i].role) {
                        abilityLog(`❗ **Skipped Trigger:** Cannot find valid role for ${player_id} #${i}.`);
                        res();
                        return;
                    }
                    await triggerHandlerPlayerRoleAttribute(r[i], triggerName, additionalTriggerData);
                    await useAttribute(r[i].ai_id);
                }
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Player - Role Attribute
    **/
    this.triggerPlayerRoleAttributeByAttr = function(ai_id, triggerName, additionalTriggerData = {}, fromTrigger = false) {
        return new Promise(res => {
            // get all players
            sql("SELECT players.id,active_attributes.ai_id,active_attributes.val1 AS role,active_attributes.val2 AS channel_id FROM players INNER JOIN active_attributes ON players.id = active_attributes.owner WHERE players.type='player' AND active_attributes.attr_type='role' AND active_attributes.ai_id=" + connection.escape(ai_id), async r => {
                if(!fromTrigger) abilityLog(`🔷 **Trigger:** ${triggerName} for <@${r[0].id}> (Role Attribute)`);  
                // iterate through additional roles
                for(let i = 0; i < r.length; i++) {
                //trigger handler
                    if(!r[i] || !r[i].role) {
                        abilityLog(`❗ **Skipped Trigger:** Cannot find valid role for ${player_id} #${i}.`);
                        res();
                        return;
                    }
                    await triggerHandlerPlayerRoleAttribute(r[i], triggerName, additionalTriggerData);
                    await useAttribute(r[i].ai_id);
                }
                // resolve outer promise
                res();
            });
        });
    }

    
     /**
    Trigger Group
    triggers a trigger for a specified group
    **/
    this.triggerGroup = function(channel_id, triggerName, additionalTriggerData = {}, fromTrigger = false) {
        if(!fromTrigger) abilityLog(`🔷 **Trigger:** ${triggerName} for <#${channel_id}>`);  
        return new Promise(res => {
            // get all players
            sql("SELECT name,channel_id FROM active_groups WHERE disbanded=0 AND channel_id=" + connection.escape(channel_id), async r => {
                //trigger handler
                if(!r[0]) {
                    abilityLog(`❗ **Skipped Trigger:** Cannot find matching group for ${channel_id}.`);
                    res();
                    return;
                }
                await triggerHandlerGroup(r[0], triggerName, additionalTriggerData);
                // resolve outer promise
                res();
            });
        });
    }
    
     /**
    Trigger Poll
    triggers a trigger for a specified poll
    **/
    this.triggerPoll = function(poll_name, triggerName, additionalTriggerData = {}, fromTrigger = false) {
        if(!fromTrigger) abilityLog(`🔷 **Trigger:** ${triggerName} for \`${toTitleCase(poll_name)}\``);  
        return new Promise(res => {
            // get all players
            sql("SELECT name,parsed FROM polls WHERE name=" + connection.escape(poll_name), async r => {
                //trigger handler
                if(!r[0] || !r[0].parsed) {
                    abilityLog(`❗ **Skipped Trigger:** Cannot find matching poll for ${poll_name}.`);
                    res();
                    return;
                }
                let parsed = JSON.parse(r[0].parsed);
                await triggerHandlerParsedHandler(triggerName, additionalTriggerData, parsed, `poll:${r[0].name}`, `poll:${r[0].name}`);
                // resolve outer promise
                res();
            });
        });
    }
    
     /**
    Trigger Attribute
    triggers a trigger for a specified attribute
    **/
    this.triggerAttribute = function(attr_id, triggerName, additionalTriggerData = {}, fromTrigger = false) {
        if(!fromTrigger) abilityLog(`🔷 **Trigger:** ${triggerName} for ${srcRefToText('attribute:' + attr_id)}`);  
        return new Promise(res => {
            // get all players
            sql("SELECT active_attributes.ai_id,attributes.name,attributes.parsed FROM attributes INNER JOIN active_attributes ON attributes.name = active_attributes.val1 WHERE active_attributes.ai_id=" + connection.escape(attr_id), async r => {
                //trigger handler
                if(!r[0] || !r[0].parsed) {
                    abilityLog(`❗ **Skipped Trigger:** Cannot find matching attribute for ${attr_id}.`);
                    res();
                    return;
                }
                let parsed = JSON.parse(r[0].parsed);
                let updatedAdditionalTriggerData = deepCopy(additionalTriggerData); // deep clone
                updatedAdditionalTriggerData.attr_owner = getCustomAttributeOwner(r[0].ai_id);
                updatedAdditionalTriggerData.attr_source = getCustomAttributeSource(r[0].ai_id);
                await triggerHandlerParsedHandler(triggerName, updatedAdditionalTriggerData, parsed, `attribute:${r[0].ai_id}`, `attribute:${r[0].name}`);
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Handler
    handle a trigger triggering (for everyone)
    **/
    this.triggerHandler = async function(triggerName, additionalTriggerData = {}) {
        abilityLog(`🔷 **Trigger:** ${triggerName}`);  
        await triggerHandlerPlayers(triggerName, additionalTriggerData);
        await triggerHandlerPlayersRoleAttributes(triggerName, additionalTriggerData);
        await triggerHandlerGroups(triggerName, additionalTriggerData);
        await triggerHandlerPolls(triggerName, additionalTriggerData);
        await triggerHandlerAttributes(triggerName, additionalTriggerData);
    }
    
    /**
    Trigger Handler - Players
    handles a trigger triggering for ALL players
    **/
    function triggerHandlerPlayers(triggerName, additionalTriggerData = {}) {
        return new Promise(res => {
            // get all players
            sql("SELECT role,id FROM players WHERE type='player' AND alive=1", async r => {
                // get their role's data
                for(let pr of r) {
                    await triggerHandlerPlayer(pr, triggerName, additionalTriggerData);
                }
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Handler - Players (Role Attributes)
    handles a trigger triggering for ALL players' role attributes
    **/
    function triggerHandlerPlayersRoleAttributes(triggerName, additionalTriggerData = {}) {
        return new Promise(res => {
            // get all players
            sql("SELECT players.id,active_attributes.ai_id,active_attributes.val1 AS role,active_attributes.val2 AS channel_id FROM players INNER JOIN active_attributes ON players.id = active_attributes.owner WHERE players.type='player' AND active_attributes.attr_type='role'", async r => {
                // get their role's data
                for(let pr of r) {
                    if(!pr || !pr.role) {
                        abilityLog(`❗ **Skipped Trigger:** Cannot find valid role for ${pr.id} #${i}.`);
                        res();
                        return;
                    }
                    await triggerHandlerPlayerRoleAttribute(pr, triggerName, additionalTriggerData);
                    await useAttribute(pr.ai_id); 
                }
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Handler - Groups
    handles a trigger triggering for ALL groups
    **/
    function triggerHandlerGroups(triggerName, additionalTriggerData = {}) {
        return new Promise(res => {
            // get all players
            sql("SELECT name,channel_id FROM active_groups WHERE disbanded=0", async r => {
                // get their groups's data
                for(let pr of r) {
                    await triggerHandlerGroup(pr, triggerName, additionalTriggerData);
                }
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Handler - Polls
    handles a trigger triggering for ALL polls
    **/
    function triggerHandlerPolls(triggerName, additionalTriggerData = {}) {
        return new Promise(res => {
            // get all players
            sql("SELECT name,parsed FROM polls", async r => {
                // no need for an extra layer for polls
                for(let pr of r) {
                    if(!pr.parsed) continue;
                    let parsed = JSON.parse(pr.parsed);
                    await triggerHandlerParsedHandler(triggerName, additionalTriggerData, parsed, `poll:${pr.name}`, `poll:${pr.name}`);
                }
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Handler - Attributes
    handles a trigger triggering for ALL attributes
    **/
    function triggerHandlerAttributes(triggerName, additionalTriggerData = {}) {
        return new Promise(res => {
            // get all players
            sql("SELECT active_attributes.ai_id,attributes.name,attributes.parsed FROM attributes INNER JOIN active_attributes ON attributes.name = active_attributes.val1 WHERE active_attributes.attr_type='custom'", async r => {
                // no need for an extra layer for attributes due to JOIN which I forgot about previously!
                for(let pr of r) {
                    if(!pr.parsed) continue;
                    let parsed = JSON.parse(pr.parsed);
                    let updatedAdditionalTriggerData = deepCopy(additionalTriggerData); // deep clone
                    updatedAdditionalTriggerData.attr_owner = getCustomAttributeOwner(r[0].ai_id);
                    updatedAdditionalTriggerData.attr_source = getCustomAttributeSource(r[0].ai_id);
                    await triggerHandlerParsedHandler(triggerName, updatedAdditionalTriggerData, parsed, `attribute:${pr.ai_id}`, `attribute:${pr.name}`);
                }
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Handler - Player
    handles trigger triggering for a single player
    **/
    async function triggerHandlerPlayer(pr, triggerName, additionalTriggerData = {}) {
        return await new Promise(res => {
            sql("SELECT * FROM roles WHERE name=" + connection.escape(pr.role), async result => {
                if(!result[0]) {
                    abilityLog(`🔴 **Skipped Player:** <@${toTitleCase(pr.id)}>. Unknown role \`${toTitleCase(pr.role)}\`.`);
                    res();
                    return;
                }
                // parse the formalized desc into an object
                if(!result[0].parsed) {
                    abilityLog(`🔴 **Skipped Player:** <@${toTitleCase(pr.id)}>. Invalid role \`${toTitleCase(pr.role)}\`.`);
                    res();
                    return;
                }
                let parsed = JSON.parse(result[0].parsed);
                await triggerHandlerParsedHandler(triggerName, additionalTriggerData, parsed, `player:${pr.id}`, `role:${pr.role}`);
                // resolve outer promise
                res();
            });            
        });
    }
    
    /**
    Trigger Handler - Player Role Attribute
    handles trigger triggering for a single player's role attribute
    **/
    async function triggerHandlerPlayerRoleAttribute(pr, triggerName, additionalTriggerData = {}) {
        return await new Promise(res => {
            sql("SELECT * FROM roles WHERE name=" + connection.escape(pr.role), async result => {
                if(!result[0]) {
                    abilityLog(`🔴 **Skipped Player:** <@${toTitleCase(pr.id)}> (<#${pr.channel_id}>). Unknown role \`${toTitleCase(pr.role)}\`.`);
                    res();
                    return;
                }
                // parse the formalized desc into an object
                if(!result[0].parsed) {
                    abilityLog(`🔴 **Skipped Player:** <@${toTitleCase(pr.id)}> (<#${pr.channel_id}>). Invalid role \`${toTitleCase(pr.role)}\`.`);
                    res();
                    return;
                }
                let parsed = JSON.parse(result[0].parsed);
                await triggerHandlerParsedHandler(triggerName, additionalTriggerData, parsed, `player_attr:${pr.channel_id}`, `role:${pr.role}`);
                // resolve outer promise
                res();
            });            
        });
    }
    
    /**
    Trigger Handler - Group
    handles trigger triggering for a single group
    **/
    async function triggerHandlerGroup(pr, triggerName, additionalTriggerData = {}) {
        return await new Promise(res => {
            sql("SELECT * FROM `groups` WHERE name=" + connection.escape(pr.name), async result => {
                if(!result[0]) {
                    abilityLog(`🔴 **Skipped Group:** <#${pr.channel_id}>. Unknown group \`${toTitleCase(pr.name)}\`.`);
                    res();
                    return;
                }
                // parse the formalized desc into an object
                if(!result[0].parsed) {
                    abilityLog(`🔴 **Skipped Group:** <#${pr.channel_id}>. Invalid group \`${toTitleCase(pr.name)}\`.`);
                    res();
                    return;
                }
                let parsed = JSON.parse(result[0].parsed);
                await triggerHandlerParsedHandler(triggerName, additionalTriggerData, parsed, `group:${pr.channel_id}`, `group:${pr.name}`);
                // resolve outer promise
                res();
            });            
        });
    }
    
    /**
    Handles the parsed data of a game component in a trigger
    **/
    async function triggerHandlerParsedHandler(triggerName, additionalTriggerData, parsed, src_ref, src_name) {
        if(!parsed || !parsed.triggers) return;
        const triggerNameFormatted = triggerName.trim().toLowerCase().replace(/[^a-z]/g,"");
        
        // grab the triggers
        let triggers = parsed.triggers;
        // filter out the relevant triggers
        triggers = triggers.filter(el => el.trigger.trim().toLowerCase().replace(/[^a-z]/g,"") == triggerNameFormatted);
        // execute all relevant triggers
        for(const trigger of triggers) {
            // COMPLEX TRIGGERS
            if(trigger.complex) {
                let param = trigger.trigger_parameter;
                let param2 = trigger.trigger_parameter2 ?? null;
                switch(triggerName) {
                    case "On Death Complex":
                    case "On Killed Complex":
                    case "On Banishment Complex":
                    case "On Banished Complex":
                        let selector = await parsePlayerSelector(param);
                        if(selector.includes(additionalTriggerData.this)) {
                            await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                        } else {
                            console.log("Failed Selector Condition", selector);
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param}\`.`);
                        }
                    break;
                    case "On Action Complex":
                        if(additionalTriggerData.src_name != src_name) {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Src name mismatch.`);        
                        } else {
                            let abilityType = await parseSelector(param);
                            let triggerAbilityType = (abilityType.type === "abilitySubtype" ? additionalTriggerData.ability_subtype : "") + additionalTriggerData.ability_type;
                            abilityType = abilityType.value[0].toLowerCase().replace(/[^a-z]+/,"");
                            triggerAbilityType = triggerAbilityType.replace(/[^a-z]+/,"");
                            if(abilityType === triggerAbilityType) {
                                 await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                            } else {
                                abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param}\` with \`${triggerAbilityType}\`.`);
                            }
                        }
                    break;
                    case "On Visited Complex":
                        let abilityType2 = await parseSelector(param);
                        let triggerAbilityType2 = (abilityType2.type === "abilitySubtype" ? additionalTriggerData.visit_subtype : "") + additionalTriggerData.visit_type;
                        abilityType2 = abilityType2.value[0].toLowerCase().replace(/[^a-z]+/,"");
                        triggerAbilityType2 = triggerAbilityType2.replace(/[^a-z]+/,"");
                        if(abilityType2 === triggerAbilityType2) {
                             await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                        } else {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param}\` with \`${triggerAbilityType2}\`.`);
                        }
                    break;
                    case "On Visited Target Complex":
                        let abilityType3 = await parseSelector(param2);
                        let triggerAbilityType3 = (abilityType3.type === "abilitySubtype" ? additionalTriggerData.visit_subtype : "") + additionalTriggerData.visit_type;
                        abilityType3 = abilityType3.value[0].toLowerCase().replace(/[^a-z]+/,"");
                        triggerAbilityType3 = triggerAbilityType3.replace(/[^a-z]+/,"");
                        let selector2 = await parsePlayerSelector(param);
                        if(abilityType3 === triggerAbilityType3) {
                            if(selector2.includes(additionalTriggerData.this)) {
                                await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                            } else {
                                abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param}\`.`);
                            }
                        } else {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param2}\` with \`${triggerAbilityType3}\`.`);
                        }
                    break;
                    case "On Poll Win Complex":
                        let poll = additionalTriggerData.poll_name.trim().toLowerCase().replace(/[^a-z]/g,"");
                        let paramPoll = selectorGetTarget(param);
                        if(poll === paramPoll) {
                             await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                        } else {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${paramPoll}\` with \`${poll}\`.`);
                        }
                    break;
                    case "Choice Chosen Complex":
                        let option = parseOption(param);
                        if(option === additionalTriggerData.chosen) {
                            await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                        } else {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param}\`.`);
                        }
                    break;
                    default:
                        abilityLog(`❗ **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Unknown complex trigger.`);
                    break;
                }
            }
            // NORMAL TRIGGERS
            else { // always execute for normal triggers, except actually not
                // check src name
                switch(triggerName) {
                    case "On Defense":
                    case "On Active Defense":
                    case "On Passive Defense":
                    case "On Partial Defense":
                    case "On Recruitment Defense":
                    case "On Action":
                        if(additionalTriggerData.src_name != src_name) {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Src name mismatch.`);        
                        } else {
                            // execute trigger
                            await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                        }
                    break;
                    default:
                        // execute trigger
                        await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                    break;
                }
            }
        }
    }
    
    /**
    Execute Trigger
    executes the abilities of a trigger if applicable
    **/
    async function executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerDataOriginal = {}) {
        const ptype = getPromptType(triggerName);
        const promptOverwrite = trigger?.parameters?.prompt_overwrite ?? "";
        const promptPing = !(promptOverwrite.match(/^silent:.*$/)); // check if prompt should ping
        const forced = (trigger?.parameters?.forced ?? false) ? 1 : 0; // check if action is forced
        const forcedSel = trigger?.parameters?.forced_sel ?? null;
        
        // extend additional trigger data
        let additionalTriggerData = JSON.parse(JSON.stringify(additionalTriggerDataOriginal));
        additionalTriggerData.parameters = trigger?.parameters ?? {};
        // any visitless ability is also direct
        if(additionalTriggerData.parameters.visitless === true) additionalTriggerData.parameters.direct = true;
        
        // handle action scaling
        const actionScaling = trigger?.parameters?.scaling ?? [];
        let actionCount = 1;
        let actionCountSuffix = "";
        for(const scaling of actionScaling) {
            let scalValue = await handleScaling(scaling);
            if(scalValue !== null) actionCount = scalValue;
        }
        let scalingMessage = "";
        if(actionCount > 1) scalingMessage = `\n\nYou may use your ability \`${actionCount}\` times. Please provide your choices for each use separated by newlines.`;
        
        // if action count is zero, then no action at all
        if(actionCount === 0) {
            abilityLog(`🔴 **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). Action count is \`0\`.`);
            return;
        }
        
        // check trigger restrictions
        let promptInfo = [];
        let restrictions = trigger?.parameters?.restrictions ?? [];
        for(let i = 0; i < restrictions.length; i++) {
            let passed = await handleRestriction(src_ref, trigger.abilities[0], restrictions[i], RESTR_PRE, null, additionalTriggerData);
            if(!passed) {
                abilityLog(`🔴 **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). Failed restriction \`${restrictions[i].type}\`.`);
                return;
            }
            // get additional restriction info
            let info = await getRestrictionInfo(src_ref, trigger.abilities[0], restrictions[i]);
            if(info) promptInfo.push(info);
        }
        // merge prompt info
        let promptInfoMsg = "";
        if(forced) {
            if(!forcedSel) {
                promptInfo.push("This is a forced action. If you do not submit a selection, it will be randomly chosen for you");
            } else {
                let parsed = await parseSelector(forcedSel, src_ref, additionalTriggerData);
                let parsedText = parsed.value[0];
                if(parsed.type === "player") parsedText = mainGuild.members.cache.get(parsed.value[0]).displayName;
                promptInfo.push(`This is a forced action. If you do not submit a selection, ${parsedText} will be chosen`);
            }
        }
        if(promptInfo.length > 0) promptInfoMsg = promptInfo.join("; ") + ".";
        
        // check if prompts are necessary
        let allPrompts = [];
        for(const ability of trigger.abilities) {
            let pro = getPrompts(ability);
            allPrompts.push(...pro);
        }
        // find first instances of prompts; removes duplicates
        let prompts = [];
        let primary = allPrompts.find(el => el[2] === "primary");
        let secondary = allPrompts.find(el => el[2] === "secondary");
        let choice = allPrompts.find(el => el[2] === "choice");
        if(primary) prompts.push(primary);
        if(secondary) prompts.push(secondary);
        
        if(choice) {
            await choicesChoosingPrompt(src_name, src_ref, trigger.abilities[0], promptOverwrite);
            return;
        }
        
        switch(prompts.length) {
            // if no prompts are necessary -> directly execute ability
            case 0: 
                // iterate through all abilities and execute them
                if(ptype[1] === true) { // forced prompt
                    if(forced) {
                        abilityLog(`❗ **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). This ability is both explicitly forced, as well as a selectionless prompting ability. This is unsupported.`);
                        return;
                    }
                
                    // additional second restriction check
                    for(let i = 0; i < restrictions.length; i++) {
                        let passed = await handleRestriction(src_ref, trigger.abilities[0], restrictions[i], RESTR_POST, null, additionalTriggerData);
                        if(!passed) {
                            abilityLog(`🔴 **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). Failed restriction \`${restrictions[i].type}\`.`);
                            return;
                        }
                    }
                    // send prompt
                    let promptMsg = getPromptMessage(trigger.abilities[0], promptOverwrite);
                    let refImg = await refToImg(src_name);
                    for(let i = 0; i < actionCount; i++) { // iterate for scaling
                        if(promptMsg[promptMsg.length - 1] === ".") promptMsg = promptMsg.substr(0, promptMsg.length - 1); // if last character is normal . remove it 
                        let message = await sendSelectionlessPrompt(src_ref, ptype[0], `${getAbilityEmoji(trigger.abilities[0].type)} ${promptMsg}${PROMPT_SPLIT}`, EMBED_GRAY, promptPing, promptInfoMsg, refImg, "Ability Prompt");
                        abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(trigger.abilities[0].type)} {Selectionless}`);
                        // schedule actions
                        await createAction(message.id, message.channel.id, src_ref, src_name, trigger.abilities, trigger.abilities, ptype[0], "none", "none", neverActionTime, restrictions, additionalTriggerData, "notarget", forced);
                    }
                } else { // no prompt
                    for(let i = 0; i < actionCount; i++) { 
                        for(const ability of trigger.abilities) {
                            let feedback = await executeAbility(src_ref, src_name, ability, restrictions, additionalTriggerData);
                            if(feedback && feedback.msg) abilitySend(src_ref, feedback.msg);
                        }
                    }
                }
            break;
            // single prompt (@Selection)
            case 1: {
                let type = toTitleCase(selectorGetType(prompts[0][1]));
                let promptMsg = getPromptMessage(trigger.abilities[0], promptOverwrite, type);
                let refImg = await refToImg(src_name);
                let message = await abilitySendProm(src_ref, `${getAbilityEmoji(trigger.abilities[0].type)} ${promptMsg} ${scalingMessage}\nPlease submit your choice as a reply to this message.`, EMBED_GRAY, promptPing, promptInfoMsg, refImg, "Ability Prompt");
                if(ptype[0] === "immediate") { // immediate prompt
                    abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(trigger.abilities[0].type)} [${type}] {Immediate}`);
                    await createPrompt(message.id, message.channel.id, src_ref, src_name, trigger.abilities, restrictions, additionalTriggerData, "immediate", actionCount, forced, type);
                } else if(ptype[0] === "end") { // end phase prompt
                    abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(trigger.abilities[0].type)} [${type}] {End}`);
                    await createPrompt(message.id, message.channel.id, src_ref, src_name, trigger.abilities, restrictions, additionalTriggerData, "end", actionCount, forced, type);
                } else {
                    abilityLog(`❗ **Error:** Invalid prompt type!`);
                }
            } break;
            // double prompt (@Selection and @SecondarySelection)
            case 2: {
                let type1 = toTitleCase(selectorGetType(prompts[0][1]));
                let type2 = toTitleCase(selectorGetType(prompts[1][1]));
                let promptMsg = getPromptMessage(trigger.abilities[0], promptOverwrite, type1, type2);
                let refImg = await refToImg(src_name);
                let message = await abilitySendProm(src_ref, `${getAbilityEmoji(trigger.abilities[0].type)} ${promptMsg} ${scalingMessage}\nPlease submit your choice as a reply to this message.`, EMBED_GRAY, promptPing, promptInfoMsg, refImg, "Ability Prompt");
                if(ptype[0] === "immediate") { // immediate prompt
                    abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(trigger.abilities[0].type)} [${type1}, ${type2}] {Immediate}`);
                    await createPrompt(message.id, message.channel.id, src_ref, src_name, trigger.abilities, restrictions,additionalTriggerData, "immediate", actionCount, forced, type1, type2);
                } else if(ptype[0] === "end") { // end phase prompt
                    abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(trigger.abilities[0].type)} [${type1}, ${type2}] {End}`);
                    await createPrompt(message.id, message.channel.id, src_ref, src_name, trigger.abilities, restrictions, additionalTriggerData, "end", actionCount, forced, type1, type2);
                } else {
                    abilityLog(`❗ **Error:** Invalid prompt type!`);
                }
            } break;
            // more than 2 prompts -> error
            default:
                abilityLog(`❗ **Error:** Invalid amount of prompts (${prompts.length}) in ability!`);
            break;
        }
    }
    
    /**
    Get Ability Emoji
    WIP: move this?
    **/
    this.getAbilityEmoji = function(type) {
        let emojiName;
        switch(type) {
            case "killing": emojiName = "CategoryKilling"; break;
            case "investigating": emojiName = "CategoryInvestigative"; break;
            case "targeting": emojiName = "CategoryMiscellaneous"; break;
            case "disguising": emojiName = "Disguise"; break;
            case "protecting": emojiName = "Defense"; break;
            case "applying": emojiName = "CategoryPower"; break;
            case "redirecting": emojiName = "Redirect"; break;
            case "manipulating": emojiName = "VoteManipulation"; break;
            case "whispering": emojiName = "Whispering"; break;
            case "joining": emojiName = "CategoryGroup"; break;
            case "granting": emojiName = "Extra"; break;
            case "loyalty": emojiName = "Soul"; break;
            case "obstructing": emojiName = "BotDeveloper"; break;
            case "poll": emojiName = "VotingBooth"; break;
            case "announcement": emojiName = "KWList"; break;
            case "changing": emojiName = "CategoryAlign"; break;
            case "copying": emojiName = "LookAlike"; break;
            case "choices": emojiName = "UnalignedPlaceholder"; break;
            case "ascend": emojiName = ""; break;
            case "descend": emojiName = ""; break;
            case "disband": emojiName = ""; break;
            case "counting": emojiName = ""; break;
            case "reset": emojiName = ""; break;
            case "cancel": emojiName = ""; break;
            case "switching": emojiName = ""; break;
            case "process": emojiName = ""; break;
            case "evaluate": emojiName = ""; break;
            case "feedback": emojiName = ""; break;
            case "action": emojiName = ""; break;
            case "failure": emojiName = ""; break;
            case "success": emojiName = ""; break;
            case "log": emojiName = ""; break;
        }
        return emojiName ? getEmoji(emojiName) : "";
    }
    
    /**
    Command: $emit <trigger type>
    Manually emits a certain trigger type
    **/
    this.cmdEmit = async function(channel, argsX) {
        console.log(`Emitting a ${argsX[0]} event.`);
        let evt = toTitleCase(argsX.join(" "));
        switch(argsX[0]) {
            default: await triggerHandler(evt); break;
            case "start": await eventStarting(); break;
            case "sday": await eventStartDay(); break;
            case "snight": await eventStartNight(); break;
        }
    }
    
    /**
    Get prompt type
    returns whether to use an immediate or an end phase prompt, as well as wether the prompt is forced
    **/
    this.getPromptType = function(trigger) {
        switch(trigger) {
            default:
                return [ "immediate", false ];
            case "Immediate Night": case "Immediate Day": case "Immediate":
                return [ "immediate", true ];
            case "Start Night": case "Start Day": case "Start Phase":
            case "End Night": case "End Day": case "End Phase":
                return [ "end", true ];
        }
    }
    
    /**
    Event: Starting
    triggers at the start of the game
    **/
    this.eventStarting = async function() {
        // pause queue checker during event
        pauseActionQueueChecker = true;
        
        // starting
        await triggerHandler("Starting");
        
        // passive
        await triggerHandler("Passive");
        
        // starting storytime
        await bufferStorytime("The game has started!");
        await postStorytime();
        
        // pause queue checker during event
        pauseActionQueueChecker = false;
    }
    
    /**
    Event: Start Night
    triggers at the start of the night
    **/
    this.eventStartNight = async function() {
        // pause queue checker during event
        pauseActionQueueChecker = true;
        
        await executeForcedPrompts();
        await clearPrompts();
        
        // close polls
        await closePolls();
        
        // handle queued end actions; also redo immediate queued actions even if normally none should be present
        skipActionQueueChecker = true;
        await executeDelayedQueuedAction();
        await actionQueueChecker();
        await executeEndQueuedAction();
        await actionQueueChecker();
        skipActionQueueChecker = false;
        
        // clear actions
        await clearNeverQueuedAction();
        
        // passive end actions
        await triggerHandler("Passive End Day");
        await triggerHandler("Passive End Phase");
        
        // end of phase
        await attributeCleanup();
        await whisperingCleanup();
        await choicesReset();
        await killqKillall();
        
        // storytime
        await postStorytime();
        
        // passive start actions
        await triggerHandler("Passive Start Night");
        await triggerHandler("Start Night");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Phase");
        
        // handle killq
        await killqKillall();
        
        // immediate actions
        await triggerHandler("Immediate Night");
        await triggerHandler("Immediate");
        
        // end actions
        await triggerHandler("End Night");
        await triggerHandler("End Phase");
        await triggerHandler("Start Day");
        await triggerHandler("Start Phase");
        
        // passive
        await triggerHandler("Passive");
        
        // handle killq
        await killqKillall();
        
        // pause queue checker during event
        pauseActionQueueChecker = false;
    }
    
    /**
    Event: Start Day
    triggers at the start of the day
    **/
    this.eventStartDay = async function() {
        // pause queue checker during event
        pauseActionQueueChecker = true;
        
        await executeForcedPrompts();
        await clearPrompts();
        
        // close polls
        await closePolls();
        
        // handle queued end actions; also redo immediate queued actions even if normally none should be present
        skipActionQueueChecker = true;
        await executeDelayedQueuedAction();
        await actionQueueChecker();
        await executeEndQueuedAction();
        await actionQueueChecker();
        skipActionQueueChecker = false;
        
        // clear actions
        await clearNeverQueuedAction();
        
        // passive end actions
        await triggerHandler("Passive End Night");
        await triggerHandler("Passive End Phase");
        
        // end of phase
        await attributeCleanup();
        await whisperingCleanup();
        await choicesReset();
        await killqKillall();
        
        // storytime
        await postStorytime();
        
        // passive start actions
        await triggerHandler("Passive Start Day");
        await triggerHandler("Start Day");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Phase");
        
        // handle killq
        await killqKillall();
        
        // immediate actions
        await triggerHandler("Immediate Day");
        await triggerHandler("Immediate");
        
        // end actions
        await triggerHandler("End Day");
        await triggerHandler("End Phase");
        await triggerHandler("Start Night");
        await triggerHandler("Start Phase");
        
        // passive
        await triggerHandler("Passive");
        
        // handle killq
        await killqKillall();
        
        // pause queue checker during event
        pauseActionQueueChecker = false;
    }
    
}
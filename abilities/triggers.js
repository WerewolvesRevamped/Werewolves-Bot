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
                let pid = await roleAttributeGetPlayer(val);
                if(!pid[0]) {
                    abilityLog(`❗ **Skipped Trigger:** Could not find who <#${val}> belongs to.`);
                    return;
                }
                await triggerPlayer(pid[0].id, triggerName, additionalTriggerData, true);
            break;
            case "group":
                await triggerGroup(val, triggerName, additionalTriggerData, true);
            break;
            case "poll":
                await triggerPoll(val, triggerName, additionalTriggerData, true);
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
    this.triggerPlayer = async function(player_id, triggerName, additionalTriggerData, fromTrigger = false) {
        if(!fromTrigger) abilityLog(`🔷 **Trigger:** ${triggerName} for <@${player_id}>`);  
        // primary roles
        await new Promise(res => {
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
        // role type attributes (additional roles)
        await new Promise(res => {
            // get all players
            sql("SELECT players.id,active_attributes.val1 AS role,active_attributes.val2 AS channel_id FROM players INNER JOIN active_attributes ON players.id = active_attributes.owner WHERE players.type='player' AND active_attributes.attr_type='role' AND id=" + connection.escape(player_id), async r => {
                // iterate through additional roles
                for(let i = 0; i < r.length; i++) {
                    await triggerHandlerPlayerRoleAttribute(r[i], triggerName, additionalTriggerData);
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
    this.triggerGroup = function(channel_id, triggerName, additionalTriggerData, fromTrigger = false) {
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
    this.triggerPoll = function(poll_name, triggerName, additionalTriggerData, fromTrigger = false) {
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
    Trigger Handler
    handle a trigger triggering (for everyone)
    **/
    this.triggerHandler = async function(triggerName, additionalTriggerData = {}) {
        abilityLog(`🔷 **Trigger:** ${triggerName}`);  
        await triggerHandlerPlayers(triggerName, additionalTriggerData);
        await triggerHandlerPlayersRoleAttributes(triggerName, additionalTriggerData);
        await triggerHandlerGroups(triggerName, additionalTriggerData);
        await triggerHandlerPolls(triggerName, additionalTriggerData);
    }
    
    /**
    Trigger Handler - Players
    handles a trigger triggering for ALL players
    **/
    function triggerHandlerPlayers(triggerName, additionalTriggerData) {
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
    function triggerHandlerPlayersRoleAttributes(triggerName, additionalTriggerData) {
        return new Promise(res => {
            // get all players
            sql("SELECT players.id,active_attributes.val1 AS role,active_attributes.val2 AS channel_id FROM players INNER JOIN active_attributes ON players.id = active_attributes.owner WHERE players.type='player' AND active_attributes.attr_type='role'", async r => {
                // get their role's data
                for(let pr of r) {
                    await triggerHandlerPlayerRoleAttribute(pr, triggerName, additionalTriggerData);
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
    function triggerHandlerGroups(triggerName, additionalTriggerData) {
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
    function triggerHandlerPolls(triggerName, additionalTriggerData) {
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
    Trigger Handler - Player
    handles trigger triggering for a single player
    **/
    async function triggerHandlerPlayer(pr, triggerName, additionalTriggerData = {}) {
        await new Promise(res => {
            sql("SELECT * FROM roles WHERE name=" + connection.escape(pr.role), async result => {
                if(!result[0]) {
                    abilityLog(`🔴 **Skipped Player:** <@${toTitleCase(pr.id)}>. Unknown role \`${toTitleCase(pr.role)}\`.`);
                    res();
                }
                // parse the formalized desc into an object
                if(result[0].parsed) res();
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
        await new Promise(res => {
            sql("SELECT * FROM roles WHERE name=" + connection.escape(pr.role), async result => {
                if(!result[0]) {
                    abilityLog(`🔴 **Skipped Player:** <@${toTitleCase(pr.id)}> (<#${pr.channel_id}>). Unknown role \`${toTitleCase(pr.role)}\`.`);
                    res();
                }
                // parse the formalized desc into an object
                if(result[0].parsed) res();
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
        await new Promise(res => {
            sql("SELECT * FROM groups WHERE name=" + connection.escape(pr.name), async result => {
                if(!result[0]) {
                    abilityLog(`🔴 **Skipped Group:** <#${pr.channel_id}>. Unknown group \`${toTitleCase(pr.name)}\`.`);
                    res();
                }
                // parse the formalized desc into an object
                if(result[0].parsed) res();
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
        // grab the triggers
        let triggers = parsed.triggers;
        // filter out the relevant triggers
        triggers = triggers.filter(el => el.trigger == triggerName);
        // execute all relevant triggers
        for(const trigger of triggers) {
            // COMPLEX TRIGGERS
            if(trigger.complex) {
                let param = trigger.trigger_parameter;
                switch(triggerName) {
                    case "On Death Complex":
                    case "On Killed Complex":
                        let selector = await parsePlayerSelector(param);
                        if(selector.includes(additionalTriggerData.this)) {
                            await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                        } else {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param}\`.`);
                        }
                    break;
                    case "On Action Complex":
                        let abilityType = await parseSelector(param);
                        let triggerAbilityType = additionalTriggerData.ability_subtype + additionalTriggerData.ability_type;
                        abilityType = abilityType.value[0].toLowerCase().replace(/[^a-z]+/,"");
                        triggerAbilityType = triggerAbilityType.replace(/[^a-z]+/,"");
                        if(abilityType === triggerAbilityType) {
                             await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
                        } else {
                            abilityLog(`🔴 **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Failed complex condition \`${param}\` with \`${triggerAbilityType}\`.`);
                        }
                    break;
                    default:
                        abilityLog(`❗ **Skipped Trigger:** ${srcRefToText(src_ref)} (${toTitleCase(triggerName)}). Unknown complex trigger.`);
                    break;
                }
            }
            // NORMAL TRIGGERS
            else { // always execute for normal triggers
                await executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData);
            }
        }
    }
    
    /**
    Execute Trigger
    executes the abilities of a trigger if applicable
    **/
    async function executeTrigger(src_ref, src_name, trigger, triggerName, additionalTriggerData = {}) {
        const ptype = getPromptType(triggerName);
        const promptOverwrite = trigger?.parameters?.prompt_overwrite;
        
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
        
        // iterate through abilities of the trigger
        for(const ability of trigger.abilities) {
            // check trigger restrictions
            let promptInfo = [];
            let restrictions = trigger?.parameters?.restrictions ?? [];
            for(let i = 0; i < restrictions.length; i++) {
                let passed = await handleRestriction(src_ref, ability, restrictions[i], RESTR_PRE, null, additionalTriggerData);
                if(!passed) {
                    abilityLog(`🔴 **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). Failed restriction \`${restrictions[i].type}\`.`);
                    return;
                }
                // get additional restriction info
                let info = await getRestrictionInfo(src_ref, ability, restrictions[i]);
                if(info) promptInfo.push(info);
            }
            // merge prompt info
            let promptInfoMsg = "";
            if(promptInfo.length > 0) promptInfoMsg = promptInfo.join("; ") + ".";
            // check if prompts are necessary
            let prompts = getPrompts(ability);
            switch(prompts.length) {
                // if no prompts are necessary -> directly execute ability
                case 0: {
                    if(ptype[1] === true) { // forced prompt
                        // additional second restriction check
                        for(let i = 0; i < restrictions.length; i++) {
                            let passed = await handleRestriction(src_ref, ability, restrictions[i], RESTR_POST, null, additionalTriggerData);
                            if(!passed) {
                                abilityLog(`🔴 **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). Failed restriction \`${restrictions[i].type}\`.`);
                                return;
                            }
                        }
                        // send prompt
                        let promptMsg = getPromptMessage(ability, promptOverwrite);
                        let refImg = await refToImg(src_name);
                        let mid = await sendSelectionlessPrompt(src_ref, ptype[0], `${getAbilityEmoji(ability.type)} ${promptMsg}${PROMPT_SPLIT}`, EMBED_GRAY, true, promptInfoMsg, refImg, "Ability Prompt");
                        // schedule actions
                        await createAction(mid, src_ref, src_name, ability, ability, ptype[0], "none", "none", neverActionTime, restrictions, additionalTriggerData, "notarget");
                    } else { // no prompt
                        let feedback = await executeAbility(src_ref, src_name, ability, restrictions, additionalTriggerData);
                        if(feedback && feedback.msg) abilitySend(src_ref, feedback.msg);
                    }
                } break;
                // single prompt (@Selection)
                case 1: {
                    let type = toTitleCase(selectorGetType(prompts[0][1]));
                    let promptMsg = getPromptMessage(ability, promptOverwrite, type);
                    let refImg = await refToImg(src_name);
                    let mid = (await abilitySendProm(src_ref, `${getAbilityEmoji(ability.type)} ${promptMsg} ${scalingMessage}`, EMBED_GRAY, true, promptInfoMsg, refImg, "Ability Prompt")).id;
                    if(ptype[0] === "immediate") { // immediate prompt
                        abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(ability.type)} [${type}] {Immediate}`);
                        await createPrompt(mid, src_ref, src_name, ability, restrictions, additionalTriggerData, "immediate", actionCount, type);
                    } else if(ptype[0] === "end") { // end phase prompt
                        abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(ability.type)} [${type}] {End}`);
                        await createPrompt(mid, src_ref, src_name, ability, restrictions, additionalTriggerData, "end", actionCount, type);
                    } else {
                        abilityLog(`❗ **Error:** Invalid prompt type!`);
                    }
                } break;
                // double prompt (@Selection and @SecondarySelection)
                case 2: {
                    let type1 = toTitleCase(selectorGetType(prompts[0][1]));
                    let type2 = toTitleCase(selectorGetType(prompts[1][1]));
                    let promptMsg = getPromptMessage(ability, promptOverwrite, type1, type2);
                    let refImg = await refToImg(src_name);
                    let mid = (await abilitySendProm(src_ref, `${getAbilityEmoji(ability.type)} ${promptMsg} ${scalingMessage}`, EMBED_GRAY, true, promptInfoMsg, refImg, "Ability Prompt")).id;
                    if(ptype[0] === "immediate") { // immediate prompt
                        abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(ability.type)} [${type1}, ${type2}] {Immediate}`);
                        await createPrompt(mid, src_ref, src_name, ability, restrictions,additionalTriggerData, "immediate", actionCount, type1, type2);
                    } else if(ptype[0] === "end") { // end phase prompt
                        abilityLog(`🟩 **Prompting Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) - ${toTitleCase(ability.type)} [${type1}, ${type2}] {End}`);
                        await createPrompt(mid, src_ref, src_name, ability, restrictions, additionalTriggerData, "end", actionCount, type1, type2);
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
    }
    
    /**
    Get Ability Emoji
    **/
    function getAbilityEmoji(type) {
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
        await triggerHandler("Starting");
    }
    
    /**
    Event: Start Night
    triggers at the start of the night
    **/
    this.eventStartNight = async function() {
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
        
        // passive start actions
        await triggerHandler("Passive Start Night");
        await triggerHandler("Start Night");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Phase");
        
        // immediate actions
        await triggerHandler("Immediate Night");
        await triggerHandler("Immediate");
        
        // end actions
        await triggerHandler("End Night");
        await triggerHandler("End Phase");
        await triggerHandler("Start Day");
        await triggerHandler("Start Phase");
    }
    
    /**
    Event: Start Day
    triggers at the start of the day
    **/
    this.eventStartDay = async function() {
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
        
        // passive start actions
        await triggerHandler("Passive Start Day");
        await triggerHandler("Start Day");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Phase");
        
        // immediate actions
        await triggerHandler("Immediate Day");
        await triggerHandler("Immediate");
        
        // end actions
        await triggerHandler("End Day");
        await triggerHandler("End Phase");
        await triggerHandler("Start Night");
        await triggerHandler("Start Phase");
    }
    
}
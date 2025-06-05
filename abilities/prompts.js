/**
    Abilities Module - Main
    The submodule for implement ability prompts and queued actions
**/

module.exports = function() {
    const prompts = require("./prompts.json");
    
    this.delayedActionTime = 2147483645;
    this.endActionTime = 2147483646;
    this.neverActionTime = 2147483647;
    
    // Prompt Message Splitter
    this.PROMPT_SPLIT = "․"; // this is a special marker character, not a normal .
    
    /**
    Get Promp Message
    returns a prompt message
    **/
    this.getPromptMessage = function(ability, promptOverwrite, type1 = "", type2 = "") {
        // apply prompt overwrite if applicable
        if(promptOverwrite) {
            let poSplit = promptOverwrite.split(":");
            if(promptOverwrite && prompts[promptOverwrite]) {
                return prompts[promptOverwrite];
            } else if(poSplit[1] && prompts[poSplit[1]]) {
                return prompts[poSplit[1]];
            }
        }
        // find prompt
        const ty = ability.type ? ability.type.replace(/ /g,"_") : null;
        const su = ability.subtype ? ability.subtype.replace(/ /g,"_") : null;
        const typ1 = type1.toLowerCase();
        const typ2 = type2.toLowerCase();
        const tysu = `${ty}.${su}`;
        const tysu1 = `${tysu}.1`;
        const tysu1l = `${tysu}.${typ1}`;
        const tysu2 = `${tysu}.2`;
        const tysu2l = `${tysu}.${typ1}_${typ2}`;
        const ty1l = `${ty}.${typ1}`;
        const ty2l = `${ty}.${typ1}_${typ2}`;
        const ty1 = `${ty}.1`;
        const ty2 = `${ty}.2`;
        // default prompt
        let promptMsg = `Please submit a ${type1}`;
        if(type2.length > 0) promptMsg += ` and ${type2}`;
        promptMsg += ` (\`${ty}${su?'.'+su:''}.${type2===''?'1':'2'}\`)`;
        if(type1.length === 0) promptMsg = `Please select an option (\`${tysu}\`)`
        // search for prompt in JSON
        if(type1 === "" && ty && su && prompts[tysu]) return prompts[tysu];
        else if(type1 === "" && ty && prompts[ty]) return prompts[ty];
        else if(type2 === "" && ty && su && prompts[tysu1l]) return prompts[tysu1l];
        else if(type2 === "" && ty && su && prompts[tysu1]) return prompts[tysu1];
        else if(type2 === "" && ty && su && prompts[tysu]) return prompts[tysu];
        else if(type2 !== "" && ty && su && prompts[tysu2l]) return prompts[tysu2l];
        else if(type2 !== "" && ty && su && prompts[tysu2]) return prompts[tysu2];
        else if(type2 !== "" && ty && su && prompts[tysu]) return prompts[tysu];
        else if(type2 === "" && ty  && prompts[ty1l]) return prompts[ty1l];
        else if(type2 === "" && ty  && prompts[ty1]) return prompts[ty1];
        else if(type2 === "" && ty  && prompts[ty]) return prompts[ty];
        else if(type2 !== "" && ty  && prompts[ty2l]) return prompts[ty2l];
        else if(type2 !== "" && ty  && prompts[ty2]) return prompts[ty2];
        else if(type2 !== "" && ty  && prompts[ty]) return prompts[ty];
        // return default prompt
        return promptMsg;
    }
    
    async function getPromptMessageRestriction(restriction, src_ref, additionalTriggerData) {
        if(restriction.type === "condition") {
            let txt = await getPromptMessageRestrictionCondition(restriction.condition, src_ref, additionalTriggerData);
            txt = txt.replace(/you is/g, "you are");
            txt = txt.replace(/you does/g, "you do");
            return `${txt}.`;
        } else {
            return getPromptMessage(restriction);
        }
    }
    
    async function getPromptMessageRestrictionCondition(condition, src_ref, additionalTriggerData, inverted = false) {
        switch(condition.type) {
            default:
                return "";
            case "comparison":
                const first = getPromptMessageRestrictionConditionValue(condition.first);
                const second = getPromptMessageRestrictionConditionValue(condition.second);
                switch(condition.subtype) {
                    default:
                        return "";
                    case "equal":
                        return !inverted ? `${first} is __not__ the same as ${second}, but should be.` : `${first} is the same as ${second}, but should __not__ be`;
                    case "less_than":
                        return !inverted ? `${first} is __not__ less than ${second}, but should be.` : `${first} is less than ${second}, but should __not__ be`;
                    case "greater_than":
                        return !inverted ? `${first} is __not__ greater than ${second}, but should be.` : `${first} is greater than ${second}, but should __not__ be`;
                    case "not_equal":
                        return !inverted ? `${first} is the same as ${second}, but should __not__ be.` : `${first} is __not__ the same as ${second}, but should be`;
                }
            case "logic":
                switch(condition.subtype) {
                    default:
                        return "";
                    case "not":
                        let cond = getPromptMessageRestrictionCondition(condition.condition, src_ref, additionalTriggerData, true);
                        return cond;
                    case "and":
                    case "or":
                        let cond1 = await resolveCondition(condition.condition1, src_ref, additionalTriggerData);
                        let cond2 = await resolveCondition(condition.condition2, src_ref, additionalTriggerData);
                        let cond1Text = getPromptMessageRestrictionCondition(condition.condition1, src_ref, additionalTriggerData);
                        let cond2Text = getPromptMessageRestrictionCondition(condition.condition2, src_ref, additionalTriggerData);
                        if(!cond1 && cond2) return cond1Text
                        else if(cond1 && !cond2) return cond2Text;
                        return !inverted ? `${cond1Text} ${condition.subtype} ${cond2Text}` : `not (${cond1Text} ${condition.subtype} ${cond2Text})`;
                }
            case "existence":
                let sel = getPromptMessageRestrictionConditionValue(condition.target);
                return !inverted ? `${sel} does __exist__` : `${sel} does exist, but should __not__`;
            case "attribute":
                let atar = getPromptMessageRestrictionConditionValue(condition.target);
                let attr = getPromptMessageRestrictionConditionValue(condition.attribute);
                return !inverted ? `${atar} does __not__ have ${attr}` : `${atar} does have ${attr}, but should __not__`;
            case "selector":
                let sel1 = getPromptMessageRestrictionConditionValue(condition.target);
                let sel2 = getPromptMessageRestrictionConditionValue(condition.selector);
                return !inverted ? `${sel1} is not part of ${sel2}` : `${sel1} ist part of ${sel2}, but should __not__ be`;
            case "membership":
                let sel1b = getPromptMessageRestrictionConditionValue(condition.target);
                let sel2b = getPromptMessageRestrictionConditionValue(condition.group);
                return !inverted ? `${sel1b} is __not__ part of ${sel2b}` : `${sel1b} ist part of ${sel2b}, but should __not__ be`;
        }
    }
    
    function getPromptMessageRestrictionConditionValue(selector) {
        let val = selectorGetTarget(selector);
        let type = selectorGetType(selector);
        switch(val) {
            case "@selection":
            case "@secondaryselection":
                return type === "unknown" ? "the selected value" : `the selected ${type}`;
            case "@target":
                return `your target`;
            case "@self":
                return `you`;
            default:
                val = val.replace(/[#&@]+\^/g, "");
                if(val.indexOf(":") >= 0) return val;
                return srcRefToText(`${type}:${val}`);
        }
    }
    
    /** 
    Create Prompt
    creates a new prompt in the prompt table
    **/
    this.createPrompt = async function(mid, cid, src_ref, src_name, abilities, restrictions, additionalTriggerData, prompt_type, amount, forced, triggerName, type1, type2 = "none") {
        await new Promise(res => {
            sql("INSERT INTO prompts (message_id,channel_id,src_ref,src_name,abilities,type1,type2,prompt_type,restrictions,additional_trigger_data,amount,forced,trigger_name) VALUES (" + connection.escape(mid) + "," + connection.escape(cid) + "," + connection.escape(src_ref) + "," + connection.escape(src_name) + "," + connection.escape(JSON.stringify(abilities)) + "," + connection.escape(type1.toLowerCase()) + "," + connection.escape(type2.toLowerCase()) + "," + connection.escape(prompt_type) + "," + connection.escape(JSON.stringify(restrictions)) + "," + connection.escape(JSON.stringify(additionalTriggerData)) + "," + amount + "," + connection.escape(forced) + "," + connection.escape(triggerName) + ")", result => {
                res();
            });            
        });
    }
    
    /**
    Check for Prompts
    iterates through all values of an ability object to check if any contain a @Selection in which case a prompt is necessary
    **/
     this.getPrompts = function(ability) {
        // iterate through all object values
        let foundSelections = [];
        objRecIterate(ability, (key, property) => {
            // check if its a string type value
            if(typeof property !== "string") return;
            // to lower case
            let val = property.toLowerCase();
            if(val.indexOf("@selection") >= 0) {
                foundSelections.push([key,val,"primary"]);
            } else if(val.indexOf("@secondaryselection") >= 0) {
                foundSelections.push([key,val,"secondary"]);
            } else if(val.indexOf("@chosen") >= 0) {
                foundSelections.push([key,val,"choice"]);
            }
        });
        return foundSelections;
    }
    
    /**
    Clear Prompts
    clears all prompts from the table
    **/
    this.clearPrompts = async function() {
        let promptsToClear = await sqlProm("SELECT * FROM prompts");
        
        // clears last target on unused prompts
        for(let i = 0; i < promptsToClear.length; i++) {
            await clearLastTarget(promptsToClear[i].src_ref, JSON.parse(promptsToClear[i].abilities)[0]);
            
            // get prompt message
            let promptChannel = await mainGuild.channels.fetch(promptsToClear[i].channel_id);
            let promptMessage = await promptChannel.messages.fetch(promptsToClear[i].message_id);
            
            // update message
            let additionalTriggerData = JSON.parse(promptsToClear[i].additional_trigger_data);
            if(!additionalTriggerData.parameters.vanishing) {
                let orig_text = promptMessage.embeds[0].description.split(PROMPT_SPLIT)[0];
                orig_text = orig_text.replace("Please submit your choice as a reply to this message.", "");
                embed = basicEmbed(`${orig_text}*You did not react to the prompt, so the ability was not executed.*`, EMBED_RED);
                embed.components = [];
                promptMessage.edit(embed); 
            } else {
                promptMessage.delete();
            }
            
        }
        
        return sqlProm("DELETE FROM prompts");
    }
    
    /**
    Execute Forced Prompts
    executes all prompts with forced=1 from the table
    **/
    this.executeForcedPrompts = async function() {
        // get all forced prompts
        let promptsToExecute = await sqlProm("SELECT * FROM prompts WHERE forced=1");
        
        // iterate through prompts and convert to actions
        for(let i = 0; i < promptsToExecute.length; i++) {
            // get prompt of current iteration
            let prompt = promptsToExecute[i];
            // get values from prompt
            let abilities = JSON.parse(prompt.abilities);
            const additionalTriggerData = JSON.parse(prompt.additional_trigger_data);
            const forcedSel = additionalTriggerData.parameters?.forced_sel ?? null;
            const src_ref = prompt.src_ref;
            
            // get type and action count
            const type1 = prompt.type1;
            const type2 = prompt.type2;
            const actionCount = prompt.amount;
            const promptType = prompt.prompt_type;
            
            // get prompt message
            let promptChannel = await mainGuild.channels.fetch(prompt.channel_id);
            let promptMessage = await promptChannel.messages.fetch(prompt.message_id);
            
            // prentend reply to prompt
            let repl_msg, selection1, selection2;
            // if specific forced selection is set
            if(forcedSel) {
                let parsed = await parseSelector(forcedSel, src_ref, additionalTriggerData);
                selection1 = parsePromptReply(parsed.value[0], type1);
                selection2 = null;
                repl_msg = await sendPromptReplyConfirmMessage(promptMessage, promptType, `You did not submit a target, but the action is forced. The following target was selected: ${selection1[0]}` + PROMPT_SPLIT, true); 
            } else { // random selection
                selection1 = await randomPromptReply(type1);
                if(type2 != "none") selection2 = await randomPromptReply(type2);
                if(type2 === "none") repl_msg = await sendPromptReplyConfirmMessage(promptMessage, promptType, `You did not submit a target, but the action is forced. A random target is selected: ${selection1[0]}` + PROMPT_SPLIT, true); 
                else repl_msg = await sendPromptReplyConfirmMessage(promptMessage, promptType, `You did not submit a target, but the action is forced. A random target is selected: ${selection1[0]} and ${selection2[0]}` + PROMPT_SPLIT, true); 
            }
            
            // queue action to past to instantly execute
            const exeTime = getTime() - 1;
            
            // apply values
            let clonedAbilities = deepCopy(abilities);
            for(let j = 0; j < clonedAbilities.length; j++) {
                clonedAbilities[j] = applyPromptValue(clonedAbilities[j], 0, selection1[1]);
                if(type2 != "none") clonedAbilities[j] = applyPromptValue(clonedAbilities[j], 1, selection2[1]);
            }
            
            // create several actions if necessary
            for(let j = 0; j < actionCount; j++) {
                await createAction(repl_msg.id, repl_msg.channel.id, src_ref, prompt.src_name, clonedAbilities, abilities, promptType, type1, type2, exeTime, JSON.parse(prompt.restrictions), additionalTriggerData, selection1[1], prompt.forced, prompt.trigger_name);
            }
        }
        
        // execute actions immediately
        if(promptsToExecute.length > 0) {
            skipActionQueueChecker = true;
            await actionQueueChecker();
            skipActionQueueChecker = false;
        }
               
    }
    
    /**
    Get Prompt by prompt message id
    retrieves a prompt
    **/
    async function getPrompt(id) {
        return new Promise(res => {
            sql("SELECT * FROM prompts WHERE message_id=" + connection.escape(id), result => {
                res(result.length > 0 ? result[0] : false);
            });
        });
    }
    
    /**
    Check if message is prompt
    **/
    this.isPrompt = async function(id) {
        let prompt = await getPrompt(id);
        return prompt !== false;  // return true if prompt is found, false otherwise
    }
    
        
    /**
    Deletes a Prompt by prompt message id
    **/
    function deletePrompt(id) {
        return sqlPromEsc("DELETE FROM prompts WHERE message_id=", id);
    }
    
    /**
    Get Action by action queue message id
    retrieves a prompt
    **/
    this.getAction = async function(id) {
        return new Promise(res => {
            sql("SELECT * FROM action_queue WHERE message_id=" + connection.escape(id), result => {
                res(result.length > 0 ? result : false);
            });
        });
    }
        
    /**
    Deletes a Queued Action by message id
    **/
    this.deleteQueuedAction = function(id) {
        return sqlPromEsc("DELETE FROM action_queue WHERE message_id=", id);
    }
    
    /**
    Sets the execution time of a queued action to the past, immediately executing it on the next check
    **/
    this.instantQueuedAction = function(id) {
        return sqlPromEsc("UPDATE action_queue SET execute_time=" + connection.escape(getTime() - 1) + " WHERE message_id=", id);
    }
    
    /**
    Sets the execution time of a queued action to max int, delaying it until max delayed actions are manually executed
    **/
    this.delayQueuedAction = function(id) {
        return sqlPromEsc("UPDATE action_queue SET execute_time=" + delayedActionTime + " WHERE message_id=", id);
    }
    
    /**
    Sets the execution time of a queued action to max int, delaying it until end confirmed actions are manually executed
    **/
    this.endConfirmQueuedAction = function(id) {
        return sqlPromEsc("UPDATE action_queue SET execute_time=" + endActionTime + " WHERE message_id=", id);
    }
    
    /**
    Sets the execution time of all delayed queued action to the past, executing them all on the next check
    **/
    this.executeDelayedQueuedAction = function() {
        return sqlProm("UPDATE action_queue SET execute_time=" + connection.escape(getTime() - 1) + " WHERE execute_time=" + delayedActionTime);
    }
    
    /**
    Sets the execution time of all end queued action to the past, executing them all on the next check
    **/
    this.executeEndQueuedAction = function(triggerName) {
        return sqlProm("UPDATE action_queue SET execute_time=" + connection.escape(getTime() - 1) + " WHERE execute_time=" + endActionTime + " AND trigger_name=" + connection.escape(triggerName));
    }
    
    /**
    Clear all queued action that are set to be never run
    **/
    this.clearNeverQueuedAction = async function() {
        // retrieve all queued actions that need to be cleared
        let actionsToClear = await sqlPromEsc("SELECT * FROM action_queue WHERE execute_time=", neverActionTime);
        
        // update prompts
        for(let i = 0; i < actionsToClear.length; i++) {
            let curAction = actionsToClear[i];
            // get prompt
            let promptChannel = await mainGuild.channels.fetch(curAction.channel_id);
            let promptMessage = await promptChannel.messages.fetch(curAction.message_id);
            
            // update message
            let additionalTriggerData = JSON.parse(curAction.additional_trigger_data);
            if(!additionalTriggerData.parameters.vanishing) {
                let orig_text = promptMessage.embeds[0].description.split(PROMPT_SPLIT)[0];
                embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Ability was __not__ executed.`, EMBED_RED);
                embed.components = [];
                promptMessage.edit(embed); 
            } else {
                promptMessage.delete();
            }
        }
        
        // delete queued actions
        return sqlProm("DELETE FROM action_queue WHERE execute_time=" + neverActionTime);
    }
    
    /**
    Apply Prompt value
    applies a prompt replies value onto a prompt
    **/
    function applyPromptValue(ability, promptIndex, promptValue) {
        // iterate through all object values
        objRecReplace(ability, (key, property) => {
            // check if its a string type value
            if(typeof property !== "string") return property;
            // to lower case
            let val = property.toLowerCase();
            // in property access -> dont type annotate
            let notTyped = promptValue.replace(/\[.+\]/, "");
            if(val.indexOf("@selection->") >= 0 && promptIndex == 0) {
                return property.replace(/@[sS]election/g, notTyped);
            } else if(val.indexOf("@secondaryselection->") >= 0 && promptIndex == 1) {
                return val.replace(/@[sS]econdary[sS]election/g, notTyped);
            }
            // normal
            if(val.indexOf("@selection") >= 0 && promptIndex == 0) {
                return property.replace(/@[sS]election(\[\w+\])?/g, promptValue);
            } else if(val.indexOf("@secondaryselection") >= 0 && promptIndex == 1) {
                return val.replace(/@[sS]econdary[sS]election(\[\w+\])?/g, promptValue);
            }
            // default
            return property;
        });
        return ability;
    }
    
    /**
    Create Queued Action
    creates an action in the action queue which will be executed at a specified time
    **/
    this.createAction = async function (mid, cid, src_ref, src_name, abilities, orig_ability, prompt_type, type1, type2, time, restrictions, additionalTriggerData, target, forced, triggerName) {
        await new Promise(res => {
            sql("INSERT INTO action_queue (message_id,channel_id,src_ref,src_name,abilities,orig_ability,type1,type2,execute_time, prompt_type, restrictions, target, additional_trigger_data, forced,trigger_name) VALUES (" + connection.escape(mid) + "," + connection.escape(cid) + "," + connection.escape(src_ref) + "," + connection.escape(src_name) + "," + connection.escape(JSON.stringify(abilities)) + "," + connection.escape(JSON.stringify(orig_ability)) + "," + connection.escape(type1) + "," + connection.escape(type2) + "," + connection.escape(time) + "," + connection.escape(prompt_type) + "," + connection.escape(JSON.stringify(restrictions)) + "," + connection.escape(target) + "," + connection.escape(JSON.stringify(additionalTriggerData)) + "," + connection.escape(forced) + "," + connection.escape(triggerName) + ")", result => {
                res();
            });            
        });
    }
    
    /**
    Action Queue Checker / Creator
    checks the action queue every 10 seconds to see if an action should be executed
    **/
    this.skipActionQueueChecker = false;
    this.pauseActionQueueChecker = false;
    this.storytimeCheckScheduled = false;
    this.killqScheduled = false;
    this.createActionQueueChecker =  function() {
        setInterval(async () => {
            if(stats.gamephase != gp.INGAME) return;
            if(skipActionQueueChecker || pauseActionQueueChecker) return;
            if(killqScheduled) {
                await killqKillall();
                killqScheduled = false;
            }
            if(storytimeCheckScheduled) {
                await postStorytimeImmediate();
                storytimeCheckScheduled = false
            }
            let count = await actionQueueChecker();
            // process emitted triggers; this needs to be past anything else in case a new choice is generated inside from another choice
            await processEmitQueue();
            // check for wins after immediate abilities outside of phase change
            if(count > 0 && !skipActionQueueChecker && !pauseActionQueueChecker) {
                await updateActiveTeams();
            }
        }, 10 * 1000)
    }
    
    this.doStorytimeCheck = function() {
        storytimeCheckScheduled = true;
    }
    
    this.actionQueueChecker = async function () {
        // retrieve all queued actions that need to be executed
        let actionsToExecute = await sqlPromEsc("SELECT * FROM action_queue WHERE execute_time<=", getTime());
        // iterate through them and execute them
        for(let i = 0; i < actionsToExecute.length; i++) {
            // current action
            let curAction = actionsToExecute[i];
            // delete the queued action entry
            await deleteQueuedAction(curAction.message_id);
            // parse ability
            let abilities = JSON.parse(curAction.abilities);
            // parse restrictions
            let restrictions = JSON.parse(curAction.restrictions);
            // parse additional trigger data
            let additionalTriggerData = JSON.parse(curAction.additional_trigger_data);
            // prepare action data
            let quantity = await getActionQuantity(curAction.src_ref, abilities[0]);
            if(quantity === -1) await initActionData(curAction.src_ref, abilities[0]);
            // action log
            let targetTxt = curAction.target;
            let onTxt = " on ";
            if(targetTxt.substr(0, 3) === "@id") targetTxt = "<@" + targetTxt.substr(4).split("[")[0] + ">";
            switch(selectorGetType(targetTxt)) {
                case "role":
                    targetTxt = `**${toTitleCase(selectorGetTarget(targetTxt))}**`;
                break;
                case "unknown":
                    if(targetTxt === "notarget") {
                        onTxt = "";
                        targetTxt = "";
                    }
                break;
            }
            let abilityType = abilities[0].type;
            let abilityTypeText = srcRefToText('abilitytype:' + abilities[0].type);
            if(abilityType === "process_evaluate") {
                abilityTypeText = "**P/E**";
                if(abilities[0].process?.sub_abilities && abilities[0].process.sub_abilities[0]) abilityTypeText += " " + srcRefToText('abilitytype:' + abilities[0].process.sub_abilities[0].ability.type);
                if(abilities[0].evaluate?.sub_abilities && abilities[0].evaluate.sub_abilities[0]) abilityTypeText += " **⇒** " + srcRefToText('abilitytype:' + abilities[0].evaluate.sub_abilities[0].ability.type);
            }
            actionLog(`✅ ${srcRefToText(curAction.src_ref)} (${srcNameToText(curAction.src_name)}) used a ${abilityTypeText} action${onTxt}${targetTxt}.`);
            // execute the ability
            let feedback = [];
            let doNotRecheckRestriction = false;
            for(let ability of abilities) {
                let fed = await executeAbility(curAction.src_ref, curAction.src_name, ability, restrictions, additionalTriggerData, doNotRecheckRestriction);
                if(fed) doNotRecheckRestriction = true;
                if(fed && fed.msg) feedback.push(fed);
            }
            // send feedback
            feedback.forEach(el => {
                abilitySend(curAction.src_ref, el.msg, EMBED_GREEN);
            });
            // confirm automatic execution
            confirmAutoExecution(curAction.src_ref, curAction.message_id);
            // save last target (after potentially re-evaluating restrictions)
            await setLastTarget(curAction.src_ref, abilities[0], curAction.target);
            // clear prompt
            // get prompt
            let promptChannel = await mainGuild.channels.fetch(curAction.channel_id);
            let promptMessage = await promptChannel.messages.fetch(curAction.message_id);
            let orig_text = promptMessage.embeds[0].description.split(PROMPT_SPLIT)[0];
            // update message
            embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} Ability executed.`, EMBED_GREEN);
            embed.components = [];
            promptMessage.edit(embed); 
        }
        
        return actionsToExecute.length;
    }
    
    /**
    Handle Prompt Reply
    takes a message as an input that is a reply to a bot prompt
    **/
    this.handlePromptReply = async function(message) {
        if(subphaseIsLocked()) {
            message.reply(basicEmbed("❌ You can no longer submit actions in this phase.", EMBED_RED));
            return;
        }
        // load prompt from DB
        let prompt = await getPrompt(message.reference.messageId);
        // get values from prompt
        let abilities = JSON.parse(prompt.abilities);
        let restrictions = JSON.parse(prompt.restrictions);
        let additionalTriggerData = JSON.parse(prompt.additional_trigger_data);
        let src_name = prompt.src_name;
        let src_ref = prompt.src_ref;
        const forced = prompt.forced;
        
        // get type and action count
        const type1 = prompt.type1;
        const type2 = prompt.type2;
        const actionCount = prompt.amount;
        const promptType = prompt.prompt_type;
        
        // get replies
        const replies = message.content.trim().split("\n");
        
        // check if replies matches action count
        if(replies.length != actionCount) {
            let embed = basicEmbed(`You cannot execute this ability. You submitted \`${replies.length}\` choice(s), but expected \`${actionCount}\` choice(s). Please reply again to the original prompt with a valid submission.`, EMBED_RED);
            message.reply(embed);
            return;      
        }
        
        // store parsed replies
        let parsedReplies = [];
        // store prompt applied abilities
        let promptAppliedAbilities = [];
        // store prompt reply messages
        let promptReplyMessages = [];
        
        // iterate through replies - for restrictions and prompt reply validation
        for(let i = 0; i < replies.length; i++) {
            let clonedAbilities = deepCopy(abilities);
            // check which type of prompt
            if(type2 == "none") { // single reply needed
                let reply = replies[i].trim();
                let parsedReply = parsePromptReply(reply, type1, message);
                // reply received
                if(parsedReply !== false) {
                    // save parsed reply
                    parsedReplies.push(parsedReply);
                    // apply prompt reply onto ability
                    for(let j = 0; j < clonedAbilities.length; j++) {
                        clonedAbilities[j] = applyPromptValue(clonedAbilities[j], 0, parsedReply[1]);
                    }
                    let promptAppliedAbility = clonedAbilities;
                    // save prompt applied ability reply
                    promptAppliedAbilities.push(promptAppliedAbility);
                    // check restrictions again
                    additionalTriggerData.selection = parsedReply[1];
                    additionalTriggerData.selection_type = type1;
                    for(let i = 0; i < restrictions.length; i++) {
                        let passed = await handleRestriction(src_ref, promptAppliedAbility[0], restrictions[i], RESTR_POST, parsedReply[1], additionalTriggerData);
                        if(!passed) {
                            let msg = await getPromptMessageRestriction(restrictions[i], src_ref, additionalTriggerData);
                            let embed = basicEmbed(`You cannot execute this ability due to a restriction: ${msg}`, EMBED_RED);
                            message.reply(embed);
                            return;
                        }
                    }
                    // store prompt reply message
                    promptReplyMessages.push(`${parsedReply[0]}`);
                    // log prompt reply
                    abilityLog(`✅ **Prompt Reply:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) submitted ${parsedReply[0]}.`);
                } else { // invalid prompt reply
                    return;
                }
            } else { // two replies needed
                let reply = replies[i].split(";");
                let parsedReply1, parsedReply2;
                if(reply.length > 2) { // too many replies
                    message.reply(basicEmbed("❌ You must specify exactly two arguments, separated by `;`.", EMBED_RED));
                    return;
                } else if(reply.length == 2) { // two replies
                    let reply1 = reply[0].trim();
                    let reply2 = reply[1].trim();
                    parsedReply1 = parsePromptReply(reply1, type1, message);
                    parsedReply2 = parsePromptReply(reply2, type2, message);
                } else { // one reply, attempt to parse
                    parsedReply1 = parsePromptReply(reply[0], type1, message);
                    parsedReply2 = parsePromptReply(reply[0], type2, message, true);
                    if(parsedReply1 === false || parsedReply2 === false) {
                        message.reply(basicEmbed("❌ Attempted to parse submission, but could not find the arguments. You must specify exactly two arguments, separated by `;`.", EMBED_RED));
                        return;       
                    }
                }
                // reply received
                if(parsedReply1 !== false && parsedReply2 !== false) {
                    // save parsed reply
                    parsedReplies.push(parsedReply1);
                    // apply prompt reply onto ability
                    for(let j = 0; j < clonedAbilities.length; j++) {
                        clonedAbilities[j] = applyPromptValue(clonedAbilities[j], 0, parsedReply1[1]);
                        clonedAbilities[j] = applyPromptValue(clonedAbilities[j], 1, parsedReply2[1]);
                    }
                    promptAppliedAbility = clonedAbilities
                    // save prompt applied ability reply
                    promptAppliedAbilities.push(promptAppliedAbility);
                    // check restrictions again
                    additionalTriggerData.selection = parsedReply1[1];
                    additionalTriggerData.selection_type = type1;
                    additionalTriggerData.secondaryselection = parsedReply2[1];
                    additionalTriggerData.secondaryselection_type = type2;
                    for(let i = 0; i < restrictions.length; i++) {
                        let passed = await handleRestriction(src_ref, promptAppliedAbility[0], restrictions[i], RESTR_POST, parsedReply1[1], additionalTriggerData);
                        if(!passed) {
                            let msg = await getPromptMessageRestriction(restrictions[i], src_ref, additionalTriggerData);
                            let embed = basicEmbed(`You cannot execute this ability due to a restriction: ${msg}`, EMBED_RED);
                            message.reply(embed);
                            return;
                        }
                    }
                    // store prompt reply message
                    promptReplyMessages.push(`${parsedReply1[0]} and ${parsedReply2[0]}`);
                    // log prompt reply
                    abilityLog(`✅ **Prompt Reply:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) submitted ${parsedReply1[0]}\and ${parsedReply2[0]}.`);
                } else { // invalid prompt reply
                    return;
                }
            }
        }
        
        // now that execution is locked in, delete prompt
        await deletePrompt(message.reference.messageId);
        
        // reply to prompt
        let repl_msg = await sendPromptReplyConfirmMessage(message, promptType, "You submitted: " + promptReplyMessages.join(", ") + PROMPT_SPLIT); 
        // queue action
        const exeTime = promptType == "immediate" ? getTime() + 60 : endActionTime;
        
        // iterate through replies - for execution
        for(let i = 0; i < replies.length; i++) {
            // schedule actions
            await createAction(repl_msg.id, repl_msg.channel.id, src_ref, src_name, promptAppliedAbilities[i], abilities, promptType, type1, type2, exeTime, restrictions, additionalTriggerData, parsedReplies[i][1], forced, prompt.trigger_name);
        }
        
        
    }
    
    /**
    Sends a reply message to a prompt reply with reactions
    **/
    async function sendPromptReplyConfirmMessage(message, prompt_type, txt, hideButtons = false) {
        // reply message with buttons
        let options = "confirm, cancel or delay";
        if(!subphaseIsMain()) options = "confirm or cancel";
        let msg;
        if(prompt_type == "immediate") msg = basicEmbed(`${txt} You may ${options} the ability, otherwise it will be automatically executed in \`1\` minute.`, EMBED_YELLOW);
        else msg = basicEmbed(`${txt} You may cancel the ability to change selection, otherwise it will be automatically executed at the end of the phase.`, EMBED_YELLOW);
        // create buttons
        let confirmButton = { type: 2, label: "Confirm", style: 3, custom_id: "confirm" };
        let cancelButton = { type: 2, label: "Cancel", style: 4, custom_id: "cancel" };
        let delayButton = { type: 2, label: "Delay", style: 2, custom_id: "delay" };
        msg.components = [ { type: 1, components: [ confirmButton, cancelButton ] } ];
        if(subphaseIsMain()) msg.components[0].components.push(delayButton);
        if(prompt_type == "end") msg.components[0].components = [ cancelButton ];
        if(hideButtons) msg.components = [ ];
        // send reply
        let repl_msg = await message.reply(msg);
        return repl_msg;
    }
    
    /**
    Sends special yes/no prompt
    **/
    this.sendSelectionlessPrompt = async function (src_ref, prompt_type, txt, color = EMBED_GRAY, ping = false, footer = false, thumbnail = null, title = null) {
        // reply message with buttons
        let options = "confirm or delay";
        if(!subphaseIsMain()) options = "confirm";
        let msg;
        if(prompt_type === "immediate") msg = basicEmbed(`${txt} You may ${options} the ability, otherwise it will __not__ be executed.`, color);
        else msg = basicEmbed(`${txt} You may confirm the ability to execute it at the end of the phase, otherwise it will __not__ be executed.`, color);
        // create buttons
        let confirmButton = { type: 2, label: "Confirm", style: 3, custom_id: "confirm" };
        let confirmEndButton = { type: 2, label: "Confirm", style: 3, custom_id: "confirm-end" };
        let delayButton = { type: 2, label: "Delay", style: 2, custom_id: "delay-selectionless" };
        msg.components = [ { type: 1, components: [ confirmButton ] } ];
        if(subphaseIsMain() && prompt_type === "immediate") msg.components[0].components.push(delayButton);
        else if(prompt_type === "end") msg.components = [ { type: 1, components: [ confirmEndButton ] } ];
        // additional embed options
        if(ping) msg.content =  `<@&${stats.participant}>`; // add ping
        if(footer) msg.embeds[0].footer = { text: footer }; // add footer
        if(thumbnail) msg.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
        if(title) msg.embeds[0].title = title; // add title
        // send prompt
        let channel_id = await getSrcRefChannel(src_ref);
        let channel = mainGuild.channels.cache.get(channel_id);
        if(!channel) {
                abilityLog(`❗ **Error:** Cannot find channel for ${srcRefToText(src_ref)}!`);
            channel = mainGuild.channels.cache.get(backupChannelId);
        }
        let repl_msg = await channel.send(msg);
        return repl_msg;
    }
    
    this.cmdParsePrompt = function(message, args, argsX) {
        let typ = argsX.shift();
        let parsed = parsePromptReply(argsX.join(" "), typ, message);
        message.channel.send(`✅ Parsed Prompt: ${parsed[0]}; ${parsed[1]}`);
    }
    
    /**
    Parses an argument of a prompt reply
    Returns an array of type [displayValue, actualValue]
    **/
    function parsePromptReply(text, type, message = null, reverse = false) {
        if(reverse) text = text.split(" ").reverse().join(" "); // invert so a second reply is searched for from end if necessary
        switch(type) {
            case "player": {
                let player = parsePlayerReply(text, message);
                if(player === false) {
                    if(message) message.reply(basicEmbed("❌ You must specify a valid player.", EMBED_RED));
                    return false;
                }
                return player;
            }
            case "dead": {
                let player = parseDeadReply(text, message);
                if(player === false) {
                    if(message) message.reply(basicEmbed("❌ You must specify a valid dead player.", EMBED_RED));
                    return false;
                }
                return player;
            }
            case "role": {
                let role = parseRoleReply(text, message);
                if(role === false) {
                    if(message) message.reply(basicEmbed("❌ You must specify a valid role.", EMBED_RED));
                    return false;
                }
                role[1] = role[1].replace(/ /g, "-");
                return role;
            }
            case "boolean": {
                let bool = parseBooleanReply(text, message);
                if(bool === false) {
                    if(message) message.reply(basicEmbed("❌ You must specify either yes or no.", EMBED_RED));
                    return false;
                }
                return bool;
            }
            case "number": {
                let num = parseNumberReply(text, message);
                if(num === false) {
                    if(message) message.reply(basicEmbed("❌ You must specify a valid number.", EMBED_RED));
                    return false;
                }
                return num;
            }
            default: {
                if(message) message.reply(basicEmbed("❌ Invalid prompt type. Contact Hosts immediately.", EMBED_RED));
                return false;
            }
        }
    }
    
    /**
   Returns a random prompt reply 
    Returns an array of type [displayValue, actualValue]
    **/
    async function randomPromptReply(type) {
        switch(type) {
            case "player": {
                let ids = await getAllLivingIDs();
                let randomId = ids[Math.floor(Math.random() * ids.length)];
                let player = parsePlayerReply(randomId);
                return player;
            }
            case "dead": {
                let ids = await getAllDeadIDs();
                let randomId = ids[Math.floor(Math.random() * ids.length)];
                let player = parseDeadReply(randomId);
                return player;
            }
            case "role": {
                let roles = await sqlProm("SELECT name FROM roles");
                let randomRole = roles[Math.floor(Math.random() * roles.length)];
                let role = parseRoleReply(randomRole.name);
                role[1] = role[1].replace(/ /g, "-");
                return role;
            }
            case "boolean": {
                let boolRand = Math.floor(Math.random() * 2);
                let bool = parseBooleanReply(["true","false"][boolRand]);
                return bool;
            }
            case "number": {
                let numRand = Math.floor(Math.random() * 11) - 5;
                let num = parseNumberReply(numRand);
                return num;
            }
            default: {
                abilityLog(`❗ **Error:** Unknown random prompt reply type \`${type}\`!`);
                return false;
            }
        }
    }
    
    /**
    Parses an argument of type player in a prompt reply
    **/
    function parsePlayerReply(playerName, message = null) {
        // check for basic player references
        let pSplit = playerName.toLowerCase().split(/[\.,\-!\?\s ]/);
        let basic = pSplit.map(el => getUser(el)).filter(el => el);
        console.log("BASIC", pSplit, basic);
        if(basic.length > 0) {
            let member = mainGuild.members.cache.get(basic[0]);
            if(!member) { // this applies in case the player has left the server
                if(message) message.reply(basicEmbed("❌ Player valid but cannot be found. Please contact Hosts.", EMBED_RED));
                return false;
            }
            if(!isParticipant(member)) { // this applies in case the player is not a participant
                if(message) message.reply(basicEmbed("❌ Player is not a participant.", EMBED_RED));
                return false;
            }
            let pname = member?.displayName ?? false; // get name through id
            let pname2 = member?.user.displayName ?? false; // get name through id
            return [`${idToEmoji(basic[0])} \`${pname} (${pname2})\``, `@id:${basic[0]}[player]`]; // return display name
        }
        
        // more advanced search
        // similiar as implementation in fixUserList()
		let allPlayerNames = playerIDs.map(el => {
            let mem = mainGuild.members.cache.get(el);
            let usr = client.users.cache.get(el);
            if(!mem || !usr) return null;
            //console.log(usr);
            return [usr.username,usr.globalName,mem.nickname];
        }).flat().filter(el => el).map(el => el.toLowerCase());
        //console.log(allPlayerNames);
        // check provided player name against all player names
		let parsed = parseList(pSplit, allPlayerNames);
        console.log("PARSED", parsed.found, parsed.invalid);
        if(parsed.found.length == 0) { // no player found -> false
            return false;
        } else { // player found -> normalize to player.displayName
            let player = parsed.found[0];
            let parsedPlayer = parseUser(player); // parse player name/id/emoji to discord id
            let member = mainGuild.members.cache.get(parsedPlayer);
            let playerName = member?.displayName ?? false; // get name through id
            let playerName2 = member?.user.displayName ?? false; // get name through id
            if(playerName === false) { // this applies in case the player has left the server
                if(message) message.reply(basicEmbed("❌ Player valid but cannot be found. Please contact Hosts.", EMBED_RED));
                return false;
            }
            if(!isParticipant(member)) { // this applies in case the player is not a participant
                if(message) message.reply(basicEmbed("❌ Player is not a participant.", EMBED_RED));
                return false;
            }
            return [`${idToEmoji(parsedPlayer)} \`${playerName} (${playerName2})\``, `@id:${parsedPlayer}[player]`]; // return display name
        }
    }
    
    /**
    Parses an argument of type dead prompt reply
    **/
    function parseDeadReply(playerName, message = null) {
        // check for basic player references
        let pSplit = playerName.toLowerCase().split(/[\.,\-!\?\s ]/);
        let basic = pSplit.map(el => getUser(el)).filter(el => el);
        console.log("BASIC", pSplit, basic);
        if(basic.length > 0) {
            let member = mainGuild.members.cache.get(basic[0]);
            if(!member) { // this applies in case the player has left the server
                if(message) message.reply(basicEmbed("❌ Player valid but cannot be found. Please contact Hosts.", EMBED_RED));
                return false;
            }
            if(!isDeadParticipant(member)) { // this applies in case the player is not a participant
                if(message) message.reply(basicEmbed("❌ Player is not a dead participant.", EMBED_RED));
                return false;
            }
            let pname = member?.displayName ?? false; // get name through id
            let pname2 = member?.user.displayName ?? false; // get name through id
            return [`${idToEmoji(basic[0])} \`${pname} (${pname2})\``, `@id:${basic[0]}[player]`]; // return display name
        }
        
        // more advanced search
        // similiar as implementation in fixUserList()
		let allPlayerNames = playerIDs.map(el => {
            let mem = mainGuild.members.cache.get(el);
            let usr = client.users.cache.get(el);
            if(!mem || !usr) return null;
            //console.log(usr);
            return [usr.username,usr.globalName,mem.nickname];
        }).flat().filter(el => el).map(el => el.toLowerCase());
        //console.log(allPlayerNames);
        // check provided player name against all player names
		let parsed = parseList(pSplit, allPlayerNames);
        console.log("PARSED", parsed.found, parsed.invalid);
        if(parsed.found.length == 0) { // no player found -> false
            return false;
        } else { // player found -> normalize to player.displayName
            let player = parsed.found[0];
            let parsedPlayer = parseUser(player); // parse player name/id/emoji to discord id
            let member = mainGuild.members.cache.get(parsedPlayer);
            let playerName = member?.displayName ?? false; // get name through id
            let playerName2 = member?.user.displayName ?? false; // get name through id
            if(playerName === false) { // this applies in case the player has left the server
                if(message) message.reply(basicEmbed("❌ Player valid but cannot be found. Please contact Hosts.", EMBED_RED));
                return false;
            }
            if(!isDeadParticipant(member)) { // this applies in case the player is not a participant
                if(message) message.reply(basicEmbed("❌ Player is not a dead participant.", EMBED_RED));
                return false;
            }
            return [`${idToEmoji(parsedPlayer)} \`${playerName} (${playerName2})\``, `@id:${parsedPlayer}[player]`]; // return display name
        }
    }
    
    /**
    Parses an argument of type role in a prompt reply
    **/
    function parseRoleReply(roleName, message = null) {
        let parsedRole = parseRole(roleName);
        if(verifyRole(parsedRole)) { // direct role
            return [`\`${toTitleCase(parsedRole)}\``, `${parsedRole}[role]`];
        } else {
            let rSplit = roleName.toLowerCase().split(/[\.,\-!\?\s ]/).filter(el => !el.match(/^\d+$/));
            let parsedRoles;
            // search for three word roles
            parsedRoles = rSplit.map((el,ind,arr) => parseRole(el + " " + (arr[ind + 1] ?? "") + " " + (arr[ind + 2] ?? ""))).filter(el => verifyRole(el));
            if(parsedRoles.length > 0) return [`\`${toTitleCase(parsedRoles[0])}\``, `${parsedRoles[0]}[role]`];
            // search for two word roles
            parsedRoles = rSplit.map((el,ind,arr) => parseRole(el + " " + (arr[ind + 1] ?? ""))).filter(el => verifyRole(el));
            if(parsedRoles.length > 0) return [`\`${toTitleCase(parsedRoles[0])}\``, `${parsedRoles[0]}[role]`];
            // search for single word roles
            parsedRoles = rSplit.map(el => parseRole(el)).filter(el => verifyRole(el));
            if(parsedRoles.length > 0) return [`\`${toTitleCase(parsedRoles[0])}\``, `${parsedRoles[0]}[role]`];
            
            // advanced searching
            let parsed = parseList(rSplit, [ cachedRoles, cachedAliases.map(el => el.alias).filter(el => el.length > 5) ].flat() );
            console.log("RParsed", parsed);
            if(parsed.found.length == 0) { // no roles found -> false
                let parsedAlias = parseList(rSplit, cachedAliases.map(el => el.alias).filter(el => el.length > 2) );
                console.log("RAParsed", parsed);
                if(parsedAlias.found.length == 0) return false;
                let role = parseRole(parsedAlias.found[0]);
                return [`\`${toTitleCase(role)}\``, `${role}[role]`];
            } else { // role found -> normalize to player.displayName
                let role = parseRole(parsed.found[0]);
                return [`\`${toTitleCase(role)}\``, `${role}[role]`];
            }
        }
    }
    
    /**
    Parses an argument of type boolean in a prompt reply
    **/
    function parseBooleanReply(bool, message = null) {
        let boolParsed = bool.toLowerCase().replace(/[^a-z ]+/g,"").trim();
        boolParsed = boolParsed.replace(/(.)\1+/g, "$1"); // remove duplicate consecutive letters
        let trueNames = ["true","yes","yea","ye","yus","yeah","corect","inded","do","alr","yep","yup","ok","confirm","alright","y","reveal","accept","yip","yah"];
        let falseNames = ["false","no","stop","nope","no","nono","incorect","deny","reject","cancel","dont","stop","undo","not","nah","nay","cease","n"];
        
        // search for a yes/no answer
        if(trueNames.includes(boolParsed)) { // check for direct yes match
            return ["\`Yes / Confirm\`","true[boolean]"];
        } else if(falseNames.includes(boolParsed)) { // direct no match
            return ["\`No / Reject\`","false[boolean]"];
        } else { // split by words
            let bSplit = boolParsed.split(" ");
            // count matches
            let yCount = bSplit.filter(el => trueNames.includes(el)).length;
            let nCount = bSplit.filter(el => falseNames.includes(el)).length;
            // check if its one of the two cases
            if(yCount > 0 && yCount > nCount) return ["\`Yes / Confirm\`","true[boolean]"];
            if(nCount > 0 && nCount > yCount) return ["\`No / Reject\`","false[boolean]"];
            else return false;
        }
    }
    
    /**
    Parses an argument of type number in a prompt reply
    **/
    function parseNumberReply(num, message = null) {
        let numParsed = num.toLowerCase().replace(/[^a-z0-9\- ]+/g,"").trim();
        
        let numberNames = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
        let negate = ["minus","negative"];
        
        if(!isNaN(numParsed)) { // direct number
            return [+numParsed, `${+numParsed}[number]`];
        } else {
            let nSplit = numParsed.split(" ");
            
            // check for matches
            for(let i = 0; i < nSplit.length; i++) {
                // number
                if(!isNaN(nSplit[i])) {
                    return [`\`${+nSplit[i]}\``, `${+nSplit[i]}[number]`];
                }
                // number word
                if(numberNames.includes(nSplit[i])) {
                    if(i > 0 && negate.includes(nSplit[i - 1])) { // negated
                        let numNum = numberNames.indexOf(nSplit[i]);
                        return [`\`${-numNum}\``, `${-numNum}[number]`];
                    }
                    let numNum = numberNames.indexOf(nSplit[i]);
                    return [`\`${+numNum}\``, `${+numNum}[number]`];
                }
            }
            
            // not found
            return false;
        }
    }
    
    /**
    Prompt Message Confirm Automatic Execution
    **/
    this.confirmAutoExecution = function(src_ref, message_id) {
        return new Promise(res => {
            sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(src_ref), result => {
                for(let i = 0; i < result.length; i++) {
                    let player_sc_id = result[i].channel_id;
                    let player_sc = mainGuild.channels.cache.get(player_sc_id);
                    let player_sc_msg = player_sc.messages.cache.get(message_id);
                    let orig_text = player_sc_msg.embeds[0].description.split(".")[0];
                    embed = basicEmbed(`${orig_text}. Ability executed.`, EMBED_GREEN);
                    embed.components = [];
                    player_sc_msg.edit(embed);
                }
            });
        });      
    }
}
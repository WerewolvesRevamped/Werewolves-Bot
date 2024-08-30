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
        if(promptOverwrite && prompts[promptOverwrite]) {
            return prompts[promptOverwrite];
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
        const ty1 = `${ty}.1`;
        const ty2 = `${ty}.2`;
        // default prompt
        let promptMsg = `Give ${type1}`;
        if(type2.length > 0) promptMsg += `and ${type2}`;
        promptMsg += ` (\`${ty}${su?'.'+su:''}.${type2===''?'1':'2'}\`)`;
        if(type1.length === 0) promptMsg = `No Give (\`${tysu}\`)`
        // search for prompt in JSON
        if(type1 === "" && ty && su && prompts[tysu]) return prompts[tysu];
        else if(type1 === "" && ty && prompts[ty]) return prompts[ty];
        else if(type2 === "" && ty && su && prompts[tysu1l]) return prompts[tysu1l];
        else if(type2 === "" && ty && su && prompts[tysu1]) return prompts[tysu1];
        else if(type2 === "" && ty && su && prompts[tysu]) return prompts[tysu];
        else if(type2 !== "" && ty && su && prompts[tysu2l]) return prompts[tysu2l];
        else if(type2 !== "" && ty && su && prompts[tysu2]) return prompts[tysu2];
        else if(type2 !== "" && ty && su && prompts[tysu]) return prompts[tysu];
        else if(type2 === "" && ty  && prompts[ty1]) return prompts[ty1];
        else if(type2 === "" && ty  && prompts[ty]) return prompts[ty];
        else if(type2 !== "" && ty  && prompts[ty2]) return prompts[ty2];
        else if(type2 !== "" && ty  && prompts[ty]) return prompts[ty];
        // return default prompt
        return promptMsg;
    }
    
    /** 
    Create Prompt
    creates a new prompt in the prompt table
    **/
    this.createPrompt = async function(mid, src_ref, src_name, ability, restrictions, additionalTriggerData, prompt_type, amount, type1, type2 = "none") {
        await new Promise(res => {
            sql("INSERT INTO prompts (message_id,src_ref,src_name,ability,type1,type2,prompt_type,restrictions,additional_trigger_data,amount) VALUES (" + connection.escape(mid) + "," + connection.escape(src_ref) + "," + connection.escape(src_name) + "," + connection.escape(JSON.stringify(ability)) + "," + connection.escape(type1.toLowerCase()) + "," + connection.escape(type2.toLowerCase()) + "," + connection.escape(prompt_type) + "," + connection.escape(JSON.stringify(restrictions)) + "," + connection.escape(JSON.stringify(additionalTriggerData)) + "," + amount + ")", result => {
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
        Object.keys(ability).forEach(key => {
            let val = ability[key];
            // check if its a string type value
            if(typeof val !== "string") return;
            // to lower case
            val = val.toLowerCase();
            if(val.indexOf("@selection") >= 0 || val.indexOf("@secondaryselection") >= 0) {
                foundSelections.push([key,val]);
            }
        });
        return foundSelections;
    }
    
    /**
    Clear Prompts
    clears all prompts from the table
    **/
    this.clearPrompts = function() {
        return sqlProm("DELETE FROM prompts");
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
    this.executeEndQueuedAction = function() {
        return sqlProm("UPDATE action_queue SET execute_time=" + connection.escape(getTime() - 1) + " WHERE execute_time=" + endActionTime);
    }
    
    /**
    Clear all queued action that are set to be never run
    **/
    this.clearNeverQueuedAction = function() {
        return sqlProm("DELETE FROM action_queue WHERE execute_time=" + neverActionTime);
    }
    
    /**
    Apply Prompt value
    applies a prompt replies value onto a prompt
    **/
    function applyPromptValue(ability, promptIndex, promptValue) {
        // iterate through all object values
        Object.keys(ability).forEach(key => {
            let val = ability[key];
            // check if its a string type value
            if(typeof val !== "string") return;
            // to lower case
            val = val.toLowerCase();
            if(val.indexOf("@selection") >= 0 && promptIndex == 0) {
                ability[key] = promptValue;
            } else if(val.indexOf("@secondaryselection") >= 0 && promptIndex == 1) {
                ability[key] = promptValue;
            }
        });
        return ability;
    }
    
    /**
    Create Queued Action
    creates an action in the action queue which will be executed at a specified time
    **/
    this.createAction = async function (mid, src_ref, src_name, ability, orig_ability, prompt_type, type1, type2, time, restrictions, additionalTriggerData, target) {
        await new Promise(res => {
            sql("INSERT INTO action_queue (message_id,src_ref,src_name,ability,orig_ability,type1,type2,execute_time, prompt_type, restrictions, target, additional_trigger_data) VALUES (" + connection.escape(mid) + "," + connection.escape(src_ref) + "," + connection.escape(src_name) + "," + connection.escape(JSON.stringify(ability)) + "," + connection.escape(JSON.stringify(orig_ability)) + "," + connection.escape(type1) + "," + connection.escape(type2) + "," + connection.escape(time) + "," + connection.escape(prompt_type) + "," + connection.escape(JSON.stringify(restrictions)) + "," + connection.escape(target) + "," + connection.escape(JSON.stringify(additionalTriggerData)) + ")", result => {
                res();
            });            
        });
    }
    
    /**
    Action Queue Checker / Creator
    checks the action queue every 10 seconds to see if an action should be executed
    **/
    this.skipActionQueueChecker = false;
    this.createActionQueueChecker = function() {
        setInterval(() => {
            if(skipActionQueueChecker) return;
            actionQueueChecker();
        }, 10 * 1000)
    }
    
    this.actionQueueChecker = async function () {
        // retrieve all queued actions that need to be executed
        let actionsToExecute = await new Promise(res => {
            sql("SELECT * FROM action_queue WHERE execute_time<=" + connection.escape(getTime()), result => {
                res(result);
            });            
        });
        // iterate through them and execute them
        for(let i = 0; i < actionsToExecute.length; i++) {
            // current action
            let curAction = actionsToExecute[i];
            // delete the queued action entry
            await deleteQueuedAction(curAction.message_id);
            // parse ability
            let ability = JSON.parse(curAction.ability);
            // parse restrictions
            let restrictions = JSON.parse(curAction.restrictions);
            // parse additional trigger data
            let additionalTriggerData = JSON.parse(curAction.additional_trigger_data);
            // save last target
            quantity = await getActionQuantity(curAction.src_ref, ability);
            if(quantity === -1) await initActionData(curAction.src_ref, ability);
            setLastTarget(curAction.src_ref, ability, curAction.target);
            // execute the ability
            let feedback = await executeAbility(curAction.src_ref, curAction.src_name, ability, restrictions, additionalTriggerData);
            // send feedback
            if(feedback && feedback.msg) abilitySend(curAction.src_ref, feedback.msg, EMBED_GREEN);
            // confirm automatic execution
            confirmAutoExecution(curAction.src_ref, curAction.message_id);
        }
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
        let ability = JSON.parse(prompt.ability);
        let restrictions = JSON.parse(prompt.restrictions);
        let additionalTriggerData = JSON.parse(prompt.additional_trigger_data);
        let src_name = prompt.src_name;
        let src_ref = prompt.src_ref;
        
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
            let clonedAbility = JSON.parse(JSON.stringify(ability));
            // check which type of prompt
            if(type2 == "none") { // single reply needed
                let reply = replies[i].trim();
                let parsedReply = parsePromptReply(reply, type1, message);
                // reply received
                if(parsedReply !== false) {
                    // save parsed reply
                    parsedReplies.push(parsedReply);
                    // apply prompt reply onto ability
                    let promptAppliedAbility = applyPromptValue(clonedAbility, 0, parsedReply[1]);
                    // save prompt applied ability reply
                    promptAppliedAbilities.push(promptAppliedAbility);
                    // check restrictions again
                    for(let i = 0; i < restrictions.length; i++) {
                        let passed = await handleRestriction(src_ref, promptAppliedAbility, restrictions[i], RESTR_POST, parsedReply[1], additionalTriggerData);
                        if(!passed) {
                            let msg = getPromptMessage(restrictions[i]);
                            let embed = basicEmbed(`You cannot execute this ability due to a restriction: ${msg}`, EMBED_RED);
                            message.reply(embed);
                            return;
                        }
                    }
                    // store prompt reply message
                    promptReplyMessages.push(`\`${parsedReply[0]}\``);
                    // log prompt reply
                    abilityLog(`✅ **Prompt Reply:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) submitted \`${parsedReply[0]}\`.`);
                } else { // invalid prompt reply
                    return;
                }
            } else { // two replies needed
                let reply = replies[i].split(";");
                if(reply.length != 2) {
                    message.reply(basicEmbed("❌ You must specify exactly two arguments, separated by `;`.", EMBED_RED));
                    return;
                }
                let reply1 = reply[0].trim();
                let reply2 = reply[1].trim();
                let parsedReply1 = parsePromptReply(reply1, type1, message);
                let parsedReply2 = parsePromptReply(reply2, type2, message);
                // reply received
                if(parsedReply1 !== false && parsedReply2 !== false) {
                    // save parsed reply
                    parsedReplies.push(parsedReply1);
                    // apply prompt reply onto ability
                    let promptAppliedAbility = applyPromptValue(clonedAbility, 0, parsedReply1[1]);
                    promptAppliedAbility = applyPromptValue(promptAppliedAbility, 1, parsedReply2[1]);
                    // save prompt applied ability reply
                    promptAppliedAbilities.push(promptAppliedAbility);
                    // check restrictions again
                    for(let i = 0; i < restrictions.length; i++) {
                        let passed = await handleRestriction(src_ref, promptAppliedAbility, restrictions[i], RESTR_POST, parsedReply1[1], additionalTriggerData);
                        if(!passed) {
                            let msg = getPromptMessage(restrictions[i]);
                            let embed = basicEmbed(`You cannot execute this ability due to a restriction: ${msg}`, EMBED_RED);
                            message.reply(embed);
                            return;
                        }
                    }
                    // store prompt reply message
                    promptReplyMessages.push(`\`${parsedReply1[0]}\` and \`${parsedReply2[0]}\``);
                    // log prompt reply
                    abilityLog(`✅ **Prompt Reply:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) submitted \`${parsedReply1[0]}\` and \`${parsedReply2[0]}\`.`);
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
            await createAction(repl_msg, src_ref, src_name, promptAppliedAbilities[i], ability, promptType, type1, type2, exeTime, restrictions, additionalTriggerData, parsedReplies[i][1]);
        }
        
        
    }
    
    /**
    Sends a reply message to a prompt reply with reactions
    **/
    async function sendPromptReplyConfirmMessage(message, prompt_type, txt) {
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
        // send reply
        let repl_msg = await message.reply(msg);
        return repl_msg.id;
    }
    
    /**
    Sends special yes/no prompt
    **/
    this.sendSelectionlessPrompt = async function (src_ref, prompt_type, txt, color = EMBED_GRAY, ping = false, footer = false, thumbnail = null, title = null) {
        // reply message with buttons
        let options = "confirm or delay";
        if(!subphaseIsMain()) options = "confirm";
        let msg;
        if(prompt_type === "immediate") msg = basicEmbed(`${txt} You may ${options} the ability, otherwise it will not be executed.`, color);
        else msg = basicEmbed(`${txt} You may confirm the ability to execute it at the end of the phase, otherwise it will not be executed.`, color);
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
        let repl_msg = await channel.send(msg);
        return repl_msg.id;
    }
    
    /**
    Parses an argument of a prompt reply
    Returns an array of type [displayValue, actualValue]
    **/
    function parsePromptReply(text, type, message) {
        switch(type) {
            case "player":
                let player = parsePlayerReply(text, message.channel);
                if(player === false) {
                    message.reply(basicEmbed("❌ You must specify a valid player.", EMBED_RED));
                    return false;
                }
                return player;
            case "role":
                let role = parseRoleReply(text);
                if(role === false) {
                    message.reply(basicEmbed("❌ You must specify a valid role.", EMBED_RED));
                    return false;
                }
                return role;
            default:
                message.reply(basicEmbed("❌ Invalid prompt.", EMBED_RED));
                return false;
        }
    }
    
    /**
    Parses an argument of type player in a prompt reply
    **/
    function parsePlayerReply(playerName, channel) {
        // similiar as implementation in fixUserList()
		let allPlayerNames = playerIDs.map(el => [channel.guild.members.cache.get(el)?.user.username,channel.guild.members.cache.get(el)?.nickname]).flat().filter(el => el).map(el => el.toLowerCase());
        // check provided player name against all player names
		let parsed = parseList([playerName.toLowerCase()], allPlayerNames);
        if(parsed.invalid.length > 0) { // no player found -> false
            return false;
        } else { // player found -> normalize to player.displayName
            let player = parsed.found[0];
            let parsedPlayer = parseUser(channel, player); // parse player name/id/emoji to discord id
            let playerName = channel.guild.members.cache.get(parsedPlayer)?.displayName ?? false; // get name through id
            if(playerName === false) { // this applies in case the player has left the server
                message.reply(basicEmbed("❌ Player valid but cannot be found.", EMBED_RED));
                return false;
            }
            return [playerName, `@id:${parsedPlayer}[player]`]; // return display name
        }
    }
    
    /**
    Parses an argument of type role in a prompt reply
    **/
    function parseRoleReply(roleName) {
        let parsedRole = parseRole(roleName);
        if(verifyRole(parsedRole)) {
            return [toTitleCase(parsedRole), `${parsedRole}[role]`];
        } else {
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
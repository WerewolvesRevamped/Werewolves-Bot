/**
    Abilities Module - Main
    The submodule for implement ability prompts and queued actions
**/

module.exports = function() {
    const prompts = require("./prompts.json");
    
    this.delayedActionTime = 2147483646;
    this.endActionTime = 2147483647;
    
    /**
    Get Promp Message
    returns a prompt message
    **/
    this.getPromptMessage = function(ability, type1 = "", type2 = "") {
        const ty = ability.type ? ability.type.replace(/ /g,"_") : null;
        const su = ability.subtype ? ability.subtype.replace(/ /g,"_") : null;
        const tysu = `${ty}.${su}`;
        const tysu1 = `${tysu}.1`;
        const tysu2 = `${tysu}.2`;
        const ty1 = `${ty}.1`;
        const ty2 = `${ty}.2`;
        // default prompt
        let promptMsg = `Give ${type1}`;
        if(type2.length > 0) promptMsg += `and ${type2}`;
        promptMsg += ` (\`${ty}${su?'.'+su:''}.${type2===''?'1':'2'}\`)`;
        // search for prompt in JSON
        if(type2 === "" && ty && su && prompts[tysu1]) return prompts[tysu1];
        else if(type2 === "" && ty && su && prompts[tysu]) return prompts[tysu];
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
    this.createPrompt = async function(mid, pid, src_role, ability, prompt_type, type1, type2 = "none") {
        await new Promise(res => {
            sql("INSERT INTO prompts (message_id,player_id,src_role,ability,type1,type2,prompt_type) VALUES (" + connection.escape(mid) + "," + connection.escape(pid) + "," + connection.escape(src_role) + "," + connection.escape(JSON.stringify(ability)) + "," + connection.escape(type1.toLowerCase()) + "," + connection.escape(type2.toLowerCase()) + "," + connection.escape(prompt_type) + ")", result => {
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
    this.clearPrompts = async function() {
        return new Promise(res => {
            sql("DELETE FROM prompts", () => {
                res();
            });
        });
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
    async function deletePrompt(id) {
        return new Promise(res => {
            sql("DELETE FROM prompts WHERE message_id=" + connection.escape(id), result => {
                res();
            });
        });
    }
    
    /**
    Get Action by action queue message id
    retrieves a prompt
    **/
    this.getAction = async function(id) {
        return new Promise(res => {
            sql("SELECT * FROM action_queue WHERE message_id=" + connection.escape(id), result => {
                res(result.length > 0 ? result[0] : false);
            });
        });
    }
        
    /**
    Deletes a Queued Action by message id
    **/
    this.deleteQueuedAction = async function(id) {
        return new Promise(res => {
            sql("DELETE FROM action_queue WHERE message_id=" + connection.escape(id), result => {
                res();
            });
        });
    }
    
    /**
    Sets the execution time of a queued action to the past, immediately executing it on the next check
    **/
    this.instantQueuedAction = async function(id) {
        return new Promise(res => {
            sql("UPDATE action_queue SET execute_time=" + connection.escape(getTime() - 1) + " WHERE message_id=" + connection.escape(id), result => {
                res();
            });
        });
    }
    
    /**
    Sets the execution time of a queued action to max int, delaying it until max delayed actions are manually executed
    **/
    this.delayQueuedAction = async function(id) {
        return new Promise(res => {
            sql("UPDATE action_queue SET execute_time=" + delayedActionTime + " WHERE message_id=" + connection.escape(id), result => {
                res();
            });
        });
    }
    
    /**
    Sets the execution time of all delayed queued action to the past, executing them all on the next check
    **/
    this.executeDelayedQueuedAction = async function() {
        return new Promise(res => {
            sql("UPDATE action_queue SET execute_time=" + connection.escape(getTime() - 1) + " WHERE execute_time=" + delayedActionTime, result => {
                res();
            });
        });
    }
    
    /**
    Sets the execution time of all end queued action to the past, executing them all on the next check
    **/
    this.executeEndQueuedAction = async function() {
        return new Promise(res => {
            sql("UPDATE action_queue SET execute_time=" + connection.escape(getTime() - 1) + " WHERE execute_time=" + endActionTime, result => {
                res();
            });
        });
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
    async function createAction(mid, pid, src_role, ability, orig_ability, prompt_type, type1, type2, time) {
        await new Promise(res => {
            sql("INSERT INTO action_queue (message_id,player_id,src_role,ability,orig_ability,type1,type2,execute_time, prompt_type) VALUES (" + connection.escape(mid) + "," + connection.escape(pid) + "," + connection.escape(src_role) + "," + connection.escape(JSON.stringify(ability)) + "," + connection.escape(JSON.stringify(orig_ability)) + "," + connection.escape(type1) + "," + connection.escape(type2) + "," + connection.escape(time) + "," + connection.escape(prompt_type) + ")", result => {
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
            // delete the queued action entry
            await deleteQueuedAction(actionsToExecute[i].message_id);
            // parse ability
            let ability = JSON.parse(actionsToExecute[i].ability);
            // execute the ability
            let feedback = await executeAbility(actionsToExecute[i].player_id, actionsToExecute[i].src_role, ability);
            // send feedback
            if(feedback) abilitySend(actionsToExecute[i].player_id, feedback, EMBED_GREEN);
            // confirm automatic execution
            confirmAutoExecution(actionsToExecute[i].player_id, actionsToExecute[i].message_id);
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
        let src_role = prompt.src_role;
        let pid = prompt.player_id;
        // check which type of prompt
        if(prompt.type2 == "none") { // single reply needed
            let reply = message.content.trim();
            let parsedReply = parsePromptReply(reply, prompt.type1, message);
            // reply received
            if(parsedReply !== false) {
                // delete prompt 
                await deletePrompt(message.reference.messageId);
                let repl_msg = await sendPromptReplyConfirmMessage(message, prompt.prompt_type, `You submitted: \`${parsedReply[0]}\`.`);
                // apply prompt reply onto ability
                let promptAppliedAbility = applyPromptValue(ability, 0, parsedReply[1]);
                // queue action
                let exeTime = prompt.prompt_type == "immediate" ? getTime() + 60 : endActionTime;
                await createAction(repl_msg, pid, src_role, promptAppliedAbility, ability, prompt.prompt_type, prompt.type1, prompt.type2, exeTime);
                // log prompt reply
                abilityLog(`✅ **Prompt Reply:** <@${pid}> (${toTitleCase(src_role)}) submitted \`${parsedReply[0]}\`.`);
            }
        } else { // two replies needed
            let reply = message.content.split(";");
            if(reply.length != 2) {
                message.reply(basicEmbed("❌ You must specify exactly two arguments, separated by `;`.", EMBED_RED));
            }
            let reply1 = reply[0].trim();
            let reply2 = reply[1].trim();
            let parsedReply1 = parsePromptReply(reply1, prompt.type1, message);
            let parsedReply2 = parsePromptReply(reply2, prompt.type2, message);
            // reply received
            if(parsedReply1 !== false && parsedReply2 !== false) {
                // delete prompt 
                await deletePrompt(message.reference.messageId);
                let repl_msg = await sendPromptReplyConfirmMessage(message, prompt.prompt_type, `You submitted: \`${parsedReply1[0]}\` and \`${parsedReply2[0]}\`.`);
                // apply prompt reply onto ability
                let promptAppliedAbility = applyPromptValue(ability, 0, parsedReply1[1]);
                promptAppliedAbility = applyPromptValue(ability, 1, parsedReply2[1]);
                // queue action
                let exeTime = prompt.prompt_type == "immediate" ? getTime() + 60 : endActionTime;
                await createAction(repl_msg, pid, src_role, promptAppliedAbility, ability, prompt.prompt_type, prompt.type1, prompt.type2, exeTime);
                // log prompt reply
                abilityLog(`✅ **Prompt Reply:** <@${pid}> (${toTitleCase(src_role)}) submitted \`${parsedReply1[0]}\` and \`${parsedReply2[0]}\`.`);
            }
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
            return [playerName, `@id:${parsedPlayer}`]; // return display name
        }
    }
    
    /**
    Parses an argument of type role in a prompt reply
    **/
    function parseRoleReply(roleName) {
        let parsedRole = parseRole(roleName);
        if(verifyRole(parsedRole)) {
            return [toTitleCase(parsedRole), parsedRole];
        } else {
            return false;
        }
    }
    
    /**
    Prompt Message Confirm Automatic Execution
    **/
    this.confirmAutoExecution = function(player_id, message_id) {
        return new Promise(res => {
            sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
                for(let i = 0; i < result.length; i++) {
                    let player_sc_id = result[i].channel_id;
                    let player_sc = client.guilds.cache.get("569626539541397515").channels.cache.get(player_sc_id);
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
/**
    Abilities Module - Choices
    The module for implementing choices ability type
**/

module.exports = function() {
    
    /**
    Ability: Choices
    **/
    this.abilityChoices = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.choice) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Choices failed! " + abilityError, success: false };
        }
        // parse parameters
        const choice = parseChoice(ability.choice);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Choices failed! " + abilityError, success: false };
            break;
            case "creation":
                // check parameters
                if(!ability.target || !ability.options) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                    return { msg: "Choices failed! " + abilityError, success: false };
                }
                // parse parameters
                let target;
                let type;
                if(ability.target[0] === "`") {
                    target = await parseActiveExtraRoleSelector(ability.target, src_ref, additionalTriggerData);
                    type = "player_attr";
                } else {
                    target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
                    type = "player";
                }
                target = await applyRedirection(target, src_ref, ability.type, ability.subtype, additionalTriggerData);
                const options = ability.options.map(el => parseOptionDisplay(el));
                // can only apply a single attribute
                if(target.length != 1) {
                    abilityLog(`❗ **Error:** Tried to create a choice for ${target.length} players!`);
                    return { msg: "Choices failed! " + abilityError, success: false };
                }
                // check if is forced
                let forcedSel = "";
                if(additionalTriggerData.parameters.forced && additionalTriggerData.parameters.forced_sel) {
                    forcedSel = additionalTriggerData.parameters.forced_sel;
                }
                result = await choicesCreation(src_name, src_ref, `${type}:${target[0]}`, choice, options, forcedSel, additionalTriggerData);
                return result;
            break;
        }
    }
    
    /**
    Ability: Choices Creation
    creates a choice
    **/
    async function choicesCreation(src_name, src_ref, target, choiceName, options, forcedSel, additionalTriggerData) {
        // handle visit
        if(additionalTriggerData.parameters.visitless !== true) {
            let result = await visit(src_ref, target, choiceName, NO_SND_VISIT_PARAM, "choices", "creation");
            if(result) return visitReturn(result, "Choice creation failed!", "Choice creation succeeded!");
        }
        
        // create choice
        await sqlProm("INSERT INTO choices (name, options, src_ref, src_name, owner, forced) VALUES (" + connection.escape(choiceName) + "," + connection.escape(options.join(",")) + "," + connection.escape(src_ref) + "," + connection.escape(src_name) + "," + connection.escape(target) + "," + connection.escape(forcedSel) + ")");
        // feedback
        let optionsText = options.map(el => "`" + el + "`").join(", ");
        abilityLog(`✅ Created choice \`${choiceName}\` for ${srcRefToText(target)} with options: ${optionsText}.`);
        return { msg: "Choice creation succeeded!", success: true, target: `${target}` };
    }
    
    /**
    Choice choosing prompt creation
    **/
    this.choicesChoosingPrompt = async function(src_name, owner, ability, promptOverwrite, promptPing, channelOverride = null) {
        // get channel
        let channel_id = await getSrcRefChannel(owner);
        if(channelOverride) channel_id = channelOverride;
        if(!channel_id) return;
        
        // get channel
        const sc = mainGuild.channels.cache.get(channel_id);
        
        // get relevant choice
        const choiceName = parseChoice(ability.choice);
        
        // check if choice exists
        const choice = await choicesGetByOwner(choiceName, owner);
        if(!choice) {
            abilityLog(`❗ **Error:** Could not find choice ${choiceName} for ${srcRefToText(owner)}!`);
            return;
        }
        
        // get prompt message / send choice message
        const promptMsg = getPromptMessage(ability, promptOverwrite);
        const refImg = await refToImg(src_name);
        const message = await sendChoiceMessage(sc, `${getAbilityEmoji(ability.type)} ${promptMsg}${PROMPT_SPLIT}\nPlease select one of the choices by clicking the respective button. You may be prompted for additional selections after the choice.`, choiceName, choice.options, refImg, "Ability Prompt - Choice", promptPing);
        
        // save choice message
        let p1 = choicesUpdateByOwner(choiceName, owner, "ability", JSON.stringify(ability));
        let p2 = choicesUpdateByOwner(choiceName, owner, "prompt", promptOverwrite);
        let p3 = choicesUpdateByOwner(choiceName, owner, "choice_msg", message.id);
        let p4 = choicesUpdateByOwner(choiceName, owner, "choice_channel", message.channel.id);
        await Promise.all([p1, p2, p3, p4]);
    }
    
    /**
    Sends a choice message with buttons
    **/
    async function sendChoiceMessage(channel, txt, choiceName, options, thumbnail = null, title = null, ping = true) {
        // choice message with buttons
        let msg = basicEmbed(`${txt}`, EMBED_BLUE);
        
        // create buttons
        let buttons = options.split(",").map(el => {
            let optionDisplay = parseOptionDisplay(el);
            let option = parseOption(el);
            return { type: 2, label: optionDisplay, style: 2, custom_id: `choice:${choiceName}-${option}` };
        });
        msg.components = [ { type: 1, components: buttons } ];

        // extra components
        if(ping) msg.content =  `<@&${stats.participant}>`; // add ping
        if(thumbnail) msg.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
        if(title) msg.embeds[0].title = title; // add title
        
        // send message
        let choice_msg = await channel.send(msg);
        return choice_msg;
    }
    
    /**
    Clears prompts and action belonging to a choice
    **/
    this.choiceUnchoose = async function(orig_text, chooser, choiceName) {
        // clear all connected prompts
        let messagesToClear = [];
        let allPrompts = await sqlProm("SELECT * FROM prompts");
        for(let i = 0; i < allPrompts.length; i++) {
            let promptATD = JSON.parse(allPrompts[i].additional_trigger_data);
            if(promptATD.choice_data && promptATD.choice_data.owner === chooser && promptATD.choice_data.name === choiceName) {
                messagesToClear.push([allPrompts[i].channel_id, allPrompts[i].message_id]);
                await sqlPromEsc("DELETE FROM prompts WHERE ai_id=", allPrompts[i].ai_id);
            }
        }
        // clear all connected actions
        let allActions = await sqlProm("SELECT * FROM action_queue");
        for(let i = 0; i < allActions.length; i++) {
            let promptATD = JSON.parse(allActions[i].additional_trigger_data);
            if(promptATD.choice_data && promptATD.choice_data.owner === chooser && promptATD.choice_data.name === choiceName) {
                messagesToClear.push([allActions[i].channel_id, allActions[i].message_id]);
                await sqlPromEsc("DELETE FROM action_queue WHERE ai_id=", allActions[i].ai_id);
            }
        }
        // clear all messages from actions and prompts
        for(let i = 0; i < messagesToClear.length; i++) {
            let msgChannel = await mainGuild.channels.fetch(messagesToClear[i][0]);
            let msg = await msgChannel.messages.fetch(messagesToClear[i][1]);
            let orig_text = msg.embeds[0].description.split(PROMPT_SPLIT)[0];
            // update message
            embed = basicEmbed(`${orig_text}${PROMPT_SPLIT} A choice was unchosen, invalidating this message.`, EMBED_RED);
            embed.components = [];
            msg.edit(embed); 
        }
        return messagesToClear.length;
    }
    
    /**
    Choice checker - is complete?
    **/
    this.choiceCheckCompletion = async function(chooser, choiceName) {
        // check all connected prompts
        let found = 0;
        let allPrompts = await sqlProm("SELECT * FROM prompts");
        for(let i = 0; i < allPrompts.length; i++) {
            let promptATD = JSON.parse(allPrompts[i].additional_trigger_data);
            if(promptATD.choice_data && promptATD.choice_data.owner === chooser && promptATD.choice_data.name === choiceName) {
                found++;
            }
        }
        // clear all connected actions
        let allActions = await sqlProm("SELECT * FROM action_queue");
        for(let i = 0; i < allActions.length; i++) {
            let promptATD = JSON.parse(allActions[i].additional_trigger_data);
            if(promptATD.choice_data && promptATD.choice_data.owner === chooser && promptATD.choice_data.name === choiceName) {
                found++;
            }
        }
        // delete choice
        if(found === 0) {
            // remove button from message
            let choiceData = await choicesGetByOwner(choiceName, chooser);
            if(!choiceData) return found;
            let msgChannel = await mainGuild.channels.fetch(choiceData.choice_channel);
            let msg = await msgChannel.messages.fetch(choiceData.choice_msg);
            let embed = msg.embeds;
            embed.components = [];
            msg.edit(embed); 
            // delete choice in db
            await choicesDeleteByOwner(choiceName, chooser);
        }
        return found;
    }

    /**
    Choices: Forced
    executes forced choices
    **/
    this.executeForcedChoices = async function() {
        // get choices 
        let choices = await sqlProm("SELECT * FROM choices WHERE forced <> '' AND chosen=0");
        
        // apply forced choices
        for(let i = 0; i < choices.length; i++) {
            let optionName = choices[i].forced;
            let choiceName = choices[i].name;
            let choiceCreatorId = srcToValue(choices[i].src_ref);
            let chooser = choices[i].owner;
            abilityLog(`✅ **Choice Chose:** <@${chooser}> chose \`${optionName}\` for \`${choiceName}\`.`);
            actionLog(`⏺️ <@${chooser}> choice chose \`${optionName}\` for \`${choiceName}\`.`);
            await triggerPlayer(choiceCreatorId, "Choice Chosen", { chooser: `player:${chooser}`, chosen: parseOption(optionName), choice_data: { name: choiceName, owner: chooser } }); 
            await triggerPlayer(choiceCreatorId, "Choice Chosen Complex", { chooser: `player:${chooser}`, chosen: parseOption(optionName), choice_data: { name: choiceName, owner: chooser } });
        }        
    }
    
    /**
    Choices: Reset
    resets all choices
    **/
    this.choicesReset = function() {
		// Reset choices Database
		return sqlProm("DELETE FROM choices");
    }
    
    /** PUBLIC
    Get choice data
    **/
    this.choicesGetByOwner = function(choiceName, owner) {
        return sqlPromOne("SELECT * FROM choices WHERE name=" + connection.escape(choiceName) + " AND owner=" + connection.escape(owner));
    }
    
    /** PUBLIC
    find choice by member or channel id
    **/
    this.choicesFind = function(choiceName, ownerId, ownerChannel) {
        return sqlPromOne("SELECT * FROM choices WHERE name=" + connection.escape(choiceName) + " AND (owner=" + connection.escape(`player:${ownerId}`) + " OR owner=" + connection.escape(`player_attr:${ownerChannel}`) + ")");
    }
    
    /** PUBLIC
    Deletes choice 
    **/
    this.choicesDeleteByOwner = function(choiceName, owner) {
        return sqlProm("DELETE FROM choices WHERE name=" + connection.escape(choiceName) + " AND owner=" + connection.escape(owner));
    }
    
    /** PUBLIC
    Updates a choice
    **/
    this.choicesUpdateByOwner = function(choiceName, owner, column, val) {
        if(!(["choice_msg","choice_channel","prompt","ability","chosen"].includes(column))) return;
        return sqlProm("UPDATE choices SET " + column + "=" + connection.escape(val) +  " WHERE name=" + connection.escape(choiceName) + " AND owner=" + connection.escape(owner));
    }
    
    /**
    Command: $chooser
    Sets yourself as another player for choices
    **/
    this.chooserRepls = [];
    this.cmdChooser = function(message, args) {
		// Check arguments
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "chooser <player>`!"); 
			return; 
		}
        // Get user
		var user = parseUser(args[0], message.channel);
		if(!user) { 
			// Invalid user
			message.channel.send("⛔ Syntax error. `" + args[0] + "` is not a valid player!"); 
			return; 
		} 
        
        // remove set chooser if exists
        chooserRepls = chooserRepls.filter(el => el[0] != message.author.id);
        
        // set chooser
        chooserRepls.push([message.author.id, user]);
        message.channel.send(`✅ Set <@${message.author.id}> as chooser for <@${user}>.`);
        
    }
    
}
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
                const target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
                const options = ability.options.map(el => parseOptionDisplay(el));
                // can only apply a single attribute
                if(target.length != 1) {
                    abilityLog(`❗ **Error:** Tried to create a choice for ${target.length} players!`);
                    return { msg: "Choices failed! " + abilityError, success: false };
                }
                result = await choicesCreation(src_name, src_ref, target[0], choice, options);
                return result;
            break;
        }
    }
    
    /**
    Ability: Choices Creation
    creates a choice
    **/
    async function choicesCreation(src_name, src_ref, target, choiceName, options) {
        // create choice
        await sqlProm("INSERT INTO choices (name, options, src_ref, src_name, owner) VALUES (" + connection.escape(choiceName) + "," + connection.escape(options.join(",")) + "," + connection.escape(src_ref) + "," + connection.escape(src_name) + "," + connection.escape(target) + ")");
        // feedback
        let optionsText = options.map(el => "`" + el + "`").join(", ");
        abilityLog(`✅ Created choice \`${choiceName}\` for <@${target}> with options: ${optionsText}.`);
        return { msg: "Choice creation succeeded!", success: true, target: `player:${target}` };
    }
    
    /**
    Choice choosing prompt creation
    **/
    this.choicesChoosingPrompt = async function(src_name, src_ref, ability, promptOverwrite, promptType, restrictions, additionalTriggerData, actionCount, forced) {
        // get channel
        const channel_id = await getSrcRefChannel(src_ref);
        if(!channel_id) return;
        
        // get channel
        const sc = mainGuild.channels.cache.get(channel_id);
        
        // get relevant choice
        const choiceName = parseChoice(ability.choice);
        const type = srcToType(src_ref);
        if(!type) {
            abilityLog(`❗ **Error:** ${type} cannot choice choose!`);
            return;
        }
        const pid = srcToValue(src_ref);
        const choice = await choicesGetByOwner(choiceName, pid);
        if(!choice) {
            abilityLog(`❗ **Error:** Could not find choice ${choiceName} for <@${pid}>!`);
            return;
        }
        
        // get prompt message / send choice message
        const promptMsg = getPromptMessage(ability, promptOverwrite);
        const refImg = await refToImg(src_name);
        const message = await sendChoiceMessage(sc, `${getAbilityEmoji(ability.type)} ${promptMsg}${PROMPT_SPLIT}\nPlease select one of the choices by clicking the respective button. You may be prompted for additional selections after the choice.`, choiceName, choice.options, refImg, "Ability Prompt - Choice");
    }
    
    /**
    Sends a choice message with buttons
    **/
    async function sendChoiceMessage(channel, txt, choiceName, options, thumbnail = null, title = null) {
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
        if(thumbnail) msg.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
        if(title) msg.embeds[0].title = title; // add title
        
        // send message
        let choice_msg = await channel.send(msg);
        return choice_msg;
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
    this.choicesGetByOwner = function(choiceName, ownerId) {
        return sqlPromOne("SELECT * FROM choices WHERE name=" + connection.escape(choiceName) + " AND owner=" + connection.escape(ownerId));
    }
    
    /** PUBLIC
    Deletes choice 
    **/
    this.choicesDeleteByOwner = function(choiceName, ownerId) {
        return sqlProm("DELETE FROM choices WHERE name=" + connection.escape(choiceName) + " AND owner=" + connection.escape(ownerId));
    }
    
}
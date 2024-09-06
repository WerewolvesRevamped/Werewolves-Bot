/**
    Abilities Module - Poll
    The module for implementing poll manipulation
**/

module.exports = function() {

    /** PUBLIC
    Ability: Poll
    **/
    this.abilityPoll = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Poll manipulation failed! " + abilityError, success: false };
        }
        // parse parameters
        let pollType = await parsePoll(ability.target, src_ref, additionalTriggerData);
        if(!pollType) return { msg: "Poll manipulation failed! " + abilityError, success: false };
                
        let result, duration;
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Poll manipulation failed! " + abilityError, success: false };
            break;
            case "creation":
                // check parameters
                if(!ability.poll_location) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                    return { msg: "Poll manipulation failed! " + abilityError, success: false };
                }
                // parse parameters
                let pollLocation = await parseLocation(ability.poll_location, src_ref, additionalTriggerData);
                let pollName =  ability.poll_name ? (await parseInfo(ability.poll_name)) : pollType;
                result = await pollCreate(src_name, src_ref, pollType, pollName, pollLocation);
                return result;
            break;
            case "addition":
                duration = parseDuration(ability.duration ?? "untiluse");
                result = await pollCountModify(src_name, src_ref, pollType, 1, duration);
                return result;
            break;
            case "deletion":
                duration = parseDuration(ability.duration ?? "untiluse");
                result = await pollCountModify(src_name, src_ref, pollType, -1, duration);
                return result;
            break;
            case "cancellation":
                duration = parseDuration(ability.duration ?? "untiluse");
                result = await pollCancel(src_name, src_ref, pollType, duration);
                return result;
            break;
        }
    }
    
    /** PRIVATE
    Ability: Poll - Add/Remove
    **/
    async function pollCountModify(src_name, src_ref, pollType, pollCount, duration) {
        await createPollCountAttribute(src_name, src_ref, pollType, duration, pollType, pollCount);
        abilityLog(`✅ ${toTitleCase(pollType)} count was modified by \`${pollCount}\`.`);
        return { msg: pollCount > 0 ? "Poll added!" : "Poll removed!", success: true, target: `poll:${pollType}` };
    }
    
    /** PRIVATE
    Ability: Poll - Cancel
    **/
    async function pollCancel(src_name, src_ref, pollType, duration) {
        await createPollResultAttribute(src_name, src_ref, pollType, duration, pollType, "cancel");
        abilityLog(`✅ ${toTitleCase(pollType)} was cancelled.`);
        return { msg: "Poll cancelled!", success: true, target: `poll:${pollType}` };
    }
    
    /** PUBLIC
    returns if a specific poll is cancelled and consumes the attribute
    **/
    this.attemptPollCancellation = async function(pollType) {
        let allCancellations = await queryAttribute("attr_type", "poll_result", "val2", "cancel"); // get all cancellations
        if(allCancellations <= 0) return false; // no cancellations
        // consume attribute
        await useAttribute(allCancellations[0].ai_id);
        return true;
    }
    
    
    /**
    Get all vote manipulations
    **/
    this.getManipulations = async function(player_id, subtype) {
        let allManipulations = await queryAttributePlayer(player_id, "attr_type", "manipulation", "val2", subtype); // get all manipulation of specified type
        if(allManipulations.length <= 0) return []; // no manipulations
        return allManipulations;
    }
    
    /** PRIVATE
    Ability: Poll - Creation
    **/
    async function pollCreate(src_name, src_ref, pollType, pollName, pollLocation) {
        const pollData = await pollGetData(pollType);
        const options = pollData.options.split(", ");
        const name = pollData.display_name;
        
        const allOptions = await optionListData(options);
        
        // calculate poll count
        let pollCount = 1;
        let pollCountAttrs = await queryAttribute("attr_type", "poll_count", "val1", pollType);
        for(let attr of pollCountAttrs) { // iterate through poll count attributes and apply the count change
            pollCount += (+attr.val2);
            await useAttribute(attr.ai_id);
        }
        
        // create poll
        if(pollCount === 0) { // no polls
            let emoji = getLUTEmoji(pollType, pollName);
            await abilitySendProm(`${pollLocation.type}:${pollLocation.value}`, `No Poll: **${toTitleCase(pollName)}** ${emoji}\n\nThe poll will not take place this time.`);
        } else if(pollCount === 1) { // single poll
            await createPoll(pollType, pollName, pollLocation, allOptions, src_ref);
        } else { // several polls
            for(let i = 0; i < pollCount; i++) {
                await createPoll(pollType, `${pollName} #${i+1}`, pollLocation, JSON.parse(JSON.stringify(allOptions)), src_ref);
            }
        }
        
        // feedback - poll creation always creates obvious feedback and needs no text feedback
        return { msg: "", success: true };
    }
    
    
    
    
}
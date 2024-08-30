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
        }
    }
    
    /** PRIVATE
    Ability: Poll - Add
    **/
    async function pollCountModify(src_name, src_ref, pollType, pollCount, duration) {
        await createPollCountAttribute(src_name, src_ref, pollType, duration, pollType, pollCount);
        abilityLog(`✅ ${toTitleCase(pollType)} count was modified by \`${pollCount}\`.`);
        return { msg: pollCount > 0 ? "Poll added!" : "Poll removed!", success: true, target: `poll:${pollType}` };
    }
    
    /** PRIVATE
    Ability: Poll - Creation
    **/
    async function pollCreate(src_name, src_ref, pollType, pollName, pollLocation) {
        const pollData = await pollGetData(pollType);
        const options = pollData.options.split(", ");
        const name = pollData.display_name;
        
        // WIP: NOT CONSIDERING NON PLAYER POLLS
        let allOptions = [];
        for(let i = 0; i < options.length; i++) {
            // player selector
            if(options[i][0] === "@") {
                let players = await parsePlayerSelector(options[i], src_ref);
                players = players.map(el => {
                    let id = el;
                    let emoji = idToEmoji(el);
                    return { id: id, emoji: emoji, type: "player" };
                });
                allOptions.push(...players);
            }
            // not player
            else {
                allOptions.push({ name: options[i], emoji: pollNameToEmoji(options[i]), type: "emoji" });
            }
        }
        
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

    function pollNameToEmoji(name) {
        name = name.toLowerCase();
        switch(name) {
            case "abstain": return "⛔";
            case "cancel": return "❌";
            case "random": return "❓";
            case "yes": return client.emojis.cache.get(stats.yes_emoji);
            case "no": return client.emojis.cache.get(stats.no_emoji);
        }
    }

    this.pollEmojiToName = function(name) {
        name = name.toLowerCase();
        switch(name) {
            case "⛔": return "Abstain";
            case "❌": return "Cancel";
            case "❓": return "Random";
            case client.emojis.cache.get(stats.yes_emoji): return "Yes";
            case client.emojis.cache.get(stats.no_emoji): return "No";
        }
    }
    
    
    
    
}
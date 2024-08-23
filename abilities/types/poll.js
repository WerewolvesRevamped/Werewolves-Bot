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
        let result;
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
                let pollType = await parsePoll(ability.target, src_ref, additionalTriggerData);
                if(!pollType) return { msg: "Poll manipulation failed! " + abilityError, success: false };
                let pollLocation = await parseLocation(ability.poll_location, src_ref, additionalTriggerData);
                console.log(pollLocation);
                let pollName =  ability.poll_name ? (await parseInfo(ability.poll_name)) : pollType;
                result = await pollCreate(src_name, src_ref, pollType, pollName, pollLocation);
                return result;
            break;
        }
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
        
        // create poll
        await createPoll(pollType, pollName, pollLocation, allOptions, src_ref);
        
        // feedback
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
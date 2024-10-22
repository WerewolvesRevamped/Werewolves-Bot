/**
    Abilities Module - Conversation Reset
    The module for implementing conversation reset
**/

module.exports = function() {
    
    /**
    Ability: Conversation Reset
    **/
    this.abilityReset = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Conversation reset failed! " + abilityError, success: false };
        }
        
        // parse parameters
        let target = await parseLocation(ability.target, src_ref, additionalTriggerData);
        target = await applyRedirection(target, src_ref, ability.type, additionalTriggerData);
        
        // handle visit
        let resultV = await visit(src_ref, target.value, "", "reset");
        if(resultV) return visitReturn(resultV, "Conversation reset failed!", "Conversation reset succeeded!");
        
        // get channel to conversation reset
        let cid = await getSrcRefChannel(`${target.type}:${target.value}`);
        let targetChannel = mainGuild.channels.cache.get(cid);
        
        // bulk delete
        let messages = await targetChannel.messages.fetch();
        let first = messages.last();
        await targetChannel.bulkDelete(messages);
        // resend first message
        targetChannel.send({ embeds: first.embeds, content: first.content });
        
        // feedback
        return { msg: "Conversation reset succeeded!", success: true, target: `${target.type}:${target.value}` };
    }
    
}
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
        if(target.multiple) {
            abilityLog(`❗ **Error:** Location type \`${target.type}\` is unsupported!`);
            return { msg: "Conversation reset failed! " + abilityError, success: false };
        }
        if(target.type == null) return { msg: "", success: true }; // no location found
        target.value = await applyRedirection(target.value, src_ref, ability.type, "", additionalTriggerData);
        
        // handle visit
        if(additionalTriggerData.parameters.visitless !== true) {
            console.log("CONVORESET", src_ref, target);
            let resultV = await visit(src_ref, target.value, NO_VISIT_PARAM, NO_SND_VISIT_PARAM, "reset");
            if(resultV) return visitReturn(resultV, "Conversation reset failed!", "Conversation reset succeeded!");
        }
        
        // get channel to conversation reset
        let cid = await getSrcRefChannel(`${target.type}:${target.value}`);
        let targetChannel = mainGuild.channels.cache.get(cid);
        
        // bulk delete
        let messages = await targetChannel.messages.fetch();
        let first = messages.last();
        await targetChannel.bulkDelete(messages);
        // resend first message
        if(first.embeds.length > 0 && first.author.bot) {
            targetChannel.send({ embeds: first.embeds, content: first.content });
        }
        
        // feedback -> no message for conversation reset as that would often be in the reset channel
        return { msg: "", success: true, target: `${target.type}:${target.value}` };
    }
    
}
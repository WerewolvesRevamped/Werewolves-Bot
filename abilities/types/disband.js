/**
    Abilities Module - Disband
    The module for implementing disbanding
**/

module.exports = function() {
    
    /**
    Ability: Disband
    **/
    this.abilityDisband = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Disbanding failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parseGroup(ability.target, src_ref);
        await groupsDisband("", target);
        
        return { msg: "Disbanding succeeded!", success: true };
    }
    
    
    /** Groups: Disband
    disbands a group
    **/
    this.groupsDisband = async function(group, id = 0) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE disbanded=0 AND name=" + connection.escape(group) + " OR channel_id=" + connection.escape(id), async result => {
                let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                // update permissions
                let groupMembers = groupChannel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member);
                groupMembers.forEach(el => {
                    groupChannel.permissionOverwrites.create(el.id, { ViewChannel: true, SendMessages: false });
                });
                // send disband message
                let embed = basicEmbed(`<#${groupChannel.id}> has been disbanded.`, EMBED_RED);
                groupChannel.send(embed);
                // disband trigger
                await trigger(`group:${result[0].channel_id}`, "On Disbandment", { }); 
                // disband active group
                await sqlPromEsc("UPDATE active_groups SET disbanded=1 WHERE ai_id=", result[0].ai_id);
                // resolve disband
                res();
            });
        });
    }
    
}
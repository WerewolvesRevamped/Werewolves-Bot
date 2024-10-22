/**
    Abilities Module - Disband
    The module for implementing disbanding
**/

module.exports = function() {
    
    
    /** Groups: Disband
    disbands a group
    **/
    this.groupsDisband = async function(group) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE disbanded=0 AND name=" + connection.escape(group), async result => {
                let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                // update permissions
                let groupMembers = groupChannel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member);
                groupMembers.forEach(el => {
                    groupChannel.permissionOverwrites.create(el.id, { ViewChannel: true, SendMessages: false });
                });
                // send disband message
                let embed = basicEmbed(`<#${groupChannel.id}> has been disbanded.`, EMBED_RED);
                groupChannel.send(embed);
                // disband active group
                await sqlPromEsc("UPDATE active_groups SET disbanded=1 WHERE ai_id=", result[0].ai_id);
                // resolve disband
                res();
            });
        });
    }
    
}
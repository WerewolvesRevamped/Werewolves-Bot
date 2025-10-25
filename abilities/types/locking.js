/**
    Abilities Module - Locking
    The module for implementing locking ability
**/

module.exports = function() {
    
    /**
    Ability: Locking
    **/
    this.abilityLocking = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Locking failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parseLocation(ability.target, src_ref, additionalTriggerData);
        if(target.type == null || target.multiple) return { msg: "Locking failed! " + abilityError, success: false }; // no location found
        
        // get channel to lock
        let cid = await getSrcRefChannel(`${target.type}:${target.value}`);
        let targetChannel = mainGuild.channels.cache.get(cid);
        
        if(!targetChannel) {
            abilityLog(`❗ **Error:** Could not find channel \`${target.type}:${target.value}\`!`);
            return { msg: "Locking failed! " + abilityError, success: false };
        }
        
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Locking failed! " + abilityError, success: false };
            break;
            case "lock":
                await lockChannel(targetChannel);
                abilityLog(`🔒 Locked ${targetChannel}`);
            break;
            case "unlock":
                await unlockChannel(targetChannel);
                abilityLog(`🔓 Unlocked ${targetChannel}`);
            break;
        }
            
        // feedback
        return { msg: "Locking succeeded!", success: true, target: `${target.type}:${target.value}` };
    }
    
    /**
     Locks a channel 
     */
    async function lockChannel(channel) {
        let permissions = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Role && el.deny == 0 && el.allow == 3072); // public
        permissions.push(...channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Role && el.deny == 1024 && el.allow == 2048)); // sc
        for(let i = 0; i < permissions.length; i++) {
            await channel.permissionOverwrites.edit(permissions[i].id, { SendMessages: false, EmbedLinks: true });
        }
    }

    /**
     Unlocks a channel
     */
    async function unlockChannel(channel) {
        let permissions = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Role && el.deny == 2048 && el.allow == 17408); // public
        permissions.push(...channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Role && el.deny == 3072 && el.allow == 16384)); // sc
        for(let i = 0; i < permissions.length; i++) {
            await channel.permissionOverwrites.edit(permissions[i].id, { SendMessages: true, EmbedLinks: null });
        }
    }

}

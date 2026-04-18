/**
    Abilities Module - Switching
    The module for implementing switching
**/

module.exports = function() {
    
    /**
    Ability: Switching
    **/
    this.abilitySwitching = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Switching failed! " + abilityError, success: false };
        }
        // get target
        const targets = await parseSelector(ability.target, src_ref, additionalTriggerData);
        
        // check parameters
        if(targets.value.length != 1) {
            abilityLog(`❗ **Error:** Invalid ability type for switching!`);
            return { msg: "Switching failed! " + abilityError, success: false };
        }
        if(targets.type != "player") {
            abilityLog(`❗ **Error:** Cannot switch type \`${targets.type}\`!`);
            return { msg: "Switching failed! " + abilityError, success: false }; 
        }
        
        let self = src_ref.split(":")[1];
        
        // apply channel switch
        let categories = cachedCCs;
        categories.push(...cachedSCs)
        switchCategories(categories, self, targets.value[0]);
        
        // switch roles
        let pData1 = await sqlPromOneEsc("SELECT * FROM players WHERE players.id=", targets.value[0]);
        let pData2 = await sqlPromOneEsc("SELECT * FROM players WHERE players.id=", self);
        await sqlPromEsc("UPDATE players SET role=" + connection.escape(pData1.role) + ",alignment=" + connection.escape(pData1.alignment) + " WHERE id=", self);
        await sqlPromEsc("UPDATE players SET role=" + connection.escape(pData2.role) + ",alignment=" + connection.escape(pData2.alignment) + " WHERE id=", targets.value[0]);
        
        // switch host information
        await sqlProm(`UPDATE host_information SET id='temp' WHERE id=${connection.escape(targets.value[0])}`);
        await sqlProm(`UPDATE host_information SET id=${connection.escape(targets.value[0])} WHERE id=${connection.escape(self)}`);
        await sqlProm(`UPDATE host_information SET id=${connection.escape(self)} WHERE id='temp'`);
        
        // return
        return { msg: "Switching succeeded!", success: true };
    }
    
    
	/**
    Substitute Categories
    performs a channel substitution on several categories
    **/
	this.switchCategories = function(categories, switchPlayerFrom, switchPlayerTo) {
        for(let i = 0; i < categories.length; i++) {
            let cat = mainGuild.channels.cache.get(categories[i]);
            if(!cat) continue;
            let channels = cat.children.cache.toJSON();
            switchChannels(channels, switchPlayerFrom, switchPlayerTo);
        }
	}
    
    /**
    Substitute Channels
    performs a channel substitution on several channels
    **/
    this.switchChannels = function(channels, switchPlayerFrom, switchPlayerTo) {
        for(let i = 0; i < channels.length; i++) {
            let channel = mainGuild.channels.cache.get(channels[i].id);
            if(!channel) continue;
            // get memberships
            let perms = channel.permissionOverwrites.cache.toJSON();
            let channelMembers = perms.filter(el => el.type === OverwriteType.Member).map(el => el.id);
			let channelOwners = perms.filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
            // apply substitution
            if(channelMembers.includes(switchPlayerFrom)) {
                channelSetPermission(channel, switchPlayerFrom, CC_PERMS_NONE);
                channelSetPermission(channel, switchPlayerTo, CC_PERMS_MEMBER);
			}
			if(channelOwners.includes(switchPlayerFrom)) {
                channelSetPermission(channel, switchPlayerTo, CC_PERMS_OWNER);
			}
            if(channelMembers.includes(switchPlayerTo)) {
                channelSetPermission(channel, switchPlayerTo, CC_PERMS_NONE);
                channelSetPermission(channel, switchPlayerFrom, CC_PERMS_MEMBER);
			}
			if(channelOwners.includes(switchPlayerTo)) {
                channelSetPermission(channel, switchPlayerFrom, CC_PERMS_OWNER);
			}
        }
    }
    
}
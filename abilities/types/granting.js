/**
    Abilities Module - Granting
    The module for implementing granting ability type
**/

module.exports = function() {
    
    /**
    Ability: Granting
    **/
    this.abilityGranting = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.role) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Granting failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        let role = await parseRoleSelector(ability.role, src_ref, additionalTriggerData);
        // can only grant exactly one role
        if(role.length != 1) {
            abilityLog(`❗ **Error:** Tried to grant ${role.length} roles!`);
            return { msg: "Granting failed! " + abilityError, success: false };
        }
        role = role[0];
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Granting failed! " + abilityError, success: false };
            break;
            case "add":
                result = await grantingAdd(src_name, src_ref, target, role);
                return result;
            break;
            case "remove":
                result = await grantingRemove(src_name, src_ref, target, role);
                return result;
            break;
        }
    }
    
    
    /**
    Ability: Granting - Add
    adds a role to a player
    **/
    this.grantingAdd = async function(src_name, src_ref, targets, role) {
        // get existing channel if applicable
        let existingChannel = await connectionGet(`${role}:${src_ref}`);
        console.log(existingChannel);
        // iterate through targets
        for(let i = 0; i < targets.length; i++) {
            let channelId;
            if(existingChannel.length > 0) {
                channelId = existingChannel[0].channel_id;
                await grantingJoin(targets[i], channelId);
            } else {
                channelId = await grantingCreate(role, targets[i], src_ref);
            }
            await createRoleAttribute(src_name, src_ref, targets[i], "persistent", role, channelId);
            abilityLog(`✅ <@${targets[i]}> was granted ${toTitleCase(role)} at <#${channelId}>.`);
            if(targets.length === 1) return { msg: "Granting succeeded!", success: true, target: `player:${targets[0]}` };
        }
        return { msg: "Grantings succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    /**
    Ability: Granting - Remove
    removes a role to a player
    **/
    this.grantingRemove = async function(src_name, src_ref, targets, role) {
        // get existing channel
        let existingChannel = await connectionGet(`${role}:${src_ref}`);
        if(existingChannel.length == 0) {
            abilityLog(`❎ <@${targets[0]}> could not be removed from ${toTitleCase(role)} - doesn't exist.`);  
            return { msg: "Grantings failed!", success: false, target: `player:${targets[0]}` };
        }
        let channelId = existingChannel[0].channel_id;
        // iterate through targets
        for(let i = 0; i < targets.length; i++) {
            await grantingLeave(targets[i], channelId);
            await deleteAttributePlayer(targets[i], "attr_type", "role", "val2", channelId); // delete old membership(s)
            abilityLog(`✅ <@${targets[i]}> was removed from ${toTitleCase(role)} at <#${channelId}>.`);
            if(targets.length === 1) return { msg: "Granting succeeded!", success: true, target: `player:${targets[0]}` };
        }
        return { msg: "Grantings succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    
    
    /**
    Granting: Join
    join a pre-existing granting role channel
    takes a target id and a channel id
    **/
    this.grantingJoin = async function(target, channelId) {
        return new Promise(async res => {
            // get channel
            let grantingChannel = await mainGuild.channels.fetch(channelId);
            // update channel permissions
            grantingChannel.permissionOverwrites.create(target, { ViewChannel: true}).then(sc => {
                let embed = basicEmbed(`<@${target}> was granted <#${grantingChannel.id}>.`, EMBED_GREEN);
                grantingChannel.send(embed);
                res();
            }).catch(async err => { 
                logO(err); 
                let embed = basicEmbed(`Failed to grant <#${grantingChannel.id}> to <@${target}>.`, EMBED_RED);
                grantingChannel.send(embed);
                res();
            });	
        });
    }
    
    /**
    Granting: Leave
    leave a granted role channel
    takes a target id and a channel id
    **/
    this.grantingLeave = async function(target, channelId) {
        return new Promise(async res => {
            // get channel
            let grantingChannel = await mainGuild.channels.fetch(channelId);
            // update channel permissions
            let overwrites = grantingChannel.permissionOverwrites.cache.get(target);
            if(!overwrites) {
                res(); // Nothing to remove!
                return;
            }
            overwrites.delete().then(sc => {
                let embed = basicEmbed(`<@${target}> was removed from <#${grantingChannel.id}>.`, EMBED_RED);
                grantingChannel.send(embed);
                res();
            }).catch(async err => { 
                logO(err); 
                let embed = basicEmbed(`Failed to remove <@${target}> from <#${grantingChannel.id}>.`, EMBED_RED);
                grantingChannel.send(embed);
                res();
            });	
        });
    }
    
    
    /** Granting: Create
    creates a role channel, takes a role name and a member id
    **/
    this.grantingCreate = async function(role, member, src_ref) {
        return new Promise(async res => {
            // Determine channel name
            let channelName = role.substr(0, 100);
            channelName = applyTheme(channelName);
            
            // get base sc permissions
            let scPerms = getSCCatPerms(mainGuild);
            
            // grant permissions to the channel to member
            scPerms.push(getPerms(member, ["history", "read"], []));
            
            // get last sc cat
            let category = await mainGuild.channels.fetch(cachedSCs[cachedSCs.length - 1]);
            
            // Create SC channel
            mainGuild.channels.create({ name: channelName, type: ChannelType.GuildText,  permissionOverwrites: scPerms, parent: category })
            .then(async sc => {
                // Create a default connection with the role and creators name
                connectionAdd(sc.id, `${role}:${src_ref}`);
                // Send info message for each role
                let infoEmbed = await getRoleEmbed(role, ["basics","details"], mainGuild);
                sendEmbed(sc, infoEmbed, true);

                // Move into sc category
                sc.setParent(category,{ lockPermissions: false }).then(m => {
                    // Success continue as usual
                }).catch(async err => { 
                    // Failure, Create a new SC Cat first
                    logO(err); 
                    await createNewSCCat(channel, sc);
                });	
                
                let embed = basicEmbed(`<@${member}> was granted <#${sc.id}>.`, EMBED_GREEN);
                sc.send(embed);

                // end of create channel callback
                res(sc.id);
            });
        });
        
    }
    
    
}
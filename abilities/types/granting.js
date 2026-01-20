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
        recentUngrantings = [];
        // check parameters
        if(!ability.target || !ability.role) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Granting failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        target = await applyRedirection(target, src_ref, ability.type, ability.subtype, additionalTriggerData);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Granting failed! " + abilityError, success: false };
            break;
            case "add":
                // can only grant exactly one role
                let role = await parseRoleSelector(ability.role, src_ref, additionalTriggerData);
                if(role.length != 1) {
                    abilityLog(`❗ **Error:** Tried to grant ${role.length} roles!`);
                    return { msg: "Granting failed! " + abilityError, success: false };
                }
                role = role[0];
                result = await grantingAdd(src_name, src_ref, target, role, additionalTriggerData);
                return result;
            break;
            case "remove":
                let activeExtraRole = await parseActiveExtraRoleSelector(ability.role, src_ref, additionalTriggerData);
                if(activeExtraRole.length != 1) {
                    abilityLog(`❗ **Error:** Tried to grant ${activeExtraRole.length} roles!`);
                    return { msg: "Ungranting failed! " + abilityError, success: false };
                }
                activeExtraRole = activeExtraRole[0];
                result = await grantingRemove(src_name, src_ref, target, activeExtraRole, additionalTriggerData);
                return result;
            break;
            case "transfer":
                // check parameters
                if(!ability.transfer_to) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
                    return { msg: "Transfer failed! " + abilityError, success: false };
                }
                // parse parameters
                let transferTo = await parsePlayerSelector(ability.transfer_to, src_ref, additionalTriggerData);
                let activeExtraRole2 = await parseActiveExtraRoleSelector(ability.role, src_ref, additionalTriggerData);
                if(activeExtraRole2.length != 1) {
                    abilityLog(`❗ **Error:** Tried to grant ${activeExtraRole2.length} roles!`);
                    return { msg: "Transfer failed! " + abilityError, success: false };
                }
                activeExtraRole2 = activeExtraRole2[0];
                result = await grantingTransfer(src_name, src_ref, target, transferTo, activeExtraRole2, additionalTriggerData);
                return result;
            break;
        }
    }
    
    
    /**
    Ability: Granting - Add
    adds a role to a player
    **/
    this.grantingAdd = async function(src_name, src_ref, targets, role, additionalTriggerData, channelOverride = null) {
        // get existing channel if applicable
        let existingChannel = await connectionGet(`${role}:${src_ref}`);
        if(channelOverride) existingChannel = [{ channel_id: channelOverride }]; // used by transfer
        // iterate through targets
        for(let i = 0; i < targets.length; i++) {
            // handle 
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets[i], role, NO_SND_VISIT_PARAM, "granting", "add");
                if(result) {
                    if(targets.length === 1) return visitReturn(result, "Granting failed!", "Granting succeeded!");
                    continue;
                }
            }
            
            let channelId;
            if(existingChannel.length > 0) {
                channelId = existingChannel[0].channel_id;
                await grantingJoin(targets[i], channelId);
            } else {
                channelId = await grantingCreate(role, targets[i], src_ref);
            }
            await createRoleAttribute(src_name, src_ref, targets[i], "persistent", role, channelId);
            assignDR(targets[i], role);
            abilityLog(`✅ <@${targets[i]}> was granted ${toTitleCase(role)} at <#${channelId}>.`);
            // run Starting trigger if new role
            if(existingChannel.length === 0) { 
                let latestRoleAttr = await queryAttribute("attr_type", "role");
                await triggerPlayerRoleAttributeByAttr(latestRoleAttr[latestRoleAttr.length - 1].ai_id, "Starting");
                await triggerPlayerRoleAttributeByAttr(latestRoleAttr[latestRoleAttr.length - 1].ai_id, "On Assigned");
            } else { // run on assigned
                let assignedRoleAttr = await queryAttribute("attr_type", "role", "val2", channelId);
                await triggerPlayerRoleAttributeByAttr(assignedRoleAttr[assignedRoleAttr.length - 1].ai_id, "On Assigned");
            }
            // return result
            if(targets.length === 1) return { msg: "Granting succeeded!", success: true, target: `player:${targets[0]}` };
        }
        return { msg: "Grantings succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    /**
    Ability: Granting - Remove
    removes a role to a player
    **/
    this.recentUngrantings = [];
    this.grantingRemove = async function(src_name, src_ref, targets, activeExtraRole, additionalTriggerData) {
        let channelId = activeExtraRole;
        let roleName = `<#${channelId}>`;
        // iterate through targets
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets[i], activeExtraRole, NO_SND_VISIT_PARAM, "granting", "remove");
                if(result) {
                    if(targets.length === 1) return visitReturn(result, "Ungranting failed!", "Ungranting succeeded!");
                    continue;
                }
            }
            
            // revoke discord role
            let queried = await queryAttributePlayer(targets[i], "attr_type", "role", "val2", channelId); // delete old membership(s)
            if(!queried) {
                return { msg: "Ungranting failed!", success: false, target: `player:${targets[0]}` };
            }
            unassignDR(targets[i], queried[0].val1);
            
            // leave
            await grantingLeave(targets[i], channelId);
            await deleteAttributePlayer(targets[i], "attr_type", "role", "val2", channelId); // delete old membership(s)
            abilityLog(`✅ <@${targets[i]}> was removed from ${roleName} at <#${channelId}>.`);
            recentUngrantings.push(channelId);
            if(targets.length === 1) return { msg: "Ungranting succeeded!", success: true, target: `player:${targets[0]}` };
        }
        return { msg: "Ungrantings succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    /**
    Ability: Granting - Transfer
    transfers a role from one player to another player
    **/
    this.grantingTransfer = async function(src_name, src_ref, targets, transferTo, activeExtraRole, additionalTriggerData) {
        let queried = await queryAttributePlayer(targets[0], "attr_type", "role", "val2", activeExtraRole); // query old role to get role name
        let remove = await grantingRemove(src_name, src_ref, targets, activeExtraRole, additionalTriggerData);
        let add = await grantingAdd(src_name, src_ref, transferTo, queried[0].val1, additionalTriggerData, activeExtraRole);
        
        if(add.success) return { msg: "Transfer succeeded!", success: true, target: `player:${transferTo[0]}` };
        else return { msg: "Transfer failed!", success: false, target: `player:${transferTo[0]}` };
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
            
            // remove mentor permissions
            let mentor = await getMentor(target); 
            if(mentor) {
                let overwrites = grantingChannel.permissionOverwrites.cache.get(mentor);
                if(overwrites) {
                    overwrites.delete();
                }
            }
            
            // remove normal permissions
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
            scPerms.push(getPerms(stats.ghost, ["write"], ["read"]));
            
            // get last sc cat
            let category = await mainGuild.channels.fetch(cachedSCs[cachedSCs.length - 1]);
            
            // Create SC channel
            mainGuild.channels.create({ name: channelName, type: ChannelType.GuildText,  permissionOverwrites: scPerms })
            .then(async sc => {
                // Create a default connection with the role and creators name
                connectionAdd(sc.id, `${role}:${src_ref}`);
                // Send info message for each role
                let infoEmbed = await getRoleEmbed(role, ["basics","details"], mainGuild);
                sendEmbed(sc, infoEmbed, true);
                
                // assign mentor permissions
                let mentor = await getMentor(member); 
                //console.log("GrantCreate", member, mentor);
                if(mentor) sc.permissionOverwrites.create(mentor, { ViewChannel: true, SendMessages: false });

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
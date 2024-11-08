/**
    Abilities Module - Joining / Groups
    The module for implementing groups / joining ability type
**/

module.exports = function() {
    /**
    Membership Types
    **/
    const membershipTypes = ["visitor","member","owner"];
    
    /**
    Get Membership Tier
    returns a value from 0-2 corresponding to the provided membership tier
    **/
    this.getMembershipTier = function(membership) {
        return membershipTypes.indexOf(membership);
    }
    
    /**
    Ability: Joining
    **/
    this.abilityJoining = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.group) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Joining failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        target = await applyRedirection(target, src_ref, ability.type, ability.subtype, additionalTriggerData);
        let group_name = await parseGroupName(ability.group);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Joining failed! " + abilityError, success: false };
            break;
            case "add":
                let mem_type = parseMembershipType(ability.membership_type ?? "member");
                let dur_type = parseDuration(ability.duration ?? "persistent");
                result = await joiningAdd(src_name, src_ref, target, group_name, mem_type, dur_type);
                return result;
            break;
            case "remove":
                result = await joiningRemove(src_name, src_ref, target, group_name);
                return result;
            break;
        }
    }
    
    /**
    Ability: Joining - Add
    adds a player (or several) to a group
    **/
    this.joiningAdd = async function(src_name, src_ref, targets, group, type, dur_type) {
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            let result = await visit(src_ref, targets[i], group, "joining", "add");
            if(result) {
                if(targets.length === 1) return visitReturn(result, "Joining failed!", "Joining succeeded!");
                continue;
            }
            
            // check if target is already part of the group
            let attrs = await queryAttributePlayer(targets[i], "attr_type", "group_membership", "val1", group);
            if(attrs.length > 1) { // already part of the group, skip
                abilityLog(`❎ <@${targets[i]}> could not join ${toTitleCase(group)} - multiple memberships found.`);  
                if(targets.length === 1) return { msg: "Joining failed! " + abilityFailure, success: false, target: `player:${targets[0]}` };
            } if(attrs.length == 1) { // already part of the group
                let oldMembership = getMembershipTier(attrs[0].val2)
                let newMembership = getMembershipTier(type);
                if(newMembership > oldMembership) { // new membership is higher than before, upgrade
                    await deleteAttributePlayer(targets[i], "attr_type", "group_membership", "val1", group); // delete old membership
                    await createGroupMembershipAttribute(src_name, src_ref, targets[i], dur_type, group, type); // create new membership
                    abilityLog(`✅ <@${targets[i]}> promoted ${toTitleCase(group)} membership to \`${toTitleCase(type)}\` for \`${getDurationName(dur_type)}\`.`);
                    if(targets.length === 1) return { msg: "Joining succeeded!", success: true, target: `player:${targets[0]}` };
                    // note: upgrading membership may downgrade duration. this is intentional (for simplicity)
                } else { // old tier is higher or equal, skip
                    abilityLog(`❎ <@${targets[i]}> could not join ${toTitleCase(group)} as \`${toTitleCase(type)}\` - equal or higher membership present.`);  
                    if(targets.length === 1) return { msg: "Joining failed! " + abilityFailure, success: false, target: `player:${targets[0]}` };
                }
            } else { // not part of the group,join
                await createGroupMembershipAttribute(src_name, src_ref, targets[i], dur_type, group, type);
                await groupsJoin(targets[i], group);
                abilityLog(`✅ <@${targets[i]}> joined ${toTitleCase(group)} as \`${toTitleCase(type)}\` for \`${getDurationName(dur_type)}\`.`);
                if(targets.length === 1) return { msg: "Joining succeeded!", success: true, target: `player:${targets[0]}` };
            }
        }
        return { msg: "Joinings executed!", success: null, target: `player:${targets[0]}` };
    }
    
    /**
    Ability: Joining - Remove
    removes a player from a group
    **/
    this.joiningRemove = async function(src_name, src_ref, targets, group) {
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            let result = await visit(src_ref, targets[i], group, "joining", "remove");
            if(result) {
                if(targets.length === 1) return visitReturn(result, "Joining failed!", "Joining succeeded!");
                continue;
            }
            
            // check if target is already part of the group
            let attrs = await queryAttributePlayer(targets[i], "attr_type", "group_membership", "val1", group);
            if(attrs.length > 0) { // in group, can be removed
                await deleteAttributePlayer(targets[i], "attr_type", "group_membership", "val1", group); // delete old membership(s)
                await groupsLeave(targets[i], group);
                abilityLog(`✅ <@${targets[i]}> was removed from ${toTitleCase(group)}.`);
                if(targets.length === 1) return { msg: "Joining succeeded!", success: true, target: `player:${targets[0]}` };
            } else { // no membership, cannot be removed
                abilityLog(`❎ <@${targets[i]}> could not be removed from ${toTitleCase(group)} - no membership present.`);  
                if(targets.length === 1) return { msg: "Joining failed! " + abilityFailure, success: false, target: `player:${targets[0]}` };
            }
        }
        return { msg: "Joinings executed!", success: null, target: `player:${targets[0]}` };
    }
    
    /**
    Groups: Join
    joins a group, creating it, if it doesnt exist
    takes a target id and a group name
    **/
    this.groupsJoin = async function(target, group) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(group), async result => {
                if(result && result[0]) {
                    // group exists, add target to group
                    let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                    
                    groupChannel.permissionOverwrites.create(target, { ViewChannel: true}).then(sc => {
                        let embed = basicEmbed(`<@${target}> has joined <#${groupChannel.id}>.`, EMBED_GREEN);
                        groupChannel.send(embed);
                        res();
                    }).catch(async err => { 
                        logO(err); 
                        let embed = basicEmbed(`Failed to add <@${target}> to <#${groupChannel.id}>.`, EMBED_RED);
                        groupChannel.send(embed);
                        res();
                    });	
                } else {
                    // group doesnt exist, create it
                    await groupsCreate(group, target); 
                    res();
                }
            });
        });
    }
    
    /**
    Groups: Leave
    leave a group
    takes a target id and a group name
    **/
    this.groupsLeave = async function(target, group) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(group), async result => {
                if(result && result[0]) {
                    // group exists, add target to group
                    let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                    groupChannel.permissionOverwrites.cache.get(target).delete().then(sc => {
                        let embed = basicEmbed(`<@${target}> has left <#${groupChannel.id}>.`, EMBED_RED);
                        groupChannel.send(embed);
                        res();
                    }).catch(async err => { 
                        // Failure, Create a new SC Cat first
                        logO(err); 
                        let embed = basicEmbed(`Failed to remove <@${target}> from <#${groupChannel.id}>.`, EMBED_RED);
                        groupChannel.send(embed);
                        res();
                    });	
                } else {
                    // group doesnt exist, create it
                    await groupsCreate(group, target); 
                    res();
                }
            });
        });
    }
    
    /**
    Groups: Send
    sends a message in a group that already exists
    Replaces $name with the channel name link
    **/
    this.groupsSend = async function(group, message) {
        return new Promise(res => {
            sql("SELECT * FROM active_groups WHERE name=" + connection.escape(group), async result => {
                if(result && result[0]) {
                    // group exists, add target to group
                    let groupChannel = await mainGuild.channels.fetch(result[0].channel_id);
                    let msg = message.replace(`\$name`, `<#${groupChannel.id}>`);
                    groupChannel.send(`${msg}`);
                }
            });
        });
    }
    
    /** Groups: Create
    creates a group, takes a group name and optional first member id
    WIP: should probably be in groups
    **/
    this.groupsCreate = async function(group, firstMember = null) {
        return new Promise(async res => {
            // Determine channel name
            let channelName = group.substr(0, 100);
            channelName = applyTheme(channelName);
            
            // get base sc permissions
            let scPerms = getSCCatPerms(mainGuild);
            
            // if a first member is specified, grant them permissions to the channel
            if(firstMember) {
                scPerms.push(getPerms(firstMember, ["history", "read"], []));
            }
            
            // get last sc cat
            let category = await mainGuild.channels.fetch(cachedSCs[cachedSCs.length - 1]);
            
            // Create SC channel
            mainGuild.channels.create({ name: channelName, type: ChannelType.GuildText,  permissionOverwrites: scPerms })
            .then(async sc => {
                // Create a default connection with the groups name
                connectionAdd(sc.id, group);
                // Send info message for each role
                let infoEmbed = await getGroupEmbed(group, ["basics","details"], mainGuild);
                sendEmbed(sc, infoEmbed, true);

                // Move into sc category
                sc.setParent(category,{ lockPermissions: false }).then(m => {
                    // Success continue as usual
                }).catch(async err => { 
                    // Failure, Create a new SC Cat first
                    logO(err); 
                    await createNewSCCat(channel, sc);
                });	
                
                // announce new group
                if(firstMember) {
                    let embed = basicEmbed(`<@${firstMember}> has created <#${sc.id}>.`, EMBED_GREEN);
                    sc.send(embed);
                } else {
                    let embed = basicEmbed(`<#${sc.id}> has been created.`, EMBED_GREEN);
                    sc.send(embed);
                }
                
                // save group in DB
                await sqlProm("INSERT INTO active_groups (name, channel_id) VALUES (" + connection.escape(group) + "," + connection.escape(sc.id) + ")");
                
                // end of create channel callback
                res();
            });
        });
        
    }
    
}
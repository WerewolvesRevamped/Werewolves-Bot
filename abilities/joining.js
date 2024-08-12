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
    this.abilityJoining = async function(pid, src_role, ability) {
        let result;
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return "Joining failed! " + abilityError;
            break;
            case "add":
                if(!ability.target || !ability.group) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                let mem_type = parseMembershipType(ability.membership_type ?? "member");
                let dur_type = parseDuration(ability.duration ?? "persistent");
                result = await joiningAdd(src_role, pid, await parsePlayerSelector(ability.target, pid), parseGroupName(ability.group), mem_type, dur_type);
                return result;
            break;
            case "remove":
                if(!ability.target || !ability.group) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`${ability.subtype}\`!`);
                }
                result = await joiningRemove(src_role, pid, await parsePlayerSelector(ability.target, pid), parseGroupName(ability.group));
                return result;
            break;
        }
    }
    
    /**
    Ability: Joining - Add
    adds a player (or several) to a group
    **/
    this.joiningAdd = async function(src_role, src_player, targets, group, type, dur_type) {
        for(let i = 0; i < targets.length; i++) {
            // check if target is already part of the group
            let attrs = await queryAttributePlayer(targets[i], "val1", group);
            if(attrs.length > 1) { // already part of the group, skip
                abilityLog(`❎ <@${targets[i]}> could not join ${toTitleCase(group)} - multiple memberships found.`);  
                if(targets.length === 1) return "Joining failed! " + abilityError;
            } if(attrs.length == 1) { // already part of the group
                let oldMembership = getMembershipTier(attrs[0].val2)
                let newMembership = getMembershipTier(type);
                if(newMembership > oldMembership) { // new membership is higher than before, upgrade
                    await deleteAttributePlayer(targets[i], "val1", group); // delete old membership
                    await createGroupMembershipAttribute(src_role, src_player, targets[i], dur_type, group, type); // create new membership
                    abilityLog(`✅ <@${targets[i]}> promoted ${toTitleCase(group)} membership to \`${toTitleCase(type)}\` for \`${getDurationName(dur_type)}\`.`);
                    if(targets.length === 1) return "Joining succeeded!";
                    // note: upgrading membership may downgrade duration. this is intentional (for simplicity)
                } else { // old tier is higher or equal, skip
                    abilityLog(`❎ <@${targets[i]}> could not join ${toTitleCase(group)} as \`${toTitleCase(type)}\` - equal or higher membership present.`);  
                    if(targets.length === 1) return "Joining failed! " + abilityError;
                }
            } else { // not part of the group,join
                await createGroupMembershipAttribute(src_role, src_player, targets[i], dur_type, group, type);
                await groupsJoin(targets[i], group);
                abilityLog(`✅ <@${targets[i]}> joined ${toTitleCase(group)} as \`${toTitleCase(type)}\` for \`${getDurationName(dur_type)}\`.`);
                if(targets.length === 1) return "Joining succeeded!";
            }
        }
        return "Joinings executed!";
    }
    
    /**
    Ability: Joining - Remove
    removes a player from a group
    **/
    this.joiningRemove = async function(src_role, src_player, targets, group) {
        for(let i = 0; i < targets.length; i++) {
            // check if target is already part of the group
            let attrs = await queryAttributePlayer(targets[i], "val1", group);
            if(attrs.length > 0) { // in group, can be removed
                await deleteAttributePlayer(targets[i], "val1", group); // delete old membership(s)
                groupsSend(group, `<@${targets[i]}> has left $name.`);
                abilityLog(`✅ <@${targets[i]}> was removed from ${toTitleCase(group)}.`);
                if(targets.length === 1) return "Joining succeeded!";
            } else { // no membership, cannot be removed
                abilityLog(`❎ <@${targets[i]}> could not be removed from ${toTitleCase(group)} - no membership present.`);  
                if(targets.length === 1) return "Joining failed! " + abilityError;
            }
        }
        return "Joinings executed!";
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
                        groupChannel.send(`<@${target}> has joined <#${groupChannel.id}>.`);
                        res();
                    }).catch(async err => { 
                        // Failure, Create a new SC Cat first
                        logO(err); 
                        groupChannel.send(`Failed to add <@${target}> to <#${groupChannel.id}>.`);
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
            mainGuild.channels.create({ name: group, type: ChannelType.GuildText,  permissionOverwrites: scPerms, parent: category })
            .then(async sc => {
                // Create a default connection with the groups name
                cmdConnectionAdd(sc, ["", group], true);
                // Send info message for each role
                let infoEmbed = await getGroupEmbed(group, ["basics","details"], mainGuild);
                sendEmbed(sc, infoEmbed, true);

                // Move into sc category
                sc.setParent(category,{ lockPermissions: false }).then(m => {
                    // Success continue as usual
                }).catch(async err => { 
                    // Failure, Create a new SC Cat first
                    logO(err); 
                    let newCategory = await createNewSCCat(channel, sc);
                });	
                
                // announce new group
                if(firstMember) {
                    sc.send(`<@${firstMember}> has created <#${sc.id}>.`);
                } else {
                    sc.send(`<#${sc.id}> has been created.`);
                }
                
                // save group in DB
                await sqlProm("INSERT INTO active_groups (name, channel_id) VALUES (" + connection.escape(group) + "," + connection.escape(sc.id) + ")");
                
                // end of create channel callback
                res();
            });
        });
        
    }
    
}
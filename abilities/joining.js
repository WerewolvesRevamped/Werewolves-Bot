/**
    Abilities Module - Joining / Groups
    The module for implementing groups / joining ability type
**/

module.exports = function() {
    /**
    Ability: Joining
    **/
    this.abilityJoining = async function(pid, src_role, ability) {
        switch(ability.subtype) {
            default:
                log("UNKNOWN ABILITY SUBTYPE", JSON.stringify(ability));
            break;
            case "add":
                await joiningAdd(src_role, pid, parsePlayerSelector(ability.target, pid), parseGroupName(ability.group), ability.membership_type, ability.duration);
            break;
            case "remove":
                await joiningRemove(src_role, pid, parsePlayerSelector(ability.target), parseGroupName(ability.group));
            break;
        }
    }
    
    /**
    Ability: Joining - Add
    adds a player (or several) to a group
    **/
    this.joiningAdd = async function(src_role, src_player, targets, group, type, duration) {
        console.log("JOINING ADD", targets, group, type, duration);
        let dur_type = parseDuration(duration);
        for(let i = 0; i < targets.length; i++) {
            /** WIP: THIS SHOULD FIRST CHECK FOR AN ALREADY EXISTING MEMBERSHIP ATTRIBUTE **/
            await createGroupMembershipAttribute(src_role, src_player, targets[i], dur_type, group, type);
            await groupsJoin(targets[i], group);
        }
    }
    
    /**
    Ability: Joining - Remove
    removes a player from a group
    **/
    this.joiningRemove = async function(src_role, src_player, targets, group) {
        console.log("JOINING REMOVE", target, group);
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
                        sc.send(`<@${target}> has joined <#${groupChannel.id}>.`);
                        res();
                    }).catch(async err => { 
                        // Failure, Create a new SC Cat first
                        logO(err); 
                        sc.send(`Failed to add <@${target}> to <#${groupChannel.id}>.`);
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
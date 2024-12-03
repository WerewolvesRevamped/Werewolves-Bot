/**
    Abilities Module - Changing
    The module for implementing changing ability type
**/

module.exports = function() {
    
    /**
    Ability: Changing
    **/
    this.abilityChanging = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.change_to) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Changing failed! " + abilityError, success: false };
        }
        
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Changing failed! " + abilityError, success: false };
            break;
            case "role":
                // parse parameters
                let targetsRole = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
                targetsRole = await applyRedirection(targetsRole, src_ref, ability.type, ability.subtype, additionalTriggerData);
                let roles = await parseRoleSelector(ability.change_to, src_ref, additionalTriggerData);
                // can only apply a single attribute
                if(roles.length != 1) {
                    abilityLog(`❗ **Error:** Tried to change to ${roles.length} roles!`);
                    return { msg: "Changing failed! " + abilityError, success: false };
                }
                result = await changingRole(src_name, src_ref, targetsRole, roles[0], additionalTriggerData);
                return result;
            break;
            case "alignment":
                // parse parameters
                let targetsAlignment = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
                targetsAlignment = await applyRedirection(targetsAlignment, src_ref, ability.type, ability.subtype, additionalTriggerData);
                let alignments = await parseAlignment(ability.change_to, src_ref, additionalTriggerData);
                // can only apply a single attribute
                if(alignments.length != 1) {
                    abilityLog(`❗ **Error:** Tried to change to ${alignments.length} alignments!`);
                    return { msg: "Changing failed! " + abilityError, success: false };
                }
                result = await changingAlignment(src_name, src_ref, targetsAlignment, alignments[0], additionalTriggerData);
                return result;
            break;
            case "group":
                // parse parameters
                let targetsGroup = await parseGroup(ability.target, src_ref, additionalTriggerData);
                targetsGroup = await applyRedirection(targetsGroup, src_ref, ability.type, ability.subtype, additionalTriggerData);
                // group must exist
                if(!targetsGroup) {
                    abilityLog(`❗ **Error:** Tried to change a group that doesn't exist!`);
                    return { msg: "Changing failed! " + abilityError, success: false };
                }
                let group = parseGroupName(selectorGetTarget(ability.change_to));
                // group must exist
                if(!group) {
                    abilityLog(`❗ **Error:** Tried to change to a group that doesn't exist!`);
                    return { msg: "Changing failed! " + abilityError, success: false };
                }
                result = await changingGroup(src_name, src_ref, targetsGroup, group, additionalTriggerData);
                return result;
            
            break;
        }
    }
    
    
    /**
    Ability: Changing - Role
    changes a player's role
    **/
    this.changingRole = async function(src_name, src_ref, targets, role, additionalTriggerData) {
        // get role image
        let img = null;
        let refImg = await refToImg(`role:${role}`);
        if(refImg) {
            img = refImg;
        }

        // iterate through targets
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets[i], role, "changing", "role");
                if(result) {
                    if(targets.length === 1) return visitReturn(result, "Changing failed!", "Changing succeeded!");
                    continue;
                }
            }
            
            let isPlayerLoyal = await isLoyal(targets[i]);
            if(isPlayerLoyal) {
                // log
                abilityLog(`❎ <@${targets[i]}> role change failed due to loyalty.`);
                if(targets.length === 1) return { msg: "Changing failed!", success: false, target: `player:${targets[0]}` };
                continue;
            }
            
            // save old role
            let oldRole = await sqlPromOneEsc("SELECT role FROM players WHERE id=",  targets[i]);
            
            // update player role
            await setPlayerRole(targets[i], role);
            getPRoles();
            
            // delete all "permanent" attributes
            await deleteAttributePlayer(targets[i], "duration", "permanent");
            
            // convert group memberships to visitor
            let groupMembershipsMember = await queryAttributePlayer(targets[i], "attr_type", "group_membership", "val2", "member");
            let groupMembershipsOwner = await queryAttributePlayer(targets[i], "attr_type", "group_membership", "val2", "owner");
            for(let j = 0; j < groupMembershipsMember.length; j++) {
                await updateAttributeVal2(groupMembershipsMember[j].ai_id, "visitor");
                let groupData = await groupGetData(groupMembershipsMember[j].val1);
                await triggerGroup(groupData.channel_id, "On Betrayal", { });
                abilityLog(`✅ <@${targets[i]}> demoted ${toTitleCase(groupMembershipsMember[j].val1)} membership to \`Visitor\`.`);
            }
            for(let j = 0; j < groupMembershipsOwner.length; j++) {
                await updateAttributeVal2(groupMembershipsOwner[j].ai_id, "visitor");
                let groupData = await groupGetData(groupMembershipsMember[j].val1);
                await triggerGroup(groupData.channel_id, "On Betrayal", { });
                abilityLog(`✅ <@${targets[i]}> demoted ${toTitleCase(groupMembershipsOwner[j].val1)} membership to \`Visitor\`.`);
            }
            
            // delete open prompts
            await sqlPromEsc("DELETE FROM prompts WHERE src_ref=" + connection.escape(`player:${targets[i]}`) + " AND src_name=", `role:${oldRole.role}`);
            await sqlPromEsc("DELETE FROM action_queue WHERE src_ref=" + connection.escape(`player:${targets[i]}`) + " AND src_name=", `role:${oldRole.role}`);
            
            // run starting trigger
            await triggerPlayerRole(targets[i], "Starting");
            
            // new role info embed
            let channel_id = await getSrcRefChannel(`player:${targets[i]}`);
            if(channel_id) {
                // get info embed
                infoEmbed = await getRoleEmbed(role, ["basics", "details"], mainGuild);
                // get channel
                let sc = mainGuild.channels.cache.get(channel_id);
                // send embed
                sendEmbed(sc, infoEmbed, true);
                
                // rename channel
                sc.edit({ name: role });
            }
            
            // role change info embed
            await abilitySendProm(`player:${targets[i]}`, `Your role has changed to \`${toTitleCase(role)}\`!`, EMBED_PURPLE, true, false, img, "Role Change");
            
            // role change trigger
            await triggerPlayer(targets[i], "On Role Change", { role_changer: srcToValue(src_ref) }); 
            
            // passive
            await triggerHandler("Passive");
            
            // log
            abilityLog(`✅ <@${targets[i]}> role changed to \`${toTitleCase(role)}\`.`);
            
            // return result
            if(targets.length === 1) return { msg: "Changing succeeded!", success: true, target: `player:${targets[0]}` };
        }
        return { msg: "Changings succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    /**
    Ability: Changing - Alignment
    changes a player's alignment
    **/
    this.changingAlignment = async function(src_name, src_ref, targets, alignment, additionalTriggerData) {
        // get alignment image
        let img = null;
        let refImg = await refToImg(`alignment:${alignment}`);
        if(refImg) {
            img = refImg;
        }
        // iterate through targets
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets[i], alignment, "changing", "alignment");
                if(result) {
                    if(targets.length === 1) return visitReturn(result, "Changing failed!", "Changing succeeded!");
                    continue;
                }
            }
            
            let isPlayerLoyal = await isLoyal(targets[i]);
            if(isPlayerLoyal) {
                // log
                abilityLog(`❎ <@${targets[i]}> alignment change failed due to loyalty.`);
                if(targets.length === 1) return { msg: "Changing failed!", success: false, target: `player:${targets[0]}` };
                continue;
            }
            
            // update player alignment
            await setPlayerAlignment(targets[i], alignment);
            
            // alignment change info embed
            await abilitySendProm(`player:${targets[i]}`, `Your alignment has changed to \`${toTitleCase(alignment)}\`!`, EMBED_PURPLE, true, false, img, "Alignment Change");
            
            // passive
            await triggerHandler("Passive");
            
            // log
            abilityLog(`✅ <@${targets[i]}> alignment changed to \`${toTitleCase(alignment)}\`.`);
            
            // return result
            if(targets.length === 1) return { msg: "Changing succeeded!", success: true, target: `player:${targets[0]}` };
        }
        return { msg: "Changings succeeded!", success: true, target: `player:${targets[0]}` };
    }
    
    /**
    Ability: Changing - Group
    changes a groups's group
    **/
    this.changingGroup = async function(src_name, src_ref, group, newGroupName, additionalTriggerData) {
        // get role image
        let img = null;
        let refImg = await refToImg(`group:${newGroupName}`);
        if(refImg) {
            img = refImg;
        }
        
        // get old group name
        let oldGroupData = await sqlPromOneEsc("SELECT * FROM active_groups WHERE channel_id=", group);
        
        // update group group
        await sqlProm("UPDATE active_groups SET name=" + connection.escape(newGroupName) + " WHERE channel_id=" + connection.escape(group));
        
        // delete all "permanent" attributes
        let attrs = await queryAttribute("owner_type", "group", "owner", group, "duration", "permanent");
        for(let i = 0; i < attrs.length; i++) {
            await deleteAttribute(attrs[i].ai_id);
        }
        
        // convert all group memberships
        let attrsOldMems = await queryAttribute( "attr_type", "group_membership", "val1", oldGroupData.name);
        for(let i = 0; i < attrsOldMems.length; i++) {
            await updateAttributeVal1(attrsOldMems[i].ai_id, newGroupName);
        }
        
        // run starting trigger
        await trigger(`group:${group}`, "Starting");
        
        // new group info embed
        // get info embed
        infoEmbed = await getGroupEmbed(newGroupName, ["basics","details"], mainGuild);
        // get channel
        let sc = mainGuild.channels.cache.get(group);
        // send embed
        sendEmbed(sc, infoEmbed, true);
        
        // rename channel
        sc.edit({ name: newGroupName });
        
        // group change info embed
        await abilitySendProm(`group:${group}`, `This group has changed to \`${toTitleCase(newGroupName)}\`!`, EMBED_PURPLE, true, false, img, "Group Change");
        
        // passive
        await triggerHandler("Passive");
        
        // log
        abilityLog(`✅ <#${group}> group changed to \`${toTitleCase(newGroupName)}\`.`);
            
        return { msg: "Changings succeeded!", success: true, target: `group:${group}` };
    }

    /** PUBLIC
    Set Role
    set the role value for a player
    // WIP: Maybe this should be in player module
    **/
    this.setPlayerRole = async function(player_id, role) {
        let parsedRole = parseRole(role);
        let roleData = await getRoleDataFromName(parsedRole);
        return sqlProm("UPDATE players SET role=" + connection.escape(parsedRole) + ",alignment=" + connection.escape(roleData.team) + " WHERE id=" + connection.escape(player_id));
    }
    
    /** PUBLIC
    Set Alignment
    set the alignment value for a player
    // WIP: Maybe this should be in player module
    **/
    this.setPlayerAlignment = async function(player_id, alignment) {
        let parsedAlignment = parseTeam(alignment);
        return sqlProm("UPDATE players SET alignment=" + connection.escape(parsedAlignment) + " WHERE id=" + connection.escape(player_id));
    }
    
    
}
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
                result = await joiningAdd(src_name, src_ref, target, group_name, mem_type, dur_type, additionalTriggerData);
                await updateGroups();
                return result;
            break;
            case "remove":
                result = await joiningRemove(src_name, src_ref, target, group_name, additionalTriggerData);
                await updateGroups();
                return result;
            break;
        }
    }
    
    /**
    Ability: Joining - Add
    adds a player (or several) to a group
    **/
    this.joiningAdd = async function(src_name, src_ref, targets, group, type, dur_type, additionalTriggerData) {
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets[i], group, "joining", "add");
                if(result) {
                    if(targets.length === 1) return visitReturn(result, "Joining failed!", "Joining succeeded!");
                    continue;
                }
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
                    if(targets.length === 1) return { msg: "Joining failed!", success: false, target: `player:${targets[0]}` };
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
    this.joiningRemove = async function(src_name, src_ref, targets, group, additionalTriggerData) {
        for(let i = 0; i < targets.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets[i], group, "joining", "remove");
                if(result) {
                    if(targets.length === 1) return visitReturn(result, "Joining failed!", "Joining succeeded!");
                    continue;
                }
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
    
}
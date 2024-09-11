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
                let targets = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
                let roles = await parseRoleSelector(ability.change_to, src_ref, additionalTriggerData);
                // can only apply a single attribute
                if(roles.length != 1) {
                    abilityLog(`❗ **Error:** Tried to change to ${roles.length} roles!`);
                    return { msg: "Changing failed! " + abilityError, success: false };
                }
                result = await changingRole(src_name, src_ref, targets, roles[0]);
                return result;
            break;
        }
    }
    
    
    /**
    Ability: Applying - Add
    adds an attribute to a player
    **/
    this.changingRole = async function(src_name, src_ref, targets, role) {
        // get role image
        let img = null;
        let refImg = await refToImg(`role:${role}`);
        if(refImg) {
            img = refImg;
        }
        // iterate through targets
        for(let i = 0; i < targets.length; i++) {
            // update player role
            await setPlayerRole(targets[i], role);
            
            // run starting trigger
            await triggerPlayerRole(targets[i], "Starting");
            
            // new role info embed
            let channel_id = await getSrcRefChannel(src_ref);
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
            
            // return result
            if(targets.length === 1) return { msg: "Changing succeeded!", success: true, target: `player:${targets[0]}` };
        }
        return { msg: "Changing succeeded!", success: true, target: `player:${targets[0]}` };
    }
    

    /** PUBLIC
    Set Living Status
    set the alive value for a player
    // WIP: Maybe this should be in player module
    **/
    this.setPlayerRole = async function(player_id, role) {
        let parsedRole = parseRole(role);
        let roleData = await getRoleDataFromName(parsedRole);
        return sqlProm("UPDATE players SET role=" + connection.escape(parsedRole) + ",alignment=" + connection.escape(roleData.team) + " WHERE id=" + connection.escape(player_id));
    }
    
    
}
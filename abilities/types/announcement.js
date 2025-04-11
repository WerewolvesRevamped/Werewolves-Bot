/**
    Abilities Module - Announcement
    The module for implementing announcement
**/

module.exports = function() {
    
    /**
    Ability: Announcement
    **/
    this.abilityAnnouncement = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.info) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Announcement failed! " + abilityError, success: false };
        }
        let info = await parseInfo(ability.info, src_ref, additionalTriggerData);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Announcement failed! " + abilityError, success: false };
            break;
            case "immediate":
                // check parameters
                if(!ability.target) {
                    abilityLog(`❗ **Error:** Missing arguments for subtype \`immediate\`!`);
                    return { msg: "Announcement failed! " + abilityError, success: false };
                }
                // parse parameters
                let loc = await parseLocation(ability.target, src_ref, additionalTriggerData);
                if(loc.type == null) return { msg: "Announcement failed! " + abilityError, success: false }; // no location found
                loc.value = await applyRedirection(loc.value, src_ref, ability.type, ability.subtype, additionalTriggerData);
                // execute
                result = await announcementImmediate(src_ref, info, loc, additionalTriggerData);
                return result;
            break;
            case "buffer":
                result = await announcementBuffer(src_ref, info, ability, additionalTriggerData);
                doStorytimeCheck();
                return result;
            break;
        }
    }
                
        
        
    /** PRIVATE
    Ability: Announcement - Immediate
    **/
     async function announcementBuffer(src_ref, info, additionalTriggerData) {
        // buffer
        await bufferStorytime(info);
        // return
        return { msg: "", success: false };
     }
     
     
    /** PRIVATE
    Ability: Announcement - Immediate
    **/
     this.announcementImmediate = async function(src_ref, info, loc, additionalTriggerData) {
        let result;
        if(!(".;!?\"'-`".split("").includes(info[info.length - 1]))) info += ".";
        // get role image if applicable
        let spl = info.split(" ");
        let img = null;
        for(let i = 0; i < spl.length; i++) {
            // two word roles 
            if(i+1 < spl.length) {
                let parsedRole1 = parseRole(spl[i] + " " + spl[i+1]);
                if(verifyRole(parsedRole1)) {
                    let refImg = await refToImg(`role:${parsedRole1}`);
                    if(refImg) {
                        img = refImg;
                        break;
                    }
                }
            }
            
            // one word roles
            if(spl[i].length > 4) { // avoid really short aliases
                let parsedRole2 = parseRole(spl[i]);
                if(verifyRole(parsedRole2)) {
                    let refImg = await refToImg(`role:${parsedRole2}`);
                    if(refImg) {
                        img = refImg;
                        break;
                    }
                }
            }
        }
        
        // send different type of message depending on type
        switch(loc.type) {
            case "location":
                locationSend(loc.value, info, EMBED_GRAY, img, "Announcement");
            break;
            case "player":
                // handle visit
                if(additionalTriggerData.parameters.visitless !== true) {
                    let result = await visit(src_ref, loc.value, info, NO_SND_VISIT_PARAM, "announcement", "immediate");
                    if(result) return visitReturn(result, "Announcement failed!", "");
                }
            
                abilitySend(`player:${loc.value}`, info, EMBED_GRAY, false, false, img, "Announcement");
            break;
            case "players":
                for(let i = 0; i < loc.value.length; i++) {
                    // handle visit
                    if(additionalTriggerData.parameters.visitless !== true) {
                        let result = await visit(src_ref, loc.value[i], info, NO_SND_VISIT_PARAM, "announcement", "immediate");
                        if(result) return visitReturn(result, "Announcement failed!", "");
                    }
                
                    abilitySend(`player:${loc.value[i]}`, info, EMBED_GRAY, false, false, img, "Announcement");
                }
            break;
            case "player_attr":
                abilitySend(`player_attr:${loc.value}`, info, EMBED_GRAY, false, false, img, "Announcement");
            break;
            case "group":
                abilitySend(`group:${loc.value}`, info, EMBED_GRAY, false, false, img, "Announcement");
            break;
            case "channel":
                abilitySend(`channel:${loc.value}`, info, EMBED_GRAY, false, false, img, "Announcement");
            break;
        }
        
        return { msg: "", success: false };

    }
    
    
}
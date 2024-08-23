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
        if(!ability.target || !ability.info) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Announcement failed! " + abilityError, success: false };
        }
        // parse parameters
        let loc = await parseLocation(ability.target, src_ref, additionalTriggerData);
        let info = await parseInfo(ability.info, src_ref, additionalTriggerData);
        
        // get role image if applicable
        let spl = info.split(" ");
        let img = null;
        for(let i = 0; i < spl.length; i++) {
            let parsedRole = parseRole(spl[i]);
            if(verifyRole(parsedRole)) {
                let refImg = await refToImg(`role:${parsedRole}`);
                if(refImg) {
                    img = refImg;
                    break;
                }
            }
        }
        
        // send different type of message depending on type
        switch(loc.type) {
            case "location":
                locationSend(loc.value, info, EMBED_GRAY, img, "Announcement");
            break;
            case "player":
                abilitySend(`player:${loc.value}`, info, EMBED_GRAY, false, false, img, "Announcement");
            break;
            case "group":
                abilitySend(`group:${loc.value}`, info, EMBED_GRAY, false, false, img, "Announcement");
            break;
        }
        
        return { msg: "Announcement succeeded!", success: false };

    }
    
    
}
/**
    Abilities Module - Displaying
    The module for implementing displays
**/

module.exports = function() {
    
    /**
    Ability: Displaying
    **/
    this.abilityDisplaying = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.display) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Displaying failed! " + abilityError, success: false };
        }
        let display = parseDisplay(ability.display, src_ref, additionalTriggerData);
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Displaying failed! " + abilityError, success: false };
            break;
            case "create":
                result = await displayingCreate(src_ref, additionalTriggerData, display, ability.val1 ?? "", ability.val2 ?? "", ability.val3 ?? "", ability.val4 ?? "");
                return result;
            break;
            case "change":
                // check parameters
                if(!ability.display_value || !ability.display_index) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
                    return { msg: "Displaying failed! " + abilityError, success: false };
                }
                let newValue = await parseDisplayValue(ability.display_value, src_ref, additionalTriggerData);
                let newValueIndex = + ability.display_index;
                result = await displayingUpdate(src_ref, additionalTriggerData, display, newValueIndex, newValue);
                return result;
            break;
        }
    }
                
    /** PRIVATE
    Ability: Displaying - Create
    **/
     async function displayingCreate(src_ref, additionalTriggerData, display, val1, val2, val3, val4) {
         let values = await parseDisplayValues(val1, val2, val3, val4, src_ref, additionalTriggerData);
         
         // get display embed
         let embed = await getDisplayEmbed(display, values);
         
         // get display to channel
         let channel_id = await getSrcRefChannel(src_ref);
        if(!channel_id) return;
        let sc = mainGuild.channels.cache.get(channel_id);
        
        let msg = await sendEmbed(sc, embed, true);
        
        await sqlProm("INSERT INTO active_displays (name, src_ref, val1, val2, val3, val4, message_id, channel_id) VALUES (" + connection.escape(display) + "," + connection.escape(src_ref) + "," + connection.escape(val1) + "," + connection.escape(val2) + "," + connection.escape(val3) + "," + connection.escape(val4) + "," + connection.escape(msg.id) + "," + connection.escape(channel_id) + ")");
        
        // return
        return { msg: "", success: true };
     }
     
     /** PRIVATE
     Ability. Displaying - Update
     **/
     async function displayingUpdate(src_ref, additionalTriggerData, display, newValueIndex, newValue) {
         let displayData = await sqlPromOneEsc("SELECT * FROM active_displays WHERE name=" + connection.escape(display) + " AND src_ref=", src_ref);
         if(!displayData) {
            abilityLog(`❗ **Error:** Could not find active display \`${display}\` for ${srcRefToText(src_ref)}!`);
            return { msg: "Displaying failed! " + abilityError, success: false };
         }
         
         let val1 = newValueIndex === 1 ? newValue : displayData.val1;
         let val2 = newValueIndex === 2 ? newValue : displayData.val2;
         let val3 = newValueIndex === 3 ? newValue : displayData.val3;
         let val4 = newValueIndex === 4 ? newValue : displayData.val4;
         
        
        await sqlProm("UPDATE active_displays SET val1=" + connection.escape(val1) + ",val2=" + connection.escape(val2) + ",val3=" + connection.escape(val3) + ",val4=" + connection.escape(val4) + " WHERE name=" + connection.escape(display) + " AND src_ref=" + connection.escape(src_ref));
         
         let values = await parseDisplayValues(val1, val2, val3, val4, src_ref, additionalTriggerData);
         
         // get display embed
         let embed = await getDisplayEmbed(display, values);
         
        // get display message
        let displayChannel = await mainGuild.channels.fetch(displayData.channel_id);
        let displayMessage = await displayChannel.messages.fetch(displayData.message_id);
        
        // edit display
        await displayMessage.edit({ embeds: [ embed ] });
        
        // return
        return { msg: "", success: true };
     }
     
     /** PUBLIC
     Parse display values
     **/
     this.parseDisplayValues = async function(val1, val2, val3, val4, src_ref, additionalTriggerData) {
         let val1p = val1 === "" ? "" : await parseDisplayValue(val1, src_ref, additionalTriggerData);
         let val2p = val2 === "" ? "" : await parseDisplayValue(val2, src_ref, additionalTriggerData);
         let val3p = val3 === "" ? "" : await parseDisplayValue(val3, src_ref, additionalTriggerData);
         let val4p = val4 === "" ? "" : await parseDisplayValue(val4, src_ref, additionalTriggerData);
         return [["$1", val1p], ["$2", val2p], ["$3", val3p], ["$4", val4p]];
     }
}
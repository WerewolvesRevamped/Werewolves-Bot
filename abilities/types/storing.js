/**
    Abilities Module - Storing
    The module for implementing storing
**/

module.exports = function() {
    
    /** PUBLIC
    Ability: Storing
    **/
    this.abilityStoring = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.selector) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Storing failed! " + abilityError, success: false };
        }
       
       // parse the selector
        let parsed = await parseSelector(ability.selector, src_refAction, additionalTriggerData);
        
        // store to the respective result field
        let res = { msg: "", success: true };
        let val0 = parsed.value[0];
        switch(parsed.type) {
            case "alignment":
                res.alignment = val0;
            break;
            case "role":
                res.role = val0;
            break;
            case "category":
                res.category = val0;
            break;
            case "class":
                res.class = val0;
            break;
            case "result":
                res.result = val0;
            break;
            case "success":
                res.success = val0;
            break;
            default:
                abilityLog(`❗ **Error:** Unknow type \`${parsed.type}\` to be stored!`);
                return { msg: "Storing failed! " + abilityError, success: false };
            break;
        }
        
        // feedback
        if(targets.value.length > 0) {
            return res;
        } else {
            return { msg: "Storing failed!", success: false };
        }
    }
    
    
}
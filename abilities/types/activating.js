/**
    Abilities Module - Activating
    The module for implementing activating
**/

module.exports = function() {
    
    /**
    Ability: Activating
    **/
    this.abilityActivating = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.target || !ability.state) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Activating failed! " + abilityError, success: false };
        }
        // get target
        const targets = await parseSelector(ability.target, src_ref, additionalTriggerData);
        
        for(let i = 0; i < targets.value.length; i++) {
            switch(targets.type) {
                case "player":
                    setActivation(targets.value[i], ability.state);
                break;
                case "player_attr":
                    let queried = await queryAttribute("attr_type", "role", "val2", targets.value[i]);
                    updateAttributeActivation(queried[0].ai_id, ability.state);
                break;
                case "attribute":
                    updateAttributeActivation(targets.value[i], ability.state);
                break;
                default:
                    abilityLog(`❗ **Error:** Cannot activate type \`${targets.type}\`!`);
                    return { msg: "Activating failed! " + abilityError, success: false };            
                break;
            }
            abilityLog(`👻 ${srcRefToText(targets.type + ":" + targets.value[i])} was activated for ${ability.state}.`);
        }
        
        // return
        return { msg: "Activating succeeded!", success: true };
    }
    
}
/**
    Abilities Module - Log
    The module for implementing the debug log ability
**/

module.exports = function() {
    
    /** PUBLIC
    Ability: Log
    **/
    this.abilityLogging = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.selector) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return "Logging failed! " + abilityError;
        }
        if(!ability.info) ability.info = "";
        // parse parameters
        let selector = await parsePlayerSelector(ability.selector, src_ref, additionalTriggerData);
        console.log(`Logging ${selector}${ability.info?' as '+ability.info:''}`);
        return `Logging ${selector}${ability.info?' as '+ability.info:''}`;
    }
    
}
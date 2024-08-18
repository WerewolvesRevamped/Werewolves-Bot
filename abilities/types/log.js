/**
    Abilities Module - Log
    The module for implementing the debug log ability
**/

module.exports = function() {
    
    /**
    Ability: Log
    **/
    this.abilityLogging = async function(pid, src_role, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.selector) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return "Logging failed! " + abilityError;
        }
        if(!ability.info) ability.info = "";
        // parse parameters
        let selector = await parsePlayerSelector(ability.selector, pid, additionalTriggerData);
        console.log(`Logging ${selector}${ability.info?' as '+ability.info:''}`);
    }
    
}
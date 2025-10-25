/**
    Abilities Module - Resurrecting
    The module for implementing resurrecting
**/

module.exports = function() {
    
    /**
    Ability: Resurrecting
    **/
    this.abilityResurrecting = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Resurrecting failed! " + abilityError, success: false };
        }
        // get target
        const targets = await parseSelector(ability.target, src_ref, additionalTriggerData);
        
        for(let i = 0; i < targets.value.length; i++) {
            switch(targets.type) {
                case "player":
                    // Resurrect
                    await resurrectPlayer(targets.value[i]);
                    // reopen groups/teams
                    await updateActiveTeams();
                    await updateGroups();
                break;
                case "player_attr":
                    let queried = await queryAttribute("attr_type", "role", "val2", targets.value[i]);
                    updateAttributeAlive(queried[0].ai_id, 1);
                break;
                case "attribute":
                    updateAttributeAlive(targets.value[i], 1);
                break;
                default:
                    abilityLog(`❗ **Error:** Cannot resurrect type \`${targets.type}\`!`);
                    return { msg: "Resurrecting failed! " + abilityError, success: false };            
                break;
            }
            abilityLog(`👻 ${srcRefToText(targets.type + ":" + targets.value[i])} was resurrected.`);
        }
        
        // return
        return { msg: "Resurrecting succeeded!", success: true };
    }
    
}
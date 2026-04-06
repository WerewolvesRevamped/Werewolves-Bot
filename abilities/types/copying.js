/**
    Abilities Module - Copying
    The module for implementing copying
**/

module.exports = function() {
    
    /**
    Ability: Copying
    **/
    this.abilityCopying = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Copying failed! " + abilityError, success: false };
        }
        // get target
        const targets = await parseSelector(ability.target, src_ref, additionalTriggerData);
        
        // check parameters
        if(targets.value.length != 1) {
            abilityLog(`❗ **Error:** Invalid ability type for copying!`);
            return { msg: "Copying failed! " + abilityError, success: false };
        }
        if(targets.type != "player") {
            abilityLog(`❗ **Error:** Cannot copy type \`${targets.type}\`!`);
            return { msg: "Copying failed! " + abilityError, success: false }; 
        }
        
        let self = src_ref.split(":")[1];
        // get target role, change role
        let roleData = await sqlPromOneEsc("SELECT role FROM players WHERE players.id=", targets.value[0]);
        await changingRole(src_name, src_ref, [ self ], roleData.role, additionalTriggerData);
        
        // get target HI
        let hiData = await sqlPromEsc("SELECT * FROM host_information WHERE id=", targets.value[0]);
        for(let i = 0; i < hiData.length; i++) {
            await sqlProm("INSERT INTO host_information (id, name, value) VALUES (" + connection.escape(self) + "," + connection.escape(hiData[i].name) + "," + connection.escape(hiData[i].value) + ")");
        }
        
        abilityLog(`🔁 ${srcRefToText(src_ref)} copied ${srcRefToText(targets.type + ":" + targets.value[0])}.`);
        
        // handle visit
        if(additionalTriggerData.parameters.visitless !== true) {
            let result = await visit(src_ref, targets.value[0], NO_VISIT_PARAM, NO_SND_VISIT_PARAM, "copying");
            if(result) return visitReturn(result, "Copying failed!", "Copying succeeded!");
        }
        
        // return
        return { msg: "Copying succeeded!", success: true };
    }
    
}
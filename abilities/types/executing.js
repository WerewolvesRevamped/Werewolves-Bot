/**
    Abilities Module - Execute
    The module for implementing executing
**/

module.exports = function() {

    this.EXE_COMMANDS = ["listsubstitutes","listroles","listplayers","listmentors","listalive","listdead"];
    
    /** PUBLIC
    Ability: Executing
    **/
    this.abilityExecuting = async function(src_ref, src_name, ability, additionalTriggerData) {
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Executing failed! " + abilityError, success: false };
        }
        
        // parse location
        let target = await parseLocation(ability.target, src_ref, additionalTriggerData);
        if(target.type == null || target.multiple) return { msg: "Whispering failed! " + abilityError, success: false }; // no location found
        
        // get channel to execute to
        let cid = await getSrcRefChannel(`${target.type}:${target.value}`);
        let targetChannel = mainGuild.channels.cache.get(cid);
        if(!targetChannel) {
            // feedback
            abilityLog(`❗ **Error:** Could not find channel for \`${target.type}:${target.value}\`!`);
            return { msg: "Executing failed!", success: true, target: `${target.type}:${target.value}` };
        }
        
        let cmd = (ability.command??"").toLowerCase();
        if(EXE_COMMANDS.includes(cmd)) {
            switch(cmd) {
                case "listroles": cmdPlayersList(targetChannel); break;
                case "listsubstitutes": cmdListSubs(targetChannel); break;
                case "listplayers": cmdListSignedup(targetChannel); break;
                case "listmentors": cmdListMentors(targetChannel); break;
                case "listalive": cmdListAlive(targetChannel); break;
                case "listdead": cmdListDead(targetChannel); break;
            }
        } else {
            // feedback
            abilityLog(`❗ **Error:** Unknown command \`${ability.command}\` to execute!`);
            return { msg: "Executing failed!", success: true, target: `${target.type}:${target.value}` };
            
        }
        
        // feedback
        return { msg: "Executing succeeded!", success: true, target: `${target.type}:${target.value}` };
        
    }
    
}
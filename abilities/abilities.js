/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./joining.js")();
require("./parsers.js")();

module.exports = function() {
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(pid, src_role, ability) {
        abilityLog(`🟢 **Executing Ability:** <@${pid}> (${toTitleCase(src_role)}) \`\`\`${JSON.stringify(ability)}\`\`\``);
        switch(ability.type) {
            default:
                log("UNKNOWN ABILITY TYPE", JSON.stringify(ability));
            break;
            case "joining":
                await abilityJoining(pid, src_role, ability)
            break;
        }
    }
    
    /**
    Ability Log
    logs a message in the ability log. WIP: dont hardcode
    **/
    this.abilityLog = function(msg) {
        client.guilds.cache.get("569626539541397515").channels.cache.get("1269376980906672228").send(msg);
    }
    
    /**
    Command: Execute
    executes an ability
    **/
    this.cmdExecute = function(author, ability) {
        executeAbility(author.id, "host", JSON.parse(ability));
    }
    
}
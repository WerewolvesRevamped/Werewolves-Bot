/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./parsers.js")();
require("./prompts.js")();

/** Ability Types **/
require("./joining.js")();
require("./investigating.js")();
require("./disguising.js")();

module.exports = function() {
    
    this.abilityError = "If you believe this to be an error, please contact a Host.";
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(pid, src_role, ability) {
        abilityLog(`🟢 **Executing Ability:** <@${pid}> (${toTitleCase(src_role)}) \`\`\`${JSON.stringify(ability)}\`\`\``);
        switch(ability.type) {
            default:
                abilityLog(`❗ **Error:** Unknown ability type \`${ability.type}\`!`);
            break;
            case "joining":
                return await abilityJoining(pid, src_role, ability)
            break;
            case "investigating":
                return await abilityInvestigating(pid, src_role, ability)
            break;
            case "disguising":
                return await abilityDisguising(pid, src_role, ability)
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
    this.cmdExecute = async function(message, ability) {
        let feedback = await executeAbility(message.author.id, "host", JSON.parse(ability));
        message.channel.send(basicEmbed(message, EMBED_GREEN));
    }
    
    /**
    Ability Feedback
    used to send feedback for abilities (and probably prompts?)
    **/
    this.abilitySend = function(player_id, message, color = EMBED_GRAY, ping = false) {
        sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
            let player_sc_id = result[0].channel_id;
            let player_sc = client.guilds.cache.get("569626539541397515").channels.cache.get(player_sc_id);
            embed = basicEmbed(message, color);
            if(ping) embed.content =  `<@&${stats.participant}>`;
            player_sc.send(embed);
        });
    }
    
    /**
    Ability Feedback + Return new message ID
    **/
    this.abilitySendProm = function(player_id, message, color = EMBED_GRAY, ping = false) {
        return new Promise(res => {
            sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
                let player_sc_id = result[0].channel_id;
                let player_sc = client.guilds.cache.get("569626539541397515").channels.cache.get(player_sc_id);
                embed = basicEmbed(message, color);
                if(ping) embed.content =  `<@&${stats.participant}>`;
                player_sc.send(embed).then(msg => {
                    res(msg.id);
                });
            });
        });      
    }
    
    
}
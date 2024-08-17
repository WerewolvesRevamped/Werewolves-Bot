/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./parsers.js")();
require("./prompts.js")();
require("./restrictions.js")();

/** Ability Types **/
require("./joining.js")();
require("./investigating.js")();
require("./disguising.js")();
require("./killing.js")();
require("./protecting.js")();

module.exports = function() {
    
    this.abilityError = "This is likely caused by an error. Please contact a Host.";
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(pid, src_role, ability, restrictions) {
        // check restrictions again
        for(let i = 0; i < restrictions.length; i++) {
            let passed = await handleRestriction(pid, ability, restrictions[i], RESTR_POST);
            if(!passed) {
                abilityLog(`🔴 **Skipped Ability:** <@${pid}> (${toTitleCase(src_role)}). Failed restriction \`${restrictions[i].type}\`.`);
                return;
            }
        }
        // get/increase quantity
        let quantity = await getActionQuantity(pid, ability);
        if(quantity === 0) await initActionData(pid, ability);
        else await increaseActionQuantity(pid, ability);
        // execute ability
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
            case "killing":
                return await abilityKilling(pid, src_role, ability)
            break;
            case "protecting":
                return await abilityProtecting(pid, src_role, ability)
            break;
        }
    }

    /**
    Ability Log
    logs a message in the ability log. WIP: dont hardcode
    **/
    this.abilityLog = function(msg) {
        stats.guild.channels.cache.get("1269376980906672228").send(msg);
    }
    
    /**
    Command: Execute
    executes an ability
    **/
    this.cmdExecute = async function(message, ability) {
        let feedback = await executeAbility(message.author.id, "host", JSON.parse(ability));
        message.channel.send(basicEmbed(feedback, EMBED_GREEN));
    }
    
    /**
    Ability Feedback
    used to send feedback for abilities (and probably prompts?)
    **/
    this.abilitySend = function(player_id, message, color = EMBED_GRAY, ping = false, footer = false) {
        sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
            let player_sc_id = result[0].channel_id;
            let player_sc = stats.guild.channels.cache.get(player_sc_id);
            embed = basicEmbed(message, color);
            if(ping) embed.embed.content =  `<@&${stats.participant}>`; // add ping
            if(footer) embed.embeds[0].footer = { text: footer }; // add footer
            player_sc.send(embed);
        });
    }
    
    /**
    Ability Feedback + Return new message ID
    **/
    this.abilitySendProm = function(player_id, message, color = EMBED_GRAY, ping = false, footer = false) {
        return new Promise(res => {
            sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
                let player_sc_id = result[0].channel_id;
                let player_sc = stats.guild.channels.cache.get(player_sc_id);
                embed = basicEmbed(message, color);
                if(ping) embed.content =  `<@&${stats.participant}>`; // add ping
                if(footer) embed.embeds[0].footer = { text: footer }; // add footer
                player_sc.send(embed).then(msg => {
                    res(msg.id);
                });
            });
        });      
    }
    
    /**
    Abilities Reset
    **/
    this.abilitiesReset = function() {
		sql("DELETE FROM action_quantities");
		sql("DELETE FROM action_queue");
		sql("DELETE FROM prompts");
    }
    
}
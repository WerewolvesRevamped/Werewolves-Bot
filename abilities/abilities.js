/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./parsers.js")();
require("./prompts.js")();
require("./restrictions.js")();

/** Ability Types **/
require("./types/joining.js")();
require("./types/investigating.js")();
require("./types/disguising.js")();
require("./types/killing.js")();
require("./types/protecting.js")();
require("./types/logging.js")();
require("./types/targeting.js")();
require("./types/process_evaluate.js")();

module.exports = function() {
    
    this.abilityError = "This is likely caused by an error. Please contact a Host.";
    this.abilityFailure = "If you believe this to be a mistake, please contact a Host.";
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(src_ref, src_name, ability, restrictions = [], additionalTriggerData = {}) {
        // find src role type
        if(!isSrc(src_ref)) src_ref = `unknown:${src_ref}`;
        if(!isSrc(src_name)) src_name = `unknown:${src_name}`;
        // check restrictions again
        for(let i = 0; i < restrictions.length; i++) {
            let passed = await handleRestriction(src_ref, ability, restrictions[i], RESTR_POST, null, additionalTriggerData);
            if(!passed) {
                abilityLog(`🔴 **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). Failed restriction \`${restrictions[i].type}\`.`);
                return;
            }
        }
        // get/increase quantity
        let quantity = 0;
        if(ability.id) {
            quantity = await getActionQuantity(src_ref, ability);
            if(quantity === -1) await initActionData(src_ref, ability);
            await increaseActionQuantity(src_ref, ability);
        }
        // execute ability
        abilityLog(`🟢 **Executing Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) \`\`\`${JSON.stringify(ability)}\`\`\``);
        switch(ability.type) {
            default:
                abilityLog(`❗ **Error:** Unknown ability type \`${ability.type}\`!`);
                return { msg: "", success: false };
            break;
            case "joining":
                return await abilityJoining(src_ref, src_name, ability, additionalTriggerData)
            break;
            case "investigating":
                return await abilityInvestigating(src_ref, src_name, ability, additionalTriggerData)
            break;
            case "disguising":
                return await abilityDisguising(src_ref, src_name, ability, additionalTriggerData)
            break;
            case "killing":
                return await abilityKilling(src_ref, src_name, ability, additionalTriggerData)
            break;
            case "protecting":
                return await abilityProtecting(src_ref, src_name, ability, additionalTriggerData)
            break;
            case "log":
                return await abilityLogging(src_ref, src_name, ability, additionalTriggerData)
            break;
            case "targeting":
                return await abilityTargeting(src_ref, src_name, ability, additionalTriggerData)
            break;
            case "process_evaluate":
                return await abilityProcessEvaluate(src_ref, src_name, ability, additionalTriggerData)
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
        let feedback = await executeAbility("player:" + message.author.id, "role:host", JSON.parse(ability));
        if(feedback.msg) message.channel.send(basicEmbed(feedback.msg, EMBED_GREEN));
        else if(feedback.success) message.channel.send(basicEmbed(feedback.success, EMBED_GREEN));
    }
    
    /**
    Ability Feedback
    used to send feedback for abilities (and probably prompts?)
    **/
    this.abilitySend = function(src_ref, message, color = EMBED_GRAY, ping = false, footer = false, thumbnail = null, title = null) {
        let player_id = srcToValue(src_ref);
        let type = srcToType(src_ref);
        
        switch(type) {
            case "player":
                sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
                    let player_sc_id = result[0].channel_id;
                    let player_sc = stats.guild.channels.cache.get(player_sc_id);
                    embed = basicEmbed(message, color);
                    if(ping) embed.embed.content =  `<@&${stats.participant}>`; // add ping
                    if(footer) embed.embeds[0].footer = { text: footer }; // add footer
                    if(thumbnail) embed.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
                    if(title) embed.embeds[0].title = title; // add title
                    player_sc.send(embed);
                });
            break;
            default:
                abilityLog(`❗ **Error:** Unknown type for sending ability!`);
            break;
        }
    }
    
    /**
    Ability Feedback + Return new message ID
    **/
    this.abilitySendProm = function(src_ref, message, color = EMBED_GRAY, ping = false, footer = false, thumbnail = null, title = null) {
        let player_id = srcToValue(src_ref);
        let type = srcToType(src_ref);
        
        
        switch(type) {
            case "player":
                return new Promise(res => {
                        sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
                            let player_sc_id = result[0].channel_id;
                            let player_sc = stats.guild.channels.cache.get(player_sc_id);
                            embed = basicEmbed(message, color);
                            if(ping) embed.content =  `<@&${stats.participant}>`; // add ping
                            if(footer) embed.embeds[0].footer = { text: footer }; // add footer
                            if(thumbnail) embed.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
                            if(title) embed.embeds[0].title = title; // add title
                            player_sc.send(embed).then(msg => {
                                res(msg.id);
                            });
                        });
                    });      
            break;
            default:
                abilityLog(`❗ **Error:** Unknown type for sending ability!`);
            break;
        }
        
    }
    
    /**
    Abilities Reset
    **/
    this.abilitiesReset = function() {
		sql("DELETE FROM action_quantities");
		sql("DELETE FROM action_queue");
		sql("DELETE FROM prompts");
    }
    
    /**
    SOURCES
    possible source reference types: player (player id), group (channel id), alignment, attribute, poll
    possible source name types: role, group, alignment, attribute, poll
    **/
    
    /** PUBLIC
    Source Reference to Text
    Converts a source reference to text suitable for discord
    **/
    this.srcRefToText = function(src_ref) {
        let type = srcToType(src_ref);
        let val = srcToValue(src_ref);
        switch(type) {
            case "player":
                return `<@${val}>`;
            case "group":
                return `<#${val}>`;
            case "alignment":
            case "attribute":
            case "poll":
            case "role":
                return `\`${toTitleCase(val)}\``;
            case "unknown":
            default:
                return `UNKNOWN \`${src_ref}\``;
            break;
        }
    }
    
    /** PUBLIC
    Source Name to Text
    Converts a source name to text suitable for discord
    **/
    this.srcNameToText = function(src_name) {
        let type = srcToType(src_name);
        let val = srcToValue(src_name);
        return toTitleCase(type) + ": " + toTitleCase(val);
    }
    
    /** PUBLIC
    Get Source Type
    Returns the type for a source
    (may be passed a src_ref or src_name)
    **/
    this.srcToType = function(src_either) {
        let spl = src_either.toLowerCase().split(":");
        return spl[0];
    }
    
    /** PUBLIC
    Get Source Value
    Returns the value for a source
    (may be passed a src_ref or src_name)
    **/
    this.srcToValue = function(src_either) {
        let spl = src_either.toLowerCase().split(":");
        return spl[1] ?? spl[0];
    }
    
    /** PUBLIC
    Is source
    **/
    this.isSrc = function(src_either) {
        let spl = src_either.toLowerCase().split(":");
        return spl.length == 2;
    }
    
    /** PUBLIC
    Ref to Img
    returns an image url for the ref
    **/
    this.refToImg = async function(ref) {
        let type = srcToType(ref);
        let val = srcToValue(ref);
        switch(type) {
            case "role":
                let rData = await getRoleDataFromName(val);
                return rData ? rData.url : null;
            default:
                return null;
        }
    }
    
    
}
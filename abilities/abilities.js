/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./parsers.js")();
require("./prompts.js")();
require("./restrictions.js")();
require("./scaling.js")();

/** Ability Types **/
require("./types/joining.js")();
require("./types/investigating.js")();
require("./types/disguising.js")();
require("./types/killing.js")();
require("./types/protecting.js")();
require("./types/logging.js")();
require("./types/targeting.js")();
require("./types/process_evaluate.js")();
require("./types/announcement.js")();
require("./types/poll.js")();
require("./types/granting.js")();
require("./types/manipulating.js")();

module.exports = function() {
    
    this.abilityError = "This is likely caused by an error. Please contact a Host.";
    this.abilityFailure = "If you believe this to be a mistake, please contact a Host.";
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(src_ref, src_name, ability, restrictions = [], additionalTriggerData = {}) {
        try {
            // if an executor is passed we use that instead of src_ref
            if(additionalTriggerData.executor) {
                src_ref = `player_group:${additionalTriggerData.executor}`;
            }
            
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
            abilityLog(`🟢 **Executing Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}) \`\`\`${JSON.stringify(ability).substr(0,1800)}\`\`\``);
            let feedback;
            switch(ability.type) {
                default:
                    abilityLog(`❗ **Error:** Unknown ability type \`${ability.type}\`!`);
                    feedback = { msg: "", success: false };
                break;
                case "joining":
                    feedback = await abilityJoining(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "investigating":
                    feedback = await abilityInvestigating(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "disguising":
                    feedback = await abilityDisguising(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "killing":
                    feedback = await abilityKilling(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "protecting":
                    feedback = await abilityProtecting(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "log":
                    feedback = await abilityLogging(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "targeting":
                    feedback = await abilityTargeting(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "process_evaluate":
                    feedback = await abilityProcessEvaluate(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "abilities":
                    feedback = await abilityAbilities(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "announcement":
                    feedback = await abilityAnnouncement(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "poll":
                    feedback = await abilityPoll(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "granting":
                    feedback = await abilityGranting(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "manipulating":
                    feedback = await abilityManipulating(src_ref, src_name, ability, additionalTriggerData);
                break;
                case "feedback":
                    let info = await parseInfo(ability.feedback);
                    feedback = { msg: info, success: true };
                break;
            }
            
            // on action trigger
            const actionTarget = feedback.target ? feedback.target : null;
            await trigger(src_ref, "On Action", { action_result: feedback.result, action_target: actionTarget }); 
            await trigger(src_ref, "On Action Complex", { action_result: feedback.result, action_target: actionTarget, ability_type: ability.type, ability_subtype: "" }); 
            if(ability.subtype) await trigger(src_ref, "On Action Complex", { action_result: feedback.result, action_target: actionTarget, ability_type: ability.type, ability_subtype: ability.subtype }); 
            
            // return feedback
            return feedback;
        } 
        // Handle Errors
        catch(err) {
            console.log(`Error in ability ${ability?.type} for ${src_name} (${src_ref})`);
            console.log(err);
        }
    }

    /**
    Ability Log
    logs a message in the ability log. WIP: dont hardcode
    **/
    this.abilityLog = function(msg) {
        mainGuild.channels.cache.get("1269376980906672228").send(msg);
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
        // just use the promise variant but dont wait
        abilitySendProm(src_ref, message, color, ping, footer, thumbnail, title);
    }
    
    /**
    Ability Feedback + Return new message ID
    **/
    this.abilitySendProm = async function(src_ref, message, color = EMBED_GRAY, ping = false, footer = false, thumbnail = null, title = null) {
        let channel_id = await getSrcRefChannel(src_ref);
        if(!channel_id) return;
        
        // get channel
        let sc = mainGuild.channels.cache.get(channel_id);
        // create embed
        embed = basicEmbed(message, color);
        if(ping) embed.content =  `<@&${stats.participant}>`; // add ping
        if(footer) embed.embeds[0].footer = { text: footer }; // add footer
        if(thumbnail) embed.embeds[0].thumbnail = { url: thumbnail }; // add thumbnail
        if(title) embed.embeds[0].title = title; // add title
        // send embed
        return new Promise(res => {
            sc.send(embed).then(msg => {
                res(msg);
            });
        });
        
    }
    
    /**
    Get src_ref channel
    **/
    this.getSrcRefChannel = async function(src_ref) {
        let ref = srcToValue(src_ref);
        let type = srcToType(src_ref);
        let channel_id = null;
        
        // get channel id by type
        switch(type) {
            case "player":
                return await abilitySendGetPlayerChannel(ref);
            case "player_attr":
                return ref;
            case "group":
                return ref; // group ref already is channel id
            case "poll":
                return "1276250651097170022"; // WIP: poll log is hardcoded
            case "attribute":
                return "1276250651097170022"; // WIP: poll log is hardcoded
            case "location":
                return await abilitySendGetLocationChannel(ref);
            default:
                abilityLog(`❗ **Error:** Unknown type for get src_ref channel!`);
                return null;
        }
    }
    
    /**
    Get Player Channel
    **/
    function abilitySendGetPlayerChannel(player_id) {
        return new Promise(res => {
            sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
                res(result[0].channel_id);
            });
        });      
    }
    
    /**
    Get Location Channel
    **/
    function abilitySendGetLocationChannel(loc_name) {
        return new Promise(res => {
            sql("SELECT channel_id FROM locations WHERE name = " + connection.escape(loc_name), result => {
                res(result[0].channel_id);
            });
        });      
    }
   
    
    /**
    Abilities Reset
    **/
    this.abilitiesReset = function() {
		sql("DELETE FROM action_data");
		sql("DELETE FROM action_queue");
		sql("DELETE FROM prompts");
    }
    
    /**
    SOURCES
    possible source types:
    player (member id) / role (name)
    player_attr (channel id) / role (name)
    group (channel id) / group (name)
    player_group (member id) / group (name)
    poll (name) / poll (name)
    attribute (ai id) / attribute (name)
    **/
    
    /** PUBLIC
    Source Reference to Text
    Converts a source reference to text suitable for discord
    **/
    this.srcRefToText = function(src_ref, raw = null) {
        let type = srcToType(src_ref);
        let val = srcToValue(src_ref);
        switch(type) {
            case "player":
                return `<@${val}>`;
            case "player_group":
                return `<@${val}> (Group Executor)`;
            case "group":
            case "player_attr":
                return `<#${val}>`;
            case "alignment":
            case "poll":
            case "role":
                return `\`${toTitleCase(val)}\``;
            case "attribute":
                const owner = getCustomAttributeOwner(val);
                const source = getCustomAttributeSource(val);
                const ownerText = srcRefToText(owner);
                const sourceText = srcRefToText(source);
                return `Attr-${val} on ${ownerText} from ${sourceText}`;
            break;
            case "result":
                return raw.msg;
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
/**
    Abilities Module - Main
    The module for implementing ability automations
**/
require("./triggers.js")();
require("./parsers.js")();
require("./prompts.js")();
require("./restrictions.js")();
require("./scaling.js")();
require("./visit.js")();
require("./commands.js")();

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
require("./types/applying.js")();
require("./types/changing.js")();
require("./types/ascend_descend.js")();
require("./types/choices.js")();
require("./types/whispering.js")();
require("./types/reset.js")();
require("./types/counting.js")();
require("./types/loyalty.js")();
require("./types/disband.js")();
require("./types/redirecting.js")();
require("./types/cancel.js")();
require("./types/for_each.js")();
require("./types/obstructing.js")();
require("./types/shuffle.js")();
require("./types/emit.js")();
require("./types/storing.js")();
require("./types/displaying.js")();

module.exports = function() {
    
    this.abilityError = "This is likely caused by an error. Please contact a Host.";
    this.abilityFailure = "If you believe this to be a mistake, please contact a Host.";
    
    /**
    Execute Ability
    executes an ability
    **/
    this.executeAbility = async function(src_ref, src_name, ability, restrictions = [], additionalTriggerData = { parameters: {} }, doNotRecheckRestriction = false) {
        try {
            // if an executor is passed we use that instead of src_ref
            if(additionalTriggerData.executor) {
                src_ref = `player_group:${additionalTriggerData.executor}`;
            }
            
            // find src role type
            if(!isSrc(src_ref)) src_ref = `unknown:${src_ref}`;
            if(!isSrc(src_name)) src_name = `unknown:${src_name}`;
            // check restrictions again
            if(!doNotRecheckRestriction) {
                for(let i = 0; i < restrictions.length; i++) {
                    let passed = await handleRestriction(src_ref, ability, restrictions[i], RESTR_POST, null, additionalTriggerData);
                    if(!passed) {
                        abilityLog(`🔴 **Skipped Ability:** ${srcRefToText(src_ref)} (${srcNameToText(src_name)}). Failed restriction \`${restrictions[i].type}\`.`);
                        return;
                    }
                }
            }
            
            // get/increase quantity
            let quantity = 0;
            if(ability.id) {
                quantity = await getActionQuantity(src_ref, ability);
                if(quantity === -1) await initActionData(src_ref, ability);
                await increaseActionQuantity(src_ref, ability);
            }
            
            let src_refAction = src_ref;
            if(additionalTriggerData.visitless) {
                src_refAction = "null:null";
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
                    feedback = await abilityJoining(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "investigating":
                    feedback = await abilityInvestigating(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "disguising":
                    feedback = await abilityDisguising(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "killing":
                    feedback = await abilityKilling(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "protecting":
                    feedback = await abilityProtecting(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "log":
                    feedback = await abilityLogging(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "targeting":
                    feedback = await abilityTargeting(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "process_evaluate":
                    feedback = await abilityProcessEvaluate(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "abilities":
                    feedback = await abilityAbilities(src_refAction, src_name, ability, additionalTriggerData);
                    if(!feedback) return null;
                break;
                case "announcement":
                    feedback = await abilityAnnouncement(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "poll":
                    feedback = await abilityPoll(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "granting":
                    feedback = await abilityGranting(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "manipulating":
                    feedback = await abilityManipulating(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "applying":
                    feedback = await abilityApplying(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "changing":
                    feedback = await abilityChanging(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "choices":
                    feedback = await abilityChoices(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "whispering":
                    feedback = await abilityWhispering(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "reset":
                    feedback = await abilityReset(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "counting":
                    feedback = await abilityCounting(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "loyalty":
                    feedback = await abilityLoyalty(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "redirecting":
                    feedback = await abilityRedirecting(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "cancel":
                    feedback = await abilityCancel(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "disband":
                    feedback = await abilityDisband(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "obstructing":
                    feedback = await abilityObstructing(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "for_each":
                    feedback = await abilityForEach(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "ascend":
                    feedback = await abilityAscend(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "descend":
                    feedback = await abilityDescend(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "shuffle":
                    feedback = await abilityShuffle(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "emit":
                    feedback = await abilityEmitting(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "storing":
                    feedback = await abilityStoring(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "displaying":
                    feedback = await abilityDisplaying(src_refAction, src_name, ability, additionalTriggerData);
                break;
                case "feedback":
                    let info = await parseInfo(ability.feedback, src_refAction, additionalTriggerData);
                    feedback = { msg: info, success: true };
                break;
                case "success":
                    feedback = { msg: "Ability succeeded!", success: true };
                break;
                case "failure":
                    feedback = { msg: "Ability failed!", success: false };
                break;
                case "continue":
                    return null;
                break;
            }
            
            // on action trigger
            const actionTarget = feedback.target ? feedback.target : null;
            
            let thisId = srcToValue(src_ref);
            await trigger(src_ref, "On Action", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type, src_name: src_name }); 
            await trigger(src_ref, "On Action Complex", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type, ability_subtype: ability.subtype, src_name: src_name }); 
            await trigger(src_ref, "On Action Inverted Complex", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type, ability_subtype: ability.subtype, src_name: src_name }); 
            await triggerHandler("On Action Target Complex", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type, ability_subtype: ability.subtype, src_name: src_name, this: thisId }); 
             await triggerHandler("On Action Target Inverted Complex", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type, ability_subtype: ability.subtype, src_name: src_name, this: thisId }); 
            await trigger(src_ref, "On Any Action", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type }); 
            await trigger(src_ref, "On Any Action Complex", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type, ability_subtype: ability.subtype }); 
            await trigger(src_ref, "On Any Action Inverted Complex", { action_result: feedback, action_target: actionTarget, action_feedback: feedback.msg, ability_type: ability.type, ability_subtype: ability.subtype }); 
            
            // check choice completion (if applicable)
            if(additionalTriggerData.choice_data) {
                await choiceCheckCompletion(additionalTriggerData.choice_data.owner, additionalTriggerData.choice_data.name);
            }
            
            // return feedback
            return feedback;
        } 
        // Handle Errors
        catch(err) {
            abilityLog(`❗ **Critical Error:** Ability execution of type ${ability?.type} __failed__ for ${src_name} (${src_ref}) due to an error. __**CHECK LOG**__`);
            console.log(`Error in ability ${ability?.type} for ${src_name} (${src_ref})`);
            console.log(err);
        }
    }

    /**
    Ability Log
    **/
    this.abilityLog = function(msg) {
        let ch = mainGuild.channels.cache.get(config.log);
        if(ch && msg && msg.length > 0) ch.send(msg);
    }
    
    /**
    Ability Log Buffered
    **/
    
    /**
    Action Log
    logs a message in the action log. WIP: dont hardcode
    **/
    this.actionLog = function(msg) {
        let ch = mainGuild.channels.cache.get(config.action_log);
        if(ch) ch.send(msg);
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
            case "group":
            case "channel":
                return ref;
            case "poll":
            case "team":
                return backupChannelId;
            case "location":
                return await abilitySendGetLocationChannel(ref);
            case "attribute":
                let owner = getCustomAttributeOwner(ref);
                return getSrcRefChannel(owner);
            default:
                abilityLog(`❗ **Error:** Unknown type ${type} for get src_ref channel!`);
                return null;
        }
    }
    
    /**
    Get Player Channel
    **/
    function abilitySendGetPlayerChannel(player_id) {
        return new Promise(res => {
            sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(player_id), result => {
                if(!result[0]) {
                    abilityLog(`❗ **Invalid Channel:** Cannot find player ${player_id} (<@${player_id}>).`);
                    res(backupChannelId);
                    return;
                }
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
                if(!result[0]) {
                    abilityLog(`❗ **Invalid Channel:** Cannot find location ${loc_name}.`);
                    res(backupChannelId);
                    return;
                }
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
    team (name) / team (name)
    attribute (ai id) / attribute (name)
    **/
    
    /** PUBLIC
    Source Reference to Text
    Converts a source reference to text suitable for discord
    **/
    this.srcRefToText = function(src_ref, raw = null, allowRecursion = true) {
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
            case "team":
                return `\`${toTitleCase(val)}\``;
            case "attribute":
                if(!isNaN(val)) {
                    const owner = getCustomAttributeOwner(val);
                    const source = getCustomAttributeSource(val);
                    const name = getCustomAttributeName(val);
                    const ownerText = allowRecursion ? srcRefToText(owner) : owner;
                    const sourceText = allowRecursion ? srcRefToText(source) : source;
                    return `${name} (Attr-${val}) on ${ownerText} from ${sourceText}`;
                } else {
                    return toTitleCase(val);
                }
            break;
            case "location":
                return `#${val}`;
            break;
            case "killingtype":
                return toTitleCase(val);
            break;
            case "result":
                return raw.msg;
            case "info":
            case "string":
                return val;
            break;
            case "abilitytype":
                return `${getAbilityEmoji(val)} **${toTitleCase(val)}**`;
            break;
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
                let lutval = applyLUT(val);
                if(lutval) return `${iconRepoBaseUrl}${lutval}.png`;
                return null;
        }
    }
    
    
}
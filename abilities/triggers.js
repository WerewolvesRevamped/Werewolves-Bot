/**
    Abilities Module - Triggers
    The module for implementing ability triggers
**/

module.exports = function() {
    
    /**
    Trigger Handler
    handle a trigger triggering
    **/
    function triggerHandler(triggerName, args = []) {
        abilityLog(`🔷 **Trigger:** ${triggerName}`);  
        return new Promise(res => {
            // get all players
            sql("SELECT role,id FROM players WHERE type='player' AND alive=1", async r => {
                // get their role's data
                for(let pr of r) {
                    await triggerHandlerPlayer(pr, triggerName);
                }
                // resolve outer promise
                res();
            });
        });
    }
    
    /**
    Trigger Handler - Player
    handles trigger triggering for a single player
    **/
    async function triggerHandlerPlayer(pr, triggerName) {
        await new Promise(res => {
            sql("SELECT * FROM roles WHERE name=" + connection.escape(pr.role), async result => {
                // parse the formalized desc into an object
                let parsed = JSON.parse(result[0].parsed);
                // grab the triggers
                let triggers = parsed.triggers;
                // filter out the relevant triggers
                triggers = triggers.filter(el => el.trigger == triggerName);
                for(const trigger of triggers) {
                    // execute all relevant triggers
                    await executeTrigger(pr.id, pr.role, trigger, triggerName);
                }
                // resolve outer promise
                res();
            });            
        });
    }
    
    /**
    Execute Trigger
    executes the abilities of a trigger if applicable
    **/
    async function executeTrigger(pid, src_role, trigger, triggerName) {
        const ptype = getPromptType(triggerName);
        // iterate through abilities of the trigger
        for(const ability of trigger.abilities) {
            // check trigger restrictions
            let restrictions = trigger?.parameters?.restrictions ?? [];
            for(let i = 0; i < restrictions.length; i++) {
                let passed = await handleRestriction(pid, ability, restrictions[i]);
                if(!passed) {
                    abilityLog(`🔴 **Skipped Ability:** <@${pid}> (${toTitleCase(src_role)}). Failed restriction \`${restrictions[i].type}\`.`);
                    return;
                }
            }
            // check if prompts are necessary
            let prompts = getPrompts(ability);
            switch(prompts.length) {
                // if no prompts are necessary -> directly execute ability
                case 0:
                    if(ptype == "end") {
                        abilityLog(`❗ **Error:** Cannot use \`${triggerName}\` trigger without prompt!`);
                    } else {
                        let feedback = await executeAbility(pid, src_role, ability, trigger);
                        if(feedback) abilitySend(pid, feedback);
                    }
                break;
                // single prompt (@Selection)
                case 1: {
                    let type = toTitleCase(selectorGetType(prompts[0][1]));
                    let promptMsg = getPromptMessage(ability, type);
                    let mid = await abilitySendProm(pid, `${getEmoji(src_role)} ${promptMsg}`, EMBED_GRAY, true);
                    if(ptype == "immediate") { // immediate prompt
                        abilityLog(`🟩 **Prompting Ability:** <@${pid}> (${toTitleCase(src_role)}) - ${toTitleCase(ability.type)} [${type}] {Immediate}`);
                        await createPrompt(mid, pid, src_role, ability, "immediate", type);
                    } else if(ptype == "end") { // end phase prompt
                        abilityLog(`🟩 **Prompting Ability:** <@${pid}> (${toTitleCase(src_role)}) - ${toTitleCase(ability.type)} [${type}] {End}`);
                        await createPrompt(mid, pid, src_role, ability, "end", type);
                    } else {
                        abilityLog(`❗ **Error:** Invalid prompt type!`);
                    }
                } break;
                // double prompt (@Selection and @SecondarySelection)
                case 2: {
                    let type1 = toTitleCase(selectorGetType(prompts[0][1]));
                    let type2 = toTitleCase(selectorGetType(prompts[1][1]));
                    let promptMsg = getPromptMessage(ability, type1, type2);
                    let mid = await abilitySendProm(pid, `${getEmoji(src_role)} ${promptMsg}`, EMBED_GRAY, true);
                    if(ptype == "immediate") { // immediate prompt
                        abilityLog(`🟩 **Prompting Ability:** <@${pid}> (${toTitleCase(src_role)}) - ${toTitleCase(ability.type)} [${type1}, ${type2}] {Immediate}`);
                        await createPrompt(mid, pid, src_role, ability, "immediate", type1, type2);
                    } else if(ptype == "end") { // end phase prompt
                        abilityLog(`🟩 **Prompting Ability:** <@${pid}> (${toTitleCase(src_role)}) - ${toTitleCase(ability.type)} [${type1}, ${type2}] {End}`);
                        await createPrompt(mid, pid, src_role, ability, "end", type1, type2);
                    } else {
                        abilityLog(`❗ **Error:** Invalid prompt type!`);
                    }
                } break;
                // more than 2 prompts -> error
                default:
                    abilityLog(`❗ **Error:** Invalid amount of prompts (${prompts.length}) in ability!`);
                break;
            }
        }
    }
    
    /**
    Command: $emit <trigger type>
    Manually emits a certain trigger type
    **/
    this.cmdEmit = async function(channel, argsX) {
        console.log(`Emitting a ${argsX[0]} event.`);
        let evt = toTitleCase(argsX.join(" "));
        switch(argsX[0]) {
            default: await triggerHandler(evt); break;
            case "start": await eventStarting(); break;
            case "sday": await eventStartDay(); break;
            case "snight": await eventStartNight(); break;
        }
    }
    
    /**
    Get prompt type
    returns whether to use an immediate or an end phase prompt
    **/
    this.getPromptType = function(trigger) {
        switch(trigger) {
            case "Immediate Night": case "Immediate Day": case "Immediate":
                return "immediate";
            case "Start Night": case "Start Day": case "Start Phase":
            case "End Night": case "End Day": case "End Phase":
                return "end";
        }
    }
    
    /**
    Event: Starting
    triggers at the start of the game
    **/
    this.eventStarting = async function() {
        await triggerHandler("Starting");
    }
    
    /**
    Event: Start Night
    triggers at the start of the night
    **/
    this.eventStartNight = async function() {
        await clearPrompts();
        
        // handle queued end actions
        skipActionQueueChecker = true;
        await executeEndQueuedAction();
        skipActionQueueChecker = false;
        await actionQueueChecker();
        
        // passive end actions
        await triggerHandler("Passive End Day");
        await triggerHandler("Passive End Phase");
        
        // end of phase
        await attributeCleanup();
        
        // passive start actions
        await triggerHandler("Passive Start Night");
        await triggerHandler("Start Night");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Phase");
        
        // immediate actions
        await triggerHandler("Immediate Night");
        await triggerHandler("Immediate");
        
        // end actions
        await triggerHandler("End Night");
        await triggerHandler("End Phase");
        await triggerHandler("Start Day");
        await triggerHandler("Start Phase");
    }
    
    /**
    Event: Start Day
    triggers at the start of the day
    **/
    this.eventStartDay = async function() {
        await clearPrompts();
        
        // handle queued end actions
        skipActionQueueChecker = true;
        await executeEndQueuedAction();
        skipActionQueueChecker = false;
        await actionQueueChecker();
        
        // passive end actions
        await triggerHandler("Passive End Night");
        await triggerHandler("Passive End Phase");
        
        // end of phase
        await attributeCleanup();
        
        // passive start actions
        await triggerHandler("Passive Start Day");
        await triggerHandler("Start Day");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Phase");
        
        // immediate actions
        await triggerHandler("Immediate Day");
        await triggerHandler("Immediate");
        
        // end actions
        await triggerHandler("End Day");
        await triggerHandler("End Phase");
        await triggerHandler("Start Night");
        await triggerHandler("Start Phase");
    }
    
}
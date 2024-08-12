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
                    await executeTrigger(pr.id, pr.role, trigger);
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
    async function executeTrigger(pid, src_role, trigger) {
        // iterate through abilities of the trigger
        for(const ability of trigger.abilities) {
            // check if prompts are necessary
            let prompts = getPrompts(ability);
            switch(prompts.length) {
                // if no prompts are necessary -> directly execute ability
                case 0:
                    let feedback = await executeAbility(pid, src_role, ability);
                    if(feedback) abilitySend(pid, feedback);
                break;
                // single prompt (@Selection)
                case 1: {
                    let type = toTitleCase(selectorGetType(prompts[0][1]));
                    abilityLog(`🟩 **Prompting Ability:** <@${pid}> (${toTitleCase(src_role)}) - ${toTitleCase(ability.type)} [${type}]`);
                    let promptMsg = getPromptMessage(ability, type);
                    let mid = await abilitySendProm(pid, `${getEmoji(src_role)} ${promptMsg}`, EMBED_GRAY, true);
                    await createPrompt(mid, pid, src_role, ability, type);
                } break;
                // double prompt (@Selection and @SecondarySelection)
                case 2: {
                    let type1 = toTitleCase(selectorGetType(prompts[0][1]));
                    let type2 = toTitleCase(selectorGetType(prompts[1][1]));
                    abilityLog(`🟩 **Prompting Ability:** <@${pid}> (${toTitleCase(src_role)}) - ${toTitleCase(ability.type)} [${type1}, ${type2}]`);
                    let promptMsg = getPromptMessage(ability, type1, type2);
                    let mid = await abilitySendProm(pid, `${getEmoji(src_role)} ${promptMsg}`, EMBED_GRAY, true);
                    await createPrompt(mid, pid, src_role, ability, type1, type2);
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
        await triggerHandler("Passive End Day");
        await triggerHandler("Passive End Phase");
        await attributeCleanup();
        await triggerHandler("Passive Start Night");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Night");
        await triggerHandler("Immediate Night");
        await triggerHandler("Immediate");
    }
    
    /**
    Event: Start Day
    triggers at the start of the day
    **/
    this.eventStartDay = async function() {
        await clearPrompts();
        await triggerHandler("Passive End Night");
        await triggerHandler("Passive End Phase");
        await attributeCleanup();
        await triggerHandler("Passive Start Day");
        await triggerHandler("Passive Start Phase");
        await triggerHandler("Start Day");
        await triggerHandler("Immediate Day");
        await triggerHandler("Immediate");
    }
    
}
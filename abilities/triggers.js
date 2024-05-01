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
        // get all players
        sql("SELECT role,id FROM players WHERE type='player' AND alive=1", async r => {
            // get their role's data
            for(let pr of r) {
                await triggerHandlerPlayer(pr, triggerName);
            }
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
                    await executeTrigger(pr.id, trigger);
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
    async function executeTrigger(pid, trigger) {
        // iterate through abilities of the trigger
        for(const ability of trigger.abilities) {
            // execute them
            await executeAbility(pid, ability);
        }
    }
    
    /**
    Command: $emit <trigger type>
    Manually emits a certain trigger type
    **/
    this.cmdEmit = function(channel, argsX) {
        console.log(`Emitting a ${argsX[0]} event.`);
        triggerHandler(argsX[0]);
    }
    
    /**
    Trigger: Starting
    triggers at the start of the game
    **/
    this.triggerStarting = function() {
        triggerHandler("Starting");
    }
    
}
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
        sql("SELECT role,id FROM players WHERE type='player' AND alive=1", r => {
            // get their role's data
            for(let pr of r) {
                sql("SELECT * FROM roles WHERE name=" + connection.escape(pr.role), result => {
                    // parse the formalized desc into an object
                    let parsed = JSON.parse(result[0].parsed);
                    // grab the triggers
                    let triggers = parsed.triggers;
                    // filter out the relevant triggers
                    triggers = triggers.filter(el => el.trigger == triggerName);
                    triggers.forEach(el => {
                        // execute all relevant triggers
                        executeTrigger(pr.id, el);
                    });
                });
            }
        });
    }
    
    /**
    Execute Trigger
    executes the abilities of a trigger if applicable
    **/
    function executeTrigger(pid, trigger) {
        // iterate through abilities of the trigger
        trigger.abilities.forEach(el => {
            // execute them
            executeAbility(pid, el);
        });
    }
    
    /**
    Command: $emit <trigger type>
    Manually emits a certain trigger type
    **/
    this.cmdEmit = function(channel, argsX) {
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
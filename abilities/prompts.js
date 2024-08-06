/**
    Abilities Module - Main
    The submodule for implement ability prompts
**/

module.exports = function() {
    /** 
    Create Prompt
    creates a new prompt in the prompt table
    **/
    this.createPrompt = async function(mid, pid, src_role, ability) {
        await new Promise(res => {
            sql("INSERT INTO prompts (message_id,player_id,src_role,ability) VALUES (" + connection.escape(mid) + "," + connection.escape(pid) + "," + connection.escape(src_role) + "," + connection.escape(JSON.stringify(ability)) + ")", result => {
                res();
            });            
        });
    }
    
    /**
    Check for Prompts
    iterates through all values of an ability object to check if any contain a @Selection in which case a prompt is necessary
    **/
     this.getPrompts = function(ability) {
        // iterate through all object values
        let foundSelections = [];
        Object.keys(ability).forEach(key => {
            let val = ability[key];
            // check if its a string type value
            if(typeof val !== "string") return;
            // to lower case
            val = val.toLowerCase();
            if(val.indexOf("@selection") >= 0 || val.indexOf("@secondaryselection") >= 0) {
                foundSelections.push([key,val]);
            }
        });
        return foundSelections;
    }
    
    /**
    Clear Prompts
    clears all prompts from the table
    **/
    this.clearPrompts = async function() {
        return new Promise(res => {
            sql("DELETE FROM prompts", () => {
                res();
            });
        });
    }
}
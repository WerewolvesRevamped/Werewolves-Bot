/**
    Abilities Module - Win
    The module for implementing winning
**/

module.exports = function() {
    
    /**
    Ability: Win
    **/
    this.abilityWin = async function(src_ref, src_name, ability, additionalTriggerData) {
        let self = await parsePlayerSelector("@self", src_ref, additionalTriggerData);
        
        if(self.length != 1) {
            abilityLog(`❗ **Error:** Invalid self for win!`);
            return { msg: "Win failed! " + abilityError, success: false };
        }
        self = self[0];
        
        
        // set final status as win
        await setFinalResult(self, 1);
        
        // log ascension
        abilityLog(`❇️ **Victory:** <@${self}> has won.`);
        actionLog(`👑 <@${self}> has won.`);
        await bufferStorytime(`${idToEmoji(self)} <@${self}> has won!`);
        
        // final trigger
        await triggerHandler("On End"); 
        // end game
        await gameEnd();
        // end message
        await endMessage();
        
        // return
        return { msg: "Win succeeded!", success: false };
    }
    
}
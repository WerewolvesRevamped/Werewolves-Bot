/**
    Abilities Module - Ascend / Descend
    The module for implementing ascend & descend ability types
**/

module.exports = function() {
    
    /**
    Ability: Ascend
    **/
    this.abilityAscend = async function(src_ref, src_name, ability, additionalTriggerData) {
        let self = await parsePlayerSelector("@self", src_ref, additionalTriggerData);
        
        if(self.length != 1) {
            abilityLog(`❗ **Error:** Invalid self for ascension!`);
            return { msg: "Ascension failed! " + abilityError, success: false };
        }
        self = self[0];
        
        // execute the kill
        await killPlayer(self, true);
        
        // set final status as win
        await setFinalResult(self, 1);
        
        // log ascension
        abilityLog(`🪽 **Ascension:** <@${self}> wins!`);
        
        // buffer storytime
        await bufferStorytime(`<@${self}> has ascended and wins!`);
        
        // return
        return { msg: "Ascension succeeded!", success: false };
    }
    
    /**
    Ability: Descend
    **/
    this.abilityDescend = async function(src_ref, src_name, ability, additionalTriggerData) {
        let self = await parsePlayerSelector("@self", src_ref, additionalTriggerData);
        
        if(self.length != 1) {
            abilityLog(`❗ **Error:** Invalid self for descension!`);
            return { msg: "Descension failed! " + abilityError, success: false };
        }
        self = self[0]
        
        // execute the kill
        await killPlayer(self, true);
        
        // set final status as loss
        await setFinalResult(self, 0);
        
        // log descension
        abilityLog(`☠️ **Descension:** <@${self}> loses!`);
        
        // buffer storytime
        await bufferStorytime(`<@${self}> has descended and loses!`);
        
        // return
        return { msg: "Descension succeeded!", success: false };
    }
    
    
    /** PUBLIC
    Set Final Result
    set the final result for a player
    // WIP: Maybe this should be in player module
    **/
    this.setFinalResult = function(player_id, status) {
        return new Promise(res => {
            sql("UPDATE players SET final_result=" + connection.escape(status) + " WHERE id=" + connection.escape(player_id), result => {
                res();
            });	
        });
    }
    
}
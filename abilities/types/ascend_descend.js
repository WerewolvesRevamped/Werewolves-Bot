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
        actionLog(`🪽 <@${self}> ascends and wins!`);
        
        // buffer storytime
        await bufferStorytime(`${idToEmoji(self)} <@${self}> has ascended and wins!`);
        
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
        actionLog(`☠️ <@${self}> descends and loses!`);
        
        // buffer storytime
        await bufferStorytime(`${idToEmoji(self)} <@${self}> has descended and loses!`);
        
        // return
        return { msg: "Descension succeeded!", success: false };
    }
    
}
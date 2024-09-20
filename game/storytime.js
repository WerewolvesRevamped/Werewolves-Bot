/**
    Game Module - Story Time
    The module for implementing story time
**/

module.exports = function() {
    
    /** PUBLIC
    Buffer Storytime
    this adds a message to the storytime buffer
    **/
    this.bufferStorytime = function(message) {
        return sqlProm("INSERT INTO storytime (message) VALUES (" + connection.escape(message) + ")");
    }
    
    /** PUBLIC
    Resets storytime buffer entirely
    **/
    this.resetStorytime = function() {
        return sqlProm("DELETE FROM storytime");
    }
    
    /** PUBLIC
    Post storytime
    **/
    this.postStorytime = async function() {
        let msgs = await sqlProm("SELECT * FROM storytime ORDER BY ai_id ASC");
        
        let phaseName = getPhaseAsText();
        let finalMessage = msgs.map(el => autoPunctate(el.message)).join("\n");
        if(finalMessage.length <= 0) finalMessage = "*Nothing happened...*";
        
        // get icon
         let lutval = applyLUT(isNight() ? "night" : "day");
        if(lutval) lutval = `${iconRepoBaseUrl}${lutval}.png`;
        else lutval = null;
        
        // send message
        await locationSend("storytime", finalMessage, EMBED_GRAY, lutval, `Story Time - ${phaseName}`);
        
        // reset storytime
        await resetStorytime();
        
    }
    
    /** PUBLIC
    Post storytime
    **/
    this.postStorytimeImmediate = async function() {
        let msgs = await sqlProm("SELECT * FROM storytime ORDER BY ai_id ASC");
        
        let phaseName = "Mid-" + getPhaseAsText();
        let finalMessage = msgs.map(el => autoPunctate(el.message)).join("\n");
        if(finalMessage.length <= 0) return;
        
        // get icon
         let lutval = applyLUT(isNight() ? "night" : "day");
        if(lutval) lutval = `${iconRepoBaseUrl}${lutval}.png`;
        else lutval = null;
        
        // send message
        await locationSend("storytime", finalMessage, EMBED_GRAY, lutval, `Story Time - ${phaseName}`);
        
        // reset storytime
        await resetStorytime();
        
    }
    
}
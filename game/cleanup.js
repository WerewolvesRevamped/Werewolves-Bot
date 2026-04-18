/**
	Game Module - Cleanup
	Handles game reset/cleanup
*/
module.exports = function() {

	/**
    SC Cleanup
    Deletes all the SC categories
    */
	this.scCleanup = async function(channel) {
        // Iterate through the SC categories and delete them all
		for(let i = 0; i < cachedSCs.length; i++) {
			cleanupCat(channel, cachedSCs[i], "SC #" + (i+1));
		}
        // Reset SC Cat Database
        await sqlProm("DELETE FROM sc_cats");
        channel.send("✅ Successfully reset sc cat list!");
        getCCCats();
	}
    
    /**
    Command: $archived
    Marks a game as archived
    **/
	this.cmdArchived = async function(channel) {
		if(stats.gamephase != gp.POSTGAME && stats.gamephase != gp.NONE) {
            channel.send("⛔ Command error. Can only mark game as archived while in postgame state!");
            return;
        }
        // update gamephase
        await sqlProm("UPDATE stats SET value=" + connection.escape(gp.ARCHIVED) + " WHERE id=1");
        stats.gamephase = gp.ARCHIVED;
        // update gp channel
        updateGameStatus();
        channel.send("✅ Game has been archived.");
	}
    
}
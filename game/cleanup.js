/**
	Game Module - Cleanup
	Handles game reset/cleanup
*/
module.exports = function() {

	/**
    SC Cleanup
    Deletes all the SC categories
    */
	this.scCleanup = function(channel) {
        // Iterate through the SC categories and delete them all
		for(let i = 0; i < cachedSCs.length; i++) {
			cleanupCat(channel, cachedSCs[i], "SC #" + (i+1));
		}
        // Reset SC Cat Database
        sql("DELETE FROM sc_cats", result => {
            channel.send("✅ Successfully reset sc cat list!");
            getCCCats();
        }, () => {
            channel.send("⛔ Database error. Could not reset sc cat list!");
        });
	}
    
}
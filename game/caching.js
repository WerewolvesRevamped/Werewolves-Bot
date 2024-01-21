/**
	Game Module - Caching
	Handles caching for the games module
*/
module.exports = function() {
    /**
    Cached Values
    **/
	this.cachedPublic = [];
	this.cachedSCs = [];
	this.scCatCount = 0;
    
    /**
    Get Secret Channel Categories
    caches the ids of the secret channel categories
    **/
	this.getSCCats = function() {
		// Get SC Cats
		sql("SELECT id FROM sc_cats", result => {
			// Cache SC Cats
			cachedSCs = result.map(el => el.id);
		}, () => {
			// Db error
			log("CC > Database error. Could not cache sc cat list!");
		});
	}
    
    /**
    Get Public Category
    Cache Public category
    */
	this.getPublicCat = function() {
		sqlGetStat(15, result => {
			cachedPublic = result;
		}, () => {
			log("Roles > ❗❗❗ Unable to cache Public Category!");
		});
	}
    
    /**
    Is Secret Channel
    Check if a channel is a SC
    */
	this.isSC = function(channel) {
		return !channel.parent ? true : cachedSCs.includes(channel.parentId);
	}
    
	/**
    Is Public Channel
    Check if a channel is a SC
    */
	this.isPublic = function(channel) {
		return !channel.parent ? false : channel.parentId === cachedPublic;
	}
	
    
}
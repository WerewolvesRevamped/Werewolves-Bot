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
		sql("SELECT id FROM sc_cats ORDER BY ai_id ASC", result => {
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
    
    
    /**
    Cache Locations
    caches the current state of the locations database
    **/
    this.cachedLocations = [];
    this.cacheLocations = function() {
		sql("SELECT name FROM locations", result => {
				cachedLocations = result.map(el => el.name);
		}, () => {
			log("Game > ❗❗❗ Unable to cache locations!");
		});
	}
    
    /**
    Cache Polls
    caches the current state of the polls database
    **/
    this.cachedPolls = [];
    this.cachePolls = function() {
		sql("SELECT name FROM polls", result => {
				cachedPolls = result.map(el => el.name);
		}, () => {
			log("Game > ❗❗❗ Unable to cache polls!");
		});
	}
    
    /**
    Cache Teams
    caches the current state of the teams database
    **/
    this.cachedTeams = [];
    this.cachedTeamNames = [];
    this.cacheTeams = function() {
		sql("SELECT name,display_name FROM teams", result => {
				cachedTeams = result.map(el => el.name);
				cachedTeamNames = result.map(el => parseTeam(el.display_name));
		}, () => {
			log("Game > ❗❗❗ Unable to cache teams!");
		});
	}
	
    
}
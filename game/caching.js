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
	this.getSCCats = async function() {
		// Get SC Cats
		let result = await sqlProm("SELECT id FROM sc_cats ORDER BY ai_id ASC");
        // Cache SC Cats
        cachedSCs = result.map(el => el.id);
        scCatCount = cachedSCs.length;
	}
    
    /**
    Get Public Category
    Cache Public category
    */
	this.getPublicCat = async function() {
        cachedPublic = await sqlGetStatProm(statID.PUBLIC_CATEGORY);
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
        if(!channel) return false;
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
    Cache Displays
    caches the current state of the displays database
    **/
    this.cachedDisplays = [];
    this.cacheDisplays = function() {
		sql("SELECT name FROM displays", result => {
				cachedDisplays = result.map(el => el.name);
		}, () => {
			log("Game > ❗❗❗ Unable to cache displays!");
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
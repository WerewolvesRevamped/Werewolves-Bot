/**
    Caching for player values
**/

module.exports = function() {
    
	/* Variables */
	this.emojiIDs = null;
	this.ccs = null;
	this.pRoles = null;
	this.playerIDs = null;
    
	/** 
    Emoji Cache
    caches emojis    
    */
	this.getEmojis = function() {
		sql("SELECT id,emoji FROM players", result => {
				emojiIDs = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache player emojis!");
		});
	}
	
	/**
    CC Cache
    caches cc values
    **/
	this.getCCs = function() {
		sql("SELECT id,ccs FROM players", result => {
				ccs = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache ccs!");
		});
	}
	
	/**
    Player Role Cache
    caches player roles
    **/
	this.getPRoles = function() {
		sql("SELECT id,role FROM players", result => {
				pRoles = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache roles!");
		});
	}
	
	/**
    ID Cache
    caches player ids
    **/
	this.getIDs = function() {
		sql("SELECT id FROM players", result => {
				playerIDs = result.map(el => el.id);
		}, () => {
			log("Players > ❗❗❗ Unable to cache player ids!");
		});
	}
    
}
/**
Permission Checks
**/

module.exports = function() {
	/* Check if a member is a Game Master (or Bot) */
	this.isGameMaster = function(member, noAdminIngame = false) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.gamemaster) || member.roles.cache.get(stats.bot) || member.roles.cache.get(stats.admin) || (!noAdminIngame && member.roles.cache.get(stats.admin_ingame)));
	}
    
	/* Check if a member is a Game Master (or Bot) */
	this.isHelper = function(member) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.helper) || member.roles.cache.get(stats.bot) || member.roles.cache.get(stats.admin));
	}
    
	/* Check if a member is an Admin (or Bot) */
	this.isAdmin = function(member, noAdminIngame = false) {
        if(!member) return false;
		if (!stats.admin) return true; //fallback for before admin set
		return member && member.roles && (member.roles.cache.get(stats.admin) || (!noAdminIngame && member.roles.cache.get(stats.admin_ingame)));
	}
    
	/* Check if a member is a Senior GM */
	this.isSenior = function(member) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.senior_gamemaster));
	}
    
	/* Check if a member is a Host */
	this.isHost = function(member) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.host));
	}

	/* Check if a member is a (living) participant */
	this.isParticipant = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.participant);
	}
    
	/* Check if a member is a ghost */
	this.isGhost = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.ghost);
	}
	
	/* Check if a member is a dead participant */
	this.isDeadParticipant = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.dead_participant);
	}
	
	/* Check if a member is a dead participant */
	this.isSpectator = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.spectator);
	}

	/* Check if a member is signed up */
	this.isSignedUp = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.signed_up);
	}

	/* Check if a member is a sub */
	this.isSub = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.sub) || member.roles.cache.get(stats.signedsub);
	}
    
	/* Check if a member is a mentor */
	this.isMentor = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.mentor);
	}
    
    /* Check if member is game involved */
    this.isGameInvolved = function(member) {
        return isParticipant(member) || isSignedUp(member) || isSub(member) || isDeadParticipant(member) || isGhost(member) || isMentor(member);
    }
}
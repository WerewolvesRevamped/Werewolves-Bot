/**
	Utility Module - Permissions
    This module has utility functions related to permissions
*/
module.exports = function() {
    	
	/**
    Get Permissions
    Creates a permission object using the mapPerm function
    Maps two permission arrays + a role id to a permission object
    */
	this.getPerms = function(id, allow, deny) {
		allow = allow.map(el => mapPerm(el));
		deny = deny.map(el => mapPerm(el));
		return { id: id, allow: allow, deny: deny };
	}

	/**
    Map Permissions
    Converts simplified permission names to discord permissions
    Used by getPerms
    */
	this.mapPerm = function(permission) {
		switch(permission) {
			case "read": return PermissionsBitField.Flags.ViewChannel;
			case "write": return PermissionsBitField.Flags.SendMessages;
			case "manage": return PermissionsBitField.Flags.ManageMessages;
			case "history": return PermissionsBitField.Flags.ReadMessageHistory;
			default: return "";
		}
	}
	
	/**
    Check if Game Master
    Commands for only GMs. Returns false and an error message for non-gms. Returns true for gms
    */
	this.checkGM = function(message) {
		if(!isGameMaster(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command!"); 
			return false;
		} 
		return true;
	}
    
    /**
    Check if Game Master or Helper
    Commands for only GMs/Helpers. Returns false and an error message for non-gms/helpers. Returns true for gms/helpers
    */
	this.checkGMHelper = function(message) {
		if(!isGameMaster(message.member) && !isHelper(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command!"); 
			return false;
		} 
		return true;
	}
    
	/**
    Check if Admin
    Commands for only Admins. Returns false and an error message for non-admins. Returns true for admins
    */
	this.checkAdmin = function(message) {
		if(!isAdmin(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command! (Admin required)"); 
			return false;
		} 
		return true;
	}
    
	/**
    Check if Senior GM
    Commands for only sgms. Returns false and an error message for non-sgms. Returns true for sgms
    */
	this.checkSenior = function(message) {
		if(!isSenior(message.member)) { 
			message.channel.send("❌ You're not allowed to use this command! (Senior GM required)"); 
			return false;
		} 
		return true;
	}
	
	/**
    Check if GMSAFE + Check if Game Master
    First runs checkGM to check if the player is a GM and then checks if the channel is GMSAFE. Returns false if either is false, returns true if both are true.
    */
	this.checkSafe = function(message) {
		if(!message.member || checkGM(message)) {
			if(message.channel.topic != "GMSAFE") { 
				message.channel.send("❌ This command can only be executed in game master channels! Make a channel a game master channel by setting its topic to `GMSAFE`!"); 
				return false;
			}
			return true;
		}
		return false;
	}
    
}
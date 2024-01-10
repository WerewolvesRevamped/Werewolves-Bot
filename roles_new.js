/**
New Roles Module

**/
module.exports = function() {
    
    this.rolesCache = null;
    
    /**
    Clear Roles
    deletes the entire contents of the roles database
    **/
    this.cmdNewRolesClear = function(channel) {
		sql("DELETE FROM roles_new", result => {
			channel.send("⛔ Database error. Could not clear roles!");
			cacheRoles();
		}, () => {
			channel.send("✅ Successfully cleared roles!");
		});
	}
    
    /**
    Cache Roles
    caches the current state of the roles database
    **/
    this.cacheRoles = function() {
		sql("SELECT name FROM roles_new", result => {
				cachedRoles = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache role!");
		});
	}
    
    
}
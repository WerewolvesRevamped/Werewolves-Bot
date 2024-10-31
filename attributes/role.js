/**
    Roles Module - Role Attributes
    Submodule for role attributes
**/

module.exports = function() {
    
    /**
    Has Role Attribute
    checks if a certain role has a certain role attribute
    **/
    this.hasRoleAttribute = async function(role, attributeName) {
        // parse role name
        let parsedRole = parseRole(role);
        if(!verifyRole(parsedRole)) return false;
        
        // get role attributes
        let roleData = await sqlPromOneEsc("SELECT attributes FROM roles WHERE name=", parsedRole);
        
        // invalid
        if(!roleData || !roleData.attributes) return false;
        
        // check if role attribute exists
        let parsedAttributeName = attributeName.trim().toLowerCase();
        return roleData.attributes.split(",").includes(attributeName);
    }
    
    /**
    Player has role attribute
    checks if a certain player has a role attribute
    **/
    this.playerHasRoleAttribute = async function(player_id, attributeName) {
        let roleData = await sqlPromOneEsc("SELECT roles.attributes FROM roles JOIN players ON players.role=roles.name WHERE players.id=", player_id);
        
        // invalid
        if(!roleData || !roleData.attributes) return false;
        
        // check if role attribute exists
        let parsedAttributeName = attributeName.trim().toLowerCase();
        return roleData.attributes.split(",").includes(attributeName);
        
    }
    
    
}
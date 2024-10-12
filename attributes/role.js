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
        let roleData = await sqlProm("SELECT attributes FROM roles WHERE name=" + connection.escape(parsedRole));
        
        // invalid
        if(!roleData[0] || !roleData[0].attributes) return false;
        
        // check if role attribute exists
        let parsedAttributeName = attributeName.trim().toLowerCase();
        return roleData[0].attributes.split(",").includes(attributeName);
    }
    
    
}
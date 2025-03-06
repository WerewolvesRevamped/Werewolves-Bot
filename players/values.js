/**
Values
**/

module.exports = function() {
    
    /**
    Check if Player is Alive
    **/
    this.isAlive = async function(pid) {
        let pData = await sqlPromOneEsc("SELECT alive FROM players WHERE id=", pid);
        return pData && pData.alive == 1;
    }
    
    
}
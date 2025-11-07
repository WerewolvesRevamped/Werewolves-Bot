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
    
    /**
    Check if Player is Ghostly
    **/
    this.isGhostly = async function(pid) {
        let pData = await sqlPromOneEsc("SELECT alive FROM players WHERE id=", pid);
        return pData && pData.alive == 2;
    }
    
    /** 
    Set Final Result
    set the final result for a player
    **/
    this.setFinalResult = function(player_id, status) {
        return sqlPromEsc("UPDATE players SET final_result=" + connection.escape(status) + " WHERE id=", player_id);
    }
    
    /**
    Get Living Status
    get the alive value for a player
    **/
    this.getLivingStatus = async function(player_id) {
        let res = await sqlPromEsc("SELECT alive FROM players WHERE id=", player_id);
        return !res || !res[0] ? -1 : res[0].alive;
    }
    
    /**
    Set Living Status
    set the alive value for a player
    **/
    this.setLivingStatus = async function(player_id, status) {
        await sqlPromEsc("UPDATE players SET alive=" + connection.escape(status) + " WHERE id=", player_id);
        updateGameStatus(); // update game status (async)
    }
    
    /**
    Get Activation
    get the activation value for a player
    **/
    this.getActivation = async function(player_id) {
        let res = await sqlPromEsc("SELECT activation FROM players WHERE id=", player_id);
        return !res || !res[0] ? -1 : res[0].activation;
    }
    
    /**
    Set Activation
    set the activation value for a player
    **/
    this.setActivation = async function(player_id, act) {
        await sqlPromEsc("UPDATE players SET activation=" + connection.escape(act) + " WHERE id=", player_id);
    }
    
    /**
    Set Death Phase
    set the death phase value for a player
    **/
    this.setDeathPhase = function(player_id, deathPhase) {
        return sqlPromEsc("UPDATE players SET death_phase=" + connection.escape(deathPhase) + " WHERE id=", player_id);
    }

    /**
    Set Role
    set the role value for a player
    **/
    this.setPlayerRole = async function(player_id, role) {
        let parsedRole = parseRole(role);
        let roleData = await getRoleDataFromName(parsedRole);
        return sqlProm("UPDATE players SET role=" + connection.escape(parsedRole) + ",alignment=" + connection.escape(roleData.team) + " WHERE id=" + connection.escape(player_id));
    }
    
    /**
    Get Role
    get the role value for a player
    **/
    this.getPlayerRole = async function(player_id) {
        let pData = await sqlPromOneEsc("SELECT role FROM players WHERE id=", player_id);
        return !pData ? "none" : pData.role;
    }
    
    /**
    Set Alignment
    set the alignment value for a player
    **/
    this.setPlayerAlignment = async function(player_id, alignment) {
        let parsedAlignment = parseTeam(alignment);
        return sqlProm("UPDATE players SET alignment=" + connection.escape(parsedAlignment) + " WHERE id=" + connection.escape(player_id));
    }
    
    
}

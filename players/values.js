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
        return !res ? -1 : res[0].alive;
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
    Set Alignment
    set the alignment value for a player
    **/
    this.setPlayerAlignment = async function(player_id, alignment) {
        let parsedAlignment = parseTeam(alignment);
        return sqlProm("UPDATE players SET alignment=" + connection.escape(parsedAlignment) + " WHERE id=" + connection.escape(player_id));
    }
    
    
}

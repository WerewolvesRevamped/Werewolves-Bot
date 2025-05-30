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
    Set Final Result
    set the final result for a player
    **/
    this.setFinalResult = function(player_id, status) {
        return sqlPromEsc("UPDATE players SET final_result=" + connection.escape(status) + " WHERE id=", player_id);
    }
    
    /**
    Set Living Status
    set the alive value for a player
    **/
    this.setLivingStatus = async function(player_id, status) {
        await sqlPromEsc("UPDATE players SET alive=" + connection.escape(status) + " WHERE id=" + player_id);
        updateGameStatus(); // update game status (async)
    }
    
    /**
    Set Death Phase
    set the death phase value for a player
    **/
    this.setDeathPhase = function(player_id, deathPhase) {
        return sqlPromEsc("UPDATE players SET death_phase=" + connection.escape(deathPhase) + " WHERE id=", player_id);
    }
    
    
}
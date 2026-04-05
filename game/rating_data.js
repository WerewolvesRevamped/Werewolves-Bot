/**
    Functions to store and prepare rating data
**/

module.exports = function() {
    
    this.createEvent = async function(id, type, data1, data2 = "", phaseOverwrite = null) {
        await sqlProm("INSERT INTO events (id, type, data1, data2, phase) VALUES (" + connection.escape(id) + "," + connection.escape(type) + "," + connection.escape(data1) + "," + connection.escape(data2) + "," + connection.escape(phaseOverwrite ?? getPhaseAsNumber()) +  ")");
    }
    
    this.clearEvents = async function() {
        await sqlProm("DELETE FROM events");
    }
    
}
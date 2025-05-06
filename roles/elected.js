/**
    Roles Module - Elected
    Handles functionality related to elected roles
**/
module.exports = function() {

     
    /**
    Reporter Message
    Sends a reporter message
    **/
    this.reporterMessage = function(player_id) {
        var reportMsg;
        // Get info
        sql("SELECT role FROM players WHERE id = " + connection.escape(player_id), result => {
            if(!result[0] || !result[0].role) { log("Cannot find role in reporterMessage"); return; }
            let rName = toTitleCase(result[0].role);
            let rEmoji = getRoleEmoji(rName);
            if(!rEmoji) rEmoji = "";
            // Send reporter message
            reportMsg = `<@${player_id}> was a \`${rName}\` ${rEmoji}`;
            connectionSend("reporter", reportMsg, "Reporter");
        }, () => {
            // Send reporter message
            reportMsg = "⛔ Database error. Could not generate report!";
            connectionSend("reporter", reportMsg, "Reporter");
        });
    }
	
    
}
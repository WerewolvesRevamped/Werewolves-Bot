/**
        Game Module - Whispers
        - Connects channels
        - V2 of whispers
*/
module.exports = function() {
    
	/**
    Connection Add
    creates a new connection
    **/
	this.connectionAdd = function(channelId, connectionName, disguise = "") {
        return sqlProm("INSERT INTO connected_channels (channel_id, id, name) VALUES (" + connection.escape(channelId) + "," + connection.escape(connectionName) + "," + connection.escape(disguise) + ")");
	}
    
    /**
    Connection Get
    retrieves a connection by name
    **/
    this.connectionGet = function(connectionName) {
        return sqlPromEsc("SELECT * FROM connected_channels WHERE id=", connectionName);
    }
    
    /**
    Connection Get By Channel
    retrieves a connection by channel id
    **/
    this.connectionGetByChannel = function(channelId) {
        return sqlPromEsc("SELECT * FROM connected_channels WHERE channel_id=", channelId);
    }
    
    /**
    Connection Delete
    deletes a connection by name
    **/
    this.connectionDelete = function(connectionName) {
        return sqlPromEsc("DELETE FROM connected_channels WHERE id=", connectionName);
    }
    
    /**
    Connection Send
    sends a message through a connection
    **/
    this.connectionSend = function(conName, msg, disguise = false) {
        // get connected channels from DB
        sql("SELECT channel_id FROM connected_channels WHERE id = " + connection.escape(conName), result => {
            // iterate through all connected channels
            for(let i = 0; i < result.length; i++) {
                if(disguise) sendMessageDisguise(result[i].channel_id, msg, disguise); // has disguise
                else sendMessage(result[i].channel_id, msg); // no disguise
            }
        });
    }
    
}
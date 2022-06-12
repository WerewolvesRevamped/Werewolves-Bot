/*
	Module for using sql / interacting with the database
		- Simplified sql access w/ automatic error logging
		- Simplified access to stats
*/
module.exports = function() {
	/* Variables */
	this.connection = null;
	this.mysql = require("mysql");

	
	/* Create Connection */
	this.sqlSetup = function() {
		// Create connection
		connection = mysql.createConnection({
			host     :  config.db.host,
			user     : config.db.user,
			password : config.db.password,
			database : config.db.database,
			charset: "utf8mb4"
		});
		// Connection connection
		connection.connect(err => {
			if(err) logO(err);
			else getStats();
		});
	}

	/* Does a sql query and calls one callback with result on success and logs an error and calls another callback on failure */
	this.sql = function(q, rC, eC) {
		sqlQuery(q, rC, eC, 0)
	}
	
	/* Does a sql query and calls one callback with result[0].value on success and logs an error and calls another callback on failure */
	this.sqlValue = function(q, rC, eC) {
		sqlQuery(q, rC, eC, 1)
	}
	
	/* Sets a stat in the stat database */
	this.sqlSetStat = function(id, value, resCallback, errCallback) {
		sql("UPDATE stats SET value = " + connection.escape(value) + " WHERE id = " + connection.escape(id), resCallback, errCallback);
	}

	/* Gets a stat from the stat database */
	this.sqlGetStat = function(id, resCallback, errCallback) {
		sqlValue("SELECT value,name FROM stats WHERE id = " + connection.escape(id), resCallback, errCallback);
	}
	
	/* Does SQL Queries */
	this.sqlQuery = function(query, resCallback, errCallback, mode) {
		// Do query
		connection.query(query, function(err, result, fields) {
			// Check success
			if(!err && result) { 
				// Check which mode and return result accordingly
				switch(mode) {
					case 0: resCallback(result); break;
					case 1: result[0] ? resCallback(result[0].value) : errCallback(); break;
					default: resCallback(result); break;
				}
			} else { 
				// Handle error
				logO(err);
				errCallback();
			}
		});
	}
	
}

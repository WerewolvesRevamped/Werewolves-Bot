/*
	Module for using sql / interacting with the database
		- Simplified sql access w/ automatic error logging
		- Simplified access to stats
*/
module.exports = function() {
	/* Variables */
	this.connection = null;
	this.mysql = require("mysql");

	
	/**
    SQL Setup
    Creates the connection to the database and then loads all the stats afterwards
    */
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

	/**
    SQL Query
    Does a sql query and calls one callback with result on success and logs an error and calls another callback on failure
    Basically a wrapper for sqlQuery with mode=0
    **/
	this.sql = function(q, rC, eC) {
		sqlQuery(q, rC, eC, 0)
	}
	
	/**
    SQL Value
    Does a sql query and calls one callback with result[0].value on success and logs an error and calls another callback on failure
    Basically a wrapper for sqlQuery with mode=1
    */
	this.sqlValue = function(q, rC, eC) {
		sqlQuery(q, rC, eC, 1)
	}
	
	/**
    SQL Set Stats
    Sets a stat in the stat database by numeric id
    */
	this.sqlSetStat = function(id, value, resCallback = ()=>{}, errCallback = ()=>{}) {
		sql("UPDATE stats SET value = " + connection.escape(value) + " WHERE id = " + connection.escape(id), resCallback, errCallback);
	}

	/**
    SQL Get Stat
    Gets a stat from the stat database by numeric id
    */
	this.sqlGetStat = function(id, resCallback, errCallback) {
		sqlValue("SELECT value,name FROM stats WHERE id = " + connection.escape(id), resCallback, errCallback);
	}
	
	/**
    SQL Query (Internal)
    Does SQL Queries. Should only be called internally from other sql functions
    The universal sql query function. Takes a query and two callbacks, and optionally a mode value.
    Modes:
    0: Default query, resolves the promise with the query's result
    1: Either resolves with result[0].value if result[0] is set or runs the error callback
    */
	this.sqlQuery = function(query, resCallback = ()=>{}, errCallback = ()=>{}, mode = 0) {
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
    
    /**
    SQL Promise
    Does a sql query as a promise
    **/
    this.sqlProm = function(query) {
        return new Promise(res => {
              sql(query, result => {
                  res(result);
              });
        });
    }
    
    /**
    SQL Promise (Escaped)
    Does a sql query as a promise and appends an escaped value which was parsed unescaped as a second parameter
    **/
    this.sqlPromEsc = function(query, val) {
        return sqlProm(query + connection.escape(val));
    }
	
}

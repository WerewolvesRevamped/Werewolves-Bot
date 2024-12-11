/*
	Module for themes
*/
module.exports = function() {
	/* Variables */
	this.cachedTheme = [];
	
	/* Handle roles command */
	this.cmdTheme = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Role Subcommand
			case "set": cmdThemeSet(message.channel, args); break;
			case "remove": cmdThemeRemove(message.channel, args); break;
			case "list": cmdThemeList(message.channel, args); break;
			case "select": cmdThemeSelect(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	/* Lists all themes/themed words */
	this.cmdThemeList = function(channel, args) {
		if(!args[1]) {
			// Get all roles
			sql("SELECT theme FROM theme ORDER BY theme ASC", result => {
				if(result.length > 0) {
					// At least one role exists  
					channel.send("✅ Current Themes: `default`" + removeDuplicates(result.map(el => el.theme)).map(el => ", `" + el + "`").join(""));
				} else { 
					// No roles exist
					channel.send("⛔ Database error. Could not find any themes other than `default`!");
				}
			}, () => {
				// DB error
				channel.send("⛔ Database error. Couldn't look for theme list!");
			});
		} else {
			sql("SELECT original,new FROM theme WHERE theme = " + connection.escape(args[1]) + " ORDER BY theme ASC", result => {
				if(result.length > 0) {
					// At least one role exists
                    result = result.map(el => "\n" + el.original + " => " + el.new);
                    console.log(result);
                    // chunk messages
                    let msg = "";
                    let msgs = [];
                    for(let i = 0; i < result.length; i++) {
                        if((msg.length + result[i].length) < 1900) {
                            msg = msg + result[i];
                        } else {
                            msgs.push(msg);
                            msg = result[i];
                        }
                    }
                    msgs.push(msg); // final message (<1900)
                    // send messages
					channel.send("✅ Theme: `" + args[1] + "`" + msgs[0]);
                    for(let i = 1; i < msgs.length; i++) channel.send(msgs[i]);
				} else { 
					// No roles exist
					channel.send("⛔ Database error. Could not find any entries for theme `" + args[1] + "`!");
				}
			}, () => {
				// DB error
				channel.send("⛔ Database error. Couldn't look for theme list!");
			});
		}
	}
	
	
	/* Sets a themed word */
	this.cmdThemeSet = function(channel, args) {
		// Check arguments
		if(!args[1] || !args[2] || !args[3]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Insert Entry & Preview it
		sql("DELETE FROM theme WHERE theme = " + connection.escape(args[1]) + " AND original = " + connection.escape(args[2].toLowerCase()), result => {
			sql("INSERT INTO theme (theme, original, new) VALUES (" + connection.escape(args[1]) + "," + connection.escape(args[2].toLowerCase()) + "," + connection.escape(args[3].toLowerCase()) + ")", result => {
				channel.send("✅ Replaced `" + args[2] + "` with `" + args[3] + "` in `" + args[1] + "`"); 
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set themed word!");
			});		
		}, () => {
			channel.send("⛔ Database error. Could not prepare database!");
		});
		sql("DELETE FROM theme WHERE theme = " + connection.escape(args[1]) + " AND original = " + connection.escape(toTitleCase(args[2])), result => {
			sql("INSERT INTO theme (theme, original, new) VALUES (" + connection.escape(args[1]) + "," + connection.escape(toTitleCase(args[2])) + "," + connection.escape(toTitleCase(args[3])) + ")", result => {
				channel.send("✅ Replaced `" + toTitleCase(args[2]) + "` with `" + toTitleCase(args[3]) + "` in `" + toTitleCase(args[1]) + "`"); 
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set themed word!");
			});		
		}, () => {
			channel.send("⛔ Database error. Could not prepare database!");
		});
	}

	
	/* Removes a theme word */
	this.cmdThemeRemove = function(channel, args) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Delete info
		sql("DELETE FROM theme WHERE theme = " + connection.escape(args[1]) + " AND original = " + connection.escape(args[2]), result => {
			channel.send("✅ Removed `" + args[2] + "` from `" + toTitleCase(parseRole(args[1])) + "`!");
			getRoles();
		}, () => {
			// Couldn't delete
			channel.send("⛔ Database error. Could not remove role!");
		});
		// Delete info
		sql("DELETE FROM theme WHERE theme = " + connection.escape(args[1]) + " AND original = " + connection.escape(toTitleCase(args[2])), result => {
			channel.send("✅ Removed `" + toTitleCase(args[2]) + "` from `" + toTitleCase(parseRole(args[1])) + "`!");
			getRoles();
		}, () => {
			// Couldn't delete
			channel.send("⛔ Database error. Could not remove role!");
		});
	}
	
	this.cmdThemeSelect = function(channel, args) {
		cmdOptionsSet(channel, args, "29"); 
	}
	
	// can apply a theme onto both strings and arrays
	this.applyTheme = function(text) {
		if(text instanceof Array) {
			return text.map(el => applyTheme(el));
		} else {
			cachedTheme.forEach(el => text = text.replace(new RegExp(el.original, "g"), el.new));
			return text;
		}
	}
	
	this.cacheTheme = function() {
		sql("SELECT original,new FROM theme WHERE theme = " + connection.escape(stats.theme) + " ORDER BY theme ASC", result => {
				cachedTheme = result;
		}, () => {
			log("Theme > ❗❗❗ Unable to cache theme!");
		});
	}
	

	
}

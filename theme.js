/*
	Module for roles / role info
		- Set role name & aliases
		- Get role info
		- Create / Manage SCs
		- Distribute roles
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
*/
module.exports = function() {
	/* Variables */
	this.loadedModuleTheme = true;
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
	
	
	/* Help for this module */
	this.helpTheme = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "theme [set|remove|list|select] - Manages themes\n";
			break;
			case "theme":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "theme [set|remove|list|select]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle renaming roles for themes. " + stats.prefix + "help theme <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- themes\n```";
					break;
					case "set":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "theme set <Theme Id> <Original Word> <Themed Word>\n```";
						help += "```\nFunctionality\n\nReplaces all mentions of a word <Original Word> with <Theme Word> if theme <Theme Id> is selected.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "theme set customTheme citizen notCitizen\n< ✅ Replaced 'citizen' with 'notCitizen' in 'customTheme'!\n```";
					break;
					case "remove":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "theme remove <Theme Id> <Original Word>\n```";
						help += "```\nFunctionality\n\nRemoves a themed word.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "theme remove customTheme citizen\n< ✅ Removed 'citizen' from 'customTheme'!\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles list <Theme Id>\n```";
						help += "```\nFunctionality\n\nLists all replaced words for a specific theme, or if no <Theme Id> is set, lists all theme.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "theme list\n\n< ✅ Current Themes: 'customTheme', 'default'!\n```";
					break;
					case "select":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles select <Theme Id>\n```";
						help += "```\nFunctionality\n\nSets the current theme to <Theme Id>, if set to an invalid theme or 'default', default words are used.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "theme select customTheme\n< ✅ Selected 'customTheme' theme!\n```";
					break;
				}
			break;
		}
		return help;
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
					channel.send("✅ Theme: `" + args[1] + "`" + result.map(el => "\n" + el.original + " => " + el.new).join(""));
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
	
	this.cacheTheme = function() {
		sql("SELECT original,new FROM theme WHERE theme = " + connection.escape(stats.theme) + " ORDER BY theme ASC", result => {
				cachedTheme = result;
		}, () => {
			log("Theme > ❗❗❗ Unable to cache theme!");
		});
	}
	

	
}

/*
	Module for themes
*/
module.exports = function() {
    
	/* Variables */
	this.cachedTheme = [];
	
	/**
    Command: $theme
    Command to manage themes
    **/
	this.cmdTheme = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Role Subcommand
			case "query": cmdThemeQuery(message.channel, args); break;
			case "list": cmdThemeList(message.channel, args); break;
			case "select": cmdThemeSelect(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	/**
    Command: $theme list
    Lists all themes/themed words 
    */
	this.cmdThemeList = async function(channel, args) {
		if(!args[1]) {
			// Get all roles
			let result = await sqlProm("SELECT theme FROM theme ORDER BY theme ASC");
            channel.send("✅ Current Themes: `default`" + removeDuplicates(result.map(el => el.theme)).map(el => ", `" + el + "`").join(""));
		} else {
			let result = await sqlProm("SELECT original,new FROM theme WHERE theme = " + connection.escape(args[1]) + " ORDER BY theme ASC");
            if(result.length <= 0) {
                // No roles exist
                channel.send("⛔ Database error. Could not find any entries for theme `" + args[1] + "`!");
                return;
            }
            // At least one role exists
            result = result.map(el => "\n" + el.original + " => " + el.new);
            //console.log(result);
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
		}
	}
	
	
	/**
    Command: $theme query
    Queries a theme from a theme pack csv
    **/
	this.cmdThemeQuery = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
        let url = `${themePackBase}${args[1]}.csv`;
        let urlExists = await checkUrlExists(url);
        if(urlExists) {
            const body = await fetchBody(url);
           let themeLUT = [];
            if(body) {
                body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => themeLUT.push([el[0] ?? "-", (el[1] ?? "").trim()]) );
                body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => themeLUT.push([(el[0] ?? "-").toLowerCase(), ((el[1] ?? "").trim()).toLowerCase()]) );
            }
            if(themeLUT.length > 0) {
                let promises = [];
                channel.send("✅ Storing theme. `" + (themeLUT.length/2) + "` values found.");
               for (let i = 0; i < themeLUT.length; i++) {
                    let prom = sqlProm("INSERT INTO theme (theme, original, new) VALUES (" + connection.escape(args[1]) + "," + connection.escape(themeLUT[i][0]) + "," + connection.escape(themeLUT[i][1]) + ")");
                    promises.push(prom);
                }
                await Promise.all(promises);
                channel.send("✅ Theme stored.");
            } else {
                channel.send("⛔ Syntax error. Could not find theme contents!"); 
            }
        } else {
			channel.send("⛔ Syntax error. Could not find theme csv!"); 
        }
	}

	/**
    Command: $theme select
    Select Theme
    **/
	this.cmdThemeSelect = function(channel, args) {
		cmdOptionsSet(channel, args[1], "29"); 
	}
	
	/**
    Apply Theme
    can apply a theme onto both strings and arrays
    **/
	this.applyTheme = function(text) {
		if(text instanceof Array) {
			return text.map(el => applyTheme(el));
		} else {
			cachedTheme.forEach(el => text = text.replace(new RegExp("(?<!\\<\\?|[a-zA-Z])" + el.original + "(?!\\:\\>|[a-rt-zA-Z])", 'g'), el.new));
			return text;
		}
	}
	
    /**
    Caches the theme
    **/
	this.cacheTheme = function() {
		sql("SELECT original,new FROM theme WHERE theme = " + connection.escape(stats.theme) + " ORDER BY theme ASC", result => {
				cachedTheme = result;
		}, () => {
			log("Theme > ❗❗❗ Unable to cache theme!");
		});
	}
	

	
}

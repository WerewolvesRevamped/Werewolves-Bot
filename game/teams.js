/**
    Roles Module - Teams
    Handles functionality related to teams
**/
module.exports = function() {
    
	/**
    Command: $teams
    Handle teams command
    **/
	this.cmdTeams = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Groups Subcommand
			case "query": cmdTeamsQuery(message.channel); break;
			case "parse": cmdTeamsParse(message.channel); break;
            case "get": cmdTeamsGet(message.channel, args); break
			case "list": cmdTeamsList(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $teams get
    Gets a specific team.
    **/
    this.cmdTeamsGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyTeam(args[1])) {
			channel.send("⛔ Command error. Invalid team `" + args[1] + "`!"); 
			return; 
		}
        // Get all groups values
        sql("SELECT * FROM teams WHERE name = " + connection.escape(args[1]), async result => {
            result = result[0];
            // get the basic embed
             var embed = await getBasicEmbed(channel.guild);
             // set embed title
            embed.author = { name: result.display_name };
            
            // get lut icon if applicable
            let lutval = applyLUT(result.name);
            if(!lutval) lutval = applyLUT(result.display_name);
            if(lutval) { // set icon and name
                //console.log(`${iconRepoBaseUrl}${lutval}`);
                embed.thumbnail = { "url": `${iconRepoBaseUrl}${lutval}.png` };
                embed.author.icon_url = `${iconRepoBaseUrl}${lutval}.png`;
            } 
            
            // Add a field for every role value
            for(attr in result) {
                embed.fields.push({ "name": toTitleCase(attr), "value": (result[attr]+"").substr(0, 1000) + ((result[attr]+"").length > 1000 ? " **...**" : "") });
            }
            
            // Send the embed
            channel.send({ embeds: [ embed ] }); 
        });
    }
    
    /**
    Command: $teams list
    Lists all teams
    **/
	/* Lists all team names */
	this.cmdTeamsList = function(channel) {
		// Get all teams
		sql("SELECT * FROM teams ORDER BY ai_id ASC", result => {
			if(result.length > 0) {
				// At least one team exists
				channel.send("✳️ Sending a list of currently existing teams:");
				// Send message
				chunkArray(result.map(team => {
                    let emoji = getLUTEmoji(team.name, team.display_name);
                    return `**${emoji} ${toTitleCase(team.display_name)}** (${team.win_condition})`;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No teams exist
				channel.send("⛔ Database error. Could not find any teams!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for team list!");
		});
	}

    
     /** Verify Team
    Verifies if a team exists
    **/
    this.verifyTeam = function(input) {
        if(cachedTeams.length == 0) return true; // if cache is currently not loaded just allow it
		let inputTeam = input.replace(/[^a-z ]/g,"").trim(); // parse team name
		let loc = cachedTeams.find(el => el === inputTeam); // check if team is in cache
		return loc ? true : false;
	}
    
     /** Verify Team Name
    Verifies if a team name exists
    **/
    this.verifyTeamName = function(input) {
        if(cachedTeamNames.length == 0) return true; // if cache is currently not loaded just allow it
		let inputTeam = input.toLowerCase().replace(/[^a-z ]/g,"").trim(); // parse team name
		let loc = cachedTeamNames.find(el => el === inputTeam); // check if team is in cache
		return loc ? true : false;
	}
    
    /**
    Parse team name
    Returns a team name in db format
    **/
    this.parseTeam = function(name) {
        return name.toLowerCase().replace(/[^a-z ]/g,"").trim();
    }
    
    /** PUBLIC
    Get team members
    **/
    this.teamGetMembers = function(teamName) {
        return sqlPromEsc("SELECT id FROM players WHERE alignment=", teamName)
    }
    
    
}
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
        return sqlPromEsc("SELECT id FROM players WHERE type='player' AND alive=1 AND alignment=", teamName)
    }
    
    this.teamGetMembersAll = function(teamName) {
        return sqlPromEsc("SELECT id FROM players WHERE type='player' AND alignment=", teamName)
    }
    
    /** PUBLIC
    team update handler
    **/
    this.updateActiveTeams = async function() {
        // new teams
        let toBeActivated = await sqlProm("SELECT name,display_name FROM teams WHERE name IN (SELECT DISTINCT alignment FROM players WHERE alive=1 AND type='player') AND active=0");
        
        for(let i = 0; i < toBeActivated.length; i++) {
            await sqlPromEsc("UPDATE teams SET active=1 WHERE name=", toBeActivated[i].name);
            abilityLog(`❇️ **Team Created:** Team ${toBeActivated[i].display_name} was created.`);
        }
        
        // teams that have lost
        let toBeDeactivated = await sqlProm("SELECT name,display_name FROM teams WHERE name NOT IN (SELECT DISTINCT alignment FROM players WHERE alive=1 AND type='player') AND active=1");
        
        for(let i = 0; i < toBeDeactivated.length; i++) {
            await sqlPromEsc("UPDATE teams SET active=0 WHERE name=", toBeDeactivated[i].name);
            abilityLog(`❇️ **Team Loss:** Team ${toBeDeactivated[i].display_name} has lost.`);
        }
        
        // check win conditions of all remaining teams
        let activeTeams = await sqlProm("SELECT name,display_name,win_condition FROM teams WHERE active=1");
        
        let gameEnds = false;
        for(let i = 0; i < activeTeams.length; i++) {
            // evaluate which players may be alive
            let winCond = activeTeams[i].win_condition.split(",");
            let allowedPlayers = [];
            for(let j = 0; j < winCond.length; j++) {
                let selPlayers = await parsePlayerSelector(winCond[j], `team:${activeTeams[i].name}`);
                allowedPlayers.push(...selPlayers);
            }
            //console.log(activeTeams[i].name, allowedPlayers);
            // check if all players are included
            let all = await getAllLivingIDs();
            let teamHasWon = all.every(el => allowedPlayers.includes(el));
            // if so a team has won
            if(teamHasWon) {
                gameEnds = true;
                abilityLog(`❇️ **Team Victory:** Team ${activeTeams[i].display_name} has won.`);
                await bufferStorytime(`Team ${activeTeams[i].display_name} has won!`);
                // set all team members as winners
                await sqlPromEsc("UPDATE players SET final_result=1 WHERE alignment=", activeTeams[i].name);
            }
        }
        
        if(gameEnds || activeTeams.length === 0) {
            // final trigger
            await triggerHandler("On End"); 
            // end game
            await gameEnd();
            await bufferStorytime(`**The game has ended!**`);
            // storytime
            await postStorytimeImmediate();
            // get winners & losers
            let allLosers = await sqlProm("SELECT * FROM players WHERE final_result=0 AND type='player'");
            let allWinners = await sqlProm("SELECT * FROM players WHERE final_result=1 AND type='player'");
            let allLosersText = chunkArray(allLosers.map(el => `${el.emoji} - <@${el.id}> (${el.role != el.orig_role ? toTitleCase(el.orig_role) + ' -> ' : ""}${toTitleCase(el.role)})`), 10).map(el => el.join("\n"));
            let allWinnersText = chunkArray(allWinners.map(el => `${el.emoji} - <@${el.id}> (${el.role != el.orig_role ? toTitleCase(el.orig_role) + ' -> ' : ""}${toTitleCase(el.role)})`), 10).map(el => el.join("\n"));
            for(let i = 0; i < allWinnersText.length; i++) {
                let indexText = allWinnersText.length > 1 ? (i + 1) + '/' + allWinnersText.length : "";
                await locationSend("storytime", `${allWinnersText[i]}`, EMBED_GREEN, null, `Final Results - Winners ${indexText}`);
            }
            for(let i = 0; i < allLosersText.length; i++) {
                let indexText = allLosersText.length > 1 ? (i + 1) + '/' + allLosersText.length : "";
                await locationSend("storytime", `${allLosersText[i]}`, EMBED_RED, null, `Final Results - Losers ${indexText}`);
            }
        }
    }
    
    /** PUBLIC
    reset teams
    **/
    this.resetTeams = async function() {
        await sqlProm("UPDATE teams SET active=0");
    }
    
    
}
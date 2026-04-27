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
    
    this.cmdExport = async function(message, args) {
        let gameId = args[0]
        let phaseCount = args[1]

        if (phaseCount !== undefined) {
            try {
                phaseCount = Number(phaseCount)
            } catch {
                message.channel.channel.send("‼️ Illegal argument, phase must be a number");
                return
            }
        }

        let output = await ratingDataExport(gameId, phaseCount);
        let uploaded = await uploadGameExport(output)
        if (uploaded) {
            message.channel.send(`✅ Uploaded pending game to ${config.rating.site}/admin/rating/pending/${output.id}`);
        } else {
            message.channel.send("‼️ Failed to upload game export to ratings site");
        }
    }
    
    this.ratingDataExport = async function(id,phases) {
        let eventData = await sqlProm("SELECT * FROM events");
        
        // empty game
        let gameData = { id: "", players: [], teamResults: {}, gameStart: "", hosts: [], phases: 0 };
        
        // set game name
        gameData.id = id ?? stats.game;
        
        // get hosts
        let hosts = [];
        mainGuild.roles.cache.get(stats.host).members.forEach(el => hosts.push(el.id));
        gameData.hosts = hosts;
        
        // get start date
        let startDate = eventData.filter(el => el.type === "game_start")[0].data1;
        var date = new Date(+ startDate);
        gameData.gameStart = (date.getYear() + 1900) + "-" + ((date.getMonth() + 1) + "").padStart(2, "0") + "-" + (date.getDate() + "").padStart(2, "0");
        
        // get final phase
        let finalPhase = phases ?? getPhaseAsNumber();
        gameData.phases = finalPhase;
        
        // get game outcome
        let gameOutcome = eventData.filter(el => el.type === "game_outcome")[0].data1;
        
        // get winning team
        let winners = eventData.filter(el => el.type === "victory").map(el => el.data1);
        
        // get all teams
        let teams = eventData.filter(el => el.type === "team").map(el => el.data1);
        // team results
        for(let i = 0; i < teams.length; i++) {
            gameData.teamResults[teams[i]] = winners.includes(teams[i]) ? "WIN" : "LOSS"; 
        }
        
        // get all players
        let allPlayers = await sqlProm("SELECT * FROM players");
        for(let i = 0; i < allPlayers.length; i++) {
            if(!["player","substituted"].includes(allPlayers[i].type)) continue;
            let playerData = { id: "", username: "", displayName: "", roles: [], messages: 0, publicIA: false, inactive: false };
            
            // set id
            playerData.id = allPlayers[i].id;
            
            // get username and displayname
            let member = mainGuild.members.cache.get(allPlayers[i].id);
            let username = member.user.username;
            let displayName = member.user.displayName;
            playerData.username = username;
            playerData.displayName = displayName;
            
            // find corresponding role and alignment events
            let playerEvents = eventData.filter(el => el.id === allPlayers[i].id);
            let roleCounter = 0;
            for(let j = 0; j < playerEvents.length; j++) {
                switch(playerEvents[j].type) {
                    case "role":
                        let roleData = { role: "", daysDead: 0, result: "", team: "", count: 0, modifiers: [], extraRoles: [] };
                        
                        // count
                        roleData.count = roleCounter;
                        roleCounter++;
                        
                        // role
                        roleData.role = playerEvents[j].data1;
                        roleData.team = playerEvents[j].data2;
                        
                        // get preliminary result
                        if(gameOutcome === "end") roleData.result = "CANCELLED"
                        else if(winners.includes(playerEvents[j].data2)) roleData.result = "WIN";
                        else roleData.result = "LOSS";
                        
                        // set previous days dead
                        if(playerEvents[j].phase != -1) {
                            playerData.roles.at(-1).daysDead = Math.ceil((finalPhase - playerEvents[j].phase) / 2);
                        }
                        
                        // add to player data
                        playerData.roles.push(roleData);
                    break;
                    case "alignment":
                        playerData.roles.at(-1).team = playerEvents[j].data1;
                    break;
                }
            }
            
            // set final role result
            if(allPlayers[i].final_result == 1) {
                if(gameOutcome === "tie") playerData.roles.at(-1).result = "TIE";
                else playerData.roles.at(-1).result = "WIN";
            } else {
                if(gameOutcome === "end") playerData.roles.at(-1).result = "CANCELLED";
                else playerData.roles.at(-1).result = "LOSS";
            }
            
            // set final days dead
            if(allPlayers[i].death_phase != -1) {
                playerData.roles.at(-1).daysDead = Math.ceil((finalPhase - allPlayers[i].death_phase) / 2);
            }
            
            // determine inactivity
            let messages = allPlayers[i].public_msgs + allPlayers[i].private_msgs;
            playerData.messages = messages;
            
            if(allPlayers[i].death_phase > 1) {
                if(messages < (finalPhase * stats.total_req)) playerData.inactive = true;
                if(allPlayers[i].public_msgs < (Math.floor(finalPhase/2) * stats.public_req)) playerData.publicIA = true;
            }
            
            // select modifiers for this player
            let playerModifiers = await sqlPromEsc("SELECT * FROM modifiers WHERE id=", allPlayers[i].id);
            let playerModifiersStrings = playerModifiers.map(el => el.name);
            
            // add modifiers to all roles
            playerData.roles.forEach(el => el.modifiers = playerModifiersStrings);
            
            // add to game data
            gameData.players.push(playerData);
        }
        
        return gameData;
    }
    
}

/**
 * Uploads a game export to the WWR Ratings API
 * @param {*} gameData 
 * @returns {boolean} if it was scuessefull
 */
async function uploadGameExport(gameData) {
    const token = config.rating.token
    const endPoint = config.rating.api
    const path = `${endPoint}/api/games/pending`
    const content = JSON.stringify(gameData)

    try {
        const response = await fetch(path, {
            method: "POST",
            body: content,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })

        //check it was a success
        if (!response.ok) {
            const error = await response.json()
            console.log(`Failed to upload game export: ${response.status}`)
            console.log(error)
            return false
        } else {
            return true
        }
    } catch (e) {
        console.log("An exception occurred during game upload: {}", e)
    }
    return false
}
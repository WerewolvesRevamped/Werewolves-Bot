/**
    Functions for various player lists
**/

module.exports = function() {
    
    /**
    Generate Player List
    generates a player list with a specified query, format and name
    **/
    this.generatePlayerList = async function(channel, name, conditions, format, sortFunction = null) {
        // send loading message
        let msgProm = channel.send(`✳️ Listing ${name.toLowerCase()}`);
        
        // prepare conditions
        let conditionsFormatted = [];
        conditions.forEach(el => {
            if(["alive","type","mentor"].includes(el[0]) && ["=","<>"].includes(el[1])) {
                conditionsFormatted.push(`${el[0]}${el[1]}${connection.escape(el[2])}`);
            }
        });
        
        // retrieve players
        let matchingPlayers = await sqlProm("SELECT * FROM players WHERE " + conditionsFormatted.join(" AND "));
        
        if(sortFunction) {
            matchingPlayers = matchingPlayers.sort(sortFunction);
        }
        
        // format players
        let formattedPlayers = matchingPlayers.map(el => {
            let f = format;
            let member = mainGuild.members.cache.get(el.id);
            let mentor = el.mentor ? mainGuild.members.cache.get(el.mentor) : null;
            f = f.replace(/\$emoji/g, el.emoji);
            f = f.replace(/\$id/g, el.id);
            f = f.replace(/\$name/g, member ? member.user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*");
            f = f.replace(/\$tag/g, `<@${el.id}>`);
            f = f.replace(/\$mentor_tag/g, `<@${el.mentor}>`);
            f = f.replace(/\$mentor/g, mentor ? mentor.user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*");
            return f;
        });
        
        let messages = [];
        messages.push(`**${name}** | Total: ${formattedPlayers.length}\n`);
        
        // split into several messages if necessary
        formattedPlayers.forEach(el => {
            if(messages.at(-1).length + el.length < 1900) {
                messages[messages.length - 1] += el + "\n";
            } else {
                messages.push(el + "\n");
            }
        });
        
        // wait for promise
        let msg = await msgProm;
        
        // update message
        msg.edit(messages[0]);
        
        // send additional messages if applicable
        for(let i = 1; i < messages.length; i++) {
            await channel.send(messages[1]);
        }  
    }
    
	/**
    Signedup Alphabetical List
    **/
    this.cmdListSignedupAlphabetical = function(channel) {
        generatePlayerList(channel, "Signed Up Players (Alphabetical)", [["type", "=", "player"]], "$emoji - $name", (a, b) => {
                let pa = mainGuild.members.cache.get(a.id);
                let pb = mainGuild.members.cache.get(b.id);
               return (pa ? pa.user.username.toLowerCase() : "-") > (pb ? pb.user.username.toLowerCase() : "-") ? 1 : -1;
        });
	}
    
	/**
    Signedup List
    */
	this.cmdListSignedup = function(channel) {
        generatePlayerList(channel, "Signed Up Players", [["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
	/**
    Substitute List 
    */
	this.cmdListSubs = function(channel) {
        generatePlayerList(channel, "Substitute Players", [["type", "=", "substitute"]], "$emoji - $name ($tag)");
	}
    
	/**
    Mentor List
    **/
	this.cmdListMentors = function(channel) {
        generatePlayerList(channel, "Mentors", [["mentor", "<>", ""]], "$emoji - $mentor ($mentor_tag) for $name ($tag)");
	}
	
	/**
    Alive Player List
    **/
	this.cmdListAlive = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list alive players in ingame phase."); 
			return; 
		}
        // generate list
        generatePlayerList(channel, "Alive Players", [["alive", "=", 1], ["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
	/**
    Dead Player List
    **/
	this.cmdListDead = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list dead players in ingame phase."); 
			return; 
		}
        // generate list
        generatePlayerList(channel, "Dead Players", [["alive", "=", 0], ["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
	/**
    Ghostly Player List
    **/
	this.cmdListGhost = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list ghostly players in ingame phase."); 
			return; 
		}
        if(!stats.haunting) { 
			channel.send("⛔ Command error. Can only list ghostly players in haunting mode."); 
			return; 
        }
        // generate list
        generatePlayerList(channel, "Ghostly Players", [["alive", "=", 2], ["type", "=", "player"]], "$emoji - $name ($tag)");
	}
    
}
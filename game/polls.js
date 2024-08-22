/**
    Roles Module - Polls
    Handles functionality related to polls
**/
module.exports = function() {
    
	/**
    Command: $polls
    Handle polls command
    **/
	this.cmdPolls = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Groups Subcommand
			case "query": cmdPollsQuery(message.channel); break;
			case "parse": cmdPollsParse(message.channel); break;
            case "get": cmdPollsGet(message.channel, args); break
			case "list": cmdPollsList(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $polls get
    Gets a specific poll.
    **/
    this.cmdPollsGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyPoll(args[1])) {
			channel.send("⛔ Command error. Invalid poll `" + args[1] + "`!"); 
			return; 
		}
        // Get all groups values
        sql("SELECT * FROM polls WHERE name = " + connection.escape(args[1]), async result => {
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
    Command: $polls list
    Lists all polls
    **/
	/* Lists all poll names */
	this.cmdPollsList = function(channel) {
		// Get all polls
		sql("SELECT * FROM polls ORDER BY ai_id ASC", result => {
			if(result.length > 0) {
				// At least one poll exists
				channel.send("✳️ Sending a list of currently existing polls:");
				// Send message
				chunkArray(result.map(loc => {
                    let emoji = getLUTEmoji(loc.name, loc.display_name);
                    return `**${emoji} ${toTitleCase(loc.display_name)}** (${loc.options} / ${loc.voters}) [${loc.show_voters}]`;
                }), 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No polls exist
				channel.send("⛔ Database error. Could not find any polls!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for poll list!");
		});
	}
    
     /** Verify Poll
    Verifies if a poll exists
    **/
    this.verifyPoll = function(input) {
        if(cachedPolls.length == 0) return true; // if cache is currently not loaded just allow it
		let inputPoll = input.replace(/[^a-z\$ ]/g,"").trim(); // parse poll name
		let loc = cachedPolls.find(el => el === inputPoll); // check if poll is in cache
		return loc ? true : false;
	}
    
    /**
    Parse poll name
    Returns a poll name in db format
    **/
    function parsePoll(name) {
        return name.toLowerCase().replace(/[^a-z\$ ]/g,"").trim();
    }
    
}
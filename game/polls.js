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
			case "active": cmdPollsActive(message.channel); break;
			case "delete": cmdPollsDelete(message.channel, args); break;
			case "close": closePolls(); break;
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
    
    /**
    Command: $polls active
    Lists active poll instances
    **/
	/* Lists all polls names */
	this.cmdPollsActive = function(channel) {
		// Get all polls
		sql("SELECT * FROM active_polls ORDER BY ai_id ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳️ Sending a list of currently existing active poll instances:");
				// Send message
				chunkArray(result.map(poll => {
                    return `\`${poll.ai_id}\`: **${toTitleCase(poll.name)}** [${toTitleCase(poll.type)}] ( https://discord.com/channels/${mainGuild.id}/${poll.channel}/${poll.initial_message} )`;
                }), 10).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No polls exist
				channel.send("⛔ Database error. Could not find any active poll instances!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for active poll instance list!");
		});
	}
    
    /**
    Command: $polls delete
    Deletes an active poll instances
    **/
	/* Lists all polls names */
	this.cmdGroupsDelete = function(channel, args) {
		if(!args[1]) {  
			channel.send("⛔ Syntax error. Incorrect amount of parameters!"); 
			return; 
		} else if(isNaN(args[1])) {
			channel.send("⛔ Command error. Invalid poll instance id `" + args[1] + "`!"); 
			return; 
		}
        
		// Get all polls
		sql("DELETE FROM active_polls WHERE ai_id=" + connection.escape(args[1]), result => {
            channel.send("✅ Deleted active poll instance.");
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't delete active poll instance!");
		});
	}
    
    /**
    Polls: Reset
    resets all active polls
    **/
    this.pollsReset = function() {
        return sqlProm("DELETE FROM active_polls");
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
    
    
    /** PUBLIC
    Get poll data
    **/
    this.pollGetData = function(pollName) {
        return new Promise(res => {
            sql("SELECT * FROM polls WHERE name=" + connection.escape(pollName), result => {
                res(result[0]);
            });
        });
    }
    
    /** PUBLIC
    Create Poll
    pollName: Name of the poll
    pollLocation: Output of parseLocation
    options: an array of objects of form { id: <id>, emoji: <emoji>, type: "player" } or { name: <name>, emoji: <emoji>, type: "emoji" }
    **/
    this.createPoll = async function(pollType, pollName, pollLocation, options, src_ref) {
        // get lut emoji if applicable
        let emoji = getLUTEmoji(pollType, pollName);
        
        // initial message
        let initialMsg = await abilitySendProm(`${pollLocation.type}:${pollLocation.value}`, `Poll: **${toTitleCase(pollName)}** ${emoji} `);
        
        // pin poll initial message (if SC poll)
        if(isSC(initialMsg.channel)) {
            pinMessage(initialMsg);
        }
        
        // split list
        let optionLists = [];
        let pollMsgs = [];
        while(options.length > 0) optionLists.push(options.splice(0, 20));
        
        // go through each list of options
        for(let i = 0; i < optionLists.length; i++) {
            // convert list to poll text
            let pollMsg = optionLists[i].map(el => {
                switch(el.type) {
                    case "player": return `${el.emoji} - <@${el.id}>`;
                    case "emoji": return `${el.emoji} - ${el.name}`;
                    default: return "UNKNOWN";
                }
            }).join("\n");
            // send poll message
            let pollDisMsg = await abilitySendProm(`${pollLocation.type}:${pollLocation.value}`, pollMsg);
            pollMsgs.push(pollDisMsg.id);
            // do the reactions
            let emojis = optionLists[i].map(el => el.emoji);
            pollReact(pollDisMsg, emojis);
        }
        // create in DB
        await createPollInDB(pollType, pollName, initialMsg.channel.id, initialMsg.id, pollMsgs, src_ref);
    }
    
	/** PRIVATE
    Creates an active poll entry in DB
    **/
    function createPollInDB(type, name, channel, initial_message, messages, src_ref) {
        return sqlProm("INSERT INTO active_polls (type, name, channel, initial_message, messages, src_ref) VALUES (" + connection.escape(type) + "," + connection.escape(name) + "," + connection.escape(channel) + "," + connection.escape(initial_message) + "," + connection.escape(messages)+ "," + connection.escape(src_ref) + ")");
    }
    
    
	/** PRIVATE
    Reacts to a poll message
    **/
	async function pollReact(message, list) {
        // Iterate through emojis
        for(let i = 0; i < list.length; i++) {
            await message.react(list[i]);
        }
	}
    
    /** PUBLIC
    Closes a poll
    **/
    this.closePolls = function() {
        return new Promise(res => {
            // get all polls
            sql("SELECT * FROM active_polls", async result => {
                // iterate through polls
                for(let i = 0; i < result.length; i++) {
                    await closePoll(result[i]);
                }
                // delete all polls
                await pollsReset();
                res();
            });
        });
    }
    
    /** PRIVATE
    Closes a single poll
    **/
    async function closePoll(pollData) {
        // get messages
        const messages = pollData.messages.split(",");
        const channelId = pollData.channel;
        const channel = mainGuild.channels.cache.get(channelId);
        const pollType = pollData.type;
        const pollName = pollData.name;
        
        // go through reactions
        let allReactions = [];
        for(let i = 0; i < messages.length; i++) {
            // fetch message
            let msg = await channel.messages.fetch(messages[i]);
            // get reaction
            let reactions = msg.reactions.cache;
            reactions = reactions.map((data,emoji) => [data,emoji]);
            for(let j = 0; j < reactions.length; j++) {
                const data = reactions[j][0];
                const emoji = reactions[j][1];
                // get emoji
                let em = client.emojis.cache.get(emoji);
                let emojiText = (emoji.match(/\d+/) && em)  ? `<:${em.name.toLowerCase()}:${em.id}>` : emoji;
                // get users
                await data.users.fetch();
                let users = data.users.cache.toJSON();
                // return data
                reactions[j] = { emoji_id: emoji, emoji: emojiText, users: users, count: data.count, messageID: data.messageID };
            }
            // add to all reactions
            allReactions.push(...reactions);
        }
        
        // Find duplicate votes
		let duplicateVoters = [];
        // find all user ids for all reactions
        allReactions.forEach(reac => reac.users.forEach(usr => duplicateVoters.push(usr.id)));
        // find duplicates
        duplicateVoters = duplicateVoters.filter((el, ind, arr) => arr.indexOf(el) !== ind);
        
        // get poll data
        const pollTypeData = await pollGetData(pollType);
        
        // allowed voters
        const allowedVoters = await parsePlayerSelector(pollTypeData.voters);
        const showVoters = pollTypeData.show_voters;
        
        // generate output
        let outputLines = [];
        let maxVotes = -1, maxVotesData = [];
        for(let j = 0; j < allReactions.length; j++) {
            const reac = allReactions[j];
            const voters = reac.users.filter(el => allowedVoters.indexOf(el.id) > -1);
            
            // remove invalid votes through duplication
            const validVoters = voters.filter(el => duplicateVoters.indexOf(el.id) === -1);
            const invalidVoters = voters.filter(el => duplicateVoters.indexOf(el.id) != -1 && el != client.user.id);
            
            // evaluate vote count
            let votes = 0;
            for(let i = 0; i < validVoters.length; i++) {
                votes += await pollValue(validVoters[i]);
            }
            
            // if no votes, continue
            if(votes <= 0) continue;
            
            // get candidate from emoji
            let candidate = emojiToID(reac.emoji);
            if(!candidate) candidate = pollEmojiToName(reac.emoji);
            
            // if no valid voters, but votes
            if(validVoters.length === 0) validVoters = "*Unknown*";
            
            // candidate name
            let candidateName = candidate.match(/^\d+$/) ? `<@${candidate}>` : candidate;
            
            // create message
            let msg =  `(${votes}) ${reac.emoji} ${candidateName} **-** ${validVoters}` + (invalidVoters.length>0 ? ` (Invalid Votes: ${invalidVoters})` : "");
            outputLines.push(msg);
            
            // check if winner
            if(votes == maxVotes && candidate != "Abstain") {
                maxVotesData.push(candidate);
            } else if(votes > maxVotes && candidate != "Abstain") {
                maxVotesData = [ candidate ];
                maxVotes = votes;
            }
        }
        
        // send poll results
        doTrigger = false;
        if(outputLines.length > 0) {
            let msgFull = outputLines.join("\n");
            let embed;
            if(maxVotesData.length === 1) {
                if(maxVotesData[0].match(/^\d+$/)) { // PLAYER WINNER
                    msgFull += `\n\n**Winner:** <@${maxVotesData[0]}> with **${maxVotes}** votes!`;
                    embed = basicEmbed(msgFull, EMBED_GREEN);
                    doTrigger = true;
                } else { // NON PLAYER WINNER
                    msgFull += `\n\n**Result:** **${maxVotesData[0]}** with **${maxVotes}** votes!`;
                    embed = basicEmbed(msgFull, EMBED_GREEN);
                }
            } else if(maxVotesData.length === 0) { // NO WINNER
                msgFull += `\n\n**No Winner**`;
                embed = basicEmbed(msgFull, EMBED_RED);
            } else { // TIE
                let winners = maxVotesData.map(el => {
                    if(el.match(/^\d+$/)) {
                        return `<@${maxVotesData[0]}>`;
                    } else {
                        return el;
                    }
                }).join(', ');
                msgFull += `\n\n**Tie:** ${winners} with **${maxVotes}** votes!`;
                embed = basicEmbed(msgFull, EMBED_YELLOW);
            }
            // send embed
            embed.embeds[0].title = toTitleCase(pollName); // title
            await channel.send(embed);
        } else { // NO VOTES
            let embed = basicEmbed("*No Votes*", EMBED_RED);
            embed.embeds[0].title = toTitleCase(pollName); // title
            await channel.send(embed);
        }
        
        if(doTrigger) {
            // on poll closed trigger
            await trigger(pollData.src_ref, "On Poll Closed", { winner: `${maxVotesData[0]}` }); 
        }
        
        // remove all reactions
        for(let i = 0; i < messages.length; i++) {
            let msg = await channel.messages.fetch(messages[i]);
            await msg.reactions.removeAll();
        }
    }
    
    /** PRIVATE
    Evaluate vote value
    **/
    async function pollValue(player_id) {
        return 1; // WIP
    }
    
}
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
			case "close_all": closePolls(); break;
            case "new": cmdPollsNew(message.channel, args); break;
            case "close": cmdPollsClose(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $polls new
    Creates a new poll
    **/
    this.cmdPollsNew = async function(channel, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyPoll(args[1])) {
			channel.send("⛔ Command error. Invalid poll `" + args[1] + "`!"); 
			return; 
		}
        pollCreate(`poll:${args[1]}`, `poll:${args[1]}`, args[1], args[2] ?? args[1], { value: channel.id, type: "channel", default: false });
    }
    
    /**
    Command: $polls close
    Closes a specific poll
    **/
    this.cmdPollsClose = async function(channel, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyPoll(args[1])) {
			channel.send("⛔ Command error. Invalid poll `" + args[1] + "`!"); 
			return; 
		}
        
        let polls = await sqlPromEsc("SELECT * FROM active_polls WHERE type=", args[1]);
        for(let i = 0; i < polls.length; i++) {
            await closePoll(polls[i]);
        }
        await sqlPromEsc("DELETE FROM active_polls WHERE type=", args[1]);
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
	this.cmdPollsDelete = function(channel, args) {
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
    Get Poll
    gets a poll by message id
    **/
    this.getPoll = async function(id) {
        let poll = await sqlPromOneEsc("SELECT * FROM active_polls WHERE messages LIKE ",  `%${id}%`);
        if(poll) return poll;
        else return false;
    }
    
    /**
    Cache Poll Messages
    **/
    this.cachePollMessages = async function() {
        let allMsgs = await sqlProm("SELECT * FROM active_polls");
        allMsgs.forEach(el => {
            let msgs = el.messages.split(",");
            let channel = mainGuild.channels.cache.get(el.channel);
            msgs.forEach(el2 => channel.messages.fetch(el2));
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
    Option List to Data
    **/
    this.optionListData = async function(options) {
        let allOptions = [];
        for(let i = 0; i < options.length; i++) {
            // player selector
            if(options[i][0] === "@") {
                let players = await parsePlayerSelector(options[i]);
                players = players.map(el => {
                    let id = el;
                    let emoji = idToEmoji(el);
                    return { id: id, emoji: emoji, type: "player" };
                });
                allOptions.push(...players);
            }
            // not player
            else {
                allOptions.push({ name: options[i], emoji: pollNameToEmoji(options[i]), type: "emoji" });
            }
        }
        return allOptions;
    }
    
    /** PUBLIC
    Create Poll
    pollName: Name of the poll
    pollLocation: Output of parseLocation
    options: an array of objects of form { id: <id>, emoji: <emoji>, type: "player" } or { name: <name>, emoji: <emoji>, type: "emoji" }
    **/
    this.createPoll = async function(pollType, pollName, pollLocation, options, src_ref, src_name) {
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
            let channel_id = await getSrcRefChannel(`${pollLocation.type}:${pollLocation.value}`);
            let channel = mainGuild.channels.cache.get(channel_id);
            let pollDisMsg = await channel.send(pollMsg);
            pollMsgs.push(pollDisMsg.id);
            // do the reactions
            let emojis = optionLists[i].map(el => el.emoji);
            await pollReact(pollDisMsg, emojis);
        }
        // create in DB
        await createPollInDB(pollType, pollName, initialMsg.channel.id, initialMsg.id, pollMsgs.join(","), src_ref, src_name);
    }
    
	/** PRIVATE
    Creates an active poll entry in DB
    **/
    function createPollInDB(type, name, channel, initial_message, messages, src_ref, src_name) {
        return sqlProm("INSERT INTO active_polls (type, name, channel, initial_message, messages, src_ref, src_name) VALUES (" + connection.escape(type) + "," + connection.escape(name) + "," + connection.escape(channel) + "," + connection.escape(initial_message) + "," + connection.escape(messages)+ "," + connection.escape(src_ref)+ "," + connection.escape(src_name) + ")");
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
        const pollIsPublic = isPublic(channel);
        const pollPublicType = pollIsPublic ? "public" : "private";
        console.log("CLOSE POLL", pollType, pollName, pollIsPublic, pollPublicType);
        
        // go through reactions
        let allReactions = [];
        let msgsProms = messages.map(async m => {
            // fetch message
            let msg = await channel.messages.fetch(m);
            // get reaction
            let reactions = msg.reactions.cache;
            reactions = reactions.map((data,emoji) => [data,emoji]);
            
            // map to another data format
            let reformattedReactions = [];
            let reactionsProms = reactions.map(async rea => {
                const data = rea[0];
                const emoji = rea[1];
                // get emoji
                let em = client.emojis.cache.get(emoji);
                let emojiText = (emoji.match(/\d+/) && em)  ? `<:${em.name.toLowerCase()}:${em.id}>` : emoji;
                // get users
                if(data.count > 1) {
                    await data.users.fetch();
                    let users = data.users.cache.toJSON();
                    // return data
                    reformattedReactions.push({ emoji_id: emoji, emoji: emojiText, users: users, count: data.count, messageID: data.messageID });
                } else {
                    console.log(`Discarding ${emojiText}`);
                }
            });
            
            // await all promises
            await Promise.all(reactionsProms);
            
            // add to all reactions
            allReactions.push(...reformattedReactions);
        });
        
        // await all promises
        await Promise.all(msgsProms);
        
        // all reactions
        console.log("ALL REACTIONS", allReactions.map(el => `${el.emoji} ${el.count}`));
        
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
        let forceResult = false;
        let votesData = [];
        let allReactionsProms = allReactions.map(async aR => {
            const reac = aR;
            const voters = reac.users.filter(el => allowedVoters.indexOf(el.id) > -1);
            
            // get candidate from emoji
            let candidate = emojiToID(reac.emoji);
            if(!candidate) candidate = pollEmojiToName(reac.emoji);
            
            // remove invalid votes through duplication
            const validVoters = voters.filter(el => duplicateVoters.indexOf(el.id) === -1);
            const invalidVoters = voters.filter(el => duplicateVoters.indexOf(el.id) != -1 && el != client.user.id);
            
            console.log("All Voters", reac.users.map(el => el.globalName ?? el.id), validVoters.map(el => el.globalName ?? el.id), invalidVoters.map(el => el.globalName ?? el.id));
            
            // evaluate vote count
            let votesArray = [];
            let validVotersProms = validVoters.map(async vv => {
                let vote = await pollValue(vv.id, pollPublicType, pollData.src_name);
                votesArray.push(vote);
            });
            
            // await all promises
            await Promise.all(validVotersProms);
            
            // calculate votes
            let votes = votesArray.reduce((a,b) => a+b, 0)
            
            // get extra votes
            let extraVisible = await queryAttribute("attr_type", "poll_votes", "val1", pollType, "val2", candidate, "val3", "visible");
            let extraHidden = await queryAttribute("attr_type", "poll_votes", "val1", pollType, "val2", candidate, "val3", "hidden");
            // use attributes
            for(let i = 0; i < extraVisible.length; i++) {
                await useAttribute(extraVisible[i].ai_id);
            }
            for(let i = 0; i < extraHidden.length; i++) {
                await useAttribute(extraHidden[i].ai_id);
            }
            // count votes
            extraVisible = extraVisible.map(el => +el.val4).reduce((a,b) => a+b, 0);
            extraHidden = extraHidden.map(el => +el.val4).reduce((a,b) => a+b, 0);
            votes += extraVisible;
            votes += extraHidden;
            
            // if no votes, continue
            if(votes < 0 || (voters.length === 0 && votes === 0)) return;
            
            // if no valid voters, but votes
            let validVotersText = validVoters.join(', ');
            if(validVoters.length === 0) validVotersText = "*Unknown*";
            
            // candidate name
            let candidateName = candidate.match(/^\d+$/) ? `<@${candidate}>` : candidate;
            
            // create message
            let msg;
            let displayVotes = votes - extraHidden;
            if(validVoters.length === 0 && invalidVoters.length === 0 && votes > 0 && displayVotes === 0) {
                // nothing - this is the case when nobody votes and an invisible vote was played which should not be displayed
                forceResult = true; // forces result in case of no votes
            } else {
                if(showVoters) msg = `(${displayVotes}) ${reac.emoji} ${candidateName} **-** ${validVotersText}` + (invalidVoters.length>0 ? ` (Invalid Votes: ${invalidVoters.join(', ')})` : "");
                else msg = `(${displayVotes}) ${reac.emoji} ${candidateName}`;
                outputLines.push(msg);
            }
            
            if(votes <= 0) return;
            
            // save votes data
            if(candidate != "Abstain") votesData.push({ votes: votes, candidate: candidate, validVoters: validVoters });
        });
        
        // await all promises
        await Promise.all(allReactionsProms);
        
        // evaluate winner
        let maxVotes = -1, maxVotesData = [], maxVotesValidVoters = [];
        for(let i = 0; i < votesData.length; i++) {
            let votes = votesData[i].votes;
            let candidate = votesData[i].candidate;
            let validVoters = votesData[i].validVoters;
            // check if winner
            if(votes == maxVotes) {
                maxVotesData.push(candidate);
                maxVotesValidVoters = [];
            } else if(votes > maxVotes) {
                maxVotesData = [ candidate ];
                maxVotesValidVoters = validVoters.map(el => el.id);
                maxVotes = votes;
            }
        }
        
        // attempt poll cancellation
        let pollCancelled = await attemptPollCancellation(pollType);
        
        // send poll results
        doTrigger = false;
        if(outputLines.length > 0 || pollCancelled || forceResult) {
            let msgFull = outputLines.join("\n");
            let embed;
            if(pollCancelled) { // CANCELLED - NO WINNER
                msgFull += `\n\n**Cancelled:** The poll was cancelled!`;
                embed = basicEmbed(msgFull, EMBED_RED);
            } else if(maxVotesData.length === 1) { // SINGLE WINNER
            
                if(maxVotesData[0].match(/^\d+$/)) { // PLAYER WINNER
                    let disqualified = await queryAttribute("attr_type", "poll_disqualification", "val1", pollType, "val2", maxVotesData[0], "val3", "disqualified");
                    if(disqualified.length === 0) { // SUCCESS
                        msgFull += `\n\n**Winner:** <@${maxVotesData[0]}> with **${maxVotes}** votes!`;
                        embed = basicEmbed(msgFull, EMBED_GREEN);
                        let pAlive = await isAlive(maxVotesData[0]);
                        doTrigger = pAlive;
                        actionLog(`🗳️ <@${maxVotesData[0]}> won ${toTitleCase(pollName)} (${pollType}).`);
                    } else { // DISQUALIFIED
                        msgFull += `\n\n**Result:** <@${maxVotesData[0]}> is disqualified with **${maxVotes}** votes!`;
                        embed = basicEmbed(msgFull, EMBED_RED);
                        await useAttribute(disqualified[0].ai_id);
                        actionLog(`🗳️ <@${maxVotesData[0]}> won ${toTitleCase(pollName)} (${pollType}) (disqualified).`);
                    }
                } else if(maxVotesData[0] === "Random") { // SPECIAL RANDOM WINNER
                    // select random player
                    const options = pollTypeData.random.split(", ");
                    let allOptions = await optionListData(options);
                    allOptions = allOptions.filter(el => el.type === "player");
                    if(allOptions.length === 0) {
                        msgFull += `\n\n**Winner:** Random, but no players available for randomization.`;
                        embed = basicEmbed(msgFull, EMBED_RED);
                        actionLog(`🗳️ Random (invalid) won ${toTitleCase(pollName)} (${pollType}).`);
                    } else {
                        allOptions = shuffleArray(allOptions);
                        maxVotesData[0] = allOptions[0].id;
                        // player win
                        let disqualified = await queryAttribute("attr_type", "poll_disqualification", "val1", pollType, "val2", maxVotesData[0], "val3", "disqualified");
                        if(disqualified.length === 0) { // SUCCESS
                            msgFull += `\n\n**Winner:** <@${maxVotesData[0]}> with **${maxVotes}** votes!`;
                            embed = basicEmbed(msgFull, EMBED_GREEN);
                            let pAlive = await isAlive(maxVotesData[0]);
                            doTrigger = pAlive;
                        actionLog(`🗳️ <@${maxVotesData[0]}> won ${toTitleCase(pollName)} (${pollType}).`);
                        } else { // DISQUALIFIED
                            msgFull += `\n\n**Result:** <@${maxVotesData[0]}> is disqualified with **${maxVotes}** votes!`;
                            embed = basicEmbed(msgFull, EMBED_RED);
                            await useAttribute(disqualified[0].ai_id);
                        actionLog(`🗳️ <@${maxVotesData[0]}> won ${toTitleCase(pollName)} (${pollType}) (disqualified).`);
                        }
                    }
                } else { // NON PLAYER WINNER
                    msgFull += `\n\n**Result:** **${maxVotesData[0]}** with **${maxVotes}** votes!`;
                    embed = basicEmbed(msgFull, EMBED_GREEN);
                    actionLog(`🗳️ **${maxVotesData[0]}** won ${toTitleCase(pollName)} (${pollType}).`);
                }
            } else if(maxVotesData.length === 0) { // NO WINNER
                msgFull += `\n\n**No Winner**`;
                embed = basicEmbed(msgFull, EMBED_RED);
                actionLog(`🗳️ *Nobody* won ${toTitleCase(pollName)} (${pollType}).`);
            } else { // TIE
                let winners = maxVotesData.map(el => {
                    if(el.match(/^\d+$/)) {
                        return `<@${el}>`;
                    } else {
                        return el;
                    }
                }).join(', ');
                msgFull += `\n\n**Tie:** ${winners} with **${maxVotes}** votes!`;
                embed = basicEmbed(msgFull, EMBED_YELLOW);
                actionLog(`🗳️ ${winners} tied ${toTitleCase(pollName)} (${pollType}).`);
            }
            // send embed
            embed.embeds[0].title = toTitleCase(pollName); // title
            await channel.send(embed);
        } else { // NO VOTES
            let embed = basicEmbed("*No Votes*", EMBED_RED);
            embed.embeds[0].title = toTitleCase(pollName); // title
            await channel.send(embed);
            actionLog(`🗳️ *Nobody* won ${toTitleCase(pollName)} (${pollType}).`);
        }
        
        // on poll closed trigger
        if(doTrigger) {
            let otherVoters = maxVotesValidVoters;
            otherVoters = otherVoters.filter(el => el != maxVotesData[0]);
            let srcType = srcToType(pollData.src_ref);
            switch(srcType) {
                // default direct trigger execution
                default:
                    await trigger(pollData.src_ref, "On Poll Closed", { winner: maxVotesData[0], voters: maxVotesValidVoters, other_voters: otherVoters }); 
                    await triggerPlayer(maxVotesData[0], "On Poll Win", { voters: maxVotesValidVoters, other_voters: otherVoters }); 
                    await triggerPlayer(maxVotesData[0], "On Poll Win Complex", { poll_name: pollName, voters: maxVotesValidVoters, other_voters: otherVoters }); 
                break;
                // for group polls a random executor is chosen
                case "group":
                    let executor = shuffleArray(maxVotesValidVoters)[0];
                    await trigger(pollData.src_ref, "On Poll Closed", { winner: maxVotesData[0], executor: executor, voters: maxVotesValidVoters, other_voters: otherVoters }); 
                    await triggerPlayer(maxVotesData[0], "On Poll Win", { voters: maxVotesValidVoters, other_voters: otherVoters }); 
                    await triggerPlayer(maxVotesData[0], "On Poll Win Complex", { poll_name: pollName, voters: maxVotesValidVoters, other_voters: otherVoters }); 
                break;
                
            }
        }
        
        // remove all reactions
        for(let i = 0; i < messages.length; i++) {
            let msg = await channel.messages.fetch(messages[i]);
            await msg.reactions.removeAll();
        }
        
        // unpin
        let initialMsg = await channel.messages.fetch(pollData.initial_message);
        await initialMsg.unpin();
    }
    
    /** PUBLIC
    Evaluate vote value
    **/
    this.pollValue = async function(player_id, type, src_name = null) {
        if(type === "private") { // PRIVATE POLLS
            // get group membership type
            let voteValue = 0;
            if(src_name) { // check for a specific group
                let grpName = srcToValue(src_name);
                let grpMem = await queryAttributePlayer(player_id, "attr_type", "group_membership", "val1", grpName);
                let grpMemAll = await queryAttribute("attr_type", "group_membership", "val1", grpName);
                if(grpMem[0] && ["member","owner"].includes(grpMem[0].val2)) voteValue = 1;
                if(grpMemAll.length === 0) voteValue = 1; // empty group -> anyone can vote
                console.log(grpName, grpMem, voteValue);
            } else {
                voteValue = 1; // default for 1 if no group is specified
            }
            
            const voteManipulations = await getManipulations(player_id, "private");
            // add private votes
            for(let i = 0; i < voteManipulations.length; i++) {
                switch(voteManipulations[i].val1) {
                    case "absolute": voteValue = + voteManipulations[i].val3; break;
                    case "relative": voteValue += + voteManipulations[i].val3; break;
                }
            }
            // return vote total
            console.log("PRIVATE VOTE VALUE", voteValue);
            return voteValue;
        } else if(type === "public") { // PUBLIC POLLS
            const voteManipulations = await getManipulations(player_id, "public");
            const specialVoteManipulations = await getManipulations(player_id, "special");
            let voteValue = 1, specialVoteValue = 0;
            // add public votes
            for(let i = 0; i < voteManipulations.length; i++) {
                switch(voteManipulations[i].val1) {
                    case "absolute": voteValue = + voteManipulations[i].val3; break;
                    case "relative": voteValue += + voteManipulations[i].val3; break;
                }
            }
            // add special votes
            for(let i = 0; i < specialVoteManipulations.length; i++) {
                switch(specialVoteManipulations[i].val1) {
                    case "absolute": specialVoteValue = + specialVoteManipulations[i].val3; break;
                    case "relative": specialVoteValue += + specialVoteManipulations[i].val3; break;
                }
            }
            // return vote total
            let totalVotes = voteValue + ((voteValue>=0 ? 1 : -1) * specialVoteValue);
            console.log("PUBLIC VOTE VALUE", totalVotes, voteManipulations.map(el => `${el.val1}${el.val2}${el.val3}`), specialVoteManipulations.map(el => `${el.val1}${el.val2}${el.val3}`));
            return totalVotes;
        } else { // UNKNOWN / OTHER POLLS
            return 1;
        }
    }
    
    
    /**
    Converts a poll name to an emoji
    **/
    function pollNameToEmoji(name) {
        name = name.toLowerCase();
        switch(name) {
            case "abstain": return "⛔";
            case "cancel": return "❌";
            case "random": return "❓";
            case "yes": return client.emojis.cache.get(stats.yes_emoji);
            case "no": return client.emojis.cache.get(stats.no_emoji);
            case "a": return "🇦";
            case "b": return "🇧";
            case "c": return "🇨";
            case "d": return "🇩";
            case "e": return "🇪";
            case "f": return "🇫";
            case "g": return "🇬";
            case "h": return "🇭";
            case "i": return "🇮";
            case "j": return "🇯";
            case "k": return "🇰";
            case "l": return "🇱";
            case "m": return "🇲";
            case "n": return "🇳";
            case "o": return "🇴";
            case "p": return "🇵";
            case "q": return "🇶";
            case "r": return "🇷";
            case "s": return "🇸";
            case "t": return "🇹";
            case "u": return "🇺";
            case "v": return "🇻";
            case "w": return "🇼";
            case "x": return "🇽";
            case "y": return "🇾";
            case "z": return "🇿";
        }
    }

    /**
    Converts a poll emoji to a poll name
    **/
    this.pollEmojiToName = function(name) {
        name = name.toLowerCase();
        switch(name) {
            case "⛔": return "Abstain";
            case "❌": return "Cancel";
            case "❓": return "Random";
            case `<:${client.emojis.cache.get(stats.yes_emoji).name}:${client.emojis.cache.get(stats.yes_emoji).id}>`: return "Yes";
            case `<:${client.emojis.cache.get(stats.no_emoji).name}:${client.emojis.cache.get(stats.no_emoji).id}>`: return "No";
            case "🇦": return "a";
            case "🇧": return "b";
            case "🇨": return "c";
            case "🇩": return "d";
            case "🇪": return "e";
            case "🇫": return "f";
            case "🇬": return "g";
            case "🇭": return "h";
            case "🇮": return "i";
            case "🇯": return "j";
            case "🇰": return "k";
            case "🇱": return "l";
            case "🇲": return "m";
            case "🇳": return "n";
            case "🇴": return "o";
            case "🇵": return "p";
            case "🇶": return "q";
            case "🇷": return "r";
            case "🇸": return "s";
            case "🇹": return "t";
            case "🇺": return "u";
            case "🇻": return "v";
            case "🇼": return "w";
            case "🇽": return "x";
            case "🇾": return "y";
            case "🇿": return "z";
        }
    }
    
}
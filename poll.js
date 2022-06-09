/*
	Module for polls
*/
module.exports = function() {
	
	/* Handle poll command */
	this.cmdPoll = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			case "new":  cmdPollNew(message.channel, args); break;
			case "end": 
			case "close": cmdPollClose(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
	
	/* Handles poll creation command */
	this.cmdPollNew = function(channel, args) {
		switch(args[1]) {
			case "public": // public (lynch, election)
			case "private": // private (cult, wolfpack)
			case "dead": // medium
			case "dead_list": // medium + shows voters
			case "dead_vote": // list of dead participants
			case "yn": case "yna": // yes / no
			case "a": case "ab": case "abc": case "abcd": case "abcde": case "abcdef": // live trivia
			case "dead_a": case "dead_ab": case "dead_abc": case "dead_abcd": case "dead_abcde": case "dead_abcdef": // dead trivia
				pollCreate(channel, args, args[1]);
			break;
			default:  
				if(isCC(channel) || isSC(channel)) pollCreate(channel, args, "private");
				else pollCreate(channel, args, "public");
			break;
		}
	}
	
	/* Help for this module */
	this.helpPoll = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "poll [new|close] - Manages polls\n";
			break;
			case "poll":
			case "polls":
			case "pl":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "poll [new|close]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle polls. " + stats.prefix + "help poll <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- pl\n- polls\n```";
					break;
					case "new":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "poll new <Poll Type>\n```";
						help += "```\nFunctionality\n\nCreates a new poll. If no poll type is provided, and the command is executed in a secret channel, poll type is set to private, otherwise it is set to public. Assigns a sort of random name to each new poll.\n\nList of Poll Types:\npublic: Has all alive players, as well as an Abstain option. Uses public_value player property to evaluate poll results. Adds a players public_votes value to their own result. Only allows alive participants to vote. Mayor get an extra vote, unless they have less than 0 vote, then they get an extra negative vote.\nprivate: Has all alive players. Uses private_value player property to evaluate poll results. Only allows alive participants to vote.\ndead: Has Yes/No options. Every vote has a value of 1. Only allows dead participants to vote.\nyn: Yes/No for Participants\nyna: Yes/No/Abstain for Participants\ndead_vote: A list of dead participants, and only dead participants can vote on it.\ndead_list: Same as dead but shows who voted what.\na, ab, abc, abcd, abcde, abcdef, dead_a, dead_ab, dead_abc, dead_abcd, dead_abcde, dead_abcdef: Polls with options a-f, for alive or dead participants.```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "poll new\n\n> " +  stats.prefix + "poll new public```";
					break;
					case "close":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "poll close <Poll Name(s)>```";
						help += "```\nFunctionality\n\nCloses a poll with the name <Poll Name> evaluates it depending on what type it is and sends the results in the channel the command is run in. If more than one poll name is provided, attempts to close all polls```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "poll close dsk\n```";
					break;
				}
			break;
		}
		return help;
	}
	
	
	// custom values
	this.pollValues = {
		"abstain": ["⛔", "*Abstain*"],
		"cancel": ["❌", "*Cancel*"],
		"random": ["❓", "*Random*"],
		"yes": [client.emojis.cache.get(stats.yes_emoji), "Yes"],
		"no": [client.emojis.cache.get(stats.no_emoji), "No"],
		"a": ["🇦", "Option A"],
		"b": ["🇧", "Option B"],
		"c": ["🇨", "Option C"],
		"d": ["🇩", "Option D"],
		"e": ["🇪", "Option E"],
		"f": ["🇫", "Option F"]
	};
	
	/* Create new poll */
	this.pollCreate = async function(channel, args, type) {
		// Cache vote values
		getVotes();
		// Get a list of players
		sql("SELECT id,emoji FROM players WHERE alive = " + (type=="dead_vote"?"0":"1"), result => {
			sqlGetStat(13, pollNum => {
				// poll name
				let pollName;
				if(args[2]) { // allow named polls
					pollName = args[2].replace(/[^a-z\-_]+/g, "");
					if(pollName.length > 20) pollName = pollName.substr(0, 20);
				} 
				if(!pollName || !pollName.length) { // if no name is provided generate one
					pollName = Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 1) + ((((+pollNum) + 2) * 3)  - 4).toString(36).replace(/[^a-z]+/g, "a") + Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 1);
				}
				// Get player lists
				let playerLists = [], playerList = result.map(el => [el.emoji, channel.guild.members.cache.get(el.id)]);
				let addValues = [];
				let overwriteValues = [];
				if(type === "public" && (stats.poll == 0 || stats.poll == 2)) addValues.push("abstain");
				if(type === "dead_vote" && (stats.poll == 0 || stats.poll == 2)) addValues.push("abstain");
				else if(type === "public" && stats.poll == 1) addValues.push("cancel");
				else if(type === "private" && stats.poll == 2) addValues.push("random");
				else if(type === "dead_vote" && stats.poll == 1) addValues.push("cancel");
				else if(type === "dead") overwriteValues = ["yes", "no"];
				else if(type === "dead_list") overwriteValues = ["yes", "no"];
				else if(type === "yn") overwriteValues = ["yes", "no"];
				else if(type === "yna") overwriteValues = ["yes", "no", "abstain"];
				else if(type === "a" || type === "dead_a") overwriteValues = ["a"];
				else if(type === "ab" || type === "dead_ab") overwriteValues = ["a","b"];
				else if(type === "abc" || type === "dead_abc") overwriteValues = ["a","b","c"];
				else if(type === "abcd" || type === "dead_abcd") overwriteValues = ["a","b","c","d"];
				else if(type === "abcde" || type === "dead_abcde") overwriteValues = ["a","b","c","d","e"];
				else if(type === "abcdef" || type === "dead_abcdef") overwriteValues = ["a","b","c","d","e","f"];
				
				// add or overwrite poll
				if(overwriteValues[0]) playerList = [];
				addValues.push(...overwriteValues);
				addValues = addValues.map(el => pollValues[el]);
				playerList.push(...addValues);
				
				// split poll into several messages if necessary
				while(playerList.length > 0) playerLists.push(playerList.splice(0, 20));
				// Print message
				channel.send("Poll `#" + pollName + "`");
				// Handle each message of the poll
				playerLists.forEach(list => {
					let pollMsg = list.map(el => el.join(" - ")).join("\n");
					channel.send(pollMsg).then(m => {
						pollReact(m, list, 0);
						sql("INSERT INTO polls (poll_id, message_id, type) VALUES (" + connection.escape(pollName) + ", " + connection.escape(m.id) + ", " + connection.escape(type) + ")", result => {
						}, () => {
							// DB Error
							channel.send("⛔ Database error. Could not add poll message to database!");
						});	
					}).catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not create poll");
					});
				});
				// Increment poll count
				sql("UPDATE stats SET value = value + 1 WHERE id = 13", result => {
				}, () => {
					channel.send("⛔ Database error. Could not increment Poll count!"); 
				});
			}, () => {
				// DB error
				channel.send("⛔ Database error. Could not find Poll info!");
			});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list alive players!");
		});
	}
	
	/* Closes a poll */
	this.cmdPollClose = async function(channel, args) {
		let pollNames = args.splice(1);
		pollNames.forEach(el => cmdPollCloseOne(channel, el));
	}
	
	this.cmdPollCloseOne = async function(channel, pollName) {
		sql("SELECT message_id,type FROM polls WHERE poll_id = " + connection.escape(pollName), result => {
			if(result.length > 0) pollGetReactions(channel, result.map(el => el.message_id), [], 0, result[0].type, pollName);
			else channel.send("⛔ Database error. Could not find poll!");
		}, () => {
			channel.send("⛔ Database error. Could not get info from poll database!");
		});
	}
	
	/* Gets value of a vote */
	this.pollValue = function(member, type) {
		let voteValue = 0;
		switch(type) {
			case "public": 
				if(!isParticipant(member)) return 0;
				voteValue = + publicValues.find(el => el.id === member.id).public_value;
				if(member.roles.cache.get(stats.mayor) && voteValue >= 0) {
					voteValue++;
				} else if(member.roles.cache.get(stats.mayor) && voteValue < 0) {
					voteValue--;
				}
			break;
			case "private": 
				if(!isParticipant(member)) return 0;
				voteValue = + privateValues.find(el => el.id === member.id).private_value;
			break;
			case "dead": 
			case "dead_vote": 
			case "dead_list": 
			case "dead_a": 
			case "dead_ab": 
			case "dead_abc": 
			case "dead_abcd": 
			case "dead_abcde": 
			case "dead_abcdef": 
				if(!isDeadParticipant(member)) return 0;
				voteValue = 1;
			break;
			default: 
				if(!isParticipant(member)) return 0;
				voteValue = 1;
			break;
		}
		return voteValue;
	}
	
	this.pollGetReactions = function(channel, messages, reactions, index, pollType, pollNum) {
		if(index >= messages.length) {
			pollGetVoters(channel, reactions, 0, pollType, pollNum, messages);
			return;
		} else {
			channel.messages.fetch(messages[index]).then(m => {
				let newReactions = reactions.concat(m.reactions.cache.map((data,emoji) => { return {emoji_id: emoji, emoji: emoji.match(/\d+/) ? "<:" + (client.emojis.cache.get(emoji).name).toLowerCase() + ":"  + client.emojis.cache.get(emoji).id + ">" : emoji, users: data.users, count: data.count, messageID: data.messageID}; }));
				//logO(newReactions);
				//channel.send("```" + JSON.stringify(newReactions, null, 4) + "```");
				//channel.send("```" + JSON.stringify(emojiIDs, null, 4) + "```");
				pollGetReactions(channel, messages, newReactions, ++index, pollType, pollNum);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not find poll message");
			});
		}
	}
	
	/* Gets a voter from a poll */
	this.pollGetVoters = function(channel, reactions, index, pollType, pollNum, messages) {
		if(index >= reactions.length) {
			pollPrintResult(channel, reactions, pollType, pollNum, messages);
		} else {
			// Fetch each user
			reactions[index].users.fetch().then(u => {
				pollGetVoters(channel, reactions, ++index, pollType, pollNum, messages);
			}).catch(err => { 
				// Discord error
				logO(err); 
				sendError(channel, err, "Could not find all voters");
			});
		}
	}
	
	/* Prints a poll result */
	this.pollPrintResult = function(channel, reactions, pollType, pollNum, messages) {
		// Find duplicate votes
		let duplicates = ([].concat.apply([], reactions.map(el => el.users.cache.toJSON()))).filter((el, index, array) => array.indexOf(el) != index).filter((el, index, array) => array.indexOf(el) === index);
		// Create message
		let votesMessage = reactions.filter(el => el.users.cache.toJSON().length > 1 || (emojiToID(el.emoji) && publicVotes.find(el2 => el2.id === emojiToID(el.emoji)).public_votes > 0)).map(el => {
			// Get non duplicate voters
			let votersList = el.users.cache.toJSON().filter(el => !duplicates.includes(el)).map(el3 => channel.guild.members.cache.get(el3.id));
			if(!votersList.length && (!emojiToID(el.emoji) || publicVotes.find(el2 => el2.id === emojiToID(el.emoji)).public_votes <= 0)) return { valid: false };
			// Count votes
			let votes = 0;
			if(votersList.length) votes += votersList.map(el => pollValue(el, pollType)).reduce((a, b) => a + b);
			if(pollType === "public") votes += emojiToID(el.emoji) ? publicVotes.find(el2 => el2.id === emojiToID(el.emoji)).public_votes : 0;
			if(votes <= 0) return { valid: false };
			// Get string of voters
			let voters;
			if(pollType != "dead" && pollType != "dead_vote" && pollType != "dead_list" && pollType != "dead_a" && pollType != "dead_ab" && pollType != "dead_abc" && pollType != "dead_abcd" && pollType != "dead_abcde" && pollType != "dead_abcdef") voters = votersList.filter(el => isParticipant(el)).join(", ");
			else voters = votersList.filter(el => isDeadParticipant(el)).join(", ");
			// Get candidate from emoji
			let candidate = "not set";
			let pollVal = Object.values(pollValues).find(el2 => el2[0] == el.emoji);
			if(pollVal) candidate = pollVal[1];
			else if(emojiToID(el.emoji)) candidate = channel.guild.members.cache.get(emojiToID(el.emoji));
			else candidate = "*Unknown*";
			// Return one message line
			return { valid: true, votes: votes, candidate: candidate, emoji: el.emoji, voters: voters };
	}).filter(el => el.valid).sort((a, b) => a.votes < b.votes).map(el => { 
		let vot = (el.voters ? el.voters : "*Nobody*"); 
		if(pollType === "dead") vot = "*Hidden*";
		return `(${el.votes}) ${el.emoji} ${el.candidate} **-** ${vot}`;
	}).join("\n");
		// Send message
		if(!votesMessage.length) votesMessage = "*Nobody voted...*";
		channel.send("Results for Poll `#" + pollNum + "`:\n" + votesMessage);
		messages.forEach(el => {
			channel.messages.fetch(el).then(m => {
				m.reactions.removeAll().catch(err => { 
					// Discord error
					logO(err); 
					sendError(channel, err, "Could not clear reactions");
				});
			});
			sql("DELETE FROM polls WHERE message_id = " + connection.escape(el), result => {			
			}, () => {
				// DB error
				channel.send("⛔ Database error. Could not delete poll from database!");
			});
		});
	}
	
	/* Reacts once to a poll message */
	this.pollReact = function(message, list, index) {
		// Check end of list
		if(index > 20 || index >= list.length) return;
		// React to message
		message.react(typeof list[index][0] === "string" ? list[index][0].replace(/<|>/g,"") : list[index][0]).then(r => {
			// Recursively continue
			pollReact(message, list, ++index);
		}).catch(err => { 
			// Permission error
			logO(err); 
			sendError(channel, err, "Could not react to poll");
		});
	}


	
}

/*
	Module for handelling users
		- Validating a user
		- Handelling a list of users
		- Checking if a user has a specific role
		- Cacheing player emojis
		- Converting between emojis and user ids
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
*/
module.exports = function() {
	/* Variables */
	this.loadedModulePlayers = true;
	this.emojiIDs = null;
	this.publicValues = null;
	this.privateValues = null;
	this.publicVotes = null;
	this.ccs = null;
	this.pRoles = null;
	
	/* Handle players command */
	this.cmdPlayers = function(message, args) {
		// Check subcommands
		if(!args[0] || (!args[1] && args[0] != "list")) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `players [get|get_clean|set|resurrect|signup|list]`!"); 
			return; 
		}
		//Find subcommand
		switch(args[0]) {
			case "get": cmdPlayersGet(message.channel, args, false); break;
			case "get_clean": cmdPlayersGet(message.channel, args, true); break;
			case "set": cmdPlayersSet(message.channel, args); break;
			case "resurrect": cmdPlayersResurrect(message.channel, args); break;
			case "signup": cmdPlayersSignup(message.channel, args); break;
			case "sub": 
			case "substitute": cmdPlayersSubstitute(message, args); break;
			case "switch": cmdPlayersSwitch(message, args); break;
			case "list": cmdConfirm(message, "players list"); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	this.helpPlayers = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "players [get|get_clean|set|resurrect|signup|list] - Manages players\n";
				if(isGameMaster(member)) help += stats.prefix + "players [substitute|switch] - Manages player changes\n";
				if(isGameMaster(member)) help += stats.prefix + "killq [add|remove|killall|list|clear] - Manages kill queue\n";
				help += stats.prefix + "list - Lists signed up players\n";
				help += stats.prefix + "alive - Lists alive players\n";
				help += stats.prefix + "signup - Signs you up for the next game\n";
				help += stats.prefix + "emojis - Gives a list of emojis and player ids (Useful for CC creation)\n";
			break;
			case "l":
			case "list":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "list\n```";
				help += "```\nFunctionality\n\nLists all signed up players\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "list\n< Signed Up Players | Total: 3\n  🛠 - McTsts (@McTsts)\n  🤔 - marhjo (@marhjo)\n  👌 - federick (@federick)\n```";
				help += "```diff\nAliases\n\n- l\n- signedup\n- signedup_list\n- signedup-list\n- listsignedup\n- list-signedup\n- list_signedup\n```";
			break;
			case "a":
			case "alive":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "alive\n```";
				help += "```\nFunctionality\n\nLists all alive players\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "list\n< Alive Players | Total: 3\n  🛠 - McTsts (@McTsts)\n  🤔 - marhjo (@marhjo)\n  👌 - federick (@federick)\n```";
				help += "```diff\nAliases\n\n- a\n- alive_list\n- alive-list\n- listalive\n- list-alive\n- list_alive\n```";
			break;
			case "e":
			case "emojis":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "emojis\n```";
				help += "```\nFunctionality\n\nGives you a list of emojis and player ids as well as a list of all emojis. Can be used for CC creation.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "emojis\n< 🛠 242983689921888256\n  🤔 102036304845377536\n  👌 203091600283271169\n  🛠 🤔 👌\n```";
				help += "```diff\nAliases\n\n- e\n```";
			break;
			case "join":
			case "signup":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "signup <Emoji>\n```";
				help += "```\nFunctionality\n\nSigns you up for the next game with emoji <Emoji>, which has to be a valid, not custom, emoji, that is not used by another player yet. If you have already signedup the command changes your emoji. If no emoji is provided, you are signed out.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "signup 🛠\n< ✅ @McTsts signed up with emoji 🛠!\n\n> " + stats.prefix + "signup\n< ✅ Successfully signed out, @McTsts. You will no longer participate in the next game!\n```";
				help += "```diff\nAliases\n\n- join\n- sign-up\n- sign_up\n- unsignup\n- signout\n- participate\n- sign-out\n- sign_out\n```";
			break;
			case "player":
			case "p":
			case "players":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players [get|get_clean|set|resurrect|signup|list|substitute]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle players. " + stats.prefix + "help players <sub-command> for detailed help.\n\nList of Player Properties:\nalive: Whether the player is alive`\nemoji: The emoji the player uses\nrole: The role of the player\npublic_value: The value of the players vote on public polls (Typically 1)\nprivate_value: The value of the players vote on private polls (Typically 1)\npublic_votes: The base value of votes the player has against them on public votes (Typically 0)\nid: The discord id of the player\nccs: the amount of created ccs```";
						help += "```diff\nAliases\n\n- p\n- player\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players get <Player Property> <Player>\n```";
						help += "```\nFunctionality\n\nReturns the value of <Player Property> for a player indentified with <Player>. For a list of player properties see " + stats.prefix + "help players.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players get alive mctsts\n< ✅ McTsts's alive value is 1!\n```";
					break;
					case "get_clean":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players get_clean <Player Property> <Player>\n```";
						help += "```\nFunctionality\n\nSame as get, but shows roles in a more player friendly way.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players get alive mctsts\n< ✅ McTsts's alive value is 1!\n```";
					break;
					case "set":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players set <Player Property> <Player> <Value>\n```";
						help += "```\nFunctionality\n\nSets the value of <Player Property> for a player indentified with <Player> to <Value>. For a list of player properties see " + stats.prefix + "help players.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players set role mctsts baker\n< ✅ McTsts's role value now is baker!\n```";
					break;
					case "resurrect":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players resurrect <Player>\n```";
						help += "```\nFunctionality\n\nResurrects a player indentified with <Player>, by setting their alive value to 1, removing the dead participant role, and adding the participant role.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players resurrect mctsts\n< ✳ Resurrecting McTsts!\n< ✅ McTsts's alive value now is 1!\n```";
					break;
					case "signup":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players signup <Player> <Emoji>\n```";
						help += "```\nFunctionality\n\nPretends the player identified with <Player> used the command " + stats.prefix + "signup <Emoji>. This command works even if signups aren't open.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players signup mctsts 🛠\n< ✅ @McTsts signed up with emoji 🛠!\n```";
					break;
					case "sub":
					case "substitute":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players substitute <Old Player> <New Player> <New Emoji>\n```";
						help += "```\nFunctionality\n\nReplaces the first player with the second.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players sub 242983689921888256 588628378312114179 🛠\n```";
					break;
					case "switch":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players switch <Old Player> <New Player>\n```";
						help += "```\nFunctionality\n\nSwitches the first player with the second.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players switch 242983689921888256 588628378312114179\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players list\n```";
						help += "```\nFunctionality\n\nLists all players with their role and alive values.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players list\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "players list!\n> Players | Total: 2\n  🛠 - @McTsts (Werewolf); Alive: 1\n  👌 - @federick (Baker); Alive: 1```";
					break;		
				}
			break;
			case "kq":
			case "killq":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "killq [add|remove|killall|list|clear]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle killing. " + stats.prefix + "help killq <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- killq\n- killqueue\n- kq\n```";
					break;
					case "add":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "killq add <Player List>\n```";
						help += "```\nFunctionality\n\nAdds all players from the <Player List> into the kill queue.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "killq add mctsts\n< ✳ Adding 1 player (McTsts) to the kill queue!\n< ✅ Added McTsts to the kill queue!\n```";
					break;
					case "remove":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "killq remove <Player List>\n```";
						help += "```\nFunctionality\n\nRemoves all players from the <Player List> from the kill queue.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "killq remove mctsts\n< ✳ Removing 1 player (McTsts) from the kill queue!\n< ✅ Removed McTsts from the kill queue!\n```";
					break;
					case "killall":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "killq killall\n```";
						help += "```\nFunctionality\n\nKills all players that are currently in the kill queue.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "killq killall\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "killq killall!\n< Kill Queue | Total: 1\n  🛠 - McTsts (McTsts)\n< ✳ Killing 1 player!\n< ✅ Killed McTsts!\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "killq list\n```";
						help += "```\nFunctionality\n\nLists all players that are currently in the kill queue.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "killq list\n< Kill Queue | Total: 1\n  🛠 - McTsts (McTsts)\n```";
					break;
					case "clear":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "killq clear\n```";
						help += "```\nFunctionality\n\nRemoves all players from the kill queue.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "killq clear\n< ✅ Successfully cleared kill queue!\n```";
					break;
				}
			break;
		}
		return help;
	}
	
	/* Handles Emoji Get command */
	this.cmdEmojis = function(channel) {
		channel.send("```\n" + emojiIDs.map(el =>  el.emoji + " " + el.id).join("\n") + "\n``` ```\n" + emojiIDs.map(el =>  el.emoji).join(" ") + "\n```");
	}
	
	/* Handles killq command */
	this.cmdKillq = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `killq [list|add|remove|clear|killall]`!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			case "list": cmdKillqList(message.channel); break;
			case "add": cmdKillqAdd(message.channel, args); break;
			case "remove": cmdKillqRemove(message.channel, args); break;
			case "clear": cmdKillqClear(message.channel); break;
			case "killall": cmdKillqList(message.channel); cmdConfirm(message, "killq killall"); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	/* Lists current killq */
	this.cmdKillqList = function(channel) {
		// Get killq
		sql("SELECT id FROM killq", result => {
			// Print killq
			result = removeDuplicates(result.map(el => el.id));
			let playerList = result.map(el => idToEmoji(el) + " - " + channel.guild.members.cache.get(el).displayName + " (" + channel.guild.members.cache.get(el).user.username + ")").join("\n");
			channel.send("**Kill Queue** | Total: " +  result.length + "\n" + playerList);
		}, () => {
			// Db error
			channel.send("⛔ Database error. Could not list kill queue!");
		});
	}
	
	/* Add an user to the killq */
	this.cmdKillqAdd = function(channel, args) {
		// Check parameter
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Requires at least 1 player!"); 
			return; 
		}
		// Get users 
		players = getUserList(channel, args, 1);
		if(players)  {
			let playerList = players.map(el => "`" + channel.guild.members.cache.get(el).displayName + "`").join(", ");
			// Add to killq
			channel.send("✳ Adding " + players.length + " player" + (players.length != 1 ? "s" : "") + " (" + playerList  + ") to the kill queue!");
			players.forEach(el => {
				sql("INSERT INTO killq (id) VALUES (" + connection.escape(el) + ")", result => {
					channel.send("✅ Added `" +  channel.guild.members.cache.get(el).displayName + "` to the kill queue!");
				}, () => {
					// DB Error
					channel.send("⛔ Database error. Could not add " +  channel.guild.members.cache.get(el) + " to the kill queue!");
				});	
			});
		} else {
			// No valid players
			channel.send("⛔ Syntax error. No valid players!");
		}
	}
	
	/* Removes an user from the killq */
	this.cmdKillqRemove = function(channel, args) {
		// Check parameters
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Requires at least 1 player!");
			return; 
		}
		// Get users
		players = getUserList(channel, args, 1);
		if(players) { 
			// Remove from killq
			let playerList = players.map(el =>"`" + channel.guild.members.cache.get(el).displayName + "`").join(", ");
			channel.send("✳ Removing " + players.length + " player" + (players.length != 1 ? "s" : "") + " (" + playerList + ") from the kill queue!");
			players.forEach(el => {
				sql("DELETE FROM killq WHERE id = " + connection.escape(el), result => {
					channel.send("✅ Removed `" +  channel.guild.members.cache.get(el).displayName + "` from the kill queue!");
				}, () => {
					// DB error
					channel.send("⛔ Database error. Could not remove " +  channel.guild.members.cache.get(el) + " from the kill queue!");
				});	
			});
		}  else {
			// No valid players
			channel.send("⛔ Syntax error. No valid players!");
		}
	}
	
	/* Kills all players in the killq */
	this.cmdKillqKillall = function(channel) {
		sql("SELECT id FROM killq", result => {
			result = removeDuplicates(result.map(el => el.id));
			channel.send("✳ Killing `" + result.length + "` player" + (result.length != 1 ? "s" : "") + "!");
			result.forEach(el => {
				// Update DB
				sql("DELETE FROM killq WHERE id = " + connection.escape(el), result => {
				}, () => {
					channel.send("⛔ Database error. Could not remove `" +  channel.guild.members.cache.get(el).displayName + "` from the kill queue!");
				});	
				sql("UPDATE players SET alive = 0 WHERE id = " + connection.escape(el), result => {
					channel.send("✅ Killed `" +  channel.guild.members.cache.get(el).displayName + "`!");
					updateGameStatus(channel.guild);
				}, () => {
					channel.send("⛔ Database error. Could not kill `" +  channel.guild.members.cache.get(el).displayName + "`!");
				});	
				// Send reporter message
				let reporterChannel = channel.guild.channels.cache.get(stats.reporter_channel);
				if(reporterChannel) {
					reporterChannel.send(stats.prefix + "players get_clean role " + channel.guild.members.cache.get(el)).catch(err => { 
						// Discord error
						logO(err); 
						sendError(channel, err, "Could not send reporter message");
					});
				}
				// Remove roles
				channel.guild.members.cache.get(el).roles.remove(stats.participant).catch(err => { 
					// Missing permissions
					logO(err); 
					sendError(channel, err, "Could not remove role");
				});
				channel.guild.members.cache.get(el).roles.remove(stats.mayor).catch(err => { 
					// Missing permissions
					logO(err); 
					sendError(channel, err, "Could not remove role");
				});
				channel.guild.members.cache.get(el).roles.remove(stats.mayor2).catch(err => { 
					// Missing permissions
					logO(err); 
					sendError(channel, err, "Could not remove role");
				});
				channel.guild.members.cache.get(el).roles.remove(stats.reporter).catch(err => { 
					// Missing permissions
					logO(err); 
					sendError(channel, err, "Could not remove role");
				});
				channel.guild.members.cache.get(el).roles.remove(stats.guardian).catch(err => { 
					// Missing permissions
					logO(err); 
					sendError(channel, err, "Could not remove role");
				});
				channel.guild.members.cache.get(el).roles.add(stats.dead_participant).catch(err => { 
					// Missing permissions
					logO(err); 
					sendError(channel, err, "Could not remove role");
				});
			});
		}, () => {
			channel.send("⛔ Database error. Could not kill the players in the kill queue");
		});
	}
	
	/* Clear killq */
	this.cmdKillqClear = function(channel) {
		sql("DELETE FROM killq", result => {
			channel.send("✅ Successfully cleared kill queue!");
		}, () => {
			channel.send("⛔ Database error. Could not clear kill queue!");
		});
	}
	
	/* Lists all signedup players */
	this.cmdPlayersList = function(channel, args) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,public_value,private_value,public_votes,ccs FROM players", result => {
			let playerListArray = result.map(el => `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"} (${el.role.split(",").map(role => toTitleCase(role)).join(" + ")}); Alive: ${channel.guild.members.cache.get(el.id) ? (el.alive ? client.emojis.cache.get(stats.yes_emoji) : client.emojis.cache.get(stats.no_emoji)) : "⚠️"}; CCs: ${el.ccs}; Votes: ${el.public_value},${el.private_value},${el.public_votes}`);
			let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/10)]) playerList[Math.floor(counter/10)] = [];
				playerList[Math.floor(counter/10)].push(playerListArray[i]);
				counter++;
			}
			channel.send("**Players** | Total: " + result.length);
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("✳ Listing players " + i  + "/" + (playerList.length) + "...").then(m => {
					m.edit(playerList[i])
				}).catch(err => {
					logO(err); 
					sendError(channel, err, "Could not list signed up players");
				});
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list signed up players!");
		});
	}
	
	/* Lists all signedup players */
	this.cmdListSignedup = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji FROM players", result => {
			let playerList = result.map(el => `${el.emoji}  - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username : "*user left*"} (${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id) : "<@" + el.id + ">"})`).join("\n");
			// Print message
			channel.send("✳ Listing signed up players").then(m => {
				m.edit("**Signed Up Players** | Total: " +  result.length + "\n" + playerList)
			}).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not list signed up players");
			});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list signed up players!");
		});
	}
	
	/* Lists all alive players */
	this.cmdListAlive = function(channel) {
		// Check gamephase
		if(stats.gamephase != 2) { 
			channel.send("⛔ Command error. Can only list alive players in ingame phase."); 
			return; 
		}
		// Get a list of players
		sql("SELECT id,emoji FROM players WHERE alive = 1", result => {
			let playerList = result.map(el => `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username : "*user left*"} (${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id) : "<@" + el.id + ">"})`).join("\n");
			// Print message
			channel.send("✳ Listing alive players").then(m => {
				m.edit("**Alive Players** | Total: " +  result.length + "\n" + playerList)
			}).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not list alive players");
			});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list alive players!");
		});
	}
	
	/* Substitutes a player */
	this.cmdPlayersSubstitute = async function(message, args) {
		if(!args[2] || !args[3]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players substitute <current player id> <new player id> <new emoji>`!"); 
			return; 
		}
		cmdPlayersSet(message.channel, ["set", "role", getUser(message.channel, args[1]), "substituted"]);
		cmdKillqAdd(message.channel, ["add", getUser(message.channel, args[1])]);
		setTimeout(function () {
			confirmActionExecute("killq killall", message, false);
		}, 5000);
		setTimeout(function () {
			cmdPlayersSet(message.channel, ["set", "id", getUser(message.channel, args[1]), getUser(message.channel, args[2])]);
			cmdPlayersSet(message.channel, ["set", "emoji", getUser(message.channel, args[2]), args[3]]); 
			cmdPlayersSet(message.channel, ["set", "role", getUser(message.channel, args[2]), pRoles.find(el => el.id === getUser(message.channel, args[1])).role]); 
			cmdPlayersResurrect(message.channel, ["resurrect", getUser(message.channel, args[2])]);
		}, 10000);
		setTimeout(function () {
			let categories = cachedCCs;
			categories.push(cachedSC)
			substituteChannels(message.channel, categories, 0, getUser(message.channel, args[1]), getUser(message.channel, args[2]));
		}, 15000);
		setTimeout(function() {
			cacheRoleInfo();
			getVotes();
			getCCs();
			getPRoles();
			getCCCats();
			message.channel.send("✅ Substitution complete!");
		}, 30000);
	}
	
	/* Substitutes a player */
	this.cmdPlayersSwitch = async function(message, args) {
		if(!args[2]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players switch <player id #1> <player id #2>`!"); 
			return; 
		}
		getPRoles();
		setTimeout(function () { // switch channels
			cmdPlayersSet(message.channel, ["set", "role", getUser(message.channel, args[2]), pRoles.find(el => el.id === getUser(message.channel, args[1])).role]); 
			cmdPlayersSet(message.channel, ["set", "role", getUser(message.channel, args[1]), pRoles.find(el => el.id === getUser(message.channel, args[2])).role]); 
			let categories = cachedCCs;
			categories.push(cachedSC)
			switchChannels(message.channel, categories, 0, getUser(message.channel, args[1]), getUser(message.channel, args[2]));
		}, 10000);
		setTimeout(function() { // reload data
			cacheRoleInfo();
			getVotes();
			getCCs();
			getPRoles();
			getCCCats();
			message.channel.send("✅ Switch complete!");
		}, 30000);
	}
	
	
	/* Subs a category */
	this.substituteChannels = function(channel, ccCats, index, subPlayerFrom, subPlayerTo) {
		// End
		if(ccCats.length <= 0 || ccCats.length >= 20) return;
		if(index >= ccCats.length) {
			channel.send("✅ Successfully substituted in all channel categories!");
			return;
		}
		// Category deleted
		if(!channel.guild.channels.cache.get(ccCats[index])) { 
			substituteChannels(channel, ccCats, ++index, subPlayerFrom, subPlayerTo);
			return;
		}
		// SUB channels in category
		substituteOneChannel(channel, ccCats, index, channel.guild.channels.cache.get(ccCats[index]).children.array(), 0, subPlayerFrom, subPlayerTo);
	}
	
	/* Subs a channel */
	this.substituteOneChannel = function(channel, ccCats, index, channels, channelIndex, subPlayerFrom, subPlayerTo) {
		if(channels.length <= 0) return;
		if(channelIndex >= channels.length) {
			channel.send("✅ Successfully substituted one channel category!");
			substituteChannels(channel, ccCats, ++index, subPlayerFrom, subPlayerTo);
			return;
		}
		// Deleted channel
		if(!channels[channelIndex] || !channel.guild.channels.cache.get(channels[channelIndex].id)) {
			substituteOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
			return;
		} else {
			let channelMembers = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.array().filter(el => el.type === "member").map(el => el.id);
			let channelOwners = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.array().filter(el => el.type === "member").filter(el => el.allow == 66560).map(el => el.id);
			if(channelMembers.includes(subPlayerFrom)) {
				cmdCCAdd(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["add", subPlayerTo], 1);
			}
			if(channelOwners.includes(subPlayerFrom)) {
				setTimeout(function() {
					cmdCCPromote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["promote", subPlayerTo], 1);
					substituteOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
				}, 500);
			} else {
				substituteOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
			}
		}
	}
	
	/* switch a category */
	this.switchChannels = function(channel, ccCats, index, subPlayerFrom, subPlayerTo) {
		// End
		if(ccCats.length <= 0 || ccCats.length >= 20) return;
		if(index >= ccCats.length) {
			channel.send("✅ Successfully switched in all channel categories!");
			return;
		}
		// Category deleted
		if(!channel.guild.channels.cache.get(ccCats[index])) { 
			switchChannels(channel, ccCats, ++index, subPlayerFrom, subPlayerTo);
			return;
		}
		// SUB channels in category
		switchOneChannel(channel, ccCats, index, channel.guild.channels.cache.get(ccCats[index]).children.array(), 0, subPlayerFrom, subPlayerTo);
	}
	
	/* Subs a channel */
	this.switchOneChannel = function(channel, ccCats, index, channels, channelIndex, subPlayerFrom, subPlayerTo) {
		if(channels.length <= 0) return;
		if(channelIndex >= channels.length) {
			channel.send("✅ Successfully switched one channel category!");
			switchChannels(channel, ccCats, ++index, subPlayerFrom, subPlayerTo);
			return;
		}
		// Deleted channel
		if(!channels[channelIndex] || !channel.guild.channels.cache.get(channels[channelIndex].id)) {
			switchOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
			return;
		} else {
			let channelMembers = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.array().filter(el => el.type === "member").map(el => el.id);
			let channelOwners = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.array().filter(el => el.type === "member").filter(el => el.allow == 66560).map(el => el.id);
			if(channelMembers.includes(subPlayerFrom) && !channelMembers.includes(subPlayerTo)) {
				cmdCCAdd(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["add", subPlayerTo], 1);
				cmdCCRemove(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["remove", subPlayerFrom], 1);
			}
			if(!channelMembers.includes(subPlayerFrom) && channelMembers.includes(subPlayerTo)) {
				cmdCCAdd(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["add", subPlayerFrom], 1);
				cmdCCRemove(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["remove", subPlayerTo], 1);
			}
			if(channelOwners.includes(subPlayerFrom) && !channelOwners.includes(subPlayerTo)) {
				setTimeout(function() {
					cmdCCPromote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["promote", subPlayerTo], 1);
					switchOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
				}, 500);
			} else if(!channelOwners.includes(subPlayerFrom) && channelOwners.includes(subPlayerTo)) {
				setTimeout(function() {
					cmdCCPromote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["promote", subPlayerFrom], 1);
					switchOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
				}, 500);
			} else {
				switchOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
			}
		}
	}
	
	
	/* Get information about a player */
	this.cmdPlayersGet = function(channel, args, mode) {
		// Check arguments
		if(!args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players get <value name> <player>`!"); 
			return; 
		}
		// Get user
		var user = getUser(channel, args[2]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!"); 
			return; 
		} else if(args[1] != "emoji" && args[1] != "role" && args[1] != "alive" && args[1] != "public_value" && args[1] != "private_value" && args[1] != "public_votes" && args[1] != "id" && args[1] != "ccs") { 
			// Invalid parameter
			channel.send("⛔ Syntax error. Invalid parameter `" + args[1] + "`!"); 
			return; 
		} else {
			// Get info
			sql("SELECT " + args[1] + " FROM players WHERE id = " + connection.escape(user), result => {
				let playerName = channel.guild.members.cache.get(user).displayName;
				channel.send("✅ `" + playerName + "`'s " + args[1] + " is `" + (args[1] === "role" ? (mode ? result[0][args[1]].split(",").filter(role => verifyRoleVisible(role)).join("` + `") : result[0][args[1]].split(",").join(", ")) : result[0][args[1]]) + "`!");
			}, () => {
				// Database error
				channel.send("⛔ Database error. Could not get player information!");
			});
		}
	}
	
	/* Set information of a player */
	this.cmdPlayersSet = function(channel, args) {
		// Check arguments
		if(!args[2] || !args[3]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players set <value name> <player> <value>`!"); 
			return; 
		}
		// Get user
		var user = getUser(channel, args[2]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!"); 
			return; 
		} else if(args[1] != "id" && args[1] != "emoji" && args[1] != "role" && args[1] != "alive" && args[1] != "public_value" && args[1] != "private_value" && args[1] != "public_votes" && args[1] != "ccs") { 
			// Invalid parameter
			channel.send("⛔ Syntax error. Invalid parameter `" + args[1] + "`!"); 
			return; 
		}
		sql("UPDATE players SET " + args[1] + " = " + connection.escape(args[3]) + " WHERE id = " + connection.escape(user), result => {
			let playerName = channel.guild.members.cache.get(user).displayName;
			channel.send("✅ `" + playerName + "`'s " + args[1] + " value now is `" + args[3] + "`!");
			updateGameStatus(channel.guild);
			getVotes();
			getCCs();
			getPRoles();
		}, () => {
			channel.send("⛔ Database error. Could not update player information!");
		});
	}
	
	/* Resurrects a dead player */
	this.cmdPlayersResurrect = function(channel, args) {
		// Get user
		var user = getUser(channel, args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			// Send resurrect message
			let playerName = channel.guild.members.cache.get(user).displayName;
			channel.send("✳ Resurrecting " + playerName + "!");
			// Set Roles
			channel.guild.members.cache.get(user).roles.add(stats.participant).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not add role");
			});
			channel.guild.members.cache.get(user).roles.remove(stats.dead_participant).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not remove role");
			});
			// Set DB Value
			channel.send(stats.prefix + "players set alive " + user + " 1");
		}
	}
	
	/* Signup somebody else */
	this.cmdPlayersSignup = function(channel, args) {
		var user = getUser(channel, args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			cmdSignup(channel, channel.guild.members.cache.get(user), args.slice(2), false);
		}
	}
	
	/* Signup a player */
	this.cmdSignup = function(channel, member, args, checkGamephase) {
		// Wrong Phase 
		if(checkGamephase && stats.gamephase != 1) { 
			channel.send("⛔ Signup error. Sign ups are not open! Sign up will open up again soon."); 
			return; 
		} else if(isSub(member)) { 
		// Failed sign out
			channel.send("⛔ Sign up error. Can't sign up while being a substitute player."); 
			return; 
		} else if(!args[0] && !isSignedUp(member)) { 
		// Failed sign out
			channel.send("⛔ Sign up error. Can't sign out without being signed up! Use `" + stats.prefix + "signup <emoji>` to sign up."); 
			return; 
		} else if(!args[0] && isSignedUp(member)) { 
			// Sign out player
			sql("DELETE FROM players WHERE id = " + connection.escape(member.id), result => {			
				channel.send(`✅ Successfully signed out, ${member.user}. You will no longer participate in the next game!`); 
				updateGameStatus(channel.guild);
				member.roles.remove(stats.signed_up).catch(err => { 
					// Missing permissions
					logO(err); 
					sendError(channel, err, "Could not remove role!");
				});
			}, () => {
				// DB error
				channel.send("⛔ Database error. Could not sign you out!");
			});
		} else if(!isSignedUp(member)) {
			// Sign Up
			channel.send("✳ Attempting to sign you up").then(message => {
				message.react(args[0].replace(/<|>/g,"")).then(r => {
					sql("SELECT id FROM players WHERE emoji = " + connection.escape(args[0]), result => {
						// Check if somebody is already signed up with this emoji
						if(result.length > 0 || args[0] === "⛔" || args[0] === "❌") { 
							// Signup error
							channel.send("⛔ Database error. Emoji " + args[0] + " is already being used!");
							message.reactions.removeAll().catch(err => { 
									// Couldn't clear reactions
									logO(err);
									sendError(channel, err, "Could not clear reactions!");
								});
						} else { 
							// Signup emoji
							sql("INSERT INTO players (id, emoji, role) VALUES (" + connection.escape(member.id) + "," + connection.escape("" + args[0]) + "," + connection.escape("none") + ")", result => {
								message.edit(`✅ ${member.user} signed up with emoji ${args[0]}!`);
								updateGameStatus(message.guild);
								message.reactions.removeAll().catch(err => { 
									// Couldn't clear reactions
									logO(err);
									sendError(channel, err, "Could not clear reactions!");
								});
								member.roles.add(stats.signed_up).catch(err => { 
									// Missing permissions
									logO(err); 
									editError(message, err, "Could not add role!");
								});
							}, () => {
								// DB error
								message.edit("⛔ Database error. Could not sign you up!");
							});	
						}					
					}, () => {
						// DB error
						message.edit("⛔ Database error. Could not check signed up players!");
					});
				}).catch(err => { 
					// Invalid emoji
					message.edit("⛔ Invalid emoji. Couldn't use emoji. Could not sign you up!");
					logO(err); 
				});
			}).catch(err => { 
				// Couldn't check emoji
				logO(err);
				sendError(channel, err, "Could not check emoji!");
			});
		} else {
		// Change Emoji 
			channel.send("✳ Attempting to sign you up").then(message => {
				message.react(args[0].replace(/<|>/g,"")).then(r => {
					sql("SELECT id FROM players WHERE emoji = " + connection.escape(args[0]), result => {
						// Check if somebody already has this emoji
						if(result.length > 0 || args[0] === "⛔") { 
							// Signup error
							message.edit("⛔ Database error. Emoji " + args[0] + " is already being used!");
							message.reactions.removeAll().catch(err => { 
									// Couldn't clear reactions
									logO(err);
									sendError(channel, err, "Could not clear reactions!");
								});
						} else {
							// Change emoji
							sql("UPDATE players SET emoji = " + connection.escape("" + args[0]) + " WHERE id = " + connection.escape(member.id), result => {
								message.edit(`✅ ${member.user} changed emoji to ${args[0]}!`);
								message.reactions.removeAll().catch(err => { 
									// Couldn't clear reactions
									logO(err);
									sendError(channel, err, "Could not clear reactions!");
								});
							}, () => {
								// DB error
								message.edit("⛔ Database error. Could not change your emoji!");
							});	
						}
					}, () => {
						// DB error
						message.edit("⛔ Database error. Could not change your emoji!");
					});	
				}).catch(err => { 
					// Invalid emoji
					message.edit("⛔ Invalid emoji. Could not change your emoji!");
					logO(err);
				});
			}).catch(err => { 
				// Couldn't check emoji
				logO(err);
				sendError(channel, err, "Could not check emoji");
			});
		}
	}
	
	/* Get User from Argument */
	this.getUser = function(channel, inUser) {
		var user;
		// Get User by ID 
		if(/^\d+$/.test(inUser)) {
			user = client.users.cache.find(user => user.id === inUser);
			if(user) return user.id;
		}
		// Get User by Discord Tag with Nickname
		if(/^<@!\d*>$/.test(inUser)) {
			let inUserID = inUser.substr(3, inUser.length - 4) + "";
			user = client.users.cache.find(user => user.id === inUserID);
			if(user) return user.id;
		}
		// Get User by Discord Tag without Nickname
		if(/^<@\d*>$/.test(inUser)) {
			let inUserID = inUser.substr(2, inUser.length - 3) + "";
			user = client.users.cache.find(user => user.id === inUserID);
			if(user) return user.id;
		}
		// Get User by Name
		user = client.users.cache.find(user => user.username.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Nickname
		user = channel.guild.members.cache.find(member => member.nickname && member.nickname.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Emoji 
		user = emojiToID(inUser)
		if(user) return user;
		return false;
	}

	/* Convert a List of Users, Into a List of Valid User IDs */
	this.getUserList = function(channel, args, startIndex, executor) {
		// Cut off entries at the start
		let players = args.slice(startIndex).map(el => getUser(channel, el));
		// Filter out non participants
		players = players.filter((el, index) => {
			if(el && (isParticipant(channel.guild.members.cache.get(el)) || isGameMaster(executor))) {
				return true; 
			}
			else { 
				channel.send("⛔ Syntax error. Invalid Player #" + (index + 1) + "!"); 
				return false; 
			}
		});
		// Remove duplicates
		players = removeDuplicates(players);
		// Return array or if empty false
		return players.length > 0 ? players : false;
	}

	/* Returns the id of the user who uses the given emoji, if none returns false */
	this.emojiToID = function(emoji) {
		var user = emojiIDs.find(el => el.emoji == emoji);
		return user ? user.id : false;
	}

	/* Returns the emoji of the user who has the given id, if none returns false */
	this.idToEmoji = function(id) {
		var user = emojiIDs.find(el => el.id === id);
		return user ? user.emoji : false;
	}
	
	/* Check if a member is a Game Master (or Bot) */
	this.isGameMaster = function(member) {
		return member.roles.cache.get(stats.gamemaster) || member.roles.cache.get(stats.bot) || member.roles.cache.get(stats.admin);
	}

	/* Check if a member is a (living) participant */
	this.isParticipant = function(member) {
		return member.roles.cache.get(stats.participant);
	}
	
	/* Check if a member is a dead participant */
	this.isDeadParticipant = function(member) {
		return member.roles.cache.get(stats.dead_participant);
	}
	
	/* Check if a member is a dead participant */
	this.isSpectator = function(member) {
		return member.roles.cache.get(stats.spectator);
	}

	/* Check if a member is signed up */
	this.isSignedUp = function(member) {
		return member.roles.cache.get(stats.signed_up);
	}

	/* Check if a member is a sub */
	this.isSub = function(member) {
		return member.roles.cache.get(stats.sub);
	}
	
	/* Cache emojis */
	this.getEmojis = function() {
		sql("SELECT id,emoji FROM players", result => {
				emojiIDs = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache player emojis!");
		});
	}
	
	/* Cache Public Votes */
	this.getVotes = function() {
		sql("SELECT id,public_value FROM players", result => {
				publicValues = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache public values!");
		});
		sql("SELECT id,private_value FROM players", result => {
				privateValues = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache private values!");
		});
		sql("SELECT id,public_votes FROM players", result => {
				publicVotes = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache public votes!");
		});
	}
	
	this.getCCs = function() {
		sql("SELECT id,ccs FROM players", result => {
				ccs = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache ccs!");
		});
	}
	
	
	this.getPRoles = function() {
		sql("SELECT id,role FROM players", result => {
				pRoles = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache roles!");
		});
	}
	
}

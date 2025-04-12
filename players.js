/*
	Module for handelling users
		- Validating a user
		- Handelling a list of users
		- Checking if a user has a specific role
		- Cacheing player emojis
		- Converting between emojis and user id
*/


module.exports = function() {
	/* Variables */
	this.emojiIDs = null;
	this.ccs = null;
	this.pRoles = null;
	
	/* Handle players command */
	this.cmdPlayers = function(message, args) {
		// Check subcommands
		if(!args[0] || (!args[1] && ["list","log","log2","log3","log4","msgs","messages","votes","roles","rl","list_alive"].indexOf(args[0]) == -1)) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `players [get|get_clean|set|resurrect|signup|list|msgs|msgs2|log|log2|votes|rl]`!"); 
			return; 
		}
		//Find subcommand
		switch(args[0]) {
			case "get": cmdPlayersGet(message.channel, args, false); break;
			case "get_clean": cmdPlayersGet(message.channel, args, true); break;
			case "set": cmdPlayersSet(message.channel, args); break;
			case "resurrect": cmdPlayersResurrect(message.channel, args); break;
			case "signup": cmdPlayersSignup(message.channel, args); break;
			case "signsub": 
			case "signup_sub": cmdPlayersSignupSubstitute(message.channel, args); break;
			case "sub": 
			case "substitute": cmdPlayersSubstitute(message, args); break;
			case "switch": cmdPlayersSwitch(message, args); break;
			case "list": cmdConfirm(message, "players list"); break;
			case "list_alive": cmdConfirm(message, "players list_alive"); break;
            case "rl":
			case "roles": cmdConfirm(message, "players roles"); break;
			case "log": cmdConfirm(message, "players log"); break;
			case "log2": cmdConfirm(message, "players log2"); break;
			case "log3": cmdConfirm(message, "players log3"); break;
			case "log4": cmdConfirm(message, "players log4"); break;
			case "votes": cmdConfirm(message, "players votes"); break;
			case "messages": 
			case "msgs": cmdPlayersListMsgs(message.channel); break;
			case "messages2": 
			case "msgs2": cmdPlayersListMsgs2(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	this.cmdRoll = function(message, args) {
		// Check subcommands
		if(!args[1] && (args[0] && args[0] == "bl" || args[0] == "wl")) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `roll [bl|wl] <players>` or `roll`!"); 
			return; 
		}
		//Find subcommand
		switch(args[0]) {
			case "bl": case "blacklist": cmdRollExe(message.channel, args, false); break;
			case "wl": case "whitelist": cmdRollExe(message.channel, args, true); break;
            case "num": case "number": case "n": case "d": cmdRollNum(message.channel, args); break;
            default:
                if(args[0] && args[0].match(/\d*d\d+/)) {
                    let args2 = args[0].split(/d/);
                    if(!(args2[0] >= 1)) args2[0] = 1;
                    if(!(args2[1] >= 1)) args2[1] = 1;
                    if(args2[0] > 10) args2[0] = 10;
                    cmdRollNum(message.channel, ["d", args2[1]], (args2[0]-1));
                } else {
                    cmdRollExe(message.channel, [], false); break;
                }
            break; 
		}
	}
	
	/* Handles Emoji Get command */
	this.cmdEmojis = function(channel) {
		channel.send("```\n" + emojiIDs.map(el =>  el.emoji + " " + el.id).join("\n") + "\n``` ```\n" + emojiIDs.map(el =>  el.emoji).join(" ") + "\n```");
	}
	
	/* Lists all signedup players */
	this.cmdPlayersList = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,ccs FROM players WHERE type='player'", result => {
			let playerListArray = result.map(el => {  
                let rName = toTitleCase(el.role.split(",")[0]);
                if(rName == "Merged") rName = el.role.split(",")[2];
                let rEmoji = getRoleEmoji(rName);
                rEmoji = (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> | ` : "❓ | ");
                return `${channel.guild.members.cache.get(el.id) ? (el.alive ? client.emojis.cache.get(stats.yes_emoji) : client.emojis.cache.get(stats.no_emoji)) : "⚠️"} | ${rEmoji}${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"} (${el.role.split(",").map(role => toTitleCase(role)).join(" + ")})`
            });
            const perMessageCount = 18;
			let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/perMessageCount)]) playerList[Math.floor(counter/perMessageCount)] = [];
				playerList[Math.floor(counter/perMessageCount)].push(playerListArray[i]);
				counter++;
			}
			channel.send("**Players** | Total: " + result.length);
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("✳️ Listing players " + (i+1)  + "/" + (playerList.length) + "...").then(m => {
					m.edit(playerList[i].join("\n"));
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
	/* Lists all votes */
	this.cmdPlayersVotes = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role FROM players WHERE type='player' AND alive=1", async result => {
			let playerListArray = [];
            for(let i = 0; i < result.length; i++) {
                let el = result[i];
                let rName = toTitleCase(el.role.split(",")[0]);
                if(rName == "Merged") rName = el.role.split(",")[2];
                let rEmoji = getRoleEmoji(rName);
                let publicVotingPower = await pollValue(el.id, "public");
                let privateVotingPower = await pollValue(el.id, "private");
                let publicText = `Public: ${publicVotingPower}`;
                let privateText = `Private: ${privateVotingPower}`;
                if(publicVotingPower != 1) publicText = `**${publicText}**`;
                if(privateVotingPower != 1) privateText = `**${privateText}**`;
                rEmoji = (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> | ` : "❓ | ");
                playerListArray.push(`${rEmoji}${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"} (${el.role.split(",").map(role => toTitleCase(role)).join(" + ")}) | ${publicText}, ${privateText}`);
            }
            const perMessageCount = 18;
			let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/perMessageCount)]) playerList[Math.floor(counter/perMessageCount)] = [];
				playerList[Math.floor(counter/perMessageCount)].push(playerListArray[i]);
				counter++;
			}
			channel.send("**Players** | Total: " + result.length);
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("✳️ Listing players " + (i+1)  + "/" + (playerList.length) + "...").then(m => {
					m.edit(playerList[i].join("\n"));
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
	this.cmdPlayersListAlive = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,ccs FROM players WHERE type='player' AND alive=1", result => {
			let playerListArray = result.map(el => {  
                let rolesFiltered = el.role.split(",").filter(role => verifyRole(role));
                let rName = rolesFiltered[0];
                let rEmoji = getRoleEmoji(rName);
                rEmoji = (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> | ` : "❓ | ");
                return `${rEmoji}${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"} (${rolesFiltered.map(role => toTitleCase(role)).join(" + ")})`
            });
            const perMessageCount = 18;
			let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/perMessageCount)]) playerList[Math.floor(counter/perMessageCount)] = [];
				playerList[Math.floor(counter/perMessageCount)].push(playerListArray[i]);
				counter++;
			}
			channel.send("**Alive Players** | Total: " + result.length);
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("✳️ Listing alive players " + (i+1)  + "/" + (playerList.length) + "...").then(m => {
					m.edit(playerList[i].join("\n"));
				}).catch(err => {
					logO(err); 
					sendError(channel, err, "Could not list alive players");
				});
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list alive players!");
		});
	
	}
    
	/* Returns a comman separated role list */
	this.cmdPlayersRoleList = function(channel) {
		// Get a list of players
		sql("SELECT role FROM players WHERE type='player'", result => {
			let roleList = result.map(el => el.role);
			channel.send("**Roles** | Total: " + result.length + "\n```" + roleList.join(",") + "```")
            .catch(err => {
					logO(err); 
					sendError(channel, err, "Could not print role list");
				});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not print role list!");
		});
	
	}
    
	/* Lists all signedup players in log format */
	this.cmdPlayersLog = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,ccs FROM players WHERE type='player'", result => {
			let playerListArray = result.map(el => {
                let player = channel.guild.members.cache.get(el.id);
                let nickname = player && player.nickname ? " (as `" + player.nickname + "`)" : "";
                return `• ${el.emoji} ${player ? player : "<@" + el.id + ">"}${nickname} is \`${el.role.split(",").map(role => toTitleCase(role)).join(" + ")}\``;
            });
            
            let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/20)]) playerList[Math.floor(counter/20)] = [];
				playerList[Math.floor(counter/20)].push(playerListArray[i]);
				counter++;
			}
            
            for(let i = 0; i < playerList.length; i++) {
				// Print message
                if(i == 0) {
                    channel.send("```**Players** | Total: " + result.length + "\n" + playerList[i].join("\n") + "\n```")
                    .catch(err => {
                        logO(err); 
                        sendError(channel, err, "Could not log players");
                    });
                } else {
                    channel.send("```" + playerList[i].join("\n") + "\n```")
                    .catch(err => {
                        logO(err); 
                        sendError(channel, err, "Could not log players");
                    });
                }
			}
                
                
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not log players!");
		});
	
	}
    
	/* Lists all signedup players in final results format */
	this.cmdPlayersLog3 = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,ccs FROM players WHERE type='player'", result => {
			let playerList1 = result.filter(el => el.alive == 1).map(el => {
                let player = channel.guild.members.cache.get(el.id);
                return `• ${player ? player : "<@" + el.id + ">"} (${el.role.split(",").map(role => toTitleCase(role)).join(", ")})`;
            });
            let playerList2 = result.filter(el => el.alive == 0).map(el => {
                let player = channel.guild.members.cache.get(el.id);
                return `• ${player ? player : "<@" + el.id + ">"} (${el.role.split(",").map(role => toTitleCase(role)).join(", ")})`;
            });
			channel.send("```**Final Results**\n<Team> Victory\n\n__Live Winners:__\n" + playerList1.join("\n") + "\n\n__Dead Losers:__\n" + playerList2.join("\n") + "```")
            .catch(err => {
					logO(err); 
					sendError(channel, err, "Could not log players");
				});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not log players!");
		});
	
	}
    
	/* Lists all signedup players in final results format */
	this.cmdPlayersLog4 = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,ccs FROM players WHERE type='player'", result => {
			let playerList1 = result.filter(el => el.alive == 1).map(el => {
                let player = channel.guild.members.cache.get(el.id);
                return `• ${getRoleEmoji(el.role.split(",")[0])} ${player ? player : "<@" + el.id + ">"} (${el.role.split(",").map(role => toTitleCase(role)).join(", ")})`;
            });
            let playerList2 = result.filter(el => el.alive == 0).map(el => {
                let player = channel.guild.members.cache.get(el.id);
                return `• ${getRoleEmoji(el.role.split(",")[0])} ${player ? player : "<@" + el.id + ">"} (${el.role.split(",").map(role => toTitleCase(role)).join(", ")})`;
            });
			channel.send("```**Final Results**\n<Team> Victory\n\n__Live Winners:__\n" + playerList1.join("\n") + "\n\n__Dead Losers:__\n" + playerList2.join("\n") + "```")
            .catch(err => {
					logO(err); 
					sendError(channel, err, "Could not log players");
				});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not log players!");
		});
	
	}
	
    
	/* Lists all signedup players in a different log format */
	this.cmdPlayersLog2 = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,ccs FROM players WHERE alive=1 AND type='player'", result => {
			let playerList = result.map(el => {
				let thisRoles = el.role.split(",").map(role => toTitleCase(role));
				let thisPlayer = channel.guild.members.cache.get(el.id);
				if(thisPlayer.roles.cache.get(stats.mayor) || thisPlayer.roles.cache.get(stats.mayor2)) thisRoles.push("Mayor");
				if(thisPlayer.roles.cache.get(stats.reporter)) thisRoles.push("Reporter");
				if(thisPlayer.roles.cache.get(stats.guardian)) thisRoles.push("Guardian");
				let thisPlayerList = [];
				thisPlayerList.push(thisPlayer.nickname ? (thisPlayer.nickname + " (" + thisPlayer.user.username + ")") : thisPlayer.user.username);
				thisPlayerList.push(`• <@${el.id}> (${thisRoles.join(", ")}) ? []`);
				thisRoles.forEach(role => thisPlayerList.push(`• ${role} (<@${el.id}>${thisRoles.length>1?', '+thisRoles.filter(r=>r!=role).join(', '):''}) ? @ ()`));
				return thisPlayerList;
			});
			// chunk list
			let playerListArray = playerList.flat();
			playerList = [];
			let counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/30)]) playerList[Math.floor(counter/30)] = [];
				playerList[Math.floor(counter/30)].push(playerListArray[i]);
				counter++;
			}
			// send list
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("```\n" + playerList[i].join("\n") + "```")
				.catch(err => {
					logO(err); 
					sendError(channel, err, "Could not list players for log");
				});
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list players for log!");
		});
	
	}
    
    
	/* Lists player message counts */
	this.cmdPlayersListMsgs = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,public_msgs,private_msgs FROM players WHERE type='player'", result => {
            let totalMsgs = 0;
            let totalMsgsPrivate = 0;
            let totalMsgsPublic = 0;
			let playerListArray = result.sort((a,b) => (b.public_msgs+b.private_msgs) - (a.public_msgs+a.private_msgs)).map(el => {
                totalMsgs += el.public_msgs+el.private_msgs;
                totalMsgsPrivate += el.private_msgs;
                totalMsgsPublic += el.public_msgs;
                return `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"}; Total: ${el.public_msgs+el.private_msgs}; Public: ${el.public_msgs}; Private: ${el.private_msgs}`;
            });
			let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/10)]) playerList[Math.floor(counter/10)] = [];
				playerList[Math.floor(counter/10)].push(playerListArray[i]);
				counter++;
			}
			channel.send("**Players** | Total: " + result.length + "\nTotal: " + totalMsgs + "; Public: " + totalMsgsPublic + "; Private: " + totalMsgsPrivate);
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("✳️ Listing players " + i  + "/" + (playerList.length) + "...").then(m => {
					m.edit(playerList[i].join("\n"));
				}).catch(err => {
					logO(err); 
					sendError(channel, err, "Could not list players");
				});
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list players!");
		});
	
	}
	/* Lists message counts for living players    */
	this.cmdPlayersListMsgs2 = function(channel, args) {
		// Get a list of players
		sql("SELECT id,emoji,public_msgs,private_msgs FROM players WHERE alive=1 AND type='player'", result => {
            let totalMsgs = 0;
            let totalMsgsPrivate = 0;
            let totalMsgsPublic = 0;
			let playerListArray = result.sort((a,b) => (b.public_msgs+b.private_msgs) - (a.public_msgs+a.private_msgs)).map(el => {
                totalMsgs += el.public_msgs+el.private_msgs;
                totalMsgsPrivate += el.private_msgs;
                totalMsgsPublic += el.public_msgs;
                let prWarn = false;
                let pubWarn = false;
                let phases = args[1];
                if((el.public_msgs+el.private_msgs) < (phases * 15)) prWarn = true;
                if(el.public_msgs < (Math.floor(phases/2) * 10)) pubWarn = true;
                return `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"}; Total: ${el.public_msgs+el.private_msgs}${prWarn?' ❗':''}; Public: ${el.public_msgs}${pubWarn?' ❗':''}; Private: ${el.private_msgs}`;
            });
			let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/10)]) playerList[Math.floor(counter/10)] = [];
				playerList[Math.floor(counter/10)].push(playerListArray[i]);
				counter++;
			}
			channel.send("**Alive Players** | Total: " + result.length + "\nTotal: " + totalMsgs + "; Public: " + totalMsgsPublic + "; Private: " + totalMsgsPrivate);
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("✳️ Listing players " + i  + "/" + (playerList.length) + "...").then(m => {
					m.edit(playerList[i].join("\n"));
				}).catch(err => {
					logO(err); 
					sendError(channel, err, "Could not list players");
				});
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list players!");
		});
	
	}
	
	/* Randomizes */
	this.cmdRollExe = function(channel, args, wl) {
		let blacklist = parseUserList(channel, args, 1) || [];
		console.log(blacklist);
		// Get a list of players
		sql("SELECT id FROM players WHERE alive=1 AND type='player'", result => {
			let playerList = result.map(el => getUser(channel, el.id)); 
			if(!wl) playerList = playerList.filter(el => blacklist.indexOf(el) === -1);
			else playerList = playerList.filter(el => blacklist.indexOf(el) != -1);
			let rID = playerList[Math.floor(Math.random() * playerList.length)];
			channel.send(`⏺️ Randomizing out of: ${playerList.map(el => idToEmoji(el)).join(", ")}`);
			channel.send(`✳️ Selecting...`).then(m => m.edit(`▶️ Selected <@${rID}> (${idToEmoji(rID)})`));
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not retrieve list of participants!");
		});
	
	}
	/* Randomizes */
	this.cmdRollNum = function(channel, args, repeat = 0) {
        if(!(args[1] >= 2)) {
            channel.send("⛔ Invalid argument.");
            return;
        };
		let val = Math.ceil(Math.random() * args[1]);
        channel.send(`⏺️ Randomizing from \`1\` to \`${args[1]}\``);
        channel.send(`✳️ Selecting...`).then(m => {
            m.edit(`▶️ Selected \`${val}\``);
            if(repeat > 0) cmdRollNum(channel, args, --repeat);
        });
	}
	
	this.cmdModrole = function(message, args) {
		let aid = getUser(message.channel, args[1]);
		if(!aid) return;
		let author = message.guild.members.cache.get(aid);
		if(!author) return;
		let role = message.guild.roles.cache.get(args[2]);
		if(!role) return;
		switch(args[0]) {
			 case "add": 
                addRoleRecursive(author, message.channel, role, role.name);
				message.channel.send("✅ Added `" + role.name + "` to <@" + author.id + "> (" + author.user.username + ")!");
			break;
			 case "remove": 
                removeRoleRecursive(author, message.channel, role, role.name);
				message.channel.send("✅ Remove `" + role.name + "` from <@" + author.id + "> (" + author.user.username + ")!");
			break;
		}
	}
	
	/* Lists all signedup players */
	this.cmdListSignedup = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji FROM players WHERE type='player'", result => {
			let playerList = result.map(el => `${el.emoji}  - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*"} (${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id) : "<@" + el.id + ">"})`).join("\n");
			// Print message
			channel.send("✳️ Listing signed up players").then(m => {
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
    
	/* Lists all signedup players */
    this.cmdListSignedupAlphabetical = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji FROM players WHERE type='player'", result => {
			let playerList = result.sort((a,b) => {
                let pa = channel.guild.members.cache.get(a.id);
                let pb = channel.guild.members.cache.get(b.id);
               return (pa ? pa.user.username.toLowerCase() : "-") > (pb ? pb.user.username.toLowerCase() : "-") ? 1 : -1;
            }).map(el => `${el.emoji} ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*"}`).join("\n");
			// Print message
			channel.send("✳ Listing signed up players").then(m => {
				m.edit("**Signed Up Players (Alphabetical)** | Total: " +  result.length + "\n" + playerList)
			}).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not list signed up players");
			});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list signed up players!");
		});
	}
    
	/* Lists all substitute players */
	this.cmdListSubs = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji FROM players WHERE type='substitute'", result => {
			let playerList = result.map(el => `${el.emoji}  - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*"} (${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id) : "<@" + el.id + ">"})`).join("\n");
			// Print message
			channel.send("✳️ Listing substitute players").then(m => {
				m.edit("**Substitute Players** | Total: " +  result.length + "\n" + playerList)
			}).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not list substitute players");
			});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list substitute players!");
		});
	}
    
	/* Lists all mentors */
	this.cmdListMentors = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,mentor FROM players WHERE mentor<>''", result => {
			let playerList = result.map(el => `${el.emoji}  - ${channel.guild.members.cache.get(el.mentor) ? channel.guild.members.cache.get(el.mentor).user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*"}  (${channel.guild.members.cache.get(el.mentor) ? channel.guild.members.cache.get(el.mentor) : "<@" + el.mentor + ">"}) for ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*"} (${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id) : "<@" + el.id + ">"})`).join("\n");
			// Print message
			channel.send("✳️ Listing mentors").then(m => {
				m.edit("**Mentors** | Total: " +  result.length + "\n" + playerList)
			}).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not list mentors");
			});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list mentors!");
		});
	}
	
	/* Lists all alive players */
	this.cmdListAlive = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list alive players in ingame phase."); 
			return; 
		}
		// Get a list of players
		sql("SELECT id,emoji FROM players WHERE alive = 1 AND type='player'", result => {
			let playerList = result.map(el => `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*"} (${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id) : "<@" + el.id + ">"})`).join("\n");
			// Print message
			channel.send("✳️ Listing alive players").then(m => {
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
    
	/* Lists all dead players */
	this.cmdListDead = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
			channel.send("⛔ Command error. Can only list dead players in ingame phase."); 
			return; 
		}
		// Get a list of players
		sql("SELECT id,emoji FROM players WHERE alive = 0 AND type='player'", result => {
			let playerList = result.map(el => `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).user.username.replace(/(_|\*|~)/g,"\\$1") : "*user left*"} (${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id) : "<@" + el.id + ">"})`).join("\n");
			// Print message
			channel.send("✳️ Listing dead players").then(m => {
				m.edit("**Dead Players** | Total: " +  result.length + "\n" + playerList)
			}).catch(err => {
				logO(err); 
				sendError(channel, err, "Could not list dead players");
			});
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list dead players!");
		});
	}
	
	/* Substitutes a player */
	this.cmdPlayersSubstitute = async function(message, args) {
		if(!args[2]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players substitute <current player id> <new player id>`!"); 
			return; 
		}
       
        let originalPlayer = getUser(message.channel, args[1]);
        let originalPlayerMember = message.channel.guild.members.cache.get(originalPlayer);
        let newPlayer = getUser(message.channel, args[2]);
        let newPlayerMember = message.channel.guild.members.cache.get(newPlayer);
        if(!originalPlayer || !originalPlayerMember || !newPlayer || !newPlayerMember) {
			message.channel.send("⛔ Player error. Could not find player!"); 
			return; 
        }
        
        
        message.channel.send(`✳️ Replacing <@${originalPlayer}> with <@${newPlayer}>! This may take a while. Please wait until execution is complete before executing further commands.`);
        
        // pause
        pauseActionQueueChecker = true;
        automationBusy = true;
        
        // get old player data
        let oldPlayerData = await sqlPromOneEsc("SELECT * FROM players WHERE id=", originalPlayer);
        
        // initialize common escaped values
        let oldId = connection.escape(originalPlayer);
        let oldIdSrc = connection.escape(`player:${originalPlayer}`);
        let oldIdSelector = connection.escape(`@id:${originalPlayer}[player]`);
        let newId = connection.escape(newPlayer);
        let newIdSrc = connection.escape(`player:${newPlayer}`);
        let newIdSelector = connection.escape(`@id:${newPlayer}[player]`);
        
        // update new player data
        await sqlPromEsc("UPDATE players SET type='player',role=" + connection.escape(oldPlayerData.role) +",orig_role=" + connection.escape(oldPlayerData.orig_role) +",alignment=" + connection.escape(oldPlayerData.alignment) +",alive=1,ccs=" + connection.escape(oldPlayerData.ccs) +",target=" + connection.escape(oldPlayerData.target) +",counter=" + connection.escape(oldPlayerData.counter) +" WHERE id=", newPlayer);
        
        // update old player data
        await sqlPromEsc("UPDATE players SET type='substituted',role='substituted' WHERE id=", originalPlayer);
        
        // update
        message.channel.send("✅ Updated basic player info!");
        
        // new player: add particpant role, remove sub role
        switchRoles(newPlayerMember, message.channel, stats.sub, stats.participant, "substitute", "participant");
        
        // old player: remove particpant role, add dead participant role
        switchRoles(originalPlayerMember, message.channel, stats.participant, stats.dead_participant, "participant", "dead participant");
        
        // delete connection to sub channel
        await sqlProm(`DELETE FROM connected_channels WHERE id=${newId}`);
        
        // update various additional tables
        await sqlProm(`UPDATE action_data SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE action_data SET last_target=${newIdSelector} WHERE last_target=${oldIdSelector}`);
        await sqlProm(`UPDATE action_queue SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE action_queue SET target=${newIdSelector} WHERE target=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET owner=${newId} WHERE owner=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val1=${newId} WHERE val1=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val2=${newId} WHERE val2=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val3=${newId} WHERE val3=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val4=${newId} WHERE val4=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val1=${newIdSrc} WHERE val1=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val2=${newIdSrc} WHERE val2=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val3=${newIdSrc} WHERE val3=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val4=${newIdSrc} WHERE val4=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val1=${newIdSelector} WHERE val1=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET val2=${newIdSelector} WHERE val2=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET val3=${newIdSelector} WHERE val3=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET val4=${newIdSelector} WHERE val4=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE active_groups SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE active_polls SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE polls SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE choices SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE choices SET owner=${newIdSrc} WHERE owner=${oldIdSrc}`);
        await sqlProm(`UPDATE connected_channels SET id=${newId} WHERE id=${oldId}`);
        await sqlProm(`UPDATE host_information SET id=${newId} WHERE id=${oldId}`);
        await sqlProm(`UPDATE host_information SET value=${newId} WHERE value=${oldId}`);
        await sqlProm(`UPDATE killq SET id=${newId} WHERE id=${oldId}`);
        await sqlProm(`UPDATE killq SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE players SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE prompts SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE teams SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE active_displays SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        
        // update
        message.channel.send("✅ Updated basic columns in all tables!");
        
        // replace within a string
        await sqlProm(`UPDATE prompts SET additional_trigger_data = replace(additional_trigger_data, ${newId}, ${oldId}) WHERE additional_trigger_data LIKE ${connection.escape('%' + originalPlayer + '%')}`);
        await sqlProm(`UPDATE action_queue SET additional_trigger_data = replace(additional_trigger_data, ${newId}, ${oldId}) WHERE additional_trigger_data LIKE ${connection.escape('%' + originalPlayer + '%')}`);
        await sqlProm(`UPDATE action_queue SET abilities = replace(abilities, ${newId}, ${oldId}) WHERE abilities LIKE ${connection.escape('%' + originalPlayer + '%')}`);
        
        // update
        message.channel.send("✅ Updated complex columns in all tables!");
        
        // cc substitutions
		setTimeout(function () {
			let categories = cachedCCs;
			categories.push(...cachedSCs)
			substituteChannels(message.channel, categories, 0, originalPlayer, newPlayer);
		}, 15000);
        
        
        // recache
		setTimeout(function() {
            getIDs();
			cacheRoleInfo();
			getCCs();
			getPRoles();
			getCCCats();
            cacheActiveCustomAttributes();
            cacheDR();
            getEmojis();
			message.channel.send("✅ Recached values!");
		}, 30000);
        
        // recache
		setTimeout(function() {
			message.channel.send("✅ Substitution complete!");
            
            // unpause
            pauseActionQueueChecker = false;
            automationBusy = false;
		}, 35000);
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
			categories.push(...cachedSCs)
			switchChannels(message.channel, categories, 0, getUser(message.channel, args[1]), getUser(message.channel, args[2]));
		}, 3000);
		setTimeout(function() { // reload data
			cacheRoleInfo();
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
		substituteOneChannel(channel, ccCats, index, channel.guild.channels.cache.get(ccCats[index]).children.cache.toJSON(), 0, subPlayerFrom, subPlayerTo);
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
			let channelMembers = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).map(el => el.id);
			let channelOwners = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
			if(channelMembers.includes(subPlayerFrom)) {
				cmdCCAdd(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["add", subPlayerTo], 1);
			}
			if(channelOwners.includes(subPlayerFrom)) {
				setTimeout(function() {
					cmdCCPromote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["promote", subPlayerTo], 1);
					substituteOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
				}, 1000);
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
		switchOneChannel(channel, ccCats, index, channel.guild.channels.cache.get(ccCats[index]).children.cache.toJSON(), 0, subPlayerFrom, subPlayerTo);
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
			let channelMembers = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).map(el => el.id);
			let channelOwners = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
			if(channelMembers.includes(subPlayerFrom) && !channelMembers.includes(subPlayerTo)) {
				cmdCCAdd(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["add", subPlayerTo], 1);
				cmdCCRemove(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["remove", subPlayerFrom], 1);
				channel.guild.channels.cache.get(channels[channelIndex].id).send("❗ " + channel.guild.members.cache.get(subPlayerFrom).displayName + " switched to " + channel.guild.members.cache.get(subPlayerTo).displayName + " ❗");
			}
			if(!channelMembers.includes(subPlayerFrom) && channelMembers.includes(subPlayerTo)) {
				cmdCCAdd(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["add", subPlayerFrom], 1);
				cmdCCRemove(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["remove", subPlayerTo], 1);
				channel.guild.channels.cache.get(channels[channelIndex].id).send("❗ " + channel.guild.members.cache.get(subPlayerTo).displayName + " switched to " + channel.guild.members.cache.get(subPlayerFrom).displayName + " ❗");
			}
			if(channelOwners.includes(subPlayerFrom) && !channelOwners.includes(subPlayerTo)) {
				setTimeout(function() {
					cmdCCPromote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["promote", subPlayerTo], 1);
					if(channelMembers.includes(subPlayerTo) && channelMembers.includes(subPlayerFrom)) cmdCCDemote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["demote", subPlayerFrom], 1);
					switchOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
				}, 1000);
			} else if(!channelOwners.includes(subPlayerFrom) && channelOwners.includes(subPlayerTo)) {
				setTimeout(function() {
					cmdCCPromote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["promote", subPlayerFrom], 1);
                    if(channelMembers.includes(subPlayerTo) && channelMembers.includes(subPlayerFrom)) cmdCCDemote(channel.guild.channels.cache.get(channels[channelIndex].id), {}, ["demote", subPlayerTo], 1);
					switchOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
				}, 1000);
			} else {
				switchOneChannel(channel, ccCats, index, channels, ++channelIndex, subPlayerFrom, subPlayerTo);
			}
		}
	}
	
	this.isPlayersArgs = function(arg) {
		let allowedArgs = ["id", "emoji", "type", "role", "orig_role", "alignment", "alive", "ccs", "public_msgs", "private_msgs", "target", "counter", "final_result", "mentor"];
		return allowedArgs.indexOf(arg) >= 0;
	}
	
	/* Get information about a player */
	this.cmdPlayersGet = function(channel, args, mode) {
		// Check arguments
		if(!args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players get <value name> <player>`!"); 
			return; 
		}
		// Get user
		var user = parseUser(channel, args[2]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!"); 
			return; 
		} else if(!isPlayersArgs(args[1])) { 
			// Invalid parameter
			channel.send("⛔ Syntax error. Invalid parameter `" + args[1] + "`!"); 
			return; 
		} else {
			// Get info
			sql("SELECT " + args[1] + " FROM players WHERE id = " + connection.escape(user), result => {
				let playerName = channel.guild.members.cache.get(user)?.displayName ?? "USER LEFT";
				channel.send("✅ `" + playerName + "`'s " + args[1] + " is `" + (args[1] === "role" ? (mode ? result[0][args[1]].split(",").filter(role => verifyRole(role)).join("` + `") : result[0][args[1]].split(",").join(", ")) : result[0][args[1]]) + "`!");
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
		var user = parseUser(channel, args[2]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!"); 
			return; 
		} else if(!isPlayersArgs(args[1])) { 
			// Invalid parameter
			channel.send("⛔ Syntax error. Invalid parameter `" + args[1] + "`!"); 
			return; 
		}
		sql("UPDATE players SET " + args[1] + " = " + connection.escape(args[3]) + " WHERE id = " + connection.escape(user), result => {
			let playerName = channel.guild.members.cache.get(user)?.displayName ?? "USER LEFT";
			channel.send("✅ `" + playerName + "`'s " + args[1] + " value now is `" + args[3] + "`!");
			updateGameStatus();
			getCCs();
			getPRoles();
		}, () => {
			channel.send("⛔ Database error. Could not update player information!");
		});
	}
	
	/* Resurrects a dead player */
	this.cmdPlayersResurrect = async function(channel, args) {
		// Get user
		var user = parseUser(channel, args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			// Send resurrect message
			let playerName = channel.guild.members.cache.get(user).displayName;
			channel.send("✳️ Resurrecting " + playerName + "!");
            // info
			channel.send("ℹ️ Please consider the following things after resurrecting:\n• If applicable, reassign the discord roles for elected roles manually\n• Manually undo actions that occur on player deaths (e.g. delete reporter message)");
            // Resurrect
            await resurrectPlayer(user, true);
            // reopen groups/teams
            await updateActiveTeams();
            await updateGroups();
			channel.send("✅ Resurrected " + playerName + "!");
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
    
	/* Substitutes somebody else */
	this.cmdPlayersSignupSubstitute = function(channel, args) {
		var user = getUser(channel, args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			cmdSignup(channel, channel.guild.members.cache.get(user), args.slice(2), false, "substitute");
		}
	}
	
	this.cmdSpectate = function(channel, member) {
		if(isParticipant(member) || isMentor(member) || isSub(member) || isGhost(member)) {
			channel.send("⛔ Command error. Can't make you a spectator while you're a participant."); 
			return;
		} else if(stats.gamephase < gp.SIGNUP) {
			channel.send("⛔ Command error. Can't make you a spectator while there is no game."); 
			return;
		}
		channel.send("✅ Attempting to make you a spectator, " + member.displayName + "!");
        addRoleRecursive(member, channel, stats.spectator, "spectator");
	}
	
	this.cmdSubstitute = async function(channel, member, args) {
		if(isParticipant(member)) {
			channel.send("⛔ Command error. Can't make you a substitute player while you're a participant."); 
			return;
		}
		cmdSignup(channel, member, args, false, "substitute");
        
        if(stats.gamephase == gp.INGAME) {
            await sleep(5000);
            let pData = await sqlPromOneEsc("SELECT id FROM players WHERE id=", member.id);
            let conData = await connectionGet(member.id);
            if(pData && !conData[0]) {
                createOneSC(channel, member.id, "substitute");
            }
        }
	}
	
	/* Signup a player */
	this.cmdSignup = function(channel, member, args, checkGamephase, signupMode = "signup") {
		// Wrong Phase 
		if(checkGamephase && stats.gamephase != gp.SIGNUP) { 
			channel.send(`⛔ Signup error. Sign ups are not open, <@${member.id}>! Sign up will open up again soon.`); 
			return; 
		} else if(!args[0] && !isSignedUp(member) && signupMode == "signup") { 
		// Failed sign out
			channel.send("⛔ Sign up error. Can't sign out without being signed up! Use `" + stats.prefix + "signup <emoji>` to sign up."); 
			return; 
		} else if(!args[0] && !isSub(member) && signupMode == "substitute") { 
		// Failed sign out
			channel.send("⛔ Sign up error. Can't stop substituting without being a substitute! Use `" + stats.prefix + "substitute <emoji>` to be a substitute player."); 
			return; 
		} else if(!args[0] && ((isSignedUp(member) && signupMode == "signup") || (isSub(member) && signupMode == "substitute"))) { 
			// Sign out player
			sql("DELETE FROM players WHERE id = " + connection.escape(member.id), result => {			
				if(signupMode == "signup") {
                    channel.send(`✅ Successfully signed out, ${member.user}. You will no longer participate in the next game!`); 
                    updateGameStatusDelayed();
                    removeRoleRecursive(member, channel, stats.signed_up, "signed up");
                } else if(signupMode == "substitute") {
                    channel.send(`✅ Successfully signed out, ${member.user}. You will no longer substitute for the next game!`); 
                    removeRoleRecursive(member, channel, stats.signedsub, "signed sub");
                }
			}, () => {
				// DB error
				channel.send("⛔ Database error. Could not sign you out!");
			});
            return;
		} else if(isSub(member) && signupMode == "signup") {
			channel.send("⛔ Sign up error. Can't sign up while being a substitute! Use `" + stats.prefix + "unsubstitute` to stop being a substitute player."); 
			return; 
        } else if(isSignedUp(member) && signupMode == "substitute") {
			channel.send("⛔ Sign up error. Can't substitute while being signed up! Use `" + stats.prefix + "signout` to sign out."); 
			return; 
        }
        
        // proceeed to do things
        let msg = "??", dbType = "player", msg2 = "??", signupRole = null, defRole = "none";
        if(signupMode == "signup") {
            msg = "Attempting to sign you up";
            dbType = "player";
            msg2 = "signed up with emoji";
            signupRole = stats.signed_up;
            defRole = "none";
        } else if(signupMode == "substitute") {
            msg = "Attempting to make you a substitute player";
            dbType = "substitute";
            msg2 = "is a substitute with emoji";
            signupRole = stats.gamephase <= gp.SIGNUP ? stats.signedsub : stats.sub;
            defRole = "substitute";
        }
        
        if(idEmojis.map(el => el[1].toLowerCase()).includes(args[0]) && checkGamephase) {
            let emojiIndex = idEmojis.map(el => el[1].toLowerCase()).indexOf(args[0]);
            let playerIndex = idEmojis.map(el => el[0]).indexOf(member.id);
            if(emojiIndex != playerIndex) {
                if(idEmojis[emojiIndex][0]) channel.send("⛔ This emoji is reserved by another player!").then(m => m.edit(`⛔ This emoji is reserved by <@${idEmojis[emojiIndex][0]}>!`));
                else channel.send("⛔ This emoji cannot be used!");
                return;
            }
        }
        
        if(!isSignedUp(member) && !isSub(member)) {
			// Sign Up
			channel.send("✳️ " + msg).then(message => {
                args[0] = args[0].replace(/<(?!\:)|(?<!\d)>/g,"");
				message.react(args[0]).then(r => {
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
							sql("INSERT INTO players (id, emoji, role, orig_role, alignment, type) VALUES (" + connection.escape(member.id) + "," + connection.escape("" + args[0]) + "," + connection.escape(defRole) + ",'unknown'," + connection.escape("") + "," +connection.escape(dbType) + ")", result => {
								message.edit(`✅ ${member.user} ${msg2} ${args[0]}!`);
								if(signupMode == "signup") updateGameStatusDelayed();
								message.reactions.removeAll().catch(err => { 
									// Couldn't clear reactions
									logO(err);
									sendError(channel, err, "Could not clear reactions!");
								});
                                addRoleRecursive(member, channel, signupRole, signupMode);
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
			channel.send("✳️ " + msg).then(message => {
                args[0] = args[0].replace(/<(?!\:)|(?<!\d)>/g,"");
				message.react(args[0]).then(r => {
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
        var guild;
        if(!channel) {
            guild = mainGuild;
        } else {
            guild = channel.guild;
        }
        inUser = inUser.toLowerCase();
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
		// Get User by Global Name
		user = client.users.cache.find(user => user.globalName && user.globalName.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Display Name
		user = client.users.cache.find(user => user.displayName && user.displayName.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Nickname
		user = guild.members.cache.find(member => member.nickname && member.nickname.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Display Name
		user = guild.members.cache.find(member => member.displayName && member.displayName.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Emoji 
		user = emojiToID(inUser)
		if(user) return user;
		return false;
	}

	/* Convert a List of Users, Into a List of Valid User IDs; Provide executor to allow GMs to specify non-participants */
	this.getUserList = function(channel, args, startIndex, executor = false, type = "participant") {
		// Cut off entries at the start
		let players = args.slice(startIndex).map(el => getUser(channel, el));
		// Filter out non participants
		players = players.filter((el, index) => {
			if(el && (
                (isParticipant(channel.guild.members.cache.get(el)) && type == "participant") || 
                (isGhost(channel.guild.members.cache.get(el)) && type == "ghost") || 
                (executor && isGameMaster(executor, true))
            )) {
				return true; 
			}
			else { 
				channel.send("⛔ Syntax error. Invalid Player: `" + args.slice(startIndex)[index] + "`!"); 
				return false; 
			}
		});
		// Remove duplicates
		players = removeDuplicates(players);
		// Return array or if empty false
		return players.length > 0 ? players : false;
	}
	
	this.fixUserList = function(list, channel) {
		let allPlayerNames = playerIDs.map(el => [mainGuild.members.cache.get(el)?.user.username,mainGuild.members.cache.get(el)?.user.globalName,mainGuild.members.cache.get(el)?.nickname]).flat().filter(el => el).map(el => el.toLowerCase());
        //console.log(allPlayerNames);
		let parsed = parseList(list.map(el => el.toLowerCase()), allPlayerNames);
		return [...parsed.invalid, ...parsed.found];
	}
	
	/* Convert a List of (badly written) Users, Into a List of Valid User IDs; Provide executor to allow GMs to specify non-participants */
	/* Equivalent to getUserList, but auto adds quotes, fixes typos and such */
	this.parseUserList = function(channel, args, startIndex, executor = false, type = "participant") {
		let players = args.slice(startIndex);
		players = fixUserList(players, channel);
		return getUserList(channel, players, 0, executor, type);
	}
	
	/* parseUserList for a single user */
	this.parseUser = function(channel, inUser) {
		let user = getUser(channel, inUser);
		if(!user) {
			user = parseUserList(channel, [inUser], 0);
			if(user && user.length == 1) return user[0];
			else return false;
		}
		return user;
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
	this.isGameMaster = function(member, noAdminIngame = false) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.gamemaster) || member.roles.cache.get(stats.bot) || member.roles.cache.get(stats.admin) || (!noAdminIngame && member.roles.cache.get(stats.admin_ingame)));
	}
    
	/* Check if a member is a Game Master (or Bot) */
	this.isHelper = function(member) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.helper) || member.roles.cache.get(stats.bot) || member.roles.cache.get(stats.admin));
	}
    
	/* Check if a member is an Admin (or Bot) */
	this.isAdmin = function(member, noAdminIngame = false) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.admin) || (!noAdminIngame && member.roles.cache.get(stats.admin_ingame)));
	}
    
	/* Check if a member is a Senior GM */
	this.isSenior = function(member) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.senior_gamemaster));
	}
    
	/* Check if a member is a Host */
	this.isHost = function(member) {
        if(!member) return false;
		return member && member.roles && (member.roles.cache.get(stats.host));
	}

	/* Check if a member is a (living) participant */
	this.isParticipant = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.participant);
	}
    
	/* Check if a member is a ghost */
	this.isGhost = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.ghost);
	}
	
	/* Check if a member is a dead participant */
	this.isDeadParticipant = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.dead_participant);
	}
	
	/* Check if a member is a dead participant */
	this.isSpectator = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.spectator);
	}

	/* Check if a member is signed up */
	this.isSignedUp = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.signed_up);
	}

	/* Check if a member is a sub */
	this.isSub = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.sub) || member.roles.cache.get(stats.signedsub);
	}
    
	/* Check if a member is a mentor */
	this.isMentor = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.mentor);
	}
    
    /* Check if member is game involved */
    this.isGameInvolved = function(member) {
        return isParticipant(member) || isSignedUp(member) || isSub(member) || isDeadParticipant(member) || isGhost(member) || isMentor(member);
    }
	
	/* Cache emojis */
	this.getEmojis = function() {
		sql("SELECT id,emoji FROM players", result => {
				emojiIDs = result;
		}, () => {
			log("Players > ❗❗❗ Unable to cache player emojis!");
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
	
	
	this.getIDs = function() {
		sql("SELECT id FROM players", result => {
				playerIDs = result.map(el => el.id);
		}, () => {
			log("Players > ❗❗❗ Unable to cache player ids!");
		});
	}
	
	this.parseList = function(inputList, allPlayers) {
	    let playerList = [];
	    // filter out ids, emojis, unicode
	    inputList = inputList.filter(el => {
            let directMatch = el.match(/^(\d+|<:.+:\d+>|[^\w]{1,2})$/);
            if(directMatch) playerList.push(el);
            return !directMatch;
	    });

	    // handle direct names
	    inputList = inputList.filter(el => {
            // extract quoted name, if necessary
            let quoted = el.match(/^(".+")$/), nameExtracted = el;
            if(quoted) nameExtracted = el.substr(1, el.length - 2);
            // search for a direct match
            let apIndex = allPlayers.indexOf(p => p === nameExtracted);
            if(apIndex >= 0) { // direct match found
                playerList.push(el);
                return false;
            } else { // search for closest name
                let bestMatch = findBestMatch(el, allPlayers);
                console.log(bestMatch);
                // close match found?
                if(bestMatch.value <= ~~(nameExtracted.length/2)) { 
                    playerList.push(bestMatch.name);
                    return false;
                }   
            }
            return quoted ? false : true; // no (close) match found
	    });

	    // try combining names in different ways
	    for(let maxLength = 2; maxLength <= inputList.length; maxLength++) {
            for(let i = 0; i < inputList.length; i++) {
                let combinedName = inputList[i];
                for(let j = i+1; j < inputList.length; j++) {
                    if(j-i >= maxLength) { // limit length
                        j = inputList.length
                        continue; 
                    }
                    combinedName += " " + inputList[j];
                    let bestMatch = findBestMatch(combinedName, allPlayers);
                    //console.log(combinedName, "=>", bestMatch.name, bestMatch.value, i, j);
                    // close match found?
                    if(bestMatch.value <= ~~(combinedName.length/2)) {
                        // remove all used elements
                        for(let k = i; k <= j; k++) inputList[k] = "-".repeat(50); 
                        playerList.push(bestMatch.name);
                        //console.log(combinedName, "=>", bestMatch.name, bestMatch.value, i, j, inputList.map(el=>el));
                        j = inputList.length;
                    }
                }
            }
	    }
	    // filter out "deleted" names
	    inputList = inputList.filter(el => el != "-".repeat(50));
	    // remove duplicates
	    inputList = [...new Set(inputList)];
	    playerList = [...new Set(playerList)];
	    // output
	    return {found: playerList, invalid: inputList};
	}
	
}

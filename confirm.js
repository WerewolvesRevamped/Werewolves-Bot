/*
	Module for confirmation of dangerous commands
		- Confirms actions
*/
module.exports = function() {
	
	/* Executes actions that require confirmation */
	this.confirmAction = async function(data, message) {
		// Check if the reaction was in time
		if(+data.time + 20 >= getTime()) {
			message.edit("✳️ Executing `" + stats.prefix + data.action + "`!").then(async m => {
				await sleep(1000);
				message.delete();
			});
			// Runs the command
			confirmActionExecute(data.action, message, true);
		} else {
			// Too late
			message.edit("❌ Too late. Not executing `" + stats.prefix + data.action + "`!");
		}
		// Clear reactions
		message.reactions.removeAll().catch(err => {
			logO(err); 
			sendError(messsage.channel, err, "Could not clear reactions");
		});
	}
	
    // WIP: CHECK which of these still exist
	this.confirmActionExecute = function(command, message, messageSent) {
		switch(command) {
			case "connection reset": cmdConnectionReset(message.channel); break;
			case "roles clear": cmdRolesClear(message.channel); break;
			case "alias clear": cmdAliasClear(message.channel); break;
			case "start": cmdStart(message.channel, false); break;
			case "reset": cmdReset(message.channel); break;
			case "end": cmdEnd(message.channel); break;
			case "tie": cmdTie(message.channel); break;
			case "killq killall": cmdKillqKillall(message.channel); break;
			case "pl":
			case "players list": cmdPlayersList(message.channel); break;
			case "players list_alive": cmdPlayersListAlive(message.channel); break;
			case "players log": cmdPlayersLog(message.channel); break;
			case "players log2": cmdPlayersLog2(message.channel); break;
			case "players log3": cmdPlayersLog3(message.channel); break;
			case "players log4": cmdPlayersLog4(message.channel); break;
			case "players votes": cmdPlayersVotes(message.channel); break;
			case "players roles": cmdPlayersRoleList(message.channel); break;
			case "cc cleanup": cmdCCCleanup(message.channel); break;
			case "bulkdelete": cmdBulkDelete(message.channel); break;
			case "pn":
			case "phase next": cmdPhaseNext(message.channel); break;
			case "ps":
			case "phase switch": cmdPhaseSwitch(message.channel); break;
			default:	messageSent ? 
							message.edit("⛔ Syntax error. Tried to confirm unknown command!") : 
							message.channel.send("⛔ Syntax error. Tried to confirm unknown command!"); 
							break;
		}
	}
    
    this.getWarning = function(action) {
        switch(action) {
            case "connection reset":
			case "roles clear":
			case "alias clear": 
			case "cc cleanup":
                return " **WARNING:** This is an irreversible destructive action that deletes a large amount of data. Are you __absolutely certain__ you want to perform this action?";
			case "reset":
                return " **WARNING:** This is an irreversible destructive action that deletes a large amount of data. You are deleting **__"  + stats.game + "__**. Please verify the game has been archived! Are you __absolutely certain__ you want to perform this action?";
			case "end":
                return " **WARNING:** This will end the game, granting Dead Participant to all still living participants. Are you __certain__ you want to perform this action?";
			case "tie":
                return " **WARNING:** This will end the game in a tie, granting Dead Participant to all still living participants. Are you __certain__ you want to perform this action? All living players will be marked as winners.";
            default:
                return "";
        }
    }

	/* Sends a confirmation message */
	this.cmdConfirm = async function(message, action) {
        let cmdSplit = message.content.split(" ");
        cmdSplit[0] = parseAlias(cmdSplit[0]);
        let cmd = cmdSplit.join(" ");
		message.channel.send("❗ Click the reaction in the next `20.0` seconds to confirm `" + cmd + "`!" + getWarning(action))
		.then(m => {
            m.fetch();
			m.react("✅").then(r => {
				sql("DELETE FROM confirm_msg WHERE time < " + (getTime() - 900), result => {
					sql("INSERT INTO confirm_msg (id, time, action) VALUES (" + connection.escape(m.id) + "," + connection.escape(getTime()) + "," + connection.escape(action) + ")", result => {
					}, () => {
						// Database error
						m.edit("⛔ Database error. Failed to create confirmation message!");
					});				
				}, () => {
					// Database error
					m.edit("⛔ Database error. Failed to prepare confirmation message!");
				});
			})
			.catch(err => { 
				// Couldn't react
				logO(err); 
				sendError(messsage.channel, err, "Could not create react to message");
			});
		})
		.catch(err => { 
			// Webhook couldn't be created
			logO(err); 
			sendError(messsage.channel, err, "Could not send message");
		});
	}
	
}

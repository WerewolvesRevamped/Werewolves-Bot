/*
	Module for handelling users
		- Validating a user
		- Handelling a list of users
		- Checking if a user has a specific role
		- Cacheing player emojis
		- Converting between emojis and user id
*/


module.exports = function() {
	
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
        } else if(isMentor(member) && signupMode == "signup") {
			channel.send("⛔ Sign up error. Can't sign up while being a mentor! Use `" + stats.prefix + "unsubstitute` to stop being a substitute player."); 
			return; 
        } else if(isMentor(member) && signupMode == "substitute") {
			channel.send("⛔ Sign up error. Can't substitute while being a mentor! Use `" + stats.prefix + "signout` to sign out."); 
			return; 
        }
        
        if(isSpectator(member)) {
            removeRoleRecursive(member, channel, stats.spectator, "spectator");
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
	
}

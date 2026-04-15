/**
    Functions related to the various types of signing up
**/

module.exports = function() {
    
	/**
    Command: $signup
    Primary signup function. Also used by the substitute signup system.
    **/
	this.cmdSignup = async function(channel, member, args, checkGamephase, signupMode = "signup") {
		// Wrong Phase 
		if(checkGamephase && stats.gamephase != gp.SIGNUP) { 
			channel.send(`⛔ Signup error. Sign ups are not open, <@${member.id}>! Sign up will open up again soon.`); 
			return; 
		}
		// Failed sign out
        if(!args[0] && !isSignedUp(member) && signupMode == "signup") { 
			channel.send("⛔ Sign up error. Can't sign out without being signed up! Use `" + stats.prefix + "signup <emoji>` to sign up."); 
			return; 
		}
		// Failed sign out
        if(!args[0] && !isSub(member) && signupMode == "substitute") { 
			channel.send("⛔ Sign up error. Can't stop substituting without being a substitute! Use `" + stats.prefix + "substitute <emoji>` to be a substitute player."); 
			return; 
		}
        // Sign out player
        if(!args[0] && ((isSignedUp(member) && signupMode == "signup") || (isSub(member) && signupMode == "substitute"))) { 
            await sqlPromEsc("DELETE FROM players WHERE id = ", member.id);
            if(signupMode == "signup") {
                channel.send(`✅ Successfully signed out, ${member.user}. You will no longer participate in the next game!`); 
                updateGameStatusDelayed();
                removeRoleRecursive(member, channel, stats.signed_up, "signed up");
            } else if(signupMode == "substitute") {
                channel.send(`✅ Successfully signed out, ${member.user}. You will no longer substitute for the next game!`); 
                removeRoleRecursive(member, channel, stats.signedsub, "signed sub");
            }
            return;
		}
        // Signup while sub
        if(isSub(member) && signupMode == "signup") {
			channel.send("⛔ Sign up error. Can't sign up while being a substitute! Use `" + stats.prefix + "unsubstitute` to stop being a substitute player."); 
			return; 
        }
        // Subup while signed
        if(isSignedUp(member) && signupMode == "substitute") {
			channel.send("⛔ Sign up error. Can't substitute while being signed up! Use `" + stats.prefix + "signout` to sign out."); 
			return; 
        }
        // Signup while mentor
        if(isMentor(member) && signupMode == "signup") {
			channel.send("⛔ Sign up error. Can't sign up while being a mentor! Use `" + stats.prefix + "unsubstitute` to stop being a substitute player."); 
			return; 
        }
        // Subup while mentor
        if(isMentor(member) && signupMode == "substitute") {
			channel.send("⛔ Sign up error. Can't substitute while being a mentor! Use `" + stats.prefix + "signout` to sign out."); 
			return; 
        }
        
        // UN-spec on signup
        if(isSpectator(member)) {
            removeRoleRecursive(member, channel, stats.spectator, "spectator");
        }
        
        // Choose between signup and subup
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
        
        // Check if emoji is reserved
        if(idEmojis.map(el => el[1].toLowerCase()).includes(args[0]) && checkGamephase) {
            let emojiIndex = idEmojis.map(el => el[1].toLowerCase()).indexOf(args[0]);
            let playerIndex = idEmojis.map(el => el[0]).indexOf(member.id);
            if(emojiIndex != playerIndex) {
                if(idEmojis[emojiIndex][0]) channel.send("⛔ This emoji is reserved by another player!").then(m => m.edit(`⛔ This emoji is reserved by <@${idEmojis[emojiIndex][0]}>!`));
                else channel.send("⛔ This emoji cannot be used!");
                return;
            }
        }
        
        // send message
        let message = await channel.send("✳️ " + msg);
        
        // check emoji
        args[0] = args[0].replace(/<(?!\:)|(?<!\d)>/g,"");
        try {
            await message.react(args[0]);
        } catch (err) {
            message.edit("⛔ Invalid emoji. Couldn't use emoji. Could not sign you up!");
            logO(err); 
            return;
        }
            
        // check if emoji is already used
        let result = await sqlPromEsc("SELECT id FROM players WHERE emoji = ", args[0]);
        if(result.length > 0) {
            channel.send("⛔ Database error. Emoji " + args[0] + " is already being used!");
            message.reactions.removeAll();
            return;
        }
        
        if(!isSignedUp(member) && !isSub(member)) {
            // create player in table
            await sqlProm("INSERT INTO players (id, emoji, role, orig_role, alignment, type) VALUES (" + connection.escape(member.id) + "," + connection.escape("" + args[0]) + "," + connection.escape(defRole) + ",'unknown'," + connection.escape("") + "," +connection.escape(dbType) + ")");
            
            // assign role
            addRoleRecursive(member, channel, signupRole, signupMode);
            
            // edit message to success
            message.edit(`✅ ${member.user} ${msg2} ${args[0]}!`);
            
            // update VC
            if(signupMode == "signup") updateGameStatusDelayed();
            
            // clear reactions
            message.reactions.removeAll();
		} else {
            // update emoji
            await sqlProm("UPDATE players SET emoji = " + connection.escape("" + args[0]) + " WHERE id = " + connection.escape(member.id));
            
            // edit message to success
            message.edit(`✅ ${member.user} changed emoji to ${args[0]}!`);
            
            // clear reactions
            message.reactions.removeAll();
		}
	}
    
    /**
    Command: $mentor
    Signs up as a mentor
    **/
    this.cmdMentor = function(channel, member) {
        if(stats.gamephase != gp.SIGNUP && stats.gamephase != gp.SETUP) { 
			channel.send(`⛔ Signup error. Sign ups are not open, <@${member.id}>! Sign up will open up again soon.`); 
			return; 
		} else if(isSignedupMentor(member)) { 
			channel.send("⛔ Sign up error. You are already signed up as a mentor."); 
			return; 
        } else if(!isMentorProgram(member)) { 
			channel.send("⛔ Sign up error. You are not part of the mentor program."); 
			return; 
        }
        
        // add role
        addRoleRecursive(member, channel, stats.signedmentor, "signed mentor");
        channel.send(`✅ Successfully signed up as mentor, ${member.user}.`); 
    }
    
    /**
    Command: $unmentor
    Unsigns as mentor
    **/
    this.cmdUnmentor = function(channel, member) {
        if(stats.gamephase != gp.SIGNUP && stats.gamephase != gp.SETUP) { 
			channel.send(`⛔ Signup error. Sign ups are not open, <@${member.id}>! Sign up will open up again soon.`); 
			return; 
		} else if(!isSignedupMentor(member)) { 
			channel.send("⛔ Sign up error. You can not sign out as a mentor while not signed up as a mentor."); 
			return; 
        }
        
        // remove role
        removeRoleRecursive(member, channel, stats.signedmentor, "signed mentor");
        channel.send(`✅ Successfully signed out as mentor, ${member.user}. You will no longer mentor for the next game!`); 
    }
    
    /**
    Command: $spectate
    Makes a player a spectator
    **/
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
	
    /**
    Command: $substitute
    Signs up as a substitute player
    **/
	this.cmdSubstitute = async function(channel, member, args) {
		if(isParticipant(member) || isMentor(member) || isSubIngame(member) || isGhost(member)) {
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
    
	/**
    Command: $players signup
    Signup somebody else  / Player signout
    GM execution of $signup
    */
	this.cmdPlayersSignup = function(channel, args) {
		var user = getUser(args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			cmdSignup(channel, channel.guild.members.cache.get(user), args.slice(2), false);
		}
	}
    
	/**
    Command: $players signup_sub
    Signup somebody else as substitute / Substitute signout
    GM execution of $substitute
    */
	this.cmdPlayersSignupSubstitute = function(channel, args) {
		var user = getUser(args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			cmdSignup(channel, channel.guild.members.cache.get(user), args.slice(2), false, "substitute");
		}
	}
	
	/**
    Command: $players signup_mentor
    Signup somebody else as mentor
    GM execution of $mentor
    */
	this.cmdPlayersSignupMentor = function(channel, args) {
		var user = getUser(args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			cmdMentor(channel, channel.guild.members.cache.get(user));
		}
	}
    
	/**
    Command: $players signup_unmentor
    Signsout somebody else as mentor
    GM execution of $unmentor
    */
	this.cmdPlayersSignupUnmentor = function(channel, args) {
		var user = getUser(args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} else {
			cmdUnmentor(channel, channel.guild.members.cache.get(user));
		}
	}
    
}
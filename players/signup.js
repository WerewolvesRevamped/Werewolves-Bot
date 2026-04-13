/**
    Functions related to the various types of signing up
**/

module.exports = function() {
    
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
		if(isParticipant(member) || isMentor(member) || isSub(member) || isGhost(member)) {
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
/*
	Module for parsing players and player lists
*/


module.exports = function() {
    
	/**
    PUBLIC
    Get User
    Get User from Argument
    this allows various types of input and tries to resolve to a user, the following formats are supported:
    - Discord ID
    - Discord Tag (with nickname)
    - Discord Tag
    - Username
    - Global Name
    - User Display Name
    - Nickname
    - Guild Display Name
    - Emoji
    **/
	this.getUser = function(inUser) {
		var user;
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
		user = mainGuild.members.cache.find(member => member.nickname && member.nickname.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Display Name
		user = mainGuild.members.cache.find(member => member.displayName && member.displayName.toLowerCase() === inUser);
		if(user) return user.id;
		// Get User by Emoji 
		user = emojiToID(inUser)
		if(user) return user;
		return false;
	}
    
    /**
    PUBLIC
    Parse List
    parses a list of arguments into players
    this applies "auto-correct" by searching for close names and
    trying different combinations of arguments
    **/
	this.parseList = function(inputList, allPlayers, isPlayer = true, inverted = false) {
	    let playerList = [];
	    // filter out ids, emojis, unicode
	    inputList = inputList.filter(el => {
            let directMatch = el.match(/^(\d+|<:.+:\d+>|[^\w]{1,2})$/);
            if(directMatch && isPlayer) {
                let p = emojiToID(el);
                if(p) {
                    playerList.push({ val: 0, name: p });
                    return true;
                } else {
                    return false;
                }
            }
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
                playerList.push({ val: 0, name: nameExtracted });
                return false;
            } else { // search for closest name
                let bestMatch = findBestMatch(el, allPlayers);
                console.log(bestMatch);
                // close match found?
                if(bestMatch.value <= ~~(nameExtracted.length/2)) { 
                    playerList.push({ val: bestMatch.value, name: bestMatch.name });
                    return true;
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
                    if(inverted) combinedName = inputList[j] + " " + combinedName;
                    else combinedName += " " + inputList[j];
                    let bestMatch = findBestMatch(combinedName, allPlayers);
                    //console.log(combinedName, "=>", bestMatch.name, bestMatch.value, i, j);
                    // close match found?
                    if(bestMatch.value <= ~~(combinedName.length/2)) {
                        // remove all used elements
                        for(let k = i; k <= j; k++) inputList[k] = "-".repeat(50); 
                        playerList.push({ val: bestMatch.value, name: bestMatch.name });
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
	    playerList = [...new Set(playerList.sort((a,b) => a.val - b.val).map(el => el.name))];
	    // output
	    return {found: playerList, invalid: inputList};
	}
	
    /**
    PRIVATE
    Fix User List
    Wrapper for parseList that supplies the names it should look for
    **/
	function fixUserList(list) {
		let allPlayerNames = playerIDs.map(el => mainGuild.members.cache.get(el)).filter(el => el).map(el => [
            el.user.username,
            el.user.displayName,
            el.user.globalName,
            el.displayName,
           el.nickname
        ]).flat().filter(el => el).map(el => el.toLowerCase());
        //console.log(allPlayerNames);
		let parsed = parseList(list.map(el => el.toLowerCase()), allPlayerNames);
		return [...parsed.invalid, ...parsed.found];
	}

	/**
    PRIVATE
    Get User List
    Convert a List of Users, Into a List of Valid User IDs; Provide executor to allow GMs to specify non-participants
    **/
    function getUserList(args, startIndex, feedbackChannel = null, executor = false, type = "participant") {
		// Cut off entries at the start
		let players = args.slice(startIndex).map(el => getUser(el));
		// Filter out non participants
		players = players.filter((el, index) => {
			if(el && (
                (isParticipant(mainGuild.members.cache.get(el)) && type == "participant") || 
                (isGhost(mainGuild.members.cache.get(el)) && type == "ghost") || 
                (executor && isGameMaster(executor, true))
            )) {
				return true; 
			}
			else { 
				if(feedbackChannel) feedbackChannel.send("⛔ Syntax error. Invalid Player: `" + args.slice(startIndex)[index] + "`!"); 
				return false; 
			}
		});
		// Remove duplicates
		players = removeDuplicates(players);
		// Return array or if empty false
		return players.length > 0 ? players : false;
	}
	
	/**
    PUBLIC
    Parse User List [Primary User List Parser]
    Convert a List of (badly written) Users, Into a List of Valid User IDs; Provide executor to allow GMs to specify non-participants 
	Equivalent to getUserList, but auto adds quotes, fixes typos and such **/
	this.parseUserList = function(args, startIndex, feedbackChannel = null, executor = false, type = "participant") {
		let players = args.slice(startIndex);
		players = fixUserList(players);
		return getUserList(players, 0, feedbackChannel, executor, type);
	}
	
	/**
    PUBLIC
    Parse User
    parseUserList for a single user
    **/
	this.parseUser = function(inUser, feedbackChannel = null) {
		let user = getUser(inUser);
		if(!user) {
			user = parseUserList([inUser], 0, feedbackChannel);
			if(user && user.length == 1) return user[0];
			else return false;
		}
		return user;
	}

	/**
    PUBLIC
    Emoji to Player ID
    Returns the id of the user who uses the given emoji, if none returns false
    */
	this.emojiToID = function(emoji) {
        // find emoji
		var user = emojiIDs.find(el => el.emoji == emoji);
        if(!user) {
            // there are some emojis that weirdly have a different unicode version internally than the one you get when copying it(?)
            // normalize to Compatibility Decomposition; Remove variant selector U+FE0F
            emoji = emoji.normalize("NFKD").replace(/[\uFE0F]/g, '');
            user = emojiIDs.find(el => el.emoji == emoji);
        }
		return user ? user.id : false;
	}

	/**
    PUBLIC
    Player ID to Emoji
    Returns the emoji of the user who has the given id, if none returns false
    **/
	this.idToEmoji = function(id) {
		var user = emojiIDs.find(el => el.id === id);
		return user ? user.emoji : false;
	}
}
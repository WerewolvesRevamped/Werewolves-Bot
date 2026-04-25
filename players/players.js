/*
	Module for player related things
*/
require("./packs.js")();
require("./loot.js")();
require("./loot_commands.js")();
require("./coins.js")();
require("./icons.js")();
require("./xp.js")();
require("./values.js")();
require("./death_messages.js")();
require("./boosters.js")();
require("./inventory.js")();
require("./guarantors.js")();
require("./mentors.js")();
require("./bot.js")();
require("./permissions.js")();
require("./parsing.js")();
require("./curses.js")();
require("./reservations.js")();
require("./trophy.js")();
require("./lists.js")();
require("./caching.js")();
require("./signup.js")();
require("./substitute.js")();
require("./roll.js")();


module.exports = function() {
    	
	/**
    Command: $players
    Commands to manage players
    **/
	this.cmdPlayers = function(message, args) {
		// Check subcommands
		if(!args[0] || (!args[1] && ["list","log","log2","log3","log4", "log5", "log6", "msgs","messages","votes","roles","rl","list_alive","mentor","signup_mentor","signup_unmentor"].indexOf(args[0]) == -1)) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `players [get|set|resurrect|signup|list|list_alive|msgs|msgs2|log|log2|log3|log4|log5|log6|votes|rl|mentor|signup_mentor|signup_unmentor]`!"); 
			return; 
		}
		//Find subcommand
		switch(args[0]) {
			case "get": cmdPlayersGet(message.channel, args, false); break;
			case "set": cmdPlayersSet(message.channel, args); break;
			case "resurrect": cmdPlayersResurrect(message.channel, args); break;
			case "signup": cmdPlayersSignup(message.channel, args); break;
			case "signsub": 
			case "signup_sub": cmdPlayersSignupSubstitute(message.channel, args); break;
			case "signup_mentor": cmdPlayersSignupMentor(message.channel, args); break;
			case "signup_unmentor": cmdPlayersSignupUnmentor(message.channel, args); break;
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
			case "mentor": cmdPlayersMentor(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
	/**
    Command: $players get
    Retrieves a player attribute
    **/
	this.cmdPlayersGet = async function(channel, args) {
		// Check arguments
		if(!args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players get <value name> <player>`!"); 
			return; 
		}
		// Get user
		var user = parseUser(args[2], channel);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!"); 
			return; 
		}
        if(!isPlayersArgs(args[1])) { 
			// Invalid parameter
			channel.send("⛔ Syntax error. Invalid parameter `" + args[1] + "`!"); 
			return; 
		}
        
        // Get info
        let result = await sqlPromEsc("SELECT " + args[1] + " FROM players WHERE id = ", user);
        let playerName = channel.guild.members.cache.get(user)?.displayName ?? "USER LEFT";
        channel.send("✅ `" + playerName + "`'s " + args[1] + " is `" + result[0][args[1]] + "`!");
	}
    
    /**
    Command: $players set
    Sets a player attribute
    **/
	this.cmdPlayersSet = async function(channel, args) {
		// Check arguments
		if(!args[2] || !args[3]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players set <value name> <player> <value>`!"); 
			return; 
		}
		// Get user
		var user = parseUser(args[2], channel);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!"); 
			return; 
		}
        if(!isPlayersArgs(args[1])) { 
			// Invalid parameter
			channel.send("⛔ Syntax error. Invalid parameter `" + args[1] + "`!"); 
			return; 
		}
        
        // Update value
		await sqlPromEsc("UPDATE players SET " + args[1] + " = " + connection.escape(args[3]) + " WHERE id = ", user);
        let playerName = channel.guild.members.cache.get(user)?.displayName ?? "USER LEFT";
        channel.send("✅ `" + playerName + "`'s " + args[1] + " value now is `" + args[3] + "`!");
        updateGameStatus();
        getCCs();
        getPRoles();
	}
    
	/**
    Command: $players resurrect
    Resurrects a player
    **/
	this.cmdPlayersResurrect = async function(channel, args) {
		// Get user
		var user = parseUser(args[1], channel);
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
            await clearRoleAttributes(user);
            // reopen groups/teams
            await updateActiveTeams();
            await updateGroups();
			channel.send("✅ Resurrected " + playerName + "!");
		}
	}
    
    /**
    Is Player Arg
    checks if a value is a valid argument on a player
    **/
	this.isPlayersArgs = function(arg) {
		let allowedArgs = ["id", "emoji", "type", "role", "orig_role", "alignment", "alive", "ccs", "public_msgs", "private_msgs", "target", "counter", "final_result", "mentor"];
		return allowedArgs.indexOf(arg) >= 0;
	}
    
    /**
    Send Inactivity Warnings
    sends warnings to the scs of all players that are currently inactive
    */
    this.sendInactivityWarnings = async function() {
        const allPlayers = await sqlProm("SELECT * FROM players WHERE type='player' AND alive>=1");
        
        const curPhase = getPhaseAsNumber();
        if(curPhase <= 1) return;
        
        for(let i = 0; i < allPlayers.length; i++) {
            const totalMessages = allPlayers[i].public_msgs + allPlayers[i].private_msgs;
            const publicMessages = allPlayers[i].public_msgs;
            
            if(totalMessages < (curPhase * stats.total_req)) {
                abilitySendProm(`player:${allPlayers[i].id}`, `You are currently below the required activity of ${stats.total_req} messages per phase. Please try to be a bit more active!`, EMBED_RED, true, false, null, "Activity Warning");
            } else if(publicMessages < (Math.floor(curPhase/2) * stats.public_req)) {
                abilitySendProm(`player:${allPlayers[i].id}`, `You are currently below the required public activity of ${stats.public_req} messages per phase. Please try to be a bit more active in the public channels!`, EMBED_RED, true, false, null, "Activity Warning");
            }
        }
        
    }
    
}
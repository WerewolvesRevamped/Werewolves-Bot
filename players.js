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
	this.publicValues = null;
	this.privateValues = null;
	this.publicVotes = null;
	this.ccs = null;
	this.pRoles = null;
	
	/* Handle players command */
	this.cmdPlayers = function(message, args) {
		// Check subcommands
		if(!args[0] || (!args[1] && ["list","log","log2","msgs","messages","votes","roles","rl"].indexOf(args[0]) == -1)) { 
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
			case "sub": 
			case "substitute": cmdPlayersSubstitute(message, args); break;
			case "switch": cmdPlayersSwitch(message, args); break;
			case "list": cmdConfirm(message, "players list"); break;
            case "rl":
			case "roles": cmdConfirm(message, "players roles"); break;
			case "log": cmdConfirm(message, "players log"); break;
			case "log2": cmdConfirm(message, "players log2"); break;
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
	
	this.helpPlayers = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "players [list|msgs|log|log2|votes|msgs2|roles] - Information about players\n";
				if(isGameMaster(member)) help += stats.prefix + "players [get|get_clean|set|resurrect|signup] - Manages players\n";
				if(isGameMaster(member)) help += stats.prefix + "players [substitute|switch] - Manages player changes\n";
				if(isGameMaster(member)) help += stats.prefix + "killq [add|remove|killall|list|clear] - Manages kill queue\n";
				if(isGameMaster(member)) help += stats.prefix + "kqak - Instant kill a player\n";
				if(isGameMaster(member)) help += stats.prefix + "modrole [add|remove] - Adds/removes roles from users\n";
				help += stats.prefix + "list - Lists signed up players\n";
				help += stats.prefix + "list_alphabetical - Lists signed up players (alphabetical)\n";
				help += stats.prefix + "alive - Lists alive players\n";
				help += stats.prefix + "signup - Signs you up for the next game\n";
				help += stats.prefix + "emojis - Emoji & Player ID list for CCs\n";
				help += stats.prefix + "roll [-|whitelist|blacklist|number|?d?] - Randomizes\n";
			break;
			case "modrole":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "modrole [add|remove] <user id> <role id>\n```";
				help += "```\nFunctionality\n\nAdds or removes a role from a user\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "modrole add 242983689921888256 584770967058776067\n< ✅ Added Bot Developer to @McTsts (Ts)!\n```";
				help += "```diff\nAliases\n\n- mr\n```";
            break;
			case "kqak":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "kqak <user>\n```";
				help += "```\nFunctionality\n\nAdds a user to the killq and runs killq killall\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "kqak Ts\n```";
            break;

			case "list_signedup":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "list\n```";
				help += "```\nFunctionality\n\nLists all signed up players\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "list\n< Signed Up Players | Total: 3\n  🛠 - McTsts (@McTsts)\n  🤔 - marhjo (@marhjo)\n  👌 - federick (@federick)\n```";
				help += "```diff\nAliases\n\n- l\n- signedup\n- signedup_list\n- signedup-list\n- listsignedup\n- list-signedup\n- list_signedup\n```";
			break;
			case "list_alphabetical":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "list_alphabetical\n```";
				help += "```\nFunctionality\n\nLists all signed up players (alphabetically)\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "list\n< Signed Up Players (Alphabetical) | Total: 3\n  🛠 - McTsts (@McTsts)\n  🤔 - marhjo (@marhjo)\n  👌 - zederick (@zederick)\n```";
				help += "```diff\nAliases\n\n- la\n```";
			break;
			case "list_alive":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "alive\n```";
				help += "```\nFunctionality\n\nLists all alive players\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "list\n< Alive Players | Total: 3\n  🛠 - McTsts (@McTsts)\n  🤔 - marhjo (@marhjo)\n  👌 - federick (@federick)\n```";
				help += "```diff\nAliases\n\n- a\n- alive_list\n- alive-list\n- listalive\n- list-alive\n- list_alive\n```";
			break;
			case "emojis":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "emojis\n```";
				help += "```\nFunctionality\n\nGives you a list of emojis and player ids as well as a list of all emojis. Can be used for CC creation.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "emojis\n< 🛠 242983689921888256\n  🤔 102036304845377536\n  👌 203091600283271169\n  🛠 🤔 👌\n```";
				help += "```diff\nAliases\n\n- e\n- emoji\n```";
			break;
			case "signup": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "signup <Emoji>\n```";
				help += "```\nFunctionality\n\nSigns you up for the next game with emoji <Emoji>, which has to be a valid, not custom, emoji, that is not used by another player yet. If you have already signedup the command changes your emoji. If no emoji is provided, you are signed out.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "signup 🛠\n< ✅ @McTsts signed up with emoji 🛠!\n\n> " + stats.prefix + "signup\n< ✅ Successfully signed out, @McTsts. You will no longer participate in the next game!\n```";
				help += "```diff\nAliases\n\n- join\n- sign-up\n- sign_up\n- unsignup\n- signout\n- participate\n- sign-out\n- sign_out\n- leave\n- unjoin```";
			break;
			case "j":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "j\n```";
				help += "```\nFunctionality\n\nSigns you up for the next game with your emoji. If you don't have a person emoji this can be considered as an alias of " + stats.prefix + "signup\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "j\n< ✅ @McTsts signed up with emoji 🛠!\n```";
			break;
			case "roll":
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roll [whitelist|blacklist|number|?d?]\n```";
						help += "```\nFunctionality\n\nCommands to randomize a list of players. " + stats.prefix + "help roll <sub-command> for detailed help.\n\nIf used without a subcommand randomizes from the full player list.```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roll\n< ▶️ Selected @McTsts (🛠)\n```";
						help += "```diff\nAliases\n\n- rand\n- random\n- randomize\n```";
					break;
					case "wl": case "whitelist":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roll whitelist <Player List>\n```";
						help += "```\nFunctionality\n\nSelects a random player from the <Player List>\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roll whitelist McTsts Vera\n< ▶️ Selected @McTsts (🛠)\n```";
						help += "```diff\nAliases\n\n- roll wl\n```";
					break;
					case "bl": case "blacklist": 
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roll blacklist <Player List>\n```";
						help += "```\nFunctionality\n\nSelects a random player from the game that is not on the <Player List>\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roll blacklist Vera\n< ▶️ Selected @McTsts (🛠)\n```";
						help += "```diff\nAliases\n\n- roll bl\n```";
					break;
					case "num": case "n":  case "number":  case "d":  case "d?": case "?d?": 
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roll number <Number>\n```";
						help += "```\nFunctionality\n\nSelects a random number from 1 to <Number>. An alternative syntax is also supported: Instead of specifying the number subcommand you can use " + stats.prefix + "roll <amount>d<number> where amount specifies an amount of rolls to do and number specifies the highest value. The amount argument is optional. This means that " + stats.prefix + "roll d6 is equivalent to " + stats.prefix + "roll number 6 and " + stats.prefix + "roll 2d6 is equivalent to running it twice.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roll number 5\n< ▶️ Selected `3`\n```";
						help += "```diff\nAliases\n\n- roll n\n- roll num\n- roll d\n```";
					break;
				}
			break;
			case "players":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players [get|get_clean|set|resurrect|signup|list|substitute|switch|messages|messages2|log|log2|votes|roles]\n```";
            help += "```\nFunctionality\n\nGroup of commands to handle players. " + stats.prefix + "help players <sub-command> for detailed help.\n\nList of Player Properties:\nalive: Whether the player is alive`\nemoji: The emoji the player uses\nrole: The role of the player\npublic_value: The value of the players vote on public polls (Typically 1)\nprivate_value: The value of the players vote on private polls (Typically 1)\npublic_votes: The base value of votes the player has against them on public votes (Typically 0)\nid: The discord id of the player\nccs: the amount of created ccs\npublic_msgs: Amount of messages sent in public channels\nprivate_msgs: Amount of messages sent in private channels\type: The type of player. 0 for default, 1 for substitute.```";
					  help += "```diff\nAliases\n\n- p\n- player\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players get <Player Property> <Player>\n```";
						help += "```\nFunctionality\n\nReturns the value of <Player Property> for a player indentified with <Player>. For a list of player properties see " + stats.prefix + "help players.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players get alive mctsts\n< ✅ McTsts's alive value is 1!\n```";
						help += "```diff\nAliases\n\n- pg\n```";
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
						help += "```diff\nAliases\n\n- ps\n```";
					break;
					case "resurrect":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players resurrect <Player>\n```";
						help += "```\nFunctionality\n\nResurrects a player indentified with <Player>, by setting their alive value to 1, removing the dead participant role, and adding the participant role.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players resurrect mctsts\n< ✳ Resurrecting McTsts!\n< ✅ McTsts's alive value now is 1!\n```";
						help += "```diff\nAliases\n\n- pr\n```";
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
						help += "```diff\nAliases\n\n- players sub\n```";
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
					case "log":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players log\n```";
						help += "```\nFunctionality\n\nLists all players with their role and nickname in the gamelog format.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players log\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "players log!\n> Players | Total: 2\n  • 🛠 @McTsts (as `Ts`) is `Werewolf`\n  • 👌 @federick (as `fed`) is `Baker`\n```";
					break;	
					case "log2":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players log2\n```";
						help += "```\nFunctionality\n\nLists all players with their role and all roles with their player. Can be used to copy into gamelog messages.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players log2\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "players log2!```";
					break;		
					case "votes":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players votes\n```";
						help += "```\nFunctionality\n\nLists all players with and their votes if they are affected by vote manipulation.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players votes\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "players votes!```";
					break;		
					case "msgs":
					case "messages":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players messages\n```";
						help += "```\nFunctionality\n\nLists all players and their public and private message count.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players messages\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "players messages!\n> Players | Total: 1\n  🛠 - @McTsts (Werewolf); Public Messages: 1; Private Messages: 3```";
						help += "```diff\nAliases\n\n- players msgs\n```";
					break;		
					case "msgs2":
					case "messages2":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players messages2 <phase>\n```";
						help += "```\nFunctionality\n\nLists all alive players and their public and private message count.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players messages\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "players messages2!\n> Players | Total: 1\n  🛠 - @McTsts (Werewolf); Public Messages: 1; Private Messages: 3```";
						help += "```diff\nAliases\n\n- players msgs\n```";
					break;			
					case "roles":
					case "rl":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "players roles\n```";
						help += "```\nFunctionality\n\nLists all roles in the game. Used to export the role list for the WWR Role List Builder.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "players roles\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "players roles!```";
						help += "```diff\nAliases\n\n- players rl\n```";
					break;	
				}
			break;
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
		sql("SELECT killq.id, players.role FROM killq INNER JOIN players ON killq.id = players.id", result => {
			// Print killq
			let playerList = result.map(el => {
                let member = channel.guild.members.cache.get(el.id);
                let rName = toTitleCase(el.role.split(",")[0]);
                let rEmoji = getRoleEmoji(rName);
                return idToEmoji(el.id) + " - " + member.displayName + "/" + member.user.username + " - " + (rEmoji ? `<:${rEmoji.name}:${rEmoji.id}> ` : "") + rName;
            }).join("\n");
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
		players = parseUserList(channel, args, 1);
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
		players = parseUserList(channel, args, 1);
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
                
                var reportMsg;
                // Get info
                sql("SELECT role FROM players WHERE id = " + connection.escape(el), result => {
                    let rolesFiltered = result[0].role.split(",").filter(role => verifyRoleVisible(role));
                    let roleList = rolesFiltered.map(role => toTitleCase(role)).join("` + `");
                    let emojiList = rolesFiltered.map(role => {
                        let rEmoji = getRoleEmoji(role);
                        return rEmoji ? `<:${rEmoji.name}:${rEmoji.id}>` : false;
                    }).filter(el => el).join(" ");
                    reportMsg = "<@" + el + "> was a `" + roleList + "` " + emojiList;
                    
                    // Send reporter message
                    cmdConnectionSend(channel, ["", "reporter2", true, reportMsg]);
                    cmdConnectionSend(channel, ["", "reporter", "Reporter", reportMsg]);
                }, () => {
                    // Database error
                    reportMsg = "⛔ Database error. Could not get player information!";
                    
                    // Send reporter message
                    cmdConnectionSend(channel, ["", "reporter2", true, reportMsg]);
                    cmdConnectionSend(channel, ["", "reporter", "Reporter", reportMsg]);
                });
                
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
					sendError(channel, err, "Could not add role");
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
	this.cmdPlayersList = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,ccs FROM players", result => {
			let playerListArray = result.map(el => {  
                let rName = toTitleCase(el.role.split(",")[0]);
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
				channel.send("✳ Listing players " + (i+1)  + "/" + (playerList.length) + "...").then(m => {
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
	
	/* Lists all vote changes */
	this.cmdPlayersVotes = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji,role,alive,public_value,private_value,public_votes,ccs FROM players", result => {
			let playerListArray = result.filter(el => el.alive && (el.public_value != 1 || el.private_value != 1 || el.public_votes != 0)).map(el => `${el.emoji} - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id): "<@" + el.id + ">"} ${el.public_value},${el.private_value},${el.public_votes}`);
			let playerList = [], counter = 0;
			for(let i = 0; i < playerListArray.length; i++) {
				if(!playerList[Math.floor(counter/10)]) playerList[Math.floor(counter/10)] = [];
				playerList[Math.floor(counter/10)].push(playerListArray[i]);
				counter++;
			}
			channel.send("**Manipulated Players** | Total: " + playerListArray.length +  "\nPublic Value, Private Value, Public Votes");
			for(let i = 0; i < playerList.length; i++) {
				// Print message
				channel.send("✳ Listing players " + i  + "/" + (playerList.length) + "...").then(m => {
					m.edit(playerList[i].join("\n"));
				}).catch(err => {
					logO(err); 
					sendError(channel, err, "Could not list manipulated players");
				});
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Could not list manipulated players!");
		});
	
	}
    
	/* Returns a comman separated role list */
	this.cmdPlayersRoleList = function(channel) {
		// Get a list of players
		sql("SELECT role FROM players", result => {
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
		sql("SELECT id,emoji,role,alive,public_value,private_value,public_votes,ccs FROM players", result => {
			let playerList = result.map(el => {
                let player = channel.guild.members.cache.get(el.id);
                let nickname = player.nickname ? " (as `" + player.nickname + "`)" : "";
                return `• ${el.emoji} ${player ? player : "<@" + el.id + ">"}${nickname} is \`${el.role.split(",").map(role => toTitleCase(role)).join(" + ")}\``;
            });
			channel.send("```**Players** | Total: " + result.length + "\n" + playerList.join("\n") + "\n```")
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
		sql("SELECT id,emoji,role,alive,public_value,private_value,public_votes,ccs FROM players WHERE alive=1", result => {
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
		sql("SELECT id,emoji,public_msgs,private_msgs FROM players", result => {
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
				channel.send("✳ Listing players " + i  + "/" + (playerList.length) + "...").then(m => {
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
		sql("SELECT id,emoji,public_msgs,private_msgs FROM players WHERE alive=1", result => {
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
				channel.send("✳ Listing players " + i  + "/" + (playerList.length) + "...").then(m => {
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
		sql("SELECT id FROM players WHERE alive=1", result => {
			let playerList = result.map(el => getUser(channel, el.id)); 
			if(!wl) playerList = playerList.filter(el => blacklist.indexOf(el) === -1);
			else playerList = playerList.filter(el => blacklist.indexOf(el) != -1);
			let rID = playerList[Math.floor(Math.random() * playerList.length)];
			channel.send(`⏺️ Randomizing out of: ${playerList.map(el => idToEmoji(el)).join(", ")}`);
			channel.send(`✳ Selecting...`).then(m => m.edit(`▶️ Selected <@${rID}> (${idToEmoji(rID)})`));
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
        channel.send(`✳ Selecting...`).then(m => {
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
				author.roles.add(role); 
				message.channel.send("✅ Added `" + role.name + "` to <@" + author.id + "> (" + author.user.username + ")!");
			break;
			 case "remove": 
				author.roles.remove(role); 
				message.channel.send("✅ Remove `" + role.name + "` from <@" + author.id + "> (" + author.user.username + ")!");
			break;
		}
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
    
	/* Lists all signedup players */
	this.cmdListSignedupAlphabetical = function(channel) {
		// Get a list of players
		sql("SELECT id,emoji FROM players", result => {
			let playerList = result.sort((a,b) => {
                let pa = channel.guild.members.cache.get(a.id);
                let pb = channel.guild.members.cache.get(b.id);
               return (pa ? pa.nickname : "-") > (pb ? pb.nickname : "-") ? 1 : -1;
            }).map(el => `${el.emoji}  - ${channel.guild.members.cache.get(el.id) ? channel.guild.members.cache.get(el.id).nickname : "*user left*"}`).join("\n");
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
	
	/* Lists all alive players */
	this.cmdListAlive = function(channel) {
		// Check gamephase
		if(stats.gamephase < gp.INGAME) { 
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
			categories.push(...cachedSCs)
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
			categories.push(...cachedSCs)
			switchChannels(message.channel, categories, 0, getUser(message.channel, args[1]), getUser(message.channel, args[2]));
		}, 3000);
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
		substituteOneChannel(channel, ccCats, index, channel.guild.channels.cache.get(ccCats[index]).children.toJSON(), 0, subPlayerFrom, subPlayerTo);
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
			let channelMembers = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === "member").map(el => el.id);
			let channelOwners = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === "member").filter(el => el.allow == 66560).map(el => el.id);
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
		switchOneChannel(channel, ccCats, index, channel.guild.channels.cache.get(ccCats[index]).children.toJSON(), 0, subPlayerFrom, subPlayerTo);
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
			let channelMembers = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === "member").map(el => el.id);
			let channelOwners = channel.guild.channels.cache.get(channels[channelIndex].id).permissionOverwrites.cache.toJSON().filter(el => el.type === "member").filter(el => el.allow == 66560).map(el => el.id);
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
		let allowedArgs = ["emoji", "role", "alive", "public_value", "private_value", "public_votes", "id", "ccs", "public_msgs", "private_msgs", "type"];
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
		var user = parseUser(channel, args[1]);
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
		if(checkGamephase && stats.gamephase != gp.SIGNUP) { 
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
				updateGameStatusDelayed(channel.guild);
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
								updateGameStatusDelayed(message.guild);
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

	/* Convert a List of Users, Into a List of Valid User IDs; Provide executor to allow GMs to specify non-participants */
	this.getUserList = function(channel, args, startIndex, executor = false) {
		// Cut off entries at the start
		let players = args.slice(startIndex).map(el => getUser(channel, el));
		// Filter out non participants
		players = players.filter((el, index) => {
			if(el && (isParticipant(channel.guild.members.cache.get(el)) || (executor && isGameMaster(executor)))) {
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
		let allPlayerNames = playerIDs.map(el => [channel.guild.members.cache.get(el)?.user.username,channel.guild.members.cache.get(el)?.nickname]).flat().filter(el => el).map(el => el.toLowerCase());
        //console.log(allPlayerNames);
		let parsed = parseList(list.map(el => el.toLowerCase()), allPlayerNames);
		return [...parsed.invalid, ...parsed.found];
	}
	
	/* Convert a List of (badly written) Users, Into a List of Valid User IDs; Provide executor to allow GMs to specify non-participants */
	/* Equivalent to getUserList, but auto adds quotes, fixes typos and such */
	this.parseUserList = function(channel, args, startIndex, executor = false) {
		let players = args.slice(startIndex);
		players = fixUserList(players, channel);
		return getUserList(channel, players, 0, executor);
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

	/* Check if a member is a (living) participant */
	this.isParticipant = function(member) {
        if(!member) return false;
		return member.roles.cache.get(stats.participant);
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

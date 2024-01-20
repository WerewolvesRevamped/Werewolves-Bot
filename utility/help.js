/**
	Utility Module - Help Command
    This module has the base help command and the help command for the utility modules
*/
module.exports = function() {
    
	/**
    Command: $help
    The base implementation for the help command
    **/
	this.cmdHelp = function(channel, member, args) {
		// parse alias
		args[0] = parseAlias(args[0]);
		// Normal help
		let msgA = "", msgB = "", msgC = "";
		if(!args[0]) {
			args[0] = "";
			if(isGameMaster(member)) msgA += "**```yaml\nWerewolf Bot Game Master Help\n```**";
			else msgA += "**```yaml\nWerewolf Bot Player Help\n```**";
			if(isGameMaster(member)) msgA += "```php\n" + phpEscape("Use " + stats.prefix + "help <command> to get information about a command.\nWhile ingame react to messages with 📌 to pin them!\nPlayer arguments can be names, emojis, ids, nicknames or discord tags\n%s and %c can be used to refer to yourself and to the current channel, in all commands.\nArguments cant contain spaces, unless the argument is quoted \"like this\"") + "```";
			else msgA += "```php\n" + phpEscape("Use " + stats.prefix + "help <command> to get information about a command.\nWhile ingame react to messages with 📌 to pin them!\nPlayer arguments can be names, emojis, ids, nicknames or discord tags\nArguments cant contain spaces, unless the argument is quoted \"like this\"") + "```";
		} else {
			msgA += "**```yaml\n" + toTitleCase(args.join(" ")) + " Help\n```**";
		}
		// Commands
		msgB += helpRoles(member, args);
		msgB += helpUtility(member, args);
		msgB += helpStats(member, args);
		msgB += helpCCs(member, args);
		msgB += helpGame(member, args);
		msgB += helpWhispers(member, args);
		msgB += helpPlayers(member, args);
		msgB += helpPoll(member, args);
		msgB += helpTheme(member, args);
		msgB += helpConfirm(member, args);
		// Print
		if(args[0] === "") { 
			msgC = chunkArray(msgB.split("\n"), 25).map(el => "```php\n" + phpEscape(el.join("\n")) + "\n```");
			msgC[0] = msgA + msgC[0];
			msgC.forEach(el => channel.send(el));
		} else {
			if(msgB) channel.send(msgA + msgB);
			else channel.send(msgA + "```fix\nNot a valid command```");
		}
	}
    
	
	/**
    Utility Help
    Help messages for the utility module
    **/
	this.helpUtility = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "split - Runs a list of semicolon seperated commands\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "say - Makes the bot repeat a message\n";
				if(isGameMaster(member)) help += stats.prefix + "sudo - Allows webhooks to run commands\n";
				help += stats.prefix + "ping - Tests the bot\n";
				help += stats.prefix + "help - Provides information about commands\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "bulkdelete - Deletes webhook & user messages in bulk\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "delete - Deletes a couple of messages\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "delay - Executes a command with delay\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "modify - Modifies the bot\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "edit - Edits a bot message\n";
			break;
			case "split":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "split\n```";
				help += "```\nFunctionality\n\nRuns a list of commands that are provided as a semicolon seperated list.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "split help;ping```";
			break;
			case "say":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "say\n```";
				help += "```\nFunctionality\n\nMakes the bot repeat everything after say.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "say Hello!\n< Hello!```";
				help += "```diff\nAliases\n\n- >\n```";
			break;
			case "sudo":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "sudo <Command>\n```";
				help += "```\nFunctionality\n\nAllows webhooks to run commands with GM permissions in GMSAFE channels.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "sudo confirm killq killall```";
			break;
			case "ping":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "ping\n```";
				help += "```\nFunctionality\n\nGives the ping of the bot, and checks if the bot is running.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "ping\n< ✅ Pong! Latency is 170ms. API Latency is 128ms```";
				help += "```diff\nAliases\n\n- ?\n```";
			break;
			case "bulkdelete": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "bulkdelete\n```";
				help += "```\nFunctionality\n\nDeletes webhook/user messages (but not bot messages) in bulk from a channel.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "bulkdelete\n< ❗ Click the reaction in the next 20.0 seconds to confirm " + stats.prefix + "bulkdelete!\n< ✅ Deleted 17 messages.```";
				help += "```diff\nAliases\n\n- bd\n```";
			break;
			case "delete": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "delete [0-5]\n```";
				help += "```\nFunctionality\n\nDeletes the last up to five messages from a channel.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "delete 3\n< ✅ Deleted 3 messages.```";
				help += "```diff\nAliases\n\n- d\n```";
			break;
			case "delay": 
				help += "```yaml\nSyntax\n\n" + stats.prefix + "delay <Delay> <Command>\n```";
				help += "```\nFunctionality\n\nExecutes a command with delay in seconds.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "delay 5 ping\n< ✅ Pong! Latency is 990ms. API Latency is 114ms```";
			break;
			case "help":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "help <Command> [Sub-Command(s)]\n```";
				help += "```\nFunctionality\n\nProvides help for a command (with subcommands)\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "help help\n```";
				help += "```diff\nAliases\n\n- h\n```";
			break;
			case "modify":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "modify <attribute> <value>\n```";
				help += "```\nFunctionality\n\nUpdates an <attribute> of the bot to <value>. Available attributes: status, nickname, activity.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "modify status dnd!\n< ✅ Updated bot status!```";
				help += "```diff\nAliases\n\n- mod\n```";
			break;
			case "edit":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "edit <id> <text>\n```";
				help += "```\nFunctionality\n\nUpdates a bot message.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "edit 28462946294 New message contents```";
			break;
		}
		return help;
	}
}
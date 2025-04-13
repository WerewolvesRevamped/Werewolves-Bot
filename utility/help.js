/**
	Utility Module - Help Command
    This module has the base help command and the help command for the utility modules
*/
module.exports = function() {
    
	/**
    Command: $help
    The base implementation for the help command
    **/
    this.cmdHelp = async function(channel, member, args) {
        let helpText = "";
        if(args[0] && args[0] != "all") { // sub-page
            // parse alias
            args[0] = parseAlias(args[0]);
            let cmdName = args.join(" ");
            let cmdNameText = args.shift();
            if(cmdNameText.length === 2) cmdNameText = cmdNameText.toUpperCase();
            else cmdNameText = toTitleCase(cmdNameText);
            if(args.length > 0) cmdNameText += " " + toTitleCase(args.join(" "));
            helpText += "**```yaml\n" + cmdNameText + " Help\n```**";
            let cmdHelpText = getCommandHelp(cmdName, member);
            if(cmdHelpText.length > 0) {
                helpText += cmdHelpText;
            } else {
                helpText += "```fix\nNot a valid command```";
            }
            // output
            channel.send(helpText);
        } else { // full-page
            if(isGameMaster(member)) helpText += "**```yaml\nWerewolf Bot Game Master Help\n```**";
			else helpText += "**```yaml\nWerewolf Bot Player Help\n```**";
			if(isGameMaster(member)) helpText += "```php\n" + phpEscape("Use " + stats.prefix + "help <command> to get information about a command.\nWhile ingame react to messages with 📌 to pin them!\nPlayer arguments can be names, emojis, ids, nicknames or discord tags\n%s and %c can be used to refer to yourself and to the current channel, in all commands.\nArguments cant contain spaces, unless the argument is quoted \"like this\"") + "```";
			else helpText += "```php\n" + phpEscape("Use " + stats.prefix + "help <command> to get information about a command.\nWhile ingame react to messages with 📌 to pin them!\nPlayer arguments can be names, emojis, ids, nicknames or discord tags\nArguments cant contain spaces, unless the argument is quoted \"like this\"") + "```";
            let commandsFiltered;
            if(isAdmin(member)) commandsFiltered = COMMANDS.filter(el => el[1] <= PERM.AD);
            else if(isSenior(member)) commandsFiltered = COMMANDS.filter(el => el[1] <= PERM.SG);
            else if(isGameMaster(member)) commandsFiltered = COMMANDS.filter(el => el[1] <= PERM.GM);
            else if(isHelper(member)) commandsFiltered = COMMANDS.filter(el => el[1] <= PERM.GH);
            else commandsFiltered = COMMANDS.filter(el => el[1] <= PERM.AL);
            if(args[0] != "all") commandsFiltered = commandsFiltered.filter(el => el[0].split(" ").length === 1); // get primary commands only
            let allCommandTexts = commandsFiltered.map(el => {
                let cmdPrefix = stats.prefix;
                if(el[9]) {
                    switch(el[9]) {
                        case CMDARGS.NO_PREFIX: cmdPrefix = ""; break;
                    }
                }
                return cmdPrefix + el[0] + " - " + el[2];
            });
            let allCommandTextsChunked = chunkArray(allCommandTexts, 30);
            // output
            await channel.send(helpText);
            for(let i = 0; i < allCommandTextsChunked.length; i++) {
                let cmds = allCommandTextsChunked[i].join("\n");
                await channel.send("```php\n" + phpEscape(cmds) + "\n```");
            }
        }
    }
    
    this.PERM = {
        AL: 0, // everyone
        GH: 1, // helper and higher
        GM: 2, // game masters and higher
        SG: 3, // senior game masters and higher
        AD: 4, // admins and higher
        NO: 5 // not normally usable
    };
    this.CMDSTATE = {
       RDY: 0, // ready
       WIP: 1, // wip
       NOP: 2, // gone
       UNK: 3, // unknown
    };
    this.CMDARGS = {
        NO_PREFIX: 1,
        NO_PREFIX_SUB: 2
    }
    /**
        0: command name
        1: permission level
        2: short desc
        3: arguments
        4: long desc
        5: example execution
        6: example feedback
        7: command state
        8: additional aliases
    **/
    this.CONF_TXT = "❗ Click the reaction in the next 20.0 seconds to confirm the command!";
    this.COMMANDS = [
        /** Top Level Commands **/
        ["drag", PERM.GM, "Pulls all living players into a hardcoded townsquare VC.", "", "", "drag", [], CMDSTATE.UNK],
        ["drag_dead", PERM.GM, "Pulls all living players into a hardcoded deadspectator VC.", "", "", "drag_dead", [], CMDSTATE.UNK],
        ["force_reload", PERM.GM, "Reloads boat.", "", "", "", [], CMDSTATE.UNK],
        ["sql_reload", PERM.SG, "Restarts SQL.", "", "", "", [], CMDSTATE.UNK],
        ["embed", PERM.GH, "Sends an embed.", "", "", "", [], CMDSTATE.UNK],
        /** Utility Commands **/
        ["help", PERM.AL, "Provides information about commands.", "<Command> [Sub-Command(s)]", "Provides help for a command. Use $help all to also see all subcommands.", "help help", [], CMDSTATE.RDY],
            ["help all", PERM.AL, "Provides information about commands and subcommands.", "", "Provides help for all commands and subcommands", "help all", [], CMDSTATE.RDY],
        ["ping", PERM.AL, "Tests the bot", "", "Gives the ping of the bot, and checks if the bot is running.", "ping", ["✅ Pong! Latency is 170ms. API Latency is 128ms"], CMDSTATE.RDY],
        ["edit", PERM.GH, "Edits a bot message.", "<message id> <text>", "Updates a bot message. You may instead also specify three arguments of form: <channel id> <message id> <text>", "edit 28462946294 NewMsgContents", [], CMDSTATE.RDY],
        ["say", PERM.GH, "Makes the bot repeat a message.", "[input]", "Makes the bot repeat everything after say.", "say hello", ["hello"], CMDSTATE.RDY],
        ["modify", PERM.GH, "Modifies the bot.", "<attribute> <value>", "Updates an <attribute> of the bot to <value>. Available attributes: status, nickname, activity.", "modify status dnd", ["✅ Updated bot status!"], CMDSTATE.RDY],
        ["split", PERM.GM, "Runs a list of semicolon seperated commands.", "[command list]", "Runs a list of commands that are provided as a semicolon seperated list.", "split help;ping", [], CMDSTATE.RDY],
        ["bulkdelete", PERM.GH, "Deletes webhook & user messages in bulk", "", "Deletes webhook/user messages (but not bot messages) in bulk from a channel.", "bulkdelete", [CONF_TXT,"✅ Deleted 17 messages."], CMDSTATE.RDY],
        ["delete", PERM.GH, "Deletes a couple of messages.", "[0-5]", "Deletes the last up to five messages from a channel.", "delete 3", ["✅ Deleted 3 messages."], CMDSTATE.RDY],
        ["delay", PERM.GH, "Executes a command with delay.", "<Delay> <Command>", "Executes a command with delay in seconds.", "delay 5 ping", ["✅ Pong! Latency is 990ms. API Latency is 114ms"], CMDSTATE.RDY],
        ["temp", PERM.AL, "Converts between °C and °F.", "[f|c] <value>", "Converts into the specified unit.", "temp f 0", ["🌡️ 0 °C in Fahrenheit: 32 °F"], CMDSTATE.RDY],
        ["time", PERM.AL, "Identifies or convers timezone.", "<Your Current Time> | <Your Current Time> <Conversion Time> | <Timezone> <Conversion Time>", "Returns your UTC offset if you put your current time. Many time formats are supported as input. If you additionally submit a second time it uses the first time to identify your timezone and then convers the second time to UTC. When submitting two times you may additionally also submit just the timezone offset in place off the first time (e.g. '+1' or 'utc-1').", "time 22:25", ["✅ Your timezone is UTC+1!"], CMDSTATE.RDY],
        /** CC Module **/
        // CC
        ["cc", PERM.AL, "Manages CCs.", "<Subcommand>", `Group of commands to handle CCs. Use $help cc <subcommand> for detailed help.`, "", [], CMDSTATE.RDY],
            ["cc create", PERM.AL, "Creates a CC.", "<CC Name> <Player List>", "Creates a CC with the name <CC Name> and adds you, as well as all players in the <Player List> to it. <Player List> may contain 0 or more players. When the CC is created you are announced as the creator of the CC, and are the only owner.", "cc create verajay jay", ["✅ Created #verajay"], CMDSTATE.RDY],
            ["cc spam", PERM.AL, "Creates a CC with no owners and only you as member.", "<CC Name>", "Creates a CC with the name <CC Name> and adds you to it. The cc will not have any owners (you cannot add members to it). This cc will not count towards the cc limit.", "cc spam spamcc", ["✅ Created #spamcc!"], CMDSTATE.RDY],
            ["cc create_hidden", PERM.AL, "Creates a CC but hides the owner.", "<CC Name> <Player List>", "Creates a CC with the name <CC Name> and adds you, as well as all players in the <Player List> to it. <Player List> may contain 0 or more players. When the CC is created you are not announced as the creator of the CC, and all original members of the CC are made owners.", "cc create_hidden verajay jay", ["✅ Created #verajay!"], CMDSTATE.RDY],
            ["cc add", PERM.AL, "Adds members to a CC.", "<Player List>", "Adds all players in the <Player List> to the current CC. Only works in CCs, in which you are an owner.", "cc add mctsts", ["✅ Added @mctsts to the CC!"], CMDSTATE.RDY],
            ["cc remove", PERM.AL, "Removes members from a CC.", "<Player List>", "Removes all players in the <Player List> from the current CC. Only works in CCs, in which you are an owner.", "cc remove mctsts", ["✅ Removed @mctsts from the CC!"], CMDSTATE.RDY],
            ["cc rename", PERM.AL, "Renames a CC.", "<Name>", "Renames the current cc into <name>.", "cc rename newName", ["✅ Renamed channel to newName!"], CMDSTATE.RDY],
            ["cc archive", PERM.AL, "Archives a CC.", "", "Renames a CC to 🔒-<oldName> and locks it.", "cc archive", ["✅ Archived channel!"], CMDSTATE.RDY],
            ["cc promote", PERM.AL, "Promotes members of a CC to owners.", "<Player List>", "Promotes all players in the <Player List> in the current CC to owner. Only works in CCs, in which you are an owner.", "cc promote captainluffy", ["✅ Promoted @captainluffy!"], CMDSTATE.RDY],
            ["cc demote", PERM.AL, "Demotes owners of a CC to members.", "<Player List>", "Demotes all players in the <Player List> in the current CC to non-owner. Only works in CCs, in which you are an owner.", "cc demote captainluffy", ["✅ Demoted @captainluffy!"], CMDSTATE.RDY],
            ["cc leave", PERM.AL, "Makes you leave a CC.", "", "Removes you from the current CC.", "cc leave", ["✅ @mister.turtle left the CC!"], CMDSTATE.RDY],
            ["cc list", PERM.AL, "Lists all members of a CC.", "", "Lists all members of the current CC.", "cc list", ["CC Members | Total: 2","@venomousbirds","@shapechange"], CMDSTATE.RDY],
            ["cc owners", PERM.AL, "Lists all owners of a CC.", "", "Lists all owners of the current CC.", "cc owners", ["CC Owners | Total: 1","@McTsts"], CMDSTATE.RDY],
            ["cc cleanup", PERM.GM, "Deletes all CCs.", "", "Removes all CCs, all CC Categories, and resets the CC Counter.", "cc cleanup", [CONF_TXT, "✅ Successfully deleted a cc category!","✅ Successfully deleted ccs!","✅ Successfully reset cc counter!","✅ Successfully reset cc cat list!"], CMDSTATE.UNK],
            ["cc create_multi", PERM.AL, "Creates multiple CCs.", "\n<CC Name> <Player List>\n<CC Name> <Player List>\n<CC Name> <Player List>\n...", "Handles each line as its own cc create command.", "cc create_multi\n  🛠️ mctsts\n  👌 federick", ["✅ Created #🛠️!","✅ Created #👌!","✅ Successfully created 2 CCs!"], CMDSTATE.UNK],
            ["cc create_multi_hidden", PERM.AL, "Creates multiple CCs but hides the ower.", "\n<CC Name> <Player List>\n<CC Name> <Player List>\n<CC Name> <Player List>\n...", "Handles each line as its own cc create_hidden command.", "cc create_multi_hidden\n  🛠️ mctsts\n  ▪️ e_thsn", ["✅ Created #🛠️!","✅ Created #▪️!","✅ Successfully created 2 CCs!"], CMDSTATE.UNK],
        // SC
        ["sc", PERM.GM, "Manages SCs.", "<Subcommand>", `Group of commands to handle CSs. Use $help sc <subcommand> for detailed help.`, "", [], CMDSTATE.RDY],
            ["sc add", PERM.GM, "Adds a player to a SC.", "<Player List>", "Adds all players in the <Player List> to the current SC.", "sc add mctsts", ["✅ Added @mctsts to the SC!"], CMDSTATE.RDY],
            ["sc remove", PERM.GM, "Removes a player from a SC.", "<Player List>", "Removes all players in the <Player List> from the current SC.", "sc remove mctsts", ["✅ Removed @mctsts from the SC!"], CMDSTATE.RDY],
            ["sc rename", PERM.GM, "Renames a SC.", "<Name>", "Renames the current sc into <Name>.", "sc rename newName", ["✅ Renamed channel to newName!"], CMDSTATE.RDY],
            ["sc list", PERM.GM, "Lists all members of a SC.", "", "Lists all members of the current SC.", "sc list", ["CC Members | Total: 2","@feritin","@steinator"], CMDSTATE.RDY],
            ["sc clear", PERM.GM, "Removes all members from a SC.", "", "Removes all members of the current SC.", "sc clear", [], CMDSTATE.RDY],
            ["sc clean", PERM.GM, "Removes members and bulkdeletes.", "", "Removes all members of the current SC and bulkdeletes messages. Same as running sc clear and bulkdelete.", "sc clean", [], CMDSTATE.RDY],
            ["sc change", PERM.GM, "Renames SC and pins new role info.", "Renames the SC to a new name and infopins the role that corresponds to the new name.", "sc change citizen", "", [], CMDSTATE.RDY],
        /** Confirm Module **/
        ["confirm", PERM.GH, "Confirms a confirmation-requiring command.", "", "Skips the confirming stage of a command that requires confirming.", "confirm reset", [], CMDSTATE.RDY],
        /** Players Module **/
        // Players
        ["players", PERM.GM, "Manages players.", "<Subcommand>", `Group of commands to handle playerss. Use $help players <subcommand> for detailed help. \n\nList of Player Properties:\nalive: Whether the player is alive\ntype: What type of player. Can be 'player', 'substitute' and 'substituted'.\nemoji: The emoji the player uses\nrole: The role of the player\nid: The discord id of the player\nccs: the amount of created ccs\npublic_msgs: Amount of messages sent in public channels\nprivate_msgs: Amount of messages sent in private channels.`, "", [], CMDSTATE.RDY],
            ["players get", PERM.GM, "Returns a property for a player.", "<Property> <Player>", "Returns the value of <Player Property> for a player indentified with <Player>. For a list of player properties see $help players.", "players get alive mctsts", ["✅ McTsts's alive value is 1!"], CMDSTATE.RDY, ["pg"]],
            ["players get_clean", PERM.GM, "Alternative version of get subcommand.", "<Property> <Player>", "Same as get, but shows roles in a more player friendly way.", "players get_clean alive mctsts", ["✅ McTsts's alive value is 1!"], CMDSTATE.UNK],
            ["players set", PERM.GM, "Updates a player's property.", "<Property> <Player> <Value>", "Sets the value of <Player Property> for a player indentified with <Player> to <Value>. For a list of player properties see $help players.", "players set role mctsts baker", ["✅ McTsts's role value now is baker!"], CMDSTATE.RDY, ["ps"]],
            ["players resurrect", PERM.GM, "Resurrects a dead player.", "<Player>", "Resurrects a player indentified with <Player>, by setting their alive value to 1, removing the dead participant role, and adding the participant role. Also updates various other values.", "players resurrect mctsts", ["✅ McTsts's alive value now is 1!"], CMDSTATE.RDY, ["pr"]],
            ["players signup", PERM.GM, "Signsup another player.", "<Player> <Emoji>", "Pretends the player identified with <Player> used the command $signup <Emoji>. This command works even if signups aren't open. When signing up yourself with this command it may be useful to use the fact that %s is seens as your own id.", "players signup mctsts 🛠", ["✅ @McTsts signed up with emoji 🛠!"], CMDSTATE.RDY],
            ["players signsub", PERM.GM, "Signsup another player as a substitute.", "<Player> <Emoji>", "Pretends the player identified with <Player> used the command $substitute <Emoji>. This command works even if signups aren't open.", "players signsub mctsts 🛠", ["✅ @McTsts is a substitute with emoji 🛠!"], CMDSTATE.RDY, ["players signsub"]],
            ["players substitute", PERM.GM, "Substitutes one player with another.", "<OldPlayer> <NewPlayer>", "Replaces the first player with the second (both players must be signed up - old player as participant, new player as substitute).", "players sub 242983689921888256 588628378312114179", [], CMDSTATE.RDY, ["players sub"]],
            ["players switch", PERM.GM, "Switches one player with another.", "<OldPlayer> <NewPlayer>", "Switches the first player with the second. Both players must be participants.", "players switch 242983689921888256 588628378312114179", [], CMDSTATE.NOP],
            ["players list", PERM.GM, "List all players and their roles.", "", "Lists all players with their role and alive values.", "", [], CMDSTATE.RDY],
            ["players list_alive", PERM.GM, "List all living players and their roles.", "", "Lists all living players with their role.", "", [], CMDSTATE.UNK],
            ["players roles", PERM.GM, "Returns a list of in-play roles.", "", "Lists all roles in the game. Used to export the role list for the WWR Role List Builder.", "", [], CMDSTATE.RDY, ["players rl"]],
            ["players log", PERM.GM, "Returns player info in a specific format for log.", "", "Lists all players with their role and nickname in the gamelog format.", "", [], CMDSTATE.RDY],
            ["players log2", PERM.GM, "Returns player info in a specific format for log.", "", "Lists all players with their role and all roles with their player. Can be used to copy into gamelog messages.", "", [], CMDSTATE.RDY],
            ["players log3", PERM.GM, "Returns player info in a specific format for log.", "", "Lists all players with their role sorted by alive status. Can be used as a base for the final results message.", "", [], CMDSTATE.RDY],
            ["players votes", PERM.GM, "Returns the amount of votes each player has.", "", "Lists all players with and their votes if they are affected by vote manipulation.", "", [], CMDSTATE.UNK],
            ["players messages", PERM.GM, "Returns the amount of messages each player has sent.", "", "Lists all players and their public and private message count.", "", [], CMDSTATE.RDY, ["players msgs"]],
            ["players messages2", PERM.GM, "Calculates inactivity based on phase input and message count.", "<Phase>", "Lists all alive players and their public and private message count.", "", [], CMDSTATE.RDY, ["players msgs2"]],
            // Role
        ["roll", PERM.AL, "Randomizes", "<Subcommand>", "Commands to randomize a list of players. $help roll <sub-command> for detailed help.\n\nIf used without a subcommand randomizes from the full player list.", "roll", ["️ Selected @McTsts (🛠)"], CMDSTATE.RDY],
            ["roll whitelist", PERM.AL, "Randomizes from a whitelist.", "<Whitelist>", "Selects a random player from the <Player List>.", "roll whitelist McTsts Vera", ["▶️ Selected @McTsts (🛠)"], CMDSTATE.RDY, ["roll wl"]],
            ["roll blacklist", PERM.AL, "Randomizes with a blacklist.", "<Blacklist>", "Selects a random player from the game that is not on the <Player List>.", "roll blacklist Vera", ["▶️ Selected @McTsts (🛠)"], CMDSTATE.RDY, ["roll bl"]],
            ["roll number", PERM.AL, "Returns a random number.", "<Number>", "Selects a random number from 1 to <Number>.", "roll number 5", ["▶️ Selected `3`"], CMDSTATE.RDY, ["roll num"]],
            ["roll ?d?", PERM.AL, "Rolls dice.", "<Amount>d<Number>", "You can use $roll <amount>d<number> where amount specifies an amount of rolls to do and number specifies the highest value. The amount argument is optional. This means that $roll d6 is equivalent to $roll number 6 and $roll 2d6 is equivalent to running it twice.", "$roll d5", ["▶️ Selected `3`"], CMDSTATE.RDY],
            // Modrole
        ["modrole", PERM.NO, "Adds/removes roles from users.", "<Subcommand>", "See $help modrole <subcommand>.", "", [], CMDSTATE.NOP],
            ["modrole add", PERM.NO, "Adds roles from users.", "<User ID> <Role ID>", "Adds a role to a user.", "modrole add 242983689921888256 584770967058776067", ["✅ Added Bot Developer to @McTsts (Ts)!"], CMDSTATE.NOP],
            ["modrole remove", PERM.NO, "Removes roles from users.", "<User ID> <Role ID>", "Removes a role from a user.", "modrole remove 242983689921888256 584770967058776067", ["✅ Removed Bot Developer from @McTsts (Ts)!"], CMDSTATE.NOP],
        // Loot Commands
        ["loot", PERM.AL, "Opens a lootbox.", "", "Run the command to purchase a lootbox for 100 coins and open it.", "loot", [], CMDSTATE.RDY],
        ["loot_force", PERM.GM, "Forces a specific lootbox reward.", "<Reward Code>", "Opens a lootbox and finds a specified reward.", "loot_force std:x", [], CMDSTATE.RDY],
        ["recycle", PERM.AL, "Turns a reward into coins.", "<Reward Code>", "Deletes a specified reward and returns some coins.", "recycle std:x", [], CMDSTATE.RDY],
        ["inventory", PERM.AL, "Shows your inventory.", "", "Shows your inventory which contains some lootbox rewards.", "inventory", [], CMDSTATE.RDY],
            ["inventory see", PERM.AL, "Shows your inventory.", "", "Same as the base command", "inventory see", [], CMDSTATE.RDY],
            ["inventory get", PERM.GM, "Shows a user's inventory.", "<User>", "Shows the inventory of a specified user.", "inventory get mctsts", [], CMDSTATE.RDY],
            ["inventory add", PERM.GM, "Updates a user's inventory.", "<User> <Item>", "Adds an item to a user's inventory.", "inventory add mctsts bot:temp", [], CMDSTATE.RDY],
            ["inventory remove", PERM.GM, "Updates a user's inventory.", "<User> <Item>", "Removes an item from a user's inventory.", "inventory remove mctsts bot:temp", [], CMDSTATE.RDY],
            ["inventory transfer", PERM.GM, "Transfers an item.", "<User> <Item>", "Transfers an item to another user. You must use the item code to transfer the item. You can find this by running $inventory", "inventory transfer mctsts bot:temp", [], CMDSTATE.RDY],
        ["market", PERM.AL, "Shows the market.", "", "Shows the market where you can buy items from other players.", "market", [], CMDSTATE.RDY],
            ["market see", PERM.AL, "Shows the market.", "", "Same as the base command.", "market see", [], CMDSTATE.RDY],
            ["market offer", PERM.AL, "Adds an item to the market.", "<Item ID> <Price>", "Adds an item to the market place for a certain price.", "market offer std:x 10", [], CMDSTATE.RDY],
            ["market remove", PERM.AL, "Removes an item to the market.", "<Offer ID>", "Removes an item from the market place.", "market remove 1", [], CMDSTATE.RDY, ["market rem"]],
            ["market buy", PERM.AL, "Buys an item from the market.", "<Offer ID>", "Buys an item from the market place for a certain price.", "market buy 1", [], CMDSTATE.RDY],
            ["market evaluate", PERM.AL, "Evaluates an item's value.", "<Item ID>", "Evaluates the price an item could fetch if recycled. Can be used for items you do not have.", "market evaluate std:x", [], CMDSTATE.RDY, ["market eval"]],
        ["coins", PERM.AL, "Shows your coins.", "", "Shows how many coins you currently have.", "coins", [], CMDSTATE.RDY],
            ["coins get", PERM.GM, "Shows a player's coins.", "", "Shows how many coins a specific player has.", "coins get mctsts", [], CMDSTATE.RDY],
            ["coins add", PERM.GM, "Adds to a player's coins.", "", "Gives a specific player coins.", "coins add mctsts 100", [], CMDSTATE.RDY],
            ["coins remove", PERM.GM, "Removes from a player's coins.", "", "Takes coins from a specific player.", "coins remove mctsts 100", [], CMDSTATE.RDY],
            ["coins list", PERM.GM, "Lists player coins.", "", "Lists everyone with their coin count..", "coins list", [], CMDSTATE.RDY],
            ["coins reward", PERM.NO, "Rewards a player with coins.", "", "Special variant of $coins add that is only used by WWRess and WWRdle.", "coins reward mctsts 100", [], CMDSTATE.RDY],
        ["xp", PERM.AL, "Check your XP.", "", "Group of commands to check xp. See $help icon <subcommand>. Shows your own XP, when used without a subcommand.", "xp", ["@Ts has 100000 XP and is on Level 100"], CMDSTATE.RDY],
            ["xp get", PERM.AL, "Shows someone's XP.", "<Player>", "Shows the XP of somebody.", "xp get mctsts", ["@Ts has 100000 XP and is on Level 100"], CMDSTATE.RDY],
            ["xp list", PERM.AL, "Shows everyone's XP.", "", "Shows the XP of everybody.", "xp list", [], CMDSTATE.RDY],
            ["xp list_actual", PERM.GM, "Shows everyone's XP.", "", "Shows the XP of everybody, but without modifying the display values.", "xp list_actual", [], CMDSTATE.RDY],
        ["icon", PERM.AL, "Manages your role icon.", "", "Group of commands to manage your role icon. See $help icon <subcommand>", "", [], CMDSTATE.RDY],
            ["icon select", PERM.AL, "Sets your role icon.", "<Role Name>", "Sets your role icon.", "icon set cat", ["@Ts, your role icon has been updated to Cat."], CMDSTATE.RDY, ["icon set"]],
            ["icon disable", PERM.AL, "Removes your role icon.", "", "Removes your role icon.", "icon disable", ["@Ts, your role icon has been disabled."], CMDSTATE.RDY],
            ["icon list", PERM.AL, "Lists your role icons.", "", "Lists your unlocked role icons.", "icon list", [], CMDSTATE.RDY], 
        ["bot", PERM.AL, "Manages your bot features.", "", "Group of commands to manage your bot features. See $help bot <subcommand>", "", [], CMDSTATE.RDY],
            ["bot list", PERM.AL, "Lists your bot features.", "", "Lists your unlocked bot features.", "bot list", [], CMDSTATE.RDY],
        ["death_message", PERM.AL, "Manages your death message.", "", "Group of commands to manage your death message. See $help dmsg <subcommand>", "", [], CMDSTATE.RDY],
            ["death_message select", PERM.AL, "Sets your death message.", "<Death Message ID>", "Sets your custom death message.", "dmsg set 1", [], CMDSTATE.RDY, ["death_message set"]],
            ["death_message disable", PERM.AL, "Removes your death message.", "", "Removes your death message.", "dmsg disable", [], CMDSTATE.RDY],
            ["death_message list", PERM.AL, "Lists your death messages.", "", "Lists your unlocked death messages.", "dmsg list", [], CMDSTATE.RDY],
            ["death_message test", PERM.GM, "Tests your death messages.", "", "Test your currently selected death messages.", "dmsg test", [], CMDSTATE.RDY],
        ["booster", PERM.AL, "Manages your boosters.", "", "Group of commands to manage your boosters. See $help booster <subcommand>", "", [], CMDSTATE.RDY],
            ["booster use", PERM.AL, "Sets your death message.", "<Booster Code>", "Sets your custom death message.", "booster use bst:xp150", [], CMDSTATE.RDY],
            ["booster list", PERM.AL, "Lists your death messages.", "", "Lists your unlocked death messages.", "booster list", [], CMDSTATE.RDY],
            ["booster active", PERM.AL, "Lists currently active boosters.", "", "Lists all currently globally active boosters.", "booster active", [], CMDSTATE.RDY],
        ["stash", PERM.AL, "Hides an item.", "<Item Code>", "Hides an item from your inventory.", "stash std:x", ["Stashed!"], CMDSTATE.RDY],
            ["stash list", PERM.AL, "Shows your stash.", "", "Sends your stash as a DM.", "stash list", [], CMDSTATE.RDY, ["stash show"]],
        ["unstash", PERM.AL, "Unhides an item.", "<Item Code>", "Unhides an item in your inventory.", "unstash std:x", ["Unstashed Nothing (STD:X)!"], CMDSTATE.RDY],
        ["nickname", PERM.AL, "Sets your nickname.", "<Nickname>", "Sets your nickname to a specified value.", "nickname ts", ["Updated your nickname!"], CMDSTATE.RDY],
        ["reverseme", PERM.AL, "Reverses your nickname.", "", "Reverses your nickname. Lootbox reward command.", "reverseme", ["✅ You have been reversed!"], CMDSTATE.RDY],
        ["newship", PERM.AL, "Updates your nickname.", "", "Updates your nickname. Lootbox reward command.", "newship", ["✅ You love mctsts!"], CMDSTATE.RDY],
        ["newhate", PERM.AL, "Updates your nickname.", "", "Updates your nickname. Lootbox reward command.", "newhate", ["✅ You hate mctsts!"], CMDSTATE.RDY],
        ["flip", PERM.AL, "Flips a coin.", "", "Flips a coin, randomly returning either heads or tails. Lootbox reward command.", "flip", ["@Ts, your coin flip landed on: TAILS."], CMDSTATE.RDY],
        ["fortune", PERM.AL, "Tells your fortune.", "", "Tells your fortune from the WWR Tarot Cards.", "fortune", [], CMDSTATE.RDY],
        // List Commands
        ["list_signedup", PERM.AL, "Lists signed up players.", "", "Lists all signed up players.", "list", ["Signed Up Players | Total: 3","🛠 - McTsts (@McTsts)","🏹 - venomousbirds  (@venomousbirds )","🦎 - shapechange (@shapechange)"], CMDSTATE.RDY],
        ["list_alphabetical", PERM.AL, "Alternative signed up list.", "", "Lists signed up players, alphabetically and without pinging.", "la", ["Signed Up Players (Alphabetical) | Total: 3","🎨 captain.luffy","⚒️ evilts_","👑 helene.rubycrust"], CMDSTATE.RDY],
        ["list_alive", PERM.AL, "Lists alive players.", "", "Lists all living players.", "alive", ["Alive Players | Total: 3","🛠 - McTsts (@McTsts)","🏹 - venomousbirds  (@venomousbirds )","👌 - federick (@federick)"], CMDSTATE.RDY],
        ["list_dead", PERM.AL, "Lists dead players.", "", "Lists all dead players", "dead", ["Dead Players | Total: 3","🛠 - McTsts (@McTsts)","🦎 - shapechange (@shapechange)","▪️ - e_thsn (@e_thsn)"], CMDSTATE.RDY],
        ["list_substitutes", PERM.AL, "Lists substitute players.", "", "Lists all substitute players", "subs", ["Substitute Players | Total: 3","🛠 - McTsts (@McTsts)","🧋 - thekremblin (@thekremblin)","🎨  - captainluffy (@captainluffy)"], CMDSTATE.RDY],
        ["list_mentors", PERM.AL, "Lists mentors.", "", "Lists all mentors.", "mentors", ["Mentors | Total: 1","🛠 - McTsts (@McTsts) for thekremblin (@thekremblin)"], CMDSTATE.RDY],
        ["emojis", PERM.AL, "Provides an emoji & player ID list.", "", "Gives you a list of emojis and player ids as well as a list of all emojis. Can be used for CC creation.", "emojis", ["🛠 242983689921888256","🦎 458727748504911884","🏹 277156693765390337","🛠 🦎 🏹"], CMDSTATE.RDY],
        // Sign Up Commands
        ["signup", PERM.AL, "Signs you up for the next game.", "<Emoji>", "Signs you up for the next game with emoji <Emoji>, which has to be a valid emoji, that is not used by another player yet. If you have already signedup the command changes your emoji. If no emoji is provided, you are signed out.", "signup 🛠", ["✅ @McTsts signed up with emoji 🛠!"], CMDSTATE.RDY],
        ["j", PERM.AL, "Special variant of signup command.", "<Emoji>", "Behaves like $signup command. For players with a reserved emoji, they can leave out <Emoji> and it will fill it in automatically. If used by a promoted GM they are automatically demoted upon using this command.", "j", ["✅ @McTsts signed up with emoji 🛠!"], CMDSTATE.RDY],
        ["spectate", PERM.AL, "Makes you a spectator.", "", "Makes you a spectator, if you are not a participant and a game is running.", "spectate", ["✅ Attempting to make you a spectator, McTsts!"], CMDSTATE.RDY],
        ["substitute", PERM.AL, "Makes you a substitute player.", "<Emoji>", "Signs you up as a substitute for the next game with emoji <Emoji>, which has to be a valid emoji, that is not used by another player yet. If you have already signedup, signout before using this command.", "substitute 🛠", ["✅ @McTsts is a substitute with emoji 🛠!"], CMDSTATE.RDY],
        ["mentor", PERM.GM, "Sets a player as a mentor.", "<Mentee> <Mentor>", "Assigns a mentor to a mentee.", "substitute � 🛠", ["✅ Setting @mctsts as a mentor for @captainluffy!"], CMDSTATE.RDY],
        /** Stats Module **/
        // options
        ["options", PERM.GM, "Manages options.", "<Option Name> [New Value]", "Returns or sets (if <New Value> is set) the value of a bot option <Option Name>. A bot option can be a numeric id, or an option name.\n\nFor a list of all options run $help options_list", "options mayor", ["✅ mayor currently is set to 588125889611431946!"], CMDSTATE.RDY],
        ["options list", PERM.GM, "Help Page - Options", "", "prefix: The prefix the bot uses for commands\nparticipant: The id of the participant role\ngamemaster: The id of the gamemaster role\nspectator: The id of the spectator role\nsigned_up: The id of the signed up role\ndead_participant: The id of the dead participant role\nbot: The id of the bot role\nlog_guild: The id of the guild to use for logs\nlog_channel: The id of the channel to use for logs\nmayor: The id of the mayor role\nreporter: The id of the reporter role\nguardian: The id of the guardian role\ngame: The name of the game\ngamemaster_ingame: The id of the gamemaster ingame role\nadmin: The id of the admin role\nadmin_ingame: The id of the admin ingame role\nyes_emoji: The id of the yes emoji\nno_emoji: The id of the no emoji\nnew_game_ping: Role that gets pinged with certain commands\ngame_status: A VC that shows the status of the game\ncc_limit: Maximum amount of ccs one person can create (<-10 for none)\nmayor2: The id of the second mayor role (which doesn't give extra votes)\npoll: The poll mode. See $help options polls\nsub: role for substitute players\nping: ping for gifs and deleted messages\nhost: The id of the host role\nfancy_mode: Changes info messages to fancy versions if set to true.\nicon: the version to use for icon images.\nsenior_gamemaster: The id of the senior gm role.\nsenior_gamemaster_ingame: The id of the senior gm ingame role\nrole_filter: The role filter. See $help options role_filter\nhelper: The id of the helper role\nhelper_ingame: The id of the helper ingame role\nmayor_threshold: If there are more players alive than this value, mayor2 role is used.\nhost_log: Logs host pings. Disabled if false.\nautomation_level: level of automation\nghost: ghost role id\nhaunting: true/false for if haunting is enabled\nphase: current phase", "", [""], CMDSTATE.RDY, ["optionslist"]],
        ["options role_filter", PERM.GM, "Help Page - Options - Role Filter", "<Role Filter>", "A complicated option, so it gets a dedicated help page. Set the final value to the sum of all of the following options you want to enable:\n1: Show Default Roles\n2: Show Transformation Roles ('Transformation')\n4: Show Limited Roles ('Limited')\n8: Show Technical Roles ('Technical')\n16: Show Joke Roles ('Joke')\n32: Show Temporary Roles ('Temporary')\n64: Show Mini Wolf Roles ('Mini')\n128: Show Variant Roles ('Variant')\n256: Show Haunted Roles ('Haunted')\n512: Show Deleted Roles ('Archived')\n\nDefault Value: 31\n\nLimited Transformation ('Limited Transformation') Roles are only included if both Limited and Transformation are enabled.", "$options role_filter 23", [""], CMDSTATE.RDY , ["optionsrf","options_rf","options_role_filter","options rf"]],
        ["options poll", PERM.GM, "Help Page - Options - Poll", "<Poll Value>", "A complicated option, so it gets a dedicated help page. Set the final value to the sum of all of the following options you want to enable:\n1: Public Abstain Option\n2: Private Abstain Option\n4: Public Cancel Option\n8: Private Cancel Option\n16: Public Random Option\n32: Private Random Option", "$options poll 33", [""], CMDSTATE.UNK , ["optionspoll","options_poll"]],
        // gamephase
        ["gamephase", PERM.GM, "Manages gamephases.", "[Subcommand]", "Group of commands to handle the gamephase. $help gamephase <sub-command> for detailed help. Also serves as an alias for $gamephase get\n\nList of Gamephases:\nNothing (0), Signups (1), Setup (2), Ingame (3), Postgame (4)", "", [], CMDSTATE.RDY],
            ["gamephase get", PERM.GM, "Gets gamephase.", "Returns the current gamephase.", "gp get", ["✅ Game Phase is INGAME (2)"], CMDSTATE.RDY],
            ["gamephase set", PERM.GM, "Sets gamephase.", "<New Gamephase>", "Sets the gamephase to <Value>, which has to be an integer from 0 to 4.", "gp set 2", ["✅ Game Phase is now INGAME (2)"], CMDSTATE.RDY],
        /** Theme Module **/
        ["theme", PERM.GH, "Manages themes.", "<Subcommand>", "Group of commands to handle renaming roles for themes. $help theme <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["theme remove", PERM.GH, "Removes a theme.", "<Theme Id>", "Removes a theme, deleting all words for the theme.", "theme remove customTheme", ["✅ Removed 'customTheme'!"], CMDSTATE.RDY],
            ["theme list", PERM.GH, "Lists all themes.", "[Theme Id]", "Lists all replaced words for a specific theme, or if no <Theme Id> is set, lists all theme.", "theme list", ["✅ Current Themes: 'customTheme', 'default'!"], CMDSTATE.RDY],
            ["theme select", PERM.GH, "Selects a theme.", "<Theme Id>", "Sets the current theme to <Theme Id>, if set to an invalid theme or 'default', default words are used.", "theme select customTheme", ["✅ Selected 'customTheme' theme!"], CMDSTATE.RDY],
            ["theme query", PERM.GH, "Queries a theme.", "<Theme Id>", "Queries a theme from a theme csv. Before doing so, remove the theme through $theme remove if it already exists.", "theme query customTheme", ["✅ Querying 'customTheme' theme!"], CMDSTATE.RDY],
        /** Whispers Module **/
        ["connection", PERM.GH, "Handles whispers.", "<Subcommand>", "Group of commands to handle connected channels (whispers). $help connection <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["connection add", PERM.GH, "Adds a connection.", "<Connection Name> [Connection Diguise]", "Connects the channel to <Connection Name>. All channels that are connected to the same Connection Name, automatically have all messages copied over to all other channels in the connection, and receive copies from all messages from the other channels in it. If a disguise <Connection Disguise> is set, messages are copied over to other channels using the disguise as a name, instead of the name of a message's author.", "connection add example", ["✅ Added connection example with no disguise!"], CMDSTATE.RDY],
            ["connection remove", PERM.GH, "Removes a connection.", "", "Removes all connections from the current channel.", "connection remove", ["✅ Removed all connections from this channel!"], CMDSTATE.RDY],
            ["connection reset", PERM.GH, "Removes all connections.", "", "Removes all connections from all channels.", "connection reset", [CONF_TXT, "✅ Successfully reset connections!"], CMDSTATE.RDY],
            ["connection send", PERM.GH, "Sends a message through a connection.", "<Connection Name> <Connection Disguise> <Text>", "Send a message <Text> with disguise <Connection Disguise> over a connection <Connection Name>.", "connection send bartender fakebartender hi", [], CMDSTATE.UNK],
        ["impersonate", PERM.GH, "Repeats a message as a webhook pretending to be somebody.", "<User> <Message>", "Repeats a message as a webhook pretending to be a certain user.", "impersonate 242983689921888256 Does this work?", ["Does this work?"], CMDSTATE.UNK],
        /** Abilities Module **/
        ["execute", PERM.GM, "Executes an ability object.", "<Ability JSON>", "Executes a provided ability JSON as the current gm (src_ref=player:<id>, src_name=role:host).", `$execute {"type":"killing","subtype":"kill","target":"@self"}`, ["Kill successful!"], CMDSTATE.RDY],
        ["execute_as", PERM.GM, "Executes an ability object.", "<Ability JSON>", "Executes a provided ability JSON as a set executor. Save an executor with $execute_as_set.", `$execute_as {"type":"killing","subtype":"kill","target":"@self"}`, ["Kill successful!"], CMDSTATE.WIP],
        ["execute_as_set", PERM.GM, "Sets an executor.", "<Src Ref> <Src Name>", "Sets an executor for a $execute_as command.", `$execute_as_set player:242983689921888256 role:citizen`, ["Executor set"], CMDSTATE.WIP],
        ["grant", PERM.GM, "Grants an extra role.", "<Target Player> <Role>", "Grants a specified player a specified role.", `$grant 242983689921888256 corrupted`, [], CMDSTATE.RDY],
        ["emit", PERM.GM, "Emits an event or a trigger.", "<Event / Trigger>", "Emit a trigger or event. When submitting 'start', 'sday' or 'snight' the corresponding event is emitted (each of which includes a series of triggers and other actions), otherwise the input is seen as a trigger.", "emit start", [], CMDSTATE.RDY],
        ["src_emit", PERM.GM, "Emits a trigger for a specific source.", "<Source> <Trigger>", "Emit a trigger for a specific source. Check the WWRF Guide for a list of valid sources.", "src_emit player:242983689921888256 \"End Day\"", [], CMDSTATE.RDY],
        ["chooser", PERM.GM, "Allows GMs to Choice Choose", "<Player>", "Allows a GM to choice choose as the player they have specified.", "chooser mctsts", [], CMDSTATE.WIP],
        /** Attributes Module **/
        ["attributes", PERM.GM, "Manages attributes.", "<Subcommand>", "Group of commands to handle attributes. $help attributes <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["attributes query", PERM.GM, "Queries all attributes from github.", "", "Queries all attributes from github and stores them locally.", "attributes query", ["🔄 Querying attributes. Please wait. This may take several minutes.","✅ Querying attributes completed."], CMDSTATE.RDY],
            ["attributes parse", PERM.GM, "Parses all locally stored attributes.", "", "Parses the formalized description of all attributes and lists any errors.", "attributes parse", ["🔄 Parsing attributes. Please wait. This may take several minutes.","✅ Successfully parsed 35 attributes.","😔 Failed to parse 0 attributes.","✅ Parsing attributes completed."], CMDSTATE.RDY],
            ["attributes get", PERM.GM, "Returns all data for a single attribute.", "<Attribute Name>", "Returns all columns stored for an attributes.", "attributes get wolfish", [], CMDSTATE.RDY],
            ["attributes list", PERM.GM, "Lists all available attributes.", "", "Lists all locally stored attributes.", "attributes list", ["✳️ Sending a list of currently existing attributes:","Wolfish"], CMDSTATE.RDY],
            ["attributes active", PERM.GM, "Lists all active attributes and all their data.", "", "Lists all active attribute instances and all attached data.", "attributes active", ["✳️ Sending a list of currently existing active attributes instances:","AI ID: AttrType - Owner (Duration) [Values] {Source}","1: Custom - @Evil Ts (~Permanent) [wolfish;;;] {Team: Werewolf - Werewolf}"], CMDSTATE.RDY],
            ["attributes search", PERM.GM, "Searches for specific active attributes.", "<Search Column> <Search Value>", "Returns all active attributes and all their attached data where <Search Column> matches <Search Value>. You may also specify two columns (<Search Column> <Search Value> <Search Column #2> <Search Value #2>) or three columns (<Search Column> <Search Value> <Search Column #2> <Search Value #2> <Search Column #3> <Search Value #3>). Allowed <Search Columns> are: owner, owner_type, src_name, src_ref, attr_type, duration, val1, val2, val3, val4, applied_phase, used, target, counter, alive", "attributes search attr_type custom", ["✳️ Sending a list of currently existing active attributes instances that match your search:","AI ID: AttrType - Owner (Duration) [Values] {Source}","1: Custom - @Evil Ts (~Permanent) [wolfish;;;] {Team: Werewolf - Werewolf}"], CMDSTATE.RDY],
            ["attributes delete", PERM.GM, "Deletes an active attribute.", "<Attribute ID>", "Deletes a single active attribute by ID. Use $attributes active to view IDs.", "attributes delete 1", ["✅ Deleted active attribute instance."], CMDSTATE.RDY],
        /** Game Module **/
        // dr
        ["dr", PERM.GM, "Manages saved discord roles.", "<Subcommand>", "Group of commands to handle roles. $help dr <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["dr register", PERM.GM, "Registers a new role.", "<Name> <Discord ID>", "Registers a specific discord role with <Discord ID> under <Name>", "dr register Citizen 584770967058776067", [], CMDSTATE.RDY],
            ["dr delete", PERM.GM, "Deletes a role.", "", "", "", [], CMDSTATE.RDY],
            ["dr list", PERM.GM, "Lists all registered roles.", "", "Lists all currently registered discord roles.", "dr list", [], CMDSTATE.RDY],
            // host information
        ["host_information", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["host_information add", PERM.GM, "Adds host information to a player.", "<Player ID> <HI Name> <HI Value>", "Adds host information for player with <Player ID> and name <HI Name> set to <HI Value>", "hi add 242983689921888256 role citizen", [], CMDSTATE.RDY],
            ["host_information remove", PERM.GM, "Removes host information from a player.", "<HI ID>", "Deletes a host information with <HI ID>. Use $hi list to identify which <HI ID> belongs to what host information.", "hi remove 1", [], CMDSTATE.RDY],
            ["host_information list", PERM.GM, "Lists all configured host information.", "", "Sends a list of all currently configured host information.", "host_information list", [], CMDSTATE.RDY],
        // killq
        ["killq", PERM.GM, "Manages killq and kills players.", "<Subcommand>", "Group of commands to handle polls. $help killq <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["killq list", PERM.GM, "Displays killq.", "", "Shows the players currently in the killq as well as their roles.", "killq list", [], CMDSTATE.RDY],
            ["killq add", PERM.GM, "Adds players to killq.", "<Player List>", "Adds one or more players to the killq.", "killq add mctsts", [], CMDSTATE.RDY],
            ["killq remove", PERM.GM, "Removes players from killq.", "<Player List>", "Removes one or more players from the killq.", "killq remove mctsts", [], CMDSTATE.RDY],
            ["killq clear", PERM.GM, "Clears the killq.", "", "Removes all players from the killq.", "killq clear", [], CMDSTATE.RDY],
            ["killq killall", PERM.GM, "Kills all players in the killq.", "", "Kills all players in the killq and clears the killq.", "killq killall", [], CMDSTATE.RDY],
        ["kqak", PERM.GM, "Immediately kills players.", "<Player List>", "Adds the provided players to the killq ($killq add) and then kills all players on the killq ($killq killall).", "kqak mctsts", [], CMDSTATE.RDY],
        // polls
        ["polls", PERM.GM, "Manages polls.", "<Subcommand>", "Group of commands to handle polls. $help polls <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["polls query", PERM.GM, "Queries all polls from github.", "", "Queries all polls from github and stores them locally.", "polls query", ["🔄 Querying polls. Please wait. This may take several minutes.","✅ Querying polls completed."], CMDSTATE.RDY],
            ["polls parse", PERM.GM, "Parses all locally stored polls.", "", "Parses the formalized description of all polls and lists any errors.", "polls parse", ["🔄 Parsing polls. Please wait. This may take several minutes.","✅ Successfully parsed 35 polls.","😔 Failed to parse 0 polls.","✅ Parsing polls completed."], CMDSTATE.RDY],
            ["polls get", PERM.GM, "Returns all data for a single poll.", "<Poll Name>", "Returns all columns stored for an polls.", "polls get lynch", [], CMDSTATE.RDY],
            ["polls list", PERM.GM, "Lists all available polls.", "", "Lists all locally stored polls.", "polls list", ["✳️ Sending a list of currently existing polls:","Lynch"], CMDSTATE.RDY],
            ["polls active", PERM.GM, "Lists all active polls and all their data.", "", "Lists all active poll instances and all attached data.", "polls active", ["✳️ Sending a list of currently existing active poll instances:","1: Lynch"], CMDSTATE.RDY],
            ["polls delete", PERM.GM, "Deletes an active poll.", "<Poll ID>", "Deletes a single active poll by ID. Use $polls active to view IDs.", "polls delete 1", ["✅ Deleted active poll instance."], CMDSTATE.RDY],
            ["polls new", PERM.GM, "Creats a new poll.", "<Poll Type> <Poll Name>", "Creates a new poll of a specified type with a specified name. See $poll list for available poll types.", "poll new election mayor", [], CMDSTATE.RDY],
            ["polls close", PERM.GM, "Closes a specific poll type.", "<Poll Type>", "Closes all polls of a specific poll type.", "poll close lynch", [], CMDSTATE.RDY],
            ["polls close_all", PERM.GM, "Closes all polls.", "", "Closes all polls.", "poll close_all", [], CMDSTATE.RDY],
        // teams
        ["teams", PERM.GM, "Manages teams.", "<Subcommand>", "Group of commands to handle teams. $help teams <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["teams query", PERM.GM, "Queries all teams from github.", "", "Queries all teams from github and stores them locally.", "teams query", ["🔄 Querying teams. Please wait. This may take several minutes.","✅ Querying teams completed."], CMDSTATE.RDY],
            ["teams parse", PERM.GM, "Parses all locally stored teams.", "", "Parses the formalized description of all teams and lists any errors.", "teams parse", ["🔄 Parsing teams. Please wait. This may take several minutes.","✅ Successfully parsed 35 teams.","😔 Failed to parse 0 teams.","✅ Parsing teams completed."], CMDSTATE.RDY],
            ["teams get", PERM.GM, "Returns all data for a single team.", "<Team Name>", "Returns all columns stored for a teams.", "teams get townsfolk", [], CMDSTATE.RDY],
            ["teams list", PERM.GM, "Lists all available teams.", "", "Lists all locally stored teams (and their category).", "teams list", ["✳️ Sending a list of currently existing teams:","Townsfolk"], CMDSTATE.RDY],
        // locations
        ["locations", PERM.GM, "Manages locations.", "<Subcommand>", "Group of commands to handle locations. $help locations <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["locations query", PERM.GM, "Queries all locations from github.", "", "Queries all locations from github and stores them locally.", "locations query", ["🔄 Querying locations. Please wait. This may take several minutes.","✅ Querying locations completed."], CMDSTATE.RDY],
            ["locations get", PERM.GM, "Returns all data for a single location.", "<Team Name>", "Returns all columns stored for a locations.", "locations get town-square", [], CMDSTATE.RDY],
            ["locations list", PERM.GM, "Lists all available locations.", "", "Lists all locally stored locations (and their category).", "locations list", ["✳️ Sending a list of currently existing locations:","Town-Square"], CMDSTATE.RDY],
        // sheet
        ["sheet", PERM.GM, "Prepares a game.", "", "Group of commands to handle google sheets used for the game. $help sheet <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["sheet prepare", PERM.GM, "Outputs player info for sheet.", "", "", "sheet prepare", [], CMDSTATE.RDY],
            ["sheet prepare_", PERM.GM, "Outputs player info for sheet (alternative).", "", "Same as $sheet prepare, but returns the information in a slightly different format, which works in some countries.", "sheet prepare_", [], CMDSTATE.RDY],
            ["sheet mprepare", PERM.GM, "Outputs player info, comma separated.", "", "Returns the names and ids of all players seperated with commans. Can be used in combination with $sheet mimport on mobile.", "sheet mprepare", [], CMDSTATE.RDY],
            ["sheet import", PERM.GM, "Imports sheet player data.", "<Player Data>", "Sets nicknames and roles of players by pasting in the first four columns of a google sheet for the game (First Column: Name, Second Column: Id, Third Column: Nickname (can be empty), Fourth Column: Role)\nOptionally, more columns with extra roles can be provided for double (or more) role games.", "sheet import\n  steinator	334066065112039425	The Artist	Stalker\n  Vera	277156693765390337	The Hooker	Angel\n  federick	203091600283271169	The Clown	Dog\n  e_thsn	544125116640919557	The Dancer	Citizen\n  captainluffy	234474456624529410	The Captain	Scared Wolf", [], CMDSTATE.RDY],
            ["sheet mimport", PERM.GM, "Imports comma separated player data.", "<Player Data>", "$sheet import variation that can be more easily handwritten. Different values are comma seperated (First Column: Name, Second Column: Id, Third Column: Nickname (can be empty), Fourth Column: Role)\nOptionally, more columns with extra roles can be provided for double (or more) role games.", "sheet import\n  steinator,334066065112039425,The Artist,Stalker\n  Vera,277156693765390337,The Hooker,Angel\n  federick,203091600283271169,The Clown,Dog\n  e_thsn,309072997950554113,The Dancer,Citizen\n  captainluffy,234474456624529410,The Captain,Scared Wolf", [], CMDSTATE.RDY],
        // phase
        ["phase", PERM.GM, "Manage phases.", "", "Group of commands to manage the phases. $help phase <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["phase get", PERM.GM, "Returns the phase.", "", "Returns the current phase.", "phase get", [], CMDSTATE.RDY],
            ["phase set", PERM.GM, "Sets the phase.", "<New Phase>", "Allows direct manipulation of the current phase.", "phase set d1", [], CMDSTATE.RDY],
            ["phase next", PERM.GM, "Increments the phase", "", "Goes to the next phase. Generally you should be using $phase switch in regular games instead.", "phase next", [], CMDSTATE.RDY],
            ["phase switch", PERM.GM, "Performs a full phase switch.", "", "Switches to locked subphase and then goes to the next phase. If the subphase is not yet late it first switches to late.", "phase switch", [], CMDSTATE.RDY],
            ["phase main", PERM.GM, "Sets subphase to main.", "", "Sets the subphase to main - the default phase.", "phase main", [], CMDSTATE.RDY],
            ["phase late", PERM.GM, "Sets subphase to late.", "", "Sets the subphase to late - abilities can no longer be delayed.", "phase late", [], CMDSTATE.RDY],
            ["phase lock", PERM.GM, "Sets subphase to lock.", "", "Sets the subphase to lock - new abilities can no longer be submitted.", "phase lock", [], CMDSTATE.RDY],
        // gamestate changers
        ["start", PERM.GM, "Starts a game.", "", "Starts the game. Assigns Participant to all signed up players, and takes away the signed up role. Sends out role messages. Creates public channels. Creates Secret Channels. Sends info messages in secret channels. Sets the gamephase.", "start", [], CMDSTATE.RDY],
        ["check_start", PERM.GM, "Checks if a game can be started.", "", "Checks if the game can be started.", "check_start", ["✅ The game is ready to start."], CMDSTATE.RDY],
        ["start_debug", PERM.GM, "Starts a game (Debug Mode).", "", "Does the same as $start, but does not send out role messages.", "start_debug", [], CMDSTATE.RDY],
        ["reset", PERM.GM, "Resets a game.", "", "Resets the game. Resets all discord roles. Clears player database. Deletes all CCs. Deletes all SCs. Deletes all Public Channels. Resets Polls. Resets Connections. Sets the gamephase.", "reset", [], CMDSTATE.RDY],
        ["reset_debug", PERM.GM, "Resets a game (Debug Mode).", "", "Does the same as $reset, but keeps all players as signed up.", "reset_debug", [], CMDSTATE.RDY],
        ["end", PERM.GM, "Ends a game.", "", "Ends the game. Sets the gamephase, and makes all Participants Dead Participants.", "end", [], CMDSTATE.RDY],
        ["open", PERM.GM, "Opens signups and notifies players.", "", "Opens signups, then makes New Game Ping role mentionable, pings it and then makes it unmentionable again.", "open", [], CMDSTATE.RDY],
        ["close", PERM.GM, "Closes signups.", "", "Closes signups.", "close", [], CMDSTATE.RDY],
        ["gameping", PERM.GM, "Ping New Game Ping role.", "", "Makes New Game Ping role mentionable, pings it and then makes it unmentionable again.", "gameping", [], CMDSTATE.RDY],
        // promote / demote
        ["promote", PERM.GH, "Reassigns GM roles.", "", "Replaces GM Ingame and Admin Ingame roles with Game Master and Admin roles.", "promote", ["✅ Attempting to demote you, McTsts!"], CMDSTATE.RDY],
        ["demote", PERM.GH, "Removes GM roles.", "", "Replaces Game Master and Admin roles with GM Ingame and Admin Ingame roles, which have no permisions", "demote", ["✅ Attempting to promote you, McTsts!"], CMDSTATE.RDY],
        ["host", PERM.GH, "Adds Host role.", "", "Adds Host role.", "host", ["✅ Attempting to host you, McTsts!"], CMDSTATE.RDY],
        ["unhost", PERM.GH, "Removes Host roles.", "", "Removes Host role.", "unhost", ["✅ Attempting to unhost you, McTsts!"], CMDSTATE.RDY],
        ["promote_host", PERM.GH, "Promotes or Hosts.", "", "Promotes or hosts depending on context.", "promote_host", [], CMDSTATE.RDY],
        ["demote_unhost", PERM.GH, "Demotes or Unhosts.", "", "Demotes or unhosts depending on context.", "demote_unhost", [], CMDSTATE.RDY],
        ["force_demote_all", PERM.AD, "Demotes all non-hosts.", "", "Demotes all non-hosts.", "force_demote_all", [], CMDSTATE.RDY],
        ["force_demote_signedup", PERM.GM, "Demotes everyone that's signedup.", "", "Demotes all signedups. Also includes substitutes.", "force_demote_signedup", [], CMDSTATE.RDY],
        /** Players Module **/
        // packs
        ["packs", PERM.AL, "Manages skinpacks.", "<Subcommand>", "Group of commands to handle skinpacks. $help packs <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["packs list", PERM.AL, "Lists your available skinpacks.", "", "Lists the skinpacks you have currently unlocked.", "packs list", [], CMDSTATE.RDY],
            ["packs list_all", PERM.GM, "Lists all available skinpacks.", "", "Lists all skinpacks the bot knows.", "packs list_all", [], CMDSTATE.RDY],
            ["packs set", PERM.GM, "Sets skinpack for another player.", "<Player> <Pack ID>", "Sets the skinpack for another player. Find <Pack ID> through $packs list.", "packs set mctsts 1", [], CMDSTATE.RDY],
            ["packs unlock", PERM.GM, "Unlocks skinpack for another player.", "<Player> <Pack ID>", "Unlocks the skinpack for another player. Find <Pack ID> through $packs list_all.", "packs unlock mctsts 1", [], CMDSTATE.RDY],
            ["packs delete", PERM.GM, "Deletes skinpack for another player.", "<Player> <Pack ID>", "Deeltes the skinpack for another player. Find <Pack ID> through $packs list_all.", "packs delete mctsts 1", [], CMDSTATE.RDY],
            ["packs select", PERM.AL, "Selects your own skinpack.", "<Pack ID>", "Sets the skinpack for you. Find <Pack ID> through $packs list.", "packs select 1", [], CMDSTATE.RDY],
        /** Roles Module **/
        // roles
        ["roles", PERM.GM, "Manages roles.", "<Subcommand>", "Group of commands to handle roles. $help roles <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["roles query", PERM.GM, "Queries all roles from github.", "", "Queries all roles from github and stores them locally.", "roles query", ["🔄 Querying roles. Please wait. This may take several minutes.","✅ Querying roles completed."], CMDSTATE.RDY],
            ["roles parse", PERM.GM, "Parses all locally stored roles.", "", "Parses the formalized description of all roles and lists any errors.", "roles parse", ["🔄 Parsing roles. Please wait. This may take several minutes.","✅ Successfully parsed 35 roles.","😔 Failed to parse 0 roles.","✅ Parsing roles completed."], CMDSTATE.RDY],
            ["roles get", PERM.GM, "Returns all data for a single role.", "<Role Name>", "Returns all columns stored for a roles.", "roles get citizen", [], CMDSTATE.RDY],
            ["roles list", PERM.GM, "Lists all available roles.", "", "Lists all locally stored roles (and their category).", "roles list", ["✳️ Sending a list of currently existing roles:","Citizen (TM)"], CMDSTATE.RDY],
            ["roles list_names", PERM.GM, "Lists all available role names.", "", "Lists all locally stored roles (names only).", "roles list_names", ["✳️ Sending a list of currently existing role names:","Citizen"], CMDSTATE.RDY],
        // infomanage
        ["infomanage", PERM.GM, "Manages info messages.", "<Subcommand>", "Group of commands to handle info messages. $help infomanage <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
           ["infomanage query", PERM.GM, "Queries all info messages from github.", "", "Queries all info messages from github and stores them locally.", "infomanage query", ["🔄 Querying info messages. Please wait. This may take several minutes.","✅ Querying info messages completed."], CMDSTATE.RDY],
            ["infomanage get", PERM.GM, "Returns all data for a single info message.", "<Info Message Name>", "Returns all columns stored for an info message.", "infomanage get ability", [], CMDSTATE.RDY],
            ["infomanage list", PERM.GM, "Lists all available info messages.", "", "Lists all locally stored info messages.", "infomanage list", ["✳️ Sending a list of currently existing info messages:","Ability (Werewolves Revamped)"], CMDSTATE.RDY],
        // displays
        ["displays", PERM.GM, "Manages displays.", "<Subcommand>", "Group of commands to handle displays. $help displays <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
           ["displays query", PERM.GM, "Queries all displays from github.", "", "Queries all displays from github and stores them locally.", "displays query", ["🔄 Querying displays. Please wait. This may take several minutes.","✅ Querying displays completed."], CMDSTATE.RDY],
            ["displays get", PERM.GM, "Returns all data for a single display.", "<Displays Name>", "Returns all columns stored for a display.", "displays get knives", [], CMDSTATE.RDY],
            ["displays list", PERM.GM, "Lists all available displays.", "", "Lists all locally stored displays.", "displays list", ["✳️ Sending a list of currently existing displays:","Knives"], CMDSTATE.RDY],
            ["displays active", PERM.GM, "Lists all active displays.", "", "Lists all currently active displays.", "displays active", ["✳️ Sending a list of currently active displays:","Knives"], CMDSTATE.RDY],
        // groups
        ["groups", PERM.GM, "Manages groups.", "<Subcommand>", "Group of commands to handle groups. $help groups <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
            ["groups query", PERM.GM, "Queries all groups from github.", "", "Queries all groups from github and stores them locally.", "groups query", ["🔄 Querying groups. Please wait. This may take several minutes.","✅ Querying groups completed."], CMDSTATE.RDY],
            ["groups parse", PERM.GM, "Parses all locally stored groups.", "", "Parses the formalized description of all groups and lists any errors.", "groups parse", ["🔄 Parsing groups. Please wait. This may take several minutes.","✅ Successfully parsed 35 groups.","😔 Failed to parse 0 groups.","✅ Parsing groups completed."], CMDSTATE.RDY],
            ["groups get", PERM.GM, "Returns all data for a single group.", "<Group Name>", "Returns all columns stored for an groups.", "groups get wolfpack", [], CMDSTATE.RDY],
            ["groups list", PERM.GM, "Lists all available groups.", "", "Lists all locally stored groups.", "groups list", ["✳️ Sending a list of currently existing groups:","Wolfpack (Werewolf)"], CMDSTATE.RDY],
            ["groups active", PERM.GM, "Lists all active groups and all their data.", "", "Lists all active group instances and all attached data.", "groups active", ["✳️ Sending a list of currently existing active group instances:","1: Wolfpack (#wolfpack)"], CMDSTATE.RDY],
            ["groups delete", PERM.GM, "Deletes an active group.", "<Group ID>", "Deletes a single active group by ID. Use $groups active to view IDs.", "groups delete 1", ["✅ Deleted active group instance."], CMDSTATE.RDY],
            ["groups getprop", PERM.GM, "Gets an active group value.", "<Property> <Group ID>", "Retrieves a specific group property.", "groups getprop counter", ["✅ wolfpack's counter is 0!"], CMDSTATE.RDY],
            ["groups set", PERM.GM, "Sets an active group value.", "<Property> <Group ID>", "Retrieves a specific group property.", "groups set counter 1", ["✅ wolfpack's counter value now is 1!"], CMDSTATE.RDY],
        // sets
        ["sets", PERM.GM, "Manages ability sets.", "<Subcommand>", "Group of commands to handle ability sets. $help sets <sub-command> for detailed help.", "", [], CMDSTATE.RDY],
           ["sets query", PERM.GM, "Queries all ability sets from github.", "", "Queries all ability sets from github and stores them locally.", "sets query", ["🔄 Querying ability sets. Please wait. This may take several minutes.","✅ Querying ability sets completed."], CMDSTATE.RDY],
            ["sets get", PERM.GM, "Returns all data for a single ability set.", "<Ability Set Name>", "Returns all columns stored for an ability set.", "sets get lycan", [], CMDSTATE.RDY],
            ["infomanage list", PERM.GM, "Lists all available info messages.", "", "Lists all locally stored info messages.", "infomanage list", ["✳️ Sending a list of currently existing info messages:","Lycan"], CMDSTATE.RDY],
        // alias
        ["alias", PERM.AL, "Manages aliases.", "<Subcommand>", "Group of commands to handle alias. $help alias <sub-command> for detailed help.", "", [], CMDSTATE.UNK],
            ["alias set", PERM.AL, "Creates a new alias.", "<Alias> <Target>", "Creates an alias that redirect <Alias> to <Target>", "alias add villager citizen", [], CMDSTATE.UNK, ["alias add"]],
            ["alias remove", PERM.AL, "Deletes a alias.", "<Alias>", "Deletes a specific aliases.", "alias remove villager", [], CMDSTATE.UNK],
            ["alias clear", PERM.AL, "Deletes all aliases.", "", "Deletes all existing aliases.", "alias clear", [], CMDSTATE.UNK],
            ["alias list", PERM.AL, "Lists all aliases.", "", "Lists all existing aliases, sorted by their target.", "alias list", [], CMDSTATE.RDY],
        // info commands
        ["info", PERM.AL, "Returns role info (simplified).", "<Role Name>", "Shows the description of a role (simplified).", "info citizen", [], CMDSTATE.RDY],
        [".", PERM.AL, "Returns role info (simplified/temporary).", "<Role Name>", "Shows the description of a role (simplified) and deletes it after a few minutes.", ".citizen", [], CMDSTATE.RDY, [], CMDARGS.NO_PREFIX],
        ["details", PERM.AL, "Returns role info (detailed).", "<Role Name>", "Shows the description of a role (detailed).", "details citizen", [], CMDSTATE.RDY],
        [";", PERM.AL, "Returns role info (detailed/temporary).", "<Role Name>", "Shows the description of a role (detailed) and deletes it after a few minutes.", ";citizen", [], CMDSTATE.RDY, [], CMDARGS.NO_PREFIX],
        ["info_technical", PERM.AL, "Returns formalized role info.", "<Role Name>", "Shows the formalized description of a role.", "info_technical citizen", [], CMDSTATE.RDY],
        ["~", PERM.AL, "Returns formalized role info (temporary).", "<Role Name>", "Shows the formalized description of a role and deletes it after a few minutes.", "~citizen", [], CMDSTATE.RDY, [], CMDARGS.NO_PREFIX],
        ["infopin", PERM.GM, "Returns role info & pins the message.", "<Role Name>", "Shows the description of a role, pins it and deletes the pinning message.", "infopin citizen", [], CMDSTATE.RDY],
        ["infoedit", PERM.GM, "Edits a bot info message.", "<Message ID> <Role Name> [Addition]", "Updates an info message in the current channel. Optionally specify contents to append to the info message.", "infoedit 14901984562573 citizen", [], CMDSTATE.NOP],
        ["infoadd", PERM.GM, "Returns role info with additional text.", "<Role Name> <Addition>", "Sends an info message with an appended addition.", "infoadd citizen EXTRATEXT", [], CMDSTATE.NOP],
        ["card", PERM.AL, "Returns a role's card.", "<Role Name>", "Shows the role's card.", "card citizen", [], CMDSTATE.WIP, ["& (Special Alias - Use without Prefix)"], CMDARGS.NO_PREFIX_SUB],
        ["image", PERM.AL, "Returns a role's image.", "<Role Name>", "Shows the role's image.", "image cititen", [], CMDSTATE.RDY],
        // elect
        ["elect", PERM.GM, "Elects a player to a role.", "<Elected Role> <Player>", "Elects a player to an elected role. Elected Role available are: Mayor, Reporter, Guardian. You can use M, R and G to shorten the command.\nUse elect clear to remove all elected roles from a player.", "elect mayor ts", ["✅ Elected @Ts as @Mayor (<=15)"], CMDSTATE.UNK],
        // link/parse
        ["update", PERM.GM, "Syncs the bot to github.", "", "Pulls all data from github and reparses all elements.", "update", [], CMDSTATE.RDY],
        ["parse", PERM.GM, "Parses a specific element.", "<Element Type> <Element Name>", "Parses a specific element of type <Element Type> with name <Element Name>", "parse roles citizen", [], CMDSTATE.RDY],
    ];
    
    this.getCommandHelp = function(cmd, member) {
        let cmdData = COMMANDS.find(el => el[0] === cmd);
        
        if(!cmdData) return "```yaml\nInformation\n\nThis command can not be found.\n```";
        
        // permission check
        if(isAdmin(member) && cmdData[1] > PERM.AD) return "```yaml\nInformation\n\nThis command can not be used.\n```";
        else if(!isAdmin(member) && isSenior(member) && cmdData[1] > PERM.SG) return "```yaml\nInformation\n\nThis command is only available to admins or higher.\n```";
        else if(!isAdmin(member) && !isSenior(member) && isGameMaster(member) && cmdData[1] > PERM.GM) return "```yaml\nInformation\n\nThis command is only available to senior game masters or higher.\n```";
        else if(!isAdmin(member) && !isSenior(member) && !isGameMaster(member) && isHelper(member) && cmdData[1] > PERM.GH) return "```yaml\nInformation\n\nThis command is only available to game masters or higher.\n```";
        else if (!isAdmin(member) && !isSenior(member) && !isGameMaster(member) && !isHelper(member) && cmdData[1] > PERM.AL) return "```yaml\nInformation\n\nThis command is only available to game masters, helpers or higher.\n```";
        
        // prefix check
        let cmdPrefix = stats.prefix;
        let cmdSubPrefix = stats.prefix;
        let argSpace = " ";
        if(cmdData[9]) {
            switch(cmdData[9]) {
                case CMDARGS.NO_PREFIX: cmdPrefix = ""; cmdSubPrefix = ""; argSpace = ""; break;
                case CMDARGS.NO_PREFIX_SUB: cmdSubPrefix = ""; break;
            }
        }
        
        if(cmdData[4].length === 0 && cmdData[2].length > 0) cmdData[4] = cmdData[2];
        let aliases = getAliases(cmd);
        if(!aliases) aliases = [];
        if(cmdData[8] && cmdData[8].length > 0) aliases.push(...cmdData[8]);
        let helpStr = "";
        // Syntax
        helpStr += "```yaml\nSyntax\n\n" + cmdPrefix + cmdData[0] + argSpace + cmdData[3] + "\n```";
        // Functionality
        if(cmdData[4].length > 0) helpStr += "```\nFunctionality\n\n" + cmdData[4].replace(/\$/g, cmdPrefix) + "\n```";
        // Usage
        if(cmdData[5].length > 0) helpStr += "```fix\nUsage\n\n> " + cmdPrefix + cmdData[5] + "\n";
        if(cmdData[5].length > 0 && cmdData[6].length > 0) helpStr += "< "+ cmdData[6].join("\n< ") + "```";
        else if(cmdData[5].length > 0 && !cmdData[6].length > 0) helpStr += "```";
        // Aliases
        if(aliases.length > 0) helpStr += "```diff\nAliases\n\n- " + aliases.join("\n- ") + "\n```";
        // Subcommands
        let subCommands = COMMANDS.filter(el => {
            let elSplit = el[0].split(" ");
            return elSplit[0] === cmd && elSplit.length > 1;
        }); // get primary commands only
        if(isAdmin(member)) subCommands = subCommands.filter(el => el[1] <= PERM.AD);
        else if(isSenior(member)) subCommands = subCommands.filter(el => el[1] <= PERM.SG);
        else if(isGameMaster(member)) subCommands = subCommands.filter(el => el[1] <= PERM.GM);
        else if(isHelper(member)) subCommands = subCommands.filter(el => el[1] <= PERM.GH);
        else subCommands = subCommands.filter(el => el[1] <= PERM.AL);
        if(subCommands.length > 0) helpStr += "```diff\nSubcommands\n\n- " + subCommands.map(el => cmdSubPrefix + el[0]).join("\n- ") + "\n```";
        // Warnings
        if(cmdData[7] === 1) helpStr += "**```fix\nWarning\n\nThis command is currently in development and may be subject to change.\n```**";
        else if(cmdData[7] === 2) helpStr += "**__```diff\nWarning\n\n- This command is currently unavailable or broken -\n```__**";
        else if(cmdData[7] === 3) helpStr += "**__```diff\nWarning\n\n- The status of this command is not known -\n```__**";
        return helpStr;
    }
	
}
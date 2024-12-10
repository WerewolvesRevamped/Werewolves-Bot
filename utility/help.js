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
            let cmdHelpText = getCommandHelp(cmdName);
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
            let allCommandTexts = commandsFiltered.map(el => stats.prefix + el[0] + " - " + el[2]);
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
        AD: 4 // admins and higher
    };
    this.CMDSTATE = {
       RDY: 0, // ready
       WIP: 1, // wip
       NOP: 2, // gone
       UNK: 3, // unknown
    };
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
        ["drag", PERM.GM, "Pulls all living players into a hardcoded townsquare VC.", "", "", "drag", [], CMDSTATE.WIP],
        ["drag_dead", PERM.GM, "Pulls all living players into a hardcoded deadspectator VC.", "", "", "drag_dead", [], CMDSTATE.WIP],
        ["force_reload", PERM.GM, "", "", "", "", [], CMDSTATE.WIP],
        ["sql_reload", PERM.SG, "", "", "", "", [], CMDSTATE.WIP],
        ["embed", PERM.AL, "", "", "", "", [], CMDSTATE.WIP],
        ["j", PERM.AL, "Special variant of signup command.", "<Emoji>", "Behaves like $signup command. For players with a reserved emoji, they can leave out <Emoji> and it will fill it in automatically. If used by a promoted GM they are automatically demoted upon using this command.", "j", ["✅ @McTsts signed up with emoji 🛠!"], CMDSTATE.RDY],
        /** Utility Commands **/
        ["help", PERM.AL, "Provides information about commands.", "<Command> [Sub-Command(s)]", "Provides help for a command (with subcommands)", "help help", [], CMDSTATE.RDY],
        ["ping", PERM.AL, "Tests the bot", "", "Gives the ping of the bot, and checks if the bot is running.", "ping", ["✅ Pong! Latency is 170ms. API Latency is 128ms"], CMDSTATE.RDY],
        ["edit", PERM.GH, "Edits a bot message.", "<id> <text>", "Updates a bot message.", "edit 28462946294 NewMsgContents", [], CMDSTATE.UNK],
        ["say", PERM.GH, "Makes the bot repeat a message.", "[input]", "Makes the bot repeat everything after say.", "say hello", ["hello"], CMDSTATE.RDY],
        ["modify", PERM.GH, "Modifies the bot.", "<attribute> <value>", "Updates an <attribute> of the bot to <value>. Available attributes: status, nickname, activity.", "modify status dnd", ["✅ Updated bot status!"], CMDSTATE.RDY],
        ["split", PERM.GM, "Runs a list of semicolon seperated commands.", "[command list]", "Runs a list of commands that are provided as a semicolon seperated list.", "split help;ping", [], CMDSTATE.RDY],
        ["bulkdelete", PERM.GH, "Deletes webhook & user messages in bulk", "", "Deletes webhook/user messages (but not bot messages) in bulk from a channel.", "bulkdelete", [CONF_TXT,"✅ Deleted 17 messages."], CMDSTATE.RDY],
        ["delete", PERM.GH, "Deletes a couple of messages.", "[0-5]", "Deletes the last up to five messages from a channel.", "delete 3", ["✅ Deleted 3 messages."], CMDSTATE.RDY],
        ["delay", PERM.GH, "Executes a command with delay.", "<Delay> <Command>", "Executes a command with delay in seconds.", "delay 5 ping", ["✅ Pong! Latency is 990ms. API Latency is 114ms"], CMDSTATE.RDY],
        ["temp", PERM.AL, "Converts between °C and °F.", "[f|c] <value>", "Converts into the specified unit.", "temp f 0", ["🌡️ 0 °C in Fahrenheit: 32 °F"], CMDSTATE.RDY],
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
        ["players", PERM.GM, "Manages players.", "<Subcommand>", `Group of commands to handle playerss. Use $help players <subcommand> for detailed help.`, "", [], CMDSTATE.RDY],
            ["players get", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players get_clean", PERM.GM, "", "", "", "", [], CMDSTATE.UNK],
            ["players set", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players resurrect", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players signup", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players signsub", PERM.GM, "", "", "", "", [], CMDSTATE.RDY, ["players signsub"]],
            ["players substitute", PERM.GM, "", "", "", "", [], CMDSTATE.RDY, ["players sub"]],
            ["players switch", PERM.GM, "", "", "", "", [], CMDSTATE.NOP],
            ["players list", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players list_alive", PERM.GM, "", "", "", "", [], CMDSTATE.UNK],
            ["players roles", PERM.GM, "", "", "", "", [], CMDSTATE.RDY, ["players rl"]],
            ["players log", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players log2", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players log3", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players log4", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players votes", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
            ["players messages", PERM.GM, "", "", "", "", [], CMDSTATE.RDY, ["players msgs"]],
            ["players messages2", PERM.GM, "", "", "", "", [], CMDSTATE.RDY, ["players msgs2"]],
        ["roll", PERM.AL, "Randomizes", "", "", "", [], CMDSTATE.RDY],
            ["roll whitelist", PERM.AL, "", "", "", "", [], CMDSTATE.RDY, ["roll wl"]],
            ["roll blacklist", PERM.AL, "", "", "", [], CMDSTATE.RDY, ["roll bl"]],
            ["roll number", PERM.AL, "", "", "", [], CMDSTATE.RDY, ["roll num"]],
            ["roll ?d?", PERM.AL, "", "", "", [], CMDSTATE.RDY],
        
        ["signup", PERM.AL, "Signs you up for the next game.", "", "", "", [], CMDSTATE.RDY],
        
        ["kqak", PERM.GM, "Immediately kills players.", "<Player List>", "Adds the provided players to the killq ($killq add) and then kills all players on the killq ($killq killall).", "kqak mctsts", [], CMDSTATE.UNK],
        ["modrole", PERM.AL, "Adds/removes roles from users.", "<Subcommand>", "See $help modrole <subcommand>.", "", [], CMDSTATE.NOP],
            ["modrole add", PERM.AL, "Adds roles from users.", "<User ID> <Role ID>", "Adds a role to a user.", "modrole add 242983689921888256 584770967058776067", ["✅ Added Bot Developer to @McTsts (Ts)!"], CMDSTATE.NOP],
            ["modrole remove", PERM.AL, "Removes roles from users.", "<User ID> <Role ID>", "Removes a role from a user.", "modrole remove 242983689921888256 584770967058776067", ["✅ Removed Bot Developer from @McTsts (Ts)!"], CMDSTATE.NOP],
        
        
        ["list_signedup", PERM.AL, "Lists signed up players.", "", "Lists all signed up players.", "list", ["Signed Up Players | Total: 3","🛠 - McTsts (@McTsts)","🤔 - marhjo (@marhjo)","👌 - federick (@federick)"], CMDSTATE.RDY],
        ["list_alphabetical", PERM.AL, "Lists signed up players, alphabetically and without pinging.", "", "", "", [], CMDSTATE.RDY],
        ["list_alive", PERM.AL, "Lists alive players.", "", "", "", [], CMDSTATE.RDY],
        ["list_dead", PERM.AL, "Lists dead players.", "", "", "", [], CMDSTATE.RDY],
        ["list_substitutes", PERM.AL, "Lists substitute players.", "", "", "", [], CMDSTATE.RDY],
        ["emojis", PERM.AL, "Provides an emoji & player ID list.", "", "", "", [], CMDSTATE.RDY],
        ["spectate", PERM.AL, "Makes you a spectator.", "", "Makes you a spectator, if you are not a participant and a game is running.", "spectate", ["✅ Attempting to make you a spectator, McTsts!"], CMDSTATE.RDY],
        ["substitute", PERM.AL, "Makes you a substitute player.", "<Emoji>", "Signs you up as a substitute for the next game with emoji <Emoji>, which has to be a valid emoji, that is not used by another player yet. If you have already signedup, signout before using this command.", "substitute 🛠", ["✅ @McTsts is a substitute with emoji 🛠!"], CMDSTATE.RDY],
        
        /** WIP **/
        
        ["image", PERM.AL, "", "", "", "", [], CMDSTATE.NOP],
        ["card", PERM.AL, "", "", "", "", [], CMDSTATE.WIP],
        ["emit", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["execute", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["parse", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["phase", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["gamephase", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["connection", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["roles", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["infomanage", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["groups", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["attributes", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["sets", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["locations", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["polls", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["teams", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["update", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["info", PERM.AL, "", "", "", "", [], CMDSTATE.RDY],
        ["details", PERM.AL, "", "", "", "", [], CMDSTATE.RDY],
        ["info_technical", PERM.AL, "", "", "", "", [], CMDSTATE.RDY],
        ["infopin", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["infoedit", PERM.GM, "", "", "", "", [], CMDSTATE.NOP],
        ["infoadd", PERM.GM, "", "", "", "", [], CMDSTATE.NOP],
        ["options", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["start", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["start_debug", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["reset", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["reset_debug", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["end", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["sheet", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["killq", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["pg", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["ps", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["pr", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["impersonate", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["promote", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["demote", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["force_demote_all", PERM.AD, "", "", "", "", [], CMDSTATE.RDY],
        ["force_demote_signedup", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["host", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["unhost", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["promote_host", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["demote_unhost", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["theme", PERM.GH, "", "", "", "", [], CMDSTATE.RDY],
        ["gameping", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["open", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["close", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["elect", PERM.GM, "", "", "", "", [], CMDSTATE.UNK],
        ["dr", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["host_information", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["packs", PERM.GM, "", "", "", "", [], CMDSTATE.WIP],
    ];
    
    this.getCommandHelp = function(cmd) {
        let cmdData = COMMANDS.find(el => el[0] === cmd);
        if(cmdData[4].length === 0 && cmdData[2].length > 0) cmdData[4] = cmdData[2];
        let aliases = getAliases(cmd);
        if(!aliases) aliases = [];
        if(cmdData[8] && cmdData[8].length > 0) aliases.push(...cmdData[8]);
        let helpStr = "";
        // Syntax
        helpStr += "```yaml\nSyntax\n\n" + stats.prefix + cmdData[0] + "\n```";
        // Functionality
        if(cmdData[4].length > 0) helpStr += "```\nFunctionality\n\n" + cmdData[4].replace(/\$/g, stats.prefix) + "\n```";
        // Usage
        if(cmdData[5].length > 0) helpStr += "```fix\nUsage\n\n> " + stats.prefix + cmdData[5] + "\n";
        if(cmdData[5].length > 0 && cmdData[6].length > 0) helpStr += "< "+ cmdData[6].join("\n< ") + "```";
        else if(cmdData[5].length > 0 && !cmdData[6].length > 0) helpStr += "```";
        // Aliases
        if(aliases.length > 0) helpStr += "```diff\nAliases\n\n- " + aliases.join("\n- ") + "\n```";
        // Subcommands
        let subCommands = COMMANDS.filter(el => {
            let elSplit = el[0].split(" ");
            return elSplit[0] === cmd && elSplit.length > 1;
        }); // get primary commands only
        if(subCommands.length > 0) helpStr += "```diff\nSubcommands\n\n- " + subCommands.map(el => stats.prefix + el[0]).join("\n- ") + "\n```";
        // Warnings
        if(cmdData[7] === 1) helpStr += "**```fix\nWarning\n\nThis command is currently in development and may be subject to change.\n```**";
        else if(cmdData[7] === 2) helpStr += "**__```diff\nWarning\n\n- This command is currently unavailable or broken -\n```__**";
        else if(cmdData[7] === 3) helpStr += "**__```diff\nWarning\n\n- The status of this command is not known -\n```__**";
        return helpStr;
    }
	
}
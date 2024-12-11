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
        // Players
        ["players", PERM.GM, "Manages players.", "<Subcommand>", `Group of commands to handle playerss. Use $help players <subcommand> for detailed help. \n\nList of Player Properties:\nalive: Whether the player is alive\ntype: What type of player. Can be 'player', 'substitute' and 'substituted'.\nemoji: The emoji the player uses\nrole: The role of the player\nid: The discord id of the player\nccs: the amount of created ccs\npublic_msgs: Amount of messages sent in public channels\nprivate_msgs: Amount of messages sent in private channels.`, "", [], CMDSTATE.RDY],
            ["players get", PERM.GM, "Returns a property for a player.", "<Property> <Player>", "Returns the value of <Player Property> for a player indentified with <Player>. For a list of player properties see $help players.", "players get alive mctsts", ["✅ McTsts's alive value is 1!"], CMDSTATE.RDY, ["pg"]],
            ["players get_clean", PERM.GM, "Alternative version of get subcommand.", "<Property> <Player>", "Same as get, but shows roles in a more player friendly way.", "players get_clean alive mctsts", ["✅ McTsts's alive value is 1!"], CMDSTATE.UNK],
            ["players set", PERM.GM, "Updates a player's property.", "<Property> <Player>", "Sets the value of <Player Property> for a player indentified with <Player> to <Value>. For a list of player properties see $help players.", "players set role mctsts baker", ["✅ McTsts's role value now is baker!"], CMDSTATE.RDY, ["ps"]],
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
            ["players log4", PERM.GM, "Returns player info in a specific format for log.", "", "Lists all players with their role sorted by alive status. Can be used as a base for the final results message. Differs from log3 in that it also contains emojis.", "", [], CMDSTATE.RDY],
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
        ["modrole", PERM.AL, "Adds/removes roles from users.", "<Subcommand>", "See $help modrole <subcommand>.", "", [], CMDSTATE.NOP],
            ["modrole add", PERM.AL, "Adds roles from users.", "<User ID> <Role ID>", "Adds a role to a user.", "modrole add 242983689921888256 584770967058776067", ["✅ Added Bot Developer to @McTsts (Ts)!"], CMDSTATE.NOP],
            ["modrole remove", PERM.AL, "Removes roles from users.", "<User ID> <Role ID>", "Removes a role from a user.", "modrole remove 242983689921888256 584770967058776067", ["✅ Removed Bot Developer from @McTsts (Ts)!"], CMDSTATE.NOP],
        // List Commands
        ["list_signedup", PERM.AL, "Lists signed up players.", "", "Lists all signed up players.", "list", ["Signed Up Players | Total: 3","🛠 - McTsts (@McTsts)","🏹 - venomousbirds  (@venomousbirds )","🦎 - shapechange (@shapechange)"], CMDSTATE.RDY],
        ["list_alphabetical", PERM.AL, "Alternative signed up list.", "", "Lists signed up players, alphabetically and without pinging.", "la", ["Signed Up Players (Alphabetical) | Total: 3","🎨 captain.luffy","⚒️ evilts_","👑 helene.rubycrust"], CMDSTATE.RDY],
        ["list_alive", PERM.AL, "Lists alive players.", "", "Lists all living players.", "alive", ["Alive Players | Total: 3","🛠 - McTsts (@McTsts)","🏹 - venomousbirds  (@venomousbirds )","👌 - federick (@federick)"], CMDSTATE.RDY],
        ["list_dead", PERM.AL, "Lists dead players.", "", "Lists all dead players", "dead", ["Dead Players | Total: 3","🛠 - McTsts (@McTsts)","🦎 - shapechange (@shapechange)","▪️ - e_thsn (@e_thsn)"], CMDSTATE.RDY],
        ["list_substitutes", PERM.AL, "Lists substitute players.", "", "Lists all substitute players", "subs", ["Substitute Players | Total: 3","🛠 - McTsts (@McTsts)","🧋 - thekremblin (@thekremblin)","🎨  - captainluffy (@captainluffy)"], CMDSTATE.RDY],
        ["emojis", PERM.AL, "Provides an emoji & player ID list.", "", "Gives you a list of emojis and player ids as well as a list of all emojis. Can be used for CC creation.", "emojis", ["🛠 242983689921888256","🦎 458727748504911884","🏹 277156693765390337","🛠 🦎 🏹"], CMDSTATE.RDY],
        // Sign Up Commands
        ["signup", PERM.AL, "Signs you up for the next game.", "<Emoji>", "Signs you up for the next game with emoji <Emoji>, which has to be a valid emoji, that is not used by another player yet. If you have already signedup the command changes your emoji. If no emoji is provided, you are signed out.", "signup 🛠", ["✅ @McTsts signed up with emoji 🛠!"], CMDSTATE.RDY],
        ["j", PERM.AL, "Special variant of signup command.", "<Emoji>", "Behaves like $signup command. For players with a reserved emoji, they can leave out <Emoji> and it will fill it in automatically. If used by a promoted GM they are automatically demoted upon using this command.", "j", ["✅ @McTsts signed up with emoji 🛠!"], CMDSTATE.RDY],
        ["spectate", PERM.AL, "Makes you a spectator.", "", "Makes you a spectator, if you are not a participant and a game is running.", "spectate", ["✅ Attempting to make you a spectator, McTsts!"], CMDSTATE.RDY],
        ["substitute", PERM.AL, "Makes you a substitute player.", "<Emoji>", "Signs you up as a substitute for the next game with emoji <Emoji>, which has to be a valid emoji, that is not used by another player yet. If you have already signedup, signout before using this command.", "substitute 🛠", ["✅ @McTsts is a substitute with emoji 🛠!"], CMDSTATE.RDY],
        /** Stats Module **/
        // options
        ["options", PERM.GM, "Manages options.", "<Option Name> [New Value]", "Returns or sets (if <New Value> is set) the value of a bot option <Option Name>. A bot option can be a numeric id, or an option name.\n\nFor a list of all options run $help options_list", "options mayor", ["✅ mayor currently is set to 588125889611431946!"], CMDSTATE.RDY],
        ["options list", PERM.GM, "Help Page - Options", "", "prefix: The prefix the bot uses for commands\nparticipant: The id of the participant role\ngamemaster: The id of the gamemaster role\nspectator: The id of the spectator role\nsigned_up: The id of the signed up role\ndead_participant: The id of the dead participant role\nbot: The id of the bot role\nlog_guild: The id of the guild to use for logs\nlog_channel: The id of the channel to use for logs\nmayor: The id of the mayor role\nreporter: The id of the reporter role\nguardian: The id of the guardian role\ngame: The name of the game\ngamemaster_ingame: The id of the gamemaster ingame role\nadmin: The id of the admin role\nadmin_ingame: The id of the admin ingame role\nyes_emoji: The id of the yes emoji\nno_emoji: The id of the no emoji\nnew_game_ping: Role that gets pinged with certain commands\ngame_status: A VC that shows the status of the game\ncc_limit: Maximum amount of ccs one person can create (<-10 for none)\nmayor2: The id of the second mayor role (which doesn't give extra votes)\npoll: The poll mode. See $help options polls\nsub: role for substitute players\nping: ping for gifs and deleted messages\nhost: The id of the host role\nfancy_mode: Changes info messages to fancy versions if set to true.\nicon: the version to use for icon images.\nsenior_gamemaster: The id of the senior gm role.\nsenior_gamemaster_ingame: The id of the senior gm ingame role\nrole_filter: The role filter. See $help options role_filter\nhelper: The id of the helper role\nhelper_ingame: The id of the helper ingame role\nmayor_threshold: If there are more players alive than this value, mayor2 role is used.\nhost_log: Logs host pings. Disabled if false.\nautomation_level: level of automation\nghost: ghost role id\nhaunting: true/false for if haunting is enabled\nphase: current phase", "", [""], CMDSTATE.RDY, ["optionslist"]],
        ["options role_filter", PERM.GM, "Help Page - Options - Role Filter", "<Role Filter>", "A complicated option, so it gets a dedicated help page. Set the final value to the sum of all of the following options you want to enable:\n1: Show Default Roles\n2: Show Transformation Roles ('Transformation')\n4: Show Limited Roles ('Limited')\n8: Show Technical Roles ('Technical')\n16: Show Joke Roles ('Joke')\n32: Show Temporary Roles ('Temporary')\n64: Show Mini Wolf Roles ('Mini')\n128: Show Variant Roles ('Variant')\n\nDefault Value: 31\n\nLimited Transformation ('Limited Transformation') Roles are only included if both Limited and Transformation are enabled.", "$options role_filter 23", [""], CMDSTATE.NOP , ["optionsrf","options_rf","options_role_filter","options rf"]],
        ["options poll", PERM.GM, "Help Page - Options - Poll", "<Poll Value>", "A complicated option, so it gets a dedicated help page. Set the final value to the sum of all of the following options you want to enable:\n1: Public Abstain Option\n2: Private Abstain Option\n4: Public Cancel Option\n8: Private Cancel Option\n16: Public Random Option\n32: Private Random Option", "$options poll 33", [""], CMDSTATE.UNK , ["optionspoll","options_poll"]],
        // gamephase
        ["gamephase", PERM.GM, "Manages gamephases.", "[Subcommand]", "Group of commands to handle the gamephase. $help gamephase <sub-command> for detailed help. Also serves as an alias for $gamephase get\n\nList of Gamephases:\nNothing (0), Signups (1), Setup (2), Ingame (3), Postgame (4)", "", [], CMDSTATE.RDY],
            ["gamephase get", PERM.GM, "Gets gamephase.", "Returns the current gamephase.", "gp get", ["✅ Game Phase is INGAME (2)"], CMDSTATE.RDY],
            ["gamephase set", PERM.GM, "Sets gamephase.", "<New Gamephase>", "Sets the gamephase to <Value>, which has to be an integer from 0 to 4.", "gp set 2", ["✅ Game Phase is now INGAME (2)"], CMDSTATE.RDY],

        
        /** WIP **/
        ["kqak", PERM.GM, "Immediately kills players.", "<Player List>", "Adds the provided players to the killq ($killq add) and then kills all players on the killq ($killq killall).", "kqak mctsts", [], CMDSTATE.UNK],
        
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
        ["start", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["start_debug", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["reset", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["reset_debug", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["end", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["sheet", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
        ["killq", PERM.GM, "", "", "", "", [], CMDSTATE.RDY],
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
        helpStr += "```yaml\nSyntax\n\n" + stats.prefix + cmdData[0] + " " + cmdData[3] + "\n```";
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
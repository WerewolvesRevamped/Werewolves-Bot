/**
    Roles Module - Help Command
    Help command for the roles module
**/

module.exports = function() {
	/* Help for this module */
	this.helpRoles = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "roles [set|set1|set2|get|remove|list|list_names|clear] - Manages roles\n";
				if(isGameMaster(member)) help += stats.prefix + "roles [set_alias|remove_alias|list_alias|clear_alias] - Manages role aliases\n";
				if(isGameMaster(member)) help += stats.prefix + "channels [set_ind|get_ind|list_ind] - Manages individual SCs\n";
				if(isGameMaster(member)) help += stats.prefix + "channels [set_extra|set_multi|set_public|get|raw|remove|list|elected] - Manages Extra/Public/Multi SCs\n";
				if(isGameMaster(member)) help += stats.prefix + "channels [info|infopin|info_set|info_get|info_remove|info_list] - Manages SC Info\n";
				if(isGameMaster(member)) help += stats.prefix + "channels cleanup - Cleans up SCs\n";
				if(isGameMaster(member)) help += stats.prefix + "infopin - Returns role info & pins the message\n";
				if(isGameMaster(member)) help += stats.prefix + "infoedit - Edits a bot info message\n";
				if(isGameMaster(member)) help += stats.prefix + "infoadd - Returns role info with additional text\n";
				if(isGameMaster(member)) help += stats.prefix + "elect - Elects a player to a role\n";
				help += "; - Returns role info\n";
				help += ". - Returns simplified role info\n";
				help += stats.prefix + "info - Returns role info\n";
			break;
			case "info":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "info <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the description of a role.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "info citizen\n< Citizen | Townsfolk\n  Basics\n  The Citizen has no special abilities.\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed.\n```";
				help += "```diff\nAliases\n\n- i\n```";
			break;
			case "infopin":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "infopin <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the description of a role, pins it and deletes the pinning message.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "infopin citizen\n< Citizen | Townsfolk\n  Basics\n  The Citizen has no special abilities\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed.\n```";
				help += "```diff\nAliases\n\n- ip\n- info_pin\n```";
			break;
			case "infoedit":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "infoedit <Message ID> <Role Name> [Addition]\n```";
				help += "```\nFunctionality\n\nUpdates an info message in the current channel. Optionally specify contents to append to the info message.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "infoedit 14901984562573 citizen\n< Citizen | Townsfolk\n  Basics\n  The Citizen has no special abilities\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed.\n```";
				help += "```diff\nAliases\n\n- id\n- info_edit\n```";
			break;
			case "infoadd":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "infoadd <Role Name> <Addition>\n```";
				help += "```\nFunctionality\n\nSends an info message with an appended addition.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "infoadd citizen EXTRATEXT\n< Citizen | Townsfolk\n  Basics\n  The Citizen has no special abilities\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed.EXTRATEXT\n```";
				help += "```diff\nAliases\n\n- ia\n- info_add\n```";
			break;
			case "elect":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "elect <Elected Role> <Player>\n```";
				help += "```\nFunctionality\n\nElects a player to an elected role. Elected Role available are: Mayor, Reporter, Guardian. You can use M, R and G to shorten the command.\nUse elect clear to remove all elected roles from a player.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "elect mayor ts\n```";
				help += "```diff\nAliases\n\n- el\n- elected\n```";
			break;
			case "roles":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles [set|get|remove|list|list_names|clear]\n" + stats.prefix + "roles [set_alias|remove_alias|list_alias|clear_alias]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle roles and aliases. " + stats.prefix + "help roles <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- role\n- r\n```";
					break;
					case "set":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles set <Role Name> <Role Description>\n```";
						help += "```\nFunctionality\n\nSets or updates the description of a role called <Role Name> to <Role Description>. <Role Description> can contain several new lines.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles set citizen \"**Citizen** | Townsfolk \n  __Basics__\n  The Citizen has no special abilities.\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed.\"\n< ✅ Set Citizen! Preview:\n  Citizen | Townsfolk \n  Basics\n  The Citizen has no special abilities\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed. \n  ---------------------------------------------------------------------------\n```";
					break;
					case "set_alias":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles set_alias <Alias Name> <Role Name>\n```";
						help += "```\nFunctionality\n\nSets an alias for a role.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles set_alias citizen-alias citizen\n< ✅ Alias Citizen-Alias set to Citizen!\n```";
					break;
					case "set1":
					case "set2":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles set2 <Role Name> <Role Description>\n```";
						help += "```\nFunctionality\n\nCan be used to set very large role descriptions that do not fit in one message. Use set1 for the first half and set2 for the second half. Otherwise works just like set. For technical reasons, the first character of the description in set2 is ignored.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles set1 long_citizen long_text_part_1\n> " + stats.prefix + "roles set2 long_citizen long_text_part_2\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles get <Role Name>\n```";
						help += "```\nFunctionality\n\nReturns the raw description of a role called <Role Name> to allow easy editing.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles get citizen\n< ✅ Getting raw Citizen description!\n  **Citizen** | Townsfolk \n  __Basics__\n  The Citizen has no special abilities\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed.\n```";
					break;
					case "remove":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles remove <Role Name>\n```";
						help += "```\nFunctionality\n\nRemoves a role.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles remove citizen\n< ✅ Removed Citizen!\n```";
					break;
					case "remove_alias":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles remove_alias <Alias Name>\n```";
						help += "```\nFunctionality\n\nRemoves a role alias.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles remove_alias citizen-alias\n< ✅ Removed Citizen-Alias!\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles list [Role Name]\n```";
						help += "```\nFunctionality\n\nLists all roles and a short part of their description. If a role name is provided lists all subroles of that role.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles list\n```";
					break;
					case "list_names":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles list_names\n```";
						help += "```\nFunctionality\n\nLists all role names.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles list_names\n```";
					break;
					case "list_alias":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles list_alias\n```";
						help += "```\nFunctionality\n\nLists all role aliases and their role.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles list_alias\n```";
					break;
					case "clear":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles clear\n```";
						help += "```\nFunctionality\n\nDeletes all roles.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles clear\n```";
					break;
					case "clear_alias":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles clear_alias\n```";
						help += "```\nFunctionality\n\nDeletes all role aliases.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles clear_alias\n```";
					break;
				}
			break;
			case "channels":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels [set_ind|get_ind|list_ind]\n" + stats.prefix + "channels [set_extra|set_multi|set_public|get|raw|remove|list|elected]\n" + stats.prefix + "channels [info|infopin|info_set|info_get|info_remove|info_list]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle individual, extra, multi and public channels as well as channel information. " + stats.prefix + "help channels <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- channel\n- ch\n```";
					break;
					case "set_ind":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels set_ind <Role Name> <0|1>\n```";
						help += "```\nFunctionality\n\nSets if a certain role gets an individual channel. Set to 1 if true.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels set_ind citizen 1\n< ✅ Set Indsc of Citizen to 1!\n```";
					break;
					case "get_ind":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels get_ind <Role Name>\n```";
						help += "```\nFunctionality\n\nReturns if a certain role gets an individual channel. Returns 1 if true.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels get_ind citizen\n< ✅ Indsc of Citizen is set to 1!\n```";
					break;
					case "list_ind":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels list_ind\n```";
						help += "```\nFunctionality\n\nReturns a list of all roles that have ind set to 1.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels list_ind\n```";
					break;
					case "set_extra":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels set_extra <Channel Name> <Role> [%r|\" \"] [Setup Commands]\n```";
						help += "```\nFunctionality\n\nCreates a new extra channel called <Channel Name> for each player with the role <Role>, adds that player if the third argument is %r, otherwise set it to a quoted space. On creation of the channel executes all commands of the comma seperated <Setup Commands> list. %n can be used within the setup commands and will be replaced with a number unique to the player, which however is shared between all extra channels of the same role for that specific player.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels set_extra \"stalker_talk\" \"stalker\" \"%r\" \"connection add stalker%n stalker,delay 1 delete 1\"\n\n> " + stats.prefix + "channels set_extra \"stalker_selected\" \"stalker\" \" \" \"channels infopin stalker,connection add stalker%n,delay 1 delete 1\"\n```";
					break;
					case "set_multi":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels set_multi <Channel Name> <Condition> <Members> [Setup Commands]\n```";
						help += "```\nFunctionality\n\nCreates a new multi channel called <Channel Name> if at least one player exists that has a role that is part of the comma seperated role list <Condition>, then adds all players that have a role that is part of the comma seperated role list <Members> to it. On creation of the channel executes all commands of the comma seperated <Setup Commands> list. If no <Condition> is given, the channel is always created.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels set_multi \"wolfpack\" \"bloody butcher,hellhound,infected wolf,psychic wolf,scared wolf,werewolf,white werewolf,wolfs cub,alpha wolf\" \"bloody butcher,hellhound,infected wolf,psychic wolf,scared wolf,werewolf,white werewolf,wolfs cub,alpha wolf\" \"infopin werewolf\"\n\n> " + stats.prefix + "channels set_multi \"hell\" \"demon\" \"demon,devil\" \"channels infopin hell\"\n```";
					break;
					case "set_public":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels set_multi <Channel Name> <Position> <Members> [Setup Commands]\n```";
						help += "```\nFunctionality\n\nCreates a new public channel called <Channel Name> with position <Position> in the public category. Position is an integer, and the lower the value, the higher up the channel. <Members> defines who has access to this channel and can have the following options: mayor (mayor can write), alive (participants can write), info (nobody can write), dead (Dead/Specator can see/write). On creation of the channel executes all commands of the comma seperated <Setup Commands> list.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels set_public \"town_square\" 3 \"alive\" \"channels infopin town-square\"\n\n> " + stats.prefix + "channels set_public \"story_time\" 2 \"mayor\"\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels get <Channel Name>\n```";
						help += "```\nFunctionality\n\nReturns information about a channel by channel name.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels get flute_players\n\n< Flute_Players [Multi]\n  Condition: Flute Player\n  Members: Flute Player\n  Setup Commands: infopin flute_player\n```";
					break;
					case "raw":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels raw <Channel Name>\n```";
						help += "```\nFunctionality\n\nReturns information about a channel in the same way as it was inputted.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels raw flute_players\n```";
					break;
					case "remove":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels remove <Channel Name>\n```";
						help += "```\nFunctionality\n\Removes a channel by channel name.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels remove flute_players\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels list\n```";
						help += "```\nFunctionality\n\Lists all channels and their type.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels list\n```";
					break;
					case "elected":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels elected <Mayor|Reporter|Guardian>\n```";
						help += "```\nFunctionality\n\nGives the Mayor, Reporter or Guardian role access to the channel the command was executed in.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels elected mayor\n```";
					break;
					case "info":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels info <Channel Info Name>\n```";
						help += "```\nFunctionality\n\nShows a channel info.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels info hell\n```";
					break;
					case "infopin":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels infopin <Channel Info Name>\n```";
						help += "```\nFunctionality\n\nShows a channel info, pins it and deletes the pinning message.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels infopin hell\n```";
					break;
					case "info_set":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels info_set <Channel Info Name> <Channel Info>\n```";
						help += "```\nFunctionality\n\nSet or updates a channel info.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels info_set example \"Example Text\"\n```";
					break;
					case "info_get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels info_get <Channel Info Name>\n```";
						help += "```\nFunctionality\n\nReturns raw channel info.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels info_get example\n```";
					break;
					case "info_remove":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels info_remove <Channel Info Name>\n```";
						help += "```\nFunctionality\n\nRemoves channel info.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels info_remove example\n```";
					break;
					case "info_list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "channels info_list\n```";
						help += "```\nFunctionality\n\nLists all channel infos.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "channels info_list\n```";
					break;
				}
			break;
		}
		return help;
	}
}
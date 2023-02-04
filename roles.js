/*
	Module for roles / role info
		- Set role name & aliases
		- Get role info
		- Create / Manage SCs
		- Distribute roles
*/
module.exports = function() {
	/* Variables */
	this.cachedAliases = [];
	this.cachedRoles = [];
	this.cachedSCs = [];
	this.scCatCount = 0;
    this.iconLUT = {};
	
	/* Handle roles command */
	this.cmdRoles = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Role Subcommand
			case "set1": cmdRolesSet1(message.channel, args, argsX); break;
			case "set2": cmdRolesSet2(message.channel, args, argsX); break;
			case "set": cmdRolesSet(message.channel, args, argsX); break;
			case "get": cmdRolesGet(message.channel, args); break;
			case "remove": cmdRolesRemove(message.channel, args); break;
			case "list": cmdRolesList(message.channel, args); break;
			case "list_names": cmdRolesListNames(message.channel); break;
			case "clear": cmdConfirm(message, "roles clear"); break;
			// Alias Subcommands
			case "set_alias": cmdRolesSetAlias(message.channel, args); break;
			case "remove_alias": cmdRolesRemoveAlias(message.channel, args); break;
			case "list_alias": cmdRolesListAlias(message.channel); break;
			case "clear_alias": cmdConfirm(message, "roles clear_alias"); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	this.cmdChannels = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Ind SC Subcommands
			case "set_ind": cmdRolesSetIndsc(message.channel, args); break;
			case "get_ind": cmdRolesGetIndsc(message.channel, args); break;
			case "list_ind": cmdRolesListIndsc(message.channel); break;
			// Extra/Multi SC Subcommands
			case "set_extra": cmdRolesAddSc(message.channel, "extra", args, argsX); break;
			case "set_multi": cmdRolesAddSc(message.channel, "multi", args, argsX); break;
			case "set_public": cmdRolesAddSc(message.channel, "public", args, argsX); break;
			case "get": cmdRolesGetSc(message.channel, args); break;
			case "raw": cmdRolesRawSc(message.channel, args); break;
			case "remove": cmdRolesRemoveSc(message.channel, args); break;
			case "list": cmdRolesListSc(message.channel); break;
			case "elected": cmdRolesElectedSc(message.channel, args); break;
			// SC Info Subcommands
			case "info": cmdRolesScInfo(message.channel, args, false); break;
			case "infopin": cmdRolesScInfo(message.channel, args, true); break;
			case "info_set": cmdRolesScInfoSet(message.channel, args, argsX); break;
			case "info_get": cmdRolesScInfoGet(message.channel, args); break;
			case "info_remove": cmdRolesScInfoRemove(message.channel, args); break;
			case "info_list": cmdRolesScInfoList(message.channel); break;
			// SC Cleanup Subcommands
			case "cleanup": cmdConfirm(message, "roles sc_cleanup"); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
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
				if(isGameMaster(member)) help += stats.prefix + "infoeadd - Returns role info with additional text\n";
				if(isGameMaster(member)) help += stats.prefix + "info_fancy - Returns role info (fancy)\n";
				if(isGameMaster(member)) help += stats.prefix + "info_fancy_simplified - Returns role info (fancy, simplified)\n";
				if(isGameMaster(member)) help += stats.prefix + "info_classic - Returns role info (classic)\n";
				if(isGameMaster(member)) help += stats.prefix + "info_classic_simplified - Returns role info (classic, simplified)\n";
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
			case "info_fancy":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "info_fancy <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the description of a role in the fancy view.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "info_fancy citizen\n```";
				help += "```diff\nAliases\n\n- if\n```";
			break;
			case "info_fancy_simplified":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "info_fancy_simplified <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the description of a role in the fancy view and simplified.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "info_fancy_simplified citizen\n```";
				help += "```diff\nAliases\n\n- ifs\n```";
			break;
			case "info_classic":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "info_classic <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the description of a role in the classic view.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "info_classic citizen\n```";
				help += "```diff\nAliases\n\n- ic\n```";
			break;
			case "info_classic_simplified":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "info_classic_simplified <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the description of a role in the classic view and simplified.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "info_classic_simplified citizen\n```";
				help += "```diff\nAliases\n\n- ics\n```";
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
						help += "```diff\nAliases\n\n- channel\n```";
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
	
	this.getSCCats = function() {
		// Get SC Cats
		sql("SELECT id FROM sc_cats", result => {
			// Cache SC Cats
			cachedSCs = result.map(el => el.id);
		}, () => {
			// Db error
			log("CC > Database error. Could not cache sc cat list!");
		});
	}
	
	/* Sets permissions for an elected role */
	this.cmdRolesElectedSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		// Find name
		switch(args[1]) {
			case "mayor": 
				channel.permissionOverwrites.create(stats.mayor, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
				channel.permissionOverwrites.create(stats.mayor2, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			case "reporter": 
				channel.permissionOverwrites.create(stats.reporter, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			case "guardian": 
				channel.permissionOverwrites.create(stats.guardian, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			default:
				channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid elected role!"); 
			break;
		}
	}
	
	/* Prints SC Info */
	this.cmdRolesScInfo = function(channel, args, pin) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		sql("SELECT info FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			if(result.length > 0) { 
				var desc = result[0].info.replace(/~/g,"\n");
                let titleRaw = desc.split(/\n/)[0].replace(/\<\?.*?:.*?\>/g,"");
                console.log(titleRaw);
				desc = applyTheme(desc);
				desc = applyEmoji(desc);
				desc = applyNums(channel.guild, desc);
				
                let cMsg = desc;
                
                // fancy variant
                if(stats.fancy_mode) {
					let descSplit = desc.split(/\n/);
                    let title = descSplit.shift();
                   	let embed = {
                        "title": title,
                        "description": descSplit.join("\n"),
                        "color": 10921638,
                        "footer": {
                            "icon_url": `${channel.guild.iconURL()}`,
                            "text": `${channel.guild.name} - ${stats.game}`
                        }
                    };
                    let cRole = getCategoryRole(titleRaw);
                    if(cRole) embed.thumbnail = {url: repoBaseUrl + "/" + cRole + ".png"};
                    cMsg = {embeds: [ embed ]};
                }
                
				channel.send(cMsg).then(m => {
					// Pin if pin is true
					if(pin) {
						m.pin().then(mp => {
							mp.channel.messages.fetch().then(messages => {
								mp.channel.bulkDelete(messages.filter(el => el.type === "CHANNEL_PINNED_MESSAGE"));
							});	
						}).catch(err => { 
							logO(err); 
							sendError(channel, err, "Could not pin SC info message");
						});
					}
				// Couldnt send message
				}).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not send SC info message");
				});
			} else { 
			// Empty result
				channel.send("⛔ Database error. Could not find SC `" + args[1] + "`!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for SC information!");
		});	
	}
	
	/* Creates a SC Info entry */
	this.cmdRolesScInfoSet = function(channel, args, argsX) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Remove entries with same name
		sql("DELETE FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			// Insert Entry & Preview it
			sql("INSERT INTO sc_info (name, info) VALUES (" + connection.escape(args[1]) + "," + connection.escape(argsX[2]) + ")", result => {
				channel.send("✅ Set `" + toTitleCase(args[1]) + "`! Preview:\n" + argsX[2].replace(/~/g,"\n") + "\n---------------------------------------------------------------------------------"); 
				getRoles();
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set SC info!");
			});		
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not prepare setting SC info!");
		});
	}
	
	/* Removes a SC Info entry */
	this.cmdRolesScInfoRemove = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		sql("DELETE FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			channel.send("✅ Removed `" + toTitleCase(args[1]) + "`!");
			getAliases();
		}, () => {
			channel.send("⛔ Database error. Could not remove SC info!");
		});
	}
	
	/* Deletes a cc category */
	this.cmdRolesScCleanup = function(channel) {
		for(let i = 0; i < cachedSCs.length; i++) {
			cleanupCat(channel, cachedSCs[i], "SC #" + (i+1));
		}
        // Reset SC Cat Database
        sql("DELETE FROM sc_cats", result => {
            channel.send("✅ Successfully reset sc cat list!");
            getCCCats();
        }, () => {
            channel.send("⛔ Database error. Could not reset sc cat list!");
        });
	}

	
	/* Check if a channel is a SC */
	this.isSC = function(channel) {
		return !channel.parent ? true : cachedSCs.includes(channel.parentId);
	}
    
	/* Check if a channel is a SC */
	this.isPublic = function(channel) {
		return !channel.parent ? false : channel.parentId === cachedPublic;
	}
	
	/* Creates secret channels */
	this.createSCs = function(channel, debug) {
		let callback = ((arg1,arg3,arg2) => createSCStartInd(arg1, arg2, arg3)).bind(null,channel,debug);
		createNewSCCat(channel, callback);
	}
	
	this.createNewSCCat = function(channel, callback, childChannel = false) {
		scCatCount++;
		let scName = "🕵 " + toTitleCase(stats.game) + " Secret Channels";
		if(scCatCount > 1) scName += " #" + scCatCount;
		channel.guild.channels.create(scName, { type: "GUILD_CATEGORY",  permissionOverwrites: getSCCatPerms(channel.guild) })
		.then(cc => {
			sql("INSERT INTO sc_cats (id) VALUES (" + connection.escape(cc.id) + ")", result => {	
				if(childChannel) { // sets the new category as a channel parent - for the first channel that failed to fit in the previous category
					childChannel.setParent(cc, { lockPermissions: false }).catch(err => { 
                        logO(err); 
                        sendError(channel, err, "Could not assign parent to SC!");
                    });
				}
				callback(cc);
				getSCCats();
			}, () => {
				channel.send("⛔ Database error. Unable to save SC category!"); 
			});
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not create SC category");
		});
	}
	
	/* Starts the creation of individual scs */
	this.createSCStartInd = function(channel, cc, debug) {
		sql("SELECT id,role FROM players ORDER BY role ASC", result => {
			createOneIndSC(channel, cc, result, 0, debug);
		}, () => {
			channel.send("⛔ Database error. Unable to get a list of player roles."); 
		});
	}
	
	/* Starts the creation of extra scs */
	this.createSCStartExtra = function(channel, cc) {
		sql("SELECT name,cond,members,setup FROM sc WHERE type = 'extra' ORDER BY name ASC", result => {
			createOneExtraSC(channel, cc, result, 0);
		}, () => {
			channel.send("⛔ Database error. Unable to get a list extra SCs."); 
		});
	}
	
	/* Starts the creation of multi scs */
	this.createSCStartMulti = function(channel, cc) {
		sql("SELECT name,cond,members,setup FROM sc WHERE type = 'multi' ORDER BY name ASC", result => {
			createOneMultiSC(channel, cc, result, 0);
		}, () => {
			channel.send("⛔ Database error. Unable to get a list extra SCs."); 
		});
	}
	
	/* Returns default sc permissions */
	this.getSCCatPerms = function(guild) {
		return [ getPerms(guild.id, [], ["read"]), getPerms(stats.bot, ["manage", "read", "write"], []), getPerms(stats.gamemaster, ["manage", "read", "write"], []), getPerms(stats.dead_participant, ["read"], ["write"]), getPerms(stats.spectator, ["read"], ["write"]), getPerms(stats.participant, ["write"], ["read"]) ];
	}
	
	this.createOneMultiSC = function(channel, category, multi, index) {
		// Checks
		if(index >= multi.length) {
			channel.send("✅ Finished creating SCs!");
			return;
		}
		// Check if multi sc condition is met
		sql("SELECT id,role FROM players WHERE type='player' ORDER BY role ASC", result => {
			result = result.filter(el => el.role.split(",").some(el => multi[index].cond.split(",").includes(el)));
			if(result.length > 0 || multi[index].cond === " ") {
				// Find members of multisc
				sql("SELECT id,role FROM players WHERE type='player' ORDER BY role ASC", result2 => {
					result2 = result2.filter(el => el.role.split(",").some(el => multi[index].members.split(",").includes(el)));
					// Create permissions
					let ccPerms = getCCCatPerms(channel.guild);
					if(result2.length > 0) {
						let members = result2.map(el => channel.guild.members.cache.get(el.id).displayName).join(", ");
						channel.send("✅ Creating `" + toTitleCase(multi[index].name) + "` Multi SC for `" + (members ? members : "❌")  + "`!");
						result2.forEach(el =>  ccPerms.push(getPerms(el.id, ["history", "read"], [])));
					}
					// Create channel
					var name = multi[index].name;
					name = applyTheme(name);
					channel.guild.channels.create(name, { type: "text",  permissionOverwrites: ccPerms })
					.then(sc => {
						// Send info message
						multi[index].setup.split(",").forEach(el => sc.send(stats.prefix + el));
						// Move into sc category
						sc.setParent(category,{ lockPermissions: false }).then(m => {
							createOneMultiSC(channel, category, multi, ++index);
						}).catch(err => { 
							logO(err); 
							sendError(channel, err, "Could not set category. Creating new SC category");
							let callback = ((arg1,arg3,arg4,arg2) => createOneMultiSC(arg1, arg2, arg3, arg4)).bind(null,channel,multi,++index);
							createNewSCCat(channel, callback, sc);
						});	
					}).catch(err => { 
						// Couldn't create channel
						logO(err); 
						sendError(channel, err, "Could not create channel");
					});
				}, () => {
					channel.send("⛔ Database error. Unable to get a list of players with an multi SC role."); 
				});
			} else {
				// Continue
				createOneMultiSC(channel, category, multi, ++index);
			}
		}, () => {
			channel.send("⛔ Database error. Unable to get a list of players of SC condition."); 
		});
	}
	
	/* Creates a single type of extra secret channel */
	this.createOneExtraSC = function(channel, category, extra, index) {
		// Checks
		if(index >= extra.length) {
			createSCStartMulti(channel, category);
			return;
		}
		// Verify Role
		if(!verifyRole(extra[index].cond)) {	
			channel.send("✅ Skipping `" + extra[index].name +"`! Invalid role condition!");
			createOneExtraSC(channel, category, extra, ++index);
		}
		// Get players with that role
		sql("SELECT id,role FROM players WHERE type='player' ORDER BY role ASC", result => {
			result = result.filter(el => el.role.split(",").includes(parseRole(extra[index].cond)));
			if(result.length > 0) {
				// Create SCs
				createOneOneExtraSC(channel, category, extra, index, result, 0);
			} else {
				// Continue
				createOneExtraSC(channel, category, extra, ++index);
			}
		}, () => {
			channel.send("⛔ Database error. Unable to get a list of players with an extra SC role."); 
		});
	}
	
	/* Creates a single extra secret channel of a single type of extra secret channel */
	this.createOneOneExtraSC = function(channel, category, extra, index, result, resultIndex) {
		if(resultIndex >= result.length) {
			createOneExtraSC(channel, category, extra, ++index);
			return;
		}
		channel.send("✅ Creating `" + toTitleCase(extra[index].name) + "` Extra SC for `" + channel.guild.members.cache.get(result[resultIndex].id).displayName + "` (`" + toTitleCase(extra[index].cond) + "`)!");
		// Create permissions
		let ccPerms = getCCCatPerms(channel.guild);
		if(extra[index].members === "%r") ccPerms.push(getPerms(result[resultIndex].id, ["history", "read"], []));
		// Create channel
		var name = extra[index].name;
        name = name.replace("%r", channel.guild.members.cache.get(result[resultIndex].id).user.username);
		name = applyTheme(name);
		channel.guild.channels.create(name, { type: "text",  permissionOverwrites: ccPerms })
		.then(sc => {
			// Send info message
			if(extra[index].setup.length > 1) extra[index].setup.replace(/%r/g, result[resultIndex].id + "").replace(/%n/g, resultIndex).split(",").forEach(el => sc.send(stats.prefix + el));
			// Move into sc category
			sc.setParent(category,{ lockPermissions: false }).then(m => {
				createOneOneExtraSC(channel, category, extra, index, result, ++resultIndex);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not set category. Creating new SC category");
				let callback = ((arg1,arg3,arg4,arg5,arg6,arg2) => createOneOneExtraSC(arg1, arg2, arg3, arg4, arg5, arg6)).bind(null,channel,extra,index,result,++resultIndex);
				createNewSCCat(channel, callback, sc);
			});	
		}).catch(err => { 
			// Couldn't create channel
			logO(err); 
			sendError(channel, err, "Could not create channel");
		});
	}
	
	/* Creates a single individual secret channel */
	this.createOneIndSC = function(channel, category, players, index, debug) {
		if(index >= players.length) {
			createSCStartExtra(channel, category);
			return;
		}
		let roleListD = players[index].role.split(",");
		var customRole = false;
        var roleType = "default";
		if(roleListD[0] === "custom") {
            customRole = JSON.parse(roleListD[1].replace(/'/g,"\"").replace(/;/g,","));
            roleType = "custom";
        } else if(roleListD[0] === "merged") {
            customRole = [roleListD[1], roleListD[2]];
            roleType = "merged";
        }
		let roleList = roleListD.map(el => "name = " + connection.escape(el)).join(" OR ");
		sql("SELECT name,description,ind_sc FROM roles WHERE " + roleList, result => {	
			result = result.filter(role => verifyRoleVisible(role.name));
			var rolesArray = result.map(el => toTitleCase(el.name));
            let disName = channel.guild.members.cache.get(players[index].id).displayName;
			if(!debug) { 
				if(roleType == "default" || roleType == "merged") {
					let roles = rolesArray.join("` + `");
					roles = applyTheme(roles);
                    if(roleType == "merged") roles = [toTitleCase(customRole.join(" "))];
                    if(!stats.fancy_mode) { // default DM
                        channel.guild.members.cache.get(players[index].id).user.send("This message is giving you your role" + ((result.length != 1 && roleType == "default") ? "s" : "") + " for the next game of Werewolves: Revamped!\n\n\nYour role" + ((result.length != 1 && roleType == "default") ? "s are" : " is") + " `" + roles + "`.\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.\n\nIf you're confused about your role at all, then check #announcements on the discord, which contains a role book with information on all the roles in this game.").catch(err => { 
                            logO(err); 
                            sendError(channel, err, "Could not send role message to " + disName);
                        });	
                    } else { // fancy DM
                        let roleData = getRoleData(rolesArray[0], result.find(el => toTitleCase(el.name) == rolesArray[0]).description);
                        if(!roleData) {
                            sendError(channel, err, "Could not find role for " + disName);
                        } else {
                            let embed = {
                                "title": "The game has started!",
                                "description": "This message is giving you your role" + ((result.length != 1 && roleType == "default") ? "s" : "") + " for the next game of Werewolves: Revamped!\n\nYour role" + ((result.length != 1 && roleType == "default") ? "s are" : " is") + " `" + roles + "`.\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.\n\nIf you're confused about your role at all, then check #how-to-play on the discord, which contains a role book with information on all the roles in this game. If you have any questions about the game, ping @Host.",
                                "color": roleData.color,
                                "footer": {
                                    "icon_url": `${channel.guild.iconURL()}`,
                                    "text": `${channel.guild.name} - ${stats.game}`
                                },
                                "thumbnail": {
                                    "url": roleData.url
                                }
                            };
                            channel.guild.members.cache.get(players[index].id).user.send({embeds: [ embed ]}).catch(err => {
                                logO(err); 
                                sendError(channel, err, "Could not send role message to " + disName);
                            });
                        }
                    }
				} else if(roleType == "custom") {
					channel.guild.members.cache.get(players[index].id).user.send("This message is giving you your custom role for the next game of Werewolves: Revamped!\n\n\nYour role is `" + toTitleCase(customRole.name) + "` (" + customRole.id + ").\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.").catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not send role message to " + 	channel.guild.members.cache.get(players[index].id).displayName);
					});	
				}
			}
			let indscRoles = result.filter(el => el.ind_sc).map(el => el.name);
			if(roleType == "custom") indscRoles = [ customRole.name ];
			// Check if ind sc
			if(indscRoles.length) { 
				channel.send("✅ Creating `" + toTitleCase(indscRoles.join("-")) + "` Ind SC for `" + channel.guild.members.cache.get(players[index].id).displayName + "` (`" + result.map(el => toTitleCase(el.name)).join("` + `") + "`)!");
				// Create permissions
				let ccPerms = getCCCatPerms(channel.guild);
				ccPerms.push(getPerms(players[index].id, ["history", "read"], []));
				// Create channel
				
				var name = indscRoles.join("-");
                if(roleType == "merged") name = customRole.join(" ");
				name = applyTheme(name);
				channel.guild.channels.create(name.substr(0, 100), { type: "text",  permissionOverwrites: ccPerms })
				.then(sc => {
					// Send info message
					if(roleType == "default") indscRoles.forEach(el => cmdInfoEither(sc, [ el ], true, false));
					else if(roleType == "merged") {
                        sql("SELECT description FROM roles WHERE name = " + connection.escape(parseRole(customRole[0])), result => {
                            let addDesc = result[0].description;
                            let addTitle = addDesc.split("~__Basics__")[0].split("|")[1].trim();
                            addDesc = addDesc.split("__Basics__")[1].replace(/~/g,"\n");
                            cmdInfoEither(sc, [ customRole[1] ], true, false, false, toTitleCase(customRole.join(" ")), [addTitle, addDesc]);
                        }, () => {
                            cmdInfoEither(sc, [ customRole[1] ], true, false, false, toTitleCase(customRole.join(" ")));
                        });
                    } else if(roleType == "custom") {
						var desc = "";
						desc += "**" + toTitleCase(customRole.name) + "** | " + toTitleCase(customRole.team);
						desc += "\n__Basics__\n" + toSentenceCase(customRole.basics.replace(/%n/g,toTitleCase(customRole.name)));
						desc += "\n__Details__\n" + toSentenceCase(customRole.details.replace(/%n/g,toTitleCase(customRole.name)));
						desc += "\n__Win Condition__\n" + toSentenceCase(customRole.win.replace(/%n/g,toTitleCase(customRole.name)));
						desc = applyTheme(desc);
						sc.send(desc).then(m => {
							m.pin().then(mp => {
								mp.channel.messages.fetch().then(messages => {
									mp.channel.bulkDelete(messages.filter(el => el.type === "CHANNEL_PINNED_MESSAGE"));
								});	
							}).catch(err => { 
								logO(err); 
								sendError(channel, err, "Could not pin info message");
							});
						// Couldnt send message
						}).catch(err => { 
							logO(err); 
							sendError(channel, err, "Could not send info message");
						});	
						if(customRole.setup != "") customRole.setup.replace(/%p/g,players[index].id).replace(/%c/g,sc.id).split(",").forEach(el => sc.send(stats.prefix + el));
					}
					// Move into sc category
					sc.setParent(category,{ lockPermissions: false }).then(m => {
						createOneIndSC(channel, category, players, ++index, debug);
					}).catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not set category. Creating new SC category");
						let callback = ((arg1,arg3,arg4,arg5,arg2) => createOneIndSC(arg1, arg2, arg3, arg4, arg5)).bind(null,channel,players,++index,debug);
						createNewSCCat(channel, callback, sc);
					});	
				}).catch(err => { 
					// Couldn't create channel
					logO(err); 
					sendError(channel, err, "Could not create channel");
				});
			} else { 
				// No ind sc
				channel.send("✅ Skipping `" + channel.guild.members.cache.get(players[index].id).displayName + "` (`" + result.map(el => toTitleCase(el.name)).join("` + `") + "`)!");
				createOneIndSC(channel, category, players, ++index, debug);
			}
		}, () => {
			// Couldn't delete
			channel.send("⛔ Database error. Could not get role info!");
		});
	}
	
	/* Cache Role Info */
	this.cacheRoleInfo = function() {
		getAliases();
		getRoles();
		getSCCats();
	}
	
	/* Cache role aliases */
	this.getAliases = function() {
		sql("SELECT alias,name FROM roles_alias", result => {
				cachedAliases = result;
		}, () => {
			log("Roles > ❗❗❗ Unable to cache role aliases!");
		});
	}
	
	/* Caches valid roles */
	this.getRoles = function() {
		sql("SELECT name FROM roles", result => {
				cachedRoles = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache role!");
		});
	}
	
	/* Cache Public category */
	this.getPublicCat = function() {
		sqlGetStat(15, result => {
			cachedPublic = result;
		}, () => {
			log("Roles > ❗❗❗ Unable to cache Public Category!");
		});
	}
	
	/* Converts a role/alias to role */
	this.parseRole = function(input) {
		//console.log(input);
		input = input.toLowerCase();
		let alias = cachedAliases.find(el => el.alias === input);
		if(alias) return parseRole(alias.name);
		else return input;
	}
	
	/* Verify role */
	this.verifyRole = function(input) {
		let inputRole = parseRole(input);
		let role = cachedRoles.find(el => el === inputRole);
		return role ? true : false;
	}
	
	/* Verifies roles, but removes technical roles */
	this.verifyRoleVisible = function(input) {
		return !~input.search("!_") ? parseRole(input) : false;
	}
	
	/* Creates/Sets an Extra or Multi SC */
	this.cmdRolesAddSc = function(channel, type, args, argsX) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		if(!args[3] || args[3] === "") {
			args[3] = " ";
		} 
		if(!argsX[4] || argsX[4] === "") {
			argsX[4] = " ";
		}
		// Remove entries with same name
		sql("DELETE FROM sc WHERE name = " + connection.escape(args[1]), result => {
			// Insert Entry & Preview it
			sql("INSERT INTO sc (name, type, cond, members, setup) VALUES (" + connection.escape(args[1].replace(/'/g,'"')) + ", " + connection.escape(type) + "," + connection.escape(args[2].replace(/'/g,'"')) + "," + connection.escape(args[3].replace(/'/g,'"')) + "," + connection.escape(argsX[4].replace(/'/g,'"')) + ")", result => {
				if(args[2] === " ") args[2] = "none";
				if(args[3] === " " && argsX[4] === " ") channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, and no members or setup commands!"); 
				else if(args[3] === " " && argsX[4] != " ") channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, and setup commands `" + argsX[4] + "`, and no members!"); 
				else if(args[3] != " " && argsX[4] === " ") channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, and members `" + args[3] + "`, and no setup commands!"); 
				else channel.send("✅ Created " + type + " SC `" + toTitleCase(args[1]) + "` with conditions `" + args[2] + "`, members `" + args[3] + "`, and setup commands `" + argsX[4] + "`!"); 
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set SC!");
			});		
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not prepare SC database!");
		});
	}
	
	/* Deletes a SC */
	this.cmdRolesRemoveSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("DELETE FROM sc WHERE name = " + connection.escape(args[1]), result => {
			// Insert Entry & Preview it
			 channel.send("✅ Deleted SC");
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Lists all SCs */
	this.cmdRolesListSc = function(channel) {
		// Remove entries with same name
		sql("SELECT name,type,cond,members,setup FROM sc", result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Could not find any SCs!");
				return;
			}
			channel.send("✳ Sending a list of currently existing multi/extra SCs:");
			chunkArray(result.map(el => "**" + toTitleCase(el.name) + "** [" + toTitleCase(el.type) + "]"), 50).map(el => el.join("\n")).forEach(el => channel.send(el));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Gets a SC */
	this.cmdRolesGetSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("SELECT name,type,cond,members,setup FROM sc WHERE name = " + connection.escape(args[1]), result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any matching SCs!");
				return;
			}
			result.forEach(el => channel.send("**" + toTitleCase(el.name) + "** [" + toTitleCase(el.type) + "]\nCondition: " + toTitleCase(el.cond.replace(/,/g,", ")) + "\nMembers: " + toTitleCase(el.members.replace(/,/g,", ")) + "\nSetup Commands: " + (el.setup.length > 0 ? "`" + el.setup.replace(/,/g,"`, `") + "`" : "")));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Gets a SC */
	this.cmdRolesRawSc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("SELECT name,type,cond,members,setup FROM sc WHERE name = " + connection.escape(args[1]), result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any matching SCs!");
				return;
			}
			result.forEach(el => channel.send("```" + stats.prefix + "channels set_" + el.type + " \"" + el.name + "\" \"" + el.cond + "\" \"" + el.members + "\" \"" + el.setup + "\"```"));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC database!");
		});
	}
	
	/* Lists all SC Infos */
	this.cmdRolesScInfoList = function(channel) {
		// Remove entries with same name
		sql("SELECT name,info FROM sc_info", result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any SC Info!");
				return;
			}
			channel.send("✳ Sending a list of currently existing SC info:");
			chunkArray(result.map(el => "**__" + toTitleCase(el.name) + "__**: " + el.info.replace(/~/g,"").substr(0, 100)), 15).map(el => el.join("\n")).forEach(el => channel.send(el));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC Info database!");
		});
	}
	
	/* Gets SC Info */
	this.cmdRolesScInfoGet = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} 
		// Remove entries with same name
		sql("SELECT name,info FROM sc_info WHERE name = " + connection.escape(args[1]), result => {
			if(result.length <= 0) {
				channel.send("⛔ Database error. Coult not find any matching SC Info!");
				return;
			}
			result.forEach(el => channel.send("**__" + toTitleCase(el.name) + "__**:\n```" + el.info.replace(/~/g,"\n") + "```"));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC Info database!");
		});
	}
	
    /* Sets the description of a role / creates a role */
    var roleTempSegment = "";
	this.cmdRolesSet1 = function(channel, args, argsX) {
        // Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
        roleTempSegment = argsX[2];
    }
    
	this.cmdRolesSet2 = function(channel, args, argsX) {
        // Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
        argsX[2] = roleTempSegment + argsX[2].substr(1);
        cmdRolesSet(channel, args, argsX);
    }
    
	/* Sets the description of a role / creates a role */
	this.cmdRolesSet = function(channel, args, argsX) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Insert Entry & Preview it
		if(!verifyRole(args[1])) {
			sql("INSERT INTO roles (name, description) VALUES (" + connection.escape(args[1]) + "," + connection.escape(argsX[2]) + ")", result => {
				channel.send("✅ Set `" + toTitleCase(args[1]) + "`! Preview:\n" + argsX[2].replace(/~/g,"\n").substr(0, 1800) + "\n---------------------------------------------------------------------------------"); 
				getRoles();
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set role!");
			});		
		} else {
			sql("UPDATE roles SET description = " + connection.escape(argsX[2]) + " WHERE name = " + connection.escape(parseRole(args[1])), result => {
				channel.send("✅ Updated `" + toTitleCase(args[1]) + "`! Preview:\n" + argsX[2].replace(/~/g,"\n").substr(0, 1800) + "\n---------------------------------------------------------------------------------"); 
				getRoles();
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not update role!");
			});	
		}
	}
	
	/* Gets the raw descripton of a role */
	this.cmdRolesGet = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyRole(args[1])) {
			channel.send("⛔ Command error. Invalid role `" + args[1] + "`!"); 
			return; 
		}
		// Get info
		sql("SELECT description FROM roles WHERE name = " + connection.escape(args[1].toLowerCase()), result => {
			if(result.length > 0) { 
				let roleDesc = result[0].description.replace(/~/g,"\n");
				channel.send("✅ Getting raw `"+ toTitleCase(args[1]) + "` description!\n```" + roleDesc + "```");
			} else { 
				channel.send("⛔ Database error. Role `" + args[1] + "` does not exist!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for role!");
		});
	}
	
	/* Removes a role */
	this.cmdRolesRemove = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyRole(args[1])) {
			channel.send("⛔ Command error. Invalid role `" + args[1] + "`!"); 
			return; 
		}
		// Delete info
		sql("DELETE FROM roles WHERE name = " + connection.escape(args[1].toLowerCase()), result => {
			channel.send("✅ Removed `" + toTitleCase(args[1]) + "`!");
			getRoles();
		}, () => {
			// Couldn't delete
			channel.send("⛔ Database error. Could not remove role!");
		});
	}
	
	/* Sets an ind SC for a role */
	this.cmdRolesSetIndsc = function(channel, args) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!(args[2] === "0" || args[2] === "1")) {
			channel.send("⛔ Syntax error. Indsc state can only be 0/1!"); 
			return; 
		} else if(!verifyRole(args[1])) {
			channel.send("⛔ Command error. Invalid role `" + args[1] + "`!"); 
			return; 
		}
		// Delete info
		sql("UPDATE roles SET ind_sc = " + connection.escape(args[2]) + " WHERE name = " + connection.escape(parseRole(args[1])), result => {
			channel.send("✅ Set Indsc of `" + toTitleCase(parseRole(args[1])) + "` to `" + args[2] + "`!");
		}, () => {
			// Couldn't delete
			channel.send("⛔ Database error. Could not update role!");
		});
	}
	
	/* Sets wether a role has an individual sc  */
	this.cmdRolesGetIndsc = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		} else if(!verifyRole(args[1])) {
			channel.send("⛔ Command error. Invalid role `" + args[1] + "`!"); 
			return; 
		}
		// Delete info
		sql("SELECT ind_sc FROM roles WHERE name = " + connection.escape(parseRole(args[1])), result => {
			channel.send("✅ Indsc of `" + toTitleCase(parseRole(args[1])) + "` is set to `" + result[0].ind_sc + "`!");
		}, () => {
			// Couldn't delete
			channel.send("⛔ Database error. Could not get role info!");
		});
	}
	
	/* Lists all roles */
	this.cmdRolesList = function(channel, args) {
        let filter = false;
        if(args[1]) {
            filter = parseRole(args[1]);
        }
		// Get all roles
		sql("SELECT name,description FROM roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				if(!filter) channel.send("✳ Sending a list of currently existing roles:");
				else channel.send("✳ Sending a list `" + filter + "` of subroles:");
				// Send message
				chunkArray(result.filter(el => {
                    // when a filter is set filter out
                    if(!filter) return true;
                    let role = el.name.split("$");
                    role = role[0];
                    if(role == filter) return true;
                    return false;
                }).map(role => {
					let roleDesc = role.description.replace(/\*|_|Basics|Details/g,"")
					if(!filter) return "**" +  toTitleCase(role.name) + ":** " + roleDesc.replace(/~/g," ").substr(roleDesc.search("~") + 1, 90)
					else return role.name;
				}), 15).map(el => {
                    if(!filter) return el.join("\n");
                    else return el.join(", ");
                }).forEach(el => channel.send(el));
			} else { 
				// No roles exist
				channel.send("⛔ Database error. Could not find any roles!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for role list!");
		});
	}
	
	/* Lists all roles names */
	this.cmdRolesListNames = function(channel) {
		// Get all roles
		sql("SELECT name FROM roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳ Sending a list of currently existing role names:");
				// Send message
				chunkArray(result.map(role => toTitleCase(role.name)), 40).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No roles exist
				channel.send("⛔ Database error. Could not find any roles!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for role list!");
		});
	}
	
	/* Lists all roles */
	this.cmdRolesListIndsc = function(channel) {
		// Get all roles
		sql("SELECT name,description FROM roles WHERE ind_sc = 1 ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳ Sending a list of currently existing roles that have a individual secret channel:");
				// Send message
				chunkArray(result.map(role => {
					let roleDesc = role.description.replace(/\*|_|Basics|Details/g,"");
					return "**" +  toTitleCase(role.name) + ":** " + roleDesc.replace(/~/g," ").substr(roleDesc.search("~") + 1, 100);
				}), 15).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				// No roles exist
				channel.send("⛔ Database error. Could not find any roles!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for role list!");
		});
	}
	
	/* Removes all roles */
	this.cmdRolesClear = function(channel) {
		sql("DELETE FROM roles", result => {
			channel.send("⛔ Database error. Could not execute `" + data.action + "`!");
			getRoles();
		}, () => {
			channel.send("✅ Successfully executed `" + data.action + "`!");
		});
	}
	
	/* Creates/Sets an alias */
	this.cmdRolesSetAlias = function(channel, args) {
		// Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Delete old entries with same alias
		sql("DELETE FROM roles_alias WHERE alias = " + connection.escape(args[1]), result => {
			// Insert alias into db
			sql("INSERT INTO roles_alias (alias, name) VALUES (" + connection.escape(args[1]) + "," + connection.escape(parseRole(args[2])) + ")", result => {
				channel.send("✅ Alias `" + toTitleCase(args[1]) + "` set to `" + toTitleCase(parseRole(args[2])) + "`!"); 
				getAliases();
			}, () => {
				// Couldn't set alias
				channel.send("⛔ Database error. Could not set role alias!");
			});		
		}, () => {
			// Couldn't delete old entry for alias
			channel.send("⛔ Database error. Coult not prepare setting role alias!");
		});
	}
	
	/* Removes a role alias */
	this.cmdRolesRemoveAlias = function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		sql("DELETE FROM roles_alias WHERE alias = " + connection.escape(args[1]), result => {
			channel.send("✅ Removed `" + toTitleCase(args[1]) + "`!");
			getAliases();
		}, () => {
			channel.send("⛔ Database error. Could not remove role alias!");
		});
	}
	
	/* Lists all role aliases */
	this.cmdRolesListAlias = function(channel) {
		// Get all aliases
		sql("SELECT alias,name FROM roles_alias ORDER BY alias ASC", result => {
			if(result.length > 0) {
				channel.send("✳ Sending a list of currently existing role aliases:");
                let aliases = {};
                result.forEach(el => {
                    if(!aliases[el.name]) aliases[el.name] = [];
                    aliases[el.name].push(el.alias);
                });
                let lines = [];
                Object.keys(aliases).map(alias => {
                    lines.push("**" + toTitleCase(alias) + ":** " + aliases[alias].join(", "));
                });
				// For each alias send a message
				chunkArray(lines, 20).map(el => el.join("\n")).forEach(el => channel.send(el));
			} else { 
				channel.send("⛔ Database error. Could not find any role aliases!");
			}
		}, () => {
			// DB error
			channel.send("⛔ Database error. Couldn't look for alias list!");
		});
	}
	
	/* Removes all aliases */
	this.cmdRolesClearAlias = function(channel) {
		sql("DELETE FROM roles_alias", result => {
			channel.send("⛔ Database error. Could not execute `" + data.action + "`!");
			getAliases();
		}, () => {
			channel.send("✅ Successfully executed `" + data.action + "`!");
		});
	}
    
    this.cmdInfoEdit = function(channel, args, argsX) {
        if(!args[0] || !args[1]) {
            if(!noErr) channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        channel.messages.fetch(args[0])
        .then(message => {
            let append = false;
            if(argsX[2]) append = ["", argsX[2].replace(/~/g, "\n").replace(/<\/>/g,"~")];
            cmdInfoEither(message.channel, [args[1]], false, false, false, false, append, message);
        })
        .catch(err => { 
            logO(err); 
            sendError(channel, err, "Could not edit in info message");
        });
    }
    
    this.cmdInfoEither = function(channel, args, pin, noErr, simp = false, overwriteName = false, appendSection = false, editOnto = false) {
		// fix role name if necessary
        if(!args) {
            if(!noErr) channel.send("❗ Could not find role.");
            return;
        }
		let roleName = args.join(" ").replace(/[^a-zA-Z0-9'\-_\$ ]+/g,"");
		if(!verifyRole(roleName)) { // not a valid role
			// get all roles and aliases, to get an array of all possible role names
			let allRoleNames = [...cachedRoles, ...cachedAliases.map(el => el.alias)];
			let bestMatch = findBestMatch(roleName.toLowerCase(), allRoleNames.map(el => el.toLowerCase())); // find closest match
            //console.log(bestMatch);
			// check if match is close enough
			if(bestMatch.value <= ~~(roleName.length/2)) { // auto alias if so, but send warning 
				args = [parseRole(bestMatch.name)];
                if(args[0].toLowerCase() === bestMatch.name.toLowerCase()) channel.send("❗ Could not find role `" + roleName + "`. Did you mean `" + args[0] + "`?");
                else channel.send("❗ Could not find role `" + roleName + "`. Did you mean `" + args[0] + "` (aka `" + (bestMatch.name.length>2 ? toTitleCase(bestMatch.name) : bestMatch.name.toUpperCase()) + "`)?");
			} else { // early fail if otherwise
				channel.send("❗ Could not find role `" + roleName + "`.");
                return;
			}
		}
		
		// run info command
        if(stats.fancy_mode) {
            cmdInfoFancy(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
        } else {
            cmdInfo(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
        }
    }
	
	/* Prints info for a role by name or alias */
	this.cmdInfo = function(channel, args, pin, noErr, simp = false, overwriteName = false, appendSection = false, editOnto = false) {
		// Check arguments
		if(!args[0]) { 
			if(!noErr) channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		args[0] = args.join(" ");
		if(!verifyRoleVisible(args[0])) {
			if(!noErr) channel.send("⛔ Command error. Invalid role `" + args[0] + "`!"); 
			return; 
		}
		sql("SELECT description FROM roles WHERE name = " + connection.escape(parseRole(args[0])), result => {
			if(result.length > 0) { 
				var desc = result[0].description.replace(/~/g,"\n");
                if(overwriteName) {
                    desc = desc.split("|");
                    desc[0] = `**${overwriteName}** `;
                    desc = desc.join("|");
                }
				desc = applyEmoji(desc);
				desc = applyNums(channel.guild, desc);
                // simplified role description support
                desc = desc.split("__Simplified__");
                if(simp) desc = desc[1] ? (desc[0].split("__Basics__")[0] ? desc[0].split("__Basics__")[0] : toTitleCase(parseRole(args[0]))) + "\n" + desc[1].trim() : desc[0]; 
                else desc = desc[0];
                if(appendSection) desc = desc.trim() + `\n__${appendSection[0]}__\n${appendSection[1]}`;
               
               if(desc.length > 1900) { // too long, requires splitting
                   let descSplit = desc.split(/\n/);
                   desc = [];
                   let i = 0;
                   let j = 0;
                   while(i < descSplit.length) {
                       desc[j] = "";
                       while(i < descSplit.length && (desc[j].length + descSplit[i].length) < 1900) {
                           desc[j] += "\n" + descSplit[i];
                           i++;
                       }
                       j++;
                   }
               } else { // fits
                   desc = [desc];
               }
               
                for(let i = 0; i < desc.length; i++) {
		     // apply themes
	            desc = applyTheme(desc);
                    channel.send(desc[i]).then(m => {
                        // Pin if pin is true
                        if(pin) {
                            m.pin().then(mp => {
                                mp.channel.messages.fetch().then(messages => {
                                    mp.channel.bulkDelete(messages.filter(el => el.type === "CHANNEL_PINNED_MESSAGE"));
                                });	
                            }).catch(err => { 
                                logO(err); 
                                if(!noErr) sendError(channel, err, "Could not pin info message");
                            });
                        }
                        if(simp) {
                            setTimeout(() => m.delete(), 180000);
                        }
                    // Couldnt send message
                    }).catch(err => { 
                        logO(err); 
                        if(!noErr) sendError(channel, err, "Could not send info message");
                    });
                }
			} else { 
			// Empty result
				if(!noErr) channel.send("⛔ Database error. Could not find role `" + args[0] + "`!");
			}
		}, () => {
			// DB error
			if(!noErr) channel.send("⛔ Database error. Couldn't look for role information!");
		});	
	}
	
	this.applyEmoji = function(text) {
		[...text.matchAll(/\<\?([\w\d]*):([^>]{0,10})\>/g)].forEach(match => {
			let emoji = client.emojis.cache.find(el => el.name === match[1]);
			if(emoji) emoji = `<:${emoji.name}:${emoji.id}>`;
			else emoji = match[2];
			text = text.replace(match[0], emoji)
		}); 
		return text;
	}
    
    this.applyNums = function(guild, text) {
        let playerCount = guild.roles.cache.get(stats.participant).members.size;
        playerCount += guild.roles.cache.get(stats.signed_up).members.size;
        text = text.replace(/\{\|1\|\}/g, playerCount);
        text = text.replace(/\{\|2\|\}/g, Math.floor(playerCount / 2));
        text = text.replace(/\{\|3\|\}/g, Math.floor(playerCount / 3));
        text = text.replace(/\{\|4\|\}/g, Math.floor(playerCount / 4));
        text = text.replace(/\{\|5\|\}/g, Math.floor(playerCount / 5));
        text = text.replace(/\{\|10\|\}/g, Math.floor(playerCount / 10));
        text = text.replace(/\{\|20\|\}/g, Math.floor(playerCount / 20));
        text = text.replace(/\{\|2\^\|\}/g, Math.ceil(playerCount / 2));
        text = text.replace(/\{\|3\^\|\}/g, Math.ceil(playerCount / 3));
        text = text.replace(/\{\|4\^\|\}/g, Math.ceil(playerCount / 4));
        text = text.replace(/\{\|5\^\|\}/g, Math.ceil(playerCount / 5));
        return text;
    }
    
    const repoBaseUrl = "https://raw.githubusercontent.com/venomousbirds/Werewolves-Icons/main/";
    this.getRoleData = function(role, description) {
        // prep 
        let category = description.split(/\n|~/)[0].split(/ \| /)[1]?.trim() ?? false;
        if(!category) return false;
        let cSplit = category.split(/ /);
        
        
        // get url
         let repoPath = repoBaseUrl;
        let cSplitSolo = category.split(/ \- /);
        let catRole = getCategoryRole(role);
        if(catRole) repoPath += catRole + ".png";
        else if(cSplitSolo.length != 1 && cSplit[0] === "Solo") repoPath += "Solo/" + cSplitSolo[1].replace(/ Team/,"") + "/";
        else if(cSplit.length == 1) repoPath += cSplit[0] + "/";
        else repoPath += cSplit[0] + "/" + cSplit[1].split(/ - /)[0] + "/";
        if(!catRole) repoPath += toTitleCase(role) + ".png";
        repoPath = repoPath.replace(/ /g, "%20");
        repoPath += `?version=${stats.icon_version}`;
        
        // glitched overwrite
        //repoPath = 'http://ww.mctsts.com/icon_glitched.php?name=' + toTitleCase(role).replace(/ /g, "%20");
        //repoPath += `&version=${stats.icon_version}`;
        
        // get color
        let color = 0;
        switch(cSplit[0]) {
            case "Townsfolk": 
                color = 3138709;
            break;
            case "Werewolf":
                color = 14882377;
            break;
            case "Unaligned":
                color = 15451648;
            break;
            case "Elected":
                color = 9719883;
            break;
            case "Solo":
                console.log(cSplit);
                console.log(cSplitSolo);
                let soloTeam = cSplitSolo[1].replace(/ Team/,"");
                switch(soloTeam) {
                    case "Hell":
                        color = 7607345;
                    break;
                    case "Underworld":
                        color = 6361226;
                    break;
                    case "Pyro":
                        color = 15173690;
                    break;
                    case "Flute":
                        color = 3947978;
                    break;
                    case "White Wolves":
                        color = 16777215;
                    break;
                    case "Plague":
                        color = 30001;
                    break;
                    case "Nightmare":
                        color = 1649994;
                    break;
                    case "Flock":
                        color = 13093063;
                    break;
                    case "Graveyard":
                        color = 8497497;
                    break;
                    default:
                        color = 7829367;
                        console.log("Category: " + category + "; Team: " + cSplit[0] + " - " + soloTeam);
                    break;
                }
            break;
            default:
                color = 7829367;
                console.log("Category: " + category + "; Team: " + cSplit[0]);
            break;
        }
        
        return {url: repoPath, color: color};
    }
    
    this.getCategoryRole = function(val) {
        val = val.toLowerCase().replace(/[^a-z ]/g,"").trim();
        console.log(`look lut: "${val}"`);
        return iconLUT[val] ?? false;
    }
    
    
    this.getIconFromName = function(name) {
        return new Promise(res => {
            let roleNameParsed = parseRole(name);
            if(!roleNameParsed) return res(false);
            var output;
            sql("SELECT description FROM roles WHERE name = " + connection.escape(roleNameParsed), async result => {
                if(!result[0] || !result[0].description) return res(false);
                let roleData = getRoleData(roleNameParsed, result[0].description);
                let urlExists = await checkUrlExists(roleData.url);
                if(urlExists) res(roleData.url);
                else res(false);
            });
        });
    }
    
	/* Prints info for a role by name or alias */
	this.cmdInfoFancy = function(channel, args, pin, noErr, simp = false, overwriteName = false, appendSection = false, editOnto = false) {
		// Check arguments
		if(!args[0]) { 
			if(!noErr) channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		args[0] = args.join(" ");
		if(!verifyRoleVisible(args[0])) {
			if(!noErr) channel.send("⛔ Command error. Invalid role `" + args[0] + "`!"); 
			return; 
		}
        let roleNameParsed = parseRole(args[0]);
		sql("SELECT description FROM roles WHERE name = " + connection.escape(roleNameParsed), async result => {
			if(result.length > 0) { 
                roleNameParsed = roleNameParsed.split("$")[0];
				var desc = result[0].description.replace(/~/g,"\n");
				desc = applyEmoji(desc);
                desc = applyNums(channel.guild, desc);
                
                // split into name & text pairs + apply theme
                desc = desc.split(/(?=__[\w\d_]+__)/).map(el => {
                    let cat = el.match(/^__([\w\d_]+)__\s*\n([\w\W]*)\n?$/);
                    //console.log(cat);
                    return cat ? [cat[1], cat[2]] : ["", el];
                }).map(el => {
                    return applyTheme(el);
                });
                
                if(!simp) {
                    desc = desc.filter(el => el[0] != "Simplified");
                } else {
                    desc = desc.filter(el => el[0] === "Simplified" || el[0] === ""); 
                }
                
                let category = (desc.find(el => el[0] == "")[1].split(/ \| /)[1] ?? "Unknown").replace(/[\n\r]*/g,"").trim();
                let fancyRoleName = toTitleCase(roleNameParsed) + (category ? " [" + category + "]" : "");
                if(overwriteName) fancyRoleName = overwriteName;
                fancyRoleName = applyTheme(fancyRoleName);
                // determine role type ("limited")
                let roleType = false;
                switch((desc.find(el => el[0] == "")[1].split(/ \| /)[2] ?? "-").trim().toLowerCase()) {
                    case "limited": roleType = "Limited Role"; break;
                    case "temporary":
                    case "fake role": roleType = "Temporary Role"; break;
                    case "mini": roleType = "Mini Wolves Exclusive"; break;
                    case "technical": roleType = "Technical Role"; break;
                    case "transformation": roleType = "Transformation Role"; break;
                    case "transformation limited":
                    case "limited transformation": roleType = "Limited & Transformation Role"; break;
                }
                
                // get the url to the icon on the repo
                let roleData = getRoleData(roleNameParsed, result[0].description);
                
                var embed = {};
                if(roleData && result[0].description.split(/~/)[1][0] == "_") { // actual role
                    // base embed
                    let urlExists = await checkUrlExists(roleData.url);
                     let emUrl = roleData.url;
                     // if the url doesnt exist, use a placeholder
                    if(!urlExists) {
                        let pCat = category.split(" ")[0];
                        switch(pCat) {
                            case "Townsfolk":
                            case "Werewolf":
                            case "Unaligned":
                            case "Solo":
                                emUrl = `${repoBaseUrl}Placeholder/${pCat}.png?version=${stats.icon_version}`;
                            break;
                            default:
                                emUrl = `${repoBaseUrl}Placeholder/Unaligned.png?version=${stats.icon_version}`;
                            break;
                        }
                    }
                    // create the embed
                    embed = {
                        "color": roleData.color,
                        "footer": {
                            "icon_url": `${channel.guild.iconURL()}`,
                            "text": `${channel.guild.name} - ${stats.game}`
                        },
                        "thumbnail": {
                            "url": emUrl
                        },
                        "author": {
                            "name": fancyRoleName,
                            "icon_url": emUrl
                        },
                        "fields": []
                    };
                    
                    if(roleType) embed.title = roleType;
                    
                    // add text
                    if(!simp) {
                        desc.forEach(el => {
                            if(!el[0]) return;
                            if(el[1].length <= 1000) {
                                embed.fields.push({"name": `__${el[0]}__`, "value": el[1]});
                            } else {
                                let descSplit = el[1].split(/\n/);
                               descSplitElements = [];
                               let i = 0;
                               let j = 0;
                               while(i < descSplit.length) {
                                   descSplitElements[j] = "";
                                   while(i < descSplit.length && (descSplitElements[j].length + descSplit[i].length) <= 1000) {
                                       descSplitElements[j] += "\n" + descSplit[i];
                                       i++;
                                   }
                                   j++;
                               }
                               descSplitElements.forEach(d => embed.fields.push({"name": `__${el[0]}__ (${descSplitElements.indexOf(d)+1}/${descSplitElements.length})`, "value": d}));
                            }
                        });
                        if(appendSection) embed.fields.push({"name": `__${appendSection[0]}__`, "value": appendSection[1]});
                    } else {
                        let simpDesc = desc.find(el => el && el[0] === "Simplified");
                        if(simpDesc) {
                            embed.description = simpDesc[1];
                        }  else {
                            simpDesc = desc.find(el => el && el[0] === "Basics");
                            if(simpDesc) {
                                embed.description = simpDesc[1];
                            } else {
                                if(simp) cmdInfoFancy(channel, args, pin, noErr, false, overwriteName, appendSection, editOnto);
                                else cmdInfo(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
                                return;
                            }
                        }
                    }
                } else { // apparntly not a role
                    let desc = result[0].description;
                    desc = applyEmoji(desc);
                    desc = applyNums(channel.guild, desc);
                    let descSplit = desc.split(/~/);
                    let catRole = getCategoryRole(descSplit[0]);
                    let title = descSplit.shift();
                    if(overwriteName) title = overwriteName;
                    
                    // base embed
                    embed = {
                        "color": 7829367,
                        "footer": {
                            "icon_url": `${channel.guild.iconURL()}`,
                            "text": `${channel.guild.name} - ${stats.game}`
                        },
                        "title": title
                    };
                    
                    // append section
                    if(appendSection && appendSection[0] && appendSection[0].length > 0) descSplit.push("**" + appendSection[0] + "**");
                    if(appendSection && appendSection[1] && appendSection[1].length > 0) descSplit.push(...appendSection[1].split(/\r?\n/g));
                    
                    // add emojis for role lists
                    let descSplitCopy = descSplit;
                    let emojiFound = 0;
                    descSplit = descSplit.map(relFull => {
                        let rel = relFull.split(" (")[0]; // remove team names
                        rel = rel.replace(/ x\d+$/, ""); // remove number multipliers
                        if(rel[0] && rel[0].match(/[A-Za-z\*]/) && rel.length < 30 && rel.length > 2 && !rel.match(/[^\w\d\-_\s\*'\\]/)) { // check if role
                                let rName = parseRole(rel.replace(/[^\w\s\-']/g,"").trim()); // parse role
                                console.log(rName);
                                if(rName && verifyRole(rName)) { // find an emoji
                                    console.log("found => " + rName);
                                    let rEmoji = getRoleEmoji(rName);
                                    if(rEmoji) emojiFound++;
                                    else emojiFound--;
                                    if(!rEmoji) rEmoji = client.emojis.cache.find(el => el.name == (toTitleCase(roleNameParsed.split(" ")[0]) + "Placeholder"));
                                    if(!rEmoji) return relFull;
                                    if(relFull.split(" (").length > 1 && rel[0] == "*") rel += "*"; // solo team limited fixer
                                    return `<:${rEmoji.name}:${rEmoji.id}> ${applyTheme(relFull)}`
                                }
                        }
                        return relFull;
                    });
                    // if a majority dont have emojis, then just dont
                    if(emojiFound < 0) descSplit = descSplitCopy;
                    
                    if(descSplit.join("\n").length > 1900) { // too long
                       descSplitElements = [];
                       let i = 0;
                       let j = 0;
                       while(i < descSplit.length) {
                           descSplitElements[j] = "";
                           while(i < descSplit.length && (descSplitElements[j].length + descSplit[i].length) <= 1000) {
                               descSplitElements[j] += "\n" + descSplit[i];
                               i++;
                           }
                           j++;
                       }
                       embed.description = descSplitElements.shift() + "\n" + descSplitElements.shift();
                       embed.fields = [];
                       descSplitElements.forEach(el => embed.fields.push({"name": `...`, "value": el}));
                    } else { // not too long
                        embed.fields = [];
                        embed.description = descSplit.join("\n");
                    }
                    
                    
                    if(catRole) embed.thumbnail = {url: repoBaseUrl + catRole + `.png?version=${stats.icon_version}`};
                }
                
                // send embed
                if(!editOnto) {
                    channel.send({embeds: [ embed ]}).then(m => {
                            // Pin if pin is true
                            if(pin) {
                                m.pin().then(mp => {
                                    mp.channel.messages.fetch().then(messages => {
                                        mp.channel.bulkDelete(messages.filter(el => el.type === "CHANNEL_PINNED_MESSAGE"));
                                    });	
                                }).catch(err => { 
                                    logO(err); 
                                    if(!noErr) sendError(channel, err, "Could not pin info message");
                                });
                            }
                            if(simp) {
                                setTimeout(() => m.delete(), 180000);
                            }
                        // Couldnt send message
                    }).catch(err => {
                        logO(err);
                        if(simp) cmdInfoFancy(channel, args, pin, noErr, false, overwriteName, appendSection, editOnto);
                        else cmdInfo(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
                    });
                } else {
                    // edit onto an existing message instead
                    editOnto.edit({embeds: [ embed ]}).catch(err => {
                        logO(err);
                        if(simp) cmdInfoFancy(channel, args, pin, noErr, false, overwriteName, appendSection, editOnto);
                        else cmdInfo(channel, args, pin, noErr, simp, overwriteName, appendSection, editOnto);
                    });
                }
			} else { 
			// Empty result
				if(!noErr) channel.send("⛔ Database error. Could not find role `" + args[0] + "`!");
			}
		}, () => {
			// DB error
			if(!noErr) channel.send("⛔ Database error. Couldn't look for role information!");
		});	
	}
    
    this.getRoleEmoji = function(roleName) {
        roleName = toTitleCase(roleName).replace(/[^\w]+/g,"").trim().toLowerCase();
        return client.emojis.cache.find(el => el.name.toLowerCase() == roleName);
    }
    
    const fetch = require('node-fetch');
    this.cacheIconLUT = async function() {
        const response = await fetch(repoBaseUrl + "replacements.csv");
        const body = await response.text();
        iconLUT = {};
        body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => iconLUT[el[0]] = el[1].trim().replace(/ /g,"%20"));
        console.log(iconLUT);
    }
	
}

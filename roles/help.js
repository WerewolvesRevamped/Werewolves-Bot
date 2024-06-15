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
				if(isGameMaster(member)) help += stats.prefix + "roles [get|list|list_names] - Manages roles\n";
				if(isGameMaster(member)) help += stats.prefix + "roles [query|parse] - Updates/Parses roles\n";
				if(isGameMaster(member)) help += stats.prefix + "infopin - Returns role info & pins the message\n";
				if(isGameMaster(member)) help += stats.prefix + "infoedit - Edits a bot info message\n";
				if(isGameMaster(member)) help += stats.prefix + "infoadd - Returns role info with additional text\n";
				if(isGameMaster(member)) help += stats.prefix + "elect - Elects a player to a role\n";
				if(isGameMaster(member)) help += stats.prefix + "infomanage [get|list] - Manages info\n";
				if(isGameMaster(member)) help += stats.prefix + "infomanage [query] - Updates info\n";
				if(isGameMaster(member)) help += stats.prefix + "groups [get|list] - Manages groups\n";
				if(isGameMaster(member)) help += stats.prefix + "groups [query|parse] - Updates/Parses groups\n";
				if(isGameMaster(member)) help += stats.prefix + "groups [active|delete] - Returns currently active groups\n";
				if(isGameMaster(member)) help += stats.prefix + "sets [get|list] - Manages sets\n";
				if(isGameMaster(member)) help += stats.prefix + "sets [query] - Updates sets\n";
				help += "; - Returns role info\n";
				help += ". - Returns simplified role info\n";
				help += "~ - Returns formalized role info\n";
				help += "card - Returns a role's card\n";
				help += stats.prefix + "info - Returns role info\n";
				help += stats.prefix + "info_technical - Returns formalized role info\n";
			break;
			case "card":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "card <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the role's card.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "card citizen\n```";
				help += "```diff\nAliases\n\n- &\n```";
			break;
			case "info":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "info <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the description of a role.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "info citizen\n< Citizen | Townsfolk\n  Basics\n  The Citizen has no special abilities.\n  All the innocents vote during the day on whomever they suspect to be an enemy,\n  and hope during the night that they won’t get killed.\n```";
				help += "```diff\nAliases\n\n- i\n```";
			break;
			case "info_technical":
				help += "```yaml\nSyntax\n\n" + stats.prefix + "info_technical <Role Name>\n```";
				help += "```\nFunctionality\n\nShows the formalized description of a role.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "info_technical citizen\n```";
				help += "```diff\nAliases\n\n- ~\n```";
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
			case "update":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "update\n```";
				help += "```\nFunctionality\n\nUpdates all github linked data and re-parses it if applicable.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "update\n```";
			break;
			case "infomanage":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "infomanage [query|get|lust]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle info. " + stats.prefix + "help infomanage <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- im\n```";
					break;
					case "query":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "infomanage query\n```";
						help += "```\nFunctionality\n\nQueries all info from github.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "infomanage query\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "infomanage get <Role Name>\n```";
						help += "```\nFunctionality\n\nGets a specific info message.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "infomanage get tavern\n```";
					break;
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "infomanage list\n```";
						help += "```\nFunctionality\n\nLists all current infos.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "infomanage list\n```";
					break;
                }
            break;
			case "roles":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles [get|list|list_names]\n" + stats.prefix + "roles [query|parse]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle roles. " + stats.prefix + "help roles <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- role\n- r\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles get <Role Name>\n```";
						help += "```\nFunctionality\n\nRetrieves a role's data\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles get citizen\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles list\n```";
						help += "```\nFunctionality\n\nLists all roles, their category and emoji.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles list\n```";
					break;
					case "list_names":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles list_names\n```";
						help += "```\nFunctionality\n\nLists all role names\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles list_names\n```";
					break;
					case "query":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles query\n```";
						help += "```\nFunctionality\n\nQueries all roles from github.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles query\n```";
					break;
					case "parse":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles parse\n```";
						help += "```\nFunctionality\n\nParses all locally stored roles.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "roles parse\n```";
					break;
				}
			break;
			case "groups":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "groups [get|list|list_names]\n" + stats.prefix + "groups [query|parse]\n" + stats.prefix + "groups [active|delete]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle groups. " + stats.prefix + "help groups <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- group\n- r\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "groups get <Group Name>\n```";
						help += "```\nFunctionality\n\nRetrieves a groups's data\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "groups get bakers\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "groups list\n```";
						help += "```\nFunctionality\n\nLists all groups, their team and emoji.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "groups list\n```";
					break;
					case "query":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "groups query\n```";
						help += "```\nFunctionality\n\nQueries all groups from github.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "groups query\n```";
					break;
					case "parse":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "groups parse\n```";
						help += "```\nFunctionality\n\nParses all locally stored groups.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "groups parse\n```";
					break;
					case "active":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "groups active\n```";
						help += "```\nFunctionality\n\nReturns all active groups instances.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "groups active\n```";
					break;
					case "delete":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "groups delete\n```";
						help += "```\nFunctionality\n\nDelets an active group instance (but leaves behind the channel!). Use '" + stats.prefix + "groups active' subcommand to retrieve group ids.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "groups delete [id]\n```";
					break;
				}
			break;
			case "sets":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sets [get|list]\n" + stats.prefix + "sets [query]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle sets. " + stats.prefix + "help sets <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- group\n- r\n```";
					break;
					case "get":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sets get <Set Name>\n```";
						help += "```\nFunctionality\n\nRetrieves a sets's data\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sets get lycan\n```";
					break;
					case "list":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sets list\n```";
						help += "```\nFunctionality\n\nLists all sets.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sets list\n```";
					break;
					case "query":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sets query\n```";
						help += "```\nFunctionality\n\nQueries all sets from github.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sets query\n```";
					break;
				}
			break;
		}
		return help;
	}
}
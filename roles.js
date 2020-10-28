/*
	Module for roles / role info
		- Set role name & aliases
		- Get role info
		- Create / Manage SCs
		- Distribute roles
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
*/
module.exports = function() {
	/* Variables */
	this.loadedModuleRoles = true;
	this.cachedAliases = [];
	this.cachedRoles = [];
	this.cachedSC = 0;
	
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
			case "set": cmdRolesSet(message.channel, args, argsX); break;
			case "get": cmdRolesGet(message.channel, args); break;
			case "remove": cmdRolesRemove(message.channel, args); break;
			case "list": cmdRolesList(message.channel); break;
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
				if(isGameMaster(member)) help += stats.prefix + "roles [set|get|remove|list|list_names|clear] - Manages roles\n";
				if(isGameMaster(member)) help += stats.prefix + "roles [set_alias|remove_alias|list_alias|clear_alias] - Manages role aliases\n";
				if(isGameMaster(member)) help += stats.prefix + "channels [set_ind|get_ind|list_ind] - Manages individual SCs\n";
				if(isGameMaster(member)) help += stats.prefix + "channels [set_extra|set_multi|set_public|get|raw|remove|list|elected] - Manages Extra/Public/Multi SCs\n";
				if(isGameMaster(member)) help += stats.prefix + "channels [info|infopin|info_set|info_get|info_remove|info_list] - Manages SC Info\n";
				if(isGameMaster(member)) help += stats.prefix + "channels cleanup - Cleans up SCs\n";
				if(isGameMaster(member)) help += stats.prefix + "infopin - Returns role info & pins the message\n";
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
				help += "```diff\nAliases\n\n- ip\n```";
			break;
			case "roles":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles [set|get|remove|list|list_names|clear]\n" + stats.prefix + "roles [set_alias|remove_alias|list_alias|clear_alias]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle roles and aliases. " + stats.prefix + "help roles <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- role\n```";
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
						help += "```yaml\nSyntax\n\n" + stats.prefix + "roles list\n```";
						help += "```\nFunctionality\n\nLists all roles and a short part of their description.\n```";
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
				channel.createOverwrite(stats.mayor, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
				channel.createOverwrite(stats.mayor2, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			case "reporter": 
				channel.createOverwrite(stats.reporter, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
					logO(err); 
					sendError(channel, err, "Could not setup channel permissions");
				});
			break;
			case "guardian": 
				channel.createOverwrite(stats.guardian, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(err => { 
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
				cachedTheme.forEach(el => desc = desc.replace(new RegExp(el.original, "g"), el.new));
				channel.send(desc).then(m => {
					// Pin if pin is true
					if(pin) {
						m.pin().then(mp => {
							mp.channel.messages.fetch().then(messages => {
								mp.channel.bulkDelete(messages.filter(el => el.type === "PINS_ADD"));
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
		cleanupCat(channel, cachedSC, "SC");
	}

	
	/* Check if a channel is a SC */
	this.isSC = function(channel) {
		return channel.parentID === cachedSC;
	}
	
	/* Creates secret channels */
	this.createSCs = function(channel, debug) {
		channel.guild.channels.create("🕵 " + toTitleCase(stats.game) + " Secret Channels", { type: "category",  permissionOverwrites: getSCCatPerms(channel.guild) })
		.then(cc => {
			sqlSetStat(14, cc.id, result => {
				createSCStartInd(channel, cc, debug);
				getSCCat();
			}, () => {
				channel.send("⛔ Database error. Unable to save SC category!"); 
			});
		}).catch(err => { 
			logO(err); 
			sendError(channel, error, "Could not create SC category");
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
		sql("SELECT id,role FROM players ORDER BY role ASC", result => {
			result = result.filter(el => el.role.split(",").some(el => multi[index].cond.split(",").includes(el)));
			if(result.length > 0 || multi[index].cond === " ") {
				// Find members of multisc
				sql("SELECT id,role FROM players ORDER BY role ASC", result2 => {
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
					cachedTheme.forEach(el => name = name.replace(new RegExp(el.original, "g"), el.new));
					channel.guild.channels.create(name, { type: "text",  permissionOverwrites: ccPerms })
					.then(sc => {
						// Send info message
						multi[index].setup.split(",").forEach(el => sc.send(stats.prefix + el));
						// Move into sc category
						sc.setParent(category,{ lockPermissions: false }).then(m => {
							createOneMultiSC(channel, category, multi, ++index);
						}).catch(err => { 
							logO(err); 
							sendError(channel, err, "Could not set category");
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
		sql("SELECT id,role FROM players ORDER BY role ASC", result => {
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
		cachedTheme.forEach(el => name = name.replace(new RegExp(el.original, "g"), el.new));
		channel.guild.channels.create(name, { type: "text",  permissionOverwrites: ccPerms })
		.then(sc => {
			// Send info message
			if(extra[index].setup.length > 1) extra[index].setup.replace(/%r/g, result[resultIndex].id + "").replace(/%n/g, resultIndex).split(",").forEach(el => sc.send(stats.prefix + el));
			// Move into sc category
			sc.setParent(category,{ lockPermissions: false }).then(m => {
				createOneOneExtraSC(channel, category, extra, index, result, ++resultIndex);
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not set category");
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
		if(roleListD[0] === "custom") customRole = JSON.parse(roleListD[1].replace(/'/g,"\"").replace(/;/g,","));
		let roleList = roleListD.map(el => "name = " + connection.escape(el)).join(" OR ");
		sql("SELECT name,ind_sc FROM roles WHERE " + roleList, result => {	
			result = result.filter(role => verifyRoleVisible(role.name));
			var roles = result.map(el => toTitleCase(el.name));
			if(!debug) { 
				if(!customRole) {
					roles = roles.join("` + `");
					cachedTheme.forEach(el => roles = roles.replace(new RegExp(el.original, "g"), el.new));
					channel.guild.members.cache.get(players[index].id).user.send("This message is giving you your role" + (result.length != 1 ? "s" : "") + " for the next game of Werewolves: Revamped!\n\n\nYour role" + (result.length != 1 ? "s are" : " is") + " `" + roles + "`.\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.\n\nIf you're confused about your role at all, then check #announcements on the discord, which contains a role book with information on all the roles in this game.").catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not send role message to " + 	channel.guild.members.cache.get(players[index].id).displayName);
					});	
				} else {
					channel.guild.members.cache.get(players[index].id).user.send("This message is giving you your custom role for the next game of Werewolves: Revamped!\n\n\nYour role is `" + toTitleCase(customRole.name) + "` (" + customRole.id + ").\n\nYou are __not__ allowed to share a screenshot of this message! You can claim whatever you want about your role, but you may under __NO__ circumstances show this message in any way to any other participants.").catch(err => { 
						logO(err); 
						sendError(channel, err, "Could not send role message to " + 	channel.guild.members.cache.get(players[index].id).displayName);
					});	
				}
			}
			let indscRoles = result.filter(el => el.ind_sc).map(el => el.name);
			if(customRole) indscRoles = [ customRole.name ];
			// Check if ind sc
			if(indscRoles.length) { 
				channel.send("✅ Creating `" + toTitleCase(indscRoles.join("-")) + "` Ind SC for `" + channel.guild.members.cache.get(players[index].id).displayName + "` (`" + result.map(el => toTitleCase(el.name)).join("` + `") + "`)!");
				// Create permissions
				let ccPerms = getCCCatPerms(channel.guild);
				ccPerms.push(getPerms(players[index].id, ["history", "read"], []));
				// Create channel
				
				var name = indscRoles.join("-");
				cachedTheme.forEach(el => name = name.replace(new RegExp(el.original, "g"), el.new));
				channel.guild.channels.create(name.substr(0, 100), { type: "text",  permissionOverwrites: ccPerms })
				.then(sc => {
					// Send info message
					if(!customRole) indscRoles.forEach(el => cmdInfo(sc, [ el ], true, false));
					else {
						var desc = "";
						desc += "**" + toTitleCase(customRole.name) + "** | " + toTitleCase(customRole.team);
						desc += "\n__Basics__\n" + toSentenceCase(customRole.basics.replace(/%n/g,toTitleCase(customRole.name)));
						desc += "\n__Details__\n" + toSentenceCase(customRole.details.replace(/%n/g,toTitleCase(customRole.name)));
						desc += "\n__Win Condition__\n" + toSentenceCase(customRole.win.replace(/%n/g,toTitleCase(customRole.name)));
						cachedTheme.forEach(el => desc = desc.replace(new RegExp(el.original, "g"), el.new));
						sc.send(desc).then(m => {
							m.pin().then(mp => {
								mp.channel.messages.fetch().then(messages => {
									mp.channel.bulkDelete(messages.filter(el => el.type === "PINS_ADD"));
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
						sendError(channel, err, "Could not set category");
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
		getSCCat();
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
	
	/* Cache SC category */
	this.getSCCat = function() {
		sqlGetStat(14, result => {
			cachedSC = result;
		}, () => {
			log("Roles > ❗❗❗ Unable to cache SC Category!");
		});
	}
	
	/* Converts a role/alias to role */
	this.parseRole = function(input) {
		console.log(input);
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
			result.forEach(el => channel.send("```**__" + toTitleCase(el.name) + "__**:\n" + el.info.replace(/~/g,"\n") + "```"));
		}, () => {
			// Couldn't delete from database
			channel.send("⛔ Database error. Coult not get values from SC Info database!");
		});
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
				channel.send("✅ Set `" + toTitleCase(args[1]) + "`! Preview:\n" + argsX[2].replace(/~/g,"\n") + "\n---------------------------------------------------------------------------------"); 
				getRoles();
			}, () => {
				// Couldn't add to database
				channel.send("⛔ Database error. Could not set role!");
			});		
		} else {
			sql("UPDATE roles SET description = " + connection.escape(argsX[2]) + " WHERE name = " + connection.escape(parseRole(args[1])), result => {
				channel.send("✅ Set `" + toTitleCase(args[1]) + "`! Preview:\n" + argsX[2].replace(/~/g,"\n") + "\n---------------------------------------------------------------------------------"); 
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
		sql("SELECT description FROM roles WHERE name = " + connection.escape(parseRole(args[1])), result => {
			if(result.length > 0) { 
				let roleDesc = result[0].description.replace(/~/g,"\n");
				channel.send("✅ Getting raw `"+ toTitleCase(parseRole(args[1])) + "` description!\n```" + roleDesc + "```");
			} else { 
				channel.send("⛔ Database error. Role `" + parseRole(args[1]) + "` does not exist!");
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
		sql("DELETE FROM roles WHERE name = " + connection.escape(parseRole(args[1])), result => {
			channel.send("✅ Removed `" + toTitleCase(parseRole(args[1])) + "`!");
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
	this.cmdRolesList = function(channel) {
		// Get all roles
		sql("SELECT name,description FROM roles ORDER BY name ASC", result => {
			if(result.length > 0) {
				// At least one role exists
				channel.send("✳ Sending a list of currently existing roles:");
				// Send message
				chunkArray(result.map(role => {
					let roleDesc = role.description.replace(/\*|_|Basics|Details/g,"")
					return "**" +  toTitleCase(role.name) + ":** " + roleDesc.replace(/~/g," ").substr(roleDesc.search("~") + 1, 90)
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
				// For each alias send a message
				chunkArray(result.map(alias => "**" +  toTitleCase(alias.alias) + ":** " + toTitleCase(parseRole(alias.name))), 40).map(el => el.join("\n")).forEach(el => channel.send(el));
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
	
	/* Prints info for a role by name or alias */
	this.cmdInfo = function(channel, args, pin, noErr) {
		// Check arguments
		if(!args[0]) { 
			if(!noErr) channel.send("⛔ Syntax error. Not enough parameters!"); 
			return
		}
		if(!verifyRoleVisible(args[0])) {
			if(!noErr) channel.send("⛔ Command error. Invalid role `" + args[0] + "`!"); 
			return; 
		}
		sql("SELECT description FROM roles WHERE name = " + connection.escape(parseRole(args[0])), result => {
			if(result.length > 0) { 
				var desc = result[0].description.replace(/~/g,"\n");
				cachedTheme.forEach(el => desc = desc.replace(new RegExp(el.original, "g"), el.new));
				channel.send(desc).then(m => {
					// Pin if pin is true
					if(pin) {
						m.pin().then(mp => {
							mp.channel.messages.fetch().then(messages => {
								mp.channel.bulkDelete(messages.filter(el => el.type === "PINS_ADD"));
							});	
						}).catch(err => { 
							logO(err); 
							if(!noErr) sendError(channel, err, "Could not pin info message");
						});
					}
				// Couldnt send message
				}).catch(err => { 
					logO(err); 
					if(!noErr) sendError(channel, err, "Could not send info message");
				});
			} else { 
			// Empty result
				if(!noErr) channel.send("⛔ Database error. Could not find role `" + args[0] + "`!");
			}
		}, () => {
			// DB error
			if(!noErr) channel.send("⛔ Database error. Couldn't look for role information!");
		});	
	}
	
}

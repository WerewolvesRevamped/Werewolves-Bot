/*
	Module for main game handelling
		- Starts game
		
	Requires:
		- Stats/Sql/Utility/Confirm Base Modules
		- Players Module
*/
require("./startup.js")();
require("./caching.js")();
require("./cleanup.js")();
require("./phase.js")();
require("./locations.js")();
require("./polls.js")();
require("./teams.js")();
require("./connections.js")();
require("./storytime.js")();
require("./death.js")();
require("./channels.js")();
require("./discord_roles.js")();
require("./host_information.js")();

module.exports = function() {

	/* Handles start command */
	this.cmdStart = async function(channel, debug) {
		if(stats.gamephase == gp.SETUP || (debug && stats.gamephase == gp.NONE)) {
            // start
        } else { 
            if(stats.gamephase == gp.NONE) {
                channel.send("⛔ Command error. Can't start if there is no game."); 
                return; 
            } else if(stats.gamephase >= gp.INGAME) {
                channel.send("⛔ Command error. Can't start an already started game."); 
                return; 
            } else if(stats.gamephase == gp.SIGNUP) {
                channel.send("⛔ Command error. Can't start the game while signups are open."); 
                return; 
            } else {
                channel.send("⛔ Command error. Invalid gamephase."); 
                return; 
            }
		}
        
        // check requires and unique role values
        let roles = await sqlProm("SELECT roles.name,roles.parsed,players.id FROM roles JOIN players WHERE players.role=roles.name");
        let roleNames = roles.map(el => el.name.toLowerCase());
        for(let i = 0; i < roles.length; i++) {
            let rName = roles[i].name;
            // parse role description
            let parsed = JSON.parse(roles[i].parsed);
            if(!parsed) {
                channel.send(`⛔ List error. Cannot start game with invalid parsed role \`${rName}\`.`); 
                return;
            }
            // check requirements
            let requires = parsed.requires ?? [];
            for(let j = 0; j < requires.length; j++) {
                let parsed = parseRole(requires[j]);
                if(!roleNames.includes(parsed)) {
                    channel.send(`⛔ List error. Cannot start game with role \`${rName}\` without having requirement \`${requires[j]}\`.`); 
                    return;
                }
            }
            // check unique role
            let unique = parsed.unique ?? false;
            if(unique) {
                let filtered = roleNames.filter(el => el === rName);
                if(filtered.length != 1) {
                    channel.send(`⛔ List error. Cannot start game with \`${filtered.length}\` instances of unique role \`${rName}\`.`); 
                    return;
                }
            }
            // check host information
            if(/%(.+?)%/.test(roles[i].parsed)) {
                let matches = [], match = null;
                var hostInfo = new RegExp("%(.+?)%", "g"); 
                while(match = hostInfo.exec(roles[i].parsed)){
                  matches.push(match[1].toLowerCase());
                }
                matches = removeDuplicates(matches);
                let missingMatches = [];
                for(let j = 0; j < matches.length; j++) {
                    let hi = await getHostInformation(roles[i].id, matches[j]);
                    if(hi.length != 1) missingMatches.push(matches[j]);
                }
                if(missingMatches.length > 0) {
                    channel.send(`⛔ List error. Cannot start game with role \`${rName}\` on <@${roles[i].id}> without host information. The following information is missing: ${missingMatches.map(el => '\`' + el + '\`').join(", ")}.`); 
                    return;
                }
            }
        }
        
        //channel.send(`⛔ Debug error. Would've started game.`); 
        //return;
        
		channel.send("✳️ Game is called `" + stats.game + "`");
        createLocations();
		// Set Gamephase
		cmdGamephaseSet(channel, ["set", gp.INGAME]);
		// Cache emojis
		getEmojis();	
		getCCs();
		cacheRoleInfo();
        getPRoles();
        // enable action queue checker 
        pauseActionQueueChecker = false;
		// Assign roles
		startOnePlayer(channel, channel.guild.roles.cache.get(stats.signed_up).members.toJSON(), 0);
		createSCs(channel, debug);
        // reset to d0
        setPhase("d0");
        setSubphase(SUBPHASE.MAIN);
        // emit a starting event
        setTimeout(function() {
            eventStarting();
        }, 1000 * 60);
        
	}
    

	
	this.helpGame = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "sheet [prepare|prepare_|import|mprepare|mimport] - Prepares a game\n";
				if(isGameMaster(member)) help += stats.prefix + "start - Starts a game\n";
				if(isGameMaster(member)) help += stats.prefix + "start_debug - Starts a game, without sending out the role messages\n";
				if(isGameMaster(member)) help += stats.prefix + "reset - Resets a game\n";
				if(isGameMaster(member)) help += stats.prefix + "end - Ends a game\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "demote - Removes Game Master and Admin roles\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "promote - Reassigns Game Master and Admin roles\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "demote_unhost - Demotes or Unhosts\n";
				if(isGameMaster(member) || isHelper(member)) help += stats.prefix + "promote_host - Promotes or Hosts\n";
				if(isGameMaster(member)) help += stats.prefix + "unhost - Removes Host roles\n";
				if(isGameMaster(member)) help += stats.prefix + "host - Adds Host role\n";
				if(isGameMaster(member)) help += stats.prefix + "gameping - Notifies players with the New Game Ping role about a new game\n";
				if(isGameMaster(member)) help += stats.prefix + "open - Opens signups and notifies players\n";
				if(isAdmin(member)) help += stats.prefix + "force_demote_all - Demotes all non-hosts\n";
				if(isSenior(member)) help += stats.prefix + "force_demote_signedup - Demotes everyone that's signedup\n";
			break;
			case "start":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "start\n```";
				help += "```\nFunctionality\n\nStarts the game. Assigns Participant to all signed up players, and takes away the signed up role. Sends out role messages. Creates public channels. Creates Secret Channels. Sends info messages in secret channels. Sets the gamephase.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "start\n```";
			break;
			case "start_debug":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "start_debug\n```";
				help += "```\nFunctionality\n\nDoes the same as " + stats.prefix + "start, but does not send out role messages.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "start_debug\n```";
			break;
			case "reset_debug":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "reset_debug\n```";
				help += "```\nFunctionality\n\nDoes the same as " + stats.prefix + "reset, but keeps all players as signed up.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "reset_debug\n```";
			break;
			case "reset":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "reset\n```";
				help += "```\nFunctionality\n\nResets the game. Resets all discord roles. Clears player database. Deletes all CCs. Deletes all SCs. Deletes all Public Channels. Resets Polls. Resets Connections. Sets the gamephase.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "reset\n```";
			break;
			case "end":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "end\n```";
				help += "```\nFunctionality\n\nEnds the game. Sets the gamephase, and makes all Participants Dead Participants.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "end\n```";
			break;
			case "force_demote_all":
				if(!isAdmin(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "force_demote_all\n```";
				help += "```\nFunctionality\n\nDemotes all non-hosts.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "force_demote_all\n```";
				help += "```diff\nAliases\n\n- fda\n```";
			break;
			case "force_demote_signedup":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "force_demote_signedup\n```";
				help += "```\nFunctionality\n\nDemotes all signedups. Also includes substitutes.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "force_demote_signedup\n```";
				help += "```diff\nAliases\n\n- fdsn\n```";
			break;
			case "demote":
				if(!isGameMaster(member) && !isHelper(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "demote\n```";
				help += "```\nFunctionality\n\nReplaces Game Master and Admin roles with GM Ingame and Admin Ingame roles, which have no permisions.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "demote\n< ✅ Attempting to demote you, McTsts!\n```";
				help += "```diff\nAliases\n\n- de\n```";
			break;
			case "promote":
				if(!isGameMaster(member) && !isHelper(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "promote\n```";
				help += "```\nFunctionality\n\nReplaces GM Ingame and Admin Ingame roles with Game Master and Admin roles.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "promote\n< ✅ Attempting to promote you, McTsts!\n```";
				help += "```diff\nAliases\n\n- pro\n```";
			break;
			case "unhost":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "unhost\n```";
				help += "```\nFunctionality\n\nRemoves Host role.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "demote\n< ✅ Attempting to unhost you, McTsts!\n```";
				help += "```diff\nAliases\n\n- un\n```";
			break;
			case "host":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "host\n```";
				help += "```\nFunctionality\n\nAdds Host role.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "promote\n< ✅ Attempting to host you, McTsts!\n```";
				help += "```diff\nAliases\n\n- ho\n```";
			break;
			case "demote_unhost":
				if(!isGameMaster(member) && !isHelper(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "demote_unhost\n```";
				help += "```\nFunctionality\n\nDemotes or unhosts depending on context.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "demote_unhost\n< ✅ Attempting to demote you, McTsts!\n```";
				help += "```diff\nAliases\n\n- v\n```";
			break;
			case "promote_host":
				if(!isGameMaster(member) && !isHelper(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "promote_host\n```";
				help += "```\nFunctionality\n\nPromotes or hosts depending on context.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "promote_host\n< ✅ Attempting to promote you, McTsts!\n```";
				help += "```diff\nAliases\n\n- ^\n```";
			break;
			case "gameping":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "gameping\n```";
				help += "```\nFunctionality\n\nMakes New Game Ping role mentionable, pings it and then makes it unmentionable again.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "gameping\n< Ts is going to start a new game! @New Game Ping\n```";
				help += "```diff\nAliases\n\n- @@\n```";
			break;
			case "open":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "open\n```";
				help += "```\nFunctionality\n\nOpens signups, then makes New Game Ping role mentionable, pings it and then makes it unmentionable again.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "open\n```";
				help += "```diff\nAliases\n\n- @\n```";
			break;
			case "close":
				if(!isGameMaster(member)) break;
				help += "```yaml\nSyntax\n\n" + stats.prefix + "close\n```";
				help += "```\nFunctionality\n\nCloses signups.\n```";
				help += "```fix\nUsage\n\n> " + stats.prefix + "close\n```";
			break;
			case "sheet":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet [prepare|prepare_|import|mprepare|mimport]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle google sheets used for the game. " + stats.prefix + "help sheet <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- sh\n- game\n```";
					break;
					case "prepare":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet prepare\n```";
						help += "```\nFunctionality\n\nReturns the names and ids (first two columns in a google sheet for the game) of all signed up players in a format which makes it easy to use, to prepare a google sheet for the game.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet prepare\n```";	
					break;
					case "prepare_":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet prepare_\n```";
						help += "```\nFunctionality\n\nSame as " + stats.prefix + "sheet prepare, but returns the information in a slightly different format, which works in some countries.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet prepare_\n```";	
					break;
					case "mprepare":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet mprepare\n```";
						help += "```\nFunctionality\n\nReturns the names and ids of all players seperated with commans. Can be used in combination with " + stats.prefix + "sheet mimport on mobile.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet mprepare\n```";	
					break;
					case "import":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet import\n  <Sheet Information>\n```";
						help += "```\nFunctionality\n\nSets nicknames and roles of players by pasting in the first four columns of a google sheet for the game (First Column: Name, Second Column: Id, Third Column: Nickname (can be empty), Fourth Column: Role)\nOptionally, more columns with extra roles can be provided for double (or more) role games.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet import\n  Fl1nt5t0n3	334066065112039425	The Artist	Stalker\n  Vera	277156693765390337	The Hooker	Angel\n  sav	437289420899745795	The Clown	Dog\n  SuperbWolfPack	309072997950554113	The Dancer	Citizen\n  Chopper2112	271399293372334081	The Chopper	Scared Wolf```";	
					break;
					case "mimport":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "sheet mimport\n  <Sheet Information>\n```";
						help += "```\nFunctionality\n\n" + stats.prefix + "sheet import variation that can be more easily handwritten. Different values are comma seperated (First Column: Name, Second Column: Id, Third Column: Nickname (can be empty), Fourth Column: Role)\nOptionally, more columns with extra roles can be provided for double (or more) role games.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "sheet import\n  Fl1nt5t0n3,334066065112039425,The Artist,Stalker\n  Vera,277156693765390337,The Hooker,Angel\n  sav,437289420899745795,The Clown,Dog\n  SuperbWolfPack,309072997950554113,The Dancer,Citizen\n  Chopper2112,271399293372334081,The Chopper,Scared Wolf```";	
					break;
				}
			break;
		}
		return help;
	}
	
	this.startOnePlayer = function(channel, members, index) {
		if(index >= members.length) {
			channel.send("✅ Prepared `" + members.length + "` players!");
			return;
		}
        switchRoles(members[index], channel, stats.signed_up, stats.participant, "signed up", "participant").then(r => {
            if(r) channel.send("✅ `" + members[index].displayName + "` is now a participant!");
            startOnePlayer(channel, members, ++index);
        });
	}
	
	
    this.cmdForceDemote = function(channel, all = true) {
        // demotable
        let admins = channel.guild.roles.cache.get(stats.admin).members.toJSON();
        let seniorgms = channel.guild.roles.cache.get(stats.senior_gamemaster).members.toJSON();
        let gms = channel.guild.roles.cache.get(stats.gamemaster).members.toJSON();
        let helpers = channel.guild.roles.cache.get(stats.helper).members.toJSON();
        // ignore
        let host = channel.guild.roles.cache.get(stats.host).members.toJSON();
        let ignore = host.map(el => el.id);
        // filter
        let signedup = channel.guild.roles.cache.get(stats.signed_up).members.toJSON();
        let substitute = channel.guild.roles.cache.get(stats.sub).members.toJSON();
        let filter = signedup.map(el => el.id);
        filter.push(...substitute.map(el => el.id));
        // list
        let processedIds = [];
        //
        // list list
        let demotable = [admins, seniorgms, gms, helpers];
        for(let i = 0; i < demotable.length; i++) {
            for(let j = 0; j < demotable[i].length; j++) {
                let curid = demotable[i][j].id;
                if(processedIds.includes(curid)) { // already previously handeled
                    continue;
                }
                processedIds.push(curid); // save as processed
                if(ignore.includes(curid)) { // is host, ignore
                    //console.log(`FD ignore: ${demotable[i][j].displayName}`);
                    continue;
                }
                if(all || filter.includes(curid)) { // only demote signedup if all=false
                    //console.log(`FD demote: ${demotable[i][j].displayName}`);
                    cmdDemote(channel, demotable[i][j]);
                } else {
                    //console.log(`FD filtered out: ${demotable[i][j].displayName}`);
                }
            }
        }
    }
    
	this.cmdDemote = function(channel, member) {
		channel.send("✅ Attempting to demote you, " + member.displayName + "!");
        switchRolesX(member, channel, stats.gamemaster_ingame, stats.gamemaster, "gamemaster ingame", "gamemaster");
        switchRolesX(member, channel, stats.senior_gamemaster_ingame, stats.senior_gamemaster, "senior gamemaster ingame", "senior gamemaster");
        switchRolesX(member, channel, stats.admin_ingame, stats.admin, "admin ingame", "admin");
        switchRolesX(member, channel, stats.helper_ingame, stats.helper, "helper ingame", "helper");
	}
	
	this.cmdPromote = function(channel, member) {
		if(isParticipant(member) && !member.roles.cache.get(stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a participant."); 
			return;
		}
        if(isDeadParticipant(member) && !member.roles.cache.get(stats.senior_gamemaster_ingame) && !member.roles.cache.get(stats.admin_ingame)) {
			channel.send("⛔ Command error. Can't promote you while you're a dead participant."); 
			return;
		}
		channel.send("✅ Attempting to promote you, " + member.displayName + "!");
        switchRoles(member, channel, stats.gamemaster_ingame, stats.gamemaster, "gamemaster ingame", "gamemaster");
        switchRoles(member, channel, stats.senior_gamemaster_ingame, stats.senior_gamemaster, "senior gamemaster ingame", "senior gamemaster");
        switchRoles(member, channel, stats.admin_ingame, stats.admin, "admin ingame", "admin");
        switchRoles(member, channel, stats.helper_ingame, stats.helper, "helper ingame", "helper");
	}

	
	this.cmdUnhost = function(channel, member) {
		channel.send("✅ Attempting to unhost you, " + member.displayName + "!");
		if(member.roles.cache.get(stats.host)) {
            removeRoleRecursive(member, channel, stats.host, "host");
		}
	}
	
	this.cmdHost = function(channel, member) {
		if(isParticipant(member)) {
			channel.send("⛔ Command error. Can't host you while you're a participant."); 
			return;
		}
		channel.send("✅ Attempting to host you, " + member.displayName + "!");
		if(member.roles.cache.get(stats.gamemaster)) {
            addRoleRecursive(member, channel, stats.host, "host");
		}
	}
    
    this.cmdDemoteUnhost = function(channel, member) {
        if(member.roles.cache.get(stats.host)) {
            cmdUnhost(channel, member);
        } else {
            cmdDemote(channel, member);
        }
    }
    
    this.cmdPromoteHost = function(channel, member) {
        if(member.roles.cache.get(stats.gamemaster_ingame) || member.roles.cache.get(stats.senior_gamemaster_ingame) || member.roles.cache.get(stats.admin_ingame) || member.roles.cache.get(stats.helper_ingame)) {
            cmdPromote(channel, member);
        } else {
            cmdHost(channel, member);
        }
    }
	
	this.cmdEnd = function(channel) {
		gameEnd();
	}
    
    this.gameEnd = async function() {
        // update gamephase
        await sqlProm("UPDATE stats SET value=" + connection.escape(gp.POSTGAME) + " WHERE id=1");
        stats.gamephase = gp.POSTGAME;
        // update gp channel
        updateGameStatus();
        // update player roles
		mainGuild.roles.cache.get(stats.participant).members.forEach(el => {
            addRoleRecursive(el, backupChannelId, stats.dead_participant, "dead participant");
		});
        mainGuild.roles.cache.get(stats.sub).members.forEach(el => {
            addRoleRecursive(el, backupChannelId, stats.dead_participant, "dead participant");
		});
    }
	
	/* Handles reset command */
	this.cmdReset = function(channel, debug) {
		// Set Gamephase
		cmdGamephaseSet(channel, ["set", gp.NONE]);
		// Reset Connection
		cmdConnectionReset(channel);
		// Reset Player Database
        if(!debug) {
            sql("DELETE FROM players", result => {
                channel.send("✅ Successfully reset player list!");
                getEmojis();
            },() => {
                channel.send("⛔ Database error. Could not reset player list!");
            });
        }
        // reset active groups
        groupsReset();
        // reset active attributes
        attributesReset();
        // reset active attributes
        abilitiesReset();
        // reset active polls
        pollsReset();
        // resets storytime
        resetStorytime();
        // resets choices
        choicesReset();
        // reset kill queue
        killqClear();
        // reset teams
        resetTeams();
        // reset host information
        resetHostInformation();
        // disable action queue checker 
        pauseActionQueueChecker = true;
		// Reset Poll Count
		sqlSetStat(13, 1, result => {
			channel.send("✅ Successfully reset poll counter!");
		}, () => {
			channel.send("⛔ Database error. Could not reset poll counter!");
		});
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.participant).members.toJSON(), 0, "participant");
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.dead_participant).members.toJSON(), 0, "dead participant");
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.ghost).members.toJSON(), 0, "ghost");
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.gamemaster).members.toJSON(), 0, "game master");
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.spectator).members.toJSON(), 0, "spectator");
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.sub).members.toJSON(), 0, "substitute");
		removeNicknameOnce(channel, channel.guild.roles.cache.get(stats.helper).members.toJSON(), 0, "helper");
		// Remove Roles & Nicknames
		wroles_remove(channel, [stats.signed_up, stats.spectator, stats.mayor, stats.mayor2, stats.reporter, stats.guardian, stats.sub, stats.participant, stats.dead_participant, stats.host, stats.ghost], ["signed up", "spectator", "mayor", "mayor2", "reporter", "guardian", "substitute", "participant", "dead participant", "host", "ghost"]);
        // run role removal again for critical roles because sometimes it fails even though it says it succeeds
		wroles_remove(channel, [stats.participant, stats.dead_participant, stats.ghost], ["participant", "dead participant", "ghost"]);
		// Cleanup channels
		cmdCCCleanup(channel);
		scCleanup(channel);
		sqlGetStat(15, result => {
			cleanupCat(channel, result, "public");
		}, () => {
			channel.send("⛔ Database error. Could not get public category!");
		});
        resetRoleNames(channel);
	}
    
    this.resetRoleNames = async function(channel) {
        // rename roles correctly
        let roles = [stats.signed_up, stats.spectator, stats.mayor, stats.mayor2, stats.reporter, stats.guardian, stats.sub, stats.participant, stats.dead_participant, stats.host, stats.gamemaster, stats.ghost];
        let names = ["Signed-up","Spectator","Mayor (<=" + stats.mayor_threshold + ")","Mayor (>" + stats.mayor_threshold + ")","Reporter","Guardian","Substitute","Participant","Dead Participant","Host", "Game Master", "Ghost"];
        for(let i = 0; i < roles.length; i++) {
            await channel.guild.roles.cache.get(roles[i]).setName(names[i]);
        }  
        channel.send("✅ Reset role names!");
    }
	
	this.wroles_remove = function(channel, ids, names) {
		wroles_remove2(channel, ids[0], names[0], () => {
			if(ids.length > 1) wroles_remove(channel, ids.splice(1), names.splice(1));
			else channel.send("✅ Finished removing roles!");
		});
	}
	
	this.wroles_remove2 = function(channel, id, name, callback) {
		// Remove spectator role
		if(channel.guild.roles.cache.get(id)) wroles_removeOnce(channel, id, name, channel.guild.roles.cache.get(id).members.toJSON(), 0, callback);
		else channel.send("Invalid role with id " + id);
	}
	
	this.wroles_removeOnce = function(channel, id, name, members, index, callback) {
		if(index >= members.length) {
			callback();
			if(members.length > 0) channel.send("✅ Removed `" + name + "` role from `" + members.length + "` players!");
			return;
		}
		removeRoleRecursive(members[index], channel, id, name).then(m => {
            wroles_removeOnce(channel, id, name, members, ++index, callback);
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			wroles_removeOnce(channel, id, name, members, index, callback);
			sendError(channel, err, "Could not remove " + name + " role from " + members[index].displayName + "! Trying again");
		});
	}
	
	// Reset nicknames
	this.removeNicknameOnce = function(channel, members, index, name) {
		if(index >= members.length) {
			if(members.length > 0) channel.send("✅ Reset nicknames of `" + members.length + "` " + name + (members.length>1?"s":"") + "!");
			return;
		}
		members[index].setNickname("").then(m => {
			removeNicknameOnce(channel, members, ++index, name);
		}).catch(err => { 
			// Missing permissions
			logO(err); 
			sendError(channel, err, "Could not reset nickname from " + members[index].displayName);
			removeNicknameOnce(channel, members, ++index, name);
		});
	}
	
	/* Handle Sheet Command */
	this.cmdSheet = function(message, args) {
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `sheet [prepare|prepare_|import]`!"); 
			return; 
		}
		// Find Subcommand
		switch(args[0]) {
			// Prepare Sheet
			case "prepare": cmdSheetPrepare(message.channel, ",", 1); break;
			case "prepare_": cmdSheetPrepare(message.channel, ";", 1); break;
			case "mprepare": cmdSheetPrepare(message.channel, ",", 2); break;
			case "import": cmdSheetImport(message, message.channel, args, 1); break;
			case "mimport": cmdSheetImport(message, message.channel, args, 2); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
	
	/* Prepare info for sheet */
	this.cmdSheetPrepare = function(channel, seperator, mode) {
		// Check gamephase
		if(stats.gamephase >= gp.INGAME) { 
			channel.send("⛔ Command error. Can't prepare an already started game."); 
			return; 
		}
		// Get all players
		sql("SELECT id,emoji FROM players WHERE type='player'", result => {
			// Print all players
			let playerList;
			switch(mode) {
				case 1:
					playerList = result.map(el => "=SPLIT(\"" + channel.guild.members.cache.get(el.id).user.username + "," + el.id + "\"" + seperator + "\",\")").join("\n");
					channel.send("**Copy this into a google sheet to have all names & ids**\n*Make sure to paste in with ctrl+shift+v\nColumns needed by `" + stats.prefix + "sheet import`: Name, Id, Nickname, Role*");
				break;
				case 2:
					playerList = result.map(el => channel.guild.members.cache.get(el.id).user.username + "," + el.id + ",").join("\n");
					channel.send("**Use this to have all names & ides**\n*Values needed by `" + stats.prefix + "sheet mimport`: Name,Id,Nickname,Role*");
				break;
			}
			channel.send("```\n" + playerList + "\n```");
		}, () => {
			// db error
			channel.send("⛔ Database error. Could not list signed up players!");
		});
	}
	
	/* Import info from sheet */
	this.cmdSheetImport = function(message, channel, args, mode) {
		// Check gamephase
		if(stats.gamephase >= gp.INGAME) { 
			channel.send("⛔ Command error. Can't import into an already started game."); 
			return; 
		}
		// Split info
		let playerInfo;
		switch(mode) {
			case 1: playerInfo = message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").split("~").slice(1).map(el => el.split(/\s\s\s\s/g)); break;
			case 2: playerInfo = message.content.slice(stats.prefix.length).trim().replace(/\n/g,"~").split("~").slice(1).map(el => el.split(/,/g)); break;
		}
		playerInfo.forEach(async el => { 
			// Prepare a user
			channel.send("▶ Preparing `" + el[0] + "`!").then(m => {
				// Set Nickname
				channel.guild.members.cache.get(el[1]).setNickname(el[2]).then(u => {
					m.edit(m.content +  "\n	" + (el[2].length > 0 ? "✅ Set nickname to `" + el[2] + "`" : "✅ Skipped setting nickname") + "!").then(m => {
						cmdSheetImportRole(m, el);
					});
				}).catch(err => {
					m.edit(m.content +  "\n	⛔ Permission error. Could not set nickname!").then(m => {
						cmdSheetImportRole(m, el);
					});
				});
			}).catch(err => {
				// Message Error
				logO(err); 
				sendError(channel, err, "Could not prepare user");
			});
		});
	}
	
	/* Imports one players' role via a pasted sheet */
	this.cmdSheetImportRole = async function(m, el) {
        // check valid role
        let parsedRole = parseRole(el[3]);
		// Set Role
		if(verifyRole(parsedRole)) {
			// All roles are valid -> Set it
            let roleData = await getRoleDataFromName(parsedRole);
			sql("UPDATE players SET role = " + connection.escape(parsedRole) + ",orig_role = " + connection.escape(parsedRole) + ",alignment=" + connection.escape(roleData.team) + " WHERE id = " + connection.escape(el[1]), result => {
				m.edit(m.content + "\n	✅ Set role to `" + parsedRole + "`!").then(m => {
				});
			}, () => {
				m.edit(m.content + "\n	⛔ Database error. Could not set role!").then(m => {
				});
			});
		} else {
			// Invalid roles
			m.edit(m.content + "\n	⛔ Command error. Role `" + parsedRole + "` does not exist!").then(m => {
			});
		}
	}
	
	/* Pings all players with the New Game Ping role */
	this.cmdGamePing = function(channel, member) {
        if(!stats.new_game_ping || stats.new_game_ping === "false") return;
		channel.guild.roles.cache.get(stats.new_game_ping).setMentionable(true).then(u => {
			channel.send("**" + member.displayName + "** is going to start a new game! <@&" + stats.new_game_ping + ">").then(m => {
				channel.guild.roles.cache.get(stats.new_game_ping).setMentionable(false).catch(err => {
					// Message Error
					logO(err); 
					sendError(channel, err, "Could not reset new game ping role");
				});
			}).catch(err => {
				// Message Error
				logO(err); 
				sendError(channel, err, "Could not ping new game ping role");
			});
		}).catch(err => {
			// Message Error
			logO(err); 
			sendError(channel, err, "Could not prepare new game ping role");
		});
	}
	
	/* Opens signups & Pings players */
	this.cmdOpen = function(message) {
        cmdHost(message.channel, message.member);
        message.channel.send("**Signups are now open!**");
		cmdGamephase(message, ["set", gp.SIGNUP]);
		cmdGamePing(message.channel, message.member);
	}
    
	/* Closes signups */
	this.cmdClose = function(message) {
        message.channel.send("**Signups are now closed!**");
		cmdGamephase(message, ["set", gp.SETUP]);
	}
	
}

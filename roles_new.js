/**
New Roles Module

**/
module.exports = function() {
    
    /**
    Repo Paths
    **/
    const iconRepo = "WerewolvesRevamped/Werewolves-Icons";
    const iconRepoBranch = "main"
    const roleRepo = "McTsts/Werewolves-Roles";
    const roleRepoBranch = "main";
    
    /**
    Global Role Values
    **/
    this.cachedRoles = [];
    this.cachedAliases = [];
    
    	
	/**
    Command: $roles
    Handle roles command
    **/
	this.cmdRoles = function(message, args, argsX) {
		// Check subcommand
		if(!args[0]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Role Subcommand
			case "query": cmdRolesQuery(message.channel); break;
			case "parse": cmdRolesParse(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $roles query
    Runs queryRoles to query all roles from github
    **/
    this.cmdRolesQuery = async function(channel) {
        channel.send(`🔄 Querying roles. Please wait. This may take several minutes.`);
        try {
            const output = await queryRoles();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying roles failed.`);
        }
        channel.send(`✅ Querying roles completed.`);
    }
    
    /**
    Command: $roles parse
    Parses all roles currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdRolesParse = async function(channel) {
        channel.send(`🔄 Parsing roles. Please wait. This may take several minutes.`);
        try {
            output = await parseRoles();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` roles. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` roles. `);
        } catch(err) {
            channel.send(`⛔ Querying roles failed.`);
        }
        channel.send(`✅ Parsing roles completed. `);
    }
    
    /**
    Command: $info
    Returns a role info message
    channel: the channel to send the info message in
    args: the role name
    simp: if the info message should be simplified
    technical: if the formalized desc should be shown instead
    overwriteName: overwrites the name with a specified value
    appendSection: ??? (appends an additional section)
    editOnto: ??? (edits the message onto another one instead of sending it)
    **/
    this.cmdInfo = async function(channel, args, pin = false, noErr = false, simp = false, overwriteName = false, appendSection = false, editOnto = false, technical = false) {
		// fix role name if necessary
        if(!args) {
            if(!noErr) channel.send("❗ Could not find role.");
            return;
        }
		let roleName = args.join(" ").replace(/[^a-zA-Z0-9'\-_\$ ]+/g,""); // get rid of characters that are not allowed in role names
        let origRoleName = roleName;
        roleName = parseRole(roleName);
		if(!verifyRole(roleName)) { // not a valid role
			// get all roles and aliases, to get an array of all possible role names
			let allRoleNames = [...cachedRoles, ...cachedAliases.map(el => el.alias)];
			let bestMatch = findBestMatch(roleName.toLowerCase(), allRoleNames.map(el => el.toLowerCase())); // find closest match
			// check if match is close enough
			if(bestMatch.value <= ~~(roleName.length/2)) { // auto alias if so, but send warning 
				roleName = parseRole(bestMatch.name);
                if(roleName.toLowerCase() === bestMatch.name.toLowerCase()) channel.send("❗ Could not find role `" + origRoleName + "`. Did you mean `" + roleName + "`?");
                else channel.send("❗ Could not find role `" + origRoleName + "`. Did you mean `" + roleName + "` (aka `" + (bestMatch.name.length>2 ? toTitleCase(bestMatch.name) : bestMatch.name.toUpperCase()) + "`)?");
			} else { // early fail if otherwise
				channel.send("❗ Could not find role `" + origRoleName + "`.");
                return;
			}
		}
		
        // get embed with specified sections
        let sections = ["basics", "details"];
        if(simp) sections = ["simplified"];
        if(technical) sections = ["formalized"];
        let roleEmbed = await getRoleEmbed(roleName, sections, channel.guild);
        
        // overwrite name
        if(overwriteName) {
            roleEmbed.author.name = overwriteName;
        }
        
        // send embed
        channel.send({ embeds: [ roleEmbed ] }).then(m => {
            if(pin) { // pin message if pin is set to true
                m.pin().then(mp => {
                    mp.channel.messages.fetch().then(messages => {
                        mp.channel.bulkDelete(messages.filter(el => el.type === MessageType.ChannelPinnedMessage)); // delete pinning message
                    });	
                })
            }
        });
        
        
    }
    
    /**
    Info Shortcuts
    **/
    this.cmdInfoTechnical = function(channel, args) { cmdInfo(channel, args, false, false, false, false, false, false, true); } // via $info_technical
    this.cmdInfoIndirect = function(channel, args) { cmdInfo(channel, args, false, true); } // via ;
    this.cmdInfoIndirectSimplified = function(channel, args) { cmdInfo(channel, args, false, true, true); } // via . 
    this.cmdInfoIndirectTechnical = function(channel, args) { cmdInfo(channel, args, false, true, false, false, false, false, true); } // via ~
    this.cmdInfopin = function(channel, args) { cmdInfo(channel, args, true); } // via $infopin
    
    /**
    Get Role Embed 
    Returns an info embed for a role 
    WIP: Re-implement role filter
    **/
    this.getRoleEmbed = function(roleName, visibleSections, guild) {
        return new Promise(res => {
            sql("SELECT * FROM roles_new WHERE name = " + connection.escape(roleName), async result => {
                result = result[0];
                if(!result) {
                    return null; // no data found
                }
                // Get the role data
                let roleData = getRoleData(result.display_name, result.class, result.category, result.team);
                
                // check if the role img exists
                let urlExists = await checkUrlExists(roleData.url);
                 let emUrl = roleData.url;
                 // if the url doesnt exist, use a placeholder
                if(!urlExists) {
                    console.log("MISSING URL", roleData.url);
                    switch(result.class) {
                        case "townsfolk": case "werewolf": case "unaligned": case "solo":
                            emUrl = `https://raw.githubusercontent.com/${iconRepo}/${iconRepoBranch}/Placeholder/${toTitleCase(result.class)}.png?version=${stats.icon_version}`;
                        break;
                        default:
                            emUrl = `https://raw.githubusercontent.com/${iconRepo}/${iconRepoBranch}/Placeholder/Unaligned.png?version=${stats.icon_version}`;
                        break;
                    }
                }
                
                // Build role name for title
                let fancyRoleName = `${result.display_name} [${toTitleCase(result.class)} ${toTitleCase(result.category)}]`;
                if(result.class == "solo") fancyRoleName = `${result.display_name} [${toTitleCase(result.class)} ${toTitleCase(result.category)} - ${toTitleCase(result.team)} Team]`;
                fancyRoleName = applyTheme(fancyRoleName);
                
                // Get the server icon for the footer
                let serverIcon = await guild.iconURL();
                serverIcon = serverIcon.replace("webp","png");
                
                // Build the basic embed
                var embed = {
                    "color": roleData.color,
                    "footer": {
                        "icon_url": `${serverIcon}`,
                        "text": `${guild.name} - ${stats.game}`
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
                
                // Role Type
                const roleTypeData = getRoleTypeData(result.type);
                if(result.type != "default") embed.title = roleTypeData.name;
                
                // add visible sections as sections
                for(const sec in visibleSections) {
                    let sectionText = "";
                    // get the text from the result object
                    switch(visibleSections[sec]) {
                        case "basics": sectionText = result.desc_basics; break;
                        case "details": sectionText = result.desc_details; break;
                        case "simplified": sectionText = result.desc_simplified; break;
                        case "formalized": sectionText = result.desc_formalized; break;
                        case "card": sectionText = result.desc_card; break;
                    }
                    // only add the section if it exists
                    if(sectionText) {
                        if(sectionText.length < 1000) { // check if text fits directly in one section
                            embed.fields.push({"name": `__${toTitleCase(visibleSections[sec])}__`, "value": sectionText});
                        } else { // split section into several
                            let sectionTextSplit = sectionText.split(/\n/);
                           sectionTextSplitElements = [];
                           let i = 0;
                           let j = 0;
                           while(i < sectionTextSplit.length) {
                               sectionTextSplitElements[j] = "";
                               while(i < sectionTextSplit.length && (sectionTextSplitElements[j].length + sectionTextSplit[i].length) <= 1000) {
                                   sectionTextSplitElements[j] += "\n" + sectionTextSplit[i];
                                   i++;
                               }
                               j++;
                           }
                           sectionTextSplitElements.forEach(d => embed.fields.push({"name": `__${toTitleCase(visibleSections[sec])}__ (${sectionTextSplitElements.indexOf(d)+1}/${sectionTextSplitElements.length})`, "value": d}));
                        }
                    }
                }
                
                // resolve promise with the embed
                res(embed);
                
            }, () => {
                // DB error
                console.log("⛔ Database error. Couldn't look for role information!");
            });	
        });
    }
    
    /**
    Get Role Data
    **/
    this.getRoleData = function(roleName, rClass, rCategory, rTeam) {
            
        // get the right folder
        var url = `https://raw.githubusercontent.com/${iconRepo}/${iconRepoBranch}/`;
        if(rClass == "solo") url += `Solo/${toTitleCase(rTeam)}`;
        else url += `${toTitleCase(rClass)}/${toTitleCase(rCategory)}`;
        // add file name
        url += `/${toTitleCase(roleName)}.png`;
        // replace spaces
        url = url.replace(/ /g, "%20")
        url += `?version=${stats.icon_version}`;
        
        // get color
        let color = 0;
        // WIP: This should do a lookup in colors csv
        switch(rTeam) {
            case "townsfolk": color = 3138709; break;
            case "werewolf": color = 14882377; break;            case "unaligned": color = 15451648; break;            case "extra": color = 9719883; break;            case "hell": color = 7607345; break;            case "underworld": color = 6361226; break;            case "pyro": color = 15173690; break;            case "flute": color = 3947978; break;            case "white wolves": color = 16777215; break;            case "plague": color = 30001; break;            case "nightmare": color = 1649994; break;            case "flock": color = 13093063; break;            case "graveyard": color = 8497497; break;            default:
                color = 7829367;
                log(`Missing Color. Role: ${roleName}; Category: ${rCategory}; Team: ${rTeam}`);
            break;
        }
        
        return { url: url, color: color };
    }
    
    /**
    Get Role Type Data
    Returns additional information for role types
    **/
    this.getRoleTypeData = function(roleTypeIn) {
        var roleTypeID = 0;
        var roleType = "Default";
        switch(roleTypeIn) {
            case "technical": roleTypeID = 3; roleType = "Technical Role"; break;
            case "limited": roleTypeID = 2; roleType = "Limited Role"; break;
            case "transformation": roleTypeID = 1; roleType = "Transformation Role"; break;
            case "transformation limited":
            case "limited transformation": roleTypeID = -1; roleType = "Limited & Transformation Role"; break;
            
            case "joke role": 
            case "joke": roleTypeID = 4; roleType = "Joke Role"; break;
            case "temporary": roleTypeID = 5; roleType = "Temporary Role"; break;
            case "fake role":
            case "variant": roleTypeID = 7; roleType = "Variant Role"; break;
            case "mini": roleTypeID = 6; roleType = "Mini Wolves Exclusive"; break;
        }
        return { id: roleTypeID, name: roleType };
    }
    
    /**
    Clear Roles
    deletes the entire contents of the roles database
    **/
    this.clearRoles = function() {
		sql("DELETE FROM roles_new");
	}
    
    /**
    Cache Roles
    caches the current state of the roles database
    **/
    this.cacheRoles = function() {
		sql("SELECT name FROM roles_new", result => {
				cachedRoles = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache role!");
		});
	}
    
    /* Cache role aliases */
	this.cacheAliases = function() {
		sql("SELECT alias,name FROM roles_alias", result => {
				cachedAliases = result;
		}, () => {
			log("Roles > ❗❗❗ Unable to cache role aliases!");
		});
	}
    
    /** 
    Cache Role Info
    runs all relevant caching functions
    */
    this.cacheRoleInfo = function() {
		cacheAliases();
		cacheRoles();
		//getSCCats();
	}
    
    /** 
    Query Roles
    queries all roles from github
    **/
    this.queryRoles = async function() {
        // Clear all roles
        clearRoles();
        // get all files
        const tree = await getRolesTree();
        // get all role paths
        const paths = await getRolePaths();
        
        // outputs
        var outputs = [];
        var errorCount = 0;
        
        // iterate through all files to see which ones are roles
        for(const treeEl in tree) {
            // get the path without the name
            var path = tree[treeEl].path;
            path = path.split("/");
            const name = path.pop();
            path = path.join("/");
            // check if the path is part of the role paths
            if(paths.includes(path)) {
                try {
                    const roleContents = await queryRole(path, name); // get the role contents
                    const roleDescs = roleContents.match(/__([^_]+)__\n([\s\S]+?)(?=__[^_]+__|$)/g); // split the role descriptions, into the different types of role description
                    const emptyDesc = "No description available.";
                    const roleName = roleContents.match(/^\*\*(.+?)\*\*/)[1]; // grabs the role name inbetween the **'s in the first line
                    const fullCategory = roleContents.match(/^\*\*.+?\*\* \| (.*?)(\n| \|)/)[1].split(" - "); // grab the other part of the first line, which contains class, category and team
                    var roleType = roleContents.match(/^.* \| .* \| (.*)\n/); // gets role type
                    roleType = (roleType && roleType[1]) ? roleType[1].toLowerCase() : "default"; // if no role type is specified, set it to "Default"
                    const roleClass = fullCategory[0].split(" ")[0].toLowerCase(); // get class
                    const roleCategory = fullCategory[0].split(" ")[1].toLowerCase(); // get category
                    const roleTeam = fullCategory.length==1 ? roleClass : fullCategory[1].replace(" Team","").toLowerCase(); // either same as class, or if specifically specified second half of full category
                    const parsedRoleName = roleName.toLowerCase().replace(/[^a-z ]/g,""); // parsed role name
                    let descObj = { basics: "", details: "", simplified: emptyDesc, formalized: emptyDesc, card: emptyDesc };
                    // go through the different types of descriptions and assign them to a object
                    roleDescs.forEach(el => {
                        let split = el.split("\n"); // split the desc to extract name
                        let tname = split.shift().replace(/_/g, "").toLowerCase(); // extract name
                        let desc = split.join("\n"); // combine the rest to get the desc again
                        // switch by the name to assign valid descriptions to object and error for invalid ones
                        switch(tname) {
                            case "basics": descObj.basics = desc; break;
                            case "details": descObj.details = desc; break;
                            case "simplified": descObj.simplified = desc; break;
                            case "formalized": descObj.formalized = desc; break;
                            case "card": descObj.card = desc; break;
                            default: outputs.push(`Could not identify \`${tname}\` section for \`${name}\`.`); break;
                        }
                    });
                    // imsert the role into the databse
                    sql("INSERT INTO roles_new (name,display_name,class,category,team,type,desc_basics,desc_details,desc_simplified,desc_formalized,desc_card) VALUES (" + connection.escape(parsedRoleName) +"," + connection.escape(roleName) +"," + connection.escape(roleClass) + "," + connection.escape(roleCategory) + "," + connection.escape(roleTeam) + "," + connection.escape(roleType) + "," + connection.escape(descObj.basics) + "," + connection.escape(descObj.details) + "," + connection.escape(descObj.simplified) + "," + connection.escape(descObj.formalized) + "," + connection.escape(descObj.card) + ")");
                } catch (err) {
                    outputs.push(`Error for \`${name}\`: \`\`\`${err}\`\`\``);
                    errorCount++;
                }
            }
            if(errorCount > 10) {
                outputs.push(`Terminating querying due to 10 errors.`);
                break;
            }
        }
        // Cache Role Info again
        cacheRoleInfo();
        // output errors
        return outputs;
    }
    
    /**
    Parse Roles
    Parses all roles
    **/
    this.parseRoles = async function() {
        var output = [];
        var successCounter = 0;
        var failureCounter = 0;
        // iterate through all roles and parse them
        // due to async map we only get an array of promises back - we wait for all of them to resolve
        const promises = cachedRoles.map(async el => {
            let parsedRole = null;
            try {
                // get the formalized description from the DB
                let formalizedDesc = (await sqlPromEsc("SELECT desc_formalized FROM roles_new WHERE name = ", el))[0].desc_formalized;
                if(formalizedDesc == "No description available.") {
                    throw new Error("No formalized description available");
                }
                // parse the role using the role parser
                parsedRole = parseRoleText(formalizedDesc.split("\n"));
                successCounter++;
                sql("UPDATE roles_new SET parsed = " + connection.escape(JSON.stringify(parsedRole)) + " WHERE name = " + connection.escape(el));
            } catch (err) {
                output.push(`**${toTitleCase(el)}:** ${err}`);
                failureCounter++;
            }
        });
        
        // wait for all promises to resolve
        await Promise.all(promises);
        
        return { output: output, success: successCounter, failure: failureCounter };
    }
    
    /**
    Parse Role
    Parses a role name
    **/
    this.parseRole = function(input) {
		input = input.toLowerCase(); // change role name to lower case
        input = input.replace(/[^a-z ]/g, ""); // remove any non a-z characters
        let alias = cachedAliases.find(el => el.alias === input);
		if(alias) return parseRole(alias.name);
		else return input;
	}
    
    /** Verify Role
    Verifies if a role exists
    **/
    this.verifyRole = function(input) {
        if(cachedRoles.length == 0) return true; // if cache is currently not loaded just allow it
		let inputRole = parseRole(input); // parse role name
		let role = cachedRoles.find(el => el === inputRole); // check if role is in cache
		return role ? true : false;
	}
    
    /**
    Get Roles Tree
    Retrieves the tree of files of the roles repository.
    **/
    this.getRolesTree = async function() {
        const auth = { headers: { 'Authorization': 'token ' + config.github_token } };
        const body = await fetchBody("https://api.github.com/repos/" + roleRepo + "/git/trees/" + roleRepoBranch + "?recursive=1", auth);
        return JSON.parse(body).tree;
    }
    
    /**
    Get Role Paths
    Retrieves all the paths at which roles are located as an array
    **/
    this.getRolePaths = async function() {
        const body = await fetchBody("https://raw.githubusercontent.com/" + roleRepo + "/" + roleRepoBranch + "/role_paths");
        const paths = body.split("\n").filter(el => el);
        return paths;
    }
    
    /** 
    Query Role
    Retrieves a single role from github
    **/
    this.queryRole = async function(path, name) {
        const body = await fetchBody("https://raw.githubusercontent.com/" + roleRepo + "/" + roleRepoBranch + "/" + path + "/" + name);
        return body;
    }
    
    /**
    Cache Icon LUT (Look Up Table)
    A lookup table for role names to icons
    **/
    this.cacheIconLUT = async function() {
        const body = await fetchBody("https://raw.githubusercontent.com/" + iconRepo + "/" + iconRepoBranch + "/replacements.csv");
        iconLUT = {};
        body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => iconLUT[el[0]] = el[1].trim().replace(/ /g,"%20"));
        //console.log(iconLUT);
    }

    
}
/**
    Roles Module - Link
    The module for the github<->db link and related functionalities
**/
module.exports = function() {
    /**
    Command: $roles query
    Runs queryRoles to query all roles from github
    **/
    this.cmdRolesQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying roles. Please wait. This may take several minutes.`);
        try {
            const output = await queryRoles();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying roles failed.`);
        }
        channel.send(`✅ Querying roles completed.`);
        cacheRoleInfo();
    }
    
    /**
    Command: $sets query
    Runs queryRoles to query all ability sets from github
    **/
    this.cmdSetsQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying ability sets. Please wait. This may take several minutes.`);
        try {
            const output = await querySets();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying ability sets failed.`);
        }
        channel.send(`✅ Querying ability sets completed.`);
        cacheRoleInfo();
    }
    
    /**
    Command: $infomanage query
    Runs queryInfo to query all info from github
    **/
    this.cmdInfomanageQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying info. Please wait. This may take several minutes.`);
        try {
            const output = await queryInfo();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying info failed.`);
        }
        channel.send(`✅ Querying info completed.`);
        cacheRoleInfo();
    }
    /**
    Command: $displays query
    Runs queryDisplays to query all displays from github
    **/
    this.cmdDisplaysQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying displays. Please wait. This may take several minutes.`);
        try {
            const output = await queryDisplays();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying displays failed.`);
        }
        channel.send(`✅ Querying displays completed.`);
        cacheDisplays();
    }
    
    /**
    Command: $groups query
    Runs queryGroups to query all groups from github
    **/
    this.cmdGroupsQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying groups. Please wait. This may take several minutes.`);
        try {
            const output = await queryGroups();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying groups failed.`);
        }
        channel.send(`✅ Querying groups completed.`);
        cacheRoleInfo();
    }
    
    /**
    Command: $locations query
    Runs queryLocations to query all locations from github
    **/
    this.cmdLocationsQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying locations. Please wait. This may take several minutes.`);
        try {
            const output = await queryLocations();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying locations failed.`);
        }
        channel.send(`✅ Querying locations completed.`);
        cacheLocations();
    }
    
    /**
    Command: $polls query
    Runs queryPolls to query all polls from github
    **/
    this.cmdPollsQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying polls. Please wait. This may take several minutes.`);
        try {
            const output = await queryPolls();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying polls failed.`);
        }
        channel.send(`✅ Querying polls completed.`);
        cachePolls();
    }
    
    /**
    Command: $attributes query
    Runs queryAttributes to query all attributes from github
    **/
    this.cmdAttributesQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying attributes. Please wait. This may take several minutes.`);
        try {
            const output = await queryAttributes();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying attributes failed.`);
        }
        channel.send(`✅ Querying attributes completed.`);
        cacheAttributes();
    }
    
    /**
    Command: $teams query
    Runs queryTeams to query all teams from github
    **/
    this.cmdTeamsQuery = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query while ingame.");
            return;
        }
        
        channel.send(`🔄 Querying teams. Please wait. This may take several minutes.`);
        try {
            const output = await queryTeams();
            output.forEach(el => channel.send(`❗ ${el}`));
        } catch(err) {
            channel.send(`⛔ Querying teams failed.`);
        }
        channel.send(`✅ Querying teams completed.`);
        cacheTeams();
    }
    
    /**
    Command: $roles parse
    Parses all roles currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdRolesParse = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot parse while ingame.");
            return;
        }
        
        channel.send(`🔄 Parsing roles. Please wait. This may take several minutes.`);
        try {
            const output = await parseRoles();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` roles. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` roles. `);
        } catch(err) {
            channel.send(`⛔ Parsing roles failed.`);
        }
        channel.send(`✅ Parsing roles completed. `);
    }
    
    /**
    Command: $groups parse
    Parses all groups currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdGroupsParse = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot parse while ingame.");
            return;
        }
        
        channel.send(`🔄 Parsing groups. Please wait. This may take several minutes.`);
        try {
            const output = await parseGroups();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` groups. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` groups. `);
        } catch(err) {
            channel.send(`⛔ Parsing groups failed.`);
        }
        channel.send(`✅ Parsing groups completed. `);
    }
    
    /**
    Command: $polls parse
    Parses all polls currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdPollsParse = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot parse while ingame.");
            return;
        }
        
        channel.send(`🔄 Parsing polls. Please wait. This may take several minutes.`);
        try {
            const output = await parsePolls();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` polls. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` polls. `);
        } catch(err) {
            channel.send(`⛔ Parsing polls failed.`);
        }
        channel.send(`✅ Parsing polls completed. `);
    }
    
    /**
    Command: $attributes parse
    Parses all attributes currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdAttributesParse = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot parse while ingame.");
            return;
        }
        
        channel.send(`🔄 Parsing attributes. Please wait. This may take several minutes.`);
        try {
            const output = await parseAttributes();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` attributes. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` attributes. `);
        } catch(err) {
            channel.send(`⛔ Parsing attributes failed.`);
        }
        channel.send(`✅ Parsing attributes completed. `);
    }
    
    /**
    Command: $teams parse
    Parses all teams currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdTeamsParse = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot parse while ingame.");
            return;
        }
        
        channel.send(`🔄 Parsing teams. Please wait. This may take several minutes.`);
        try {
            const output = await parseTeams();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` teams. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` teams. `);
        } catch(err) {
            channel.send(`⛔ Parsing teams failed.`);
        }
        channel.send(`✅ Parsing teams completed. `);
    }
    
    /**
    Command: $update
    Updates all github linked data
    **/
    this.cmdUpdate = async function(channel) {
        if(stats.gamephase == gp.INGAME) {
            channel.send("⛔ Command error. Cannot query or parse while ingame");
            return;
        }
        
        var output;
        /** Pre Parsing */
        // query ability sets
        channel.send(`🔄 Querying ability sets. Please wait. This may take several minutes.`);
        output = await querySets();
        channel.send(`❗ Querying ability sets completed with \`${output.length}\` errors.`);
        /** Parsed Elements */
        // query roles
        channel.send(`🔄 Querying roles. Please wait. This may take several minutes.`);
        output = await queryRoles();
        channel.send(`❗ Querying roles completed with \`${output.length}\` errors.`);
        // parse roles
        channel.send(`🔄 Parsing roles. Please wait. This may take several minutes.`);
        output = await parseRoles();
        channel.send(`❗ Parsing roles completed with \`${output.output.length}\` errors.`);
        // query groups
        channel.send(`🔄 Querying groups. Please wait. This may take several minutes.`);
        output = await queryGroups();
        channel.send(`❗ Querying groups completed with \`${output.length}\` errors.`);
        // parse groups
        channel.send(`🔄 Parsing groups. Please wait. This may take several minutes.`);
        output = await parseGroups();
        channel.send(`❗ Parsing groups completed with \`${output.output.length}\` errors.`);
        // query polls
        channel.send(`🔄 Querying polls. Please wait. This may take several minutes.`);
        output = await queryPolls(); 
        channel.send(`❗ Querying polls completed with \`${output.length}\` errors.`);
        // parse polls
        channel.send(`🔄 Parsing polls. Please wait. This may take several minutes.`);
        output = await parsePolls();
        channel.send(`❗ Parsing polls completed with \`${output.output.length}\` errors.`);
        // query attributes
        channel.send(`🔄 Querying attributes. Please wait. This may take several minutes.`);
        output = await queryAttributes();
        channel.send(`❗ Querying attributes completed with \`${output.length}\` errors.`);
        // parse attributes
        channel.send(`🔄 Parsing attributes. Please wait. This may take several minutes.`);
        output = await parseAttributes();
        channel.send(`❗ Parsing attributes completed with \`${output.output.length}\` errors.`);
        // query teams
        channel.send(`🔄 Querying teams. Please wait. This may take several minutes.`);
        output = await queryTeams();
        channel.send(`❗ Querying teams completed with \`${output.length}\` errors.`);
        // parse teams
        channel.send(`🔄 Parsing teams. Please wait. This may take several minutes.`);
        output = await parseTeams();
        channel.send(`❗ Parsing teams completed with \`${output.output.length}\` errors.`);
        /** No Parsing */
        // query info
        channel.send(`🔄 Querying info. Please wait. This may take several minutes.`);
        output = await queryInfo();
        channel.send(`❗ Querying info completed with \`${output.length}\` errors.`);
        // query locations
        channel.send(`🔄 Querying locations. Please wait. This may take several minutes.`);
        output = await queryLocations();
        channel.send(`❗ Querying locations completed with \`${output.length}\` errors.`);
        // query displays
        channel.send(`🔄 Querying displays. Please wait. This may take several minutes.`);
        output = await queryDisplays();
        channel.send(`❗ Querying displays completed with \`${output.length}\` errors.`);
        /** Post Update */
        // cache values
        cacheRoleInfo();
        channel.send(`❗ Caching role info.`);
        cacheLocations();
        channel.send(`❗ Caching location info.`);
        cachePolls();
        channel.send(`❗ Caching poll info.`);
        cacheTeams();
        channel.send(`❗ Caching teams info.`);
        channel.send(`✅ Update completed.`);
    }
        
    /**
    Run Query
    Runs a query for a specified game element
    **/
    const emptyDesc = "No description available.";
    async function runQuery(clearFunc, path, callbackFunc, maxAllowedErrors = 1, repo = null, branch = null) {
        // clear the relevant table
        await clearFunc();
        // get all files
        const tree = await getTree(repo ?? roleRepo, branch ?? roleRepoBranch);

        // get the relevant paths file
        const paths = await getPaths(path);
        
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
            // check if the path is part of the path
            if(paths.includes(path)) {
                // calls the callback that extracts the relevant data from the file
                try {
                    let feedback = await callbackFunc(path, name);
                    if(feedback) outputs.push(feedback); // add to output if output was specified
                } catch (err) {
                    outputs.push(`Error for \`${name}\`: \`\`\`${err}\`\`\``);
                    errorCount++;
                }
            }
            if(errorCount >= maxAllowedErrors) {
                outputs.push(`Terminating querying due to ${maxAllowedErrors} errors.`);
                break;
            }
        }
        // Cache Role Info again
        cacheRoleInfo();
        // WIP: ^ this is async and does not necessarily finish in time
        // WIP2: ^ this also doesnt cache polls, teams or locations which are part of game module not role module
        // output errors
        return outputs;     
    }
    
    async function runQuerySecondary(clearFunc, path, callbackFunc, maxAllowedErrors = 1) {
        return await runQuery(clearFunc, path, function(a, b) { callbackFunc(a, b, roleRepoSecondaryBaseUrl); }, maxAllowedErrors, roleRepoSecondary, roleRepoSecondaryBranch);
    }
    
    async function runQueryBoth(clearFunc, path1, path2, callbackFunc, maxAllowedErrors = 1) {
        let outputs1 = await runQuery(clearFunc, path1, callbackFunc, maxAllowedErrors);
        let outputs2 = await runQuerySecondary(() => {}, path2, callbackFunc, maxAllowedErrors);
        return [...outputs1, ...outputs2];
    }
    
    /**
    Split Role Description Sections
    split the role descriptions, into the different types of role description
    **/
    function splitRoleDescSections(roleDesc) {
        let sections = roleDesc.match(/__([^_]+)__ *\n([\s\S]+?)(?=__[^_]+__|$)/g);
        if(!sections) return [];
        sections = sections.map(el => {
            let splitd = el.split("\n"); // split the desc to extract name
            let tname = splitd.shift().replace(/_/g, "").trim().toLowerCase(); // extract name
            let desc = splitd.join("\n"); // combine the rest to get the desc again
            return [tname, desc];
        });
        return sections;
    }
    
    /**
    Get Role Description Name
    grabs the role name inbetween the **'s in the first line
    **/
    function getRoleDescName(roleDesc) {
        let name = roleDesc.match(/^\*\*(.+?)\*\*/);
        if(!name || name.length < 2) return "No Name";
        return name[1];
    }
    
    /**
    Get Full Role Category
    returns the classcat and other
    **/
    function getFullCategory(roleDesc) {
        let cat = roleDesc.match(/^\*\*.+?\*\* \| (.*?)(\n| \|)/);
        if(!cat || cat.length < 2) return ["No Category"];
        return cat[1].split(" - ");
    }
    
    /**
    Get Database Name
    Returns the database compatible name
    **/
    function getDBName(name) {
        return name.toLowerCase().replace(/[^a-z\$ ]/g,"").trim();
    }
    
    /** 
    Query Roles
    queries all roles from github
    **/
    async function queryRoles() {
        return await runQueryBoth(clearRoles, rolepathsPath, rolepathsPathSecondary, queryRolesCallback, 10);
    }
        
    /**
    Clear Roles
    deletes the entire contents of the roles database
    **/
     function clearRoles() {
		return sqlProm("DELETE FROM roles");
	}
    
    /**
    Query Roles - Callback
    the callback for role queries - run once for each role with the name and path passed.
    **/
    async function queryRolesCallback(path, name, baseurl = null) {
        var output = null;
        // extract values
        const roleContents = await queryFile(path, name, baseurl); // get the role contents
        const roleDescs = splitRoleDescSections(roleContents); // split the role descriptions, into the different types of role description
        const roleName = getRoleDescName(roleContents); // grabs the role name inbetween the **'s in the first line
        const fullCategory = getFullCategory(roleContents); // grab the other part of the first line, which contains class, category and team
        var roleType = roleContents.match(/^.* \| .* \| (.*)\n/); // gets role type
        roleType = (roleType && roleType[1]) ? roleType[1].toLowerCase() : "default"; // if no role type is specified, set it to "Default"
        const classCat = fullCategory[0].split(" "); // extract class & category
        const roleClass = classCat[0].toLowerCase(); // get class
        const roleCategory = classCat[1].toLowerCase(); // get category
        const roleTeam = fullCategory.length==1 ? roleClass : fullCategory[1].replace(" Team","").toLowerCase(); // either same as class, or if specifically specified second half of full category
        const parsedRoleName = getDBName(roleName); // parsed role name
        let descObj = { basics: "", details: "", simplified: emptyDesc, formalized: emptyDesc, card: emptyDesc };
        // go through the different types of descriptions and assign them to a object
        roleDescs.forEach(el => {
            // switch by the name to assign valid descriptions to object and error for invalid ones
            switch(el[0]) {
                case "basics": descObj.basics = el[1]; break;
                case "details": descObj.details = el[1]; break;
                case "simplified": descObj.simplified = el[1]; break;
                case "formalized": descObj.formalized = el[1]; break;
                case "card": descObj.card = el[1]; break;
                default: output = `Could not identify \`${el[0]}\` section for \`${name}\`.`; break;
            }
        });
        // imsert the role into the databse
        sql("INSERT INTO roles (name,display_name,class,category,team,type,desc_basics,desc_details,desc_simplified,desc_formalized,desc_card) VALUES (" + connection.escape(parsedRoleName) +"," + connection.escape(roleName) +"," + connection.escape(roleClass) + "," + connection.escape(roleCategory) + "," + connection.escape(roleTeam) + "," + connection.escape(roleType) + "," + connection.escape(descObj.basics) + "," + connection.escape(descObj.details) + "," + connection.escape(descObj.simplified) + "," + connection.escape(descObj.formalized) + "," + connection.escape(descObj.card) + ")");
        // return output
        return output;
    }
    
    
    /** 
    Query Ability Sets
    queries all ability sets from github
    **/
    async function querySets() {
        return await runQuery(clearSets, setspathsPath, querySetsCallback, 5);
    }
        
    /**
    Clear Roles
    deletes the entire contents of the roles database
    **/
     function clearSets() {
		return sqlProm("DELETE FROM sets");
	}
    
    /**
    Query Sets - Callback
    the callback for role queries - run once for each role with the name and path passed.
    **/
    async function querySetsCallback(path, name) {
        var output = null;
        // extract values
        const roleContents = await queryFile(path, name); // get the role contents
        const roleDescs = roleContents.split("\n"); // split the role descriptions, into the different types of role description
        roleDescs.shift();
        const contents = roleDescs.join("\n");
        const setName = getRoleDescName(roleContents); // grabs the role name inbetween the **'s in the first line
        const parsedSetName = getDBName(setName); // parsed role name
        // insert the role into the databse
        sql("INSERT INTO sets (name,display_name,contents) VALUES (" + connection.escape(parsedSetName) + "," + connection.escape(setName) + "," + connection.escape(contents) + ")");
        // return output
        return output;
    }
    
    /** 
    Query Info
    queries all infos from github
    **/
    async function queryInfo() {
        return await runQueryBoth(clearInfo, infopathsPath, infopathsPathSecondary, queryInfoCallback, 5);
    }
    
    /**
    Clear Info
    deletes the entire contents of the info database
    **/
     function clearInfo() {
		return sqlProm("DELETE FROM info");
	}
    
    /** 
    Query Info - Callback
    queries all infos from github
    **/
    async function queryInfoCallback(path, name, baseurl = null) {
        // extract values
        var infoContents = await queryFile(path, name, baseurl); // get the role contents
        const dbName = getDBName(name); // get the db name
        var displayName = "";
        var matches;
        // check if a name is present in the file
        if(matches = infoContents.match(/^\*\*([A-Za-z\- \(\)&!\?,\.']+)\*\* \| (.+)\n/)) {
            displayName = `${matches[1]} [${matches[2]}]`;
        } else if(matches = infoContents.match(/^\*\*([A-Za-z\- \(\)&!\?,\.']+)\*\*\s*\n/)) {
            displayName = `${matches[1]}`;
        } else if(matches = infoContents.match(/^(<\?[\w\d]*:[^>]{0,10}\>) +\*{0,2}([A-Za-z\- \(\)&!\?,\.']+)\*{0,2} +(<\?[\w\d]*:[^>]{0,10}\>)\s*\n/)) {
            displayName = `${matches[1]} ${matches[2]} ${matches[3]}`;
        }
        // remove first line, if display name found
        if(displayName) {
            let temp = infoContents.split("\n");
            temp.shift();
            infoContents = temp.join("\n");
        }
        // split by simplified
        const splitInfoContents = infoContents.split("__Simplified__");
        const mainContents = splitInfoContents[0].trim();
        const simplifiedContents = splitInfoContents[1] ? splitInfoContents[1].trim() : "";
        // imsert the role into the databse
        sql("INSERT INTO info (name,display_name,contents,simplified) VALUES (" + connection.escape(dbName) + "," + connection.escape(displayName) + "," + connection.escape(mainContents) + "," + connection.escape(simplifiedContents) + ")");
        // return nothing
        return null;
    }
    
    /** 
    Query Displays
    queries all displays from github
    **/
    async function queryDisplays() {
        return await runQuery(clearDisplays, displayspathsPath, queryDisplaysCallback, 2);
    }
    
    /**
    Clear Displays
    deletes the entire contents of the displays database
    **/
     function clearDisplays() {
		return sqlProm("DELETE FROM displays");
	}
    
    /** 
    Query Displays - Callback
    queries all displays from github
    **/
    async function queryDisplaysCallback(path, name, baseurl = null) {
        // extract values
        var displayContents = await queryFile(path, name, baseurl); // get the display contents
        const dbName = getDBName(name); // get the db name
        var displayName = name;
        var matches;
        // check if a name is present in the file
        if(matches = displayContents.match(/^\*\*([A-Za-z\- \(\)&!\?,\.']+)\*\*\s*\n/)) {
            displayName = `${matches[1]}`;
        }
        // remove first line, if display name found
        if(displayName) {
            let temp = displayContents.split("\n");
            temp.shift();
            displayContents = temp.join("\n");
        }
        // imsert the role into the databse
        sql("INSERT INTO displays (name, display_name, contents) VALUES (" + connection.escape(dbName) + "," + connection.escape(displayName) + "," + connection.escape(displayContents) + ")");
        // return nothing
        return null;
    }
    
    /** 
    Query Groups
    queries all groups from github
    **/
    async function queryGroups() {
        return await runQueryBoth(clearGroups, grouppathsPath, grouppathsPathSecondary, queryGroupsCallback, 5);
    }
    
    /**
    Clear Groups
    deletes the entire contents of the groups database
    **/
     function clearGroups() {
		return sqlProm("DELETE FROM `groups`");
	}
    
    /** 
    Query Groups - Callback
    queries all groups from github
    **/
    async function queryGroupsCallback(path, name, baseurl = null) {
        // extract values
        var groupContents = await queryFile(path, name, baseurl); // get the group contents
        const dbName = getDBName(name); // get the db name
        const roleDescs = splitRoleDescSections(groupContents); // split the group descriptions, into the different types of group description
        const roleName = getRoleDescName(groupContents); // grabs the group name inbetween the **'s in the first line
        const fullCategory = getFullCategory(groupContents); // get the parts of first line besides name
        const teamName = fullCategory[0].replace("Team Group", "").trim().toLowerCase(); // extract team name
        const basics = roleDescs.filter(el => el[0] == "basics")[0][1] ?? "";
        const members = roleDescs.filter(el => el[0] == "members")[0][1] ?? "";
        const formalized = roleDescs.filter(el => el[0] == "formalized")[0][1] ?? "";
        // imsert the group into the databse
        sql("INSERT INTO `groups` (name,display_name,team,desc_basics,desc_members,desc_formalized) VALUES (" + connection.escape(dbName) + "," + connection.escape(roleName) + "," + connection.escape(teamName) + "," + connection.escape(basics) + "," + connection.escape(members) + "," + connection.escape(formalized) + ")");
        // return nothing
        return null;
    }
    
    /** 
    Query Attributes
    queries all attributes from github
    **/
    async function queryAttributes() {
        return await runQueryBoth(clearAttributes, attributepathsPath, attributepathsPathSecondary, queryAttributesCallback, 5);
    }
    
    /**
    Clear Attributes
    deletes the entire contents of the attributes database
    **/
     function clearAttributes() {
		return sqlProm("DELETE FROM attributes");
	}
    
    /** 
    Query Attributes - Callback
    queries all attributes from github
    **/
    async function queryAttributesCallback(path, name, baseurl = null) {
        // extract values
        var attributeContents = await queryFile(path, name, baseurl); // get the attribute contents
        const dbName = getDBName(name); // get the db name
        const roleDescs = splitRoleDescSections(attributeContents); // split the attribute descriptions, into the different types of attribute description
        const roleName = getRoleDescName(attributeContents); // grabs the attribute name inbetween the **'s in the first line
        const basics = roleDescs.filter(el => el[0] == "basics")[0][1] ?? "";
        const formalized = roleDescs.filter(el => el[0] == "formalized")[0][1] ?? "";
        // imsert the attribute into the databse
        sql("INSERT INTO attributes (name,display_name,desc_basics,desc_formalized) VALUES (" + connection.escape(dbName) + "," + connection.escape(roleName) + "," + connection.escape(basics) + "," + connection.escape(formalized) + ")");
        // return nothing
        return null;
    }
    
    /** 
    Query Teams
    queries all teams from github
    **/
    async function queryTeams() {
        return await runQueryBoth(clearTeams, teamspathsPath, teamspathsPathSecondary, queryTeamsCallback, 5);
    }
    
    /**
    Clear Teams
    deletes the entire contents of the teams database
    **/
     function clearTeams() {
		return sqlProm("DELETE FROM teams");
	}
    
    /** 
    Query Teams - Callback
    queries all attributes from github
    **/
    async function queryTeamsCallback(path, name, baseurl = null) {
        // extract values
        var teamContents = await queryFile(path, name, baseurl); // get the team contents
        const dbName = getDBName(name); // get the db name
        const teamDescs = splitRoleDescSections(teamContents); // split the team descriptions, into the different types of team description
        const teamName = getRoleDescName(teamContents); // grabs the team name inbetween the **'s in the first line
        const formalized = teamDescs.filter(el => el[0] == "formalized")[0][1] ?? "";
        const basics = teamDescs.filter(el => el[0] == "basics")[0][1] ?? "";
        
        // split into lines
        let formalizedLines = formalized.split("\n");
        let win_condition = "", formalizedFiltered = [];
        
        // find specific key value
        formalizedLines.forEach(el => {
            let spl = el.split(": ");
            switch(spl[0]) {
                case "Win Condition": win_condition = spl[1]; break;
                default: formalizedFiltered.push(el); break;
            }
        });
        
        // merge formalized
        formalizedFiltered = formalizedFiltered.join("\n");
        
        // imsert the team into the databse
        sql("INSERT INTO teams (name,display_name,win_condition,desc_basics,desc_formalized) VALUES (" + connection.escape(dbName) + "," + connection.escape(teamName) + "," + connection.escape(win_condition) + "," + connection.escape(basics) + "," + connection.escape(formalizedFiltered) + ")");
        // return nothing
        return null;
    }
    
    /** 
    Query Polls
    queries all polls from github
    **/
    async function queryPolls() {
        return await runQuery(clearPolls, pollpathsPath, queryPollsCallback, 2);
    }
    
    /**
    Clear Polls
    deletes the entire contents of the groups database
    **/
     function clearPolls() {
		return sqlProm("DELETE FROM polls");
	}
    
    /** 
    Query Polls - Callback
    queries all groups from github
    **/
    async function queryPollsCallback(path, name) {
        // extract values
        var pollContents = await queryFile(path, name); // get the role contents
        const dbName = getDBName(name); // get the db name
        const pollName = getRoleDescName(pollContents); // grabs the role name inbetween the **'s in the first line
        
        // split into lines
        let pollLines = pollContents.split("\n");
        pollLines.shift();
        
        let options = "", voters = "", random = "", show_voters = 1, formalized = [];
        
        // find specific key value
        pollLines.forEach(el => {
            let spl = el.split(": ");
            switch(spl[0]) {
                case "Available Options": options = spl[1]; break;
                case "Allowed Voters": voters = spl[1]; break;
                case "Random": random = spl[1]; break;
                case "Show Voters": show_voters = +(spl[1] === "Yes"); break;
                default: formalized.push(el); break;
            }
        });
        
        // merge formalized
        formalized = formalized.join("\n");
        
        // default for random
        if(options.includes("Random") && random == "") random = "@All";

        // imsert the role into the databse
        sql("INSERT INTO polls (name,display_name,options,random,voters,show_voters,desc_formalized) VALUES (" + connection.escape(dbName) + "," + connection.escape(pollName) + "," + connection.escape(options) + "," + connection.escape(random) + "," + connection.escape(voters) + "," + show_voters + "," + connection.escape(formalized) + ")");
        // return nothing
        return null;
    }
    
    /** 
    Query Locations
    queries all locations from github
    **/
    async function queryLocations() {
        return await runQuery(clearLocations, locationpathsPath, queryLocationsCallback, 2);
    }
    
    /**
    Clear Locations
    deletes the entire contents of the locations database
    **/
     function clearLocations() {
		return sqlProm("DELETE FROM locations");
	}
    
    /** 
    Query Locations - Callback
    queries all locations from github
    **/
    async function queryLocationsCallback(path, name) {
        // extract values
        var locationContents = await queryFile(path, name); // get the location contents
        const dbName = getDBName(name); // get the db name
        const roleDescs = splitRoleDescSections(locationContents); // split the location descriptions, into the different types of description
        const locName = getRoleDescName(locationContents); // grabs the location name inbetween the **'s in the first line
        let description;
        let formalized;
        if(roleDescs.length === 0) {
            description = "";
            formalized = locationContents.split("\n");
            formalized.shift();
            formalized = formalized.join("\n");
        } else {
            description = roleDescs.filter(el => el[0] == "description")[0][1] ?? "";
            formalized = roleDescs.filter(el => el[0] == "formalized")[0][1] ?? "";
        }
        const formalizedParsed = formalized.split("\n").map(el => {
            let spl = el.split(": ");
            return { name: spl[0], value: spl[1] };
        });
        const sort_index = formalizedParsed.find(el => el.name == "Sort Index").value;
        let members = formalizedParsed.find(el => el.name == "Members").value;
        let viewers = formalizedParsed.find(el => el.name == "Viewers").value;
        members = members.split(", ").join(",");
        viewers = viewers.split(", ").join(",");
        if(members === "*All*") members = "Alive,Dead,Ghost,Substitute,Spectator";
        if(members === "*None*") members = "";
        if(viewers === "*All*") viewers = "Alive,Dead,Ghost,Substitute,Spectator";
        if(viewers === "*None*") viewers = "";
        // imsert the role into the databse
        sql("INSERT INTO locations (name,display_name,description,sort_index,members,viewers) VALUES (" + connection.escape(dbName) + "," + connection.escape(locName) + "," + connection.escape(description.trim()) + "," + connection.escape(sort_index) + "," + connection.escape(members) + "," + connection.escape(viewers) + ")");
        // return nothing
        return null;
    }
    
    /**
    Run Parser
    runs parser for a certain game element
   **/
   async function runParser(dbName, cacheName) {
        var output = [];
        var successCounter = 0;
        var failureCounter = 0;
        // iterate through all roles and parse them
        // due to async map we only get an array of promises back - we wait for all of them to resolve
        const promises = cacheName.map(async el => {
            let parsed = null;
            try {
                // get the formalized description from the DB
                let formalizedDesc = (await sqlPromEsc("SELECT desc_formalized FROM " + dbName + " WHERE name = ", el))[0].desc_formalized;
                if(formalizedDesc == "No description available.") {
                    throw new Error("No formalized description available");
                }
                
                // substitute in ability sets
                formalizedDesc = await replaceAsync(formalizedDesc, /Inherit: `(.+)`/g, async function(match, set) { 
                    console.log(match, set);
                    set = getDBName(set);
                    // check if ability set exists
                    if(!verifySet(set)) {
                        throw new Error(`Invalid Ability Set \`\`\`\n${set}\n\`\`\``);
                    }
                    // get ability set from db
                    const abilitySet = await sqlPromEsc("SELECT * FROM sets WHERE name = ", set);
                    // return ability set contents
                    return abilitySet[0].contents;
                });
                
                // parse the role using the role parser
                parsed = parseRoleText(formalizedDesc.split("\n"));
                // remove role attributes
                let roleAttributes = "";
                if(parsed.role_attribute && parsed.role_attribute.length > 0) {
                    roleAttributes = parsed.role_attribute.map(el => parseAttributeName(el)).join(",");
                }
                delete parsed.role_attribute;
                successCounter++;
                sql("UPDATE " + dbName + " SET parsed = " + connection.escape(JSON.stringify(parsed)) + " WHERE name = " + connection.escape(el));
                if(roleAttributes.length > 0) sql("UPDATE " + dbName + " SET attributes = " + connection.escape(roleAttributes) + " WHERE name = " + connection.escape(el));
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
    Parse Roles
    Parses all roles
    **/
    async function parseRoles() {
        return await runParser("roles", cachedRoles);
    }
   
    /**
    Parse Groups
    Parses all groups
    **/
    async function parseGroups() {
        return await runParser("`groups`", cachedGroups);
    }
    
    /**
    Parse Polls
    Parses all polls
    **/
    async function parsePolls() {
        return await runParser("polls", cachedPolls);
    }
    
    /**
    Parse Attributes
    Parses all attributes
    **/
    async function parseAttributes() {
        return await runParser("attributes", cachedAttributes);
    }
    
    /**
    Parse Teams
    Parses all teams
    **/
    async function parseTeams() {
        return await runParser("teams", cachedTeams);
    }
    
    /**
    Command: Parse
    parses a single game element
    **/
    this.cmdParse = async function(channel, args) {
        if(stats.gamephase == gp.INGAME && !(args[2] === "force" || args[2] === "f")) {
            channel.send("⛔ Command error. Cannot parse while ingame. To ignore this warning specify 'force' as a third argument.");
            return;
        }
        
        let result = await runParser(args[0], [ args[1] ]);
        result.output.forEach(el => channel.send(`❗ ${el}`));
        channel.send(`Parsed \`${args[1]}\` as \`${args[0]}\`.`);
    }
    
    /**
    Get Tree
    Retrieves the tree of files of the roles repository.
    **/
    async function getTree(repo, branch) {
        const auth = { headers: { 'Authorization': 'token ' + config.github_token } };
        const body = await fetchBody(`${githubAPI}repos/${repo}/git/trees/${branch}?recursive=1`, auth);
        return JSON.parse(body).tree;
    }
    
    /**
    Get Paths
    Retrieves all the paths at which a certain type of game elements are located as an array
    **/
    async function getPaths(path) {
        const body = await fetchBody(path);
        const paths = body.split("\n").filter(el => el);
        return paths;
    }
    
    /** 
    Query File
    Retrieves a single file from github
    **/
    async function queryFile(path, name, baseurl = null) {
        const body = await fetchBody(`${baseurl ?? roleRepoBaseUrl}${path}/${name}`);
        return body;
    }  
    
}
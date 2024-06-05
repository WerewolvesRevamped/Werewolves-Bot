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
    Command: $groups query
    Runs queryGroups to query all groups from github
    **/
    this.cmdGroupsQuery = async function(channel) {
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
    Command: $roles parse
    Parses all roles currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdRolesParse = async function(channel) {
        channel.send(`🔄 Parsing roles. Please wait. This may take several minutes.`);
        try {
            const output = await parseRoles();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` roles. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` roles. `);
        } catch(err) {
            channel.send(`⛔ Querying roles failed.`);
        }
        channel.send(`✅ Parsing roles completed. `);
    }
    
    /**
    Command: $groups parse
    Parses all groups currently stored in the DB from desc_formalized to parsed
    **/
    this.cmdGroupsParse = async function(channel) {
        channel.send(`🔄 Parsing groups. Please wait. This may take several minutes.`);
        try {
            const output = await parseGroups();
            output.output.forEach(el => channel.send(`❗ ${el}`));
            channel.send(`✅ Successfully parsed \`${output.success}\` groups. `);
            channel.send(`😔 Failed to parse \`${output.failure}\` groups. `);
        } catch(err) {
            channel.send(`⛔ Querying groups failed.`);
        }
        channel.send(`✅ Parsing groups completed. `);
    }
    
    /**
    Command: $update
    Updates all github linked data
    **/
    this.cmdUpdate = async function(channel) {
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
        /** No Parsing */
        // query info
        channel.send(`🔄 Querying info. Please wait. This may take several minutes.`);
        output = await queryInfo();
        channel.send(`❗ Querying info completed with \`${output.length}\` errors.`);
        /** Post Update */
        // cache values
        cacheRoleInfo();
        channel.send(`❗ Caching role info.`);
        channel.send(`✅ Update completed.`);
    }
        
    /**
    Run Query
    Runs a query for a specified game element
    **/
    const emptyDesc = "No description available.";
    async function runQuery(clearFunc, path, callbackFunc, maxAllowedErrors = 1) {
        // clear the relevant table
        clearFunc();
        // get all files
        const tree = await getTree();
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
        // output errors
        return outputs;     
    }
    
    /**
    Split Role Description Sections
    split the role descriptions, into the different types of role description
    **/
    function splitRoleDescSections(roleDesc) {
        let sections = roleDesc.match(/__([^_]+)__ *\n([\s\S]+?)(?=__[^_]+__|$)/g);
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
        return roleDesc.match(/^\*\*(.+?)\*\*/)[1];
    }
    
    /**
    Get Full Role Category
    returns the classcat and other
    **/
    function getFullCategory(roleDesc) {
        return roleDesc.match(/^\*\*.+?\*\* \| (.*?)(\n| \|)/)[1].split(" - ");
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
        return await runQuery(clearRoles, rolepathsPath, queryRolesCallback, 10);
    }
        
    /**
    Clear Roles
    deletes the entire contents of the roles database
    **/
     function clearRoles() {
		sql("DELETE FROM roles");
	}
    
    /**
    Query Roles - Callback
    the callback for role queries - run once for each role with the name and path passed.
    **/
    async function queryRolesCallback(path, name) {
        var output = null;
        // extract values
        const roleContents = await queryFile(path, name); // get the role contents
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
		sql("DELETE FROM sets");
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
        return await runQuery(clearInfo, infopathsPath, queryInfoCallback, 5);
    }
    
    /**
    Clear Info
    deletes the entire contents of the info database
    **/
     function clearInfo() {
		sql("DELETE FROM info");
	}
    
    /** 
    Query Info - Callback
    queries all infos from github
    **/
    async function queryInfoCallback(path, name) {
        // extract values
        var infoContents = await queryFile(path, name); // get the role contents
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
    Query Groups
    queries all groups from github
    **/
    async function queryGroups() {
        return await runQuery(clearGroups, grouppathsPath, queryGroupsCallback, 5);
    }
    
    /**
    Clear Groups
    deletes the entire contents of the groups database
    **/
     function clearGroups() {
		sql("DELETE FROM groups");
	}
    
    /** 
    Query Groups - Callback
    queries all groups from github
    **/
    async function queryGroupsCallback(path, name) {
        // extract values
        var groupContents = await queryFile(path, name); // get the role contents
        const dbName = getDBName(name); // get the db name
        const roleDescs = splitRoleDescSections(groupContents); // split the role descriptions, into the different types of role description
        const roleName = getRoleDescName(groupContents); // grabs the role name inbetween the **'s in the first line
        const fullCategory = getFullCategory(groupContents); // get the parts of first line besides name
        const teamName = fullCategory[0].replace("Team Group", "").trim().toLowerCase(); // extract team name
        const basics = roleDescs.filter(el => el[0] == "basics")[0][1] ?? "";
        const members = roleDescs.filter(el => el[0] == "members")[0][1] ?? "";
        const formalized = roleDescs.filter(el => el[0] == "formalized")[0][1] ?? "";
        // imsert the role into the databse
        sql("INSERT INTO groups (name,display_name,team,desc_basics,desc_members,desc_formalized) VALUES (" + connection.escape(dbName) + "," + connection.escape(roleName) + "," + connection.escape(teamName) + "," + connection.escape(basics) + "," + connection.escape(members) + "," + connection.escape(formalized) + ")");
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
                parsed = await parseRoleText(formalizedDesc.split("\n"));
                successCounter++;
                sql("UPDATE " + dbName + " SET parsed = " + connection.escape(JSON.stringify(parsed)) + " WHERE name = " + connection.escape(el));
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
        return await runParser("groups", cachedGroups);
    }
    
    /**
    Get Tree
    Retrieves the tree of files of the roles repository.
    **/
    async function getTree() {
        const auth = { headers: { 'Authorization': 'token ' + config.github_token } };
        const body = await fetchBody(`${githubAPI}repos/${roleRepo}/git/trees/${roleRepoBranch}?recursive=1`, auth);
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
    async function queryFile(path, name) {
        const body = await fetchBody(`${roleRepoBaseUrl}${path}/${name}`);
        return body;
    }  
    
}
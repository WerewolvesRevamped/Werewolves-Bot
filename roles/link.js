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
    Command: $update
    Updates all github linked data
    **/
    this.cmdUpdate = async function(channel) {
        var output;
        // query roles
        channel.send(`🔄 Querying roles. Please wait. This may take several minutes.`);
        output = await queryRoles();
        channel.send(`❗ Querying roles completed with \`${output.length}\` errors.`);
        // parse roles
        channel.send(`🔄 Parsing roles. Please wait. This may take several minutes.`);
        output = await parseRoles();
        channel.send(`❗ Parsing roles completed with \`${output.output.length}\` errors.`);
        // query info
        channel.send(`🔄 Querying info. Please wait. This may take several minutes.`);
        output = await queryInfo();
        channel.send(`❗ Querying info completed with \`${output.length}\` errors.`);
        // cache values
        cacheRoleInfo();
        channel.send(`❗ Caching role info.`);
        channel.send(`✅ Update completed.`);
    }
    
    
    /**
    Clear Roles
    deletes the entire contents of the roles database
    **/
     function clearRoles() {
		sql("DELETE FROM roles");
	}
    
    /** 
    Query Roles
    queries all roles from github
    **/
    const emptyDesc = "No description available.";
    async function queryRoles() {
        // Clear all roles
        clearRoles();
        // get all files
        const tree = await getTree();
        // get all role paths
        const paths = await getPaths(rolepathsPath);
        
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
                    const roleContents = await queryFile(path, name); // get the role contents
                    const roleDescs = roleContents.match(/__([^_]+)__ *\n([\s\S]+?)(?=__[^_]+__|$)/g); // split the role descriptions, into the different types of role description
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
                        let splitd = el.split("\n"); // split the desc to extract name
                        let tname = splitd.shift().replace(/_/g, "").trim().toLowerCase(); // extract name
                        let desc = splitd.join("\n"); // combine the rest to get the desc again
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
                    sql("INSERT INTO roles (name,display_name,class,category,team,type,desc_basics,desc_details,desc_simplified,desc_formalized,desc_card) VALUES (" + connection.escape(parsedRoleName) +"," + connection.escape(roleName) +"," + connection.escape(roleClass) + "," + connection.escape(roleCategory) + "," + connection.escape(roleTeam) + "," + connection.escape(roleType) + "," + connection.escape(descObj.basics) + "," + connection.escape(descObj.details) + "," + connection.escape(descObj.simplified) + "," + connection.escape(descObj.formalized) + "," + connection.escape(descObj.card) + ")");
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
    Clear Info
    deletes the entire contents of the roles database
    **/
     function clearInfo() {
		sql("DELETE FROM info");
	}
    
    /** 
    Query Info
    queries all infos from github
    **/
    async function queryInfo() {
        // Clear all roles
        clearInfo();
        // get all files
        const tree = await getTree();
        // get all role paths
        const paths = await getPaths(infopathsPath);
        
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
                    var infoContents = await queryFile(path, name); // get the role contents
                    const dbName = name.toLowerCase().replace(/[^a-z\$ ]/g,"").trim(); // get the db name
                    var displayName = "";
                    var matches;
                    // check if a name is present in the file
                    if(matches = infoContents.match(/^\*\*([A-Za-z\- \(\)]+)\*\* \| (.+)\n/)) {
                        displayName = `${matches[1]} [${matches[2]}]`;
                    } else if(matches = infoContents.match(/^\*\*([A-Za-z\- \(\)]+)\*\*\s*\n/)) {
                        displayName = `${matches[1]}`;
                    }
                    // remove first line, if display name found
                    if(displayName) {
                        let temp = infoContents.split("\n");
                        temp.shift();
                        infoContents = temp.join("\n");
                    } else {
                        displayName = toTitleCase(dbName); // default display name is to title cased db name
                    } 
                    // split by simplified
                    const splitInfoContents = infoContents.split("__Simplified__");
                    const mainContents = splitInfoContents[0].trim();
                    const simplifiedContents = splitInfoContents[1] ? splitInfoContents[1].trim() : "";
                    // imsert the role into the databse
                    sql("INSERT INTO info (name,display_name,contents,simplified) VALUES (" + connection.escape(dbName) + "," + connection.escape(displayName) + "," + connection.escape(mainContents) + "," + connection.escape(simplifiedContents) + ")");
                } catch (err) {
                    outputs.push(`Error for \`${name}\`: \`\`\`${err}\`\`\``);
                    errorCount++;
                }
            }
            if(errorCount > 5) {
                outputs.push(`Terminating querying due to 5 errors.`);
                break;
            }
        }
        // output errors
        return outputs;
    }
    
    /**
    Parse Roles
    Parses all roles
    **/
    async function parseRoles() {
        var output = [];
        var successCounter = 0;
        var failureCounter = 0;
        // iterate through all roles and parse them
        // due to async map we only get an array of promises back - we wait for all of them to resolve
        const promises = cachedRoles.map(async el => {
            let parsedRole = null;
            try {
                // get the formalized description from the DB
                let formalizedDesc = (await sqlPromEsc("SELECT desc_formalized FROM roles WHERE name = ", el))[0].desc_formalized;
                if(formalizedDesc == "No description available.") {
                    throw new Error("No formalized description available");
                }
                // parse the role using the role parser
                parsedRole = parseRoleText(formalizedDesc.split("\n"));
                successCounter++;
                sql("UPDATE roles SET parsed = " + connection.escape(JSON.stringify(parsedRole)) + " WHERE name = " + connection.escape(el));
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
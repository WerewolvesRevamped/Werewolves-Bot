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
    Get Roles Tree
    Retrieves the tree of files of the roles repository.
    **/
    async function getRolesTree() {
        const auth = { headers: { 'Authorization': 'token ' + config.github_token } };
        const body = await fetchBody(`https://api.github.com/repos/${roleRepo}/git/trees/${roleRepoBranch}?recursive=1`, auth);
        return JSON.parse(body).tree;
    }
    
    /**
    Get Role Paths
    Retrieves all the paths at which roles are located as an array
    **/
    async function getRolePaths() {
        const body = await fetchBody(`${roleRepoBaseUrl}role_paths`);
        const paths = body.split("\n").filter(el => el);
        return paths;
    }
    
    /** 
    Query Role
    Retrieves a single role from github
    **/
    async function queryRole(path, name) {
        const body = await fetchBody(`${roleRepoBaseUrl}${path}/${name}`);
        return body;
    }  
    
}
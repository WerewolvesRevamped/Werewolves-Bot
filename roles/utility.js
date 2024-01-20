/**
    Roles Module - Utility
    Utility functions for the roles module
**/
module.exports = function() {   
    /**
    Get Basic Role Embed
    Returns the role embed template based on a role SELECT * query and the current guild
    **/
    this.getBasicRoleEmbed = async function(result, guild) {
        // Get the role data
        let roleData = await getRoleData(result.display_name, result.class, result.category, result.team);

        // Get the server icon for the footer
        let serverIcon = await getServerIcon(guild);
  
        // Build the basic embed
        var embed = {
            "color": roleData.color,
            "footer": {
                "icon_url": `${serverIcon}`,
                "text": `${guild.name} - ${stats.game}`
            },
            "thumbnail": {
                "url": roleData.url
            },
            "author": {
                "icon_url": roleData.url
            },
            "fields": []
        };
        
        // return embed
        return embed;
    }
    
    
    
    /**
    Get Role Data
    **/
    this.getRoleData = async function(roleName, rClass, rCategory, rTeam) {
            
        // get the right folder
        var url = iconRepoBaseUrl;
        if(rClass == "solo") url += `Solo/${toTitleCase(rTeam)}`;
        else url += `${toTitleCase(rClass)}/${toTitleCase(rCategory)}`;
        // add file name
        url += `/${toTitleCase(roleName)}.png`;
        // replace spaces
        url = url.replace(/ /g, "%20")
        url += `?version=${stats.icon_version}`;
        
        // check if the role img exists
        let urlExists = await checkUrlExists(url);
         // if the url doesnt exist, use a placeholder
        if(!urlExists) {
            console.log("MISSING URL", url);
            let classesWithPlaceholders = ["townsfolk","werewolf","unaligned","solo"]; // list of classes with a specific placeholder icon
            let placeholderName = classesWithPlaceholders.includes(rClass) ? toTitleCase(rClass) : "Unaligned"; // if no specific placeholder icon exists default to UA
            url = `${iconRepoBaseUrl}Placeholder/${placeholderName}?version=${stats.icon_version}`; // construct placeholder url
        }
        
        // get color
        let color = getTeamColor(rTeam);
        
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
    
}
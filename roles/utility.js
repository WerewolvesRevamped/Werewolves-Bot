/**
    Roles Module - Utility
    Utility functions for the roles module
**/
module.exports = function() {   
    /**
    Get Basic Info Embed
    Returns the basic embed template based on the current guild
    **/
    this.getBasicEmbed = async function(guild) {
        // Get the server icon for the footer
        let serverIcon = await getServerIcon(guild);
        
       // Build the basic embed
        var embed = {
            "footer": {
                "icon_url": `${serverIcon}`,
                "text": `${guild.name} - ${stats.game}`
            },
            "fields": []
        };
        
        return embed;
    }

    /**
    Get Basic Role Embed
    Returns the role embed template based on a role SELECT * query and the current guild
    **/
    this.getBasicRoleEmbed = async function(result, guild) {
        // Get the role data
        let roleData = await getRoleData(result.display_name, result.class, result.category, result.team);

        var embed = await getBasicEmbed(guild);
        
        embed.color = roleData.color;
        embed.thumbnail = { "url": roleData.url };
        embed.author = { "icon_url": roleData.url };
        
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
            url = `${iconRepoBaseUrl}Placeholder/${placeholderName}.png?version=${stats.icon_version}`; // construct placeholder url
        }
        
        // get color
        let color = getTeamColor(rTeam);
        
        return { url: url, color: color };
    }
    
    /**
    Get Role Data from Name
    **/
    this.getRoleDataFromName = async function(roleName) {
        let roleNameParsed = parseRole(roleName);
        if(verifyRole(roleNameParsed)) {
            let roleData = await (new Promise(res => {
                 sql("SELECT * FROM roles WHERE name = " + connection.escape(roleNameParsed), result => {
                     res(result[0]);
                 });
            })); 
            return await getRoleData(roleData.display_name, roleData.class, roleData.category, roleData.team);
        } else {
            return null;
        }
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
            case "haunted": roleTypeID = 8; roleType = "Haunted"; break;
        }
        return { id: roleTypeID, name: roleType };
    }
    
    /**
    Applies Aliases
    applies alises to an input
    **/
    this.applyAlias = function(input) {
        let alias = cachedAliases.find(el => el.alias === input);
        return alias ? alias : input;
    }
    
    /**
    Parse Role
    Parses a role name
    **/
    this.parseRole = function(input) {
		input = input.toLowerCase(); // change role name to lower case
        input = input.replace(/[^a-z\$ ]/g, ""); // remove any non a-z characters
        let alias = applyAlias(input);
		if(alias != input) return parseRole(alias.name);
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
    
    /** Verify Info
    Verifies if an info exists
    **/
    this.verifyInfo = function(input) {
        if(cachedInfoNames.length == 0) return true; // if cache is currently not loaded just allow it
		let inputInfo = input.replace(/[^a-z\$ ]/g,"").trim(); // parse info name
		let info = cachedInfoNames.find(el => el === inputInfo); // check if info is in cache
		return info ? true : false;
	}
    
    /**
    Parse Group
    Parses a group name
    **/
    this.parseGroupName = function(input) {
		input = input.toLowerCase(); // change group name to lower case
        input = input.replace(/[^a-z\$ ]/g, ""); // remove any non a-z characters
		return input;
	}
    
    /** Verify Group
    Verifies if a group exists
    **/
    this.verifyGroup = function(input) {
        if(cachedGroups.length == 0) return true; // if cache is currently not loaded just allow it
		let inputGroup = input.replace(/[^a-z\$ ]/g,"").trim(); // parse group name
		let group = cachedGroups.find(el => el === inputGroup); // check if group is in cache
		return group ? true : false;
	}
    
    /** Verify Attribute
    Verifies if an attribute exists
    **/
    this.verifyAttribute = function(input) {
        if(cachedAttributes.length == 0) return true; // if cache is currently not loaded just allow it
		let inputAttr = input.replace(/[^a-z\$ ]/g,"").trim(); // parse attribute name
		let attr = cachedAttributes.find(el => el === inputAttr); // check if attribute is in cache
		return attr ? true : false;
	}
    
    /** Verify Set
    Verifies if a set exists
    **/
    this.verifySet = function(input) {
        if(cachedSets.length == 0) return true; // if cache is currently not loaded just allow it
		let inputSet = input.replace(/[^a-z\$ ]/g,"").trim(); // parse set name
		let group = cachedSets.find(el => el === inputSet); // check if set is in cache
		return group ? true : false;
	}
    
    /** Verify Info Message
    Verifies if an info message exists
    **/
    this.verifyInfoMessage = function(input) {
		return verifyRole(input) || verifyInfo(input) || verifyGroup(input) || verifyLocationName(input) || verifyAttribute(input);
	}
    
    /**
    Apply Emoji, Theme
    Runs two commonly applied functions in a row
    **/
    this.applyET = function(text) {
        return applyEmoji(applyTheme(text));
    }
    
    /**
    Apply Emoji, Numbers, Theme
    Runs three commonly applied functions in a row
    **/
    this.applyETN = function(text, guild) {
        return applyNums(applyET(text), guild);
    }
    
    /**
    Apply Emojis
    Replaces the special emoji format with actual emojis
    **/
	this.applyEmoji = function(text) {
		[...text.matchAll(/\<\?([\w\d]*):([^>]{0,10})\>/g)].forEach(match => {
			let emoji = client.emojis.cache.find(el => el.name === match[1]);
			if(emoji) emoji = `<:${emoji.name}:${emoji.id}>`;
			else emoji = match[2];
			text = text.replace(match[0], emoji)
		}); 
		return text;
	}
    
    /**
    Apply Numbers
    Replaces the special number format with actual numbers
    **/
    this.applyNums = function(text, guild) {
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
    
    /**
    Apply Queries
    applies the @Query queries
    **/
    this.applyQuery = async function(str) {
        let out = await replaceAsync(str, /@Query;(.*?);(.*?)@/g, async function(match, query, format) { 
            // build query
            query = query.split(",").map(el => el.split("="));
            let queryCategory = query.filter(el => el[0] == "Category");
            let queryTeam = query.filter(el => el[0] == "Team");
            let queryClass = query.filter(el => el[0] == "Class");
            let queryType = query.filter(el => el[0] == "Type");
            let whereQuery = [];
            if(queryCategory[0]) whereQuery.push(`category = ${connection.escape(queryCategory[0][1])}`);
            if(queryTeam[0]) whereQuery.push(`team = ${connection.escape(queryTeam[0][1])}`);
            if(queryClass[0]) whereQuery.push(`class = ${connection.escape(queryClass[0][1])}`);
            if(queryType[0]) whereQuery.push(`type = ${connection.escape(queryType[0][1])}`);
            // do the sql query
            let roles = (await sqlProm("SELECT display_name,class,category,team FROM roles WHERE " + whereQuery.join(" AND ")));
            // apply formatting
            return roles.sort((a, b) => a.display_name.localeCompare(b.display_name)).map(el => {
                let ret = format;
                ret = ret.replace(/\$\.Team/g, toTitleCase(el.team));
                ret = ret.replace(/\$\.Name/g, el.display_name);
                ret = ret.replace(/\$\.Emoji/g, `<?${el.display_name.replace(/ /g,"")}:>`);
                ret = ret.replace(/\$\.ClassCat/g, (el.class == "unaligned" ? "UA" : el.class[0].toUpperCase()) + el.category[0].toUpperCase());
                return ret;
            }).join("\n");
        });
        return out;
    }
    
    /**
    Replace Async
    allows async replacing with a custom replacing function
    **/
    this.replaceAsync = async function(str, regex, asyncFn) {
        const promises = [];
        str.replace(regex, (full, ...args) => {
            promises.push(asyncFn(full, ...args));
            return full;
        });
        const data = await Promise.all(promises);
        return str.replace(regex, () => data.shift());
    }
    
    /**
    Field Splitter
    Splits long texts into several elements for embed fields.
    **/
    this.fieldSplitter = function(text) {
        let textSplit = text.split(/\n/); // split by new lines
        let splitElements = [];
        let i = 0;
        let j = 0;
        while(i < textSplit.length) { // iterate through the lines
            splitElements[j] = "";
            while(i < textSplit.length && (splitElements[j].length + textSplit[i].length) <= 1000) { // try appending a new line and see if it still fits then
                splitElements[j] += "\n" + textSplit[i];
                i++;
            }
            j++;
        }
        return splitElements;
    }
    
    /**
    Handle Fields
    Returns either a single or several fields depending on text length
    **/
    this.handleFields = function(text, sectionName, showTitle = true) {
        let fields = [];
        if(text.length < 1020) { // check if text fits directly in one section
            if(showTitle) fields.push({"name": `__${sectionName}__`, "value": text});
            else fields.push({"name": `_ _`, "value": text});
        } else { // split section into several
            let sections = fieldSplitter(text);
           // for each generated section, add a "field" to the embed
           if(showTitle) sections.forEach(d => fields.push({"name": `__${sectionName}__ (${sections.indexOf(d)+1}/${sections.length})`, "value": d})); // normal case
           else sections.forEach(d => fields.push({"name": `${sections.indexOf(d)+1}/${sections.length}`, "value": d})); // special case for formalized text
        }
        return fields;
    }
    
    /**
    Get Role Emoji
    Returns the emoji for a specific role
    **/
     this.getRoleEmoji = function(roleName) {
        roleName = toTitleCase(roleName).replace(/[^\w]+/g,"").trim().toLowerCase();
        return client.emojis.cache.find(el => el.name.toLowerCase() == roleName);
    }
    
    /**
    Get LUT Emoji
    gets an emoji by looking up a file path in the lut and then retrieving the emoji by file name
    **/
    this.getLUTEmoji = function(name, displayName) {
        // attempt direct lookup by name
        let direct = getRoleEmoji(name);
        if(direct) return direct;
        
        // attempt direct lookup by display name
        direct = getRoleEmoji(displayName);
        if(direct) return direct;
        
        // attempt lookup via LUT
        let lutval = applyLUT(name);
        if(!lutval) lutval = applyLUT(displayName);
        if(!lutval) return "❓";
        lutval = lutval.split("/").pop().replace(/%20/g,"");
        return getRoleEmoji(lutval);
    }
    
    /**
    Format Formalized
    applies special formating for formalized descs
    **/
    this.formatFormalized = function(desc) {
        return desc.replace(/ {2}/g, getEmoji("empty"));
    }
    
        
    /**
    Basic embed template
    **/
    this.EMBED_RED = 13632027; // error 
    this.EMBED_YELLOW = 16312092; // update / not error/success
    this.EMBED_GREEN = 8311585; // success
    this.EMBED_GRAY = 10197915; // info / start
    this.basicEmbed = function(msg, color) {
        let dmsg = { 
            embeds: [
                {
                  "description": msg,
                  "color": color
                }
            ]
        };
        return dmsg;
    }
    
    /**
    Sleep
    waits by a specified amount of ms
    **/
    function sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
    
}
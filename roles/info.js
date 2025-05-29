  /**
    Roles Module - Info
    $info command, variants and similiar commands
**/
module.exports = function() {
    /**
    Command: $info
    Returns a role info message
    channel: the channel to send the info message in
    args: the role name
    simp: if the info message should be simplified
    technical: if the formalized desc should be shown instead
    overwriteName: overwrites the name with a specified value
    appendSection: WIP ??? (appends an additional section)
    editOnto: WIP ??? (edits the message onto another one instead of sending it)
    **/
    this.cmdInfo = async function(channel, authorId, args, pin = false, noErr = false, simp = false, overwriteName = false, appendSection = false, editOnto = false, technical = false, autoDelete = false) {
		// fix role name if necessary
        if(!args) {
            if(!noErr) channel.send("❗ Could not find role.");
            return;
        }
		let roleName = args.join(" ").replace(/[^a-zA-Z0-9'\-_\$ ]+/g,""); // get rid of characters that are not allowed in role names
        let origRoleName = roleName;
        roleName = parseRole(roleName);
		if(!verifyInfoMessage(roleName)) { // not a valid role
			// get all roles and aliases, to get an array of all possible role names
			let allRoleNames = [...cachedRoles, ...cachedGroups, ...cachedAttributes, ...cachedLocations, ...cachedTeams, ...cachedTeamNames, ...cachedAliases.map(el => el.alias), ...cachedInfoNames];
			let bestMatch = findBestMatch(roleName.toLowerCase(), allRoleNames.map(el => el.toLowerCase())); // find closest match
			// check if match is close enough
			if(bestMatch.value <= ~~(roleName.length/2)) { // auto alias if so, but send warning 
                //console.log(roleName, bestMatch.name);
				roleName = parseRole(bestMatch.name);
                if(roleName.toLowerCase() === bestMatch.name.toLowerCase()) {
                    if(origRoleName.toLowerCase().replace(/[^a-z]/g,"") === bestMatch.name.toLowerCase().replace(/[^a-z]/g,"")) {
                        // do nothing when they match besides some non letter characters
                    } else {
                        channel.send(`❗ Could not find role \`${origRoleName}\`. Did you mean \`${roleName}\`?`);
                    }
                } else {
                    channel.send(`❗ Could not find role \`${origRoleName}\`. Did you mean \`${roleName}\` (aka \`${(bestMatch.name.length>2 ? toTitleCase(bestMatch.name) : bestMatch.name.toUpperCase())}\`)?`);
                }
			} else { // early fail if otherwise
				channel.send(`❗ Could not find role \`${origRoleName}\`.`);
                return;
			}
		}
		
        // get embed with specified sections
        let sections = ["basics", "details"];
        if(simp) sections = ["simplified"];
        if(technical) sections = ["formalized"];
        
        let infoEmbed = {};
        // get the embed
        if(cachedRoles.includes(roleName)) {
            // message is a role
            infoEmbed = await getRoleEmbed(roleName, sections, channel.guild, authorId);
        } else if(cachedGroups.includes(roleName)) {
            // its a group
            infoEmbed = await getGroupEmbed(roleName, sections, channel.guild, authorId);
        } else if(cachedInfoNames.includes(roleName)) {
            // its an info
            infoEmbed = await getInfoEmbed(roleName, channel.guild, authorId);
        } else if(cachedLocations.includes(roleName)) {
            // its a location
            infoEmbed = await getLocationEmbed(roleName, authorId);
        } else if(cachedAttributes.includes(roleName)) {
            // its a location
            infoEmbed = await getAttributeEmbed(roleName, sections, authorId);
        } else if(cachedTeams.includes(roleName)) {
            // its a team
            infoEmbed = await getTeamEmbed(roleName, sections, authorId);
        } else if(cachedTeamNames.includes(roleName)) {
            // its a team display name -> convert to name
            let ind = cachedTeamNames.indexOf(roleName);
            infoEmbed = await getTeamEmbed(cachedTeams[ind], sections, authorId);
        } else {
            // its nothing? should be impossible since verifyInfoMessage checks its one of the above minimum
            // can happen if running info pre caching
            infoEmbed = await getBasicEmbed(channel.guild);
            infoEmbed.description = "Could not find any matching info. This most likely means the bot has not yet loaded its caches. Please try again in a minute.";
        }
        
        // overwrite name
        if(overwriteName) {
            infoEmbed.author.name = overwriteName;
        }
        
        // send embed
        let infoMsg = await sendEmbed(channel, infoEmbed, pin);
        
        if(autoDelete) {
            setTimeout(() => infoMsg.delete(), 180000);
        }
        
    }
    
    /**
    Info Shortcuts
    **/
    this.cmdInfoTechnical = function(channel, authorId, args) { cmdInfo(channel, authorId, args, false, false, false, false, false, false, true); } // via $info_technical
    this.cmdInfoIndirect = function(channel, authorId, args) { cmdInfo(channel, authorId, args, false, true, false, false, false, false, false, true); } // via ;
    this.cmdInfoIndirectSimplified = function(channel, authorId, args) { cmdInfo(channel, authorId, args, false, true, true, false, false, false, false, true); } // via . 
    this.cmdInfoIndirectTechnical = function(channel, authorId, args) { cmdInfo(channel, authorId, args, false, true, false, false, false, false, true, true); } // via ~
    this.cmdInfopin = function(channel, authorId, args) { cmdInfo(channel, authorId, args, true); } // via $infopin
    
    /**
    Get Info Embed
    Returns an info embed for an info message
    */
    this.getInfoEmbed = function(infoName, guild, authorId = null) {
        return new Promise(res => {
            sql("SELECT * FROM info WHERE name = " + connection.escape(infoName), async result => {
                result = result[0]; // there should always only be one role by a certain name
                var embed = await getBasicEmbed(guild);
                var contents = result.contents;
                
                // search for and replace queries
                contents = await applyQuery(contents);
                contents = contents.replace("\n\n\n","\n"); // remove extra newline for when a section is empty
                
                // split the contents by section headers
                var desc = contents.split(/(?=__[\w\d _]+__)/).map(el => { // split by section and keep title via lookahead
                    let matches = el.match(/^__([\w\d _]+)__\s*\n([\w\W]*)\n?$/); // extract section name and contents
                    return matches ? [matches[1], matches[2]] : ["", el];
                });

                // split a single section into several fields if necessary
                for(let d in desc) {
                    let de = await applyPackLUT(desc[d][1], authorId);
                    if(desc[d][0] || desc[0][1].length > 2000 || d > 0) {
                        embed.fields.push(...handleFields(applyETN(de, guild), applyTheme(desc[d][0])));
                    } else { // untitled field0 is description
                        embed.description = applyETN(de, guild);
                    }
                }
               
                // get icon if applicable
                let lutval = applyLUT(infoName);
                if(!lutval) lutval = applyLUT(result.display_name);
                if(lutval) { // set icon and name
                    //console.log(`${iconRepoBaseUrl}${lutval}`);
                    embed.thumbnail = { "url": `${iconBaseUrl(authorId)}${lutval}.png` };
                    if(result.display_name.match(/\<\?[\w\d]*:[^>]{0,10}\>/)) { // emoji in title, use title
                        let dp = await applyPackLUT(result.display_name, authorId);
                        embed.title = applyET(dp);
                    } else { // no emojis, use author title + icon
                        let dp = await applyPackLUT(result.display_name, authorId);
                        embed.author = { "icon_url": `${iconBaseUrl(authorId)}${lutval}.png`, "name": applyTheme(dp) };
                    }
                } else { // just set title afterwards
                    let dp = await applyPackLUT(result.display_name, authorId);
                    embed.title = applyET(dp);
                }
                
                // resolve promise, return embed
                res(embed);
            })
        });
    }
    
    /**
    Get Group Embed
    Returns a group embed for a group message
    */
    this.getGroupEmbed = function(groupName, sections, guild, authorId = null) {
        return new Promise(res => {
            sql("SELECT * FROM `groups` WHERE name = " + connection.escape(groupName), async result => {
                result = result[0]; // there should always only be one role by a certain name
                var embed = await getBasicEmbed(guild);
                var members = result?.desc_members ?? "";
                
                // search for and replace queries
                members = await applyQuery(members);
                members = members.replace("\n\n\n","\n"); // remove extra newline for when a section is empty
                
                var desc = [];
                if(sections.includes("basics") || sections.includes("simplified")) desc.push(["Basics", result?.desc_basics ?? "No info found"]);
                if(sections.includes("details")) desc.push(["Members", members]);
                if(sections.includes("formalized")) desc.push(["Formalized", formatFormalized(result?.desc_formalized ?? "No info found")]);

                // split a single section into several fields if necessary
                for(let d in desc) {
                    let de = await applyPackLUT(desc[d][1], authorId);
                    embed.fields.push(...handleFields(applyETN(de, guild), applyTheme(desc[d][0])));
                }
               
                // get icon if applicable
                let lutval = applyLUT(groupName);
                if(!lutval) lutval = applyLUT(result?.display_name ?? "Unknown");
                if(lutval) { // set icon and name
                    //console.log(`${iconRepoBaseUrl}${lutval}`);
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.thumbnail = { "url": `${iconBaseUrl(authorId)}${lutval}.png` };
                    embed.author = { "icon_url": `${iconBaseUrl(authorId)}${lutval}.png`, "name": applyTheme(dp) };
                } else { // just set title afterwards
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.title = applyET(dp);
                }
                
                // resolve promise, return embed
                res(embed);
            })
        });
    }
    
    /**
    Get Attribute Embed
    Returns an attribute embed for an attribute message
    */
    this.getAttributeEmbed = function(attrName, sections, authorId = null) {
        return new Promise(res => {
            sql("SELECT * FROM attributes WHERE name = " + connection.escape(attrName), async result => {
                result = result[0]; // there should always only be one attribute by a certain name
                var embed = await getBasicEmbed(mainGuild);
                
                var desc = [];
                if(sections.includes("basics") || sections.includes("simplified") || sections.includes("details")) desc.push(["Basics", result?.desc_basics ?? "No info found"]);
                if(sections.includes("formalized")) desc.push(["Formalized", formatFormalized(result?.desc_formalized ?? "No info found")]);

                // split a single section into several fields if necessary
                for(let d in desc) {
                    let de = await applyPackLUT(desc[d][1], authorId);
                    embed.fields.push(...handleFields(applyETN(de, mainGuild), applyTheme(desc[d][0])));
                }
               
                // get icon if applicable
                let lutval = applyLUT(attrName);
                if(!lutval) lutval = applyLUT(result?.display_name ?? "Unknown");
                if(lutval) { // set icon and name
                    //console.log(`${iconRepoBaseUrl}${lutval}`);
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.thumbnail = { "url": `${iconBaseUrl(authorId)}${lutval}.png` };
                    embed.author = { "icon_url": `${iconBaseUrl(authorId)}${lutval}.png`, "name": applyTheme(dp) };
                } else { // just set title afterwards
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.title = applyET(dp);
                }
                
                // resolve promise, return embed
                res(embed);
            })
        });
    }
    
    /**
    Get Team Embed
    Returns a team embed for a team message
    */
    this.getTeamEmbed = function(teamName, sections, authorId = null) {
        return new Promise(res => {
            sql("SELECT * FROM teams WHERE teams.name=" + connection.escape(teamName), async result => {
                result = result[0]; // there should always only be one attribute by a certain name
                var embed = await getBasicEmbed(mainGuild);
                
                // create members list
                var members = await applyQuery(`@Query;Team=${result.name},Type=default;$.Emoji $.Name@\n\n@Query;Team=${result.name},Type=limited;$.Emoji *$.Name*@\n\n@Query;Team=${result.name},Type=transformation;$.Emoji $.Name (T)@`);
                members = members.replace("\n\n\n","\n"); // remove extra newline for when a section is empty
                
                var desc = [];
                if(sections.includes("basics") || sections.includes("simplified") || sections.includes("details")) desc.push(["Basics", result?.desc_basics ?? "No info found"]);
                if(sections.includes("details")) desc.push(["Members", members ?? "No info found"]);
                if(sections.includes("formalized")) desc.push(["Formalized", formatFormalized(result?.desc_formalized ?? "No info found")]);

                // split a single section into several fields if necessary
                for(let d in desc) {
                    let de = await applyPackLUT(desc[d][1], authorId);
                    embed.fields.push(...handleFields(applyETN(de, mainGuild), applyTheme(desc[d][0])));
                }
               
                // get icon if applicable
                let lutval = applyLUT(teamName);
                if(!lutval) lutval = applyLUT(result?.display_name ?? "Unknown");
                if(lutval) { // set icon and name
                    //console.log(`${iconRepoBaseUrl}${lutval}`);
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.thumbnail = { "url": `${iconBaseUrl(authorId)}${lutval}.png` };
                    embed.author = { "icon_url": `${iconBaseUrl(authorId)}${lutval}.png`, "name": applyTheme(dp) };
                } else { // just set title afterwards
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.title = applyET(dp);
                }
                
                // resolve promise, return embed
                res(embed);
            })
        });
    }
    
    /**
    Get Location Embed
    Returns a location embed for a group message
    */
    this.getLocationEmbed = function(locationName, authorId = null) {
        return new Promise(res => {
            sql("SELECT * FROM locations WHERE name = " + connection.escape(locationName), async result => {
                result = result[0]; // there should always only be one role by a certain name
                var embed = await getBasicEmbed(mainGuild);
                
                // description
                let desc = await applyPackLUT(result?.description ?? "No info found", authorId);
                embed.description = desc;
               
                // get icon if applicable
                let lutval = applyLUT(locationName);
                if(!lutval) lutval = applyLUT(result?.display_name ?? "Unknown");
                if(lutval) { // set icon and name
                    //console.log(`${iconRepoBaseUrl}${lutval}`);
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.thumbnail = { "url": `${iconBaseUrl(authorId)}${lutval}.png` };
                    embed.author = { "icon_url": `${iconBaseUrl(authorId)}${lutval}.png`, "name": applyTheme(dp) };
                } else { // just set title afterwards
                    let dp = await applyPackLUT(result?.display_name ?? "Unknown", authorId);
                    embed.title = applyET(dp);
                }
                
                // resolve promise, return embed
                res(embed);
            })
        });
    }
    
    /**
    Get Role Embed 
    Returns an info embed for a role 
    **/
    this.getRoleEmbed = function(roleName, visibleSections, guild, authorId = null) {
        return new Promise(res => {
            sql("SELECT * FROM roles WHERE name = " + connection.escape(roleName), async result => {
                result = result[0]; // there should always only be one role by a certain name
                if(!result) return null; // no data found
 
                var embed = await getBasicRoleEmbed(result, guild, authorId);
                
                // Build role name for title
                let fancyRoleName = `${result.display_name} [${toTitleCase(result.class)} ${toTitleCase(result.category)}]`; // Default: Name [Class Category]
                if(result.class == "solo") fancyRoleName = `${result.display_name} [${toTitleCase(result.class)} ${toTitleCase(result.category)} - ${toTitleCase(result.team)} Team]`; // Solos: Name [Class Category - Team]
                fancyRoleName = applyTheme(fancyRoleName); // apply theme replacement rules
                fancyRoleName = await applyPackLUT(fancyRoleName, authorId);
                embed.author.name = fancyRoleName;

                // Role Type
                const roleTypeData = getRoleTypeData(result.type); // display the role type
                if(result.type != "default") embed.title = applyTheme(roleTypeData.name); // but dont display "Default"
                
                let isFormalized = false;
                // add visible sections as sections
                for(const sec in visibleSections) {
                    let sectionText = "";
                    // get the text from the result object
                    switch(visibleSections[sec]) {
                        case "basics": sectionText = result.desc_basics; break;
                        case "details": sectionText = result.desc_details; break;
                        case "simplified": sectionText = result.desc_simplified === "No description available." ? result.desc_basics : result.desc_simplified; break;
                        case "formalized": sectionText = formatFormalized(result.desc_formalized); isFormalized = true; break;
                        case "card": sectionText = result.desc_card; break;
                    }
                    // only add the section if it exists
                    if(sectionText) {
                        if(visibleSections.length == 1) {
                            sectionText = await applyPackLUT(sectionText, authorId);
                            embed.description = applyETN(sectionText, guild);
                        } else {
                            sectionText = await applyPackLUT(sectionText, authorId);
                            embed.fields.push(...handleFields(applyETN(sectionText, guild), toTitleCase(applyTheme(visibleSections[sec])), !isFormalized));
                        }
                    }
                }
                                
                if(!((roleTypeData.id >= 0 && (stats.role_filter & (1 << roleTypeData.id))) || (roleTypeData.id == -1 && (stats.role_filter & (1 << 1)) && (stats.role_filter & (1 << 2))))) {
                    embed.description = "**This role type is currently not in use.**";
                    delete embed.fields;
                }
                
                // resolve promise with the embed, returning the embed
                res(embed);
                
            }, () => {
                // DB error
                console.log("⛔ Database error. Couldn't look for role information!");
            });	
        });
    }
    
    /**
    Get Card Url
    returns the url to the card of a role if the role exists or false if not
    **/
    this.getCardUrl = function(role) {
        let roleNameParsed = parseRole(role); // parse role name
        var lutName = applyLUT(role); // get lut value if exists
        if(lutName) { // if lut value exists
            lutName = lutName.split("/").pop(); // split by /'s to extract name
            return `${cardBaseUrl}${urlConv(lutName)}&type=hd&v=${stats.icon_version}`;
        } else if(roleNameParsed && verifyRole(roleNameParsed)) { // check if the role exists
            return `${cardBaseUrl}${urlConv(toTitleCase(roleNameParsed))}&type=hd&v=${stats.icon_version}`;
        } else {
            return false;
        }
    }
    
    /**
    Command: $card
    Gets a card for a role
    **/
    this.cmdGetCard = function(channel, role) {
        let url = getCardUrl(role);
        if(url) {
            channel.send(url);
        } else {
            channel.send("⛔ Command error. Invalid role `" + role + "`!"); 
        }
    }
    
    this.skinpackUrl = function(name) {
        return`https://werewolves.me/cards/skinpack.php?pack=${name}&src=`;
    }
    
}
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
                if(roleName.toLowerCase() === bestMatch.name.toLowerCase()) channel.send(`❗ Could not find role \`${origRoleName}\`. Did you mean \`${roleName}\`?`);
                else channel.send(`❗ Could not find role \`${origRoleName}\`. Did you mean \`${roleName}\` (aka \`${(bestMatch.name.length>2 ? toTitleCase(bestMatch.name) : bestMatch.name.toUpperCase())}\`)?`);
			} else { // early fail if otherwise
				channel.send(`❗ Could not find role \`${origRoleName}\`.`);
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
            sql("SELECT * FROM roles WHERE name = " + connection.escape(roleName), async result => {
                result = result[0]; // there should always only be one role by a certain name
                if(!result) return null; // no data found
 
                var embed = await getBasicRoleEmbed(result, guild);
                
                // Build role name for title
                let fancyRoleName = `${result.display_name} [${toTitleCase(result.class)} ${toTitleCase(result.category)}]`; // Default: Name [Class Category]
                if(result.class == "solo") fancyRoleName = `${result.display_name} [${toTitleCase(result.class)} ${toTitleCase(result.category)} - ${toTitleCase(result.team)} Team]`; // Solos: Name [Class Category - Team]
                fancyRoleName = applyTheme(fancyRoleName); // apply theme replacement rules
                embed.author.name = fancyRoleName;

                // Role Type
                const roleTypeData = getRoleTypeData(result.type); // display the role type
                if(result.type != "default") embed.title = roleTypeData.name; // but dont display "Default"
                
                let isFormalized = false;
                // add visible sections as sections
                for(const sec in visibleSections) {
                    let sectionText = "";
                    // get the text from the result object
                    switch(visibleSections[sec]) {
                        case "basics": sectionText = result.desc_basics; break;
                        case "details": sectionText = result.desc_details; break;
                        case "simplified": sectionText = result.desc_simplified; break;
                        case "formalized": sectionText = result.desc_formalized.replace(/ {2}/g, getEmoji("empty")); isFormalized = true; break;
                        case "card": sectionText = result.desc_card; break;
                    }
                    // only add the section if it exists
                    if(sectionText) {
                        if(sectionText.length < 1000) { // check if text fits directly in one section
                            embed.fields.push({"name": `__${toTitleCase(visibleSections[sec])}__`, "value": sectionText});
                        } else { // split section into several
                            let sectionTextSplit = sectionText.split(/\n/); // split by new lines
                           sectionTextSplitElements = [];
                           let i = 0;
                           let j = 0;
                           while(i < sectionTextSplit.length) { // iterate through the lines
                               sectionTextSplitElements[j] = "";
                               while(i < sectionTextSplit.length && (sectionTextSplitElements[j].length + sectionTextSplit[i].length) <= 1000) { // try appending a new line and see if it still fits then
                                   sectionTextSplitElements[j] += "\n" + sectionTextSplit[i];
                                   i++;
                               }
                               j++;
                           }
                           // for each generated section, add a "field" to the embed
                           if(!isFormalized) sectionTextSplitElements.forEach(d => embed.fields.push({"name": `__${toTitleCase(visibleSections[sec])}__ (${sectionTextSplitElements.indexOf(d)+1}/${sectionTextSplitElements.length})`, "value": d})); // normal case
                           else sectionTextSplitElements.forEach(d => embed.fields.push({"name": `${sectionTextSplitElements.indexOf(d)+1}/${sectionTextSplitElements.length}`, "value": d})); // special case for formalized text
                        }
                    }
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
    Command: $card
    Gets a card for a role
    **/
    this.cmdGetCard = function(channel, role) {
        let roleNameParsed = parseRole(role); // parse role name
        var lutName = applyLUT(role); // get lut value if exists
        if(lutName) { // if lut value exists
            lutName = lutName.split("/").pop(); // split by /'s to extract name
            channel.send(`${cardBaseUrl}${urlConv(lutName)}`);
        } else if(roleNameParsed && verifyRole(roleNameParsed)) { // chekc if the role exists
            channel.send(`${cardBaseUrl}${urlConv(toTitleCase(roleNameParsed))}`);
        } else {
            channel.send("⛔ Command error. Invalid role `" + role + "`!"); 
        }
    }
    
}
/**
    Abilities Module - Whispering
    The module for implementing whispering ability
**/

module.exports = function() {
    
    /**
    Ability: Whispering
    **/
    this.abilityWhispering = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.source) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Whispering failed! " + abilityError, success: false };
        }
        // parse parameters
        let disguise = ability.disguise ?? "";
        disguise = disguise.replace(/`/g, "");
        let target = await parseLocation(ability.target, src_ref, additionalTriggerData);
        
        // parse target
        if(target.type == null || target.multiple) return { msg: "Whispering failed! " + abilityError, success: false }; // no location found
        let dur_type = parseDuration(ability.duration ?? "permanent");
        
        // parse source
        let source = await parseLocation(ability.source, src_ref, additionalTriggerData);
        if(source.type == null || source.multiple) return { msg: "Whispering failed! " + abilityError, success: false }; // no source found
        
        
        if(!["player","location","group"].includes(source.type)) {
            abilityLog(`❗ **Error:** \`${source.type}\` type cannot use whispering.`);
            return { msg: "Whispering failed! " + abilityError, success: false };
        }
        
        // handle visit
        if(source.type === "player" && additionalTriggerData.parameters.visitless !== true) {
            let resultV = await visit(src_ref, target.value, disguise, NO_SND_VISIT_PARAM, "whispering");
            if(resultV) return visitReturn(resultV, "Whispering failed!", "Whispering succeeded!");
        }
        
        // parse source data
        let srcVal = source.value;
        let srcTyp = source.type;
        let chName;
        if(srcTyp === "player") {
            let role = await getPlayerRole(srcVal);
            chName = srcRefToPlainText(`role:${role}`);
        } else {
            chName = srcRefToPlainText(`${srcTyp}:${srcVal}`);
        }
        
        // get channel to whisper to
        let cid = await getSrcRefChannel(`${target.type}:${target.value}`);
        let targetChannel = mainGuild.channels.cache.get(cid);
        
        // get channel to whisper from
        let index = 0;
        let existingChannel = null;
        while(true) {
            // get channel id
            index++;
            let con = await connectionGet(`whisper:${srcVal}-${index}`);
            // check if channel even exists
            if(con.length > 0) { // if channel exists, check if it is used
                let cid = con[0].channel_id;
                let connections = await connectionGetByChannel(cid);
                if(connections.length === 1) { // only one connection -> unused
                   existingChannel = cid;
                   break; // BREAK!
                }
            } else { // if channel doesnt exist, BREAK
                break; // BREAK!
            }
        }
        // if no channel was found, then create one
        let whisperChannel = null;
        if(existingChannel) {
            whisperChannel = mainGuild.channels.cache.get(existingChannel);
        } else {
            switch(srcTyp) {
                case "player":
                    whisperChannel = await whisperingCreate(chName, srcVal, index);
                break;
                case "group":
                case "location":
                    let cid = await getSrcRefChannel(`${srcTyp}:${srcVal}`);
                    let targetChannel = mainGuild.channels.cache.get(cid);
                    if(!targetChannel) {
                        abilityLog(`❗ **Error:** Could not find channel for \`${srcTyp}:${srcVal}\`.`);
                        return { msg: "Whispering failed! " + abilityError, success: false };
                    }
                    whisperChannel = targetChannel;
                break;
            }
        }
        
        // connection name
        const conName = `${srcVal}-${index}`;
        
        // create connection on own end
        connectionAdd(whisperChannel.id, conName, disguise);
        let targetText = srcRefToText(`${target.type}:${target.value}`);
        let embed = basicEmbed(`Now whispering to ${targetText}!`, EMBED_GREEN);
        whisperChannel.send(embed);
        
        // create connection on other end
        connectionAdd(targetChannel.id, conName);
        
        // create an attribute
        await createWhisperAttribute(src_name, src_ref, srcVal, dur_type, conName, whisperChannel.id, targetChannel.id);
        
        // feedback
        return { msg: "Whispering succeeded!", success: true, target: `${target.type}:${target.value}` };
    }
    
    
    /**
    Whispering: Cleanup
    cleanups connections who's attributes have expired
    **/
    this.whisperingCleanup = async function() {
        // get all whisper source channel
        let connections = await sqlProm("SELECT * FROM connected_channels WHERE name='whisper-channel'");
        // iterate through them
        for(let i = 0; i < connections.length; i++) {
            // get connection name for a connection that would belong to them
            let name = connections[i].id.split(":")[1];
            // check if a connection attribute exists
            let attr = await queryAttribute("attr_type", "whisper", "val1", name);
            // if not the connection should be deleted
            if(attr.length === 0) {
                // announce that whispering has ended
                let embed = basicEmbed(`Whispering has ended!`, EMBED_RED);
                let conns =  await connectionGet(name);
                for(let j = 0; j < conns.length; j++) {
                    let channel = mainGuild.channels.cache.get(conns[j].channel_id);
                    channel.send(embed);
                }
                // delete connection
                await connectionDelete(name);
            }
        }
    }
    
    
    /** Whispering: Create
    creates a whisper channel, takes a role name and a member id
    **/
    this.whisperingCreate = async function(role, member, index) {
        return new Promise(async res => {
            // Determine channel name
            let channelName = (role + "_whisper").substr(0, 100);
            channelName = applyTheme(channelName);
            
            // get base sc permissions
            let scPerms = getSCCatPerms(mainGuild);
            
            // grant permissions to the channel to member
            scPerms.push(getPerms(member, ["history", "read"], []));
            
            // get last sc cat
            let category = await mainGuild.channels.fetch(cachedSCs[cachedSCs.length - 1]);
            
            // Create SC channel
            mainGuild.channels.create({ name: channelName, type: ChannelType.GuildText,  permissionOverwrites: scPerms })
            .then(async sc => {
                // Create a default connection with the creator id and index
                connectionAdd(sc.id, `whisper:${member}-${index}`, "whisper-channel");
                
                // assign mentor permissions
                let mentor = await getMentor(member); 
                //console.log("WhisperCreate", member, mentor);
                if(mentor) sc.permissionOverwrites.create(mentor, { ViewChannel: true, SendMessages: false });

                // Move into sc category
                sc.setParent(category,{ lockPermissions: false }).then(m => {
                    // Success continue as usual
                }).catch(async err => { 
                    // Failure, Create a new SC Cat first
                    logO(err); 
                    await createNewSCCat(channel, sc);
                });	
                
                // end of create channel callback
                res(sc);
            });
        });
        
    }
    
}

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
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Whispering failed! " + abilityError, success: false };
        }
        let type = srcToType(src_ref);
        if(type != "player") {
            abilityLog(`❗ **Error:** Only players can use whispering!`);
            return { msg: "Whispering failed! " + abilityError, success: false };
        }
        let disguise = ability.disguise ?? "";
        disguise = disguise.replace(/`/g, "");
        // parse parameters
        let target = await parseLocation(ability.target, src_ref, additionalTriggerData);
        if(target.type == null || target.multiple) return { msg: "Whispering failed! " + abilityError, success: false }; // no location found
        let dur_type = parseDuration(ability.duration ?? "permanent");
        
        // handle visit
        if(additionalTriggerData.parameters.visitless !== true) {
            let resultV = await visit(src_ref, target.value, disguise, "whispering");
            if(resultV) return visitReturn(resultV, "Whispering failed!", "Whispering succeeded!");
        }
        
        // parse player data
        let pid = srcToValue(src_ref);
        let role = srcToValue(src_name);
        
        // get channel to whisper to
        let cid = await getSrcRefChannel(`${target.type}:${target.value}`);
        let targetChannel = mainGuild.channels.cache.get(cid);
        
        // get channel to whisper from
        let index = 0;
        let existingChannel = null;
        while(true) {
            // get channel id
            index++;
            let con = await connectionGet(`whisper:${pid}-${index}`);
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
            whisperChannel = await whisperingCreate(role, pid, index);
        }
        
        // connection name
        const conName = `${pid}-${index}`;
        
        // create connection on own end
        connectionAdd(whisperChannel.id, conName, disguise);
        let targetText = srcRefToText(`${target.type}:${target.value}`);
        let embed = basicEmbed(`Now whispering to ${targetText}!`, EMBED_GREEN);
        whisperChannel.send(embed);
        
        // create connection on other end
        connectionAdd(targetChannel.id, conName);
        let embed2 = basicEmbed(`You are now being whispered to!`, EMBED_GREEN);
        targetChannel.send(embed2);
        
        // create an attribute
        await createWhisperAttribute(src_name, src_ref, pid, dur_type, conName, whisperChannel.id, targetChannel.id);
        
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
                connectionDelete(name);
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

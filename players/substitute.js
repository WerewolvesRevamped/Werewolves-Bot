/**
    Functions related to performing substitution
**/

module.exports = function() {
    
	/**
    Command: $players substitute
    **/
	this.cmdPlayersSubstitute = async function(message, args) {
		if(!args[2]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "players substitute <current player id> <new player id>`!"); 
			return; 
		}
       
       // get original and new player ids and members
        let originalPlayer = getUser(args[1]);
        let originalPlayerMember = message.channel.guild.members.cache.get(originalPlayer);
        let newPlayer = getUser(args[2]);
        let newPlayerMember = message.channel.guild.members.cache.get(newPlayer);
        if(!newPlayer || !newPlayerMember) {
			message.channel.send("⛔ Player error. Could not find player!"); 
			return; 
        }
        
        // check if original player exists, but allow override for players that have left the server
        if(!originalPlayer) {
            if(args[3] != "force") {
                message.channel.send("⛔ Player error. Could not find original player! To sub out a player that has left the server, specify 'force' as an additional argument. When subbing out a player that has left the server you must specify their exact discord id as no verification is performed."); 
                return; 
            } else {
                originalPlayer = args[1];
                originalPlayerMember = null;
            }
        }
        
        // make sure original player is actually a participant
        if(originalPlayerMember && !isParticipant(originalPlayerMember) && !isGhost(originalPlayerMember)) {
			message.channel.send("⛔ Player error. Can not sub out a non-participant!"); 
			return; 
        }
        
        // attempt auto sub signup for new player
        if(!isSub(newPlayerMember) && !isMentor(newPlayerMember)) {
            let em = idEmojis.filter(el => el[0] == newPlayer);
            if(em[0]) {
                message.channel.send(`✳️ Detected <@${newPlayer}> as not a substitute. Signing them up as a substitute.`); 
                cmdSignup(message.channel, newPlayerMember, [ em[0][1] ], false, "substitute");
                await sleep(5000);
            }
        }
        
        // Auto-unmentor
        if(isMentor(newPlayerMember)) {
			message.channel.send(`✳️ Detected <@${newPlayer}> as mentor. Removing mentor from them.`); 
            removeRoleRecursive(newPlayerMember, message.channel, stats.mentor, "Mentor");
            sqlPromEsc("UPDATE players SET mentor='' WHERE mentor=", newPlayer);
            await sleep(5000);
            // get emoji
			message.channel.send(`✳️ Detected <@${newPlayer}> as mentor. Signing them up as a substitute.`); 
            let newEmoji;
            let em = idEmojis.filter(el => el[0] == newPlayer);
            if(em[0]) {
                newEmoji = em[0][1];
            } else {
                let res = await sqlPromOneEsc("SELECT emoji FROM players WHERE id=", originalPlayer);
                await sqlPromOneEsc("UPDATE players SET emoji='none' WHERE id=", originalPlayer);
                newEmoji = res.emoji;
            }
            cmdSignup(message.channel, newPlayerMember, [ newEmoji ], false, "substitute");
            await sleep(5000);
        }
        
        // check if is sub or mentor
        if(!isSub(newPlayerMember)) {
			message.channel.send("⛔ Player error. Can not sub in a non-substitute!"); 
			return; 
        }
        
        // begin substitution
        message.channel.send(`✳️ Replacing <@${originalPlayer}> with <@${newPlayer}>! This may take a while. Please wait until execution is complete before executing further commands.`);
        
        // pause
        pauseActionQueueChecker = true;
        automationBusy = true;
        
        // get old player data
        let oldPlayerData = await sqlPromOneEsc("SELECT * FROM players WHERE id=", originalPlayer);
        
        if(!oldPlayerData) {
			message.channel.send("⛔ Substitution error. Unable to retrieve player data of the original player!"); 
			return; 
        }
        
        // initialize common escaped values
        let oldId = connection.escape(originalPlayer);
        let oldIdSrc = connection.escape(`player:${originalPlayer}`);
        let oldIdSelector = connection.escape(`@id:${originalPlayer}[player]`);
        let newId = connection.escape(newPlayer);
        let newIdSrc = connection.escape(`player:${newPlayer}`);
        let newIdSelector = connection.escape(`@id:${newPlayer}[player]`);
        
        // update new player data
        await sqlPromEsc("UPDATE players SET type='player',role=" + connection.escape(oldPlayerData.role) +",orig_role=" + connection.escape(oldPlayerData.orig_role) +",alignment=" + connection.escape(oldPlayerData.alignment) +",alive=" + connection.escape(oldPlayerData.alive) + ",ccs=" + connection.escape(oldPlayerData.ccs) +",target=" + connection.escape(oldPlayerData.target) +",counter=" + connection.escape(oldPlayerData.counter) +" WHERE id=", newPlayer);
        
        // update old player data
        await sqlPromEsc("UPDATE players SET type='substituted',role='substituted' WHERE id=", originalPlayer);
        
        // update
        message.channel.send("✅ Updated basic player info!");
        
        // new player: add particpant role, remove sub role
        switchRoles(newPlayerMember, message.channel, stats.sub, stats.participant, "substitute", "participant");
        // remove mentor role
        removeRoleRecursive(newPlayerMember, message.channel, stats.mentor, "mentor");
        
        // old player: remove particpant role, add dead participant role
        if(originalPlayerMember) switchRoles(originalPlayerMember, message.channel, stats.participant, stats.dead_participant, "participant", "dead participant");
        
        // delete connection to sub channel
        await sqlProm(`DELETE FROM connected_channels WHERE id=${newId}`);
        
        // update various additional tables
        await sqlProm(`UPDATE action_data SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE action_data SET last_target=${newIdSelector} WHERE last_target=${oldIdSelector}`);
        await sqlProm(`UPDATE action_queue SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE action_queue SET target=${newIdSelector} WHERE target=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET owner=${newId} WHERE owner=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val1=${newId} WHERE val1=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val2=${newId} WHERE val2=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val3=${newId} WHERE val3=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val4=${newId} WHERE val4=${oldId}`);
        await sqlProm(`UPDATE active_attributes SET val1=${newIdSrc} WHERE val1=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val2=${newIdSrc} WHERE val2=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val3=${newIdSrc} WHERE val3=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val4=${newIdSrc} WHERE val4=${oldIdSrc}`);
        await sqlProm(`UPDATE active_attributes SET val1=${newIdSelector} WHERE val1=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET val2=${newIdSelector} WHERE val2=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET val3=${newIdSelector} WHERE val3=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET val4=${newIdSelector} WHERE val4=${oldIdSelector}`);
        await sqlProm(`UPDATE active_attributes SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE active_groups SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE active_polls SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE polls SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE choices SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE choices SET owner=${newIdSrc} WHERE owner=${oldIdSrc}`);
        await sqlProm(`UPDATE connected_channels SET id=${newId} WHERE id=${oldId}`);
        await sqlProm(`UPDATE host_information SET id=${newId} WHERE id=${oldId}`);
        await sqlProm(`UPDATE host_information SET value=${newId} WHERE value=${oldId}`);
        await sqlProm(`UPDATE killq SET id=${newId} WHERE id=${oldId}`);
        await sqlProm(`UPDATE killq SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE players SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE prompts SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        await sqlProm(`UPDATE teams SET target=${newIdSrc} WHERE target=${oldIdSrc}`);
        await sqlProm(`UPDATE active_displays SET src_ref=${newIdSrc} WHERE src_ref=${oldIdSrc}`);
        
        // update
        message.channel.send("✅ Updated basic columns in all tables!");
        
        // replace within a string
        await sqlProm(`UPDATE prompts SET additional_trigger_data = replace(additional_trigger_data, ${newId}, ${oldId}) WHERE additional_trigger_data LIKE ${connection.escape('%' + originalPlayer + '%')}`);
        await sqlProm(`UPDATE action_queue SET additional_trigger_data = replace(additional_trigger_data, ${newId}, ${oldId}) WHERE additional_trigger_data LIKE ${connection.escape('%' + originalPlayer + '%')}`);
        await sqlProm(`UPDATE action_queue SET abilities = replace(abilities, ${newId}, ${oldId}) WHERE abilities LIKE ${connection.escape('%' + originalPlayer + '%')}`);
        
        // update
        message.channel.send("✅ Updated complex columns in all tables!");
        
        // cc substitutions
		setTimeout(function () {
			let categories = cachedCCs;
			categories.push(...cachedSCs)
			substituteCategories(categories, originalPlayer, newPlayer);
		}, 15000);
        
        
        // recache
		setTimeout(function() {
            getIDs();
			cacheRoleInfo();
			getCCs();
			getPRoles();
			getCCCats();
            cacheActiveCustomAttributes();
            cacheDR();
            getEmojis();
			message.channel.send("✅ Recached values!");
		}, 30000);
        
        // recache
		setTimeout(function() {
			message.channel.send("✅ Substitution complete!");
            
            // unpause
            pauseActionQueueChecker = false;
            automationBusy = false;
		}, 35000);
	}
    
	/**
    Substitute Categories
    performs a channel substitution on several categories
    **/
	this.substituteCategories = function(categories, subPlayerFrom, subPlayerTo) {
        for(let i = 0; i < categories.length; i++) {
            let cat = mainGuild.channels.cache.get(categories[i]);
            if(!cat) continue;
            let channels = cat.children.cache.toJSON();
            substituteChannels(channels, subPlayerFrom, subPlayerTo);
        }
	}
    
    /**
    Substitute Channels
    performs a channel substitution on several channels
    **/
    this.substituteChannels = function(channels, subPlayerFrom, subPlayerTo) {
        for(let i = 0; i < channels.length; i++) {
            let channel = mainGuild.channels.cache.get(channels[i].id);
            if(!channel) continue;
            // get memberships
            let perms = channel.permissionOverwrites.cache.toJSON();
            let channelMembers = perms.filter(el => el.type === OverwriteType.Member).map(el => el.id);
			let channelOwners = perms.filter(el => el.type === OverwriteType.Member).filter(el => el.allow == 66560).map(el => el.id);
            // apply substitution
            if(channelMembers.includes(subPlayerFrom)) {
                channelSetPermission(channel, subPlayerTo, CC_PERMS_MEMBER);
			}
			if(channelOwners.includes(subPlayerFrom)) {
                channelSetPermission(channel, subPlayerTo, CC_PERMS_OWNER);
			}
        }
    }
    
}
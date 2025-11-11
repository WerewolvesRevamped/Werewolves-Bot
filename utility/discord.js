/**
	Utility Module - Discord
    This module has utility functions related to discord actions
*/
module.exports = function() {
    /**
    Discord/Console Log
    Prints a message in the log channel + console logs it
    */
	this.log = function(txt) {
		console.log(txt);
		if(stats.log_guild && stats.log_channel) {
			client.guilds.cache.get(stats.log_guild).channels.cache.get(stats.log_channel).send(txt);
		}
	}

	/**
    Log Object
    Passes an object to the log function in stringified form
    */
	this.logO = function(logObj) {
		let obj = JSON.stringify(logObj, null, 4);
		log(obj);
	}
    
	/**
    Send Error
    Sends an error message on discord to a specified channel
    */
	this.sendError = function(channel, err, info) {
		if(err && err.name && err.message) { 
			channel.send("⛔ " + err.name + ". " + err.message.replace(/[\n\r]/g, ". ").substr(0,1500) + ". " + info + "!");
		} else {
			channel.send("⛔ Unknown error. " + info + "!");
		}
	}
	
	/**
    Edit in Error
    Edits in an error message into a specified discord message
    */
	this.editError = function(message, err, info) {
		if(err && err.name && err.message) { 
			message.edit("⛔ " + err.name + ". " + err.message.replace(/[\n\r]/g, ". ").substr(0,1500) + ". " + info + "!");
		} else {
			message.edit("⛔ Unknown error. " + info + "!");
		}
	}
    		
	/**
    Cleanup Category
    Cleansup a discord category by deleting every channel in it
    */
	this.cleanupCat = function(channel, categoryID, name) {
		// Category deleted
		if(!channel.guild.channels.cache.get(categoryID)) { 
		channel.send("⛔ Command error. No " + name + " category found!");
			return;
		}
		// Delete channels in category
		cleanupOneChannel(channel, categoryID, channel.guild.channels.cache.get(categoryID).children.cache.toJSON(), 0, name);
	}
	
	/**
    Cleanup Channel
    Used by cleanupCat to delete a single channel
    */
	this.cleanupOneChannel = function(channel, cat, channels, index, name) {
		if(channels.length <= 0) return;
		if(index >= channels.length) {
			// Delete category
			channel.guild.channels.cache.get(cat).delete().then(c => {
				channel.send("✅ Successfully deleted " + name + " category!");
			}).catch(err => { 
				logO(err); 
				sendError(channel, err, "Could not delete " + name + " Category");
			});
			return;
		}
		// Deleted channel
		if(!channels[index] || !channel.guild.channels.cache.get(channels[index].id)) {
			cleanupOneChannel(channel, cat, channels, ++index, name);
			return;
		}
		// Delete channel
		channel.guild.channels.cache.get(channels[index].id).delete().then(c => {
			cleanupOneChannel(channel, cat, channels, ++index, name);
		}).catch(err => { 
			logO(err); 
			sendError(channel, err, "Could not delete channel");
		});
	}
    
    /**
    Inverted Switch Roles
    Runs switchRoles with the roles ids and role names swapped
    */
    this.switchRolesX = function(member, channel, initialRole, newRole, initialName, newName) {
        switchRoles(member, channel, newRole, initialRole, newName, initialName);
    }
    
    /**
    Switch Roles
    Switches one discord role to another discord role and reattempts the switch until it succeeds
    **/
    this.switchRoles = function(member, channel, initialRole, newRole, initialName, newName, iteration = 1) {
		return new Promise((resolve) => {
            if(member.roles.cache.get(initialRole)) {
                member.roles.add(newRole).then(async r => {
                    if(member.roles.cache.get(newRole) && iteration < 20) {
                        // successfully removed roles
                        await removeRoleRecursive(member, channel, initialRole, initialName);
                    } else {
                        if(channel) channel.send(`❗ Could not add ${newName} role to ${member.displayName}. Trying again! (#${iteration})`);
                        await sleep(500 * iteration);
                        await switchRoles(member, channel, initialRole, newRole, initialName, newName, ++iteration);
                    }
                    resolve(true);
                }).catch(err => { 
                    // Missing permissions
                    logO(err); 
                    if(channel) sendError(channel, err, `Could not add ${newName} role to ${member.displayName}`);
                    resolve(false);
                });
            }
        });
    }
    
    /**
    Remove Role
    Removes a discord role until it succeeds
    **/
    this.removeRoleRecursive = function(member, channel, remRole, name, iteration = 1) {
        if(!member) { log("Cannot find member in removeRoleRecursive"); return; }
		return new Promise((resolve) => {
            member.roles.remove(remRole).then(async r => {
                if(member.roles.cache.get(remRole) && iteration < 20) {
                    if(channel) channel.send(`❗ Could not remove ${name} role from ${member.displayName}. Trying again! (#${iteration})`);
                    await sleep(500 * iteration);
                    await removeRoleRecursive(member, channel, remRole, name, ++iteration);
                }
                resolve(true);
            }).catch(err => { 
                // Missing permissions
                logO(err); 
                if(channel) sendError(channel, err, `Could not remove ${name} role from ${member.displayName}`);
                resolve(false);
            });
        });
    }
    
    /**
    Add Role
    Adds a discord role until it succeeds
    */
    this.addRoleRecursive = function(member, channel, addRole, name, iteration = 1) {
        if(!member) { log("Cannot find member in addRoleRecursive"); return; }
		return new Promise((resolve) => {
            member.roles.add(addRole).then(async r => {
                if(!member.roles.cache.get(addRole) && iteration < 20) {
                    if(channel) channel.send(`❗ Could not add ${name} role to ${member.displayName}. Trying again! (#${iteration})`);
                    await sleep(500 * iteration);
                    await addRoleRecursive(member, channel, addRole, name, ++iteration);
                }
                resolve(true);
            }).catch(err => { 
                // Missing permissions
                logO(err); 
                if(channel) sendError(channel, err, `Could not add ${name} role to ${member.displayName}`);
                resolve(false);
            });
		});
	}
    
    /**
    Get Server Icon
    Returns the url to the server icon as png
    **/
    this.getServerIcon = async function(guild) {
        let serverIcon = await guild.iconURL();
        serverIcon = serverIcon.replace("webp","png");
        return serverIcon;
    }
      
    /**
    Get Emoji
    Gets an emoji by name
    **/
    this.getEmoji = function(name, returnQuestion = true) {
        name = name.replace(/ /,"").toLowerCase();
        let emoji = client.emojis.cache.find(el => el.name.toLowerCase() === name);
        if(emoji) {
            emoji = `<${emoji.animated?'a':''}:${emoji.name}:${emoji.id}>`;
        } else {
            console.log(`Cannot find emoji ${name}.`);
            emoji = "❓";
            if(!returnQuestion) return "";
        }
        return emoji;
    }
    
    /**
    Send Embed
    sends an embed and optionally pins it (+ deletes the pin)
    **/
    this.sendEmbed = async function(channel, embed, pin = false) {
		return new Promise((resolve) => {
            // send embed
            channel.send({ embeds: [ embed ] }).then(m => {
                if(pin) { // pin message if pin is set to true
                    m.pin().then(mp => {
                        mp.channel.messages.fetch().then(messages => {
                            mp.channel.bulkDelete(messages.filter(el => el.type === MessageType.ChannelPinnedMessage)); // delete pinning message
                        });	
                    })
                }
                resolve(m);
            });
        });
    }
    
    /**
    Sends a message to a specified channel id
    **/
    this.sendMessage = function(channel_id, msg) {
        let con_sc = mainGuild.channels.cache.get(channel_id); // get channel
        con_sc.send(msg); // send message
    }
    
    /**
    Pins a message and deletes the pinning message
    **/
    this.pinMessage = function(message) {
        message.pin().then(mp => {
            mp.channel.messages.fetch().then(messages => {
                mp.channel.bulkDelete(messages.filter(el => el.type === MessageType.ChannelPinnedMessage)); // delete pinning message
            });	
        });
    }
    
    /**
    Sends a message to a specified channel id with a disguise by using a webhook
    **/
    this.sendMessageDisguise = async function(channel_id, msg, disguise = null) {
        if(!disguise) { // switch to disguise-less sending if no disguise is specified
            sendMessage(channel_id, msg);
            return;
        }
        
        // webhook defaults
        let webhookAvatar = client.user.displayAvatarURL();
        
        // get role icon (if applicable)
        let roleIcon = await getIconFromName(disguise);
        if(roleIcon) webhookAvatar = roleIcon;
        
        // get channel
        let con_sc = mainGuild.channels.cache.get(channel_id);
        
        // get webhooks of channel
        let webhooks = await con_sc.fetchWebhooks();
        
        // search for correct webhook 
        let webhook = webhooks.find(w => w.name == disguise);
        
        // webhook doesnt exist
        if(!webhook) {
            if(webhooks.size < 10) { // empty slot
                // create new wbehook
                webhook = await con_sc.createWebhook({ name: disguise, avatar: webhookAvatar})
            } else { // no empty slot - skip disguised message and instead send normal message + delete another webhook
                sendMessage(channel_id, `**${disguise}**: ${msg}`);
                webhooks.first().delete();
                return;
            }
        }
        
         // send message
         if(msg.length > 2000) {
             webhook.send(msg.substr(0, 2000));
             webhook.send(msg.substr(2000));
         } else {
            webhook.send(msg);
         }
    }
    
    /**
    Sends a message to a specified channel id with a disguise as a specific user by using a webhook
    **/
    this.sendMessageDisguiseMember = async function(channel_id, msg, member = null) {
        if(!member) { // switch to disguise-less sending if no disguise is specified
            sendMessage(channel_id, msg);
            return;
        }
        
        // get disguise name / avatar
		let webhookName = member.displayName ?? client.user.username;
		let webhookAvatar = member.user.displayAvatarURL() ?? client.user.displayAvatarURL();

        // get channel
        let con_sc = mainGuild.channels.cache.get(channel_id);
        
        // get webhooks of channel
        let webhooks = await con_sc.fetchWebhooks();
        
        // search for correct webhook 
        let webhook = webhooks.find(w => w.name == webhookName);
        
        // webhook doesnt exist
        if(!webhook) {
            if(webhooks.size < 10) { // empty slot
                // create new wbehook
                webhook = await con_sc.createWebhook({ name: webhookName, avatar: webhookAvatar})
            } else { // no empty slot - skip disguised message and instead send normal message + delete another webhook
                sendMessage(channel_id, `**${webhookName}**: ${msg}`);
                webhooks.first().delete();
                return;
            }
        }
        
         // send message
         if(msg.length > 2000) {
             webhook.send(msg.substr(0, 2000));
             webhook.send(msg.substr(2000));
         } else {
            webhook.send(msg);
         }
    }
        
}
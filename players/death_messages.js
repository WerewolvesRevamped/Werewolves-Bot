/**
	Role Icons
*/
module.exports = function() {
    
    /**
    Command: $death_message
    **/
    this.cmdDeathMessage = async function(message, args) {
        if(!args[0]) { 
            cmdDeathMessageList(message);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) {
			case "select": 
			case "set": cmdDeathMessageSet(message, args); break;
			case "disable": cmdDeathMessageDisable(message); break;
			case "list": cmdDeathMessageList(message); break;
			case "test": if(checkGM(message)) cmdDeathMessageTest(message); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $death_message disable
    **/
    this.cmdDeathMessageDisable = async function(message) {
        sqlPromEsc("INSERT INTO death_message (player, message) VALUES (" + connection.escape(message.author.id) + ",0) ON DUPLICATE KEY UPDATE message=", 0);
        let embed = { title: "Death Message", description: `<@${message.member.id}>, your custom death message has been disabled.`, color: 16715021 };
        message.channel.send({ embeds: [ embed ] });
    }
    
    /**
    Command: $death_message list
    **/
    this.cmdDeathMessageList = async function(message) {
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", message.member.id);
        items = items.filter(el => el.item.substr(0, 2) === "dm").map(el => [el.item.split(":")[1], ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no icons
        if(items.length === 0) {
            let embed = { title: "Death Message", description: `<@${message.member.id}>, you do not have any custom death messages!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }
        
        if(items.length > 10) { // >10 items
            // format item list
            let items1 = ["• Default (0)"], items2 = [];
            let half = Math.ceil(items.length / 2);
            for(let i = 0; i < half; i++) items1.push(`• ${items[i][1][1]} (${items[i][0]})`);
            if(items.length > 1) for(let i = half; i < items.length; i++) items2.push(`• ${items[i][1][1]} (${items[i][0]})`);
            let embed = { title: "Death Message", description: `<@${message.author.id}>, here is a list of custom death messages available for you. You can switch death message by running \`${stats.prefix}dmsg select <ID>\`, where you replace \`<ID>\` with the __number__ of the death message you want to select.\n\n`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        } else { // <=10 items
            // format item list
            let itemsTxt = [];
            for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][1][1]} (${items[i][0]})`);
            let embed = { title: "Death Message", description: `<@${message.author.id}>, here is a list of custom death messages available for you. You can switch death message by running \`${stats.prefix}dmsg select <ID>\`, where you replace \`<ID>\` with the __number__ of the death message you want to select.\n\n• Default (0)\n` + itemsTxt.join("\n"), color: 8984857 };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        }
        
    }
        
    /**
    Command: $death_message set
    **/
    this.cmdDeathMessageSet = async function(message, args) {
        if(!args[1]) { 
			message.channel.send("⛔ Syntax error. Not enough arguments!");
			return; 
		} 
        
        // parse role
        let dmsg = + args[1];
        if(dmsg < 0 || dmsg > 100) {
			message.channel.send("⛔ Command error. Invalid death message. Please specify a valid ID!");
			return;     
        }
        let dmsgData = ALL_LOOT.filter(el => el[0].toLowerCase() === "dm:" + dmsg)[0];
        if(dmsg === 0) {
            dmsgData = ["DM:0", "Default"];
        }
        if(!dmsgData) {
			message.channel.send("⛔ Command error. Invalid death message. Could not find death message!");
			return;     
        }
        
        // check if has dmsg
        let dmPerms = await inventoryGetItem(message.member.id, "dm:" + dmsg);
        if(dmPerms === 0 && dmsg != 0) {
            let embed = { title: "Death Message", description: `<@${message.member.id}>, you do not have the \`${dmgs}\` death message unlocked.`, color: 16715021 };
            message.channel.send({ embeds: [ embed ] });
            return;
        } 
        
        
        sqlPromEsc("INSERT INTO death_message (player, message) VALUES (" + connection.escape(message.author.id) + "," + connection.escape(dmsg) + ") ON DUPLICATE KEY UPDATE message=", dmsg);
        let embed = { title: "Death Message", description: `<@${message.member.id}>, your death message has been updated to ${toTitleCase(dmsgData[1])}.`, color: 5490704 };
        message.channel.send({ embeds: [ embed ] });

    }
    
    /**
    Command: $death_message test
    **/
    this.cmdDeathMessageTest = async function(message) {
        let dmsg = await getDeathMessage(message.author.id);
        message.channel.send(dmsg);
    }
    
    /**
    Gets death message
    **/
    const ActivityType = {
        Playing: 0,
        Streaming: 1,
        Listening: 2,
        Watching: 3,
        Custom: 4,
        Competing: 5
    }
    this.getDeathMessage = async function(pid, displayName = null) {
        if(!displayName) displayName = `<@${pid}>`;
        let nickname = client.users.cache.get(pid)?.displayName ?? pid;
        let dmsg = await sqlPromOneEsc("SELECT message FROM death_message WHERE player=", pid);
        let dmsgText = "%s has died.";
        if(dmsg && dmsg.message) {
            switch(+dmsg.message) {
                default:
                case 0:
                    dmsgText =  "%s has died.";
                break;
                case 1:
                    dmsgText =  `%s has died ${getEmoji('realsad')}, better luck next time!`;
                    setCustomStatus(`Crying about ${nickname}'s death...`);
                break;
                case 2:
                    dmsgText =  `%s died, but they did their best! 🫡`;
                break;
                case 3:
                    let rand = Math.floor(Math.random() * 11);
                    dmsgText =  `%s's death receives an official WWR Bot Rating of ${rand}/10!`;
                    setCustomStatus(`Rating ${nickname}'s death: ${rand}/10`);
                break;
                case 4:
                    let ids = await getAllLivingIDs();
                    for(let i = 0; i < ids.length; i++) {
                        await sqlProm("INSERT INTO packs (player, pack) VALUES (" + connection.escape(ids[i]) + ",6) ON DUPLICATE KEY UPDATE pack=6");
                    }
                    await cachePacks();
                    dmsgText =  `You will regret killing %s. You have been cursed.`;
                break;
                case 5:
                    dmsgText =  `Why... why did %s have to die... if only they could be resurrected. No, that's nonsense. We're never getting anyone back.`;
                    setCustomStatus(`Mourning ${nickname}...`);
                break;
                case 6:
                    let randMsgs = ["%s was killed.", "%s has died.", "%s was murdered.", "%s was slaughtered.", "%s will no longer be playing.", "%s is out of the game.", "That's it for %s. Dead.", "No more %s. They're gone."];
                    dmsgText =  randMsgs[Math.floor(Math.random() * randMsgs.length)];
                break;
                case 7:
                    dmsgText =  `It's horrible, but it seems % has died.`;
                break;
                case 8:
                    dmsgText =  `%s is gone! 🦀`;
                break;
                case 9:
                    dmsgText =  `${getEmoji('crow')} It seems a murder of crows has murdered %s! ${getEmoji('crow')}`;
                break;
            }
        }
        dmsgText = dmsgText.replace(/%s/g, displayName);
        return dmsgText;
    }
    
    this.setCustomStatus = function(message) {
        client.user.setPresence({ activities: [{ name: "custom", type: ActivityType.Custom, state: message }], status: "online" });
    }
    
    
    
    
}
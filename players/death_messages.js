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
        items = items.filter(el => el.item.substr(0, 2) === "dm").map(el => [el.item.split(":")[1], ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0], el.count]);
        items = items.sort((a,b) => a[0] - b[0]); 
        
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
            for(let i = 0; i < half; i++) items1.push(`• ${items[i][1][1]} (${items[i][0]}) ${items[i][2] > 1 ? '(x' + items[i][2] + ')' : ''}`);
            if(items.length > 1) for(let i = half; i < items.length; i++) items2.push(`• ${items[i][1][1]} (${items[i][0]}) ${items[i][2] > 1 ? '(x' + items[i][2] + ')' : ''}`);
            let embed = { title: "Death Message", description: `<@${message.author.id}>, here is a list of custom death messages available for you. You can switch death message by running \`${stats.prefix}dmsg select <ID>\`, where you replace \`<ID>\` with the __number__ of the death message you want to select.\n\n`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        } else { // <=10 items
            // format item list
            let itemsTxt = [];
            for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][1][1]} (${items[i][0]}) ${items[i][2] > 1 ? '(x' + items[i][2] + ')' : ''}`);
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
                        if(Math.random() > 0.75) {
                            await sqlProm("INSERT INTO packs (player, pack) VALUES (" + connection.escape(ids[i]) + ",6) ON DUPLICATE KEY UPDATE pack=6");
                        }
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
                    dmsgText =  `It's horrible, but it seems %s has died.`;
                break;
                case 8:
                    dmsgText =  `%s is gone! 🦀`;
                break;
                case 9:
                    dmsgText =  `${getEmoji('crow')} It seems a murder of crows has murdered %s! ${getEmoji('crow')}`;
                break;
                case 10:
                    let ids2 = await getAllLivingIDs();
                    for(let i = 0; i < ids2.length; i++) {
                        if(Math.random() > 0.75) {
                            await sqlProm("INSERT INTO packs (player, pack) VALUES (" + connection.escape(ids2[i]) + ",46) ON DUPLICATE KEY UPDATE pack=46");
                        }
                    }
                    await cachePacks();
                    dmsgText =  `${getEmoji('Bear')} %s couldn't *bear* it anymore! ${getEmoji('Bear')}`;
                    setCustomStatus(`Growling in sorrow for ${nickname}.`);
                break;
                case 11:
                    let deathLoc = ["at home", "at the Wolvespine Medical Hospital", "on the street", "in an alley", "in a river"];
                    let deathCause = ["death", "a heart attack", "mauling and fractured bones", "blood loss", "spontaneous human combustion", "a hemorrhage", "apnea", "blood vessel rupture", "choking and loose bowels"];
                    dmsgText =  `Name: %s; [${getFormattedUTCTime()}]\nCause of Death: Died ${deathLoc[Math.floor(Math.random() * deathLoc.length)]} due to ${deathCause[Math.floor(Math.random() * deathCause.length)]}.`;
                break;
                case 12:
                    let card = ["Ace","Ten","Jack","Queen","King"];
                    let suits = ["♣️","♦️","♥️","♠️"];
                    let living = await getAllLivingIDs();
                    dmsgText =  `A laser pierces through %s's skull after failing the \`${card[Math.floor(Math.random() * card.length)]} of ${suits[Math.floor(Math.random() * suits.length)]}\`. ${living.length} players remain in the WWRlands.`;
                break;
            }
        }
        dmsgText = dmsgText.replace(/%s/g, displayName);
        return dmsgText;
    }
    
    this.setCustomStatus = function(message) {
        client.user.setPresence({ activities: [{ name: "custom", type: ActivityType.Custom, state: message }], status: "online" });
    }
    
    // Function to get the formated date
    this.getFormattedUTCTime = function() {
        const now = new Date();
        
        // slightly randomize date so there is no ability to get info from it  
        const offsetSeconds = Math.floor(Math.random() * 61) - 30; // (-30 to +30)
        now.setUTCSeconds(now.getUTCSeconds() + offsetSeconds);

        // days and months
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const weekday = weekdays[now.getUTCDay()];
        const month = months[now.getUTCMonth()];
        const day = now.getUTCDate();
        const year = now.getUTCFullYear();
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        return `${weekday}, ${month} ${getOrdinal(day)} ${year} ${hours}:${minutes}:${seconds}`;
    }
    
    // Function to get ordinal suffix
    function getOrdinal(n) {
        if (n >= 11 && n <= 13) return n + "th";
        switch (n % 10) {
            case 1: return n + "st";
            case 2: return n + "nd";
            case 3: return n + "rd";
            default: return n + "th";
        }
    }
    
    
    
    
}
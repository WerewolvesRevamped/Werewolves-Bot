/**
	Role Icons
*/
module.exports = function() {
    
    /**
    Command: $icon
    **/
    this.cmdIcon = async function(message, args) {
        if(!args[0]) { 
            cmdIconList(message);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) {
			case "select": 
			case "set": cmdIconSet(message, args); break;
			case "disable": cmdIconDisable(message); break;
			case "list": cmdIconList(message); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $icon disable
    **/
    this.cmdIconDisable = async function(message) {
        // get user data
        let tr = message.member.roles.cache.find(r => r.name.substr(0, 5) === "Icon_");
        if(tr) { // role found -> remove it
            if(tr.members.size === 1) {
                tr.delete();
            } else {
                message.member.roles.remove(tr);
            }
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, your role icon has been disabled.`, color: 16715021 };
            message.channel.send({ embeds: [ embed ] });
        } else {
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, you do not have a role icon.`, color: 16715021 };
            message.channel.send({ embeds: [ embed ] });
        }
    }
    
    /**
    Command: $icon list
    **/
    this.cmdIconList = async function(message) {
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", message.member.id);
        items = items.filter(el => el.item.substr(0, 2) === "ic").map(el => [el.count, el.item.split(":")[1], ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no icons
        if(items.length === 0) {
            let embed = { title: "Role Icons", description: `<@${message.member.id}>, you do not have any role icons!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }
        
        if(items.length > 10) { // >10 items
            // format item list
            let items1 = [], items2 = [];
            let half = Math.ceil(items.length / 2);
            for(let i = 0; i < half; i++) items1.push(`• ${getEmoji(items[i][1])} ${items[i][2][1]} ${items[i][0] > 1 ? '(x' + items[i][0] + ')' : ''}`);
            if(items.length > 1) for(let i = half; i < items.length; i++) items2.push(`• ${getEmoji(items[i][1])} ${items[i][2][1]} ${items[i][0] > 1 ? '(x' + items[i][0] + ')' : ''}`);
            let embed = { title: "Role Icons", description: `Here is a list of icon roles available for you, <@${message.member.id}>. You can switch icon role by running \`${stats.prefix}icon select "<Name>"\`, where you replace \`<Name>\` with the name of the icon you want to select.`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        } else { // <=10 items
            // format item list
            let itemsTxt = [];
            for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${getEmoji(items[i][1])} ${items[i][2][1]} ${items[i][0] > 1 ? '(x' + items[i][0] + ')' : ''}`);
            let embed = { title: "Role Icons", description: `Here is a list of icon roles available for you, <@${message.member.id}>. You can switch icon role by running \`${stats.prefix}icon select "<Name>"\`, where you replace \`<Name>\` with the name of the icon you want to select.\n\n` + itemsTxt.join("\n"), color: 8984857 };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        }
        
    }
        
    /**
    Command: $icon set
    **/
    this.cmdIconSet = async function(message, args) {
        if(!args[1]) { 
			message.channel.send("⛔ Syntax error. Not enough arguments!");
			return; 
		} 
        
        // parse icon name
        let iconName = args[1].toLowerCase().replace(/[^a-z ]*/g, "").trim();

        // check if has role
        let iconPerms = await inventoryGetItem(message.member.id, "ic:" + iconName);
        if(iconPerms === 0) {
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, you do not have the ${toTitleCase(iconName)} icon unlocked.`, color: 16715021 };
            message.channel.send({ embeds: [ embed ] });
            return;
        } 
        
        // revoke old role if applicable
        let trOld = message.member.roles.cache.find(r => r.name.substr(0, 5) === "Icon_");
        if(trOld) {
            if(trOld.members.size === 1) {
                trOld.delete();
            } else {
                message.member.roles.remove(trOld);
            }
        }
        
        // get user data
        let rName = `Icon_${toTitleCase(iconName).replace(/ /g,"")}`;
        let tr = message.guild.roles.cache.find(r => r.name === rName);
        
        let iconUrl;
        // get role url
        let role = parseRole(args[1]);
        let isRole = verifyRole(role);
        if(isRole) {
            let roleData = await getRoleDataFromName(iconName);
            iconUrl = roleData ? roleData.url : null;
        }
        // get non-role url via LUT
        if(!iconUrl || !isRole) {
            let lutval = applyLUT(iconName);
            if(lutval) {
                iconUrl = `${iconRepoBaseUrl}${lutval}.png`;
            } else {
                message.channel.send("⛔ Command error! Could not find icon!");
                return; 
            }
        }
        
        if(tr) { // role found -> assign it
            message.member.roles.add(tr);
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, your role icon has been updated to ${toTitleCase(iconName)}.`, color: 5490704 };
            embed.thumbnail = { url: iconUrl };
            message.channel.send({ embeds: [ embed ] });
        } else {
            let dRole = await message.guild.roles.create({ name: rName, reason: "Automatic Token Role" });
            let hr = message.guild.roles.cache.find(r => r.name === "--- Token Role ---");
            await dRole.setPosition(hr ? hr.position - 2 : 0);
            await dRole.setIcon(iconUrl);
            await message.member.roles.add(dRole);
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, your role icon has been set to ${toTitleCase(iconName)}.`, color: 5490704 };
            embed.thumbnail = { url: iconUrl };
            message.channel.send({ embeds: [ embed ] });
        }
    }
    
    
}
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
            message.member.roles.remove(tr);
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
            for(let i = 0; i < half; i++) items1.push(`• ${getEmoji(items[i][1])} ${items[i][2][1]}`);
            if(items.length > 1) for(let i = half; i < items.length; i++) items2.push(`• ${getEmoji(items[i][1])} ${items[i][2][1]}`);
            let embed = { title: "Role Icons", description: `<@${message.member.id}>, here are your current role icons:`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        } else { // <=10 items
            // format item list
            let itemsTxt = [];
            for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${getEmoji(items[i][1])} ${items[i][2][1]}`);
            let embed = { title: "Role Icons", description: `<@${message.member.id}>, here are your current role icons:\n\n` + itemsTxt.join("\n"), color: 8984857 };
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
        
        // parse role
        let role = parseRole(args[1]);
        if(!verifyRole(role)) {
			message.channel.send("⛔ Command error. Invalid role!");
			return;     
        }
        
        // check if has role
        let iconPerms = await inventoryGetItem(message.member.id, "ic:" + role);
        if(iconPerms === 0) {
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, you do not have the ${toTitleCase(role)} icon unlocked.`, color: 16715021 };
            message.channel.send({ embeds: [ embed ] });
            return;
        } 
        
        // revoke old role if applicable
        let trOld = message.member.roles.cache.find(r => r.name.substr(0, 5) === "Icon_");
        if(trOld) message.member.roles.remove(trOld);
        
        // get user data
        let rName = `Icon_${toTitleCase(role).replace(/ /g,"")}`;
        let tr = message.guild.roles.cache.find(r => r.name === rName);
        
        // get role url
        let roleData = await getRoleDataFromName(role);
        
        if(tr) { // role found -> assign it
            message.member.roles.add(tr);
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, your role icon has been updated to ${toTitleCase(role)}.`, color: 5490704 };
            embed.thumbnail = { url: roleData.url };
            message.channel.send({ embeds: [ embed ] });
        } else {
            let dRole = await message.guild.roles.create({ name: rName, reason: "Automatic Token Role" });
            let hr = message.guild.roles.cache.find(r => r.name === "--- Token Role ---");
            await dRole.setPosition(hr ? hr.position - 2 : 0);
            await dRole.setIcon(roleData.url);
            await message.member.roles.add(dRole);
            let embed = { title: "Role Icon", description: `<@${message.member.id}>, your role icon has been set to ${toTitleCase(role)}.`, color: 5490704 };
            embed.thumbnail = { url: roleData.url };
            message.channel.send({ embeds: [ embed ] });
        }
    }
    
    
}
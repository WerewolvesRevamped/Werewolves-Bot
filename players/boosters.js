/**
	Boosters
*/
module.exports = function() {
    
    /**
    Command: $booster
    **/
    this.cmdBooster = async function(message, args) {
        if(!args[0]) { 
            cmdBoosterList(message);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) { 
			case "use": cmdBoosterUse(message, args); break;
			case "list": cmdBoosterList(message); break;
			case "active": cmdBoosterActive(message); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $booster list
    **/
    this.cmdBoosterList = async function(message) {
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", message.member.id);
        items = items.filter(el => el.item.substr(0, 3) === "bst").map(el => [el.count, el.item, ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no boosters
        if(items.length === 0) {
            let embed = { title: "Boosters", description: `<@${message.member.id}>, you do not have any boosters!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }

        // format item list
        let itemsTxt = [];
        for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][2][1]} x${items[i][0]} (\`${toTitleCase(items[i][1])}\`)`);
        let embed = { title: "Boosters", description: `Here is a list of boosters available for you, <@${message.member.id}>. You can use boosters by running \`${stats.prefix}booster use "<Booster Code>"\`, where you replace \`<Booster Code>\` with the code of the booster you want to use.\n\n` + itemsTxt.join("\n"), color: 8984857 };
        embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
        message.channel.send({ embeds: [ embed ] });
        
    }
    
    /**
    Command: $booster active
    **/
    this.cmdBoosterActive = async function(message) {
        let boosters = await sqlProm("SELECT * FROM active_boosters");
        boosters =  boosters.map(el => {
            let name = "";
            switch(el.type) {
                case "XP": name = `x${el.multiplier} XP Booster`; break;
                case "LUCK": name = `${luckBoosterNames[(+el.multiplier)-1]} Luck Booster`; break;
            }
            return `${name} - <@${el.creator}> - ${Math.floor((new Date((+el.end_time) * 1000) - new Date()) / 1000 / 60)}m left`
        });
        
        // no boosters
        if(boosters.length === 0) {
            let embed = { title: "Boosters", description: `There currently are no active boosters!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }

        // format item list
        let itemsTxt = [];
        let embed = { title: "Boosters", description: `Here is a list of currently active boosters.\n\n` + boosters.join("\n"), color: 8984857 };
        message.channel.send({ embeds: [ embed ] });
    }
        
    /**
    Command: $booster use
    **/
    this.luckBoosterNames = ["Slight", "Decent", "Significant"];
    this.luckBoosterNames2 = ["Slightly", "Decently", "Significantly"];
    this.cmdBoosterUse = async function(message, args) {
        if(!args[1]) { 
			message.channel.send("⛔ Syntax error. Not enough arguments!");
			return; 
		} 
        
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[1].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			message.channel.send("⛔ Command error. Not a valid item! Make sure to use the item code as specified in your inventory."); 
			return; 
		} 
        let code = item[0][0].toLowerCase();
        
        // get item count
        let count = await inventoryGetItem(message.author.id, code);
        if(count <= 0) {
			message.channel.send("⛔ Command error. Insufficient item count! Check your inventory to make sure you have this item."); 
			return; 
        }
        
        // update item count
        await inventoryModifyItem(message.author.id, code, -1);

        let cSplit = [code.substr(4,2), code.substr(6)], embed = null;
        switch(cSplit[0]) {
            case "xp": {
                let xpAdd = Math.ceil((+cSplit[1]) / XP_MULTIPLIER);
                await sqlPromEsc("UPDATE activity SET count=count+" + connection.escape(xpAdd) + " WHERE player=", message.author.id);
                embed = { title: "Boosters", description: `<@${message.member.id}>, you have used your booster to gain ${cSplit[1]} XP.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            case "gl": {
                let multiplier = cSplit[1].substr(0, 1).replace("x","10").replace("n","-1");
                let duration = + cSplit[1].substr(1);
                let endTime = Math.floor((+new Date()) / 1000) + duration * 60 * 60;
                await sqlProm("INSERT INTO active_boosters (multiplier, end_time, creator, type) VALUES (" + connection.escape(multiplier) + "," + connection.escape(endTime) + "," + connection.escape(message.author.id) + ",'XP')");
                embed = { title: "Boosters", description: `<@${message.member.id}>, you have activated a booster to multiply all gained XP by \`${multiplier}\` for the next \`${duration}\` hour(s) for everyone.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            case "lu": {
                let multiplier = + cSplit[1].substr(0, 1);
                let duration = + cSplit[1].substr(1);
                let endTime = Math.floor((+new Date()) / 1000) + duration * 60 * 60;
                await sqlProm("INSERT INTO active_boosters (multiplier, end_time, creator, type) VALUES (" + connection.escape(multiplier) + "," + connection.escape(endTime) + "," + connection.escape(message.author.id) + ",'LUCK')");
                embed = { title: "Boosters", description: `<@${message.member.id}>, you have activated a booster to improve everyones luck \`${luckBoosterNames2[multiplier-1].toLowerCase()}\` for the next \`${duration}\` hour(s).`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            default:
                message.channel.send("⛔ Booster error. Unknown booster type."); 
            break;
        }
    }
    
    /**
    Get booster multiplier
    **/
    this.getBoosterMultiplier = async function() {
        let nowTime = Math.floor((+new Date()) / 1000);
        await sqlPromEsc("DELETE FROM active_boosters WHERE end_time <", nowTime);
        
        let boosters = await sqlProm("SELECT multiplier FROM active_boosters WHERE type='XP'");
        let multiplier = 1;
        for(let i = 0; i < boosters.length; i++) {
            multiplier *= boosters[i].multiplier;
        }
        return multiplier;
    }
    
    /**
    Get booster luck
    **/
    this.getBoosterLuck = async function() {
        let nowTime = Math.floor((+new Date()) / 1000);
        await sqlPromEsc("DELETE FROM active_boosters WHERE end_time <", nowTime);
        
        let boosters = await sqlProm("SELECT multiplier FROM active_boosters WHERE type='LUCK'");
        let boost = 0;
        for(let i = 0; i < boosters.length; i++) {
            boost += boosters[i].multiplier;
        }
        return boost;
    }
    
    
}
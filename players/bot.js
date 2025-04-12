/**
Bot Commands
**/

module.exports = function() {
    
    /**
    Command: $bot
    To see your bot features
    */
	this.cmdBot = function(message, args) {
		// Check subcommand
		if(!args[0]) {
            cmdBotList(message);
			return;
		}

		// Check Subcommand
		switch(args[0]) {
			case "list": cmdBotList(message); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $bot list
    **/
    this.cmdBotList = async function(message) {
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", message.member.id);
        items = items.filter(el => el.item.substr(0, 3) === "bot").map(el => [el.count, el.item.split(":")[1], ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no bot features
        if(items.length === 0) {
            let embed = { title: "Bot Features", description: `<@${message.member.id}>, you do not have any bot features!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }
        
        if(items.length > 10) { // >10 items
            // format item list
            let items1 = [], items2 = [];
            let half = Math.ceil(items.length / 2);
            for(let i = 0; i < half; i++) items1.push(`• ${items[i][2][1]} ${items[i][0] > 1 ? '(x' + items[i][0] + ')' : ''}`);
            if(items.length > 1) for(let i = half; i < items.length; i++) items2.push(`• ${items[i][2][1]} ${items[i][0] > 1 ? '(x' + items[i][0] + ')' : ''}`);
            let embed = { title: "Bot Features", description: `Here is a list of bot features available for you, <@${message.member.id}>.`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        } else { // <=10 items
            // format item list
            let itemsTxt = [];
            for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][2][1]} ${items[i][0] > 1 ? '(x' + items[i][0] + ')' : ''}`);
            let embed = { title: "Bot Features", description: `Here is a list of bot features available for you, <@${message.member.id}>.\n\n` + itemsTxt.join("\n"), color: 8984857 };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            message.channel.send({ embeds: [ embed ] });
        }
        
    }
    
}
/**
	Guarantors
*/
module.exports = function() {
    
    /**
    Command: $guarantors
    **/
    this. cmdGuarantors = async function(message, args) {
        if(!args[0]) { 
            cmdGuarantorsList(message);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) { 
			case "list": cmdGuarantorsList(message.channel, message.author); break;
			case "get": if(checkGM(message)) cmdGuarantorsGet(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $guarantors list
    **/
    this.cmdGuarantorsList = async function(channel, author, mode = false) {
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", author.id);
        items = items.filter(el => el.item.substr(0, 2) === "al" || el.item.substr(0, 3) === "cat" || el.item.substr(0, 2) === "rt").map(el => [el.count, el.item, ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no boosters
        if(items.length === 0) {
            let embed = { title: "Guarantors", description: `You do not have any guarantors!`, color: 8984857 };
            channel.send({ embeds: [ embed ] });
            return;
        }

        // format item list
        let itemsTxt = [];
        for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][2][1]} x${items[i][0]} (\`${toTitleCase(items[i][1])}\`)`);
        let embed = { title: "Guarantors", description: !mode ? `Here is a list of guarantors available for you. You can use guarantors by running notifying Hosts during signup/game setup.` : `Here is a list of guarantors available for <@${author.id}>`, color: 8984857 };
        buildItemListEmbed(itemsTxt, embed);
        embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
        channel.send({ embeds: [ embed ] });
    }
    
    /**
    Command: $guarantors get
    **/
    this.cmdGuarantorsGet = async function(channel, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "guarantors get <player>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(args[1], channel);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        await cmdGuarantorsList(channel, channel.guild.members.cache.get(user), true);
    }
    
}
/**
	Trophies
*/
module.exports = function() {
    
    /**
    Command: $trophy
    **/
    this.cmdTrophy = async function(message, args) {
        if(!args[0]) { 
            cmdTrophyList(message);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) { 
			case "list": cmdTrophyList(message); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $trophy list
    **/
    this.cmdTrophyList = async function(message) {
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", message.member.id);
        items = items.filter(el => el.item.substr(0, 3) === "tro").map(el => [el.count, el.item, ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no curses
        if(items.length === 0) {
            let embed = { title: "Trophies", description: `<@${message.member.id}>, you do not have any trophies!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }

        // format item list
        let itemsTxt = [];
        for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][2][1]} x${items[i][0]} (\`${toTitleCase(items[i][1])}\`)`);
        let embed = { title: "Trophies", description: `Here is a list of your trophies, <@${message.member.id}>.`, color: 8984857 };
        buildItemListEmbed(itemsTxt, embed);
        embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
        message.channel.send({ embeds: [ embed ] });
        
    }

}
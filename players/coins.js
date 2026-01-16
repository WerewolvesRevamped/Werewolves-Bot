/**
Coins
**/

module.exports = function() {
    
    
    /**
    Command: $coins
    **/
    this.cmdCoins = async function(message, args) {// Check subcommand
		if(!args[0]) { 
			cmdCoinsGet(message.channel, [ "get", message.member.id ]);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) {
			case "get": if(checkGM(message)) cmdCoinsGet(message.channel, args); break;
			case "add": if(checkGM(message)) cmdCoinsModify(message.channel, args, "add", 1); break;
			case "remove": if(checkGM(message)) cmdCoinsModify(message.channel, args, "remove", -1); break;
			case "list": if(checkSafe(message)) cmdCoinsList(message.channel); break;
			case "reward": if(message.author.id === "1047268746277949600" || message.author.id === "1055202099400540222") cmdCoinsModify(message.channel, args, "reward", 1, true); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $coins add/remove
    **/
    this.cmdCoinsModify = async function(channel, args, type = "add", multiplier = 1, silent = false) {
		// Check arguments
		if(!args[1]) { 
			if(!silent) channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "coins " + type + " <player> <number>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(args[1], channel);
		if(!user) { 
			// Invalid user
			if(!silent) channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        // Get number
        let num = + args[2];
        if(!(num >= 0 && num <= 10000)) {
			// Invalid user
			if(!silent) channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid number!"); 
			return; 
        }
        num = num * multiplier;
        // increment numbers
        let coinCount = await sqlPromEsc("SELECT * FROM coins WHERE player=", user);
        // get max coin count
        let walUpgrades = await inventoryGetItem(user, "std:walup");
        let maxCoins = 500 + 50 * Math.min(walUpgrades, 10);
        if(coinCount.length === 0) {
            await sqlProm("INSERT INTO coins (player, coins) VALUES (" + connection.escape(user) + "," + connection.escape(num) + ")");
            if(!silent) channel.send(`✅ Updated <@${user}>'s coin count from \`0\` to \`${num}\`.`);
        } else if((coinCount[0].coins + num) > maxCoins) {
            await sqlPromEsc("UPDATE coins SET coins=" + connection.escape(maxCoins) + " WHERE player=", user);
            if(!silent) channel.send(`✅ Updated <@${user}>'s coin count from \`${coinCount[0].coins}\` to \`${maxCoins}\` [Max. Coins Reached].`);
        } else {
            await sqlPromEsc("UPDATE coins SET coins=" + connection.escape(coinCount[0].coins + num) + " WHERE player=", user);
            if(!silent) channel.send(`✅ Updated <@${user}>'s coin count from \`${coinCount[0].coins}\` to \`${coinCount[0].coins + num}\`.`);
        }
    }
    
    /**
    Command: $coins get
    **/
    this.cmdCoinsGet = async function(channel, args, self = true) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "coins get <player>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(args[1], channel);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        // get coin count
        let coinCount = await getCoins(user);
        if(self) {
            let embed = { title: "Coins", description: `<@${user}>, your current amount of coins is: \`${coinCount}\`.\n\nYou can use \`$loot\` to purchase and open a lootbox for \`100\` coins.`, color: 5490704 };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Extras/Token.png` };
            channel.send({ embeds: [ embed ] });
        } else {
            channel.send(`✅ <@${user}>'s coin count is \`${coinCount}\`.`);
        }
    }
    
    
    /**
    Command: $coins list
    **/
    this.cmdCoinsList = async function(channel) {
        
        let lb = await sqlProm("SELECT * FROM coins ORDER BY coins DESC, player DESC");
        
        let i = 1;
        let lbText = lb.map(el => `**#${i++}:** <@${''+el.player}> - ${el.coins}`);
        let chunked = chunkArray(lbText, 20);
        
        let embed = { title: "Coins List", color: 8984857, fields: [ ] };
        embed.fields = chunked.map(el => { return { name: "_ _", "value": el.join("\n"), inline: true }; });
        channel.send({ embeds: [ embed ] });
        
    }
    
    /**
    Modifies coins and returns the updated count amount
    **/
    this.modifyCoins = async function(user, num) {
        // increment numbers
        let coinCount = await sqlPromEsc("SELECT * FROM coins WHERE player=", user);
        if(coinCount.length === 0) {
            await sqlProm("INSERT INTO coins (player, coins) VALUES (" + connection.escape(user) + "," + connection.escape(num) + ")");
            return num;
        } else {
            await sqlPromEsc("UPDATE coins SET coins=" + connection.escape(coinCount[0].coins + num) + " WHERE player=", user);
            return coinCount[0].coins + num;
        }
    }
    
    /**
    Gets the current coin count
    **/
    this.getCoins = async function(user) {
        // increment numbers
        let coinCount = await sqlPromEsc("SELECT * FROM coins WHERE player=", user);
        return coinCount[0]?.coins ?? 0;
    }
    
}
/**
Inventory
**/

module.exports = function() {


    /**
    Command: $inventory
    **/
    this.cmdInventory = async function(message, args) {
        if(!args[0]) { 
            cmdInventorySee(message.channel, message.member.id);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) {
			case "see": cmdInventorySee(message.channel, message.member.id); break;
			case "get": if(checkGM(message)) cmdInventoryGet(message.channel, args); break;
            case "remove": if(checkGM(message)) cmdInventoryRemove(message.channel, args); break;
            case "add": if(checkGM(message)) cmdInventoryAdd(message.channel, args); break;
            case "transfer": 
                let transferPerms = await inventoryGetItem(message.author.id, "bot:invtransfer");
                if(transferPerms === 0) {
                    message.channel.send(`⛔ You have not unlocked the ${stats.prefix}inventory transfer command.`);
                    return;
                } 
                cmdInventoryTransfer(message.channel, message.author.id, args);
            break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }

    /**
    Command: $market
    **/
    this.cmdMarket = async function(message, args) {
        if(!args[0]) { 
            await marketClearOld(message.channel);
            cmdMarketSee(message.channel, message.member.id);
			return; 
		} 
        let marketPerms = await inventoryGetItem(message.author.id, "bot:market");
        if(marketPerms === 0 && args[0] != "see" && args[0] != "evaluate") {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}market command.`);
            return;
        } 
        // check outdated market items
        await marketClearOld(message.channel);
		// Check Subcommand
		switch(args[0]) {
			case "see": cmdMarketSee(message.channel, message.member.id); break;
            case "offer": cmdMarketOffer(message.channel, message.author.id, args); break;
            case "evaluate": cmdMarketEvaluate(message.channel, args); break;
            case "buy": cmdMarketBuy(message.channel, message.author, args); break;
            case "get": cmdMarketGet(message.channel, message.author, args); break;
            case "remove": cmdMarketRemove(message.channel, message.author, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $inventory get
    **/
    this.cmdInventoryGet = async function(channel, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "inventory get <player>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(channel, args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        await cmdInventorySee(channel, user);
    }
    
    /**
    Command: $inventory remove
    **/
    this.cmdInventoryRemove = async function(channel, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "inventory remove <player> <item>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(channel, args[1]);
        // Invalid user
		if(!user) { 
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[2].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			channel.send("⛔ Command error. `" + args[2] + "` is not a valid item!"); 
			return; 
		} 
        let code = item[0][0];
        
        // get item count
        let count = await inventoryGetItem(user, code);
        if(count <= 0) {
			channel.send("⛔ Command error. Insufficient item count!"); 
			return; 
        }
        
        // update item count
        let updatedCount = await inventoryModifyItem(user, code, -1);
        channel.send(`✅ Removed a ${item[0][1]} (${code}) from <@${user}>'s inventory. Count now is \`${updatedCount}\`.`);
    }
    
    /**
    Command: $inventory transfer
    **/
    this.cmdInventoryTransfer = async function(channel, authorid, args) {
        // Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "inventory transfer <player> <item>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(channel, args[1]);
        // Invalid user
		if(!user) { 
			channel.send("⛔ Syntax error. Not a valid player!"); 
			return; 
		} 
        
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[2].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			channel.send("⛔ Command error. Not a valid item! Make sure to use the item code as specified in your inventory."); 
			return; 
		} 
        let code = item[0][0];
        
        // get item count
        let count = await inventoryGetItem(authorid, code);
        if(count <= 0) {
			channel.send("⛔ Command error. Insufficient item count! Check your inventory to make sure you have this item."); 
			return; 
        }
        
        // update item count
        await inventoryModifyItem(authorid, code, -1);
        await inventoryModifyItem(user, code, 1);
        channel.send(`✅ Transfered a ${item[0][1]} (${code}) from <@${authorid}> to <@${user}>!`);
    }
    
    /**
    Command: $inventory add
    **/
    this.cmdInventoryAdd = async function(channel, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "inventory add <player> <item>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(channel, args[1]);
        // Invalid user
		if(!user) { 
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[2].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			channel.send("⛔ Command error. `" + args[2] + "` is not a valid item!"); 
			return; 
		} 
        let code = item[0][0];
        
        // update item count
        let updatedCount = await inventoryModifyItem(user, code, 1);
        channel.send(`✅ Added a ${item[0][1]} (${code}) to <@${user}>'s inventory. Count now is \`${updatedCount}\`.`);
    }
    
    /**
    Command: $inventory see
    **/
    this.cmdInventorySee = async function(channel, user) {
                
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", user);
        items = items.map(el => [el.count, el.item.toUpperCase(), ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no items
        if(items.length === 0) {
            let embed = { title: "Inventory", description: `<@${user}>, your inventory is currently empty!`, color: 8984857 };
            channel.send({ embeds: [ embed ] });
            return;
        }
        
        if(items.length > 10) { // >10 items
            // format item list
            let items1 = [], items2 = [];
            let half = Math.ceil(items.length / 2);
            for(let i = 0; i < half; i++) items1.push(`• ${items[i][2][1]} x${items[i][0]} (\`${items[i][1]}\`)`);
            if(items.length > 1) for(let i = half; i < items.length; i++) items2.push(`• ${items[i][2][1]} x${items[i][0]} (\`${items[i][1]}\`)`);
            let embed = { title: "Inventory", description: `<@${user}>, here is your current inventory:`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            channel.send({ embeds: [ embed ] });
        } else { // <=10 items
            // format item list
            let itemsTxt = [];
            for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][2][1]} x${items[i][0]} (\`${items[i][1]}\`)`);
            let embed = { title: "Inventory", description: `<@${user}>, here is your current inventory:\n\n` + itemsTxt.join("\n"), color: 8984857 };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
            channel.send({ embeds: [ embed ] });
        }
    }
    
    /**
    Command: $recycle
    **/
    this.cmdRecycle = async function(message, args) {
        let recPerms = await inventoryGetItem(message.author.id, "bot:recycle");
        if(recPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}recycle command.`);
            return;
        }
        if(!args[0]) {
            message.channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[0].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			message.channel.send("⛔ Command error. Not a valid item! Make sure to use the item code as specified in your inventory."); 
			return; 
		} 
        let code = item[0][0];
        
        // get item count
        let count = await inventoryGetItem(message.author.id, code);
        if(count <= 0) {
			message.channel.send("⛔ Command error. Insufficient item count! Check your inventory to make sure you have this item."); 
			return; 
        }
        
        // update item count
        await inventoryModifyItem(message.author.id, code, -1);
        
        let rand = Math.floor(Math.random() * 15);
        
        // determine coin value
        let val = Math.floor((( (tierCoins[tierNames.indexOf(item[0][2])] ?? 500) * (1 / (item[0][3] ?? 1)) ) + rand) / 2);
        // update coins
        cmdCoinsModify(message.channel, ["add", message.author.id, val], "add", 1, true);
        
        message.channel.send(`✅ Recycled ${item[0][1]} (${code.toUpperCase()}) for ${val} coins!`);
    }
    
    /**
    Command: $market evaluate
    **/
    this.cmdMarketEvaluate = async function(channel, args) {
        if(!args[1]) {
            channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[1].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			channel.send("⛔ Command error. Not a valid item! Make sure to use the item code as specified in your inventory."); 
			return; 
		} 
        let code = item[0][0];

        // determine coin value
        let val = Math.floor((( (tierCoins[tierNames.indexOf(item[0][2])] ?? 500) * (1 / (item[0][3] ?? 1)) ) + 7) / 2);

        channel.send(`✅ Evaluated ${code.toUpperCase()} to be worth ${val} coins!`);
    }
    
    /**
    Command: $market see
    **/
    this.cmdMarketSee = async function(channel, user) {
                
        let items = await sqlProm("SELECT * FROM market");
        items = items.map(el => [el.ai_id, el.price, `<@${el.owner}>`, el.item.toUpperCase(), ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no items
        if(items.length === 0) {
            let embed = { title: "Market", description: `There are currently no items on the market!`, color: 8984857 };
            channel.send({ embeds: [ embed ] });
            return;
        }
        
        if(items.length > 10) { // >10 items
            // format item list
            let items1 = [], items2 = [];
            let half = Math.ceil(items.length / 2);
            for(let i = 0; i < half; i++) items1.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            if(items.length > 1) for(let i = half; i < items.length; i++) items2.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            let embed = { title: "Market", description: `Here are the current items on the market. Use '$market buy <Offer ID>' to purchase an item.`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            channel.send({ embeds: [ embed ] });
        } else { // <=10 items
            // format item list
            let itemsTxt = [];
            for(let i = 0; i < items.length; i++) itemsTxt.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            let embed = { title: "Market", description: `Here are the current items on the market. Use '$market buy <Offer ID>' to purchase an item.\n\n` + itemsTxt.join("\n"), color: 8984857 };
            channel.send({ embeds: [ embed ] });
        }
    }
    
    /**
    Command: $market offer
    **/
    this.cmdMarketOffer = async function(channel, authorid, args) {
        // Check arguments
		if(!args[1] || !args[2]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "market offer <item> <price>`!"); 
			return; 
		}
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[1].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			channel.send("⛔ Command error. Not a valid item! Make sure to use the item code as specified in your inventory."); 
			return; 
		} 
        let code = item[0][0];
        
        // get item count
        let count = await inventoryGetItem(authorid, code);
        if(count <= 0) {
			channel.send("⛔ Command error. Insufficient item count! Check your inventory to make sure you have this item."); 
			return; 
        }
        
        let price = + args[2];
        if(price < 0 || price > 1000) {
			channel.send("⛔ Command error. Invalid item price."); 
			return; 
        }
        
        // update item count
        await inventoryModifyItem(authorid, code, -1);
        await marketAddItem(authorid, code, price);
        channel.send(`✅ Added ${item[0][1]} (${code.toUpperCase()}) to the market for ${price} coins!`);
    }
    
    /**
    Command: $market buy
    **/
    this.cmdMarketBuy = async function(channel, author, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "market buy <offer id>`!"); 
			return; 
		}
        
        // check offer id
        let offerId = + args[1];
        if(!(offerId >= 0 && offerId <= 1000000)) {
			channel.send("⛔ Command error. Not a valid offer id! Make sure to use the offer id as specified in the market."); 
            return;
        }
        
        // check offer
        let offer = await sqlPromEsc("SELECT * FROM market WHERE ai_id=", offerId);
        if(offer.length != 1) {
			channel.send("⛔ Command error. Not a valid offer id! Make sure to use the offer id as specified in the market."); 
			return; 
        }
        
        // check coins
        let price = + offer[0].price;
        let coins = await getCoins(author.id);
        if(price > coins) {
			channel.send("⛔ Command error. Insufficient coin count! You cannot afford to purchase this item."); 
			return; 
        }
            
        // modify coins
        await modifyCoins(author.id, -price);
        await modifyCoins(offer[0].owner, price);
        
        // modify items
        await inventoryModifyItem(author.id, offer[0].item, 1);
            
        // delete offer
        await sqlPromEsc("DELETE FROM market WHERE ai_id=", offerId);
        
        channel.send(`✅ Purchased ${offer[0].item.toUpperCase()} from <@${offer[0].owner}> for ${price} coins!`);
    }
    
    /**
    Command: $market remove
    **/
    this.cmdMarketRemove = async function(channel, author, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "market remove <offer id>`!"); 
			return; 
		}
        
        // check offer id
        let offerId = + args[1];
        if(!(offerId >= 0 && offerId <= 1000000)) {
			channel.send("⛔ Command error. Not a valid offer id! Make sure to use the offer id as specified in the market."); 
            return;
        }
        
        // check offer
        let offer = await sqlPromEsc("SELECT * FROM market WHERE ai_id=", offerId);
        if(offer.length != 1) {
			channel.send("⛔ Command error. Not a valid offer id! Make sure to use the offer id as specified in the market."); 
			return; 
        }
        
        if(offer[0].owner != author.id) {
			channel.send("⛔ Command error. This offer does not belong to you."); 
            return;
        }
            
        // readd item
        await inventoryModifyItem(author.id, offer[0].item, 1);
        
        // delete offer
        await sqlPromEsc("DELETE FROM market WHERE ai_id=", offerId);
        
        channel.send(`✅ Removed ${offer[0].item.toUpperCase()} from the market!`);
    }
    
    /**
    Modifies item count in inventory
    **/
    this.inventoryModifyItem = async function(pid, item, count) {
        item = item.toLowerCase();
        let itemCount = await sqlPromEsc("SELECT * FROM inventory WHERE item=" + connection.escape(item) + " AND player=", pid);
        if(itemCount.length === 0) {
            await sqlProm("INSERT INTO inventory (player, item, count) VALUES (" + connection.escape(pid) + "," + connection.escape(item) + "," + connection.escape(count) + ")");
            return count;
        } else {
            if(itemCount[0].count + count === 0) { // delete
                await sqlPromEsc("DELETE FROM inventory WHERE item=" + connection.escape(item) + " AND player=", pid);
                return 0;
            } else {
                await sqlPromEsc("UPDATE inventory SET count=" + connection.escape(itemCount[0].count + count) + " WHERE item=" + connection.escape(item) + " AND player=", pid);
                return itemCount[0].count + count;
            }
        }
    }
    
    /**
    Retrieves item count in inventory
    **/
    this.inventoryGetItem = async function(pid, item) {
        item = item.toLowerCase();
        let itemCount = await sqlPromEsc("SELECT * FROM inventory WHERE item=" + connection.escape(item) + " AND player=", pid);
        return itemCount[0]?.count ?? 0;
    }
    
    /**
    Retrieves item count in market
    **/
    this.marketGetItem = async function(pid, item) {
        item = item.toLowerCase();
        let offerCount = await sqlPromEsc("SELECT * FROM market WHERE item=" + connection.escape(code) + " AND owner=", pid);
        return offerCount.length ?? 0;
    }
    
    /** Add item to market
    **/
    this.marketAddItem = async function(pid, item, price) {
        let timestamp = xpGetTime();
        let day = 1440;
        let expiration = timestamp + (14 + (Math.floor(Math.sqrt(price)) * 5)) * day;
        await sqlProm("INSERT INTO market (item, price, owner, timestamp) VALUES (" + connection.escape(item.toLowerCase()) + "," + connection.escape(price) + "," + connection.escape(pid) + "," + connection.escape(expiration) + ")");
    }

    /**
    Market clear old
    **/
    this.marketClearOld = async function(channel) {
        let timestamp = xpGetTime();
        let toBeRemoved = await sqlPromEsc("SELECT * FROM market WHERE timestamp<=", timestamp);
        for(let i = 0; i < toBeRemoved.length; i++) {          
            // readd item
            await inventoryModifyItem(toBeRemoved[i].owner, toBeRemoved[i].item, 1);
            // delete offer
            await sqlPromEsc("DELETE FROM market WHERE ai_id=", toBeRemoved[i].ai_id);
            channel.send(`⏲️ <@${toBeRemoved[i].owner}>, your ${toBeRemoved[i].item.toUpperCase()} offer has expired. It has been removed from the market!`);
        }
    }
    
}
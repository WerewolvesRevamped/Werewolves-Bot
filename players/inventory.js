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
            case "eval": 
            case "evaluate": cmdMarketEvaluate(message.channel, args); break;
            case "buy": cmdMarketBuy(message.channel, message.author, args); break;
            case "get": cmdMarketGet(message.channel, message.author, args); break;
            case "rem":
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
		let user = parseUser(args[1], channel);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!"); 
			return; 
		} 
        await cmdInventorySee(channel, user, null);
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
		let user = parseUser(args[1], channel);
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
		let user = parseUser(args[1], channel);
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
		let user = parseUser(args[1], channel);
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
    this.cmdInventorySee = async function(channel, user, stash = false, returnEmbed = false) {
        let stashQ = "";
        if(stash !== null) stashQ = "stashed=" + (stash ? "1" : "0") + " AND ";
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE " + stashQ + "player=", user);
        items = items.map(el => [el.count, el.item.toUpperCase(), ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0], el.item.split(":")[0]]);
        items.sort((a, b) => a[3].localeCompare(b[3]));
        let itemsText = [];
        
        let itemsByType = { sp: [], ic: [], dm: [], bot: [], bst: [], gua: [], sp: []};
        for(let i = 0; i < items.length; i++) {
            let txt = `• ${items[i][2][1]} x${items[i][0]} (\`${items[i][1]}\`)`;
            switch(items[i][3]) {
                default:
                    itemsText.push(txt);
                break;
                case "sp":
                case "ic":
                case "dm":
                case "bot":
                case "bst":
                    itemsByType[items[i][3]].push(txt);
                break;
                case "al":
                case "cat":
                case "rt":
                    itemsByType["gua"].push(txt);
                break;
            }
        }
        
        let finalTxts = [];
        for(let typ in itemsByType) {
            if(itemsByType[typ].length > 5) {
                let typName = "Unknown";
                let typNameMap = { sp: "Skinpacks", ic: "Icons", dm: "Death Messages", bot: "Bot Features", bst: "Boosters", gua: "Guarantors", sp: "Skinpacks" };
                finalTxts.push(`• ${itemsByType[typ].length} ${typNameMap[typ]}`);
            } else {
                itemsText.push(...itemsByType[typ]);
            }
        }
        itemsText.push(...finalTxts);
        
        // no items
        let embed;
        if(items.length === 0) {
            embed = { title: "Inventory", description: `<@${user}>, your inventory is currently empty!`, color: 8984857 };
        } else {
            embed = { title: "Inventory", description: `<@${user}>, here is your current ${stash ? "stash" : "inventory"}:`, color: 8984857, thumbnail: { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` } };
            buildItemListEmbed(itemsText, embed);
        }
        
        if(returnEmbed) return embed;
        channel.send({ embeds: [ embed ] });
    }
    
    this.buildItemListEmbed = function(items, embed = {}, itemsPerColumn = 15) {
        // determine column amount
        let columns = Math.floor(items.length / 10) + 1;

        // split into even columns
        const chunkSize = Math.ceil(items.length / columns);
        const chunks = [];
        for (let i = 0; i < columns; i++) {
            chunks.push(items.slice(i * chunkSize, (i + 1) * chunkSize));
        }
       
        // add to embed
        if (columns === 1) {
            embed.description += `\n\n${items.join("\n")}`;
        } else {
            embed.fields = chunks.map(chunk => ({ name: "_ _", value: chunk.join("\n") || "_ _", inline: true }));
        }

        return embed;
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
        
        if(code.substr(0, 4).toLowerCase() === "spec") { 
			message.channel.send("⛔ Command error. Cannot recycle special type items."); 
			return;   
        }
        
        if(code.substr(0, 3).toLowerCase() === "tro") { 
			message.channel.send("⛔ Command error. Cannot recycle trophy type items."); 
			return;   
        }
        
        if(code.substr(0, 3).toLowerCase() === "unk") { 
			message.channel.send("⛔ Command error. Cannot recycle unknown type items."); 
			return;   
        }
        
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
        let coinsA = (tierCoins[tierNames.indexOf(item[0][2])] ?? 500);
        let val = Math.floor( (( coinsA * (1 / (item[0][3] ?? 1)) ) + coinsA + rand) / 8);
        
        // get recycle upgrades
        let recUpgrades = await inventoryGetItem(message.author.id, "std:recup");
        for(let i = 0; i < Math.min(recUpgrades, 5); i++) val += Math.ceil(Math.random() * 5);
        
        // update coins
        cmdCoinsModify(message.channel, ["add", message.author.id, val], "add", 1, true);
        
        message.channel.send(`✅ Recycled ${item[0][1]} (${code.toUpperCase()}) for ${val} coins!`);
    }
    
    /**
    Command: $stash
    **/
    this.cmdStash = async function(message, args) {
        let stashPerms = await inventoryGetItem(message.author.id, "bot:stash");
        if(stashPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}stash command.`);
            return;
        }
        if(!args[0]) {
            message.channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        
        if(args[0] === "list" || args[0] === "show") {
            let embed = await cmdInventorySee(message.channel, message.member.id, true, true);
            message.member.user.send({embeds: [ embed ]});
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
        await inventoryModifyItemVisibility(message.author.id, code, 1);
        
        message.channel.send("✅ Stashed!").then(m => m.delete());
    }
    
    /**
    Command: $unstash
    **/
    this.cmdUnstash = async function(message, args) {
        let stashPerms = await inventoryGetItem(message.author.id, "bot:stash");
        if(stashPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}unstash command.`);
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
        await inventoryModifyItemVisibility(message.author.id, code, 0);
        
        message.channel.send(`✅ Unstashed ${item[0][1]} (${code.toUpperCase()})!`);
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
        let coinsA = (tierCoins[tierNames.indexOf(item[0][2])] ?? 500);
        let val = Math.floor( (( coinsA * (1 / (item[0][3] ?? 1)) ) + coinsA + 7) / 8);

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
        
        if(items.length > 40) { // >40 items
            // format item list
            let items1 = [], items2 = [], items3 = [], items4 = [], items5 = [];
            let fifth = Math.ceil(items.length / 5);
            for(let i = 0; i < fifth; i++) items1.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = fifth; i < fifth * 2; i++) items2.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = fifth * 2; i < fifth * 3; i++) items3.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = fifth * 3; i < fifth * 4; i++) items4.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = fifth * 4; i < items.length; i++) items5.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            let embed = { title: "Market", description: `Here are the current items on the market. Use '$market buy <Offer ID>' to purchase an item.`, color: 8984857, fields: [ {}, {}, {}, {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.fields[2] = { name: "_ _", "value": items3.join("\n"), inline: true };
            embed.fields[3] = { name: "_ _", "value": items4.join("\n"), inline: true };
            embed.fields[4] = { name: "_ _", "value": items5.join("\n"), inline: true };
            channel.send({ embeds: [ embed ] });
        } else if(items.length > 30) { // >30 items
            // format item list
            let items1 = [], items2 = [], items3 = [], items4 = [];
            let quarter = Math.ceil(items.length / 4);
            for(let i = 0; i < quarter; i++) items1.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = quarter; i < quarter * 2; i++) items2.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = quarter * 2; i < quarter * 3; i++) items3.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = quarter * 3; i < items.length; i++) items4.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            let embed = { title: "Market", description: `Here are the current items on the market. Use '$market buy <Offer ID>' to purchase an item.`, color: 8984857, fields: [ {}, {}, {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.fields[2] = { name: "_ _", "value": items3.join("\n"), inline: true };
            embed.fields[3] = { name: "_ _", "value": items4.join("\n"), inline: true };
            channel.send({ embeds: [ embed ] });
        } else if(items.length > 20) { // >20 items
            // format item list
            let items1 = [], items2 = [], items3 = [];
            let third = Math.ceil(items.length / 3);
            for(let i = 0; i < third; i++) items1.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = third; i < third * 2; i++) items2.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = third * 2; i < items.length; i++) items3.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            let embed = { title: "Market", description: `Here are the current items on the market. Use '$market buy <Offer ID>' to purchase an item.`, color: 8984857, fields: [ {}, {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": items1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": items2.join("\n"), inline: true };
            embed.fields[2] = { name: "_ _", "value": items3.join("\n"), inline: true };
            channel.send({ embeds: [ embed ] });
        } else if(items.length > 10) { // >10 items
            // format item list
            let items1 = [], items2 = [];
            let half = Math.ceil(items.length / 2);
            for(let i = 0; i < half; i++) items1.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
            for(let i = half; i < items.length; i++) items2.push(`\`${items[i][0]}\` - ${items[i][4][1]} (${items[i][3]}) for ${items[i][1]} from ${items[i][2]}`);
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
        if(isNaN(price) || price < 0 || price > 1000) {
			channel.send("⛔ Command error. Invalid item price."); 
			return; 
        }
        
        // update item count
        await inventoryModifyItem(authorid, code, -1);
        await marketAddItem(authorid, code, price);
        channel.send(`✅ Added ${item[0][1]} (${code.toUpperCase()}) to the market for ${price} coins!`);
    }
    
    /**
    Command: $keep
    **/
    this.cmdKeep = async function(channel, authorid, args) {
        let keeping = await sqlProm("SELECT * FROM market WHERE owner=" + connection.escape(authorid));
        keeping = keeping.map(el => el.item.toLowerCase());
        let keepingCodes = keeping.map(el => el.split(":")[0]);
        
        // Check arguments
		if(!args[0]) { 
            if(keeping.length === 0) {
                channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "keep <item>`!"); 
                return; 
            } else {
                channel.send("ℹ️ You are currently keeping the following items:\n- " + keeping.map(el2 => ALL_LOOT.filter(el => el[0].toLowerCase() === el2.toLowerCase())[0][1] + " (" + el2.toUpperCase() + ")").join("\n- "));
                return;
            }
		}
        // Get item
        let item = ALL_LOOT.filter(el => el[0].toLowerCase() === args[0].toLowerCase());
        // Invalid item
		if(item.length != 1) { 
			channel.send("⛔ Command error. Not a valid item! Make sure to use the item code as specified in your inventory."); 
			return; 
		} 
        let code = item[0][0];
        
        if(keeping.includes(code.toLowerCase())) {
            // readd item
            await inventoryModifyItem(authorid, code, 1);
            // delete offer
            await sqlPromEsc("DELETE FROM market WHERE owner=" + connection.escape(authorid) + " AND item=", code);
            channel.send(`✅ Removed ${item[0][1]} (${code.toUpperCase()}) from the items you are keeping!`);
            return;
        }
        
        // get item count
        let count = await inventoryGetItem(authorid, code);
        if(count <= 0) {
			channel.send("⛔ Command error. Insufficient item count! Check your inventory to make sure you have this item."); 
			return; 
        }
        
        let codeType = code.split(":")[0].toLowerCase();
        let typeCount;
        
        switch(codeType) {
            default:
                channel.send("😭 Unfortunately items of this type are not eligible for keeping.");
                return;
            break;
            case "sp":
                typeCount = keepingCodes.filter(el => el === "sp").length;
                if(typeCount >= 3) {
                    channel.send("😭 You have already marked the maximum amount of skinpacks for keeping.");
                    return;
                }
            break;
            case "cat":
            case "rt":
            case "al":
                typeCount = keepingCodes.filter(el => el === "cat" || el === "rt" || el === "al").length;
                if(typeCount >= 3) {
                    channel.send("😭 You have already marked the maximum amount of guarantors for keeping.");
                    return;
                }
            break;
            case "ic":
                typeCount = keepingCodes.filter(el => el === "ic").length;
                if(typeCount >= 2) {
                    channel.send("😭 You have already marked the maximum amount of icons for keeping.");
                    return;
                }
            break;
            case "dm":
                typeCount = keepingCodes.filter(el => el === "dm").length;
                if(typeCount >= 2) {
                    channel.send("😭 You have already marked the maximum amount of death messages for keeping.");
                    return;
                }
            break;
        }
        
        // update item count
        await inventoryModifyItem(authorid, code, -1);
        let timestamp = xpGetTime();
        let day = 1440 / 12;
        let expiration = timestamp + 10000 * day;
        await sqlProm("INSERT INTO market (item, price, owner, timestamp) VALUES (" + connection.escape(code.toLowerCase()) + ",100000," + connection.escape(authorid) + "," + connection.escape(expiration) + ")");
        channel.send(`✅ Keeping ${item[0][1]} (${code.toUpperCase()})!`);
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
    Modifies item visibility in inventory
    **/
    this.inventoryModifyItemVisibility = async function(pid, item, visibility) {
        item = item.toLowerCase();
        await sqlPromEsc("UPDATE inventory SET stashed=" + connection.escape(visibility) + " WHERE item=" + connection.escape(item) + " AND player=", pid);
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
        let day = 1440 / 12;
        let expiration = timestamp + (7 + (Math.floor(Math.sqrt(price)) * 3)) * day;
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
/**
Loot Boxes
**/

module.exports = function() {

    let ALL_LOOT = [["SP:1","Glitch","Gold",1],["STD:RE","Reroll","Silver",1],["BOT:TEMP","$temp Command","Silver",1],["GM:Ts","Kill Ts","Platinum",0.5],["AL:Town","Townsfolk","Silver",1],["SP:2","Negate","Silver",2],["COIN:50","50 Coins","Bronze",1],["BOT:REV","$reverseme Command","Gold",],["GM:Eth","Demote Ethan","Gold",0.5],["AL:Wolf","Werewolves","Silver",1],["SP:3","Grayscale","Silver",2],["COIN:120","120 Coins","Silver",1],["BOT:SHIP","$newship Command","Platinum",1],["GM:Luf","Rename Luffy","Gold",0.5],["AL:UA","Unaligned","Gold",1],["SP:5","Emboss","Bronze",1],["COIN:160","160 Coins","Gold",1],["BOT:HATE","$newhate Command","Platinum",1],["GM:Krem","Turn Krem into a Little Bug","Gold",0.5],["AL:Solo","Solo","Gold",1],["SP:6","Silhouette","Silver",1],["STD:RE2","Reroll x2","Gold",0.5],["GM: Jay","Temp Jay into sinning","Platinum",0.5],["AL:Hell","Hell","Platinum",1],["SP:7","Pixel","Silver",1],["STD:BTNT","Be the next theme","Platinum",0.5],["GM:Kruth","Demote Kruthers","",],["AL:HM","Horseman","Platinum",0.5],["SP:9","Pixel #3","Silver",1],["STD:JOKE","Your own Joke Role","Platinum",0.5],["GM:Fish","Kill Mr. Fish","Silver",0.5],["AL:Pyro","Pyro","Platinum",1],["SP:12","Red","Bronze",2],["STD:X","Unlucky (Nothing)","Bronze",1],["GM:Arch","Demote Jean D. Arch","",],["AL:Flute","Flute","Platinum",1],["SP:13","Green","Bronze",2],["STD:RE3","Reroll x3","Platinum",0.5],["GM:Fed","Kill Federick","",],["AL:WWW","White Wolves","Platinum",0.5],["SP:14","Blue","Bronze",2],["GM:Ghost","Exorcise Gh0st","Silver",0.5],["AL:Plague","Plague","Platinum",0.5],["SP:15","Yellow","Bronze",2],["GM:Katy","Kill KatyHawk","",],["AL:UW","Underworld","Platinum",0.5],["SP:16","Purple","Bronze",2],["GM:Marten","Promote Marten","",],["AL:T/W","Townsfolk / Werewolves","Bronze",1],["SP:17","Cyan","Bronze",2],["GM:Turtle","Demote Mr. Turtle","",],["SP:18","Flip","Bronze",1],["GM:Stein","Take Steinator as a Hostage","Gold",0.5],["SP:20","BW","Bronze",1],["GM:Vera","Evict Vera","Platinum",0.5],["SP:21","Wire","Gold",2],["SP:24","Rainbow #2","Silver",1],["SP:25","Rainbow #3","Silver",1],["SP:26","Ts","Platinum",0.5],["SP:27","Oil","Gold",1],["SP:28","Wave","Silver",1],["SP:29","Swirl","Bronze",1],["SP:31","Cycle","Silver",0.5],["SP:32","Equalize","Bronze",1],["SP:33","Fourier Noise","Gold",1],["SP:35","Fourier Oil","Gold",1],["SP:36","Fourier Modulate","Platinum",1],["SP:37","Fourier Wire","Silver",0.5],["SP:38","Glitch #2","Gold",1],["SP:39","Eyes","Gold",1],["SP:40","Thief","",],["SP:41","Mask","Silver",1],["SP:42","Eye","Platinum",1],["SP:43","Fourier Eye","Platinum",0.5],["SP:44","Citizen Eye","Gold",0.5],["SP:45","Items","Gold",1]];

    /**
    Command: $loot
    **/
    let tierNames = ["Bronze", "Silver", "Gold","Platinum", "Cheated"];
    let tierColors = [9785610, 13027014, 14922018, 10877429, 15469740];
    let tierIcons = ["Extras/Token%20Bronze", "Extras/Token%20Silver", "Extras/Token", "Extras/Token%20Platinum", "Extras/Bot%20Developer"];
    let tierCoins = [10, 20, 50, 100, 0];
    this.cmdLoot = async function(message) {
        // check coins
        let coinCount = await getCoins(message.member.id);
        if(coinCount < 100) {
            let embed = { title: "Insufficient Coins", description: "You need to have at least `100` coins to open a loot box! You have: `" + coinCount + "`", color: 16715021 };
            embed.thumbnail = { url: `${iconRepoBaseUrl}Extras/Token%20Insufficient.png` };
            message.channel.send({ embeds: [ embed ] });
            return;
        }
        await modifyCoins(message.member.id, -100);
        
        // open box
        await openBox(message.channel, message.member.id);
    }
    
    /**
    Command: $loot_force
    **/
    this.cmdLootForce = async function(message, args) {
        if(!args[0]) {
            channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        // search for reward
        let reward = ALL_LOOT.filter(el => el[0].toLowerCase() === args[0].toLowerCase());
        if(reward.length != 1) {
            message.channel.send("⛔ Command error. Could not find reward!");
            return;
        }
        
        // open box
        openBox(message.channel, message.member.id, reward[0]);
    }
    
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
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "inventory get <player>`!"); 
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
    Command: $inventory add
    **/
    this.cmdInventoryAdd = async function(channel, args) {
        // Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "inventory get <player>`!"); 
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
            for(let i = 0; i < half; i++) items1.push(`• ${items[i][2][1]} x${items[i][0]}`);
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
    Open Loot Box
    **/
    async function openBox(channel, pid, overwrite = null) {
        let tierRand = Math.random();
        let tier = 0;
        if(tierRand >= 0.95) tier = 3;
        else if(tierRand >= 0.8) tier = 2;
        else if(tierRand >= 0.5) tier = 1;
        
        // filter out tier rewards
        let filteredRewards = ALL_LOOT.filter(el => el[2] === tierNames[tier]);
        let totalWeights = filteredRewards.map(el => el[3]).reduce((a,b) => a+b, 0);
        let lootRand = Math.random() * totalWeights;
        
        // find reward
        let acc = 0;
        let reward = null;
        for(let i = 0; i < filteredRewards.length; i++) {
            acc += filteredRewards[i][3];
            if(lootRand < acc) {
                reward = filteredRewards[i];
                break;
            }
        }
        
        // overwrite reward
        if(overwrite) {
            reward = overwrite;
            tier = 4;
        }
                
        // unlock reward
        let result = await unlockReward(channel, pid, reward);
        if(!result) {
            await modifyCoins(pid, tierCoins[tier]);
        }
        
        let embed = { title: "Lootbox opened!", description: `<@${pid}> opened a loot box and got a **${tierNames[tier].toUpperCase()}** tier reward!\n\n**__You won:__** ${rewardToText(reward)}` + (!result ? `\n\nYou already have this reward so as a consolation prize you get ${tierCoins[tier]} ${getEmoji('token')} coins.` : ""), color: tierColors[tier] };
        embed.thumbnail = { url: iconRepoBaseUrl + tierIcons[tier] + ".png?v=2" };
        embed.image = { url: `https://werewolves.me/images/${tierNames[tier]}.png?v=5` };
        channel.send({ embeds: [ embed ] });
        
        // log reward
        if(stats.reward_log) {
            let rl = mainGuild.channels.cache.get(stats.reward_log);
            rl.send(`<@${pid}> opened a **${tierNames[tier]}** loot box and got **${reward[0]}** (\`${reward[1]}\`).` + (!result ? ` [Consolation: ${tierCoins[tier]}]` : ""));
        }
    }
    
    /**
    Returns a rewards type
    **/
    function getRewardType(reward) {
        let typ = reward[0];
        return typ.split(":")[0].toLowerCase();
    }
    
    /**
    Returns a rewards id
    **/
    function getRewardID(reward) {
        let typ = reward[0];
        return typ.split(":")[1].toLowerCase();
    }
    
    /**
    Converts a reward to text
    **/
    function rewardToText(reward) {
        let id = getRewardID(reward);
        switch(getRewardType(reward)) {
            // SKINPACKS
            case "sp":
                id = +id;
                let code = AVAILABLE_PACKS[id - 1];
                let em = getEmoji("pack_" + code);
                return `The ${em} **${reward[1]}** ${em} skinpack. Use \`$packs select ${id}\` to select it.`;
            break;
            // STANDARD
            case "std":
                switch(reward[0].toLowerCase()) {
                    case "std:re": return "A free lootbox re-roll!";
                    case "std:re2": return "__Two__ free lootbox re-rolls!";
                    case "std:re3": return "__Three__ free lootbox re-rolls!";
                    case "std:x": return "Nothing! You got unlucky. 😭";
                    case "std:btnt": return "Be the next theme! (Some conditions apply). This voucher has been added to your inventory. Redeem by notifying GMs before a game is announced.";
                    case "std:joke": return "Get your own joke role! (Some conditions apply). This voucher has been added to your inventory. Redeem by notifying a GM.";
                    default: return `An unknown standard reward: ${reward[1]}.`;
                }
            break;
            // COIN
            case "coin":
                return `${id} coins. Use \`${stats.prefix}coins\` to check your coins.`;
            break;
            // GM
            case "gm":
                return `A special action: ${reward[1]}. This action has been added to your inventory. Redeem by notifying an Admin of your choice while there is no game.`;
            break;
            // AL
            case "al":
                return `An alignment guarantor for: ${reward[1]}. You may use this during the signup/setup phase of a game to pick your alignment. To do so DM one of the Hosts. You may __not__ let anyone know you used an alignment guarantor until after the game.`;
            break;
            // Bot
            case "bot":
                switch(reward[0].toLowerCase()) {
                    case "bot:temp": return `Access to the epic, amazing and ultra-exclusive ${stats.prefix}temp command. Give it a try!`;
                    case "bot:rev": return `Access to the ${stats.prefix}reverseme command. Spice up your nickname... by reversing it? Give it a try!`;
                    case "bot:ship": return `Access to the ${stats.prefix}newship command. Are you having trouble in your love life? WWR Bot is here to help with useful suggestions of potential ships. Give it a try!`;
                    case "bot:hate": return `Access to the ${stats.prefix}newhate command. Are you looking to get angry but don't know who to be mad at? WWR Bot will offer useful suggestions of who to pick a fight with. Give it a try!`;
                    default: return `An unknown bot reward: ${reward[1]}.`;
                }
            default:
                return `A reward of unknown type: ${reward[1]}.`;
            break;
        }
    }
    
    /**
    Unlocks a reward
    **/
    async function unlockReward(channel, pid, reward) {
        let id = getRewardID(reward);
        switch(getRewardType(reward)) {
            // SKINPACKS
            case "sp":
                id = +id;
                let pu = await sqlProm("SELECT * FROM pack_unlocks WHERE player=" + connection.escape(pid) + " AND pack=" + connection.escape(id));
                if(pu.length > 0) return false;
                await sqlProm("INSERT INTO pack_unlocks (player, pack) VALUES (" + connection.escape(pid) + "," + connection.escape(id) + ")");
                return true;
            break;
            // STANDARD
            case "std":
                switch(reward[0].toLowerCase()) {
                    case "std:re":
                        setTimeout(function() { openBox(channel, pid) }, 3000);
                        return true;
                    case "std:re2":
                        setTimeout(function() { openBox(channel, pid) }, 3000);
                        setTimeout(function() { openBox(channel, pid) }, 6000);
                        return true;
                    case "std:re3":
                        setTimeout(function() { openBox(channel, pid) }, 3000);
                        setTimeout(function() { openBox(channel, pid) }, 6000);
                        setTimeout(function() { openBox(channel, pid) }, 9000);
                        return true;
                   case "std:x":
                        return true;
                    case "std:btnt":
                    case "std:joke":
                        await inventoryModifyItem(pid, reward[0], 1);
                        return true;
                    default:
                        return false;
                }
            break;
            // COIN
            case "coin":
                id = +id;
                await modifyCoins(pid, id);
                return true;
            break;
            // GM / Alignment
            case "gm":
            case "al":
                await inventoryModifyItem(pid, reward[0], 1);
                return true;
            // BOT
            case "bot":
                let count = await inventoryModifyItem(pid, reward[0], 1);
                return count === 1;
            break;
            default:
                return true;
        }
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


}
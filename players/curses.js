/**
	Curses
*/
module.exports = function() {
    
    /**
    Command: $curse
    **/
    this.cmdCurse = async function(message, args) {
        if(!args[0]) { 
            cmdCurseList(message);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) { 
			case "use": cmdCurseUse(message, args); break;
			case "list": cmdCurseList(message); break;
			case "active": cmdCurseActive(message); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $curse list
    **/
    this.cmdCurseList = async function(message) {
        let items = await sqlPromEsc("SELECT * FROM inventory WHERE player=", message.member.id);
        items = items.filter(el => el.item.substr(0, 3) === "cur").map(el => [el.count, el.item, ALL_LOOT.filter(el2 => el2[0].toLowerCase() === el.item)[0]]);
        
        // no curses
        if(items.length === 0) {
            let embed = { title: "Curses", description: `<@${message.member.id}>, you do not have any curses!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }

        // format item list
        let itemsTxt = [];
        for(let i = 0; i < items.length; i++) itemsTxt.push(`• ${items[i][2][1]} x${items[i][0]} (\`${toTitleCase(items[i][1])}\`)`);
        let embed = { title: "Curses", description: `Here is a list of curses available for you, <@${message.member.id}>. You can use curses by running \`${stats.prefix}curse use "<Curse Code>" "<Target Name>"\`, where you replace \`<Curse Code>\` with the code of the curse you want to use and \`<Target Name>\` with the name of the target for the curse.`, color: 8984857 };
        buildItemListEmbed(itemsTxt, embed);
        embed.thumbnail = { url: `${iconRepoBaseUrl}Offbrand/Inventory.png` };
        message.channel.send({ embeds: [ embed ] });
        
    }
    
    /**
    Command: $curse active
    **/
    this.cmdCurseActive = async function(message) {
        let curses = await sqlPromEsc("SELECT * FROM curses WHERE target=", message.author.id);
        curses =  curses.map(el => {
            let name = "";
            switch(el.type) {
                case "pack": name = `Pack Curse`; break;
                case "icon": name = `Icon Curse`; break;
            }
            return `${name} from <@${el.owner}>. Expires <t:${el.time}:R>.`;
        });
        
        // no curses
        if(curses.length === 0) {
            let embed = { title: "Curses", description: `There currently are no active curses on you!`, color: 8984857 };
            message.channel.send({ embeds: [ embed ] });
            return;
        }

        let embed = { title: "Curses", description: `Here is a list of currently active curses on you.\n\n` + curses.join("\n"), color: 8984857 };
        message.channel.send({ embeds: [ embed ] });
    }
        
    /**
    Command: $curse use
    **/
    this.cmdCurseUse = async function(message, args) {
        if(!args[1] || !args[2]) { 
			message.channel.send("⛔ Syntax error. Not enough arguments!");
			return; 
		} 
        let targetUser = parseUser(args[2], message.channel);
        if(!targetUser) {
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!");
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
        
        let cSplit = [code.substr(4,4), code.substr(8)], embed = null;
        switch(cSplit[0]) {
            case "pack": {
                let ch = await checkCurse(targetUser, "pack");
                if(ch) {
                    embed = { title: "Curses", description: `<@${message.member.id}>, you cannot apply a pack curse to <@${targetUser}> as they already have an active pack curse.`, color: 16715021 };
                    message.channel.send({ embeds: [ embed ] });
                    return;
                }
                await inventoryModifyItem(message.author.id, code, -1);
                createPackCurse(message.author.id, targetUser, cSplit[1], 6 * 60);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your curse to apply ${toTitleCase(AVAILABLE_PACKS[cSplit[1]-1])} skinpack to <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            case "icon": {
                let ch = await checkCurse(targetUser, "icon");
                if(ch) {
                    embed = { title: "Curses", description: `<@${message.member.id}>, you cannot apply an icon curse to <@${targetUser}> as they already have an active icon curse.`, color: 16715021 };
                    message.channel.send({ embeds: [ embed ] });
                    return;
                }
                await inventoryModifyItem(message.author.id, code, -1);
                createIconCurse(message.author.id, targetUser, cSplit[1], 24 * 60);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your curse to apply ${toTitleCase(cSplit[1])} icon to <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            default:
                message.channel.send("⛔ Curse error. Unknown curse type."); 
            break;
        }
    }
    
    
    /**
    Create Curses
    **/
    this.createCurse = function(ownerId, type, target, data, durationMinutes) {
        return sqlProm("INSERT INTO curses (owner, type, target, data, time) VALUES (" + connection.escape(ownerId) + "," + connection.escape(type) + "," + connection.escape(target) + "," + connection.escape(data) + "," + connection.escape(getTime() + 60 * durationMinutes) + ")");
    }
    
    this.createPackCurse = async function(casterId, targetId, packId, durationMinutes) {
        // check if curse already exists
        let ch = await checkCurse(targetId, "pack");
        if(ch) return;
        // get current pack
        let curPack = await sqlPromOneEsc("SELECT pack FROM packs WHERE player=",  targetId);
        // update pack
        await sqlPromEsc("INSERT INTO packs (player, pack) VALUES (" + connection.escape(targetId) + "," + connection.escape(packId) + ") ON DUPLICATE KEY UPDATE pack=", packId);
        // create curse
        await createCurse(casterId, "pack", targetId, curPack?.pack ?? 0, durationMinutes);
        curseLog(`<@${casterId}> cast a **PACK** (${packId}) curse on <@${targetId}>`);
        cachePacks();
    }
    
    this.createIconCurse = async function(casterId, targetId, iconName, durationMinutes) {
        // check if curse already exists
        let ch = await checkCurse(targetId, "icon");
        if(ch) return;
        // get current icon
        let curIcon = getCurrentIcon(targetId);
        // update icon
        setIcon(mainGuild.members.cache.get(targetId), iconName);
        // create curse
        await createCurse(casterId, "icon", targetId, curIcon ?? "none", durationMinutes);
        curseLog(`<@${casterId}> cast an **ICON** (${iconName}) curse on <@${targetId}>`);
    }
    
    /**
    Check for Curses
    **/
    this.checkCurse = async function(target, type) {
        // get curses
        let curse = await sqlPromOneEsc("SELECT * FROM curses WHERE type=" + connection.escape(type) + " AND target=",  target);
        if(!curse) return null;
        else return curse;
    }
    
    /**
    Processes curses and revokes outdated ones
    **/
    this.processCurses = async function() {
        let cursesToRemove = await sqlPromEsc("SELECT * FROM curses WHERE time<=", getTime());
        await sqlPromEsc("DELETE FROM curses WHERE time<=", getTime());
        for(let i = 0; i < cursesToRemove.length; i++) {
            let curCurse = cursesToRemove[i];
            switch(curCurse.type) {
                case "pack":
                    await sqlPromEsc("INSERT INTO packs (player, pack) VALUES (" + connection.escape(curCurse.target) + "," + connection.escape(curCurse.data) + ") ON DUPLICATE KEY UPDATE pack=", curCurse.data);
                    curseLog(`**PACK** curse on <@${curCurse.target}> has expired.`);
                    cachePacks();
                break;
                case "icon":
                    let mem = mainGuild.members.cache.get(curCurse.target);
                    if(curCurse.data != "none") {
                        setIcon(mem, curCurse.data);
                    } else {
                        let tr = mem.roles.cache.find(r => r.name.substr(0, 5) === "Icon_");
                        mem.roles.remove(tr);
                    }
                    curseLog(`**ICON** curse on <@${curCurse.target}> has expired.`);
                break;
            }
        }
    }
    
    this.curseLog = function(log) {
        let ch = mainGuild.channels.cache.get(config.curse_log);
        if(ch) ch.send(log);
    }
    
    /**
    Curse Processor Creator
    regularly processes curses
    **/
    this.isRunningCurseProcessor = false;
    this.createCurseProcessor = function() {
        setInterval(async () => {
            if(isRunningCurseProcessor) return;
            isRunningCurseProcessor = true;
            await processCurses();
            isRunningCurseProcessor = false;
        }, 15 * 1000)
    }
    
    
    
}
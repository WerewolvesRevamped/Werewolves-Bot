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
                case "rage": name = `Rage Curse`; break;
                case "skul": name = `Skull Curse`; break;
                case "huhh": name = `Huh Curse`; break;
                case "cost": name = `Cost Curse`; break;
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
			message.channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!");
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
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your curse to apply ${cSplit[1]==0?"default":toTitleCase(AVAILABLE_PACKS[cSplit[1]-1])} skinpack to <@${targetUser}>.`, color: 5490704 };
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
            case "rage": {
                let ch = await checkCurse(targetUser, "rage");
                if(ch) {
                    embed = { title: "Curses", description: `<@${message.member.id}>, you cannot apply a rage curse to <@${targetUser}> as they already have an active rage curse.`, color: 16715021 };
                    message.channel.send({ embeds: [ embed ] });
                    return;
                }
                await inventoryModifyItem(message.author.id, code, -1);
                createCurse(message.author.id, "rage", targetUser, "", 24 * 60);
                curseLog(`<@${message.author.id}> cast a **RAGE** curse on <@${targetUser}>`);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your rage curse on <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            case "skul": {
                let ch = await checkCurse(targetUser, "skul");
                if(ch) {
                    embed = { title: "Curses", description: `<@${message.member.id}>, you cannot apply a skull curse to <@${targetUser}> as they already have an active skull curse.`, color: 16715021 };
                    message.channel.send({ embeds: [ embed ] });
                    return;
                }
                await inventoryModifyItem(message.author.id, code, -1);
                createCurse(message.author.id, "skul", targetUser, "", 6 * 60);
                curseLog(`<@${message.author.id}> cast a **SKULL** curse on <@${targetUser}>`);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your skull curse on <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            case "huh": {
                let ch = await checkCurse(targetUser, "huhh");
                if(ch) {
                    embed = { title: "Curses", description: `<@${message.member.id}>, you cannot apply a huh curse to <@${targetUser}> as they already have an active huh curse.`, color: 16715021 };
                    message.channel.send({ embeds: [ embed ] });
                    return;
                }
                await inventoryModifyItem(message.author.id, code, -1);
                createCurse(message.author.id, "huhh", targetUser, "", 24 * 60);
                curseLog(`<@${message.author.id}> cast a **HUH** curse on <@${targetUser}>`);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your huh curse on <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            case "cost": {
                let ch = await checkCurse(targetUser, "cost");
                if(ch) {
                    embed = { title: "Curses", description: `<@${message.member.id}>, you cannot apply a cost curse to <@${targetUser}> as they already have an active cost curse.`, color: 16715021 };
                    message.channel.send({ embeds: [ embed ] });
                    return;
                }
                await inventoryModifyItem(message.author.id, code, -1);
                createCurse(message.author.id, "cost", targetUser, "", 7 * 24 * 60);
                curseLog(`<@${message.author.id}> cast a **COST** curse on <@${targetUser}>`);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your cost curse on <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
            } break;
            case "xp": {
                await inventoryModifyItem(message.author.id, code, -1);
                curseLog(`<@${message.author.id}> cast a **XP** curse on <@${targetUser}>`);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your xp curse on <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
                await sqlPromEsc("UPDATE activity SET count=count-(level*10) WHERE player=", targetUser);
            } break;
            case "coin": {
                await inventoryModifyItem(message.author.id, code, -1);
                curseLog(`<@${message.author.id}> cast a **COIN** curse on <@${targetUser}>`);
                embed = { title: "Curses", description: `<@${message.member.id}>, you have used your coin curse on <@${targetUser}>.`, color: 5490704 };
                message.channel.send({ embeds: [ embed ] });
                await sqlPromEsc("UPDATE coins SET coins=coins-FLOOR(coins/10) WHERE player=", targetUser);
            } break;
            default:
                message.channel.send("⛔ Curse error. Unknown curse type."); 
            break;
        }
    }
    
    /**
    Rage Curse
    **/
    this.handleRageCurse = async function(message) {
        if(message.content.length < 20 || Math.random() >= 0.2) return;
        let ch = await checkCurse(message.author.id, "rage");
        if(ch) {
            let rageMessages = ["I disagree with your line of thinking because it's stupid.","That logic doesn't really hold up.","I don't think that makes sense.","You're missing something obvious here.","That's a very questionable conclusion.","I strongly doubt that's correct.","That's... an interesting take.","You might want to think that through again.","I'm not convinced you understand what you're saying.","That's just incorrect.","That's a dumb argument.","This makes no sense at all.","That's an impressively bad take.","That interpretation feels off.","That's not very convincing.","I don't think that works the way you think it does.","That's a strange way to look at it.","You lost me there.","I'm not sure that logic checks out.","That feels unnecessarily wrong.","I think you're overlooking the obvious.","That's a very questionable assumption.","I completely disagree because this makes no sense.","I don't know how you came up with this, but it's dumb.","This line of thinking is awful.","This makes absolutely no sense.","I can't take this seriously."];
            message.reply(rageMessages[Math.floor(Math.random() * rageMessages.length)]);
        }
    }
    
    /**
    Skull Curse
    **/
    this.handleSkullCurse = async function(message) {
        if(Math.random() < 0.5) return;
        let ch = await checkCurse(message.author.id, "skul");
        if(ch) {
            message.react("💀");
        }
    }
    
    /**
    Huh Curse
    **/
    this.handleHuhCurse = async function(message) {
        if(Math.random() < 0.9) return;
        let ch = await checkCurse(message.author.id, "huhh");
        if(ch) {
            message.react("🤨");
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
                case "rage":
                    curseLog(`**RAGE** curse on <@${curCurse.target}> has expired.`);
                break;
                case "skul":
                    curseLog(`**SKULL** curse on <@${curCurse.target}> has expired.`);
                break;
                case "huhh":
                    curseLog(`**HUH** curse on <@${curCurse.target}> has expired.`);
                break;
                case "cost":
                    curseLog(`**COST** curse on <@${curCurse.target}> has expired.`);
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
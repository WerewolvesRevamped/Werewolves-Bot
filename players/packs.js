/**
Skin Packs
**/

module.exports = function() {

    /**
    Command: $packs
    Sets a players skin packs
    */
	this.cmdPacks = function(message, args) {
		// Check subcommand
		if(!args[0]) {
            cmdPacksList(message.channel, message.author);
			return;
		}

		// Check Subcommand
		switch(args[0]) {
			case "list": cmdPacksList(message.channel, message.author); break;
			case "select": cmdPacksSelect(message.channel, message.author, args); break;
			case "list_all": if(checkSafe(message)) cmdPacksListAll(message.channel); break;
			case "set": if(checkGM(message)) cmdPacksSet(message.channel, args); break;
			case "unlock": if(checkGM(message)) cmdPacksUnlock(message.channel, args); break;
			case "delete": if(checkGM(message)) cmdPacksDelete(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}

    /**
    Command: $packs list_all
    **/
    this.AVAILABLE_PACKS = ["glitch","negate","grayscale","edge","emboss","silhouette","pixel","pixel2","pixel3","pixel4","scatter","red","green","blue","yellow","purple","cyan","flip","pale","bw","wire","wire2","rainbow","rainbow2","rainbow3","ts","oil","wave","swirl","noise","cycle","equalize","fourier_noise","fourier_equalize","fourier_oil","fourier_modulate","fourier_wire","glitch2","eyes","thief","mask","eye","fourier_eye","citizen_eye","items","bear","wolfify","grid","light_and_shadow","duo_color","wood","coin","coin_animated", "glitch_animated","wave_animated","spin","rainbow_animated","fourier_merge","fourier_magnitude","fourier_phase","fourier_crop","fourier_crop2","cloud","swirl_animated","pokemon","minecraft", "vowels"];
    this.ANIMATED_PACKS = [53, 54, 55, 56, 57, 63, 64];
    this.cmdPacksListAll = function(channel) {
        let packs1 = [`${getEmoji('pack_default')} Default - 0`], packs2 = [], packs3 = [], packs4 = [], packs5 = [], packs6 = [];
        let sixth = Math.ceil(AVAILABLE_PACKS.length / 6);
        for(let i = 0; i < sixth; i++) packs1.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        for(let i = sixth ; i < sixth * 2; i++) packs2.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        for(let i = sixth * 2; i < sixth * 3; i++) packs3.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        for(let i = sixth * 3; i < sixth * 4; i++) packs4.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        for(let i = sixth * 4; i < sixth * 5; i++) packs5.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        for(let i = sixth * 5; i < AVAILABLE_PACKS.length; i++) packs6.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        let embed = { title: "All Packs", color: 8984857, fields: [ {}, {}, {}, {}, {}, {} ] };
        embed.fields[0] = { name: "_ _", "value": packs1.join("\n"), inline: true };
        embed.fields[1] = { name: "_ _", "value": packs2.join("\n"), inline: true };
        embed.fields[2] = { name: "_ _", "value": packs3.join("\n"), inline: true };
        embed.fields[3] = { name: "_ _", "value": packs4.join("\n"), inline: true };
        embed.fields[4] = { name: "_ _", "value": packs5.join("\n"), inline: true };
        embed.fields[5] = { name: "_ _", "value": packs6.join("\n"), inline: true };
        channel.send({ embeds: [ embed ] });
    }

    /**
    Command: $packs list
    **/
    this.cmdPacksList = async function(channel, author) {
        let unlockedPacks = await sqlPromEsc("SELECT * FROM inventory WHERE player=", author.id);
        unlockedPacks = unlockedPacks.filter(el => el.item.substr(0, 3) === "sp:").map(el => [el.item.split(":")[1], AVAILABLE_PACKS[(+el.item.split(":")[1])-1], el.count]);
        unlockedPacks = unlockedPacks.sort((a,b) => a[0] - b[0]); 
        if(unlockedPacks.length < 40) {
            let packs1 = [`${getEmoji('pack_default')} Default - 0`], packs2 = [];
            let half = Math.ceil(unlockedPacks.length / 2);
            for(let i = 0; i < half; i++) packs1.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]} ${unlockedPacks[i][2] > 1 ? '(x' + unlockedPacks[i][2] + ')' : ''}`);
            if(unlockedPacks.length > 1) for(let i = half; i < unlockedPacks.length; i++) packs2.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]} ${unlockedPacks[i][2] > 1 ? '(x' + unlockedPacks[i][2] + ')' : ''}`);
            let embed = { title: "Available Packs", description: `<@${author.id}>, here is a list of skinpacks available for you. You can switch skinpack by running \`${stats.prefix}packs select <ID>\`, where you replace \`<ID>\` with the __number__ of the skinpack you want to select.`, color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": packs1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": packs2.join("\n"), inline: true };
            channel.send({ embeds: [ embed ] });
        } else {
            let packs1 = [`${getEmoji('pack_default')} Default - 0`], packs2 = [], packs3 = [];
            let third = Math.ceil(unlockedPacks.length / 3);
            for(let i = 0; i < third; i++) packs1.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]} ${unlockedPacks[i][2] > 1 ? '(x' + unlockedPacks[i][2] + ')' : ''}`);
            for(let i = third; i < third * 2; i++) packs2.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]} ${unlockedPacks[i][2] > 1 ? '(x' + unlockedPacks[i][2] + ')' : ''}`);
            for(let i = third * 2; i < unlockedPacks.length; i++) packs3.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]} ${unlockedPacks[i][2] > 1 ? '(x' + unlockedPacks[i][2] + ')' : ''}`);
            let embed = { title: "Available Packs", description: `<@${author.id}>, here is a list of skinpacks available for you. You can switch skinpack by running \`${stats.prefix}packs select <ID>\`, where you replace \`<ID>\` with the __number__ of the skinpack you want to select.`, color: 8984857, fields: [ {}, {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": packs1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": packs2.join("\n"), inline: true };
            embed.fields[2] = { name: "_ _", "value": packs3.join("\n"), inline: true };
            channel.send({ embeds: [ embed ] });
        }
    }


    /**
    Command: $packs set
    **/
    this.cmdPacksSet = async function(channel, args) {
        if(!args[1] || !args[2]) {
            channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        let user = parseUser(channel, args[1]);
        if(!user) {
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!");
			return;
		}
        let num = + args[2];
        if(num >= 0 && num <= AVAILABLE_PACKS.length) {
            // set packs
            await sqlPromEsc("INSERT INTO packs (player, pack) VALUES (" + connection.escape(user) + "," + connection.escape(num) + ") ON DUPLICATE KEY UPDATE pack=", num);
            await cachePacks();
            if(num > 0) channel.send(`✅ Updated <@${user}>'s skinpack to \`${num}\` (${toTitleCase(AVAILABLE_PACKS[num-1])}).`);
            else channel.send(`✅ Disabled skinpack for <@${user}>.`);
        } else {
			// Invalid pack
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid pack!");
			return;
        }
    }

    /**
    Command: $packs unlock
    **/
    this.cmdPacksUnlock = async function(channel, args) {
        if(!args[1] || !args[2]) {
            channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        let user = parseUser(channel, args[1]);
        if(!user) {
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!");
			return;
		}
        let num = + args[2];
        if(num > 0 && num <= AVAILABLE_PACKS.length) {
            // set packs
            let spPerms = await inventoryGetItem(user, "sp:" + num);
            if(spPerms != 0) {
                channel.send("⛔ Command error. `" + args[2] + "` is already unlocked!");
                return;
            }
            await sqlProm("INSERT INTO inventory (player, item, count) VALUES (" + connection.escape(user) + "," + connection.escape("sp:" + num) + ",1)");
            await cachePacks();
            channel.send(`✅ Unlocked skinpack \`${num}\` (${toTitleCase(AVAILABLE_PACKS[num-1])}) for <@${user}>.`);
        } else {
			// Invalid pack
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid pack!");
			return;
        }
    }
    
    /**
    Command: $packs delete
    **/
    this.cmdPacksDelete = async function(channel, args) {
        if(!args[1] || !args[2]) {
            channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        let user = parseUser(channel, args[1]);
        if(!user) {
			// Invalid user
			channel.send("⛔ Syntax error. `" + args[1] + "` is not a valid player!");
			return;
		}
        let num = + args[2];
        if(num > 0 && num <= AVAILABLE_PACKS.length) {
            // set packs
            await sqlProm("DELETE FROM inventory WHERE player=" + connection.escape(user) + " AND item=" + connection.escape("sp:" + num));
            await cachePacks();
            channel.send(`✅ Deleted skinpack \`${num}\` (${toTitleCase(AVAILABLE_PACKS[num-1])}) for <@${user}>.`);
        } else {
			// Invalid pack
			channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid pack!");
			return;
        }
    }

    /**
    Command: $packs select
    **/
    this.cmdPacksSelect = async function(channel, author, args) {
        if(!args[1]) {
            channel.send("⛔ Syntax error. Not enough parameters!");
            return;
        }
        let user = parseUser(channel, author.id);
        if(!user) {
			// Invalid user
			channel.send("⛔ Syntax error. `" + author.id + "` is not a valid player!");
			return;
		}
        let num = + args[1];
        if(num >= 0 && num <= AVAILABLE_PACKS.length) {
            let spPerms = await inventoryGetItem(author.id, "sp:" + num);
            if(num === 0 || spPerms != 0) {
                // set packs
                await sqlPromEsc("INSERT INTO packs (player, pack) VALUES (" + connection.escape(user) + "," + connection.escape(num) + ") ON DUPLICATE KEY UPDATE pack=", num);
                await cachePacks();
                if(num > 0) {
                    let embed = { title: "Skinpack Updated", description: `Updated <@${user}>'s skinpack to \`${num}\` (${toTitleCase(AVAILABLE_PACKS[num-1])}). You can disable the skinpack by running \`${stats.prefix}packs select 0\`.`, color: 5490704 };
                    embed.thumbnail = { url: skinpackUrl(AVAILABLE_PACKS[num-1]) + "Werewolf/Miscellaneous/Wolf.png" };
                    channel.send({ embeds: [ embed ] });
                    // get pack lut (if necessary)
                    cachePackLUT(AVAILABLE_PACKS[num-1]);
                } else {
                    let embed = { title: "Skinpack Disabled", description: `Disabled skinpack for <@${user}>.`, color: 16715021 };
                    embed.thumbnail = { url: skinpackUrl("default") + "Werewolf/Miscellaneous/Wolf.png" };
                    channel.send({ embeds: [ embed ] });
                }
            } else {
                let embed = { title: "Skinpack Unavailable", description: "Pack `" + args[1] + "` is not available to you.", color: 16715021 };
                channel.send({ embeds: [ embed ] });
            }
        } else {
			// Invalid pack
            let embed = { title: "Skinpack Unavailable", description: "Pack `" + args[1] + "` does not exist.", color: 16715021 };
            channel.send({ embeds: [ embed ] });
			return;
        }
    }

    /**
    Cache packs
    **/
    this.packCache = [];
    this.cachePacks = async function() {
        let packs = await sqlProm("SELECT * FROM packs");
        packCache = packs.map(el => [el.player, + el.pack]);
        packs.forEach(el => cachePackURLLUT(AVAILABLE_PACKS[(+el.pack) - 1]));
    }

    /**
    Get skin pack
    **/
    this.getPack = function(id) {
        let res = packCache.find(el => el[0] == id);
        if(!res) return 0;
        else return res[1];
    }
    
    /**
    Get Icon Base Url
    **/
    this.iconBaseUrl = function(id, name = false) {
        if(!id) return iconRepoBaseUrl;
        let pack = getPack(id);
        let pName = AVAILABLE_PACKS[pack - 1];
        let urlLUT = getPackURLLUT(pName);
        if(pack === 0) {
            return iconRepoBaseUrl;
        } else if(ANIMATED_PACKS.includes(pack)) {
            let url = skinpackUrl(pName);
            return url.replace(/\.php/, ".gif");
        } else if(urlLUT && urlLUT.length > 0) {
            if(!name) return iconRepoBaseUrl;
            let filtered = urlLUT.filter(el => el[0] == name.toLowerCase());
            if(filtered.length === 1) {
                return filtered[0][1];
            } else {
                return skinpackUrl(pName);
            }
        } else {
            return skinpackUrl(pName);
        }
    }
    
    this.isUrlPack = function(id, name) {
        if(!id) return false;
        let pack = getPack(id);
        let pName = AVAILABLE_PACKS[pack - 1];
        let urlLUT = getPackURLLUT(pName);
        if(urlLUT && urlLUT.length > 0 && name) {
            let filtered = urlLUT.filter(el => el[0] == name.toLowerCase());
            if(filtered.length === 1) {
                return true;
            } else {
                return false;
            }
        }
    }
    
    /**
    Apply Pack LUT
    **/
    this.applyPackLUT = async function(txt, id) {
        if(!id) return txt;
        let pack = getPack(id);
        if(pack === 0) {
            return txt;
        } else {
            let pName = AVAILABLE_PACKS[pack - 1];
            if(pName === stats.theme) return txt; // do not apply pack theme, if it matches normal theme
            let lut = await getPackLUT(pName);
            for(let i = 0; i < lut.length; i++) {
                if(lut[i][0].length > 1) {
                    txt = txt.replace(new RegExp("(?<!\\<\\?|[a-zA-Z])" + lut[i][0] + "(?!\\:\\>|[a-rt-zA-Z])", 'g'), lut[i][1]);
                } else {
                    txt = txt.replace(new RegExp("(?<!\\<\\?)" + lut[i][0] + "(?!\\:\\>)", 'g'), lut[i][1]);
                }
            }
            return txt;
        }
    }
    
    /**
    Cache Pack LUT
    **/
    this.packLUTs = {}
    this.cachePackLUT = async function(pack) {
        let url = `${themePackBase}${pack}.csv`;
        let urlExists = await checkUrlExists(url);
        if(urlExists) {
            const body = await fetchBody(url);
            if(body) {
                packLUTs[pack] = [];
                body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => packLUTs[pack].push([el[0] ?? "-", (el[1] ?? "").trim()]) );
                body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => packLUTs[pack].push([(el[0] ?? "-").toLowerCase(), ((el[1] ?? "").trim()).toLowerCase()]) );
                console.log(`Cached ${pack} pack LUT`);
            }
        } else {
            packLUTs[pack] = true;
        }
    }
    
    /**
    Returns a Pack LUT (caching it if necessary)
    **/
    this.getPackLUT = async function(pack) {
        if(packLUTs[pack] && packLUTs[pack] === true) {
            return [];
        } else if(packLUTs[pack]) {
            return packLUTs[pack];
        } else {
            await cachePackLUT(pack);
            return await getPackLUT(pack);
        }
    }
    
    /**
    Cache Pack URL LUT
    **/
    this.packURLLUTs = {}
    this.cachePackURLLUT = async function(pack) {
        let url = `${urlPackBase}${pack}.csv`;
        let urlExists = await checkUrlExists(url);
        if(urlExists) {
            const body = await fetchBody(url);
            if(body) {
                packURLLUTs[pack] = [];
                body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => packURLLUTs[pack].push([el[0] ?? "-", (el[1] ?? "").trim()]) );
                body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => packURLLUTs[pack].push([(el[0] ?? "-").toLowerCase(), ((el[1] ?? "").trim())]) );
                console.log(`Cached ${pack} pack URL LUT`);
            }
        } else {
            packURLLUTs[pack] = true;
        }
    }
    
    /**
    Returns a Pack URL LUT (caching it if necessary)
    **/
    this.getPackURLLUT = function(pack) {
        if(packURLLUTs[pack] && packURLLUTs[pack] === true) {
            return [];
        } else if(packURLLUTs[pack]) {
            return packURLLUTs[pack];
        } else {
            cachePackURLLUT(pack);
            return [];
        }
    }
    


}
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
            message.channel.send("⛔ Syntax error. Not enough parameters!");
			return;
		}

		// Check Subcommand
		switch(args[0]) {
			case "list": cmdPacksList(message.channel, message.author); break;
			case "select": cmdPacksSelect(message.channel, message.author, args); break;
			case "list_all": if(checkGM(message)) cmdPacksListAll(message.channel); break;
			case "set": if(checkGM(message)) cmdPacksSet(message.channel, args); break;
			case "unlock": if(checkAdmin(message)) cmdPacksUnlock(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}

    /**
    Command: $packs list_all
    **/
    this.AVAILABLE_PACKS = ["glitch","negate","grayscale","edge","emboss","silhouette","pixel","pixel2","pixel3","pixel4","scatter","red","green","blue","yellow","purple","cyan","flip","pale","bw","wire","wire2","rainbow","rainbow2","rainbow3","ts","oil","wave","swirl","noise","cycle","equalize","fourier_noise","fourier_equalize","fourier_oil","fourier_modulate","fourier_wire","glitch2","eyes","thief","mask","eye","fourier_eye","citizen_eye","items"];
    this.cmdPacksListAll = function(channel) {
        let packs1 = [`${getEmoji('pack_default')} Default - 0`], packs2 = [], packs3 = [];
        let third = Math.ceil(AVAILABLE_PACKS.length / 3);
        for(let i = 0; i < third; i++) packs1.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        for(let i = third ; i < third * 2; i++) packs2.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        for(let i = (third * 2); i < AVAILABLE_PACKS.length; i++) packs3.push(`${getEmoji('pack_'+AVAILABLE_PACKS[i])} ${toTitleCase(AVAILABLE_PACKS[i])} - ${i+1}`);
        let embed = { title: "All Packs", color: 8984857, fields: [ {}, {}, {} ] };
        //embed.thumbnail = { url: "https://werewolves.me/cards/skinpack.php?pack=default&src=Werewolf/Miscellaneous/Wolf.png" };
        embed.fields[0] = { name: "_ _", "value": packs1.join("\n"), inline: true };
        embed.fields[1] = { name: "_ _", "value": packs2.join("\n"), inline: true };
        embed.fields[2] = { name: "_ _", "value": packs3.join("\n"), inline: true };
        channel.send({ embeds: [ embed ] });
    }

    /**
    Command: $packs list
    **/
    this.cmdPacksList = async function(channel, author) {
        let unlockedPacks = await sqlPromEsc("SELECT pack FROM pack_unlocks WHERE player=", author.id);
        unlockedPacks = unlockedPacks.map(el => [el.pack, AVAILABLE_PACKS[(+el.pack)-1]]);
        unlockedPacks = unlockedPacks.sort((a,b) => a[0] - b[0]); 
        console.log(unlockedPacks);
        if(unlockedPacks.length < 40) {
            let packs1 = [`${getEmoji('pack_default')} Default - 0`], packs2 = [];
            let half = Math.ceil(unlockedPacks.length / 2);
            for(let i = 0; i < half; i++) packs1.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]}`);
            if(unlockedPacks.length > 1) for(let i = half; i < unlockedPacks.length; i++) packs2.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]}`);
            let embed = { title: "Available Packs", description: "Here is a list of skinpacks available for you. You can switch skinpack by running `" + stats.prefix + "packs select <ID>`, where you replace <ID> with the __number__ of the skinpack you want to select.", color: 8984857, fields: [ {}, {} ] };
            embed.fields[0] = { name: "_ _", "value": packs1.join("\n"), inline: true };
            embed.fields[1] = { name: "_ _", "value": packs2.join("\n"), inline: true };
            channel.send({ embeds: [ embed ] });
        } else {
            let packs1 = [`${getEmoji('pack_default')} Default - 0`], packs2 = [], packs3 = [];
            let third = Math.ceil(unlockedPacks.length / 3);
            for(let i = 0; i < third; i++) packs1.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]}`);
            for(let i = third; i < third * 2; i++) packs2.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]}`);
            for(let i = third * 2; i < unlockedPacks.length; i++) packs3.push(`${getEmoji('pack_'+unlockedPacks[i][1])} ${toTitleCase(unlockedPacks[i][1])} - ${unlockedPacks[i][0]}`);
            let embed = { title: "Available Packs", description: "Here is a list of skinpacks available for you. You can switch skinpack by running `" + stats.prefix + "packs select <ID>`, where you replace <ID> with the __number__ of the skinpack you want to select.", color: 8984857, fields: [ {}, {}, {} ] };
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
            await sqlProm("INSERT INTO pack_unlocks (player, pack) VALUES (" + connection.escape(user) + "," + connection.escape(num) + ")");
            await cachePacks();
            channel.send(`✅ Unlocked skinpack to \`${num}\` (${toTitleCase(AVAILABLE_PACKS[num-1])}) for <@${user}>.`);
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
            let packUnlockStatus = await sqlPromOneEsc("SELECT * FROM pack_unlocks WHERE player=" + connection.escape(author.id) + " AND pack=", num);
            if(num === 0 || packUnlockStatus) {
                // set packs
                await sqlPromEsc("INSERT INTO packs (player, pack) VALUES (" + connection.escape(user) + "," + connection.escape(num) + ") ON DUPLICATE KEY UPDATE pack=", num);
                await cachePacks();
                if(num > 0) {
                    let embed = { title: "Skinpack Updated", description: `Updated <@${user}>'s skinpack to \`${num}\` (${toTitleCase(AVAILABLE_PACKS[num-1])}). You can disable the skinpack by running \`${stats.prefix}packs select 0\`.`, color: 5490704 };
                    embed.thumbnail = { url: skinpackUrl(AVAILABLE_PACKS[num-1]) + "Werewolf/Miscellaneous/Wolf.png" };
                    channel.send({ embeds: [ embed ] });
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
    }

    /**
    Get skin pack
    **/
    this.getPack = function(id) {
        let res = packCache.find(el => el[0] == id);
        if(!res) return 0;
        else return res[1];
    }

}
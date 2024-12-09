/**
Skin Packs
**/

module.exports = function() {
        
    /**
    Command: $packs
    Sets a players skin packs
    */
	this.cmdPacks = function(channel, author, args) {
		// Check subcommand
		if(!args[0]) { 
            channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
        
		// Check Subcommand
		switch(args[0]) {
			case "list": cmdPacksList(channel); break;
			case "set": cmdPacksSet(channel, args); break;
			case "select": cmdPacksSet(channel, [ "set", author.id, args[1] ] ); break;
			default: channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $packs list
    **/
    this.AVAILABLE_PACKS = ["glitch","negate","grayscale","edge","emboss","black","pixel","pixel2","pixel3","pixel4","scatter","red","green","blue","yellow","purple","cyan","flip","pale","bw","wire","wire2","rainbow","rainbow2","rainbow3"];
    this.cmdPacksList = function(channel) {
        let i = 0;
        channel.send(`**Available Packs**\nDefault - 0\n${AVAILABLE_PACKS.map(el => { i++; return toTitleCase(el) + " - " + i }).join("\n")}`);
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
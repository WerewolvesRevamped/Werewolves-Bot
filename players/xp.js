/**
Skin Packs
**/

module.exports = function() {
    
    this.XP_MULTIPLIER = 11.4;
    
    /**
    Command: $xp
    **/
    this.cmdXP = async function(message, args) {
        if(!args[0]) { 
            cmdXPGet(message.channel, ["get", message.author.id]);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) {
			case "list": cmdXPList(message.channel); break;
			case "get": cmdXPGet(message.channel, args); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    /**
    Command: $xp list
    **/
    this.cmdXPList = async function(channel) {
        
        let curTime = xpGetTime();
        let oneDay = 288;
        let pastTime = curTime - oneDay * 30;
        
        let lb = await sqlProm("SELECT * FROM activity WHERE timestamp > " + connection.escape(pastTime) + " ORDER BY count DESC, player DESC");
        
        let i = 1;
        let lbText = lb.map(el => `**#${i++}:** <@${''+el.player}> - ${Math.floor(el.count * XP_MULTIPLIER + (+el.player[0]))} [${el.level}]`);
        let chunked = chunkArray(lbText, 20);
        
        let embed = { title: "XP Leaderboard", color: 8984857, fields: [ ] };
        embed.fields = chunked.map(el => { return { name: "_ _", "value": el.join("\n"), inline: true }; });
        channel.send({ embeds: [ embed ] });
        
    }
    
    /**
    Command: $xp get
    **/
    this.cmdXPGet = async function(channel, args) {
		// Check arguments
		if(!args[1]) { 
			channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `" + stats.prefix + "xp get <player>`!"); 
			return; 
		}
        // Get user
		let user = parseUser(channel, args[1]);
		if(!user) { 
			// Invalid user
			channel.send("⛔ Syntax error. Not a valid player!"); 
			return; 
		} 
        let lb = await sqlPromOneEsc("SELECT * FROM activity WHERE player=", user);
        
        if(!lb) {
            let embed = { title: "XP Leaderboard", color: 8984857, description: `<@${user}> has **0 XP** and is on **Level 0**.` };
            channel.send({ embeds: [ embed ] });
        } else {
            let embed = { title: "XP Leaderboard", color: 8984857, description: `<@${user}> has **${Math.floor(lb.count * XP_MULTIPLIER + (+lb.player[0]))} XP** and is on **Level ${lb.level}**.` };
            channel.send({ embeds: [ embed ] });
        }
    }
    
    /**
    XP Time
    **/
    this.xpGetTime = function() {
        return Math.floor((new Date().getTime() / 1000) / 60 / (60 * 1/10)); // current time in 5m intervals
    }
    
}
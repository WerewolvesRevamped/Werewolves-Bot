/**
    Randomization functions
**/

module.exports = function() {
    
    /**
    Command: $roll
    **/
	this.cmdRoll = function(message, args) {
		// Check subcommands
		if(!args[1] && (args[0] && args[0] == "bl" || args[0] == "wl" || args[0] == "gbl" || args[0] == "gwl")) { 
			message.channel.send("⛔ Syntax error. Not enough parameters! Correct usage: `roll [bl|wl|g|gbl|gwl] <players>` or `roll` or `roll n <number>`!"); 
			return; 
		}
		//Find subcommand
		switch(args[0]) {
			case "bl": case "blacklist": cmdRollExe(message.channel, args, false); break;
			case "wl": case "whitelist": cmdRollExe(message.channel, args, true); break;
			case "gbl": case "ghost_blacklist": cmdRollExe(message.channel, args, false, 2); break;
			case "gwl": case "ghost_whitelist": cmdRollExe(message.channel, args, true, 2); break;
			case "g": case "ghost": cmdRollExe(message.channel, [], false, 2); break;
            case "num": case "number": case "n": case "d": cmdRollNum(message.channel, args); break;
            // special handler for ?d? format
            default:
                if(args[0] && args[0].match(/\d*d\d+/)) {
                    let args2 = args[0].split(/d/);
                    if(!(args2[0] >= 1)) args2[0] = 1;
                    if(!(args2[1] >= 1)) args2[1] = 1;
                    if(args2[0] > 10) args2[0] = 10;
                    cmdRollNum(message.channel, ["d", args2[1]], (args2[0]-1));
                } else {
                    cmdRollExe(message.channel, [], false); break;
                }
            break; 
		}
	}
	
	/**
    Command: $roll wl/bl/gwl/gbl
    **/
	this.cmdRollExe = async function(channel, args, wl, alive = 1) {
		let blacklist = parseUserList(args, 1, channel, null, alive === 2 ? "ghost" : "participant") || [];
		// Get a list of players
		let players = await sqlProm("SELECT id FROM players WHERE alive=" + alive + " AND type='player'");
        // handle list
        let playerList = players.map(el => getUser(el.id)); 
        if(!wl) playerList = playerList.filter(el => blacklist.indexOf(el) === -1);
        else playerList = playerList.filter(el => blacklist.indexOf(el) != -1);
        // random selection
        let rID = playerList[Math.floor(Math.random() * playerList.length)];
        channel.send(`⏺️ Randomizing out of: ${playerList.map(el => idToEmoji(el)).join(", ")}`);
        channel.send(`✳️ Selecting...`).then(m => m.edit(`▶️ Selected <@${rID}> (${idToEmoji(rID)})`));
	}
    
	/**
    Command: $roll n / $roll ?d?
    **/
	this.cmdRollNum = function(channel, args, repeat = 0) {
        if(!(args[1] >= 2)) {
            channel.send("⛔ Invalid argument.");
            return;
        };
		let val = Math.ceil(Math.random() * args[1]);
        channel.send(`⏺️ Randomizing from \`1\` to \`${args[1]}\``);
        channel.send(`✳️ Selecting...`).then(m => {
            m.edit(`▶️ Selected \`${val}\``);
            if(repeat > 0) cmdRollNum(channel, args, --repeat);
        });
	}
    
}
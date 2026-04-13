/*
	Module for player related things
*/
require("./packs.js")();
require("./loot.js")();
require("./loot_commands.js")();
require("./coins.js")();
require("./icons.js")();
require("./xp.js")();
require("./values.js")();
require("./death_messages.js")();
require("./boosters.js")();
require("./inventory.js")();
require("./guarantors.js")();
require("./mentors.js")();
require("./bot.js")();
require("./permissions.js")();
require("./parsing.js")();
require("./curses.js")();
require("./reservations.js")();
require("./trophy.js")();
require("./lists.js")();
require("./caching.js")();
require("./signup.js")();
require("./substitute.js")();
require("./roll.js")();


module.exports = function() {
    
    /**
    Is Player Arg
    checks if a value is a valid argument on a player
    **/
	this.isPlayersArgs = function(arg) {
		let allowedArgs = ["id", "emoji", "type", "role", "orig_role", "alignment", "alive", "ccs", "public_msgs", "private_msgs", "target", "counter", "final_result", "mentor"];
		return allowedArgs.indexOf(arg) >= 0;
	}
    
    /**
    Send Inactivity Warnings
    sends warnings to the scs of all players that are currently inactive
    */
    this.sendInactivityWarnings = async function() {
        const allPlayers = await sqlProm("SELECT * FROM players");
        
        const curPhase = getPhaseAsNumber();
        if(curPhase < 1) return;
        
        for(let i = 0; i < allPlayers.length; i++) {
            const totalMessages = allPlayers[i].public_msgs + allPlayers[i].private_msgs;
            const publicMessages = allPlayers[i].public_msgs;
            
            if(totalMessages < (curPhase * stats.total_req)) {
                abilitySendProm(`player:${allPlayers[i].id}`, `You are currently below the required activity of ${stats.total_req} messages per phase. Please try to be a bit more active!`, EMBED_RED, true, false, null, "Activity Warning");
            } else if(publicMessages < (Math.floor(curPhase/2) * stats.public_req)) {
                abilitySendProm(`player:${allPlayers[i].id}`, `You are currently below the required public activity of ${stats.public_req} messages per phase. Please try to be a bit more active in the public channels!`, EMBED_RED, true, false, null, "Activity Warning");
            }
        }
        
    }
    
}
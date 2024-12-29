/**
	Loot Commands
*/
module.exports = function() {
    
    /**
    Command: $newship
    **/
    this.cmdNewship = async function(message) {
        let shipPerms = await inventoryGetItem(message.author.id, "bot:ship");
        if(shipPerms === 0) {
            message.channel.send(`⛔ You are not authorized to use the ${stats.prefix}newship command.`);
            return;
        } else if(!isParticipant(message.member)) {
			let newShip = message.guild.members.cache.filter(el => el.roles.cache.size >= 5).random().displayName;
            let newShipFull = newShip;
            let displayName = message.member.displayName.split(" ♡ ")[0];
            let newNick = displayName + " ♡ " + newShip;
            while(newNick.length > 32) {
                newShip = newShip.substr(0, newShip.length - 1); 
                displayName = displayName.substr(0, displayName.length - 1); 
                newNick = displayName + " ♡ " + newShip;
            }
			message.member.setNickname(newNick);
            message.channel.send(`${getEmoji('Lover')} You love ${newShipFull}!`);
		} else {
            message.channel.send(`⛔ This command is not available to Participants.`);
		}
    }
    
    /**
    Command: $newhate
    **/
    this.cmdNewhate = async function(message) {
        let shipPerms = await inventoryGetItem(message.author.id, "bot:hate");
        if(shipPerms === 0) {
            message.channel.send(`⛔ You are not authorized to use the ${stats.prefix}newhate command.`);
            return;
        } else if(!isParticipant(message.member)) {
			let newShip = message.guild.members.cache.filter(el => el.roles.cache.size >= 5).random().displayName;
            let newShipFull = newShip;
            let displayName = message.member.displayName.split(" ☠ ")[0];
            let newNick = displayName + " ☠ " + newShip;
            while(newNick.length > 32) {
                newShip = newShip.substr(0, newShip.length - 1); 
                displayName = displayName.substr(0, displayName.length - 1); 
                newNick = displayName + " ☠ " + newShip;
            }
			message.member.setNickname(newNick);
            message.channel.send(`${getEmoji('Reaper')} You hate ${newShipFull}!`);
		} else {
            message.channel.send(`⛔ This command is not available to Participants.`);
		}
    }
    
    /**
    Command: $reverseme
    **/
    this.cmdReverseme = async function(message) {
        let revPerms = await inventoryGetItem(message.author.id, "bot:rev");
        if(revPerms === 0) {
            message.channel.send(`⛔ You are not authorized to use the ${stats.prefix}reverseme command.`);
            return;
        } else {
			message.member.setNickname(message.member.displayName.split("").reverse().join(""));
			message.channel.send("✅ You have been reversed!");
        }
    }
    
    
}
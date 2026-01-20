/**
	Reservation
*/
module.exports = function() {
    
    /**
    Command: $reservation
    **/
    this.cmdReservation = async function(message, args) {
        let resPerms = await inventoryGetItem(message.author.id, "bot:reserve");
        if(resPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}reservation command.`);
            return;
        }
        if(!args[0]) { 
            cmdReservationShow(message);
			return; 
		} 
		// Check Subcommand
		switch(args[0]) {
			case "select": 
			case "set": cmdReservationSet(message, args); break;
			case "disable": cmdReservationDisable(message); break;
			case "show": cmdReservationShow(message); break;
			default: message.channel.send("⛔ Syntax error. Invalid subcommand `" + args[0] + "`!"); break;
		}
    }
    
    
    /**
    Command: $reservation disable
    **/
    this.cmdReservationDisable = async function(message) {
        sqlPromEsc("DELETE FROM reservations WHERE player=", message.author.id);
        let embed = { title: "Reservation", description: `<@${message.member.id}>, your reservation has been deleted.`, color: 16715021 };
        message.channel.send({ embeds: [ embed ] });
    }
    
    /**
    Command: $reservation show
    **/
    this.cmdReservationShow = async function(message) {
        let res = await sqlPromOneEsc("SELECT emoji FROM reservations WHERE player=", message.author.id);
        let embed = { title: "Reservation", description: `<@${message.member.id}>, your current reservation is: ${res?.emoji ?? 'none'}`, color: 5490704 };
        message.channel.send({ embeds: [ embed ] });
    }
    
    /**
    Get all Reservations + Owner
    **/
    this.idEmojis = [];
    this.cacheReservations = async function() {
        let reservations = await sqlProm("SELECT * FROM reservations");
        idEmojis.push(...reservations.map(el => [el.player, el.emoji]));
        idEmojis.push(...SYSTEM_RESERVATIONS.map(el => ["", el]));
        console.log(idEmojis);
    }
    
    /**
    Command: $reservation set
    **/
    this.SYSTEM_RESERVATIONS = ["📌", "✅", "⛔", "❌", "❓", "🔨", "🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾","🇿"];
    this.cmdReservationSet = async function(message, args) {
        if(!args[1]) { 
			message.channel.send("⛔ Syntax error. Not enough arguments!");
			return; 
		} 
        
        // Validate Emoji
        message.channel.send("✳️ Processing reservation...").then(messageNew => {
            args[1] = args[1].replace(/<(?!\:)|(?<!\d)>/g,"");
            messageNew.react(args[1]).then(async r => {
                messageNew.reactions.removeAll();
                let reservations = await sqlProm("SELECT emoji FROM reservations");
                reservations = reservations.map(el => el.emoji);
                if(reservations.includes(args[1])) {
                    messageNew.edit("⛔ Reserved emoji. Couldn't reserve emoji as it is already reserved.");
                    return;
                }
                if(SYSTEM_RESERVATIONS.includes(args[1])) {
                    messageNew.edit("⛔ Reserved emoji. Couldn't reserve emoji as it is used by the bot.");
                    return;
                }
                sqlPromEsc("INSERT INTO reservations (player, emoji) VALUES (" + connection.escape(message.author.id) + "," + connection.escape(args[1]) + ") ON DUPLICATE KEY UPDATE emoji=", args[1]);
                let embed = { title: "Reservation", description: `<@${message.member.id}>, your reservation has been updated to ${args[1]}.`, color: 5490704 };
                messageNew.edit({ content: "", embeds: [ embed ] });
                cacheReservations();
            });
        }).catch(err => { 
            // Invalid emoji
            messageNew.edit("⛔ Invalid emoji. Couldn't reserve emoji.");
            logO(err); 
        });

    }
    
    
}
/**
	Loot Commands
*/
module.exports = function() {
    
    /**
    Command: $profile
    **/
    this.cmdProfile = async function(message, args) {
        let nickPerms = await inventoryGetItem(message.author.id, "bot:profile");
        if(nickPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}profile command.`);
            return;
        } else {
            if(!args[0]) args[0] = message.member.id;
            let targetUser = parseUser(args[0], message.channel);
            if(!targetUser) {
                // Invalid user
                channel.send("⛔ Syntax error. `" + args[2] + "` is not a valid player!");
                return;
            }
            let targetMember = message.guild.members.cache.get(targetUser);
            let embed = await getBasicEmbed(message.guild);
            let name = targetMember.displayName ?? targetMember.user.username;
            let avatar = targetMember.displayAvatarURL({ size: 4096 }) ?? client.user.displayAvatarURL();
            embed.image = { url: avatar };
            embed.author = { icon_url: avatar, name: name };
            embed.description = `Member of ${message.guild.name} since <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D>.`;
            if(targetMember.premiumSinceTimestamp) embed.description += `\nBoosting ${message.guild.name} since <t:${Math.floor(targetMember.premiumSinceTimestamp / 1000)}:D>.`;
            let ranks = targetMember.roles.cache.filter(r => r.name.search(/Bronze|Silver|Gold|Platinum|Event Winner/)>=0).map(el => el.name).join(", ");
            if(ranks.length) embed.description += `\nRanks: ${ranks}`; 
            embed.color = targetMember.displayColor;
            sendEmbed(message.channel, embed);
		}
    }
    
    /**
    Command: $nickname
    **/
    this.cmdNickname = async function(message, argsX) {
        let nickPerms = await inventoryGetItem(message.author.id, "bot:nick");
        if(nickPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}nickname command.`);
            return;
        } else if(!isGameInvolved(message.member) && stats.gamephase != gp.SIGNUP) {
            let nick = argsX.join(" ");
            if(nick.length < 2 || nick.length > 32) {
                message.channel.send(`⛔ Invalid nickname.`);
            }
			message.member.setNickname(nick);
			message.channel.send("✅ Updated your nickname!");
		} else {
            message.channel.send(`⛔ This command is not available to users involved with the current game.`);
		}
    }
    
    /**
    Command: $newship
    **/
    this.cmdNewship = async function(message) {
        let shipPerms = await inventoryGetItem(message.author.id, "bot:ship");
        if(shipPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}newship command.`);
            return;
        } else if(!isGameInvolved(message.member) && stats.gamephase != gp.SIGNUP) {
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
            message.channel.send(`⛔ This command is not available to users involved with the current game.`);
		}
    }
    
    /**
    Command: $newhate
    **/
    this.cmdNewhate = async function(message) {
        let shipPerms = await inventoryGetItem(message.author.id, "bot:hate");
        if(shipPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}newhate command.`);
            return;
        } else if(!isGameInvolved(message.member) && stats.gamephase != gp.SIGNUP) {
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
            message.channel.send(`⛔ This command is not available to users involved with the current game.`);
		}
    }
    
    /**
    Command: $reverseme
    **/
    this.cmdReverseme = async function(message) {
        let revPerms = await inventoryGetItem(message.author.id, "bot:rev");
        if(revPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}reverseme command.`);
            return;
        } else {
			message.member.setNickname(message.member.displayName.split("").reverse().join(""));
			message.channel.send("✅ You have been reversed!");
        }
    }
    
    /**
    Command: $flip
    **/
    this.cmdFlip = async function(message) {
        let flipPerms = await inventoryGetItem(message.author.id, "bot:flip");
        if(flipPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}flip command.`);
            return;
        } else {
            let rand = Math.floor(Math.random() * 2);
            if(rand === 0) {
                let embed = { title: "Coin Flip", description: `<@${message.member.id}>, your coin flip landed on: **HEADS**.`, color: 5490704 };
                embed.thumbnail = { url: `${iconRepoBaseUrl}Extras/Token%20Silver.png` };
                message.channel.send({ embeds: [ embed ] });
            } else {
                let embed = { title: "Coin Flip", description: `<@${message.member.id}>, your coin flip landed on: **TAILS**.`, color: 5490704 };
                embed.thumbnail = { url: `${iconRepoBaseUrl}Extras/Token%20Silver%20Back.png` };
                message.channel.send({ embeds: [ embed ] });
            }
        }
    }
    
    /**
    Command: $yell
    **/
    this.yellList = [];
    this.cmdYell = async function(message) {
        let yellPerms = await inventoryGetItem(message.author.id, "bot:yell");
        if(yellPerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}yell command.`);
            return;
        } else {
            if(yellList.includes(message.author.id)) {
                yellList = yellList.filter(el => el != message.author.id);
                message.channel.send("✅ No longer yelling!");
            } else {
                message.channel.send("✅ Now YELLING!");
                yellList.push(message.author.id);
            }
        }
    }
    
    /**
    Command: $fortune
    **/
    this.cmdFortune = async function(message, args) {
        let fortunePerms = await inventoryGetItem(message.author.id, "bot:fortune");
        if(fortunePerms === 0) {
            message.channel.send(`⛔ You have not unlocked the ${stats.prefix}fortune command.`);
            return;
        } 
        // Command
        const cards = [['The Fool','Trickster','https://werewolves.me/cards/card.php?name=The Fool&iconName=Trickster&number=0&type=hd&mode=tarot'],['The Magician','Arcane Druid','https://werewolves.me/cards/card.php?name=The Magician&iconName=Arcane Druid&number=1&type=hd&mode=tarot'],['The High Priestess','Priestess','https://werewolves.me/cards/card.php?name=The High Priestess&iconName=Priestess&number=2&type=hd&mode=tarot'],['The Empress','The Empress','https://werewolves.me/cards/card.php?name=The Empress&iconName=The Empress&number=3&type=hd&mode=tarot'],['The Emperor','The Emperor','https://werewolves.me/cards/card.php?name=The Emperor&iconName=The Emperor&number=4&type=hd&mode=tarot'],['The Hierophant','Priest','https://werewolves.me/cards/card.php?name=The Hierophant&iconName=Priest&number=5&type=hd&mode=tarot'],['The Lovers','The Lovers','https://werewolves.me/cards/card.php?name=The Lovers&iconName=The Lovers&number=6&type=hd&mode=tarot'],['The Chariot','Horsemen','https://werewolves.me/cards/card.php?name=The Chariot&iconName=Horsemen&number=7&type=hd&mode=tarot'],['Strength','Macho','https://werewolves.me/cards/card.php?name=Strength&iconName=Macho&number=8&type=hd&mode=tarot'],['The Hermit','The Hermit','https://werewolves.me/cards/card.php?name=The Hermit&iconName=The Hermit&number=9&type=hd&mode=tarot'],['Wheel of Fortune','Apprentice','https://werewolves.me/cards/card.php?name=Wheel of Fortune&iconName=Apprentice&number=10&type=hd&mode=tarot'],['Justice','Royal Knight','https://werewolves.me/cards/card.php?name=Justice&iconName=Royal Knight&number=11&type=hd&mode=tarot'],['The Hanged Man','Executioner','https://werewolves.me/cards/card.php?name=The Hanged Man&iconName=Executioner&number=12&type=hd&mode=tarot'],['Death','Reaper','https://werewolves.me/cards/card.php?name=Death&iconName=Reaper&number=13&type=hd&mode=tarot'],['Temperance','Hooker','https://werewolves.me/cards/card.php?name=Temperance&iconName=Hooker&number=14&type=hd&mode=tarot'],['The Devil','Devil','https://werewolves.me/cards/card.php?name=The Devil&iconName=Devil&number=15&type=hd&mode=tarot'],['The Tower','The Tower','https://werewolves.me/cards/card.php?name=The Tower&iconName=The Tower&number=16&type=hd&mode=tarot'],['The Star','The Star','https://werewolves.me/cards/card.php?name=The Star&iconName=The Star&number=17&type=hd&mode=tarot'],['The Moon','The Moon','https://werewolves.me/cards/card.php?name=The Moon&iconName=The Moon&number=18&type=hd&mode=tarot'],['The Sun','The Sun','https://werewolves.me/cards/card.php?name=The Sun&iconName=The Sun&number=19&type=hd&mode=tarot'],['Judgement','Juror','https://werewolves.me/cards/card.php?name=Judgement&iconName=Juror&number=20&type=hd&mode=tarot'],['The World','The World','https://werewolves.me/cards/card.php?name=The World&iconName=The World&number=21&type=hd&mode=tarot'],['Five of Cups','Five Cups','https://werewolves.me/cards/card.php?name=Five of Cups&iconName=Five Cups&number=22&type=hd&mode=tarot&categoryIconName=Cups'],['Two of Cups','Two Cups','https://werewolves.me/cards/card.php?name=Two of Cups&iconName=Two Cups&number=23&type=hd&mode=tarot&categoryIconName=Cups'],['Four of Swords','Four Swords','https://werewolves.me/cards/card.php?name=Four of Swords&iconName=Four Swords&number=24&type=hd&mode=tarot&categoryIconName=Swords'],['Two of Swords','Two Swords','https://werewolves.me/cards/card.php?name=Two of Swords&iconName=Two Swords&number=25&type=hd&mode=tarot&categoryIconName=Swords'],['Three of Pentacles','Three Pentacles','https://werewolves.me/cards/card.php?name=Three of Pentacles&iconName=Three Pentacles&number=26&type=hd&mode=tarot&categoryIconName=Pentacles'],['Two of Pentacles','Two Pentacles','https://werewolves.me/cards/card.php?name=Two of Pentacles&iconName=Two Pentacles&number=27&type=hd&mode=tarot&categoryIconName=Pentacles'],['Five of Wands','Five Staffs','https://werewolves.me/cards/card.php?name=Five of Wands&iconName=Five Staffs&number=28&type=hd&mode=tarot&categoryIconName=Staffs'],['Two of Wands','Two Staffs','https://werewolves.me/cards/card.php?name=Two of Wands&iconName=Two Staffs&number=29&type=hd&mode=tarot&categoryIconName=Staffs'],['','','https://werewolves.me/cards/card.php?name=&iconName=&number=30&type=hd&mode=tarot'],['The Fool (Inverted)','Trickster','https://werewolves.me/cards/card.php?name=The Fool&iconName=Trickster&number=0&type=hd&mode=tarot&rotate=1'],['The Magician (Inverted)','Arcane Druid','https://werewolves.me/cards/card.php?name=The Magician&iconName=Arcane Druid&number=1&type=hd&mode=tarot&rotate=1'],['The High Priestess (Inverted)','Priestess','https://werewolves.me/cards/card.php?name=The High Priestess&iconName=Priestess&number=2&type=hd&mode=tarot&rotate=1'],['The Empress (Inverted)','The Empress','https://werewolves.me/cards/card.php?name=The Empress&iconName=The Empress&number=3&type=hd&mode=tarot&rotate=1'],['The Emperor (Inverted)','The Emperor','https://werewolves.me/cards/card.php?name=The Emperor&iconName=The Emperor&number=4&type=hd&mode=tarot&rotate=1'],['The Hierophant (Inverted)','Priest','https://werewolves.me/cards/card.php?name=The Hierophant&iconName=Priest&number=5&type=hd&mode=tarot&rotate=1'],['The Lovers (Inverted)','The Lovers','https://werewolves.me/cards/card.php?name=The Lovers&iconName=The Lovers&number=6&type=hd&mode=tarot&rotate=1'],['The Chariot (Inverted)','Horsemen','https://werewolves.me/cards/card.php?name=The Chariot&iconName=Horsemen&number=7&type=hd&mode=tarot&rotate=1'],['Strength (Inverted)','Macho','https://werewolves.me/cards/card.php?name=Strength&iconName=Macho&number=8&type=hd&mode=tarot&rotate=1'],['The Hermit (Inverted)','The Hermit','https://werewolves.me/cards/card.php?name=The Hermit&iconName=The Hermit&number=9&type=hd&mode=tarot&rotate=1'],['Wheel of Fortune (Inverted)','Apprentice','https://werewolves.me/cards/card.php?name=Wheel of Fortune&iconName=Apprentice&number=10&type=hd&mode=tarot&rotate=1'],['Justice (Inverted)','Royal Knight','https://werewolves.me/cards/card.php?name=Justice&iconName=Royal Knight&number=11&type=hd&mode=tarot&rotate=1'],['The Hanged Man (Inverted)','Executioner','https://werewolves.me/cards/card.php?name=The Hanged Man&iconName=Executioner&number=12&type=hd&mode=tarot&rotate=1'],['Death (Inverted)','Reaper','https://werewolves.me/cards/card.php?name=Death&iconName=Reaper&number=13&type=hd&mode=tarot&rotate=1'],['Temperance (Inverted)','Hooker','https://werewolves.me/cards/card.php?name=Temperance&iconName=Hooker&number=14&type=hd&mode=tarot&rotate=1'],['The Devil (Inverted)','Devil','https://werewolves.me/cards/card.php?name=The Devil&iconName=Devil&number=15&type=hd&mode=tarot&rotate=1'],['The Tower (Inverted)','The Tower','https://werewolves.me/cards/card.php?name=The Tower&iconName=The Tower&number=16&type=hd&mode=tarot&rotate=1'],['The Star (Inverted)','The Star','https://werewolves.me/cards/card.php?name=The Star&iconName=The Star&number=17&type=hd&mode=tarot&rotate=1'],['The Moon (Inverted)','The Moon','https://werewolves.me/cards/card.php?name=The Moon&iconName=The Moon&number=18&type=hd&mode=tarot&rotate=1'],['The Sun (Inverted)','The Sun','https://werewolves.me/cards/card.php?name=The Sun&iconName=The Sun&number=19&type=hd&mode=tarot&rotate=1'],['Judgement (Inverted)','Juror','https://werewolves.me/cards/card.php?name=Judgement&iconName=Juror&number=20&type=hd&mode=tarot&rotate=1'],['The World (Inverted)','The World','https://werewolves.me/cards/card.php?name=The World&iconName=The World&number=21&type=hd&mode=tarot&rotate=1'],['Five of Cups (Inverted)','Five Cups','https://werewolves.me/cards/card.php?name=Five of Cups&iconName=Five Cups&number=22&type=hd&mode=tarot&rotate=1&categoryIconName=Cups'],['Two of Cups (Inverted)','Two Cups','https://werewolves.me/cards/card.php?name=Two of Cups&iconName=Two Cups&number=23&type=hd&mode=tarot&rotate=1&categoryIconName=Cups'],['Four of Swords (Inverted)','Four Swords','https://werewolves.me/cards/card.php?name=Four of Swords&iconName=Four Swords&number=24&type=hd&mode=tarot&rotate=1&categoryIconName=Swords'],['Two of Swords (Inverted)','Two Swords','https://werewolves.me/cards/card.php?name=Two of Swords&iconName=Two Swords&number=25&type=hd&mode=tarot&rotate=1&categoryIconName=Swords'],['Three of Pentacles (Inverted)','Three Pentacles','https://werewolves.me/cards/card.php?name=Three of Pentacles&iconName=Three Pentacles&number=26&type=hd&mode=tarot&rotate=1&categoryIconName=Pentacles'],['Two of Pentacles (Inverted)','Two Pentacles','https://werewolves.me/cards/card.php?name=Two of Pentacles&iconName=Two Pentacles&number=27&type=hd&mode=tarot&rotate=1&categoryIconName=Pentacles'],['Five of Wands (Inverted)','Five Staffs','https://werewolves.me/cards/card.php?name=Five of Wands&iconName=Five Staffs&number=28&type=hd&mode=tarot&rotate=1&categoryIconName=Staffs'],['Two of Wands (Inverted)','Two Staffs','https://werewolves.me/cards/card.php?name=Two of Wands&iconName=Two Staffs&number=29&type=hd&mode=tarot&rotate=1&categoryIconName=Staffs'],[' (Inverted)','','https://werewolves.me/cards/card.php?name=&iconName=&number=30&type=hd&mode=tarot&rotate=1'],['Him','','https://werewolves.me/cards/card.php?name=Him&iconName=shroom&number=99&type=hd&mode=tarot&categoryIconName=Shroom']];
        const text = [
            "They inspire courage, for they understand that every game is a chance to open up new areas in your skills and knowledge, and with that comes a mixture of anticipation, wonder, awe and curiosity.",
            "Remember that you are powerful, create your inner world, and the outer will follow.",
            "Her appearance in a reading can signify that it is time for you to listen to your intuition rather than prioritizing your intellect and conscious mind.",
            "The Empress is associated with expression and creativity among many other aspects. Prioritize these and fortune will find you.",
            "He is a symbol of principle - the paternal figure in life that gives structure and imparts knowledge. These aspects will be your greatest strength.",
            "The Hierophant card suggests that it’s better for you to follow strategies which are established and have their own traditions",
            "The trust and the unity that the lovers have gives each of them confidence and strength, empowering the other.",
            "The Chariot shows that you should pursue the plan with a structured and ordered approach.",
            "Your resilience will greatly aid you, and your fearlessness means that you should have no issues speaking your mind.",
            "They walk through the dark night of their unconscious, guided only by the low light of the northern star, with their destination being their own playstyle, their self.",
            "The same forces that govern the changing of the phases, or the rising and setting of the sun are also the masters of the fate of individuals.",
            "If you have been wronged, this card's appearance may bring you relief. On the other hand, if your actions caused pain to others, this card serves as a warning.",
            "The Hanged Man card reflects a particular need to suspend certain action. As a result, this might indicate a certain period of indecision.",
            "The Death card signals that one major phase in your life is ending, and a new one is going to start.",
            "The Temperance tarot card suggests moderation and balance, coupled with a lot of patience.",
            "Addiction to risk taking can also be the reason for your feelings of powerlessness and entrapment.",
            "The old ways are no longer useful, and you must find another set of beliefs, strategies and processes to take their place.",
            "To see this card is a message to have faith, for the universe will bless you and bring forth all that you need.",
            "The moon's light can bring you clarity and understanding and you should allow your intuition to guide you through this darkness. ",
            "The card shows that you have a significant sense of deserved confidence right now. ",
            "To see this card can also indicate that you are in a period of awakening, brought on by the act of self-reflection. ",
            "To encounter the World in your cards is to encounter a great unity and wholeness.",
            "Instead of moving towards a more positive perspective, this card seems to say that you are dwelling in the past, inducing feelings of self-pity and regret.",
            "A strong pair is indicated here, the joy of two strategies becoming one.",
            "The Four of Swords is a moment of rest. Whether this is from a choice to withdraw, or whether it is from pure exhaustion, it is not clear.",
            "You will find yourself in a situation where you must make a choice... Neither will seems particularly appealing.",
            "Successful claims usually require different kinds of expertise, and at this moment, the Three of Pentacles means that all the skills required are coming together.",
            "For those that may have more coins to go around, they can afford to be less careful with their strategies, but at this moment things may be tight.",
            "This tarot card encourages that you accept the competition as a way for you to improve yourself without feeling any malice towards them.",
            "The Two of Wands is a more mature version of the ace of wands, meaning that that this tarot card is all about planning and moving forward – progression.",
            "",
            "They inspire fear, for they understand that every game is a chance to close off the old areas in your skills and knowledge, and with that comes a mixture of doubt, contempt, disdain and apathy.",
            "Remember that you are weak, to create your inner world you must sacrifice your outer world.",
            "Her appearance in a reading can signify that it is time for you to use your intellect and conscious mind and ignore your intuition.",
            "The Inverted Empress is associated with Facts and Logic among many other aspects. Prioritize these and fortune will find you.",
            "He is a symbol of ambiguity - the paternal figure in life that gives chaos and imparts wisdom. These aspects will be your greatest weakness.",
            "The Inverted Hierophant card suggests that it’s better for you to try new solutions, and discover new ideas",
            "The deception and the division that the inverted lovers have gives each of them fear and weakness, impeding the other.",
            "The Inverted Chariot shows that you should pursue the plan with a flexible and loose approach.",
            "Your impotence will greatly fail you, and your cowardice means that you will fall into the ideas of the crowd.",
            "They walk through the dark night of their unconscious, guided only by the great light of the south star Sirius, with their destination being the tried and true methods, their self.",
            "The forces that govern the changing of the phases, or the rising and setting of the sun are opposed to the the masters of the fate of individuals.",
            "If you have been wronged, this card's appearance may bring you apprehension. On the other hand, if your actions caused pain to others, this card serves as a blessing.",
            "The Inverted Hanged Man card reflects a suggestion of continuation in actions. As a result, this might indicate a certain period of decisiveness.",
            "The Inverted Death card signals a continuation of phases in your life, this may be for good or bad.",
            "The Temperance tarot card suggests an extreme decision in either direction, coupled with a need for enthusiasm.",
            "Taking risks may bring you a feeling of power and thrill that will set you free.",
            "The old ways provide insight, there is no need to diverge from them as they bring insight and guidence.",
            "To see this card is a message you must seek it yourself, only you can bring forth all that you need.",
            "The moon's darkness can bring you obscurity and confusion and you should allow your intellect to guide you through this towards the light. ",
            "The card shows that you have a significant sense of projected insecurity right now. ",
            "To see this card can also indicate that you are in a period of closure, brought about by a period of self-pity. ",
            "To encounter the Inverted World in your cards is to encounter a great chaos and disorganisation.",
            "You seem to be moving towards a more positive perspective, this card seems to say that you are looking to the future, brought about by feelings of self-reflection and brazenness.",
            "A weak pair is indicated here, the divulgence of one strategy from another.",
            "The Inverted Four of Swords is a time for action. Whether this is from a choice, or whether it is from necessity, it is not clear.",
            "You will find yourself in a situation where you must follow the crowd... Only the right crowd will sound appealing.",
            "Unsuccessful claims usually come from a lack of skill, and at this moment, the Inverted Three of Pentacles means that all the skills required must be already known.",
            "For those that need coins, they cannot afford to to be careless with strategy, but at this moment things may be flexible.",
            "This tarot card encourages that you reject the competition as a way for you to discourage others with great malice to them.",
            "The Inverted Two of Wands is a less mature version of the ace of wands, meaning that that this tarot card is all about unplanned action and moving backwords – reflection.",
            "",
            "Your fate is sealed. RUN!"
        ];
        let index = (Math.floor((+ new Date())/(1000*60*60*4)) + (+message.member.id.substr(0,8)) + message.member.displayName.length) % 45;
        if(isGameMaster(message.member) && args[0] && args[0] === "r") index = Math.floor(Math.random() * 45);
        if(index >= 22) index += 9;
        if(index === 44) index = 62;
        console.log(index);
        if(isGameMaster(message.member) && args[0] && args[0] != "r") index = +args[0];
        const selectedCard = cards[index];
        let embed = { "title": selectedCard[0], "description": text[index], "color": 9094725, "image": { "url": selectedCard[2].replace(/ /g,"%20") } };
		message.channel.send({ embeds: [ embed ] });
    }
    
    
}
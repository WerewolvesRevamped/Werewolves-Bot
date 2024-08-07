/**
    Abilities Module - Main
    The submodule for implement ability prompts
**/

module.exports = function() {
    /** 
    Create Prompt
    creates a new prompt in the prompt table
    **/
    this.createPrompt = async function(mid, pid, src_role, ability, type1, type2 = "none") {
        await new Promise(res => {
            sql("INSERT INTO prompts (message_id,player_id,src_role,ability,type1,type2) VALUES (" + connection.escape(mid) + "," + connection.escape(pid) + "," + connection.escape(src_role) + "," + connection.escape(JSON.stringify(ability)) + "," + connection.escape(type1.toLowerCase()) + "," + connection.escape(type2.toLowerCase()) + ")", result => {
                res();
            });            
        });
    }
    
    /**
    Check for Prompts
    iterates through all values of an ability object to check if any contain a @Selection in which case a prompt is necessary
    **/
     this.getPrompts = function(ability) {
        // iterate through all object values
        let foundSelections = [];
        Object.keys(ability).forEach(key => {
            let val = ability[key];
            // check if its a string type value
            if(typeof val !== "string") return;
            // to lower case
            val = val.toLowerCase();
            if(val.indexOf("@selection") >= 0 || val.indexOf("@secondaryselection") >= 0) {
                foundSelections.push([key,val]);
            }
        });
        return foundSelections;
    }
    
    /**
    Clear Prompts
    clears all prompts from the table
    **/
    this.clearPrompts = async function() {
        return new Promise(res => {
            sql("DELETE FROM prompts", () => {
                res();
            });
        });
    }
    
    /**
    Get Prompt by prompt message id
    retrieves a prompt
    **/
    async function getPrompt(id) {
        return new Promise(res => {
            sql("SELECT * FROM prompts WHERE message_id=" + connection.escape(id), result => {
                res(result.length > 0 ? result[0] : false);
            });
        });
    }
    
    /**
    Check if message is prompt
    **/
    this.isPrompt = async function(id) {
        let prompt = await getPrompt(id);
        return prompt !== false;  // return true if prompt is found, false otherwise
    }
    
        
    /**
    Deletes a Prompt by prompt message id
    retrieves a prompt
    **/
    async function deletePrompt(id) {
        return new Promise(res => {
            sql("DELETE FROM prompts WHERE message_id=" + connection.escape(id), result => {
                res();
            });
        });
    }
    
    /**
    Apply Prompt value
    applies a prompt replies value onto a prompt
    **/
    function applyPromptValue(ability, promptIndex, promptValue) {
        // iterate through all object values
        Object.keys(ability).forEach(key => {
            let val = ability[key];
            // check if its a string type value
            if(typeof val !== "string") return;
            // to lower case
            val = val.toLowerCase();
            if(val.indexOf("@selection") >= 0 && promptIndex == 0) {
                ability[key] = promptValue;
            } else if(val.indexOf("@secondaryselection") >= 0 && promptIndex == 1) {
                ability[key] = promptValue;
            }
        });
        return ability;
    }
    
    /**
    Handle Prompt Reply
    takes a message as an input that is a reply to a bot prompt
    **/
    this.handlePromptReply = async function(message) {
        // load prompt from DB
        let prompt = await getPrompt(message.reference.messageId);
        // get values from prompt
        let ability = JSON.parse(prompt.ability);
        let src_role = prompt.src_role;
        let pid = prompt.player_id;
        // check which type of prompt
        if(prompt.type2 == "none") { // single reply needed
            let reply = message.content.trim();
            let parsedReply = parsePromptReply(reply, prompt.type1, message);
            // reply received
            if(parsedReply !== false) {
                // delete prompt 
                await deletePrompt(message.reference.messageId);
                message.reply(`✅ Reply received \`${parsedReply[0]}\`.`);
                // apply prompt reply onto ability
                let promptAppliedAbility = applyPromptValue(ability, 0, parsedReply[1]);
                // execute ability
                let feedback = await executeAbility(pid, src_role, promptAppliedAbility);
                abilitySend(pid, feedback);
            }
        } else { // two replies needed
            let reply = message.content.split(";");
            if(reply.length != 2) {
                message.reply("❌ You must specify exactly two arguments, separated by `;`.");
            }
            let reply1 = reply[0].trim();
            let reply2 = reply[1].trim();
            let parsedReply1 = parsePromptReply(reply1, prompt.type1, message);
            let parsedReply2 = parsePromptReply(reply2, prompt.type2, message);
            // reply received
            if(parsedReply1 !== false && parsedReply2 !== false) {
                // delete prompt 
                await deletePrompt(message.reference.messageId);
                message.reply(`✅ Reply received \`${parsedReply1[0]}\` and \`${parsedReply2[0]}\`.`);
                // apply prompt reply onto ability
                let promptAppliedAbility = applyPromptValue(ability, 0, parsedReply1[1]);
                promptAppliedAbility = applyPromptValue(ability, 1, parsedReply2[1]);
                // execute ability
                let feedback = await executeAbility(pid, src_role, promptAppliedAbility);
                abilitySend(pid, feedback);
            }
        }
    }
    
    /**
    Parses an argument of a prompt reply
    Returns an array of type [displayValue, actualValue]
    **/
    function parsePromptReply(text, type, message) {
        switch(type) {
            case "player":
                let player = parsePlayerReply(text, message.channel);
                if(player === false) {
                    message.reply("❌ You must specify a valid player.");
                    return false;
                }
                return player;
            case "role":
                let role = parseRoleReply(text);
                if(role === false) {
                    message.reply("❌ You must specify a valid role.");
                    return false;
                }
                return role;
            default:
                message.reply("❌ Invalid prompt.");
                return false;
        }
    }
    
    /**
    Parses an argument of type player in a prompt reply
    **/
    function parsePlayerReply(playerName, channel) {
        // similiar as implementation in fixUserList()
		let allPlayerNames = playerIDs.map(el => [channel.guild.members.cache.get(el)?.user.username,channel.guild.members.cache.get(el)?.nickname]).flat().filter(el => el).map(el => el.toLowerCase());
        // check provided player name against all player names
		let parsed = parseList([playerName.toLowerCase()], allPlayerNames);
        if(parsed.invalid.length > 0) { // no player found -> false
            return false;
        } else { // player found -> normalize to player.displayName
            let player = parsed.found[0];
            let parsedPlayer = parseUser(channel, player); // parse player name/id/emoji to discord id
            let playerName = channel.guild.members.cache.get(parsedPlayer)?.displayName ?? false; // get name through id
            if(playerName === false) { // this applies in case the player has left the server
                message.reply("❌ Player valid but cannot be found.");
                return false;
            }
            return [playerName, `@id:${parsedPlayer}`]; // return display name
        }
    }
    
    /**
    Parses an argument of type role in a prompt reply
    **/
    function parseRoleReply(roleName) {
        let parsedRole = parseRole(roleName);
        if(verifyRole(parsedRole)) {
            return [toTitleCase(parsedRole), parsedRole];
        } else {
            return false;
        }
    }
}
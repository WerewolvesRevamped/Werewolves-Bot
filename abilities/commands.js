/*
	Handles various commands to execute abilities manually
*/
module.exports = function() {
    
    /**
    Command: Execute
    executes an ability
    **/
    this.cmdExecute = async function(message, ability) {
        let feedback = await executeAbility("player:" + message.author.id, "role:host", JSON.parse(ability));
        if(feedback.msg) message.channel.send(basicEmbed(feedback.msg, EMBED_GREEN));
        else if(feedback.success) message.channel.send(basicEmbed(feedback.success, EMBED_GREEN));
    }
	
	/**
    Command: $grant
    creates a new extra role
    **/
	this.cmdGrant = async function(message, args) {
		// Check arguments
		if(!args[0] || !args[1]) { 
			message.channel.send("⛔ Syntax error. Not enough parameters!"); 
			return; 
		}
        
        // create ability
        let ability = { type: "granting", subtype: "add" };
        
        // get target
        let target = parseUser(backupChannel, args[0]);
        let member = mainGuild.members.cache.get(target);
        if(!member) {
            message.channel.send("⛔ Input error. Invalid player!"); 
			return; 
        }
        ability.target = `@id:${target}[player]`;
        
        // get role
        let parsedRole = parseRole(args[1]);
        if(!verifyRole(parsedRole)) {
            message.channel.send("⛔ Input error. Invalid role!"); 
			return; 
        }
        ability.role = `${parsedRole}[role]`;
        
        // execute ability
        let feedback = await executeAbility("player:" + message.author.id, "role:host", ability);
        
        // send feedback
        if(feedback.msg) message.channel.send(basicEmbed(feedback.msg, EMBED_GREEN));
        else if(feedback.success) message.channel.send(basicEmbed(feedback.success, EMBED_GREEN));
	}
    
}
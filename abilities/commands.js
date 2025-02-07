/*
	Handles various commands to execute abilities manually
*/
module.exports = function() {
    
    /**
    Command: Execute
    executes an ability
    **/
    this.cmdExecute = async function(channel, ability, src_ref, src_name) {
        let feedback = await executeAbility(src_ref, src_name, JSON.parse(ability));
        if(feedback.msg) channel.send(basicEmbed(feedback.msg, EMBED_GREEN));
        else if(feedback.success) channel.send(basicEmbed(feedback.success, EMBED_GREEN));
    }
    
    /**
    Command: $emit <trigger type>
    Manually emits a certain trigger type
    **/
    this.cmdEmit = async function(channel, argsX) {
        console.log(`Emitting a ${argsX[0]} event.`);
        let evt = toTitleCase(argsX.join(" "));
        switch(argsX[0]) {
            default: await triggerHandler(evt); break;
            case "start": await eventStarting(); break;
            case "sday": await eventStartDay(); break;
            case "snight": await eventStartNight(); break;
        }
    }
    
    /**
    Command: $src_emit <src> <trigger> <type>
    **/
    this.cmdSrcEmit = async function(channel, argsX) {
        console.log(`Emitting a ${argsX[1]} event for ${argsX[0]}.`);
        await trigger(argsX[0], argsX[1]);
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
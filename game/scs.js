/*
	Module for SCs 
*/
module.exports = function() {
    
	
	this.cmdSCClear = function(channel) {
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
		let members = channel.permissionOverwrites.cache.toJSON().filter(el => el.type === OverwriteType.Member).filter(el => el.allow > 0).map(el => el.id);
		members.forEach(el => {
			channel.permissionOverwrites.cache.get(el).delete();	
		});
	}
	
	this.cmdSCClean = function(channel) {
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
		cmdSCClear(channel);
		cmdBulkDelete(channel);
	}
	
	this.cmdSCChange = function(channel, args) {
		let role = verifyRole(args[1]);
		if(!args[1] || !role ) {
			channel.send("⛔ Command error. You must provide a valid role!");
			return;
		}
		if(!isSC(channel)) {
			channel.send("⛔ Command error. Can't use command outside a SC!");
			return;
		}
        args.shift();
		cmdCCRename(channel, false, ["", args.join(" ")], 1);
		cmdInfoEither(channel, [args.join(" ")], true, true);
        channel.send(`**<@&${stats.participant}> Your role has changed to \`${toTitleCase(args.join(" "))}\`.**`);
	}
    
}
/**
    Roles Module - Help Command
    Help command for the roles module
**/

module.exports = function() {
    
	/* Help for this module */
	this.helpAttributes = function(member, args) {
		let help = "";
		switch(args[0]) {
			case "":
				if(isGameMaster(member)) help += stats.prefix + "attributes [active|delete] - Manages active attributes\n";
			break;
			case "attributes":
				if(!isGameMaster(member)) break;
				switch(args[1]) {
					default:
						help += "```yaml\nSyntax\n\n" + stats.prefix + "attributes [active|delete]\n```";
						help += "```\nFunctionality\n\nGroup of commands to handle attributes. " + stats.prefix + "help attributes <sub-command> for detailed help.```";
						help += "```diff\nAliases\n\n- attribute\n- attr\n```";
					break;
					case "active":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "attributes active\n```";
						help += "```\nFunctionality\n\nReturns all active attribute instances.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "attributes active\n```";
					break;
					case "delete":
						help += "```yaml\nSyntax\n\n" + stats.prefix + "attributes delete\n```";
						help += "```\nFunctionality\n\nDelets an active attribute instance. Use '" + stats.prefix + "attributes active' subcommand to retrieve attribute ids.\n```";
						help += "```fix\nUsage\n\n> " + stats.prefix + "attributes delete [id]\n```";
					break;
				}
			break;
		}
		return help;
	}
}
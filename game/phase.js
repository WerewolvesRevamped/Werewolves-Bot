/**
	Game Module - Phases
	Handles phases
*/
module.exports = function() {
    
	/**
    Command: $phase
    Handle the phase command
    **/
	this.cmdPhase = function(message, args) {
		// Check subcommand
		if(!args[0]) { 
			cmdPhaseGet(message.channel);
			return; 
		}
		// Find subcommand
		switch(args[0]) {
			// Attributea Subcommand
			case "get": cmdPhaseGet(message.channel); break;
			case "set": cmdPhaseSet(message.channel, args); break;
			case "next": cmdPhaseNext(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $phase get
    **/
    this.cmdPhaseGet = function(channel) {
        let phaseName = toTitleCase(getPhase());
        channel.send(`✅ Current phase is \`${phaseName}\`.`);
    }
    
    /**
    Command: $phase set
    **/
    this.cmdPhaseSet = async function(channel, args) {
        // parse phase name
        let phaseName = args[1].toLowerCase();
        // guard statements
        if(phaseName[0] != "d" && phaseName[0] != "n") {
            channel.send(`⛔ Syntax error. Phase name must start with \`d\` or \`n\`.`);
            return;
        }
        if(phaseName.length < 2 || phaseName.length > 3) {
            channel.send(`⛔ Syntax error. Phase name must be 2 or 3 characters.`);
            return;
        }
        if(isNaN(phaseName.substr(1))) {
            channel.send(`⛔ Syntax error. Phase name must end with a number.`);
            return;
        }
        // update phase
        let result = await setPhase(phaseName);
        // feedback
        if(result) {
            channel.send(`✅ Updated phase to \`${toTitleCase(phaseName)}\`!`);
        } else {
            channel.send(`⛔ Command error.  Could not update phase.`);
        }
    }
      
    /**
    Command: $phase next
    **/
    this.cmdPhaseNext = async function(channel) {
        // find next phase name
        let phaseName = toTitleCase(getPhase());
        let phaseNum = getPhaseNum(phaseName);
        let newPhaseName = "";
        if(isDay(phaseName)) {
            newPhaseName = "n" + (phaseNum+1);
        } else {
            newPhaseName = "d" + phaseNum;
        }
        // update phase
        let result = await setPhase(newPhaseName);
        // feedback
        if(result) {
            channel.send(`✅ Incremented phase to \`${toTitleCase(newPhaseName)}\`!`);
        } else {
            channel.send(`⛔ Command error.  Could not increment phase.`);
        }
    }

    /**
    Set Phase
    sets the current phase using the stat system
    **/
    this.setPhase = async function(phase) {
        stats.phase = phase;
        return new Promise(res => {
            sqlSetStat(statID.PHASE, phase, () => {
                res(true);
            }, () => {
                res(false);
            }); 
        }); 

    }
    
    /**
    Get Phase
    returns the current phase
    **/
    this.getPhase = function() {
        return toTitleCase(stats.phase);
    }
    
    /**
    Is Day?
    Returns whether a phase is day or not
    **/
    this.isDay = function(phase) {
        let phaseType = phase[0].toLowerCase();
        return phaseType == "d";
    }
    
    /**
    Is Night
    Returns whether a phase is night or not
    **/
    this.isNight = function(phase) {
        return !isDay(phase);
    }
    
    /**
    Get Phase Num
    extracts the number from a phase
    **/
    this.getPhaseNum = function(phase) {
        return (+phase.substr(1));
    }

}
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
			case "main": cmdPhaseMain(message.channel); break;
			case "late": cmdPhaseLate(message.channel); break;
			case "lock": cmdPhaseLock(message.channel); break;
			default: message.channel.send("⛔ Syntax error. Invalid parameter `" + args[0] + "`!"); break;
		}
	}
    
    /**
    Command: $phase get
    **/
    this.cmdPhaseGet = function(channel) {
        let phaseName = toTitleCase(getPhase());
        channel.send(`✅ Current phase is \`${phaseName}\` (${getSubphase()}).`);
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
        let result1 = await setPhase(phaseName);
        let result2 = await setSubphase(SUBPHASE.MAIN);
        // feedback
        if(result1 && result2) {
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
        let result1 = await setPhase(newPhaseName);
        let result2 = await setSubphase(SUBPHASE.MAIN);
        // feedback
        if(result1 && result2) {
            channel.send(`✅ Incremented phase to \`${toTitleCase(newPhaseName)}\`!`);
        } else {
            channel.send(`⛔ Command error.  Could not increment phase.`);
        }
    }
    
    /**
    Command: $phase main
    Main subphase
    **/
    this.cmdPhaseMain = async function(channel) {
        let result = await setSubphase(SUBPHASE.MAIN);
        // feedback
        if(result) {
            channel.send(`✅ Set to main subphase!`);
        } else {
            channel.send(`⛔ Command error.  Could not update subphase.`);
        }
    }
    
    /**
    Command: $phase late
    In a late phase abilities can no longer be delayed.
    **/
    this.cmdPhaseLate = async function(channel) {
        // switch phase
        let result = await setSubphase(SUBPHASE.LATE);
        // execute delayed abilities
        await executeDelayedQueuedAction();
        // feedback
        if(result) {
            channel.send(`✅ Set to late subphase!`);
        } else {
            channel.send(`⛔ Command error.  Could not update subphase.`);
        }
    }
    
    /**
    Command: $phase lock
    In a late phase abilities can no longer be scheduled.
    **/
    this.cmdPhaseLock = async function(channel) {
        let result = await setSubphase(SUBPHASE.LOCKED);
        // feedback
        if(result) {
            channel.send(`✅ Set to locked subphase!`);
        } else {
            channel.send(`⛔ Command error.  Could not update subphase.`);
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
    
    this.setSubphase = async function(subphase) {
        stats.subphase = subphase;
        return new Promise(res => {
            sqlSetStat(statID.SUBPHASE, subphase, () => {
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
    Get Subphase
    returns the current subphase as a string
    **/
    const SUBPHASE = {
        MAIN: 0,
        LATE: 1,
        LOCKED: 2
    };
    this.getSubphase = function() {
        switch(+stats.subphase) {
            case SUBPHASE.MAIN: return "Main";
            case SUBPHASE.LATE: return "Late";
            case SUBPHASE.LOCKED: return "Locked";
            default: return "Unknown";
        }
    }
    
    /**
    Is Main Subphase?
    **/
    this.subphaseIsMain = function() {
        return stats.subphase == SUBPHASE.MAIN;
    }
    
    /**
    Is Late Subphase?
    **/
    this.subphaseIsLate = function() {
        return stats.subphase == SUBPHASE.LATE;
    }
    
    /**
    Is Locked Subphase
    **/
    this.subphaseIsLocked = function() {
        return stats.subphase == SUBPHASE.LOCKED;
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
/**
Mentors
**/

module.exports = function() {
    
    /**
    Get players mentor
    **/
    this.getMentor = async function(pid) {
        let pData = await sqlPromOneEsc("SELECT mentor FROM players WHERE id=", pid);
        return pData ? pData.mentor : null;
    }
    
	this.cmdMentor = function(channel, args) {
        let mentee = parseUser(args[0], channel);
        let mentor = parseUser(args[1], channel);
        let memMentee = channel.guild.members.cache.get(mentee);
        let memMentor = channel.guild.members.cache.get(mentor);
        if(!mentee) {
			channel.send("⛔ Command error. You must specify a valid player as mentee."); 
			return;
        } else if(!mentee) {
			channel.send("⛔ Command error. You must specify a valid player as mentor."); 
			return;
        } else if(!isSignedUp(memMentee)) {
			channel.send("⛔ Command error. You must specify a valid signed-up player as mentee."); 
			return;
		} else if(isSignedUp(memMentor)) {
			channel.send("⛔ Command error. You must specify a valid non-signed-up player as mentor."); 
			return;
		} else if(stats.gamephase < gp.SIGNUP) {
			channel.send("⛔ Command error. Can't assign mentors while there is no game."); 
			return;
		}
		channel.send(`✅ Setting <@${mentor}> as a mentor for <@${mentee}>!`);
        addRoleRecursive(memMentor, channel, stats.mentor, "Mentor");
        sqlPromEsc("UPDATE players SET mentor=" + connection.escape(mentor) + " WHERE id=", mentee);
	}
    
}
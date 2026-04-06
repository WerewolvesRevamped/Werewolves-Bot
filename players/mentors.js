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
    
	this.cmdPlayersMentor = function(channel, args) {
        let mentee = parseUser(args[1], channel);
        let mentor = parseUser(args[2], channel);
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
		} else if(!isSignedupMentor(memMentor)) {
			channel.send("⛔ Command error. You must specify a valid mentor signed up player as mentor."); 
			return;
		} else if(isSignedUp(memMentor) && isSignedupMentor(memMentor)) {
            // if signedup and mentor signedup, remove normal signup
            sql("DELETE FROM players WHERE type='player' AND id=" + connection.escape(mentor));
            removeRoleRecursive(memMentor, channel, stats.signed_up, "signed up");
		} else if(stats.gamephase < gp.SIGNUP) {
			channel.send("⛔ Command error. Can't assign mentors while there is no game."); 
			return;
		}
		channel.send(`✅ Setting <@${mentor}> as a mentor for <@${mentee}>!`);
        sqlPromEsc("UPDATE players SET mentor=" + connection.escape(mentor) + " WHERE id=", mentee);
	}
    
}
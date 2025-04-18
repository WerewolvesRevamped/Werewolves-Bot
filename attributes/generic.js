/**
    Attributes Module - Generic
    Handles functionality related to generic attributes
**/
module.exports = function() {
    
    /**
    Create Disguise Attribute
    creates a disguise attribute with a specific role and strength
    **/
    this.createDisguiseAttribute = async function(src_name, src_ref, target_player, dur, disguise_role = "citizen", disguise_strength = "weak") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "disguise", disguise_role, disguise_strength);
    }
    
    /**
    Create Defense Attribute
    creates a defense attribute with a specific defense and killing subtype, a selector for affected players and a phase
    **/
    this.createDefenseAttribute = async function(src_name, src_ref, target_player, dur, def_subtype = "passive", kill_subtype = "all", affected = "@All", phase = "all") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "defense", def_subtype, kill_subtype, affected, phase);
    }
    
    /**
    Create Absence Attribute
    creates an absence attribute with a location, a killing subtype, a selector for affected players and a phase
    **/
    this.createAbsenceAttribute = async function(src_name, src_ref, target_player, dur, loc, kill_subtype = "all", affected = "@All", phase = "all") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "absence", loc, kill_subtype, affected, phase);
    }
    
    /**
    Create Manipulation Attribute
    creates a manipulation attribute with a specific manipulation subtype and a value for the manipulation
    **/
    this.createManipulationAttribute = async function(src_name, src_ref, target_player, dur, type = "absolute", subtype = "public", val = 1) {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "manipulation", type, subtype, val);
    }
    
    /**
    Create Group Membership Attribute
    creates a group membership attribute with a specific group name and group membership type
    **/
    this.createGroupMembershipAttribute = async function(src_name, src_ref, target_player, dur, name = "#Wolfpack", membership_type = "member") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "group_membership", name, membership_type);
    }
    
    /**
    Create Obstruction Attribute
    creates an obstruction attribute with specific affected abilities and obstruction feedback
    **/
    this.createObstructionAttribute = async function(src_name, src_ref, target_player, dur, affected_type = "", affected_subtype = "", feedback = "") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "obstruction", affected_type, affected_subtype, feedback);
    }
    
    /**
    Create Obstruction Inverted Attribute
    creates an obstruction attribute with specific NOT affected abilities and obstruction feedback
    **/
    this.createObstructionInvertedAttribute = async function(src_name, src_ref, target_player, dur, immune_type = "", immune_subtype = "", feedback = "") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "obstruction_inverted", immune_type, immune_subtype, feedback);
    }
    
    /**
    Create Role Attribute
    creates a role attribute with specific role
    **/
    this.createRoleAttribute = async function(src_name, src_ref, target_player, dur, role =  "", channelId = "") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "role", role, channelId);
    }
    
    /**
    Create Whisper Attribute
    creates a whisper attribute with two channels
    **/
    this.createWhisperAttribute = async function(src_name, src_ref, target_player, dur, conName = "", srcChannel = "", targetChannel = "") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "whisper", conName, srcChannel, targetChannel);
    }
    
    /**
    Create Loyalty Attribute
    creates a loyalty attribute to a specific group/alignment
    **/
    this.createLoyaltyAttribute = async function(src_name, src_ref, target_player, dur, subtype = "alignment", target = "") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "loyalty", subtype, target);
    }
    
    /**
    Create Redirection Attribute
    creates a redirection attribute to another player
    **/
    this.createRedirectionAttribute = async function(src_name, src_ref, target_player, dur, target = "", source = "", type = "all") {
        await createAttribute(src_name, src_ref, target_player, "player", dur, "redirection", target, source, type);
    }
    
    
    /** PUBLIC
    Get role attribute's player id
    **/
    this.roleAttributeGetPlayer = function(channel_id) {
        return sqlPromOneEsc("SELECT active_attributes.ai_id,players.id FROM players INNER JOIN active_attributes ON players.id = active_attributes.owner WHERE players.type='player' AND active_attributes.attr_type='role' AND active_attributes.val2=", channel_id);
    }
    
    /**
    Create Poll Count Attribute
    creates a poll count attribute
    **/
    this.createPollCountAttribute = async function(src_name, src_ref, target_poll, dur, poll =  "lynch", poll_count = 1) {
        await createAttribute(src_name, src_ref, target_poll, "poll", dur, "poll_count", poll, poll_count);
    }
    
    /**
    Create Poll Result Attribute
    creates a poll result attribute
    **/
    this.createPollResultAttribute = async function(src_name, src_ref, target_poll, dur, poll =  "lynch", subtype = "cancel", target = "", subtype2 = "") {
        await createAttribute(src_name, src_ref, target_poll, "poll", dur, "poll_result", poll, subtype, target, subtype2);
    }
    
    /**
    Create Poll Disqualification Attribute
    creates a poll disqualification attribute
    **/
    this.createPollDisqualificationAttribute = async function(src_name, src_ref, target_poll, dur, poll = "lynch", subtype = "disqualified", target = "") {
        await createAttribute(src_name, src_ref, target_poll, "poll", dur, "poll_disqualification", poll, subtype, target);
    }
    
    /**
    Create Poll Votes Attribute
    creates a poll votes attribute
    **/
    this.createPollVotesAttribute = async function(src_name, src_ref, target_poll, dur, poll = "lynch", subtype = "visible", target = "", val = 0) {
        await createAttribute(src_name, src_ref, target_poll, "poll", dur, "poll_votes", poll, subtype, target, val);
    }
    
    /**
    gets all generic attributes from a player
    **/
    this.getGenericAttributes = async function(owner) {
        let found = await sqlPromEsc("SELECT * FROM active_attributes WHERE owner=", owner);
        if(found.length > 0) return found;
        else return [];
    }
}
/**
    Abilities Module - Loyalty
    The module for implementing loyalty
**/

module.exports = function() {
    
    /**
    Ability: Loyalty
    **/
    this.abilityLoyalty = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Loyalty failed! " + abilityError, success: false };
        }
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Loyalty failed! " + abilityError, success: false };
            break;
            case "group":
                // parse parameters
                let targetGroup = await parseGroup(ability.target, src_ref, additionalTriggerData);
                result = await loyaltyGeneric(src_name, src_ref, targetGroup, "group");
                return result;
            break;
            case "alignment":
                let targetAlignment = await parseAlignment(ability.target, src_ref, additionalTriggerData);
                result = await loyaltyGeneric(src_name, src_ref, targetAlignment, "alignment");
                return result;
            break;
        }
    }
    
    /**
    Ability: Loyalty - Group/Alignment
    adds a loyalty attribute to a player
    **/
    this.loyaltyGeneric = async function(src_name, src_ref, target, loyaltyType) {
        // check target count
        if(target.length != 1) {
            abilityLog(`❗ **Error:** Can only be loyal to exactly one target at a time!`);
            return { msg: "Loyalty failed! " + abilityError, success: false };
        }
        // create loyalty attribute
        await createLoyaltyAttribute(src_name, src_ref, srcToValue(src_ref), "permanent", loyaltyType, target[0]);
        abilityLog(`✅ <@${srcToValue(src_ref)}> is now loyal to \`${srcRefToText(loyaltyType + ':' + target[0])}\`.`);
        return { msg: "Loyalty succeeded!", success: true, target: src_ref };
    }
    
    /**
    Returns loyalties
    **/
    this.getAllLoyalties = async function(player_id) {
        let allLoyalties = await queryAttributePlayer(player_id, "attr_type", "loyalty"); // get all loyalties
        return allLoyalties;
    }
    
    /**
    Checks if somebody is loyal
    **/
    this.isLoyal = async function(player_id) {
        let loyalties = await getAllLoyalties(player_id);
        return loyalties.length > 0;
    }
    
}
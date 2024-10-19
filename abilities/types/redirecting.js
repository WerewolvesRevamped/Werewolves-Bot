/**
    Abilities Module - Redirecting
    The module for implementing redirecting
**/

module.exports = function() {
    
    /**
    Ability: Redirecting
    **/
    this.abilityRedirecting = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.subtype || !ability.source) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Redirecting failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parsePlayerSelector(ability.target, src_ref, additionalTriggerData);
        let abilityType = await parseSelector(ability.subtype, src_ref, additionalTriggerData);
        let duration = parseDuration(ability.duration ?? "permanent");
        // check parameters
        if(target.length != 1) {
            abilityLog(`❗ **Error:** Can only redirect to exactly 1 player!`);
            return { msg: "Redirecting failed! " + abilityError, success: false };
        }
        // check parameters
        if(abilityType.value.length != 1) {
            abilityLog(`❗ **Error:** Invalid ability type for redirection!`);
            return { msg: "Redirecting failed! " + abilityError, success: false };
        }
        // select subtype
        result = await redirecting(src_name, src_ref, target[0], ability.source, ability.subtype, duration);
        return result;

    }
    
    /**
    Ability: Manipulating - Absolute/Relative
    adds a vote manipulation to a player
    **/
    this.redirecting = async function(src_name, src_ref, target, source, type, duration) {
        await createRedirectionAttribute(src_name, src_ref, srcToValue(src_ref), duration, target, source, type);
        abilityLog(`✅ <@${srcToValue(src_ref)}> now has a redirection for \`${type}\` to <@${target}> affecting \`${source}\` for \`${getDurationName(duration)}\`.`);
        return { msg: "Redirecting succeeded!", success: true, target: `player:${target}` };
    }
    
    /**
    Get all redirections
    **/
    this.getRedirections = async function(player_id) {
        let allRedirections = await queryAttributePlayer(player_id, "attr_type", "redirection"); // get all redirections
        if(allRedirections.length <= 0) return []; // no manipulations
        return allRedirections;
    }
    
    /**
    Apply redirection
    **/
    this.applyRedirection = async function(target, sourceAny, abilityType, abilitySubtype) {
        // allow both direct id types as well as player:<id> format
        let sourceSplit = sourceAny.split(":");
        let source = sourceSplit.length === 2 ? sourceSplit[1] : sourceAny;
        
        // allow both singular targets as well as target arrays
        if(Array.isArray(target)) {
            for(let i = 0; i < target.length; i++) {
                target[i] = await applyRedirectionOnce(target[i], source, abilityType, abilitySubtype);
            }
            return target;
        } else {
            return await applyRedirectionOnce(target, source, abilityType, abilitySubtype);
        }
    }
    
    this.applyRedirectionOnce = async function(target, source, abilityType, abilitySubtype) {
        //console.log(`Checking Redirections for ${target} from ${source} with ${abilitySubtype} ${abilityType}`);
        let targetRedirections = await getRedirections(target);
        let parsedAbilityType = parseAbilityType(abilityType);
        let parsedAbilitySubype = parseAbilitySubtype(abilitySubtype + " " + abilityType);
        let filteredRedirections = [];
        for(let i = 0; i < targetRedirections.length; i++) {
            let validSources = await parsePlayerSelector(targetRedirections[i].val2);
            let type = await parseSelector(targetRedirections[i].val3);
            let typeMatch = false;
            // check if there is a type match
            switch(type.type) {
                case "abilityCategory":
                    if(type.value[0] === "all") typeMatch = true;
                    else if(type.value[0] === "non-killing abilities" && parsedAbilityType != "killing") typeMatch = true;
                break;
                case "abilityType":
                    if(type.value[0] === parsedAbilityType) typeMatch = true;
                break;
                case "abilitySubtype":
                    if(type.value[0] === parsedAbilitySubype) typeMatch = true;
                break;
            }
            // check if there is a source match
            let sourceMatch = false;
            if(validSources.includes(source)) sourceMatch = true;
            // save if both match
            //console.log(`Checking Redirection for ${targetRedirections[i].ai_id}: type match? ${typeMatch}; source match? ${sourceMatch}`);
            if(typeMatch && sourceMatch) filteredRedirections.push(targetRedirections[i].val1);
        }
        // return last redirection if applicable - otherwise return normal target
        if(filteredRedirections.length > 0) {
            let newTarget = filteredRedirections[filteredRedirections.length - 1];
            //console.log(`Redirected from ${target} to ${newTarget}!`);
            abilityLog(`✅ Redirected from <@${target}> to <@${newTarget}>!`);
            return newTarget;
        } else {
            //console.log(`Did not redirect ${target}!`);
            return target;
        }
    }
    
    
}
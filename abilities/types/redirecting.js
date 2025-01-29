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
        let abilityType = await parseSelector(ability.subtype, src_ref, additionalTriggerData);
        let duration = parseDuration(ability.duration ?? "permanent");
        // check parameters
        if(abilityType.value.length != 1) {
            abilityLog(`❗ **Error:** Invalid ability type for redirection!`);
            return { msg: "Redirecting failed! " + abilityError, success: false };
        }
        // select subtype
        result = await redirecting(src_name, src_ref, ability.target, ability.source, ability.subtype, duration);
        return result;

    }
    
    /**
    Ability: Redirecting
    adds a redirection attribute
    **/
    this.redirecting = async function(src_name, src_ref, target, source, type, duration) {
        await createRedirectionAttribute(src_name, src_ref, srcToValue(src_ref), duration, target, source, type);
        abilityLog(`✅ <@${srcToValue(src_ref)}> now has a redirection for \`${type}\` to \`${target}\` affecting \`${source}\` for \`${getDurationName(duration)}\`.`);
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
    this.applyRedirection = async function(target, sourceAny, abilityType = "", abilitySubtype = "", additionalTriggerData = {}) {
        if(!target) return target;
        if(additionalTriggerData.parameters && additionalTriggerData.parameters.direct) return target; // cannot redirect a direct ability
        // allow both direct id types as well as player:<id> format
        let sourceSplit = sourceAny.split(":");
        let source = sourceSplit.length === 2 ? sourceSplit[1] : sourceAny;
        
        // allow both singular targets as well as target arrays
        if(target.value && Array.isArray(target.value)) { // .value array
            for(let i = 0; i < target.value.length; i++) {
                target.value[i] = await applyRedirectionOnce(target.value[i], source, abilityType, abilitySubtype);
            }
            return target;
        } else if(Array.isArray(target)) { // ARRAY
            for(let i = 0; i < target.length; i++) {
                target[i] = await applyRedirectionOnce(target[i], source, abilityType, abilitySubtype);
            }
            return target;
        } else { // SINGLE VALUE
            return await applyRedirectionOnce(target, source, abilityType, abilitySubtype);
        }
    }
    
    this.applyRedirectionOnce = async function(target, source, abilityType, abilitySubtype) {
        // whispering is always immune
        if(abilityType === "whispering") {
            return target;
        }
        //console.log(`Checking Redirections for ${target} from ${source} with ${abilitySubtype} ${abilityType}`);
        let targetRedirections = await getRedirections(target);
        let parsedAbilityType = parseAbilityType(abilityType);
        abilitySubtype = abilitySubtype.replace(/ /g, "-"); // remove spaces
        let parsedAbilitySubype = abilitySubtype ? parseAbilitySubtype(abilitySubtype + " " + abilityType) : "none none";
        let filteredRedirections = [];
        for(let i = 0; i < targetRedirections.length; i++) {
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
            let validSources = await parsePlayerSelector(targetRedirections[i].val2, `player:${source}`);
            let sourceMatch = false;
            if(validSources.includes(source)) sourceMatch = true;
            // save if both match
            //console.log(`Checking Redirection for ${targetRedirections[i].ai_id}: type match? ${typeMatch}; source match? ${sourceMatch}`);
            if(typeMatch && sourceMatch) {
                let newTarget = await parsePlayerSelector(targetRedirections[i].val1, `player:${target}`);
                //console.log(targetRedirections[i].val1, `player:${source}`, newTarget);
                if(newTarget.length > 1) abilityLog(`❗ **Error:** Attempted to redirect to several players, picked first player!`);
                if(newTarget.length === 0) abilityLog(`❗ **Error:** Attempted to redirect to no player!`);
                filteredRedirections.push([newTarget[0],targetRedirections[i].ai_id]);
            }
        }
        // return last redirection if applicable - otherwise return normal target
        if(filteredRedirections.length > 0) {
            let newTarget = filteredRedirections[filteredRedirections.length - 1];
            if(!newTarget[0]) {
                abilityLog(`❎ Could not redirect as target was invalid!`);
                return target;
            }
            //console.log(`Redirected from ${target} to ${newTarget}!`);
            abilityLog(`✅ Redirected from <@${target}> to <@${newTarget[0]}>!`);
            await useAttribute(newTarget[1]);
            await triggerPlayer(target, "On Redirect", { visitor: source }); 
            return await applyRedirectionOnce(newTarget[0], source, abilityType, abilitySubtype); // recursively redirect 
        } else {
            //console.log(`Did not redirect ${target}!`);
            return target;
        }
    }
    
    
}
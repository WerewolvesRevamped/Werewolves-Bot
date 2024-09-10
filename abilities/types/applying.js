/**
    Abilities Module - Applying
    The module for implementing applying ability type
**/

module.exports = function() {
    
    /**
    Ability: Applying
    **/
    this.abilityApplying = async function(src_ref, src_name, ability, additionalTriggerData) {
        let result;
        // check parameters
        if(!ability.target || !ability.attribute) {
            abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
            return { msg: "Applying failed! " + abilityError, success: false };
        }
        // parse parameters
        let target = await parseSelector(ability.target, src_ref, additionalTriggerData);
        
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Applying failed! " + abilityError, success: false };
            break;
            case "add":
                // check parameters
                if(!ability.duration) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
                    return { msg: "Applying failed! " + abilityError, success: false };
                }
                let attr = parseAttributeSelector(ability.attribute, src_ref, additionalTriggerData);
                // can only apply a single attribute
                if(attr.length != 1) {
                    abilityLog(`❗ **Error:** Tried to apply ${attr.length} attributes!`);
                    return { msg: "Applying failed! " + abilityError, success: false };
                }
                attr = attr[0];
                let duration = parseDuration(ability.duration ?? "permanent");
                result = await applyingAdd(src_name, src_ref, target, attr, duration, ability.val1 ?? "", ability.val2 ?? "", ability.val3 ?? "");
                return result;
            break;
            case "remove":
                result = await applyingRemove(src_name, src_ref, target, ability.attribute);
                return result;
            break;
        }
    }
    
    
    /**
    Ability: Applying - Add
    adds an attribute to a player
    **/
    this.applyingAdd = async function(src_name, src_ref, targets, attr, duration, val1, val2, val3) {
        // iterate through targets
        for(let i = 0; i < targets.value.length; i++) {
            await createCustomAttribute(src_name, src_ref, targets.value[i], targets.type, duration, attr, val1, val2, val3);
            abilityLog(`✅ ${srcRefToText(targets.type + ':' + targets.value[i])} had ${attr} applied for \`${getDurationName(duration)}\`.`);
            // run Starting trigger
            let latestCustomAttr = await queryAttribute("attr_type", "custom");
            await triggerAttribute(latestCustomAttr[latestCustomAttr.length - 1].ai_id, "Starting");
            // return result
            if(targets.value.length === 1) return { msg: "Applying succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
        }
        return { msg: "Applyings succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
    }
    
    /**
    Ability: Applying - Remove
    removes an attribute from a player
    **/
    this.applyingRemove = async function(src_name, src_ref, targets, attribute) {
        let failures = 0;
        let successes = 0;
        // iterate through targets
        for(let i = 0; i < targets.value.length; i++) {
            let attr = parseActiveAttributeSelector(attribute, src_ref, {}, `${targets.type}:${targets.value[i]}`);
            // can only apply a single attribute
            if(attr.length === 0) {
                abilityLog(`❗ **Error:** Tried to unapply no attributes!`);
                failures++;
                continue;
            }
            for(let j = 0; j < attr.length; j++) {
                await deleteAttribute(attr[j].ai_id); // delete the attribute
                abilityLog(`✅ ${srcRefToText(targets.type + ':' + targets.value[i])} had ${attr[j].name} (Attr-${attr[j].ai_id}) unapplied${j>0?' x'+(j+1):''}.`);
            }
            // return result
            if(targets.value.length === 1) return { msg: "Unapplying succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
            successes++;
        }
        // feedback
        if(successes === 0) return { msg: "Unapplying failed! " + abilityError, success: false };
        else if(failures === 0) return { msg: "Unapplyings succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
        else return { msg: `${successes} unapplyings succeeded, ${failures} unapplyings failed!`, success: true, target: `${targets.type}:${targets.value[0]}` };
    }

    
    
}
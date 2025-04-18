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
        if(target.type === "activeAttribute") {
            target.value = target.value.map(el => el.ai_id);
            target.type = "attribute";
        }
        target = await applyRedirection(target, src_ref, ability.type, ability.subtype, additionalTriggerData);
        
        
        // select subtype
        switch(ability.subtype) {
            default:
                abilityLog(`❗ **Error:** Unknown ability subtype \`${ability.subtype}\`!`);
                return { msg: "Applying failed! " + abilityError, success: false };
            break;
            case "add":
                let attr = parseAttributeSelector(ability.attribute, src_ref, additionalTriggerData);
                // can only apply a single attribute
                if(attr.length != 1) {
                    abilityLog(`❗ **Error:** Tried to apply ${attr.length} attributes!`);
                    return { msg: "Applying failed! " + abilityError, success: false };
                }
                attr = attr[0];
                let duration = parseDuration(ability.duration ?? "permanent");
                result = await applyingAdd(src_name, src_ref, target, attr, duration, ability.val1 ?? "", ability.val2 ?? "", ability.val3 ?? "", additionalTriggerData);
                return result;
            break;
            case "remove":
                result = await applyingRemove(src_name, src_ref, additionalTriggerData, target, ability.attribute);
                return result;
            break;
            case "change":
                // check parameters
                if(!ability.attr_index || !ability.attr_value) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
                    return { msg: "Applying failed! " + abilityError, success: false };
                }
                // check index
                let index = +ability.attr_index;
                if(index < 1 || index > 3) {
                    abilityLog(`❗ **Error:** Invalid index for change applying!`);
                    return { msg: "Applying failed! " + abilityError, success: false };
                }
                result = await applyingChange(src_name, src_ref, target, ability.attribute, index, ability.attr_value, additionalTriggerData);
                return result;
            break;
            case "change_parsed":
                // check parameters
                if(!ability.attr_index || !ability.attr_value) {
                    abilityLog(`❗ **Error:** Missing arguments for type \`${ability.type}\`!`);
                    return { msg: "Applying failed! " + abilityError, success: false };
                }
                let valueParsed = await parseSelector(ability.attr_value, src_ref, additionalTriggerData);
                // check index
                let index2 = +ability.attr_index;
                if(index2 < 1 || index2 > 3) {
                    abilityLog(`❗ **Error:** Invalid index for change applying!`);
                    return { msg: "Applying failed! " + abilityError, success: false };
                }
                result = await applyingChange(src_name, src_ref, target, ability.attribute, index2, `${valueParsed.value[0]}[${valueParsed.type}]`, additionalTriggerData);
                return result;
            break;
        }
    }
    
    
    /**
    Ability: Applying - Add
    adds an attribute to a player
    **/
    this.applyingAdd = async function(src_name, src_ref, targets, attr, duration, val1, val2, val3, additionalTriggerData) {
        // apply variables
        val1 = await applyVariables(val1);
        val2 = await applyVariables(val2);
        val3 = await applyVariables(val3);
        // iterate through targets
        for(let i = 0; i < targets.value.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets.value[i], attr, NO_SND_VISIT_PARAM, "applying", "add");
                if(result) {
                    if(targets.value.length === 1) return visitReturn(result, "Applying failed!", "Applying succeeded!");
                    continue;
                }
            }
            
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
    this.applyingRemove = async function(src_name, src_ref, additionalTriggerData, targets, attribute) {
        let failures = 0;
        let successes = 0;
        let attrName = parseAttributeSelector(attribute, src_ref, additionalTriggerData, true);
        let activeAttr = false;
        if(!attrName || !attrName[0]) {
            activeAttr = true;
        }

        // iterate through targets
        for(let i = 0; i < targets.value.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets.value[i], attrName[0], NO_SND_VISIT_PARAM, "applying", "remove");
                if(result) {
                    if(targets.value.length === 1) return visitReturn(result, "Unapplying failed!", "Unapplying succeeded!");
                    if(result.success) successes++;
                    else failures++;
                    continue;
                }
            }
            
            // does not have attribute, so no removal needed
            if(!activeAttr && !hasCustomAttribute(`${targets.type}:${targets.value[i]}`, attrName[0])) {
                abilityLog(`✅ ${srcRefToText(targets.type + ':' + targets.value[i])} does not have ${attrName[0]}, unapplying skipped.`);
                // failure for single target unapplying; success for multi target unapplying
                if(targets.value.length === 1) return { msg: "Unapplying failed!", success: false, target: `${targets.type}:${targets.value[0]}` };
                successes++;
                continue;
            }
            // get attribute
            let attr = await parseActiveAttributeSelector(attribute, src_ref, {}, `${targets.type}:${targets.value[i]}`);
            // can only apply a single attribute
            if(!activeAttr && attr.length === 0) {
                abilityLog(`❗ **Error:** Tried to unapply no attributes!`);
                failures++;
                continue;
            }
            for(let j = 0; j < attr.length; j++) {
                if(attr[j].type === "custom") await triggerAttribute(attr[j].ai_id, "On Removal"); // on removal trigger
                await deleteAttribute(attr[j].ai_id); // delete the attribute
                abilityLog(`✅ ${srcRefToText(targets.type + ':' + targets.value[i])} had ${attr[j].name} (Attr-${attr[j].ai_id}) unapplied${j>0?' x'+(j+1):''}.`);
            }
            // return result
            if(targets.value.length === 1) return { msg: "Unapplying succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
            successes++;
        }
        // feedback
        if(successes === 0) return { msg: "Unapplying failed!", success: false };
        else if(failures === 0) return { msg: "Unapplyings succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
        else return { msg: `${successes} unapplyings succeeded, ${failures} unapplyings failed!`, success: true, target: `${targets.type}:${targets.value[0]}` };
    }
    
    /**
    Ability: Applying - Change
    changes an attribute for a player
    **/
    this.applyingChange = async function(src_name, src_ref, targets, attribute, index, val, additionalTriggerData) {
        let failures = 0;
        let successes = 0;
        // iterate through targets
        for(let i = 0; i < targets.value.length; i++) {
            // handle visit
            if(additionalTriggerData.parameters.visitless !== true) {
                let result = await visit(src_ref, targets.value[i], attribute, index, "applying", "change");
                if(result) {
                    if(targets.value.length === 1) return visitReturn(result, "Attribute changing failed!", "Attribute changing succeeded!");
                    if(result.success) successes++;
                    else failures++;
                    continue;
                }
            }
            
            let attr = await parseActiveAttributeSelector(attribute, src_ref, {}, `${targets.type}:${targets.value[i]}`);
            // can only apply a single attribute
            if(attr.length === 0) {
                abilityLog(`❗ **Error:** Tried to change no attributes!`);
                failures++;
                continue;
            }
            for(let j = 0; j < attr.length; j++) {
                await setCustomAttributeValue(attr[j].ai_id, index, val); // update attribute
                abilityLog(`✅ ${srcRefToText(targets.type + ':' + targets.value[i])} had ${attr[j].name} (Attr-${attr[j].ai_id})'s value \`${index}\` updated to \`${val}\`.`);
            }
            // return result
            if(targets.value.length === 1) return { msg: "Attribute changing succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
            successes++;
        }
        // feedback
        if(successes === 0) return { msg: "Attribute changings failed! " + abilityError, success: false };
        else if(failures === 0) return { msg: "Attribute changings succeeded!", success: true, target: `${targets.type}:${targets.value[0]}` };
        else return { msg: `${successes} attribute changings succeeded, ${failures} attribute changings failed!`, success: true, target: `${targets.type}:${targets.value[0]}` };
    }

    
    
}
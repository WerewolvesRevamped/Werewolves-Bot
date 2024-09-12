/**
	Utility Module - Main
    This module has general utility functions
*/

require("./sql.js")();
require("./commands.js")();
require("./permissions.js")();
require("./discord.js")();
require("./web.js")();
require("./levenshtein.js")();
require("./help.js")();

module.exports = function() {
    
    this.mainGuild = null;
    this.backupChannelId = null;
    
    /**
    Set Main Guild
    makes the main guild available as a global object so we dont need to pass a reference everywhere
    **/
    this.setMainGuild = async function() {
        mainGuild = await global.client.guilds.fetch(config.guild);
        backupChannelId = config.channel;
    }
    
	/**
    to Title Case
    Converts a string to title case
    */
	this.toTitleCase = function(str) {
		return str.replace(/[a-zA-Z0-9][^\s-_]*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
	}    	
    
    /**
    PHP Escape
    Replaces php keywords so they do not show up in discord syntax highlighting
    **/
	this.phpEscape = function(txt) {
		return txt.replace(/(and|list|from|switch|Public|or|new|as|New|Use|While)/g, el => el.substr(0, 1) + "​" + el.substr(1));
	}
    
	
    /**
    to Sentence Case
    Capitalizes the first word of a sentence (assuming all sentences terminate with a '.')
    */
	this.toSentenceCase = function(str) {
		return str.split(". ").map(el => el.length > 1 ? el.charAt(0).toUpperCase() + el.substr(1): el).join(". ");
	}
	
	/**
    Chunk Array
    Chunks an array into chunks of the same size
    */ 
	this.chunkArray = function(inArray, size) {
	  var outArray = [];
	  for(let i = 0; i < inArray.length; i += size) {
		outArray.push(inArray.slice(i, i + size));
	  }
	  return outArray;
	}

	/**
    Get Time
    Get current time in seconds
    */
	this.getTime = function() {
		return Math.round(new Date().getTime() / 1000);
	}

	/**
    Remove Duplicates
    Remove duplicates from an array
    */
	this.removeDuplicates = function(inArray) {
		return inArray.filter((el, index, array) => array.indexOf(el) === index);
	}
	
	/**
    Shuffle Array
    Shuffles an array
    */
	this.shuffleArray = function(array) {
        for(var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    /**
    Sleep
    Wait for a specified amount of MS
    **/
	this.sleep = function(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

    /**
    Deep Equal
    Utility - Checks if two objects are the same
    **/
    this.deepEqual = function(object1, object2) {
        const keys1 = Object.keys(object1);
        const keys2 = Object.keys(object2);

        if(keys1.length !== keys2.length) {
            return false;
        }

        for(const key of keys1) {
            const val1 = object1[key];
            const val2 = object2[key];
            const areObjects = isObject(val1) && isObject(val2);
            if (
                areObjects && !deepEqual(val1, val2) ||
                !areObjects && val1 !== val2
            ) {
                return false;
            }
        }

        return true;
    }
    
    /**
    is Object?
    Checks if something is an object, part of deep equal
    **/
    this.isObject = function(object) {
      return object != null && typeof object === 'object';
    }

    /**
    Deep Copy
    Does a deep copy by json stringifying & parsing
    **/
    this.deepCopy = function(el) {
        return JSON.parse(JSON.stringify(el));
    }
    
    /**
    Get Time
    returns unix time stamp in seconds
    **/
    this.getTime = function() {
        return Math.floor(Date.now()/1000);
    }

}

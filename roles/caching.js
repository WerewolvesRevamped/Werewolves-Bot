/**
    Roles Module - Caching
    The module for WWR roles
**/

module.exports = function() {

    /**
    Global Role Values
    **/
    this.cachedRoles = [];
    this.cachedGroups = [];
    this.cachedAttributes = [];
    this.cachedSets = [];
    this.cachedCategories = [];
    this.cachedClasses = [];
    this.cachedAliases = [];
    this.cachedInfoNames = [];
    this.iconLUT = [];
    this.colorsLUT = [];
    
    
    /**
    Cache Roles
    caches the current state of the roles database
    **/
    this.cacheRoles = function() {
		sql("SELECT name FROM roles", result => {
				cachedRoles = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache role!");
		});
	}
    
    /**
    Cache Groups
    caches the current state of the groups database
    **/
    this.cacheGroups = function() {
		sql("SELECT name FROM `groups`", result => {
				cachedGroups = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache groups!");
		});
	}
    
    /**
    Cache Attributes
    caches the current state of the attributes database
    **/
    this.cacheAttributes = function() {
		sql("SELECT name FROM attributes", result => {
				cachedAttributes = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache attributes!");
		});
	}
    
    /**
    Cache Sets
    caches the current state of the sets database
    **/
    this.cacheSets = function() {
		sql("SELECT name FROM sets", result => {
				cachedSets = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache sets!");
		});
	}
    
    /**
    Cache Categories
    caches all categories
    **/
    this.cacheCategories = function() {
		sql("SELECT DISTINCT category FROM roles", result => {
				cachedCategories = result.map(el => el.category);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache categories!");
		});
	}
    
    /**
    Cache Classes
    caches all classes
    **/
    this.cacheClasses = function() {
		sql("SELECT DISTINCT class FROM roles", result => {
				cachedClasses = result.map(el => el.class);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache classes!");
		});
	}
    
    /**
    Cache Info Names
    caches the current state of the roles database
    **/
    this.cacheInfoNames = function() {
		sql("SELECT name FROM info", result => {
				cachedInfoNames = result.map(el => el.name);
		}, () => {
			log("Roles > ❗❗❗ Unable to cache info names!");
		});
	}
    
    /**
    Cache Aliases
    Cache role aliases
    */
	this.cacheAliases = function() {
		sql("SELECT alias,name FROM roles_alias", result => {
				cachedAliases = result;
		}, () => {
			log("Roles > ❗❗❗ Unable to cache role aliases!");
		});
	}
    
    /** 
    Cache Role Info
    runs all relevant caching functions
    */
    this.cacheRoleInfo = function() {
		cacheAliases();
		cacheRoles();
        cacheGroups();
        cacheAttributes();
        cacheInfoNames();
        cacheSets();
        cacheCategories();
        cacheClasses();
        cacheDisplays();
	}
    
    
    /**
    Cache Icon LUT (Look Up Table)
    A lookup table for role names to icons
    **/
    this.cacheIconLUT = async function() {
        const body = await fetchBody(iconLUTPath);
        iconLUT = {};
        body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => iconLUT[el[0]] = urlConv(el[1].trim()));
        //console.log(iconLUT);
    }
    
    /**
    Apply Icon LUT
    Applies the icon lut and returns a stripped version of the name
    **/
    this.applyLUT = function(name) {
        let val = name.replace(/\<\?[\w\d]*:[^>]{0,10}\>/g,"").trim(); // remove emoji placeholders
        val = val.toLowerCase().replace(/[^a-z ]/g,"").trim();
        //if(!iconLUT[val]) console.log(`look lut, failed: "${val}"`);
        return iconLUT[val] ?? false;
    }
    
    /**
    Cache Colors LUT (Look Up Table)
    A lookup table for team names to colors
    **/
    this.cacheColorsLUT = async function() {
        const body = await fetchBody(colorsLUTPath);
        colorsLUT = {};
        body.split("\n").filter(el => el && el.length).map(el => el.split(",")).forEach(el => colorsLUT[el[0].toLowerCase()] = el[6]);
        //console.log(colorsLUT);
    }
    
    /**
    Get Team Color
    Retrieves a team color using the icon lut
    **/
    this.getTeamColor = function(team) {
        let teamColor = colorsLUT[team];
        if(!teamColor) {
            teamColor = 7829367;
            log(`Missing Color. Team: ${team}`);
        }
        return teamColor;
    }
     
}
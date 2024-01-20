/**
	Utility Module - Levenshtein Distance
    This module has the functions for the levenshtein distance
*/
module.exports = function() {
       
	/**
    String Distance
	returns a value for how many edits (additions, removals, replacements) are necessary to turn one string into another
	this means it basically gives a score on how close two strings are, with closer values being better
    known as "levenshtein distance"
    **/
	this.strDst = function (str1 = "", str2 = "") {
	    // create empty matrix, with row 1 and column 1 filled with incrementing numbers
	    var len1 = str1.length, len2 = str2.length;
	    var track = Array(len2 + 1).fill().map((_, ind1) => 
		Array(len1 + 1).fill().map((_, ind2) =>
		    !ind1 ? ind2 : (!ind2 ? ind1 : null)
		)
	    );
	    // determine levenshtein distance
	    for(let j = 1; j <= len2; j++) {
		for(let i = 1; i <= len1; i++) {
		    const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
		    track[j][i] = Math.min(
			track[j][i - 1] + 1, // deletion
			track[j - 1][i] + 1, // insertion
			track[j - 1][i - 1] + indicator // substitution
		    );
		}
	    }
	    return track[len2][len1];
	};

    /**
    Find Best Match
	finds the best match for arg1 in the list arg2
    **/
	this.findBestMatch = function(name = "", list = []) {
	    let w = list.map(p => strDst(p, name));
	    // get index of closest match (lowest weight)
	    let best = w.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0);
	    return {value: w[best], index: best, name: list[best]};
	}
    
}
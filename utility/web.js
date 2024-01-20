/**
	Utility Module - Web Interactions
    This module has utility functions related to web interactions
*/
module.exports = function() {
       
    /**
    Fetch Library
    **/
    const fetch = require('node-fetch');

    /**
    Check if URL exists
    Checks if a url exists using the fetch library
    **/
    this.checkUrlExists = async function(url) {
        const response = await fetch(url, {
            method: 'HEAD'
        });
        return response.ok;
    }
        
    /**
    Fetch Body
    Uses the fetch library to fetch a url and return the body as text
    **/
    this.fetchBody = async function(url, args = {}) {
        const response = await fetch(url, args);
        const body = await response.text();
        return body;
    }

}
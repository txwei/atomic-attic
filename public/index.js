/*
 * Author: Tianxiao Wei
 * CS 132 Spring 2022
 * Date: May 14th, 2022
 * This is the script.js for CP3. This file contains functions to fetch character information from
 * the breaking bad api and display on page.
 */

(function(){
  "use strict";

  const BASE_URL = "http://localhost:8000/";
  

  /**
   * Sets up a button click event handler to search the character
   * Also allows enter key presses to call the event handler
   */
  function init() {
    // search();
  }

  /**
   * Searches from the Breaking Bad API and displays results
   */
  async function search() {
    // Clear search results
    id("search-result").innerHTML = "";
    // Get the API endpoint
    const target = 'boron';
    // If no input, a random character is generated
    let search_url = BASE_URL + target
    try {
      // Fetch data, check status and get JSON data
      let resp = await fetch(search_url);
      resp = checkStatus(resp);
      const data = await resp.text();
      // Display search results
      id("search-result").textContent = data;
    } catch (err) {
    }
  }

  init();
})();
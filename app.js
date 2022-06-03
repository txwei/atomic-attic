"use strict";
// Loading required modules
const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.static("public"));
app.use(cors());

const ELEMENTS_LOOKUP = require("./elements-lookup.json");
const ELEMENTS = require("./elements.json")["elements"];
const FAQ = require("./faq.json");

const NUMERIC_PROPERTIES = ["atomic_mass", "boil", "density", "melt", "molar_heat", "number", "period"];
const STRING_PROPERTIES = ["name", "appearance", "category", "phase", "symbol"];

const CLIENT_ERR_CODE = 400;

// GET endpoints
app.get("/elements", getAllElements);
app.get("/element/:element", searchElement);
app.get("/search", checkParameters, search);
app.get("/faqs", getFAQs);
app.use(errorHandler);

// -------------------- Searching Functions for Endpoints -------------------- //

/**
 * This function sends out the json response of the request from the FAQs json
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} next - next
 * @returns none
 */
function getFAQs(req, res, next) {
  res.send(FAQ)
}

/**
 * This function sends out an object that contains the name, symbol, and atomic number of 
 * every single element that we are selling
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} next - next
 * @returns none
 */
function getAllElements(req, res, next) {
  let result = simplifyOutput(ELEMENTS);
  res.type("json");
  res.send(result);
}

/**
 * This function sends out the json response containing all of the details for
 * the specific element that we are requesting from the API
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} next - next
 * @returns none
 */
function searchElement(req, res, next) {
  let elem = req.params["element"];
  let err;
  if (!elem) {
    err = Error("Missing required element parameter.");
    next(err);
  }
  else {
    // if passed in a string
    if (isNaN(elem)) {
      res.type("json");

      // if passed in element full name
      if (elem.length > 2) {
        res.send(ELEMENTS_LOOKUP[elem.toLowerCase()]);
      }

      // if passed in element symbol
      else {
        const result = searchByKeyValue("symbol", elem);
        res.send(result[0]);
      }
    }

    // if passed in element atomic number
    else {
      elem = parseFloat(elem);
      if (elem < 1 || elem > 119) {
        err = Error("Element atomic number is out of range.");
        next(err);
      } else if (!Number.isInteger(elem)) {
        err = Error("Element atomic number must be an integer.");
        next(err);
      } else {
        res.type("json");
        res.send(ELEMENTS[elem - 1]);
      }
    }
  }
}

/**
 * This function allows for us to search from a list of elements by a specific range
 * such as boiling point of the element
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} next - next
 * @returns none
 */
function search(req, res, next) {
  let attrs = req.query["attr"];
  let values = req.query["value"];
  let sort = req.query["sort"];
  let dir = req.query["dir"];
  let elements = ELEMENTS;

  if (attrs) {
    attrs = attrs.split(" ");
    values = values.split(" ");

    // search by attributes and values passed in
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i]
      let value = values[i].split(",")

      // if search attr by a single value
      if (value.length === 1) {
        elements = searchByKeyValue(attr, value[0], elements);
      } else {
        elements = searchByKeyRange(attr, value[0], value[1], elements);
      }
    }
  }

  // sort by attribute and direction passed in
  if (sort) {
    // only sort in the descending order if passed dir is -1, 
    // otherwise sort in the ascending order
    if (parseInt(dir) !== -1) {
      dir = 1;
    }
    elements = sortByKey(sort, dir, elements);
  }

  // simplify the output json to contain only basic information
  elements = simplifyOutput(elements);
  res.type("json");
  res.send(elements);
}

/**
 * This function returns the groups of elements that are being searched by a key
 * value pair 
 * @param {Object} key - key we are using to search
 * @param {String} value - value we are looking for
 * @param {Object} elements - list of elements to search from
 * @returns result
 */
function searchByKeyValue(key, value, elements = ELEMENTS) {
  let result = [];
  for (let elem of elements) {
    if (elem[key].toString().toLowerCase() === value.toLowerCase()) {
      result.push(elem);
    }
  }
  return result;
}

/**
 * This is similar to the KeyValueSearch except that now it takes in a range of values instead
 * of a specific value
 * @param {*} key - key we are searching with
 * @param {*} minValue - min value of the range
 * @param {*} maxValue - max value of the range
 * @param {*} elements - list of elements we are searching with
 * @returns result
 */
function searchByKeyRange(key, minValue, maxValue, elements = ELEMENTS) {
  let result = [];
  for (let elem of elements) {
    const value = parseFloat(elem[key])
    if (value >= minValue && value <= maxValue) {
      result.push(elem);
    }
  }
  return result;
}

// -------------------- Sorting Functions for Endpoints -------------------- //

/**
 * This function sorts the elements based off of a specific key into largest to smallest or smallest
 * to largest
 * @param {Object} key - key to be sorted by
 * @param {Number} dir - direction that we will be sorting by, +1 being higher to lower,
 * -1 being lower to higher
 * @param {Object} elements - list of elements to be sorted
 * @returns {Number}
 */
function sortByKey(key, dir = 1, elements = ELEMENTS) {
  // make a copy of elements
  let result = [...elements];
  result.sort((a, b) => {
    return (a[key] - b[key]) * dir;
  });

  // put null elements at the buttom
  let nullArr = result.filter((a) => a[key] === null);
  result = result.filter((a) => a[key] !== null);
  result = result.concat(nullArr);
  return result;
}

// -------------------- Helper Functions for Endpoints -------------------- //

/**
 * This function checks if the parameters passed into the API request are valid
 * and returns a specific error if it is not
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} next - next
 * @returns none
 */
function checkParameters(req, res, next) {
  let attrs = req.query["attr"];
  let values = req.query["value"];
  let sort = req.query["sort"];
  let err;

  // Err #1. missing values
  if (attrs && !values) {
    err = Error("Missing required value query parameter when attr is passed.");
  }

  // Err #2. missing attributes
  else if (!attrs && values) {
    err = Error("Missing required attr query parameter when value is passed.");
  }

  // if both attrs and values are present
  else if (attrs && values) {
    attrs = attrs.split(" ");
    values = values.split(" ");

    // Err #3. attrs and values length mismatched
    if (attrs.length !== values.length) {
      err = Error("Attr and value query parameters have mismatched length.");
    }

    // if attr and values have the same length
    else {
      for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i]
        let value = values[i].split(",")

        // Err #4. invalid attributes
        if (!NUMERIC_PROPERTIES.includes(attr) && !STRING_PROPERTIES.includes(attr)) {
          err = Error("Attr query parameter invalid.");
        } else {

          // Err #5. invalid values
          if (value.length > 2) {
            err = Error("Value query parameter has invalid length.");
          }
          else if (value.length == 2) {

            // Err #6. unrangable attribute
            if (!NUMERIC_PROPERTIES.includes(attr)) {
              err = Error("Attr query parameter is not numerical when a value range is passed.");
            }

            // Err #7. non-numerical range
            else if (isNaN(value[0] || isNaN(value[1]))) {
              err = Error("Value query parameter is not numerical when a value range is passed.");
            }
          }
        }
      }
    }
  }

  // if neither attrs nor values is present
  else {
    // Err #8. no query parameter 
    if (!sort) {
      err = Error("Missing query parameters.");
    }
  }
  if (sort) {
    // Err #9. non-numerical sort
    if (!NUMERIC_PROPERTIES.includes(sort)) {
      err = Error("Sort attribute is not numerical.");
    }
  }
  if (err) {
    res.status(CLIENT_ERR_CODE);
    next(err);
  } else {
    next();
  }
}

/**
 * This function strips our list of elements of all of the uneccesary details and returns
 * a new Object list of only the elements symbol, name, and atomic number
 * @param {Object} elements - list of elements
 * @returns result
 */
function simplifyOutput(elements) {
  let result = [];
  for (let elem of elements) {
    let json = {};
    json.name = elem.name;
    json.number = elem.number;
    json.symbol = elem.symbol;
    json.img = elem.img;
    result.push(json);
  }
  return result;
}

/**
 * This function handles the error for when a fetch request fails to access the
 * API
 * @param err - error
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} next - next
 * @returns none
 */
function errorHandler(err, req, res, next) {
  console.log(err);
  res.type("text");
  res.send(err.message);
}

// Start the app on an open port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
"use strict";
// Loading required modules
const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.static("public"));
app.use(cors());

const ELEMENTS_LOOKUP = require("./elements-lookup.json");
const ELEMENTS = require("./elements.json")["elements"];

const NUMERIC_PROPERTIES = ["atomic_mass", "boil", "density", "melt", "molar_heat", "number", "period"];
const STRING_PROPERTIES  = ["name", "appearance", "category", "phase", "symbol"];

const CLIENT_ERR_CODE = 400;

// GET endpoints
app.get("/elements", getAllElements);
app.get("/element/:element", searchElement);
app.get("/search", checkParameters, search);
app.use(errorHandler);

// -------------------- Searching Functions for Endpoints -------------------- //
function getAllElements(req, res, next) {
  let result = simplifyOutput(ELEMENTS);
  res.type("json");
  res.send(result);
}

function searchElement(req, res, next) {
  let elem = req.params["element"];
  let err;
  if (!elem) {
    err = Error("Missing required element parameter.");
    next(err);
  } 
  else {
    if (isNaN(elem)) {
      res.type("json");
      res.send(ELEMENTS_LOOKUP[elem]);
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
        res.send(ELEMENTS[elem-1]);
      }
    }
  }
}

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

function searchByKeyValue(key, value, elements=ELEMENTS) {
  let result = [];
  for (let elem of elements) {
    if (elem[key].toLowerCase() === value.toLowerCase()) {
      result.push(elem);
    }
  }
  return result;
}

function searchByKeyRange(key, minValue, maxValue, elements=ELEMENTS) {
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
function sortByKey(key, dir=1, elements=ELEMENTS) {
  // make a copy of elements
  let result = [...elements];
  result.sort((a, b) => {
    return (a[key] - b[key])*dir;
  });

  // put null elements at the buttom
  let nullArr = result.filter((a) => a[key] === null);
  result = result.filter((a) => a[key] !== null);
  result = result.concat(nullArr);
  return result;
}

// -------------------- Helper Functions for Endpoints -------------------- //
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
            if(!NUMERIC_PROPERTIES.includes(attr)) {
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

function simplifyOutput(elements) {
  let result = [];
  for (let elem of elements) {
    let json = {};
    json.name = elem.name;
    json.number = elem.number;
    json.img = elem.img;
    result.push(json);
  }
  return result;
}

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

// some example use cases
// localhost:8000/elements
// localhost:8000/element/oxygen
// localhost:8000/element/15
// localhost:8000/search?attr=boil&value=100
// localhost:8000/search?attr=boil&value=100,200&sort=atomic_mass
// localhost:8000/search?attr=boil+period&value=100,200+0,10&sort=atomic_mass&dir=-1
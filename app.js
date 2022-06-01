"use strict";
const { application } = require("express");
// Loading required modules
const express = require("express");
const app = express();
// app.use(express.static("public"));
const fs = require("fs");

const ELEMENTS_LOOKUP = require("./elements-lookup.json");
const ELEMENTS_JSON = require("./elements.json");
const ELEMENTS = ELEMENTS_JSON["elements"]

const NUMERIC_PROPERTIES = ["atomic_mass", "boil", "density", "melt", "molar_heat", "number", "period"];
const STRING_PROPERTIES  = ["name", "appearance", "category", "phase", "symbol"];

const CLIENT_ERR_CODE = 400;

// Search functions
function searchByKeyValue(key, value) {
  let result = [];
  for (let elem of ELEMENTS) {
    if (elem[key] === value) {
      result.push(elem);
    }
  }
  return result;
}

function searchByKeyRange(key, minValue, maxValue) {
  let result = [];
  for (let elem of ELEMENTS) {
    const value = parseFloat(elem[key])
    if (value >= minValue && value <= maxValue) {
      result.push(elem);
    }
  }
  return result;
}

function searchElement(req, res, next) {
  res.type("json");
  const name = req.query["name"];
  if (name) {
    res.send(ELEMENTS_LOOKUP[name]);
  } else {
    res.status(400).send("Missing required name parameter");
  }
}

// sorting functions
function sortByKey(key, dir=1) {
  let result = [...ELEMENTS];
  result.sort((a, b) => {
    return (a[key] - b[key])*dir;
  });

  // put null elements at the buttom
  let nullArr = result.filter((a) => a[key] === null);
  result = result.filter((a) => a[key] !== null);
  result = result.concat(nullArr);
  return result.slice(0,3);
}

function checkParameters(req, res, next) {
  let attrs = req.query["attr"];
  let values = req.query["value"];
  let sort = req.query["sort"];
  let dir = req.query["dir"];
  let err;

  // Err #1. missing values
  if (attrs && !values) {
    err = Error("Missing query values.");
  } 
  // Err #2. missing attributes
  else if (!attrs && values) {
    err = Error("Missing query attributes.");
  } 
  // if both attrs and values are present
  else if (attrs && values) {
    attrs = attrs.split(" ");
    values = values.split(" ");
    // Err #3. attr and value length mismatched
    if (attrs.length !== values.length) {
      err = Error("Query attribute and values have mismatched length.");
    }
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i]
      let value = values[i].split(",")
      // Err #4. invalid attributes
      if (!NUMERIC_PROPERTIES.includes(attr) && !STRING_PROPERTIES.includes(attr)) {
        err = Error("Invalid query attributes.");
      } else {
        // Err #5. invalid values
        if (value.length > 2) {
          err = Error("Invalid query values.");
        } 
        else if (value.length == 2) {
          // Err #6. unrangable attribute
          if(!NUMERIC_PROPERTIES.includes(attr)) {
            err = Error("Query attribute is unrangable.");
          }
          // Err #7. non-numerical range
          else if (isNaN(value[0] || isNaN(value[1]))) {
            err = Error("Query value range is not numerical.");
          }
        }
      }
    }
  }
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

function outputTest(req, res, next) {
  res.type("text");
  res.send("SUCCESS");
}

function errorHandler(err, req, res, next) {
  res.type("text");
  res.send(err.message);
}


app.get("/test", checkParameters, outputTest);

app.use(errorHandler);

// Endpoints
// TO-DO: validate query parameters and search accordingly
// app.get("/search", (req, res, next) => {
//   if (req.query["name"])
// });
app.get("/search", searchElement);

app.get("/sort", (req, res, next) => {
  const key = req.query["key"];
  const dir = req.query["dir"];
  const result = sortByKey(key, dir);
  res.type("JSON");
  res.send(result);
})

// Start the app on an open port!
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});


// api.com/element/:elementname
// api.com/search?attr=boil&value=100
// api.com/search?attr=boil&value=100,200&sort=atomic_mass&dir=-1
// api.com/search?attr=boil+period&value=100,200+100,200&sort=atomic_mass&dir=-1

// 400s:
// 1. attr and value different length
// 1. attr missing
// 2. attr invalid
// 3. unrangeable attr if range is given
// 4. sort invalid
// 5. sort attr is unrangable
// 6. range is not complete
// 7. 

// app.get("/search", helper, actualSearch, errorHandler)
// helper(req, res, next) {
//   ajfafsa
// if (err):
//   next (err)
// else:
//   next()
//   next(err);
// }

// 100 < boil < 200
"use strict";
// Loading required modules
const express = require("express");
const app = express();

let cors = require("cors");
app.use(cors());

// app.use(express.static("public"));
const fs = require("fs");
const ELEMENTS_LOOKUP = require("./elements-lookup.json");
const ELEMENTS_JSON = require("./elements.json");
const ELEMENTS = ELEMENTS_JSON["elements"]

const PROPERTIES = ["name", "appearance", "atomic_mass", "boil", "density"];

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
  console.log(dir)
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


// Endpoints
// TO-DO: validate query parameters and search accordingly
app.get("/search", searchElement);
app.get("/sort", (req, res, next) => {
  const key = req.query["key"];
  const dir = req.query["dir"];
  const result = sortByKey(key, dir);
  res.type("JSON");
  res.send(result);
})

// 3. Start the app on an open port!
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
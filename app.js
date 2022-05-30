"use strict";
// Loading required modules
const express = require("express");
const app = express();
const fs = require("fs");
const elements_json = require("./elements.json");

// Endpoints
app.get("/", function (req, res) {
  res.type("json");
  const element = req.query["element"];
  if (element) {
    res.send(elements_json[element]);
  } else {
    res.status(400).send("Missing required element parameter");
  }
});

// 3. Start the app on an open port!
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});

// const jsonData = require("elements.json"); 
// console.log(jsonData);
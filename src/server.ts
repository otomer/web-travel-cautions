const express = require("express");
const bodyParser = require("body-parser");
const secure = require("express-force-https");
import logger = require("morgan");
var fs = require("fs");
const csv = require("csvtojson");

import { Request, Response } from "express";

import axios from "axios";

var convert = require("xml-js");
var xml2js = require("xml2js");

/**
 * Initialization
 */
const config = {
  PORT: process.env.PORT || 3000,
  STARTED: new Date().toString(),
};

/**
 * Express Configurations
 */
const app = express(); // Create global app object
app.use(secure);
app.use(logger("dev"));
app.use(express.static("public")); // Static files configuration
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Support JSON bodies

/**
 * Express Routes
 */

function extractTravelAdvisoryFromCountryTitle(str: string) {
  const regex = /(.*) - Level (.*?): (.*)/gm;
  let m;
  let result;

  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    result = { country: m[1], description: m[3], level: m[2] };
  }

  return result;
}

function convertEntriesToResult(entries: any) {
  const result: any = {
    countries: [],
    countryToLevel: {},
    items: {},
    levelToCountries: { 1: [], 2: [], 3: [], 4: [] },
  };
  entries.forEach((v: any) => {
    const countryFullTitle = v.title._text || v.title.text;
    const match: any = extractTravelAdvisoryFromCountryTitle(countryFullTitle);
    if (match && !result[match.country]) {
      result.countryToLevel[match.country] = match.level;
      result.items[match.country] = match;
      result.levelToCountries[match.level].push(match.country);
      result.countries.push(match.country);
    }
  });

  Object.keys(result.levelToCountries).forEach(function (key) {
    result.levelToCountries[key].sort();
  });
  result.countries.sort();

  return result;
}

function saveEntries(entries: any, callback: Function) {
  const outputPath = "./output.json";
  const result = convertEntriesToResult(entries);
  fs.writeFile(outputPath, JSON.stringify(result), "utf8", (err: any) => {
    if (err) {
      return console.log(err);
    }
    callback(result);
  });
}

var restrictionsData: any = { countries: [], restrictions: {} };
const getRestrictionsData = () => restrictionsData;
var serverData: any = {};
const getServerData = () => serverData;

function loadRestrictionsData() {
  axios
    .get(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxATUFm0tR6Vqq-UAOuqQ-BoQDvYYEe-BmJ20s50yBKDHEifGofP2P1LJ4jWFIu0Pb_4kRhQeyhHmn/pub?gid=0&single=true&output=csv"
    )
    .then((res) => {
      const csvFilePath = "file.csv";
      fs.writeFile(csvFilePath, res.data, "utf8", (err: any) => {
        if (err) {
          return console.log(err);
        }
        csv()
          .fromFile(csvFilePath)
          .then((jsonObj: any) => {
            jsonObj.forEach((v: any) => {
              restrictionsData.countries.push(v.adm0_name);
              if (!restrictionsData.restrictions[v.adm0_name]) {
                restrictionsData.restrictions[v.adm0_name] = {};
              }
              restrictionsData.restrictions[v.adm0_name] = v;
            });
            restrictionsData.countries.sort();
          });
      });
    });
}
loadRestrictionsData();

function findCountry(search: string) {
  const data = getRestrictionsData();
  return data.restrictions[search];
}
app.get("/api/countries", (request: Request, response: Response) => {
  var serverData = getRestrictionsData();
  response.send({
    countries: serverData.countries,
    total: serverData.countries.length,
  });
});

app.get("/api/data", (request: Request, response: Response) => {
  var serverData = getRestrictionsData();
  response.send({
    data: serverData,
  });
});

app.post("/api/travel-cautions", (request: Request, response: Response) => {
  const searchQuery = request.body.search;
  const result = findCountry(searchQuery);
  response.send({ ...result });
});

app.get("/status", (req: Request, res: Response) => res.send("Live! 🔥"));
app.get("/config", (req: Request, res: Response) =>
  res.send({
    ...config,
  })
);

app.get("/", (req: Request, res: Response) =>
  res.sendFile("index.html", { root: "public" })
);
app.get("*", function (req: Request, res: Response) {
  res.status(404);
  res.sendFile("404.html", { root: "public" });
});

/**
 * Start the server
 */
const server = app.listen(config.PORT, () =>
  console.log(
    `🚀 Server is listening on http://localhost:${server.address().port}`
  )
);

const express = require("express");
const bodyParser = require("body-parser");
const secure = require("express-force-https");
import logger = require("morgan");
var fs = require("fs");
const csv = require("csvtojson");
var cors = require("cors");
const getCountryISO3 = require("country-iso-2-to-3");

import { Request, Response } from "express";

import axios from "axios";

import e = require("express");

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
app.use(cors());

/**
 * Express Routes
 */

var restrictionsData: any = {
  airline: { iso3: {}, name: {} },
  countries: [],
  iso3: [],
  restrictions: { iso3: {}, name: {} },
};
const getRestrictionsData = () => restrictionsData;

const TravelRestrictionsByCountry =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxATUFm0tR6Vqq-UAOuqQ-BoQDvYYEe-BmJ20s50yBKDHEifGofP2P1LJ4jWFIu0Pb_4kRhQeyhHmn/pub?gid=0&single=true&output=csv";
const AirlineRestrictionsInfo =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxATUFm0tR6Vqq-UAOuqQ-BoQDvYYEe-BmJ20s50yBKDHEifGofP2P1LJ4jWFIu0Pb_4kRhQeyhHmn/pub?gid=646351539&single=true&output=csv";

function csvExtract(csvFilePath: String, data: any, cb: Function) {
  fs.writeFile(csvFilePath, data, "utf8", (err: any) => {
    if (err) {
      return console.log(err);
    } else {
      csv().fromFile(csvFilePath).then(cb);
    }
  });
}

function loadRestrictionsData() {
  axios
    .all([
      axios.get(TravelRestrictionsByCountry),
      axios.get(AirlineRestrictionsInfo),
    ])
    .then((responseArr: any) => {
      const travelResponse = responseArr[0];
      const airlineResponse = responseArr[1];

      const collectData = (
        dataType: string,
        hashKey: string,
        itemPropertyName: string,
        item: any
      ) => {
        if (!restrictionsData[dataType][hashKey][item[itemPropertyName]]) {
          restrictionsData[dataType][hashKey][item[itemPropertyName]] =
            dataType == "airline" ? [] : {};
        }

        if (dataType == "airline") {
          restrictionsData[dataType][hashKey][item[itemPropertyName]].push(
            item
          );
        } else {
          restrictionsData[dataType][hashKey][item[itemPropertyName]] = item;
        }
      };

      csvExtract("travel.csv", travelResponse.data, (jsonObj: any) => {
        jsonObj.forEach((v: any) => {
          restrictionsData.countries.push(v.adm0_name);
          restrictionsData.iso3.push(v.iso3);
          collectData("restrictions", "name", "adm0_name", v);
          collectData("restrictions", "iso3", "iso3", v);
        });
        restrictionsData.countries.sort();
        restrictionsData.iso3.sort();
      });

      csvExtract("airline.csv", airlineResponse.data, (jsonObj: any) => {
        jsonObj.forEach((v: any) => {
          collectData("airline", "name", "adm0_name", v);
          collectData("airline", "iso3", "iso3", v);
        });
      });
    })
    .catch((error: Error) => {
      console.error(error);
    });
}
loadRestrictionsData();

function findCountry(propertyName: string, search: string) {
  const data = getRestrictionsData();
  return {
    airlines: data.airline[propertyName][search],
    travel: data.restrictions[propertyName][search],
  };
}
app.get("/api/countries", (request: Request, response: Response) => {
  var serverData = getRestrictionsData();
  response.send({
    countries: serverData.countries,
    total: serverData.countries.length,
  });
});

app.get("/api/iso3", (request: Request, response: Response) => {
  var serverData = getRestrictionsData();
  response.send({
    iso3: serverData.iso3,
    total: serverData.iso3.length,
  });
});

app.get("/api/data", (request: Request, response: Response) => {
  var serverData = getRestrictionsData();
  response.send({
    data: serverData,
  });
});

app.post("/api/travel-cautions", (request: Request, response: Response) => {
  let result = { airlines: {}, travel: {} };

  if (request.body.iso2) {
    const mappedISO3 = getCountryISO3(request.body.iso2);
    result = findCountry("iso3", mappedISO3);
  } else {
    result = findCountry("name", request.body.search);
  }

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

/* Travel Advisory Level - currently not in use */
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

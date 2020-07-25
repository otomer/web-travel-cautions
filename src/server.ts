const express = require("express");
const bodyParser = require("body-parser");
const secure = require("express-force-https");
import logger = require("morgan");
const cors = require("cors");
const getCountryISO3 = require("country-iso-2-to-3");

import { Request, Response } from "express";

import axios from "axios";
import utils from "./utils";

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
app.use(secure); //Force https
app.use(logger("dev"));
app.use(express.static("public")); // Static files configuration
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Support JSON bodies
app.use(cors()); // Enable CORS

/**
 * Express Routes
 */

var restrictionsData: any = {
  advisory: { iso2: {} },
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
const TravelAdvisoryRiskLevel = "https://www.travel-advisory.info/api";

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
    restrictionsData[dataType][hashKey][item[itemPropertyName]].push(item);
  } else {
    restrictionsData[dataType][hashKey][item[itemPropertyName]] = item;
  }
};

function loadRestrictionsData() {
  axios
    .all([
      axios.get(TravelRestrictionsByCountry),
      axios.get(AirlineRestrictionsInfo),
      axios.get(TravelAdvisoryRiskLevel),
    ])
    .then((responseArr: any) => {
      const travelResponse = responseArr[0];
      const airlineResponse = responseArr[1];
      const travelAdvisoryResponse = responseArr[2];

      utils.saveDataToFile(
        "travel.csv",
        travelResponse.data,
        (restrictions: any) => {
          restrictions.forEach((v: any) => {
            restrictionsData.countries.push({
              iso3: v.iso3,
              name: v.adm0_name,
            });
            restrictionsData.iso3.push(v.iso3);
            collectData("restrictions", "name", "adm0_name", v);
            collectData("restrictions", "iso3", "iso3", v);
          });
          restrictionsData.countries.sort();
          restrictionsData.iso3.sort();
        }
      );

      utils.saveDataToFile(
        "airline.csv",
        airlineResponse.data,
        (airlines: any) => {
          airlines.forEach((v: any) => {
            collectData("airline", "name", "adm0_name", v);
            collectData("airline", "iso3", "iso3", v);
          });
        }
      );

      utils.saveDataToFile(
        "advisory.json",
        travelAdvisoryResponse.data.data,
        (traveAdvisory: any) => {
          Object.keys(traveAdvisory).forEach((key) => {
            collectData("advisory", "iso2", "iso_alpha2", traveAdvisory[key]);
          });
        }
      );
    })
    .catch((error: Error) => console.error(error));
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
  let result: any = { airlines: {}, travel: {} };
  if (request.body.iso2) {
    const ISO2 = request.body.iso2.toUpperCase();
    const mappedISO3 = getCountryISO3(ISO2);
    result = findCountry("iso3", mappedISO3);
    result.advisory = getRestrictionsData().advisory.iso2[ISO2];
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

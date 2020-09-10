const express = require("express");
const bodyParser = require("body-parser");
const secure = require("express-force-https");
import logger = require("morgan");
const cors = require("cors");

import { Request, Response } from "express";

import routes from "./routes";

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
routes.setup(app);

app.get("/config", (req: Request, res: Response) =>
  res.send({
    status: "Live! 🔥",
    ...config,
  })
);

app.get("/", (req: Request, res: Response) =>
  res.sendFile("index.html", { root: "public" })
);
app.get("/spa", (req: Request, res: Response) =>
  res.sendFile("spa/example.html", { root: "public" })
);
app.get("/posts/post3", (req: Request, res: Response) =>
  res.sendFile("spa/post3.html", { root: "public" })
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

const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const configCors = require("./cors");
const { limiter } = require("../middleware/rateLimiter");
const routes = require("../routes");
const errorHandler = require("../middleware/errorHandler");

const configureExpress = () => {
  const app = express();

  app.use(bodyParser.json({ limit: "256kb" }));

  app.use(compression());

  app.use((req, res, next) => {
    res.set("Cache-Control", "public, max-age=300");
    next();
  });

  app.set("etag", true);

  app.use(configCors());

  app.use(limiter);

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};

module.exports = configureExpress;

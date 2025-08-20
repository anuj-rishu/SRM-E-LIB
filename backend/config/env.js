const dotenv = require("dotenv");

const setupEnv = () => {
  if (process.env.DEV_MODE === "true") {
    dotenv.config();
  }
};

module.exports = setupEnv;
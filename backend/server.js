const setupEnv = require("./config/env");
const connectDatabase = require("./config/db");
const configureExpress = require("./config/express");

setupEnv();

const app = configureExpress();
const port = process.env.PORT || 9000;

connectDatabase();

app.listen(port, "0.0.0.0", () => {
  console.info(`Server running on port ${port}`);
});

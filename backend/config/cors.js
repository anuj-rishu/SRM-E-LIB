const cors = require("cors");

const configCors = () => {
  const urls = process.env.URL;
  let allowedOrigins = ["http://localhost:5173"];
  
  if (urls) {
    allowedOrigins = allowedOrigins.concat(urls.split(","));
  }

  return cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "Content-Type",
      "Accept",
      "X-CSRF-Token",
      "Authorization",
    ],
    exposedHeaders: ["Content-Length"],
    credentials: true,
    maxAge: 3600,
  });
};

module.exports = configCors;
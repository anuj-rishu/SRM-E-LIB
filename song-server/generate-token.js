/**
 * Generate a JWT token for testing in Postman
 * 
 * Usage: node generate-token.js <registrationNumber> <jsessionid>
 * Example: node generate-token.js RA2111003010123 ABC123XYZ
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");

const registrationNumber = process.argv[2];
const jsessionid = process.argv[3] || "test-session";

if (!registrationNumber) {
  console.log("Usage: node generate-token.js <registrationNumber> [jsessionid]");
  console.log("Example: node generate-token.js RA2111003010123 ABC123XYZ");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("Error: JWT_SECRET not found in .env file");
  process.exit(1);
}

const token = jwt.sign(
  { registrationNumber, jsessionid },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

console.log("\n🔑 Your JWT Token:\n");
console.log(token);
console.log("\n📋 Copy this for Postman Authorization header:");
console.log(`Bearer ${token}`);
console.log();

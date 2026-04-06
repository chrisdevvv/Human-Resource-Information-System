const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment values from the first existing .env candidate.
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "..", "..", ".env"),
  path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "deped-leave-tracker-backend",
    ".env",
  ),
];

let loadedPath = null;
for (const envPath of candidates) {
  if (!fs.existsSync(envPath)) {
    continue;
  }

  dotenv.config({ path: envPath });
  loadedPath = envPath;
  break;
}

module.exports = {
  loadedPath,
};

const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  sessionSecret: process.env.SESSION_SECRET,
  storagePath: path.resolve(process.env.STORAGE_PATH || "./storage"),
  databasePath: path.resolve(
    process.env.DATABASE_PATH || "./storage/yasmin.sqlite"
  )
};

if (!config.sessionSecret || config.sessionSecret.length < 64) {
  throw new Error("SESSION_SECRET is missing or too short");
}

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error("Invalid server port");
}

module.exports = Object.freeze(config);

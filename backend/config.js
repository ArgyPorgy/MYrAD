require("dotenv").config();
const path = require("path");

// Multiple RPC URLs for fallback
const RPC_URLS = [
  process.env.BASE_SEPOLIA_RPC_URL,
  "https://base-sepolia.drpc.org",
  "https://sepolia.base.org"
].filter(Boolean); // Remove any undefined/null values

module.exports = {
  RPC: RPC_URLS[0], // Primary RPC
  RPC_URLS: RPC_URLS, // All RPCs for fallback
  PORT: process.env.PORT || 4000,
  DOWNLOAD_SECRET: process.env.DOWNLOAD_SECRET || "secret",
  DB_FILE: path.join(__dirname, "db.json"),
  DATASETS_FILE: path.join(__dirname, "../datasets.json")
};
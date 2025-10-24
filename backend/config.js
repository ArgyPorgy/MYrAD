require("dotenv").config();
const path = require("path");

// Single reliable RPC URL - Alchemy Base Sepolia
const RPC_URL = "https://base-sepolia.g.alchemy.com/v2/orn0yqO7JI_s9IaveLzEN";

module.exports = {
  RPC: RPC_URL,
  RPC_URLS: [RPC_URL], // Keep array format for compatibility
  PORT: process.env.PORT || 4000,
  DOWNLOAD_SECRET: process.env.DOWNLOAD_SECRET || "secret",
  DB_FILE: path.join(__dirname, "db.json"),
  DATASETS_FILE: path.join(__dirname, "../datasets.json")
};
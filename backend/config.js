require("dotenv").config();
const path = require("path");

// Multiple RPC URLs for automatic fallback
// Will try each one in order until one works
const RPC_URLS = [
  "https://sepolia.base.org",
  "https://base-sepolia-rpc.publicnode.com",
  "https://base-sepolia.gateway.tenderly.co",
  "https://base-sepolia.blockpi.network/v1/rpc/public"
];

module.exports = {
  RPC: RPC_URLS[0], // Primary RPC
  RPC_URLS: RPC_URLS, // All RPCs for fallback
  PORT: process.env.PORT || 4000,
  DOWNLOAD_SECRET: process.env.DOWNLOAD_SECRET || "secret",
  DB_FILE: path.join(__dirname, "db.json"),
  DATASETS_FILE: path.join(__dirname, "../datasets.json")
};
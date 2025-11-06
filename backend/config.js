import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Single reliable RPC URL - Alchemy Base Sepolia
const RPC_URL = "https://base-sepolia.g.alchemy.com/v2/orn0yqO7JI_s9IaveLzEN";

export default {
  RPC: RPC_URL,
  RPC_URLS: [RPC_URL], // Keep array format for compatibility
  PORT: process.env.PORT || 4000,
  DOWNLOAD_SECRET: process.env.DOWNLOAD_SECRET || "secret",
  DB_FILE: path.join(__dirname, "db.json"),
  DATASETS_FILE: path.join(__dirname, "../datasets.json"),
  MAX_BLOCK_RANGE: parseInt(process.env.MAX_BLOCK_RANGE) || 10 // Free tier RPC limit
};
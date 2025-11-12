import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_RPC_URL = "https://sepolia.base.org";
const RPC_URL = process.env.BASE_RPC_URL || DEFAULT_RPC_URL;

export default {
  RPC: RPC_URL,
  RPC_URLS: [RPC_URL], // Keep array format for compatibility
  PORT: process.env.PORT || 4000,
  DOWNLOAD_SECRET: process.env.DOWNLOAD_SECRET || "secret",
  DB_FILE: path.join(__dirname, "db.json"),
  DATASETS_FILE: path.join(__dirname, "../datasets.json"),
  MAX_BLOCK_RANGE: parseInt(process.env.MAX_BLOCK_RANGE) || 10 // Free tier RPC limit
};
import fs from "fs";
import jwt from "jsonwebtoken";
import config from "./config.js";

const { DOWNLOAD_SECRET, DB_FILE } = config;

function signDownloadUrl(cid, user) {
  const token = jwt.sign({ cid, user, ts: Date.now() }, DOWNLOAD_SECRET, { expiresIn: "30m" });
  return `https://gateway.lighthouse.storage/ipfs/${cid}?token=${token}`;
}

function saveAccess(entry) {
  let db = [];
  if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));
  db.push(entry);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export { signDownloadUrl, saveAccess };

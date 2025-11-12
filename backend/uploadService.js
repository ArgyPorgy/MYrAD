import lighthouse from "@lighthouse-web3/sdk";
import fs from "fs";
import path from "path";
import os from "os";

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

async function uploadToLighthouse(fileBuffer, fileName) {
  let tempFilePath = null;
  
  try {
    if (!LIGHTHOUSE_API_KEY) {
      throw new Error("LIGHTHOUSE_API_KEY not configured in .env file");
    }

    tempFilePath = path.join(os.tmpdir(), `lighthouse-upload-${Date.now()}-${fileName}`);
    fs.writeFileSync(tempFilePath, fileBuffer);

    const uploadResponse = await lighthouse.upload(tempFilePath, LIGHTHOUSE_API_KEY);

    if (uploadResponse && uploadResponse.data && uploadResponse.data.Hash) {
      const cid = uploadResponse.data.Hash;
      return cid;
    } else {
      console.error("❌ Unexpected Lighthouse response:", uploadResponse);
      throw new Error("No CID returned from Lighthouse");
    }
  } catch (err) {
    console.error("❌ Lighthouse upload failed:", {
      message: err.message,
      stack: err.stack
    });
    throw new Error(`Upload failed: ${err.message}`);
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        console.warn(`⚠️  Could not delete temp file: ${cleanupErr.message}`);
      }
    }
  }
}

async function uploadBase64ToLighthouse(base64Data, fileName) {
  try {
    const buffer = Buffer.from(base64Data, "base64");
    return await uploadToLighthouse(buffer, fileName);
  } catch (err) {
    throw new Error(`Base64 upload failed: ${err.message}`);
  }
}

export {
  uploadToLighthouse,
  uploadBase64ToLighthouse,
};

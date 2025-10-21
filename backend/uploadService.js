const lighthouse = require("@lighthouse-web3/sdk");
const fs = require("fs");
const path = require("path");
const os = require("os");

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

async function uploadToLighthouse(fileBuffer, fileName) {
  let tempFilePath = null;
  
  try {
    if (!LIGHTHOUSE_API_KEY) {
      throw new Error("LIGHTHOUSE_API_KEY not configured in .env file");
    }

    console.log(`📤 Uploading to Lighthouse IPFS (using SDK): ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    tempFilePath = path.join(os.tmpdir(), `lighthouse-upload-${Date.now()}-${fileName}`);
    fs.writeFileSync(tempFilePath, fileBuffer);

    console.log(`   Temporary file created: ${tempFilePath}`);
    console.log(`   Uploading to Lighthouse...`);

    const uploadResponse = await lighthouse.upload(tempFilePath, LIGHTHOUSE_API_KEY);

    if (uploadResponse && uploadResponse.data && uploadResponse.data.Hash) {
      const cid = uploadResponse.data.Hash;
      console.log(`✅ File uploaded to IPFS: ${cid}`);
      console.log(`   Gateway URL: https://gateway.lighthouse.storage/ipfs/${cid}`);
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
        console.log(`   Temp file cleaned up`);
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

module.exports = {
  uploadToLighthouse,
  uploadBase64ToLighthouse,
};

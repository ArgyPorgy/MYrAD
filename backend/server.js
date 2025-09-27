import express from "express";
import multer from "multer";
import lighthouse from "@lighthouse-web3/sdk";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // array for multiple origins
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const response = await lighthouse.uploadBuffer(
      req.file.buffer,
      process.env.LH_API
    );

    const result = {
      url: `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`,
      Hash: response.data.Hash,
      Name: response.data.Name,
      Size: response.data.Size,
    };

    console.log("Upload result:", result); 

    res.json(result);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

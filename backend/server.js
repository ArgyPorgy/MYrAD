import express from "express";
import multer from "multer";
import lighthouse from "@lighthouse-web3/sdk";
import cors from "cors";

const app = express();
app.use(cors());
const upload = multer();

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const response = await lighthouse.uploadBuffer(
      req.file.buffer,
      LH_API
    );
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));

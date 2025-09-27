import express from "express";
import multer from "multer";
import lighthouse from "@lighthouse-web3/sdk";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Debug environment variables
console.log("Environment check:");
console.log("LH_API:", process.env.LH_API ? "✅ Set" : "❌ Missing");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");

const app = express();

// Global error handlers to avoid process exit
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // optionally: process.exit(1);
});

// CORS configuration - more permissive for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer();

// Simple test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is running and CORS is working!" });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("File:", req.file ? "Present" : "Missing");
    console.log("LH_API:", process.env.LH_API ? "Set" : "Missing");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!process.env.LH_API) {
      return res.status(500).json({ error: "Lighthouse API key not configured" });
    }

    const response = await lighthouse.uploadBuffer(
      req.file.buffer,
      process.env.LH_API
    );
    res.json(response);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5002;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop the server");
});

// Keep the process alive
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

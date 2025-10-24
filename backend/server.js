const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { PORT, DATASETS_FILE, DB_FILE } = require("./config");
const { ethers } = require("ethers");
const multer = require("multer");
const { uploadBase64ToLighthouse } = require("./uploadService");
const { createDatasetToken } = require("./createDatasetAPI");
const { addUserDataset, getUserDatasets, updateTokenBalance } = require("./userDatasets");

// ERC20 ABI for balance checking
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const app = express();

// Enable CORS for all origins with proper configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static frontend files from 'dist' folder (production build)
app.use(express.static(path.join(__dirname, "../dist")));

const MARKETPLACE_ABI = [
  "function getPriceUSDCperToken(address token) external view returns (uint256)",
  "function getReserves(address token) external view returns (uint256 rToken, uint256 rUSDC)",
  "function poolExists(address token) external view returns (bool)"
];

// Use config RPC with fallback support
const { RPC_URLS } = require("./config");
const provider = new ethers.JsonRpcProvider(RPC_URLS[0] || "https://sepolia.base.org");

app.get("/", (req, res) => {
  res.send("🚀 MYRAD Backend API running ✅");
});

app.get("/datasets", (req, res) => {
  if (!fs.existsSync(DATASETS_FILE)) return res.json({});
  const data = JSON.parse(fs.readFileSync(DATASETS_FILE));
  res.json(data);
});

app.get("/price/:marketplaceAddress/:tokenAddress", async (req, res) => {
  try {
    const { marketplaceAddress, tokenAddress } = req.params;

    if (!ethers.isAddress(marketplaceAddress) || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, provider);
    
    const exists = await marketplace.poolExists(tokenAddress);
    if (!exists) {
      return res.status(404).json({ error: "Pool not initialized" });
    }

    const price = await marketplace.getPriceUSDCperToken(tokenAddress);
    const [rToken, rUSDC] = await marketplace.getReserves(tokenAddress);

    res.json({
      price: ethers.formatUnits(price, 6), // Price is returned in USDC format (6 decimals)
      tokenReserve: ethers.formatUnits(rToken, 18),
      usdcReserve: ethers.formatUnits(rUSDC, 6),
    });
  } catch (err) {
    console.error("Price error:", err);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

app.get("/quote/buy/:marketplaceAddress/:tokenAddress/:usdcAmount", async (req, res) => {
  try {
    const { marketplaceAddress, tokenAddress, usdcAmount } = req.params;

    if (!ethers.isAddress(marketplaceAddress) || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, provider);
    const usdcValue = ethers.parseUnits(usdcAmount, 6);
    
    const [rToken, rUSDC] = await marketplace.getReserves(tokenAddress);
    
    // Calculate using constant product formula: k = rToken * rUSDC
    // newRUSDC = rUSDC + usdcToPool
    // newRToken = k / newRUSDC
    // tokensOut = rToken - newRToken
    const k = rToken * rUSDC;
    const usdcToPool = usdcValue;
    const newRUSDC = rUSDC + usdcToPool;
    const newRToken = k / newRUSDC;
    const tokensOut = rToken - newRToken;

    res.json({
      usdcAmount: usdcAmount,
      tokenAmount: ethers.formatUnits(tokensOut, 18),
      tokenAmountRaw: tokensOut.toString(),
    });
  } catch (err) {
    console.error("Buy quote error:", err);
    res.status(500).json({ error: "Failed to calculate quote" });
  }
});

app.get("/quote/sell/:marketplaceAddress/:tokenAddress/:tokenAmount", async (req, res) => {
  try {
    const { marketplaceAddress, tokenAddress, tokenAmount } = req.params;

    if (!ethers.isAddress(marketplaceAddress) || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, provider);
    const tokenValue = ethers.parseUnits(tokenAmount, 18);
    
    const [rToken, rUSDC] = await marketplace.getReserves(tokenAddress);
    
    // Calculate using constant product formula
    const k = rToken * rUSDC;
    const newRToken = rToken + tokenValue;
    const newRUSDC = k / newRToken;
    const usdcOut = rUSDC - newRUSDC;

    res.json({
      tokenAmount: tokenAmount,
      usdcAmount: ethers.formatUnits(usdcOut, 6),
      usdcAmountRaw: usdcOut.toString(),
    });
  } catch (err) {
    console.error("Sell quote error:", err);
    res.status(500).json({ error: "Failed to calculate quote" });
  }
});

app.get("/access/:user/:symbol", (req, res) => {
  const { user, symbol } = req.params;

  if (!fs.existsSync(DB_FILE)) {
    return res.status(404).json({ error: "no redemptions" });
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE));
  const entry = db
    .slice()
    .reverse()
    .find(
      x =>
        x.user.toLowerCase() === user.toLowerCase() && x.symbol === symbol
    );

  if (!entry) {
    return res.status(404).json({ error: "not found" });
  }

  res.json({
    user: entry.user,
    symbol: entry.symbol,
    download: entry.downloadUrl,
    ts: entry.ts,
  });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    console.log(`📤 Uploading file: ${req.file.originalname}`);

    const base64Data = req.file.buffer.toString("base64");
    const cid = await uploadBase64ToLighthouse(base64Data, req.file.originalname);

    console.log(`✅ File uploaded, CID: ${cid}`);

    res.json({
      success: true,
      cid: cid,
      filename: req.file.originalname,
      size: req.file.size,
      ipfsUrl: `ipfs://${cid}`,
      gatewayUrl: `https://gateway.lighthouse.storage/ipfs/${cid}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      error: "Upload failed",
      message: err.message,
    });
  }
});

app.post("/create-dataset", async (req, res) => {
  try {
    const { cid, name, symbol, description, totalSupply, creatorAddress } = req.body;

    if (!cid || !name || !symbol) {
      console.warn("Missing required fields");
      return res.status(400).json({
        error: "Missing required fields: cid, name, symbol",
      });
    }

    if (!creatorAddress || !ethers.isAddress(creatorAddress)) {
      console.warn("Missing or invalid creator address");
      return res.status(400).json({
        error: "Valid creator wallet address is required",
      });
    }

    if (!/^[A-Z0-9]{1,10}$/.test(symbol)) {
      console.warn(`Invalid symbol format: ${symbol}`);
      return res.status(400).json({
        error: "Symbol must be 1-10 uppercase letters/numbers",
      });
    }

    const supply = totalSupply || 1000000;
    if (supply <= 0 || !Number.isInteger(supply)) {
      return res.status(400).json({
        error: "Total supply must be a positive integer",
      });
    }

    console.log(`\n📝 Creating dataset: ${name} (${symbol})`);
    console.log(`   CID: ${cid}`);
    console.log(`   Description: ${description || "N/A"}`);
    console.log(`   Total Supply: ${supply.toLocaleString()}`);
    console.log(`   Creator: ${creatorAddress}`);

    if (!process.env.FACTORY_ADDRESS) {
      console.warn("FACTORY_ADDRESS not configured");
      return res.status(400).json({
        error: "FACTORY_ADDRESS not configured",
        message: "Please deploy factory first and set FACTORY_ADDRESS in .env",
      });
    }

    if (!process.env.MARKETPLACE_ADDRESS || process.env.MARKETPLACE_ADDRESS === "0x0000000000000000000000000000000000000000") {
      console.warn("MARKETPLACE_ADDRESS not configured");
      return res.status(400).json({
        error: "MARKETPLACE_ADDRESS not configured",
        message: "Please deploy marketplace first and set MARKETPLACE_ADDRESS in .env",
      });
    }

    if (!process.env.MYRAD_TREASURY || !ethers.isAddress(process.env.MYRAD_TREASURY)) {
      console.warn("MYRAD_TREASURY not configured");
      return res.status(400).json({
        error: "MYRAD_TREASURY not configured",
        message: "Please set MYRAD_TREASURY in .env",
      });
    }

    console.log(`   Factory: ${process.env.FACTORY_ADDRESS}`);
    console.log(`   Marketplace: ${process.env.MARKETPLACE_ADDRESS}`);
    console.log(`   Treasury: ${process.env.MYRAD_TREASURY}`);

    const result = await createDatasetToken(cid, name, symbol, description || "", supply, creatorAddress);

    console.log(`   ✅ Token created: ${result.tokenAddress}`);
    console.log(`   ✅ Marketplace: ${result.marketplaceAddress}`);

    // Save to JSON file
    try {
      const userDataset = {
        userAddress: creatorAddress.toLowerCase(),
        tokenAddress: result.tokenAddress.toLowerCase(),
        name: result.name,
        symbol: result.symbol,
        description: description || "",
        cid: result.cid,
        totalSupply: supply,
        creatorAddress: creatorAddress.toLowerCase(),
        marketplaceAddress: result.marketplaceAddress?.toLowerCase(),
        type: 'created',
        amount: supply.toString()
      };
      
      addUserDataset(userDataset);
      console.log(`   ✅ Saved to JSON file: ${result.symbol}`);
    } catch (dbErr) {
      console.error("   ⚠️ JSON file save error:", dbErr.message);
      // Don't fail the request if JSON save fails
    }

    const responseData = {
      success: true,
      tokenAddress: result.tokenAddress,
      marketplaceAddress: result.marketplaceAddress,
      symbol: result.symbol,
      name: result.name,
      cid: result.cid,
      message: "Dataset created successfully",
    };

    console.log("   Sending response:", JSON.stringify(responseData));
    res.json(responseData);
  } catch (err) {
    console.error("❌ Dataset creation error:", err.message);
    console.error("   Stack:", err.stack);

    let errorMessage = err.message;
    if (err.message.includes("MARKETPLACE_ADDRESS")) {
      errorMessage = "Marketplace not configured. Deploy and set MARKETPLACE_ADDRESS first.";
    } else if (err.message.includes("FACTORY_ADDRESS")) {
      errorMessage = "Factory address not configured. Deploy factory first.";
    } else if (err.message.includes("Insufficient USDC")) {
      errorMessage = "You need more USDC. Get faucet USDC from Base Sepolia.";
    } else if (err.message.includes("not found")) {
      errorMessage = "Contract artifacts not found. Run: npx hardhat compile";
    } else if (err.message.includes("nonce")) {
      errorMessage = "Transaction nonce error. Check RPC connection.";
    } else if (err.message.includes("insufficient")) {
      errorMessage = "Insufficient balance for gas. Get more testnet ETH.";
    } else if (err.message.includes("timeout")) {
      errorMessage = "RPC request timeout. Check network connection.";
    }

    const errorResponse = {
      error: "Failed to create dataset",
      message: errorMessage,
      details: err.message,
    };

    console.log("   Sending error response:", JSON.stringify(errorResponse));
    res.status(500).json(errorResponse);
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Get user's datasets (created and bought) with real-time balances
app.get("/api/my-datasets/:userAddress", async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const datasets = getUserDatasets(userAddress);
    
    // Update balances with real-time data from blockchain
    for (let dataset of datasets) {
      try {
        const token = new ethers.Contract(dataset.tokenAddress, ERC20_ABI, provider);
        const balance = await token.balanceOf(userAddress);
        dataset.realTimeBalance = balance.toString();
      } catch (err) {
        console.error(`Error fetching balance for ${dataset.tokenAddress}:`, err);
        dataset.realTimeBalance = dataset.amount; // Fallback to stored amount
      }
    }
    
    res.json(datasets);
  } catch (err) {
    console.error("My datasets error:", err);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
});

// Serve frontend for all other routes (SPA fallback)
// Only if the request accepts HTML (not for API calls)
app.get("*", (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`📊 Available at: ${url}`);
});



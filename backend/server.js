import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import config from "./config.js";
import { ethers } from "ethers";
import multer from "multer";
import { uploadBase64ToLighthouse } from "./uploadService.js";
import { createDatasetToken } from "./createDatasetAPI.js";
import { initSchema } from './db.js';
import { getAllCoins, getCoinsByCreator } from './storage.js';
import { canClaim, recordClaim, sendETH, sendUSDC } from './faucet.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { PORT, DATASETS_FILE, DB_FILE } = config;

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

// Use config RPC
const provider = new ethers.JsonRpcProvider(config.RPC_URLS[0]);

app.get("/", (req, res) => {
  res.send("🚀 MYRAD Backend API running ✅");
});

app.get("/datasets", async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const coins = await getAllCoins();
      // Keep response compatible with old frontend (map keyed by token address)
      const map = {};
      for (const c of coins) {
        map[c.token_address] = {
          name: c.name,
          symbol: c.symbol,
          cid: c.cid,
          description: c.description,
          token_address: c.token_address,
          marketplace: c.marketplace_address,
          marketplace_address: c.marketplace_address,
          bonding_curve: c.marketplace_address,
          creator: c.creator_address,
          total_supply: Number(c.total_supply),
          created_at: new Date(c.created_at).getTime(),
        };
      }
      return res.json(map);
    }
  } catch (e) {
    console.error('DB /datasets error:', e);
  }
  // Fallback to JSON file if DB not configured or error
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

    // Preserve description as-is (don't convert undefined to empty string)
    // If description is provided (even if empty string), pass it through
    // If description is undefined/null, pass undefined so it can be saved as null in DB
    const descriptionToPass = description !== undefined ? description : undefined;
    const result = await createDatasetToken(cid, name, symbol, descriptionToPass, supply, creatorAddress);

    console.log(`   ✅ Token created: ${result.tokenAddress}`);
    console.log(`   ✅ Marketplace: ${result.marketplaceAddress}`);

    // No need to save to userDatasets.json - PostgreSQL and blockchain are the source of truth
    console.log(`   ✅ Dataset created: ${result.symbol} (stored in PostgreSQL)`);

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

// Faucet endpoints
app.post("/faucet/eth", async (req, res) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress || !ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Valid user address is required" });
    }

    // Check cooldown
    const cooldownCheck = canClaim(userAddress, 'eth');
    if (!cooldownCheck.canClaim) {
      return res.status(429).json({
        error: "Cooldown active",
        message: `Please wait ${cooldownCheck.hoursRemaining}h ${cooldownCheck.minutesRemaining}m before claiming again`,
        hoursRemaining: cooldownCheck.hoursRemaining,
        minutesRemaining: cooldownCheck.minutesRemaining
      });
    }

    // Send 0.001 ETH
    const result = await sendETH(userAddress, "0.001");
    
    // Record claim
    recordClaim(userAddress, 'eth');

    res.json({
      success: true,
      message: "0.001 ETH sent successfully",
      txHash: result.txHash,
      amount: "0.001"
    });
  } catch (err) {
    console.error("ETH faucet error:", err);
    res.status(500).json({
      error: "Failed to send ETH",
      message: err.message
    });
  }
});

app.post("/faucet/usdc", async (req, res) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress || !ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Valid user address is required" });
    }

    // Check cooldown
    const cooldownCheck = canClaim(userAddress, 'usdc');
    if (!cooldownCheck.canClaim) {
      return res.status(429).json({
        error: "Cooldown active",
        message: `Please wait ${cooldownCheck.hoursRemaining}h ${cooldownCheck.minutesRemaining}m before claiming again`,
        hoursRemaining: cooldownCheck.hoursRemaining,
        minutesRemaining: cooldownCheck.minutesRemaining
      });
    }

    // Send 5 USDC
    const result = await sendUSDC(userAddress, "5");
    
    // Record claim
    recordClaim(userAddress, 'usdc');

    res.json({
      success: true,
      message: "5 USDC sent successfully",
      txHash: result.txHash,
      amount: "5"
    });
  } catch (err) {
    console.error("USDC faucet error:", err);
    res.status(500).json({
      error: "Failed to send USDC",
      message: err.message
    });
  }
});

// Check faucet cooldown status
app.get("/faucet/status/:userAddress", (req, res) => {
  try {
    const { userAddress } = req.params;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const ethStatus = canClaim(userAddress, 'eth');
    const usdcStatus = canClaim(userAddress, 'usdc');

    res.json({
      eth: {
        canClaim: ethStatus.canClaim,
        hoursRemaining: ethStatus.hoursRemaining || 0,
        minutesRemaining: ethStatus.minutesRemaining || 0
      },
      usdc: {
        canClaim: usdcStatus.canClaim,
        hoursRemaining: usdcStatus.hoursRemaining || 0,
        minutesRemaining: usdcStatus.minutesRemaining || 0
      }
    });
  } catch (err) {
    console.error("Faucet status error:", err);
    res.status(500).json({ error: "Failed to check status" });
  }
});

// Get user's datasets (created and bought) with real-time balances
// NOTE: No longer uses userDatasets.json - queries PostgreSQL and blockchain directly
app.get("/api/my-datasets/:userAddress", async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const userAddressLower = userAddress.toLowerCase();
    const datasetsWithBalance = [];

    // 1. Get 'created' datasets: Query PostgreSQL for tokens where user is creator
    if (process.env.DATABASE_URL) {
      try {
        const createdCoins = await getCoinsByCreator(userAddress);
        for (const coin of createdCoins) {
          try {
            // Fetch real-time balance for created tokens
            const token = new ethers.Contract(coin.token_address, ERC20_ABI, provider);
            const balance = await token.balanceOf(userAddress);
            
            datasetsWithBalance.push({
              userAddress: userAddressLower,
              tokenAddress: coin.token_address.toLowerCase(),
              name: coin.name,
              symbol: coin.symbol,
              description: coin.description || "",
              cid: coin.cid || "",
              totalSupply: Number(coin.total_supply),
              creatorAddress: coin.creator_address.toLowerCase(),
              marketplaceAddress: coin.marketplace_address.toLowerCase(),
              type: 'created',
              amount: balance.toString(),
              realTimeBalance: balance.toString()
            });
          } catch (err) {
            console.error(`Error fetching balance for created token ${coin.token_address}:`, err);
          }
        }
      } catch (err) {
        console.error("Error fetching created coins from DB:", err);
      }
    }

    // 2. Get 'bought' datasets: Query all tokens from PostgreSQL, check on-chain balance
    // Only include tokens where user has balance > 0 (they bought/sold)
    if (process.env.DATABASE_URL) {
      try {
        const allCoins = await getAllCoins();
        
        // Filter out tokens user already has in 'created' list to avoid duplicates
        const createdTokenAddrs = new Set(
          datasetsWithBalance.map(d => d.tokenAddress.toLowerCase())
        );
        
        for (const coin of allCoins) {
          const tokenAddrLower = coin.token_address.toLowerCase();
          
          // Skip if user created this token (already in created list)
          if (createdTokenAddrs.has(tokenAddrLower)) {
            continue;
          }
          
          try {
            // Check if user has any balance of this token
            const token = new ethers.Contract(coin.token_address, ERC20_ABI, provider);
            const balance = await token.balanceOf(userAddress);
            
            // Only include if user has balance > 0 (they bought this token)
            if (balance > 0n) {
              datasetsWithBalance.push({
                userAddress: userAddressLower,
                tokenAddress: tokenAddrLower,
                name: coin.name,
                symbol: coin.symbol,
                description: coin.description || "",
                cid: coin.cid || "",
                totalSupply: Number(coin.total_supply),
                creatorAddress: coin.creator_address.toLowerCase(),
                marketplaceAddress: coin.marketplace_address.toLowerCase(),
                type: 'bought',
                amount: balance.toString(),
                realTimeBalance: balance.toString()
              });
            }
          } catch (err) {
            console.error(`Error checking balance for token ${coin.token_address}:`, err);
            // Skip tokens we can't query
          }
        }
      } catch (err) {
        console.error("Error fetching all coins from DB:", err);
      }
    }
    
    // Sort by creation time (if available) or by symbol
    datasetsWithBalance.sort((a, b) => {
      // Created datasets first, then by symbol
      if (a.type === 'created' && b.type !== 'created') return -1;
      if (a.type !== 'created' && b.type === 'created') return 1;
      return a.symbol.localeCompare(b.symbol);
    });
    
    // Count purchased datasets (same logic as "Purchased Datasets" on My Datasets page)
    // This matches what the user sees - number of bought datasets they currently own
    const purchasedDatasetsCount = datasetsWithBalance.filter(d => d.type === 'bought').length;
    
    res.json({
      datasets: datasetsWithBalance,
      tradeCount: purchasedDatasetsCount  // Match the "Purchased Datasets" count
    });
  } catch (err) {
    console.error("My datasets error:", err);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
});

// Serve frontend for all other routes (SPA fallback)
// Only if the request accepts HTML (not for API calls)
app.get("*", (req, res) => {
  if (req.accepts('html')) {
    const indexPath = path.join(__dirname, "../dist/index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // If dist folder doesn't exist (development mode), return a simple message
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MYRAD Backend</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            h1 { color: #00d4ff; }
          </style>
        </head>
        <body>
          <h1>🚀 MYRAD Backend API Running</h1>
          <p>Frontend not built yet. Run <code>npm run build</code> to build the frontend.</p>
          <p>API is available at: <a href="/health">/health</a></p>
        </body>
        </html>
      `);
    }
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.listen(PORT, async () => {
  try {
    await initSchema();
  } catch (e) {
    console.warn('[db] init error:', e.message);
  }
  console.log(`🚀 Backend API running on port ${PORT}`);
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`📊 Available at: ${url}`);
});

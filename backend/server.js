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
import { getAllCoins, getCoinsByCreator, getCoinByTokenAddress, trackUserConnection, getAllUsers, getTotalDatasetsCount,getTotalUsersCount,getAllTokenAddresses, getCoinByCid } from './storage.js';
import { canClaim, recordClaim, sendETH, sendUSDC } from './faucet.js';
import { fileURLToPath } from "url";
import { signDownloadUrl, saveAccess } from "./utils.js";
import { getTotalTxForAllTokens } from "./txCounter.js";

import { scanFileComprehensive } from "./virusTotal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { PORT, DATASETS_FILE, DB_FILE, RPC_URLS } = config;

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

const MARKETPLACE_ABI_NEW = [
  "function getPriceUSDCperToken() external view returns (uint256)",
  "function getReserves() external view returns (uint256 rToken, uint256 rUSDC)",
  "function poolExists() external view returns (bool)"
];

const MARKETPLACE_ABI_OLD = [
  "function getPriceUSDCperToken(address token) external view returns (uint256)",
  "function getReserves(address token) external view returns (uint256 rToken, uint256 rUSDC)",
  "function poolExists(address token) external view returns (bool)"
];

const BONDING_CURVE_EVENTS_IFACE = new ethers.Interface([
  "event TokensBurned(address indexed burner, uint256 amountBurned, uint256 newPrice)",
  "event AccessGranted(address indexed buyer)"
]);

// Use config RPC (first URL as primary)
const provider = new ethers.JsonRpcProvider(RPC_URLS[0]);

// Simple in-memory cache for pool state to reduce RPC usage
const CACHE_TTL_MS = parseInt(process.env.PRICE_CACHE_TTL_MS || "15000", 10); // default 15s
const poolCache = new Map();

const cacheKey = (marketplaceAddress, tokenAddress) =>
  `${marketplaceAddress.toLowerCase()}::${tokenAddress.toLowerCase()}`;

const getCachedPoolState = (marketplaceAddress, tokenAddress) => {
  const key = cacheKey(marketplaceAddress, tokenAddress);
  const entry = poolCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    poolCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCachedPoolState = (marketplaceAddress, tokenAddress, value) => {
  const key = cacheKey(marketplaceAddress, tokenAddress);
  poolCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

async function fetchPoolState(marketplaceAddress, tokenAddress) {
  const cached = getCachedPoolState(marketplaceAddress, tokenAddress);
  if (cached) {
    return cached;
  }

  let exists, price, rToken, rUSDC;

  try {
    // BondingCurve (no token arg)
    const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI_NEW, provider);
    exists = await marketplace.poolExists();
    price = await marketplace.getPriceUSDCperToken();
    [rToken, rUSDC] = await marketplace.getReserves();
  } catch (e) {
    try {
      // DataTokenMarketplace (requires token arg)
      const legacyMarketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI_OLD, provider);
      exists = await legacyMarketplace.poolExists(tokenAddress);
      if (!exists) {
        return { exists: false };
      }
      price = await legacyMarketplace.getPriceUSDCperToken(tokenAddress);
      [rToken, rUSDC] = await legacyMarketplace.getReserves(tokenAddress);
    } catch (innerError) {
      // Silently handle legacy/broken contracts - cache the failure to avoid spam
      const failResult = { exists: false, error: 'legacy_contract' };
      setCachedPoolState(marketplaceAddress, tokenAddress, failResult);
      return failResult;
    }
  }

  const result = { exists, price, rToken, rUSDC };
  if (exists) {
    setCachedPoolState(marketplaceAddress, tokenAddress, result);
  }
  return result;
}

function clearPoolCacheFor(marketplaceAddress, tokenAddress) {
  const key = cacheKey(marketplaceAddress, tokenAddress);
  poolCache.delete(key);
}

app.get("/", (req, res) => {
  res.send("MYRAD Backend API running");
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

app.post("/track-wallet", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Valid wallet address is required" });
    }

    const user = await trackUserConnection(walletAddress);
    
    if (user) {
      return res.json({
        success: true,
        walletAddress: user.wallet_address,
        firstConnectedAt: user.first_connected_at,
        lastConnectedAt: user.last_connected_at,
        connectionCount: user.connection_count
      });
    } else {
      // Database not configured, but don't fail the request
      return res.json({ success: true, message: "Tracking disabled (no database)" });
    }
  } catch (err) {
    console.error("Track wallet error:", err);
    // Don't fail the request if tracking fails
    return res.json({ success: false, error: "Failed to track wallet connection" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        walletAddress: u.wallet_address,
        firstConnectedAt: u.first_connected_at,
        lastConnectedAt: u.last_connected_at,
        connectionCount: u.connection_count
      }))
    });
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/price/:marketplaceAddress/:tokenAddress", async (req, res) => {
  try {
    const { marketplaceAddress, tokenAddress } = req.params;

    if (!ethers.isAddress(marketplaceAddress) || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const state = await fetchPoolState(marketplaceAddress, tokenAddress);
    const { exists, price, rToken, rUSDC, error } = state;

    if (!exists) {
      // Don't log errors for known legacy contracts
      if (error !== 'legacy_contract') {
      }
      return res.status(404).json({ error: "Pool not initialized" });
    }

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

    const { exists, rToken, rUSDC } = await fetchPoolState(marketplaceAddress, tokenAddress);
    if (!exists) {
      return res.status(404).json({ error: "Pool not initialized" });
    }

    const usdcValue = ethers.parseUnits(usdcAmount, 6);
    
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

    const { exists, rToken, rUSDC } = await fetchPoolState(marketplaceAddress, tokenAddress);
    if (!exists) {
      return res.status(404).json({ error: "Pool not initialized" });
    }

    const tokenValue = ethers.parseUnits(tokenAmount, 18);
    
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

const getDatasetMeta = async (tokenAddress) => {
  const lower = tokenAddress.toLowerCase();
  const dbEntry = await getCoinByTokenAddress(lower);
  if (dbEntry) {
    return {
      symbol: dbEntry.symbol,
      cid: dbEntry.cid,
    };
  }

  if (fs.existsSync(DATASETS_FILE)) {
    try {
      const datasets = JSON.parse(fs.readFileSync(DATASETS_FILE));
      const entry = datasets[lower];
      if (entry) {
        return {
          symbol: entry.symbol,
          cid: entry.cid,
        };
      }
    } catch (err) {
      console.error("Failed to read datasets.json:", err.message);
    }
  }
  return null;
};

app.post("/access/fast-track", async (req, res) => {
  try {
    const { txHash, userAddress, tokenAddress, marketplaceAddress, symbol: fallbackSymbol } = req.body || {};

    if (!txHash || !ethers.isHexString(txHash)) {
      return res.status(400).json({ error: "Valid txHash is required" });
    }
    if (!userAddress || !ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Valid userAddress is required" });
    }
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: "Valid tokenAddress is required" });
    }
    if (!marketplaceAddress || !ethers.isAddress(marketplaceAddress)) {
      return res.status(400).json({ error: "Valid marketplaceAddress is required" });
    }

    const expAddress = marketplaceAddress.toLowerCase();

    let receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      receipt = await provider.waitForTransaction(txHash, 1, 15_000);
    }
    if (!receipt) {
      return res.status(404).json({ error: "Transaction not yet available" });
    }
    if (receipt.status !== 1n && receipt.status !== 1) {
      return res.status(400).json({ error: "Transaction failed" });
    }

    const userLower = userAddress.toLowerCase();
    let authorized = false;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== expAddress) continue;
      try {
        const parsed = BONDING_CURVE_EVENTS_IFACE.parseLog(log);
        if (!parsed) continue;

        if (parsed.name === "TokensBurned" && parsed.args?.burner?.toLowerCase?.() === userLower) {
          authorized = true;
          break;
        }
        if (parsed.name === "AccessGranted" && parsed.args?.buyer?.toLowerCase?.() === userLower) {
          authorized = true;
          break;
        }
      } catch {
        // ignore logs that don't match our interface
      }
    }

    if (!authorized) {
      return res.status(403).json({ error: "Burn event not found in transaction logs" });
    }

    const datasetMeta = await getDatasetMeta(tokenAddress);
    if (!datasetMeta || !datasetMeta.cid) {
      return res.status(404).json({ error: "Dataset metadata not found" });
    }

    const cid = (datasetMeta.cid || "").replace("ipfs://", "");
    if (!cid) {
      return res.status(404).json({ error: "Dataset CID missing" });
    }

    const downloadUrl = signDownloadUrl(cid, userAddress);
    saveAccess({
      user: userLower,
      symbol: datasetMeta.symbol || fallbackSymbol || "",
      token: tokenAddress.toLowerCase(),
      downloadUrl,
      ts: Date.now(),
    });

    res.json({
      download: downloadUrl,
      symbol: datasetMeta.symbol || fallbackSymbol || "",
    });
  } catch (err) {
    console.error("Fast-track access error:", err);
    res.status(500).json({ error: "Failed to grant access" });
  }
});


app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Argument 'file' is missing" });
    }

    const file = req.file;
    const fileName = file.originalname.toLowerCase();
    const fileExt = fileName.split('.').pop() || '';

    // Block media files (MP3, MP4, etc.)
    const blockedExtensions = ['mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 
                               'm4a', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4v', '3gp'];
    if (blockedExtensions.includes(fileExt)) {
      return res.status(400).json({
        error: "file_type_not_allowed",
        message: `Media files (${fileExt.toUpperCase()}) are not allowed. Please upload data files only.`
      });
    }

    // Comprehensive VirusTotal scan with proper checks
    const scanResult = await scanFileComprehensive(file.buffer, file.originalname);

    if (!scanResult.safetyCheck) {
      return res.status(500).json({
        error: "vt_scan_failed",
        message: "VirusTotal scan failed to return safety check",
      });
    }

    // Check if file is safe
    if (!scanResult.safetyCheck.safe) {
      return res.status(400).json({
        error: "malicious",
        message: scanResult.safetyCheck.reason || "VirusTotal flagged this file as unsafe",
        stats: scanResult.safetyCheck.stats,
        results: scanResult.safetyCheck.results,
        hash: scanResult.hash
      });
    }

    // File is safe - return success
    res.json({
      success: true,
      scanPassed: true,
      filename: file.originalname,
      size: file.size,
      stats: scanResult.safetyCheck.stats,
      hash: scanResult.hash,
      fromCache: scanResult.fromCache,
      message: "File scanned successfully. Now create your token."
    });

  } catch (err) {
    console.error("Scan error:", err);
    
    // Check if it's a rate limit error
    const isRateLimitError = err.message && (
      err.message.includes('rate-limited') ||
      err.message.includes('rate limit') ||
      err.message.includes('Rate limit') ||
      err.message.includes('429') ||
      err.message.includes('403')
    );
    
    if (isRateLimitError) {
      return res.status(429).json({
        error: "vt_scan_failed",
        message: "VirusTotal scan error. Please refresh the page & try again."
      });
    }
    
    res.status(500).json({
      error: "scan_failed",
      message: err.message || "VirusTotal scan failed"
    });
  }
});

app.post("/create-dataset", upload.single("file"), async (req, res) => {
  try {
    // NOW we need the file uploaded again
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const uploadFile = req.file;
    const fileName = uploadFile.originalname.toLowerCase();
    const fileExt = fileName.split('.').pop() || '';

    // Block media files (MP3, MP4, etc.)
    const blockedExtensions = ['mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 
                               'm4a', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4v', '3gp'];
    if (blockedExtensions.includes(fileExt)) {
      return res.status(400).json({
        error: "file_type_not_allowed",
        message: `Media files (${fileExt.toUpperCase()}) are not allowed. Please upload data files only.`
      });
    }

    const { name, symbol, description, totalSupply, creatorAddress } = req.body;

    if (!name || !symbol) {
      return res.status(400).json({
        error: "Missing required fields: name, symbol",
      });
    }

    if (!creatorAddress || !ethers.isAddress(creatorAddress)) {
      return res.status(400).json({
        error: "Valid creator wallet address is required",
      });
    }

    if (!/^[A-Z0-9]{1,10}$/.test(symbol)) {
      return res.status(400).json({
        error: "Symbol must be 1-10 uppercase letters/numbers",
      });
    }

    const supply = 1000000;
    if (supply <= 0 || !Number.isInteger(supply)) {
      return res.status(400).json({
        error: "Total supply must be a positive integer",
      });
    }

    if (!process.env.FACTORY_ADDRESS) {
      return res.status(400).json({
        error: "FACTORY_ADDRESS not configured",
      });
    }

    if (!process.env.MYRAD_TREASURY || !ethers.isAddress(process.env.MYRAD_TREASURY)) {
      return res.status(400).json({
        error: "MYRAD_TREASURY not configured",
      });
    }

    // NOW upload to Lighthouse (only when actually creating token)
    const base64Data = uploadFile.buffer.toString("base64");
    const cid = await uploadBase64ToLighthouse(base64Data, uploadFile.originalname);

    // Normalize CID for checking (remove any ipfs:// prefix and trim)
    const normalizedCid = (cid || '').toString().replace(/^ipfs:\/\//, '').trim();
    
    if (!normalizedCid) {
      return res.status(400).json({
        error: "invalid_cid",
        message: "Failed to get CID from file upload"
      });
    }

    console.log(`[CREATE DATASET] Starting duplicate check for CID: "${normalizedCid}"`);

    // Check if this CID already exists in the database (duplicate file check)
    // This MUST complete successfully before proceeding
    let existingCoin;
    try {
      existingCoin = await getCoinByCid(normalizedCid);
    } catch (checkErr) {
      console.error(`[CREATE DATASET] ❌ Duplicate check failed:`, checkErr);
      return res.status(500).json({
        error: "duplicate_check_failed",
        message: "Failed to verify if file is duplicate. Please try again.",
        details: checkErr.message
      });
    }

    if (existingCoin) {
      console.error(`[CREATE DATASET] ❌ BLOCKED: Duplicate file detected!`, {
        cid: normalizedCid,
        existingToken: existingCoin.token_address,
        existingName: existingCoin.name,
        existingSymbol: existingCoin.symbol,
        storedCid: existingCoin.cid
      });
      return res.status(400).json({
        error: "duplicate_file",
        message: "This file has already been uploaded. Each file can only be used once to create a dataset token.",
        existingToken: {
          address: existingCoin.token_address,
          name: existingCoin.name,
          symbol: existingCoin.symbol
        }
      });
    }
    
    console.log(`[CREATE DATASET] ✅ Duplicate check passed for CID: "${normalizedCid}" - proceeding with token creation`);

    // Create token with the CID
    const descriptionToPass = description !== undefined ? description : undefined;
    const result = await createDatasetToken(cid, name, symbol, descriptionToPass, supply, creatorAddress);

    res.json({
      success: true,
      tokenAddress: result.tokenAddress,
      marketplaceAddress: result.marketplaceAddress,
      symbol: result.symbol,
      name: result.name,
      cid: cid,
      message: "Dataset created successfully",
    });
  } catch (err) {
    console.error("❌ Dataset creation error:", err.message);
    
    let errorMessage = err.message;
    if (err.message.includes("FACTORY_ADDRESS")) {
      errorMessage = "Factory address not configured. Deploy factory first.";
    } else if (err.message.includes("Insufficient USDC")) {
      errorMessage = "You need more USDC. Get faucet USDC from Base Sepolia.";
    }

    res.status(500).json({
      error: "Failed to create dataset",
      message: errorMessage,
      details: err.message,
    });
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

    // Send 3 USDC
    const result = await sendUSDC(userAddress, "3");
    
    // Record claim
    recordClaim(userAddress, 'usdc');

    res.json({
      success: true,
      message: "3 USDC sent successfully",
      txHash: result.txHash,
      amount: "3"
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

app.get("/api/datacoin/total-created", async (req, res) => {
  try {
    const totalCreated = await getTotalDatasetsCount();

    res.json({ totalCreated });
    
  } catch (error) {
    console.error("Error fetching global datacoins/dataset count:", error);
    res.status(500).json({ error: "Failed to fetch total datacoins/dataset count" });
  }
});

app.get("/api/users/total", async (req, res) => {
  try {
    const totalUsers = await getTotalUsersCount();
    res.json({ totalUsers });
  } catch (err) {
    console.error("Error fetching user count:", err);
    res.status(500).json({ error: "Failed to fetch total user count" });
  }
});

app.get("/api/datacoin/total-transactions", async (req, res) => {
  try {
    const addrs = await getAllTokenAddresses();
    const totalTx = await getTotalTxForAllTokens();
    res.json({ totalTx });
  } catch (err) {
    console.error("Error calculating total transactions:", err);
    res.status(500).json({ error: "Failed to compute datacoin transactions" });
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
          <h1>MYRAD Backend API Running</h1>
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
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`🚀 MYRAD Backend API listening at ${url}`) ;
});

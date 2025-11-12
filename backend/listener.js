import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import { signDownloadUrl, saveAccess } from "./utils.js";
import { getCoinByTokenAddress, getAllCoins } from "./storage.js";
import { query } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { RPC_URLS, DATASETS_FILE, MAX_BLOCK_RANGE } = config;

const POLL_INTERVAL = 60000; // polling interval when using HTTP (increased to 60s to reduce load)
const LAST_BLOCK_FILE = path.join(__dirname, "lastBlock.json");
const MAX_CHUNKS_PER_POLL = parseInt(process.env.MAX_CHUNKS_PER_POLL || "10", 10); // Reduced from 50 to 10 to avoid rate limits

// Reuse JsonRpcProviders instead of instantiating a new one per chunk call
const providerPool = [];
for (let i = 0; i < RPC_URLS.length; i++) {
  const url = RPC_URLS[i];
  providerPool.push(new ethers.JsonRpcProvider(url));
}
let currentProviderIndex = 0;

// Primary provider for general reads, rotates when necessary
function createProvider() {
  return providerPool[currentProviderIndex];
}

function rotateProvider() {
  currentProviderIndex = (currentProviderIndex + 1) % providerPool.length;
  console.warn(`⚠️ Switching to fallback RPC provider: ${RPC_URLS[currentProviderIndex]}`);
  return providerPool[currentProviderIndex];
}

// Helper to try multiple RPCs for getLogs with automatic chunking for free tier limits
async function getLogsWithFallback(address, fromBlock, toBlock, topics) {
  const blockRange = toBlock - fromBlock + 1;
  
  // If range is within free tier limit, query directly
  if (blockRange <= MAX_BLOCK_RANGE) {
    for (let i = 0; i < providerPool.length; i++) {
      try {
        const provider = providerPool[i];
        const logs = await provider.getLogs({
          address,
          fromBlock,
          toBlock,
          topics
        });
        return logs;
      } catch (err) {
        if (i < providerPool.length - 1) {
          console.warn(`⚠️  RPC ${RPC_URLS[i]} failed, trying next...`);
        } else {
          console.error(`❌ All RPCs failed for direct query ${fromBlock}-${toBlock}`);
          rotateProvider();
          throw err; // All RPCs failed
        }
      }
    }
    return [];
  }
  
  // Range too large - chunk it into smaller pieces
  const totalChunks = Math.ceil(blockRange / MAX_BLOCK_RANGE);
  const allLogs = [];
  let chunkNum = 0;
  
  for (let start = fromBlock; start <= toBlock; start += MAX_BLOCK_RANGE) {
    const end = Math.min(start + MAX_BLOCK_RANGE - 1, toBlock);
    chunkNum++;
    
    let chunkSuccessful = false;
    for (let i = 0; i < providerPool.length; i++) {
      try {
        const provider = providerPool[i];
        const logs = await provider.getLogs({
          address,
          fromBlock: start,
          toBlock: end,
          topics
        });
        
        if (logs.length > 0) {
        }
        allLogs.push(...logs);
        chunkSuccessful = true;
        break; // Success, move to next chunk
      } catch (err) {
        if (i < providerPool.length - 1) {
          console.warn(`⚠️  RPC ${RPC_URLS[i]} failed for chunk ${start}-${end}, trying next...`);
        } else {
          console.error(`❌ All RPCs failed for chunk ${chunkNum}/${totalChunks} (${start}-${end}), skipping...`);
          rotateProvider();
          // Continue with next chunk instead of failing completely
        }
      }
    }
    
    if (!chunkSuccessful) {
      saveLastBlock(end);
    }
    
    // Longer delay between chunks to avoid rate limiting
    if (start + MAX_BLOCK_RANGE <= toBlock) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between chunks (increased from 300ms)
    }
  }
  
  return allLogs;
}

// Load datasets from PostgreSQL or fallback to JSON
async function loadDatasets() {
  // Try PostgreSQL first if configured
  if (process.env.DATABASE_URL) {
    try {
      const coins = await getAllCoins();
      const map = {};
      for (const c of coins) {
        map[c.token_address.toLowerCase()] = {
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
      return map;
    } catch (err) {
      console.error('Error loading datasets from DB, falling back to JSON:', err.message);
    }
  }
  
  // Fallback to JSON file
  if (!fs.existsSync(DATASETS_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATASETS_FILE));
}

// Get single dataset from PostgreSQL or fallback to JSON
async function getDatasetByTokenAddress(tokenAddr) {
  const tokenKey = tokenAddr.toLowerCase();
  
  // Try PostgreSQL first if configured
  if (process.env.DATABASE_URL) {
    try {
      const coin = await getCoinByTokenAddress(tokenKey);
      if (coin) {
        return {
          name: coin.name,
          symbol: coin.symbol,
          cid: coin.cid,
          description: coin.description,
          token_address: coin.token_address,
          marketplace: coin.marketplace_address,
          marketplace_address: coin.marketplace_address,
          bonding_curve: coin.marketplace_address,
          creator: coin.creator_address,
          total_supply: Number(coin.total_supply),
          created_at: new Date(coin.created_at).getTime(),
        };
      }
    } catch (err) {
      console.error(`Error loading dataset ${tokenKey} from DB:`, err.message);
    }
  }
  
  // Fallback to JSON file
  if (fs.existsSync(DATASETS_FILE)) {
    const datasets = JSON.parse(fs.readFileSync(DATASETS_FILE));
    return datasets[tokenKey];
  }
  
  return null;
}

function saveLastBlock(n) {
  try { fs.writeFileSync(LAST_BLOCK_FILE, JSON.stringify({ lastBlock: Number(n) }, null, 2)); } catch {}
}
function loadLastBlock() {
  try {
    if (!fs.existsSync(LAST_BLOCK_FILE)) return null;
    const j = JSON.parse(fs.readFileSync(LAST_BLOCK_FILE));
    return j.lastBlock || null;
  } catch { return null; }
}

async function handleRedeemOrBurn(tokenAddr, userAddress, amount, symbol) {
  const meta = await getDatasetByTokenAddress(tokenAddr);
  if (!meta) {
    return;
  }
  const cid = (meta.cid || "").replace("ipfs://", "");
  const url = signDownloadUrl(cid, userAddress);
  const entry = {
    user: userAddress.toLowerCase(),
    symbol: meta.symbol,
    token: tokenAddr.toLowerCase(),
    amount: amount ? amount.toString() : "0",
    downloadUrl: url,
    ts: Date.now()
  };
  saveAccess(entry);
}

async function saveBoughtDataset(tokenAddr, buyerAddress, tokensOut) {
  try {
    const tokenKey = tokenAddr.toLowerCase();
    const meta = await getDatasetByTokenAddress(tokenKey);
    
    // If token not found, log warning but still track the trade
    if (!meta) {
      console.warn(`⚠️ Token ${tokenAddr} not found in database. Trade will be tracked but dataset entry may be incomplete.`);
      // Still create entry with minimal info - the balance will be tracked
      const minimalMeta = {
        name: 'Unknown Token',
        symbol: tokenKey.substring(0, 10).toUpperCase(),
        cid: '',
        description: '',
        total_supply: 0,
        creator: '',
        marketplace: '',
        marketplace_address: ''
      };
      // No need to track balance in JSON - blockchain is source of truth
      // Just log the trade (already tracked via addTrade below)
      return;
    }

    // No need to track balance in userDatasets.json - blockchain is source of truth
    // Balance will be fetched directly from blockchain when needed
  } catch (err) {
    console.error("Error saving bought dataset:", err);
  }
}

async function handleSoldDataset(tokenAddr, sellerAddress, tokensIn) {
  try {
    const meta = await getDatasetByTokenAddress(tokenAddr);
    if (!meta) {
      return;
    }

    // No need to track balance in userDatasets.json - blockchain is source of truth
    // Balance will be fetched directly from blockchain when needed
  } catch (err) {
    console.error("Error handling sold dataset:", err);
  }
}

// ---- Create provider ----
let provider = createProvider();

// Minimal ABIs
const ERC20_ABI = [
  "event Transfer(address indexed from,address indexed to,uint256 value)"
];
const REDEEMED_ABI = [
  "event Redeemed(address indexed user,uint256 amount,string indexed ticker)"
];
// BondingCurve ABI - each token has its own pool
const BONDING_CURVE_ABI = [
  "event AccessGranted(address indexed buyer)",
  "event Bought(address indexed buyer, uint256 usdcIn, uint256 fee, uint256 tokensOut)",
  "event Sold(address indexed seller, uint256 tokensIn, uint256 usdcOut)",
  "event TokensBurned(address indexed burner, uint256 amountBurned, uint256 newPrice)"
];

// If WebSocket provider: subscribe per-contract (best)
if (provider instanceof ethers.WebSocketProvider) {
  (async () => {
    const datasets = await loadDatasets();
    for (const [tokenAddr, meta] of Object.entries(datasets)) {
      const addr = tokenAddr.toLowerCase();
      const contract = new ethers.Contract(addr, ERC20_ABI.concat(REDEEMED_ABI), provider);
      contract.on("Transfer", (from, to, value, event) => {
        try {
          if (to === ethers.ZeroAddress) {
            handleRedeemOrBurn(addr, from, value, meta.symbol);
          }
        } catch (err) {
          console.error("Transfer handler error:", err);
        }
      });

      contract.on("Redeemed", (user, amount, ticker, event) => {
        try {
          handleRedeemOrBurn(addr, user, amount, ticker);
        } catch (err) {
          console.error("Redeemed handler error:", err);
        }
      });
    }

    // Also listen to marketplace AccessGranted events
    const uniqueMarketplaces = new Set();
    for (const [tokenAddr, meta] of Object.entries(datasets)) {
      const marketplace = meta.marketplace || meta.marketplace_address;
      if (marketplace) {
        uniqueMarketplaces.add(marketplace.toLowerCase());
      }
    }
    
    // Build a map of bondingCurve address => token address
    const bondingCurveToToken = {};
    for (const [tokenAddr, meta] of Object.entries(datasets)) {
      const bondingCurve = meta.marketplace || meta.marketplace_address || meta.bonding_curve;
      if (bondingCurve) {
        bondingCurveToToken[bondingCurve.toLowerCase()] = tokenAddr.toLowerCase();
      }
    }

    for (const marketplaceAddr of uniqueMarketplaces) {
      const tokenAddr = bondingCurveToToken[marketplaceAddr];
      const bondingCurveContract = new ethers.Contract(marketplaceAddr, BONDING_CURVE_ABI, provider);
      const tokenMeta = datasets[tokenAddr];
      bondingCurveContract.on("AccessGranted", async (buyer, event) => {
        try {
          // Find the token symbol from database
          const tokenMeta = await getDatasetByTokenAddress(tokenAddr);
          if (tokenMeta) {
            await handleRedeemOrBurn(tokenAddr.toLowerCase(), buyer, 0, tokenMeta.symbol);
          } else {
          }
        } catch (err) {
          console.error("AccessGranted handler error:", err);
        }
      });

      bondingCurveContract.on("Bought", async (buyer, usdcIn, fee, tokensOut, event) => {
        try {
          // Save dataset entry
          await saveBoughtDataset(tokenAddr, buyer, tokensOut);
          
          // Transaction is automatically tracked on-chain - query getTradeCount() to retrieve count
          const tokenMeta = await getDatasetByTokenAddress(tokenAddr);
        } catch (err) {
          console.error("Bought handler error:", err);
        }
      });

      bondingCurveContract.on("Sold", async (seller, tokensIn, usdcOut, event) => {
        try {
          // Subtract tokens from user's balance when they sell
          await handleSoldDataset(tokenAddr, seller, tokensIn);
        } catch (err) {
          console.error("Sold handler error:", err);
        }
      });

      bondingCurveContract.on("TokensBurned", async (burner, amountBurned, newPrice, event) => {
        try {
          const tokenMeta = await getDatasetByTokenAddress(tokenAddr);
          if (tokenMeta) {
            await handleRedeemOrBurn(tokenAddr, burner, amountBurned, tokenMeta.symbol);
          } else {
          }
        } catch (err) {
          console.error("TokensBurned handler error:", err);
        }
      });
    }

    // also poll database to pick up new tokens (so we can subscribe to new ones)
    setInterval(async () => {
      try {
        const ds = await loadDatasets();
        for (const [tokenAddr, meta] of Object.entries(ds)) {
          const addr = tokenAddr.toLowerCase();
          // if not already subscribed, create contract.on handlers
          // easiest: simply create a new contract and handlers (ethers deduplicates events per listener function)
          if (!global.__ws_subscribed) global.__ws_subscribed = new Set();
          if (global.__ws_subscribed.has(addr)) continue;
          const contract = new ethers.Contract(addr, ERC20_ABI.concat(REDEEMED_ABI), provider);
          contract.on("Transfer", (from, to, value, event) => {
            try {
              if (to === ethers.ZeroAddress) handleRedeemOrBurn(addr, from, value, meta.symbol);
            } catch (e) { console.error(e); }
          });
          contract.on("Redeemed", (user, amount, ticker, event) => {
            try { handleRedeemOrBurn(addr, user, amount, ticker); } catch (e) { console.error(e); }
          });
          global.__ws_subscribed.add(addr);
        }
      } catch (e) { console.error("WS repeat subscribe error:", e); }
    }, 20000);

  })().catch(console.error);

} else {
  // JsonRpcProvider: implement polling using eth_getLogs to avoid eth_newFilter/eth_getFilterChanges issues.
  (async () => {
    let lastBlock = loadLastBlock();
    if (!lastBlock) {
      // pick a safe starting block a bit before latest to avoid missing logs
      const latest = await provider.getBlockNumber();
      lastBlock = Math.max(0, latest - 6);
      saveLastBlock(lastBlock);
    }
    async function pollOnce() {
      try {
        const datasets = await loadDatasets();
        const tokenAddrs = Object.keys(datasets);
        
        // CRITICAL FIX: Even if no datasets loaded, we still need to poll marketplace events
        // Otherwise we'll miss all buy/sell events for tokens not yet in the system
        // We still update lastBlock and continue to marketplace polling below
        if (tokenAddrs.length === 0) {
          const latest = await provider.getBlockNumber();
          lastBlock = Math.max(lastBlock, latest);
          saveLastBlock(lastBlock);
          // DON'T return - continue to marketplace polling below!
        }

        const latest = await provider.getBlockNumber();
        const MAX_BACKFILL_BLOCKS = parseInt(process.env.MAX_BACKFILL_BLOCKS || "100", 10); // Reduced from 5000 to 100 to minimize RPC load
        if (latest - lastBlock > MAX_BACKFILL_BLOCKS) {
          const newStart = Math.max(0, latest - MAX_BACKFILL_BLOCKS);
          console.warn(
            `⚠️ Large block gap detected (${latest - lastBlock} blocks). ` +
            `Skipping ahead to block ${newStart} to avoid massive RPC backfill.`
          );
          lastBlock = newStart;
          saveLastBlock(lastBlock);
        }
        if (latest <= lastBlock) return; // nothing new

        const maxBlocksPerPoll = MAX_BLOCK_RANGE * MAX_CHUNKS_PER_POLL; // Now 10 blocks × 10 chunks = 100 blocks max per poll
        const cappedLatest = Math.min(latest, lastBlock + maxBlocksPerPoll);

        // for each token, query logs from lastBlock+1 .. latest
        const from = lastBlock + 1;
        const to = cappedLatest;
        // topics for Transfer and Redeemed (using ethers.id to get topic hash)
        const iface = new ethers.Interface(ERC20_ABI.concat(REDEEMED_ABI));
        const transferTopic = ethers.id("Transfer(address,address,uint256)");
        const redeemedTopic = ethers.id("Redeemed(address,uint256,string)");
        const bondingCurveIface = new ethers.Interface(BONDING_CURVE_ABI);
        const accessGrantedTopic = ethers.id("AccessGranted(address)");
        const boughtTopic = ethers.id("Bought(address,uint256,uint256,uint256)");
        const soldTopic = ethers.id("Sold(address,uint256,uint256)");
        const tokensBurnedTopic = ethers.id("TokensBurned(address,uint256,uint256)");

        for (const addr of tokenAddrs) {
          const token = addr.toLowerCase();
          
          // Query logs with automatic chunking for free tier RPC limits
          let logs = [];
          try {
            logs = await getLogsWithFallback(token, from, to, [[transferTopic, redeemedTopic]]);
          } catch (err) {
            console.error(`❌ Failed to get logs for token ${token}:`, err.message);
            continue; // Skip this token and move to next
          }

          if (logs.length === 0) continue;

          // parse logs
          for (const log of logs) {
            try {
              const parsed = iface.parseLog(log);
              if (!parsed) continue;
              if (parsed.name === "Transfer") {
                const from = parsed.args.from;
                const to = parsed.args.to;
                const value = parsed.args.value;
                if (to === ethers.ZeroAddress) {
                  const tokenMeta = datasets[token];
                  const symbol = tokenMeta ? tokenMeta.symbol : 'UNK';
                  await handleRedeemOrBurn(token, from, value, symbol);
                }
              } else if (parsed.name === "Redeemed") {
                const user = parsed.args.user;
                const amt = parsed.args.amount;
                const ticker = parsed.args.ticker;
                await handleRedeemOrBurn(token, user, amt, ticker);
              }
            } catch (err) {
              // parseLog throws when topics don't match signature; ignore
            }
          }
        } // end tokens loop

        // Poll marketplace AccessGranted events
        // Get unique marketplaces from the datasets we already loaded
        const uniqueMarketplaces = new Set();
        const marketplaceToToken = {};
        for (const [tokenAddr, meta] of Object.entries(datasets)) {
          const marketplace = meta.marketplace || meta.marketplace_address;
          if (marketplace) {
            const lower = marketplace.toLowerCase();
            uniqueMarketplaces.add(lower);
            marketplaceToToken[lower] = tokenAddr.toLowerCase();
          }
        }
        
        for (const marketplaceAddr of uniqueMarketplaces) {
          try {
            const marketplaceLogs = await getLogsWithFallback(marketplaceAddr, from, to, [[accessGrantedTopic, boughtTopic, soldTopic, tokensBurnedTopic]]);
            
            for (const log of marketplaceLogs) {
              try {
                const parsed = bondingCurveIface.parseLog(log);
                const tokenAddr = marketplaceToToken[marketplaceAddr];
                if (!tokenAddr) {
                  console.warn("⚠️ Bonding curve address not mapped to token:", marketplaceAddr);
                  continue;
                }
                const tokenMeta = await getDatasetByTokenAddress(tokenAddr);
                if (parsed && parsed.name === "AccessGranted") {
                  const [buyer] = parsed.args;
                  if (tokenMeta) {
                    await handleRedeemOrBurn(tokenAddr, buyer, 0, tokenMeta.symbol);
                  } else {
                  }
                } else if (parsed && parsed.name === "Bought") {
                  const [buyer, usdcIn, fee, tokensOut] = parsed.args;
                  // Save dataset entry
                  await saveBoughtDataset(tokenAddr, buyer, tokensOut);
                  
                  // Transaction is automatically tracked on-chain - query getTradeCount() to retrieve count
                } else if (parsed && parsed.name === "Sold") {
                  const [seller, tokenIn, usdcOut] = parsed.args;
                  await handleSoldDataset(tokenAddr, seller, tokenIn);
                } else if (parsed && parsed.name === "TokensBurned") {
                  const [burner, amountBurned] = parsed.args;
                  if (tokenMeta) {
                    await handleRedeemOrBurn(tokenAddr, burner, amountBurned, tokenMeta.symbol);
                  } else {
                  }
                }
              } catch (err) {
                console.error("Marketplace log parsing error:", err);
              }
            }
          } catch (err) {
            console.error("Bonding curve polling error:", err);
          }
        }

        lastBlock = to;
        saveLastBlock(lastBlock);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    // initial immediate poll
    await pollOnce();
    // then periodic
    setInterval(pollOnce, POLL_INTERVAL);
  })().catch(console.error);
}

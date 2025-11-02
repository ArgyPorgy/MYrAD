// backend/listener.js
// Robust listener: uses WebSocketProvider when RPC is ws(s)://, otherwise falls back to polling getLogs.
// Saves last processed block to backend/lastBlock.json to avoid duplicates across restarts.

require("dotenv").config(); // CRITICAL: Load environment variables
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { RPC_URLS, DATASETS_FILE, MAX_BLOCK_RANGE } = require("./config");
const { signDownloadUrl, saveAccess } = require("./utils");
// NOTE: No longer using userDatasets.json - we query PostgreSQL and blockchain directly for balances
// NOTE: No longer using addTrade - transactions are tracked on-chain automatically
const { getCoinByTokenAddress, getAllCoins } = require("./storage");
const { query } = require("./db");

const POLL_INTERVAL = 30000; // 30s polling when using HTTP (reduced to avoid rate limits)
const LAST_BLOCK_FILE = path.join(__dirname, "lastBlock.json");

// Create provider - will use first available RPC
function createProvider() {
  const rpcUrl = RPC_URLS[0];
  console.log(`Using JsonRpcProvider (HTTP) for RPC: ${rpcUrl}`);
  console.log(`📊 Block range limit: ${MAX_BLOCK_RANGE} blocks per query (free tier optimized)`);
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Helper to try multiple RPCs for getLogs with automatic chunking for free tier limits
async function getLogsWithFallback(address, fromBlock, toBlock, topics) {
  const blockRange = toBlock - fromBlock + 1;
  
  // If range is within free tier limit, query directly
  if (blockRange <= MAX_BLOCK_RANGE) {
    for (let i = 0; i < RPC_URLS.length; i++) {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URLS[i]);
        const logs = await provider.getLogs({
          address,
          fromBlock,
          toBlock,
          topics
        });
        return logs;
      } catch (err) {
        if (i < RPC_URLS.length - 1) {
          console.warn(`⚠️  RPC ${RPC_URLS[i]} failed, trying next...`);
        } else {
          throw err; // All RPCs failed
        }
      }
    }
    return [];
  }
  
  // Range too large - chunk it into smaller pieces
  const totalChunks = Math.ceil(blockRange / MAX_BLOCK_RANGE);
  console.log(`📊 Chunking getLogs query: blocks ${fromBlock}-${toBlock} (${blockRange} blocks) into ${totalChunks} chunks of ${MAX_BLOCK_RANGE} blocks`);
  const allLogs = [];
  let chunkNum = 0;
  
  for (let start = fromBlock; start <= toBlock; start += MAX_BLOCK_RANGE) {
    const end = Math.min(start + MAX_BLOCK_RANGE - 1, toBlock);
    chunkNum++;
    
    for (let i = 0; i < RPC_URLS.length; i++) {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URLS[i]);
        const logs = await provider.getLogs({
          address,
          fromBlock: start,
          toBlock: end,
          topics
        });
        
        if (logs.length > 0) {
          console.log(`   ✓ Chunk ${chunkNum}/${totalChunks} (blocks ${start}-${end}): found ${logs.length} log(s)`);
        }
        allLogs.push(...logs);
        break; // Success, move to next chunk
      } catch (err) {
        if (i < RPC_URLS.length - 1) {
          console.warn(`⚠️  RPC ${RPC_URLS[i]} failed for chunk ${start}-${end}, trying next...`);
        } else {
          console.error(`❌ All RPCs failed for chunk ${chunkNum}/${totalChunks} (${start}-${end}), skipping...`);
          // Continue with next chunk instead of failing completely
        }
      }
    }
    
    // Small delay between chunks to avoid rate limiting
    if (start + MAX_BLOCK_RANGE <= toBlock) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between chunks
    }
  }
  
  console.log(`   📦 Total logs collected: ${allLogs.length} from ${totalChunks} chunks`);
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
    console.log("Unknown token (not in database or datasets.json):", tokenAddr);
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
  console.log("🔥 Granting access:", entry);
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
        marketplace: process.env.MARKETPLACE_ADDRESS || '',
        marketplace_address: process.env.MARKETPLACE_ADDRESS || ''
      };
      // No need to track balance in JSON - blockchain is source of truth
      // Just log the trade (already tracked via addTrade below)
      console.log(`✅ Trade recorded for ${minimalMeta.symbol}: ${buyerAddress} bought ${ethers.formatUnits(tokensOut, 18)} tokens`);
      return;
    }

    // No need to track balance in userDatasets.json - blockchain is source of truth
    // Balance will be fetched directly from blockchain when needed
    console.log(`✅ Trade recorded for ${meta.symbol}: ${buyerAddress} bought ${ethers.formatUnits(tokensOut, 18)} tokens`);
  } catch (err) {
    console.error("Error saving bought dataset:", err);
  }
}

// REMOVED: createBoughtDatasetEntry - no longer needed
// Balances are queried directly from blockchain, not stored in userDatasets.json

async function handleSoldDataset(tokenAddr, sellerAddress, tokensIn) {
  try {
    const meta = await getDatasetByTokenAddress(tokenAddr);
    if (!meta) {
      console.log("Unknown token for sold dataset:", tokenAddr);
      return;
    }

    // No need to track balance in userDatasets.json - blockchain is source of truth
    // Balance will be fetched directly from blockchain when needed
    console.log(`✅ Trade recorded for ${meta.symbol}: ${sellerAddress} sold ${ethers.formatUnits(tokensIn, 18)} tokens`);
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
const MARKETPLACE_ABI = [
  "event AccessGranted(address indexed token, address indexed buyer)",
  "event Bought(address indexed token, address indexed buyer, uint256 usdcIn, uint256 fee, uint256 tokensOut)",
  "event Sold(address indexed token, address indexed seller, uint256 tokenIn, uint256 usdcOut)"
];

// If WebSocket provider: subscribe per-contract (best)
if (provider instanceof ethers.WebSocketProvider) {
  (async () => {
    const datasets = await loadDatasets();
    for (const [tokenAddr, meta] of Object.entries(datasets)) {
      const addr = tokenAddr.toLowerCase();
      const contract = new ethers.Contract(addr, ERC20_ABI.concat(REDEEMED_ABI), provider);
      console.log("👀 Subscribing via WS to:", addr, meta.symbol);

      contract.on("Transfer", (from, to, value, event) => {
        try {
          if (to === ethers.ZeroAddress) {
            console.log(`Transfer burn detected (WS): ${from} burned ${ethers.formatUnits(value, 18)} ${meta.symbol}`);
            handleRedeemOrBurn(addr, from, value, meta.symbol);
          }
        } catch (err) {
          console.error("Transfer handler error:", err);
        }
      });

      contract.on("Redeemed", (user, amount, ticker, event) => {
        try {
          console.log(`Redeemed event (WS): ${user} ${amount.toString()} ${ticker}`);
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
    
    // Also add the marketplace from env if available (for catching events from newly created tokens)
    if (process.env.MARKETPLACE_ADDRESS) {
      uniqueMarketplaces.add(process.env.MARKETPLACE_ADDRESS.toLowerCase());
    }

    for (const marketplaceAddr of uniqueMarketplaces) {
      const marketplaceContract = new ethers.Contract(marketplaceAddr, MARKETPLACE_ABI, provider);
      console.log("👀 Subscribing to marketplace AccessGranted events:", marketplaceAddr);

      marketplaceContract.on("AccessGranted", async (tokenAddr, buyer, event) => {
        try {
          console.log(`AccessGranted event (WS): ${buyer} granted access for token ${tokenAddr}`);
          // Find the token symbol from database
          const tokenMeta = await getDatasetByTokenAddress(tokenAddr);
          if (tokenMeta) {
            await handleRedeemOrBurn(tokenAddr.toLowerCase(), buyer, 0, tokenMeta.symbol);
          } else {
            console.log("Unknown token in AccessGranted event:", tokenAddr);
          }
        } catch (err) {
          console.error("AccessGranted handler error:", err);
        }
      });

      marketplaceContract.on("Bought", async (tokenAddr, buyer, usdcIn, fee, tokensOut, event) => {
        try {
          console.log(`Bought event (WS): ${buyer} bought ${ethers.formatUnits(tokensOut, 18)} tokens of ${tokenAddr}`);
          
          // Save dataset entry
          await saveBoughtDataset(tokenAddr.toLowerCase(), buyer, tokensOut);
          
          // Transaction is automatically tracked on-chain - query getTradeCount() to retrieve count
          console.log(`✅ Trade on-chain: ${buyer} bought ${ethers.formatUnits(tokensOut, 18)} ${meta.symbol}`);
        } catch (err) {
          console.error("Bought handler error:", err);
        }
      });

      marketplaceContract.on("Sold", async (tokenAddr, seller, tokenIn, usdcOut, event) => {
        try {
          console.log(`Sold event (WS): ${seller} sold ${ethers.formatUnits(tokenIn, 18)} tokens of ${tokenAddr}`);
          // Subtract tokens from user's balance when they sell
          await handleSoldDataset(tokenAddr.toLowerCase(), seller, tokenIn);
        } catch (err) {
          console.error("Sold handler error:", err);
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
          console.log("👀 WS subscribing new token:", addr, meta.symbol);
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

    console.log("Listener running (WS subscriptions active).");
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
    console.log("Starting polling from block:", lastBlock);

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
        if (latest <= lastBlock) return; // nothing new

        // for each token, query logs from lastBlock+1 .. latest
        const from = lastBlock + 1;
        const to = latest;
        // topics for Transfer and Redeemed (using ethers.id to get topic hash)
        const iface = new ethers.Interface(ERC20_ABI.concat(REDEEMED_ABI));
        const transferTopic = ethers.id("Transfer(address,address,uint256)");
        const redeemedTopic = ethers.id("Redeemed(address,uint256,string)");
        const marketplaceIface = new ethers.Interface(MARKETPLACE_ABI);
        const accessGrantedTopic = ethers.id("AccessGranted(address,address)");
        const boughtTopic = ethers.id("Bought(address,address,uint256,uint256,uint256)");
        const soldTopic = ethers.id("Sold(address,address,uint256,uint256)");

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
                  console.log(`Poll-detected burn: ${from} burned ${ethers.formatUnits(value, 18)} on ${token}`);
                  await handleRedeemOrBurn(token, from, value, symbol);
                }
              } else if (parsed.name === "Redeemed") {
                const user = parsed.args.user;
                const amt = parsed.args.amount;
                const ticker = parsed.args.ticker;
                console.log(`Poll-detected Redeemed: ${user} ${amt.toString()} ${ticker}`);
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
        for (const [tokenAddr, meta] of Object.entries(datasets)) {
          const marketplace = meta.marketplace || meta.marketplace_address;
          if (marketplace) {
            uniqueMarketplaces.add(marketplace.toLowerCase());
          }
        }
        
        // CRITICAL: Always include marketplace from env to catch ALL events
        // Even if a token isn't in datasets.json, we can still catch its events
        if (process.env.MARKETPLACE_ADDRESS) {
          uniqueMarketplaces.add(process.env.MARKETPLACE_ADDRESS.toLowerCase());
        }
        
        // If no datasets loaded, still poll marketplace if address is known
        if (uniqueMarketplaces.size === 0 && process.env.MARKETPLACE_ADDRESS) {
          uniqueMarketplaces.add(process.env.MARKETPLACE_ADDRESS.toLowerCase());
        }

        for (const marketplaceAddr of uniqueMarketplaces) {
          try {
            const marketplaceLogs = await getLogsWithFallback(marketplaceAddr, from, to, [[accessGrantedTopic, boughtTopic, soldTopic]]);
            
            for (const log of marketplaceLogs) {
              try {
                const parsed = marketplaceIface.parseLog(log);
                if (parsed && parsed.name === "AccessGranted") {
                  const [tokenAddr, buyer] = parsed.args;
                  console.log(`AccessGranted event (HTTP): ${buyer} granted access for token ${tokenAddr}`);
                  
                  // Find the token symbol from database
                  const tokenMeta = await getDatasetByTokenAddress(tokenAddr);
                  if (tokenMeta) {
                    await handleRedeemOrBurn(tokenAddr.toLowerCase(), buyer, 0, tokenMeta.symbol);
                  } else {
                    console.log("Unknown token in AccessGranted event:", tokenAddr);
                  }
                } else if (parsed && parsed.name === "Bought") {
                  const [tokenAddr, buyer, usdcIn, fee, tokensOut] = parsed.args;
                  console.log(`Bought event (HTTP): ${buyer} bought ${ethers.formatUnits(tokensOut, 18)} tokens of ${tokenAddr}`);
                  
                  // Save dataset entry
                  await saveBoughtDataset(tokenAddr.toLowerCase(), buyer, tokensOut);
                  
                  // Transaction is automatically tracked on-chain - query getTradeCount() to retrieve count
                  console.log(`✅ Trade on-chain: ${buyer} bought ${ethers.formatUnits(tokensOut, 18)} ${meta.symbol}`);
                } else if (parsed && parsed.name === "Sold") {
                  const [tokenAddr, seller, tokenIn, usdcOut] = parsed.args;
                  console.log(`Sold event (HTTP): ${seller} sold ${ethers.formatUnits(tokenIn, 18)} tokens of ${tokenAddr}`);
                  await handleSoldDataset(tokenAddr.toLowerCase(), seller, tokenIn);
                }
              } catch (err) {
                console.error("Marketplace log parsing error:", err);
              }
            }
          } catch (err) {
            console.error("Marketplace polling error:", err);
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
    console.log("Listener running (HTTP polling). Poll interval:", POLL_INTERVAL, "ms");
  })().catch(console.error);
}
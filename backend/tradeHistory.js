import { ethers } from 'ethers';
import config from './config.js';
import "dotenv/config";

// Create provider with fallback support
function getProvider() {
  // Try WebSocket first if available
  const wsUrl = process.env.RPC_URLS?.split(',')[0]?.startsWith('ws') 
    ? process.env.RPC_URLS.split(',')[0] 
    : null;
  
  if (wsUrl) {
    try {
      return new ethers.WebSocketProvider(wsUrl);
    } catch (e) {
      console.warn('WebSocket provider failed, using HTTP');
    }
  }
  
  // Fallback to HTTP RPC
  const { RPC_URLS } = config;
  for (const rpcUrl of RPC_URLS || []) {
    try {
      return new ethers.JsonRpcProvider(rpcUrl);
    } catch (e) {
      continue;
    }
  }
  
  throw new Error('No valid RPC provider available');
}

// Marketplace and Factory contract addresses for filtering
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS?.toLowerCase();
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS?.toLowerCase();

/**
 * Get transaction count for a user address
 * Counts ALL transactions where the user initiated (from address)
 * This includes: buy, sell, approve, burn, create, etc.
 */
async function getTradeCount(userAddress) {
  try {
    if (!ethers.isAddress(userAddress)) {
      console.error('Invalid address:', userAddress);
      return 0;
    }

    const provider = getProvider();
    const userAddrLower = userAddress.toLowerCase();

    // Method 1: Query BaseScan API (if API key is available)
    if (process.env.BASESCAN_API_KEY) {
      try {
        const baseScanUrl = process.env.BASE_SEPOLIA_NETWORK === 'mainnet' 
          ? 'https://api.basescan.org/api' 
          : 'https://api-sepolia.basescan.org/api';
        
        // Query normal transactions
        const normalTxUrl = `${baseScanUrl}?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.BASESCAN_API_KEY}`;
        
        const response = await fetch(normalTxUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.status === '1' && data.result && Array.isArray(data.result)) {
            // Count all transactions where user is the sender (from)
            const txCount = data.result.filter(tx => 
              tx.from?.toLowerCase() === userAddrLower
            ).length;
            
            console.log(`✅ Fetched ${txCount} transactions from BaseScan for ${userAddress}`);
            return txCount;
          }
        }
      } catch (apiError) {
        console.warn('BaseScan API error, falling back to RPC query:', apiError.message);
      }
    }

    // Method 2: Query via RPC (check recent blocks for transactions)
    // This is less efficient but works without API key
    // Query contract events where user interacted with marketplace/factory
    let transactionCount = 0;

    try {
      // Get current block number
      const latestBlock = await provider.getBlockNumber();
      const startBlock = Math.max(0, latestBlock - 10000); // Last ~10k blocks (reasonable history)
      
      console.log(`Querying transactions for ${userAddress} from block ${startBlock} to ${latestBlock}`);

      // Query for Bought events (user bought tokens)
      if (MARKETPLACE_ADDRESS) {
        const marketplaceIface = new ethers.Interface([
          "event Bought(address indexed token, address indexed buyer, uint256 usdcIn, uint256 fee, uint256 tokensOut)",
          "event Sold(address indexed token, address indexed seller, uint256 tokenIn, uint256 usdcOut)",
          "event AccessGranted(address indexed token, address indexed buyer)"
        ]);
        
        const boughtTopic = ethers.id("Bought(address,address,uint256,uint256,uint256)");
        const soldTopic = ethers.id("Sold(address,address,uint256,uint256)");
        const accessTopic = ethers.id("AccessGranted(address,address)");

        // Query Bought events where user is buyer
        const boughtLogs = await provider.getLogs({
          address: MARKETPLACE_ADDRESS,
          topics: [boughtTopic, null, userAddrLower], // buyer is indexed
          fromBlock: startBlock,
          toBlock: latestBlock
        });
        transactionCount += boughtLogs.length;

        // Query Sold events where user is seller
        const soldLogs = await provider.getLogs({
          address: MARKETPLACE_ADDRESS,
          topics: [soldTopic, null, userAddrLower], // seller is indexed
          fromBlock: startBlock,
          toBlock: latestBlock
        });
        transactionCount += soldLogs.length;

        // Query AccessGranted events where user is buyer
        const accessLogs = await provider.getLogs({
          address: MARKETPLACE_ADDRESS,
          topics: [accessTopic, null, userAddrLower], // buyer is indexed
          fromBlock: startBlock,
          toBlock: latestBlock
        });
        transactionCount += accessLogs.length;
      }

      // Query Factory events (user created tokens)
      if (FACTORY_ADDRESS) {
        const factoryIface = new ethers.Interface([
          "event DataCoinCreated(address indexed dataCoinAddress, string name, string symbol, address indexed creator)"
        ]);
        
        const createdTopic = ethers.id("DataCoinCreated(address,string,string,address)");
        
        const createdLogs = await provider.getLogs({
          address: FACTORY_ADDRESS,
          topics: [createdTopic, null, null, userAddrLower], // creator is indexed
          fromBlock: startBlock,
          toBlock: latestBlock
        });
        transactionCount += createdLogs.length;
      }

      // Also count ERC20 Transfer events where user is the sender (they transferred tokens)
      // This includes burns, sells, transfers, etc.
      // Get all tokens from PostgreSQL to query
      if (process.env.DATABASE_URL) {
        try {
          const { getAllCoins } = await import('./storage.js');
          const allCoins = await getAllCoins();
          
          const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
          const transferTopic = ethers.id("Transfer(address,address,uint256)");
          
          // Query transfers for first 50 tokens (to avoid timeout)
          const tokensToQuery = allCoins.slice(0, 50).map(c => c.token_address.toLowerCase());
          
          for (const tokenAddr of tokensToQuery) {
            try {
              const transferLogs = await provider.getLogs({
                address: tokenAddr,
                topics: [transferTopic, userAddrLower], // from address is indexed
                fromBlock: startBlock,
                toBlock: latestBlock
              });
              transactionCount += transferLogs.length;
            } catch (err) {
              // Skip tokens that fail (might not exist or RPC issue)
              continue;
            }
          }
        } catch (dbErr) {
          console.warn('Could not query tokens from DB for transfer events:', dbErr.message);
        }
      }

      console.log(`✅ Total transaction count for ${userAddress}: ${transactionCount}`);
      return transactionCount;

    } catch (rpcError) {
      console.error('Error querying transactions via RPC:', rpcError.message);
      return 0;
    }

  } catch (error) {
    console.error('Error getting trade count:', error);
    return 0;
  }
}

/**
 * DEPRECATED: No longer needed - blockchain is source of truth
 * Kept for backward compatibility but does nothing
 */
function addTrade(userAddress, tokenAddress, amount, type = 'buy') {
  // No-op: transactions are tracked on-chain
  console.log(`Transaction recorded on-chain: ${type} for ${userAddress}`);
  return true;
}

/**
 * DEPRECATED: No longer needed - use getTradeCount instead
 */
function loadTradeHistory() {
  return [];
}

/**
 * DEPRECATED: No longer needed
 */
function saveTradeHistory(trades) {
  // No-op
}

export {
  getTradeCount,
  addTrade,
  loadTradeHistory,
  saveTradeHistory
};

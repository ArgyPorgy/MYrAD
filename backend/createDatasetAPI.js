import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { fileURLToPath } from "url";
import { insertCoin } from './storage.js';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABI files
const getArtifactABI = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data).abi;
};

const FACTORY_ABI = getArtifactABI(path.join(__dirname, "../artifacts/contracts/DataCoinFactory.sol/DataCoinFactory.json"));
const BONDING_CURVE_ABI = getArtifactABI(path.join(__dirname, "../artifacts/contracts/BondingCurve.sol/BondingCurve.json"));
const ERC20_ABI = getArtifactABI(path.join(__dirname, "../artifacts/contracts/DataCoin.sol/DataCoin.json"));

const DATASETS_FILE = path.join(__dirname, "../datasets.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimitError = (err) => {
  const message =
    err?.message ||
    err?.reason ||
    err?.error?.message ||
    err?.data?.message ||
    "";
  return typeof message === "string" && message.toLowerCase().includes("rate limit");
};

async function waitForReceiptWithRetry(tx, label, provider) {
  const maxAttempts = 5;
  let attempt = 0;
  const baseDelay = 2000;

  while (attempt < maxAttempts) {
    try {
      return await tx.wait();
    } catch (err) {
      attempt++;
      if (isRateLimitError(err) && attempt < maxAttempts) {
        const backoff = baseDelay * Math.pow(2, attempt - 1);
        await sleep(backoff);
        if (provider?.pollingInterval) {
          provider.pollingInterval = Math.min(provider.pollingInterval + 1000, 20000);
        }
        continue;
      }
      throw err;
    }
  }
}

async function createDatasetToken(cid, name, symbol, description, totalSupply = 1000000, creatorAddress) {
  try {
    const { RPC_URLS } = config;
    const privateKey = process.env.PRIVATE_KEY;
    const factoryAddr = process.env.FACTORY_ADDRESS;
    const treasuryAddr = process.env.MYRAD_TREASURY;

    if (!RPC_URLS || !RPC_URLS.length || !privateKey || !factoryAddr) {
      throw new Error("Missing required environment variables");
    }

    if (!creatorAddress || !ethers.isAddress(creatorAddress)) {
      throw new Error("Valid creator address is required");
    }

    if (!treasuryAddr || !ethers.isAddress(treasuryAddr)) {
      throw new Error("MYRAD_TREASURY address not configured in .env");
    }

    // Initialize provider with fallback support
    let provider;
    for (const rpcUrl of RPC_URLS) {
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        provider.pollingInterval = parseInt(process.env.RPC_POLL_INTERVAL_MS || "6000", 10);
        await provider.getBlockNumber(); // Test connection
        break;
      } catch (err) {
        if (rpcUrl === RPC_URLS[RPC_URLS.length - 1]) {
          throw new Error("All RPC providers failed");
        }
      }
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);

    // Helper function to send transaction with proper nonce management and retry
    const sendTransactionWithNonce = async (txFunction, label) => {
      let retries = 3;
      while (retries > 0) {
        try {
          // Send transaction (ethers.js handles nonce automatically)
          const tx = await txFunction();
          
          // Wait for receipt
          const receipt = await waitForReceiptWithRetry(tx, label, provider);
          return receipt;
        } catch (err) {
          // Check if it's a nonce error
          const isNonceError = err.message?.includes("nonce") || 
                               err.code === "NONCE_EXPIRED" ||
                               err.info?.error?.message?.includes("nonce") ||
                               err.info?.error?.message?.includes("nonce too low");
          
          if (isNonceError && retries > 1) {
            retries--;
            console.log(`   ⚠️  Nonce error on ${label}, waiting and retrying... (${retries} attempts left)`);
            // Wait longer to ensure previous transaction is processed
            await sleep(3000);
            // Get fresh nonce count to reset ethers.js internal nonce tracking
            await provider.getTransactionCount(wallet.address, "pending");
            continue;
          }
          throw err;
        }
      }
    };

    // Get factory contract
    const factory = new ethers.Contract(factoryAddr, FACTORY_ABI, wallet);

    // Step 1: Create token via factory
    const totalSupplyWei = ethers.parseUnits(totalSupply.toString(), 18);
    const receipt = await sendTransactionWithNonce(
      () => factory.createDataCoin(
        name,
        symbol,
        totalSupplyWei,
        creatorAddress,  // Store creator address in contract
        cid
      ),
      "Token creation"
    );

    // Get the token address from the event
    const event = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed && parsed.name === 'DataCoinCreated';
      } catch {
        return false;
      }
    });

    if (!event) {
      throw new Error("DataCoinCreated event not found in transaction");
    }

    const parsedEvent = factory.interface.parseLog(event);
    const tokenAddr = parsedEvent.args.dataCoinAddress;
    const bondingCurveAddr = parsedEvent.args.bondingCurveAddress;
    // Wait for the contract to be fully indexed/propagated
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
    const bondingCurve = new ethers.Contract(bondingCurveAddr, BONDING_CURVE_ABI, wallet);

    // Check wallet token balance with retry logic
    let walletBalance = 0n;
    let retries = 3;
    while (retries > 0) {
      try {
        walletBalance = await token.balanceOf(wallet.address);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) {
          console.error(`   ❌ Failed to read token balance after 3 attempts:`, err.message);
          throw new Error(`Cannot read token balance from ${tokenAddr}. Contract may not be deployed correctly.`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (walletBalance === 0n) {
      throw new Error(`❌ Platform wallet has 0 tokens! Token minting failed. Check DataCoin.sol constructor.`);
    }

    const CREATOR_ALLOCATION = (totalSupplyWei * 10n) / 100n;
    const TREASURY_ALLOCATION = (totalSupplyWei * 5n) / 100n;
    const LIQUIDITY_ALLOCATION = totalSupplyWei - CREATOR_ALLOCATION - TREASURY_ALLOCATION;

    try {
      await sendTransactionWithNonce(
        () => token.transfer(
          ethers.getAddress(creatorAddress),
          CREATOR_ALLOCATION
        ),
        "Creator distribution"
      );
    } catch (err) {
      console.error('   ❌ Creator transfer failed:', err);
      console.error('   Transaction data:', err.transaction);
      throw err;
    }
    await sleep(2000);

    try {
      await sendTransactionWithNonce(
        () => token.transfer(
          ethers.getAddress(treasuryAddr),
          TREASURY_ALLOCATION
        ),
        "Treasury distribution"
      );
    } catch (err) {
      console.error('   ❌ Treasury transfer failed:', err);
      throw err;
    }
    await sleep(2000);

    // Step 3: Initialize pool with liquidity
    const USDC_ADDRESS = process.env.BASE_SEPOLIA_USDC || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const INITIAL_USDC = ethers.parseUnits("1", 6); // 1 USDC

    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

    // Check USDC balance BEFORE trying to use it
    const usdcBalance = await usdc.balanceOf(wallet.address);
    
    if (usdcBalance < INITIAL_USDC) {
      throw new Error(`❌ INSUFFICIENT USDC: Have ${ethers.formatUnits(usdcBalance, 6)} USDC, Need 1 USDC. Please fund wallet ${wallet.address} with USDC from https://faucet.circle.com/`);
    }

    // Approve tokens to bonding curve (unlimited)
    await sendTransactionWithNonce(
      () => token.approve(bondingCurveAddr, ethers.MaxUint256),
      "Token approval"
    );
    
    // Wait a bit longer for approval to be confirmed
    await sleep(3000);
    
    // Verify token approval with retry
    let tokenAllowance = 0n;
    let tokenRetries = 5;
    while (tokenRetries > 0 && tokenAllowance < LIQUIDITY_ALLOCATION) {
      tokenAllowance = await token.allowance(wallet.address, bondingCurveAddr);
      
      if (tokenAllowance >= LIQUIDITY_ALLOCATION) {
        break;
      }
      
      tokenRetries--;
      if (tokenRetries > 0) {
        await sleep(2000);
      }
    }
    
    if (tokenAllowance < LIQUIDITY_ALLOCATION) {
      throw new Error(`Token approval failed! Allowance: ${ethers.formatUnits(tokenAllowance, 18)}, Needed: ${ethers.formatUnits(LIQUIDITY_ALLOCATION, 18)}`);
    }

    // Approve USDC to bonding curve (unlimited)
    await sendTransactionWithNonce(
      () => usdc.approve(bondingCurveAddr, ethers.MaxUint256),
      "USDC approval"
    );
    
    // Wait a bit longer for approval to be confirmed
    await sleep(3000);
    
    // Verify USDC approval with retry
    let usdcAllowance = 0n;
    let usdcRetries = 5;
    while (usdcRetries > 0 && usdcAllowance < INITIAL_USDC) {
      usdcAllowance = await usdc.allowance(wallet.address, bondingCurveAddr);
      
      if (usdcAllowance >= INITIAL_USDC) {
        break;
      }
      
      usdcRetries--;
      if (usdcRetries > 0) {
        await sleep(2000);
      }
    }
    
    if (usdcAllowance < INITIAL_USDC) {
      throw new Error(`USDC approval failed! Allowance: ${ethers.formatUnits(usdcAllowance, 6)}, Needed: ${ethers.formatUnits(INITIAL_USDC, 6)}`);
    }

    // Initialize pool with liquidity
    await sendTransactionWithNonce(
      () => bondingCurve.initPool(
        LIQUIDITY_ALLOCATION, 
        INITIAL_USDC
      ),
      "Pool initialization"
    );

    // Step 4: Persist in PostgreSQL (preferred)
    if (process.env.DATABASE_URL) {
      try {
        await insertCoin({
          tokenAddress: tokenAddr,
          name,
          symbol,
          cid,
          description: description !== undefined ? description : null,
          creatorAddress,
          marketplaceAddress: bondingCurveAddr,
          totalSupply: totalSupply
        });
      } catch (dbErr) {
        console.error('   ⚠️ Postgres save error:', dbErr.message);
      }
    }

    // Also update JSON for backward compatibility (optional)
    try {
      let datasets = {};
      if (fs.existsSync(DATASETS_FILE)) {
        datasets = JSON.parse(fs.readFileSync(DATASETS_FILE));
      }

      datasets[tokenAddr.toLowerCase()] = {
        name,
        symbol,
        cid,
        description,
        token_address: tokenAddr,
        marketplace: bondingCurveAddr,
        marketplace_address: bondingCurveAddr,
        bonding_curve: bondingCurveAddr,
        creator: creatorAddress,
        total_supply: totalSupply,
        created_at: Date.now(),
      };

      fs.writeFileSync(DATASETS_FILE, JSON.stringify(datasets, null, 2));
    } catch (jsonErr) {
      console.error('   ⚠️ JSON mirror update error:', jsonErr.message);
    }

    return {
      tokenAddress: tokenAddr,
      marketplaceAddress: bondingCurveAddr,
      symbol,
      name,
      cid,
    };
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    throw err;
  }
}

export { createDatasetToken };
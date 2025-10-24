const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load environment
require("dotenv").config();

const FACTORY_ABI = require("../artifacts/contracts/DataCoinFactory.sol/DataCoinFactory.json").abi;
const MARKETPLACE_ABI = require("../artifacts/contracts/DataTokenMarketplace.sol/DataTokenMarketplace.json").abi;
const ERC20_ABI = require("../artifacts/contracts/DataCoin.sol/DataCoin.json").abi;

const DATASETS_FILE = path.join(__dirname, "../datasets.json");

async function createDatasetToken(cid, name, symbol, description, totalSupply = 1000000, creatorAddress) {
  try {
    const { RPC_URLS } = require("./config");
    const privateKey = process.env.PRIVATE_KEY;
    const factoryAddr = process.env.FACTORY_ADDRESS;
    const marketplaceAddr = process.env.MARKETPLACE_ADDRESS;
    const treasuryAddr = process.env.MYRAD_TREASURY;

    if (!RPC_URLS || !RPC_URLS.length || !privateKey || !factoryAddr || !marketplaceAddr) {
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
        await provider.getBlockNumber(); // Test connection
        console.log(`   ✓ Connected to RPC: ${rpcUrl}`);
        break;
      } catch (err) {
        console.warn(`   ✗ RPC ${rpcUrl} failed, trying next...`);
        if (rpcUrl === RPC_URLS[RPC_URLS.length - 1]) {
          throw new Error("All RPC providers failed");
        }
      }
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`🚀 Creating dataset: ${name} (${symbol})`);
    console.log(`   CID: ${cid}`);
    console.log(`   Total Supply: ${totalSupply.toLocaleString()}`);
    console.log(`   Creator: ${creatorAddress}`);
    console.log(`   Company Wallet: ${wallet.address}`);

    // Get contracts
    const factory = new ethers.Contract(factoryAddr, FACTORY_ABI, wallet);
    const marketplace = new ethers.Contract(marketplaceAddr, MARKETPLACE_ABI, wallet);

    // Get nonce for transaction management
    let txCount = await wallet.getNonce();

    // Step 1: Create token via factory
    console.log(`💰 Creating token...`);
    const totalSupplyWei = ethers.parseUnits(totalSupply.toString(), 18);
    const createTx = await factory.createDataCoin(
      name,
      symbol,
      totalSupplyWei,
      creatorAddress,  // Store creator address in contract
      cid,
      { nonce: txCount++, gasLimit: 3000000 }
    );
    const receipt = await createTx.wait();

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
    console.log(`   ✅ Token: ${tokenAddr}`);

    const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);

    // Step 2: Token distribution (from company wallet)
    console.log(`💳 Distributing tokens...`);
    console.log(`   Distribution: 10% Creator | 5% Treasury | 85% Liquidity Pool`);

    // Calculate allocations
    const CREATOR_ALLOCATION = (totalSupplyWei * 10n) / 100n;  // 10%
    const TREASURY_ALLOCATION = (totalSupplyWei * 5n) / 100n;  // 5%
    const LIQUIDITY_ALLOCATION = (totalSupplyWei * 85n) / 100n; // 85%

    console.log(`   Creator (10%): ${ethers.formatUnits(CREATOR_ALLOCATION, 18)}`);
    console.log(`   Treasury (5%): ${ethers.formatUnits(TREASURY_ALLOCATION, 18)}`);
    console.log(`   Liquidity (85%): ${ethers.formatUnits(LIQUIDITY_ALLOCATION, 18)}`);

    // Transfer to creator (10%)
    const creatorTransferTx = await token.transfer(
      ethers.getAddress(creatorAddress), 
      CREATOR_ALLOCATION, 
      { 
        nonce: txCount++,
        gasLimit: 100000
      }
    );
    await creatorTransferTx.wait();
    console.log(`   ✅ Transferred to creator: ${creatorAddress}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Transfer to treasury (5%)
    const treasuryTransferTx = await token.transfer(
      ethers.getAddress(treasuryAddr), 
      TREASURY_ALLOCATION, 
      { 
        nonce: txCount++,
        gasLimit: 100000
      }
    );
    await treasuryTransferTx.wait();
    console.log(`   ✅ Transferred to treasury: ${treasuryAddr}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Remaining 85% stays in company wallet for liquidity pool
    console.log(`   ✅ Liquidity allocation kept in company wallet`);

    // Step 3: Initialize pool with liquidity
    console.log(`💧 Initializing USDC pool...`);

    const USDC_ADDRESS = process.env.BASE_SEPOLIA_USDC || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const INITIAL_USDC = ethers.parseUnits("1", 6); // 1 USDC

    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

    // Check USDC balance BEFORE trying to use it
    const usdcBalance = await usdc.balanceOf(wallet.address);
    console.log(`   Company USDC balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    
    if (usdcBalance < INITIAL_USDC) {
      throw new Error(`❌ INSUFFICIENT USDC: Have ${ethers.formatUnits(usdcBalance, 6)} USDC, Need 1 USDC. Please fund wallet ${wallet.address} with USDC from https://faucet.circle.com/`);
    }

    // Check token balance BEFORE approval
    const tokenBalance = await token.balanceOf(wallet.address);
    console.log(`   Company token balance: ${ethers.formatUnits(tokenBalance, 18)} ${symbol}`);
    
    if (tokenBalance < LIQUIDITY_ALLOCATION) {
      throw new Error(`❌ INSUFFICIENT TOKENS: Have ${ethers.formatUnits(tokenBalance, 18)}, Need ${ethers.formatUnits(LIQUIDITY_ALLOCATION, 18)}`);
    }

    // Approve tokens to marketplace
    console.log(`   Approving ${ethers.formatUnits(LIQUIDITY_ALLOCATION, 18)} tokens...`);
    const approveTokenTx = await token.approve(marketplaceAddr, LIQUIDITY_ALLOCATION, { 
      nonce: txCount++,
      gasLimit: 100000
    });
    await approveTokenTx.wait();
    console.log(`   ✅ Approved tokens to marketplace`);

    // Approve USDC to marketplace
    console.log(`   Approving ${ethers.formatUnits(INITIAL_USDC, 6)} USDC...`);
    const approveUsdcTx = await usdc.approve(marketplaceAddr, INITIAL_USDC, { 
      nonce: txCount++,
      gasLimit: 100000
    });
    await approveUsdcTx.wait();
    console.log(`   ✅ Approved USDC to marketplace`);

    // Initialize pool (creator address for fee collection, not token holder)
    console.log(`   Calling initPool: ${ethers.formatUnits(LIQUIDITY_ALLOCATION, 18)} tokens + ${ethers.formatUnits(INITIAL_USDC, 6)} USDC...`);
    const initPoolTx = await marketplace.initPool(
      tokenAddr, 
      creatorAddress, // Creator receives trading fees
      LIQUIDITY_ALLOCATION, 
      INITIAL_USDC, 
      { 
        nonce: txCount++,
        gasLimit: 500000
      }
    );
    await initPoolTx.wait();
    console.log(`   ✅ Pool initialized with ${ethers.formatUnits(LIQUIDITY_ALLOCATION, 18)} tokens and 1 USDC`);

    // Step 4: Register in datasets.json
    console.log(`📝 Registering...`);
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
      marketplace: marketplaceAddr,
      marketplace_address: marketplaceAddr,
      bonding_curve: marketplaceAddr,
      creator: creatorAddress,
      total_supply: totalSupply,
      created_at: Date.now(),
    };

    fs.writeFileSync(DATASETS_FILE, JSON.stringify(datasets, null, 2));

    console.log(`✅ COMPLETE - Token ready for trading!\n`);

    return {
      tokenAddress: tokenAddr,
      marketplaceAddress: marketplaceAddr,
      symbol,
      name,
      cid,
    };
  } catch (err) {
    console.error(`❌ FAILED:`, err.message);
    throw err;
  }
}

module.exports = { createDatasetToken };

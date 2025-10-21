const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load environment
require("dotenv").config();

const FACTORY_ABI = require("../artifacts/contracts/DataCoinFactory.sol/DataCoinFactory.json").abi;
const MARKETPLACE_ABI = require("../artifacts/contracts/DataTokenMarketplace.sol/DataTokenMarketplace.json").abi;
const ERC20_ABI = require("../artifacts/contracts/DataCoin.sol/DataCoin.json").abi;

const DATASETS_FILE = path.join(__dirname, "../datasets.json");

async function createDatasetToken(cid, name, symbol, description) {
  try {
    const { RPC_URLS } = require("./config");
    const privateKey = process.env.PRIVATE_KEY;
    const factoryAddr = process.env.FACTORY_ADDRESS;
    const marketplaceAddr = process.env.MARKETPLACE_ADDRESS;

    if (!RPC_URLS || !RPC_URLS.length || !privateKey || !factoryAddr || !marketplaceAddr) {
      throw new Error("Missing required environment variables");
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

    // Get contracts
    const factory = new ethers.Contract(factoryAddr, FACTORY_ABI, wallet);
    const marketplace = new ethers.Contract(marketplaceAddr, MARKETPLACE_ABI, wallet);

    // Get nonce for transaction management
    let txCount = await wallet.getNonce();

    // Step 1: Create token via factory
    console.log(`💰 Creating token...`);
    const totalSupply = ethers.parseUnits("1000000", 18); // 1M tokens
    const createTx = await factory.createDataCoin(
      name,
      symbol,
      totalSupply,
      0,    // Unused uint256 parameter in contract
      cid,  // metadataCid goes as 5th parameter
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

    // Step 2: Token distribution
    console.log(`💳 Distributing allocations...`);

    const CREATOR_ALLOCATION = ethers.parseUnits("50000", 18);  // 5%
    const PLATFORM_ALLOCATION = ethers.parseUnits("50000", 18); // 5%
    const LIQUIDITY_ALLOCATION = ethers.parseUnits("900000", 18); // 90%

    const platformWallet = process.env.PLATFORM_WALLET || wallet.address;

    // Transfer platform allocation
    const platformTransferTx = await token.transfer(
      ethers.getAddress(platformWallet), 
      PLATFORM_ALLOCATION, 
      { 
        nonce: txCount++,
        gasLimit: 100000
      }
    );
    await platformTransferTx.wait();
    console.log(`   ✅ Platform: ${ethers.formatUnits(PLATFORM_ALLOCATION, 18)}`);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Creator gets tokens automatically (remaining balance minus liquidity)
    console.log(`   ✅ Creator wallet: ${ethers.formatUnits(LIQUIDITY_ALLOCATION + CREATOR_ALLOCATION, 18)}`);

    // Step 3: Initialize pool with liquidity
    console.log(`💧 Initializing USDC pool...`);

    const USDC_ADDRESS = process.env.BASE_SEPOLIA_USDC || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const INITIAL_USDC = ethers.parseUnits("1", 6); // 1 USDC

    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

    // Approve tokens to marketplace
    const approveTokenTx = await token.approve(marketplaceAddr, LIQUIDITY_ALLOCATION, { 
      nonce: txCount++,
      gasLimit: 100000
    });
    await approveTokenTx.wait();
    console.log(`   ✅ Approved tokens to marketplace`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Approve USDC to marketplace
    const approveUsdcTx = await usdc.approve(marketplaceAddr, INITIAL_USDC, { 
      nonce: txCount++,
      gasLimit: 100000
    });
    await approveUsdcTx.wait();
    console.log(`   ✅ Approved USDC to marketplace`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize pool
    const initPoolTx = await marketplace.initPool(tokenAddr, wallet.address, LIQUIDITY_ALLOCATION, INITIAL_USDC, { 
      nonce: txCount++,
      gasLimit: 500000
    });
    await initPoolTx.wait();
    console.log(`   ✅ Pool initialized with 1 USDC`);

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
      marketplace_address: marketplaceAddr,
      bonding_curve: marketplaceAddr,
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

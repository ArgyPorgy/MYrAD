const { ethers } = require("ethers");
const bcrypt = require("bcrypt");
require("dotenv").config();
const DatacoinFactoryABI = require("./abi/DataCoinFactory.js");
const ERC20ABI = require("./abi/ERC20");
const { getChainConfig, getAssetConfig } = require("./chainConfig.js");

// ============================================================================
// 🔧 USER CONFIGURATION SECTION - EDIT THESE VALUES
// ============================================================================

// 🌐 BLOCKCHAIN CONFIGURATION
const chainName = "sepolia"; // Available options: "sepolia", "base", "polygon", "worldchain"

// 💰 DATACOIN BASIC INFORMATION
const name = "999"; // Name of your DataCoin
const symbol = "999"; // Symbol (ticker) for your DataCoin
const description = "999"; // Description of your DataCoin
const image = "https://theteatoast.github.io/BLANK.jpg"; // Image URL for your DataCoin
const email = "anindyaandy1904@gmail.com"; // Your contact email
const telegram = "theteatoast"; // Your Telegram handle
const tokenURI = "bafkreifpymts2rinunnptk6pejo3znkuag7yevcty2qmuhuu7jmglmyo34"; // IPFS CID containing metadata (upload above info to IPFS)

// 👤 CREATOR CONFIGURATION
const creatorAddress = process.env.WALLET_ADDRESS || ""; // Creator's wallet address (leave empty to use connected wallet)

// 📊 ALLOCATION CONFIGURATION (Must total 100% = 10000 basis points)
const creatorAllocationBps = 2000; // 20% - Creator's allocation in basis points
const contributorsAllocationBps = 5000; // 50% - Contributors' allocation in basis points
const liquidityAllocationBps = 3000; // 30% - Liquidity pool allocation in basis points
const creatorVesting = 365 * 24 * 60 * 60; // 1 year vesting period in seconds

// 🔒 LOCK ASSET CONFIGURATION
const lockAsset = "USDC"; // Available options: "USDC", "WETH", "LSDC"
const lockAmount = 5; // Amount to lock (must be >= minimum for selected asset)

// Constants
const basisPoints = 10000; // 100%
const datacoinCreationFeeBps = 500; // 5%
const totalDatacoinSupply = 100000000000; // 100 million

// Validation function
function validateUserInputs() {
  console.log("🔍 Validating user inputs...");

  const errors = [];

  // Basic field validation
  if (!name.trim()) errors.push("❌ Name is required");
  if (!symbol.trim()) errors.push("❌ Symbol is required");
  if (!description.trim()) errors.push("❌ Description is required");
  if (!image.trim()) errors.push("❌ Image URL is required");
  if (!email.trim()) errors.push("❌ Email is required");
  if (!tokenURI.trim()) errors.push("❌ TokenURI is required");

  // Allocation validation
  const totalAllocation =
    creatorAllocationBps + contributorsAllocationBps + liquidityAllocationBps;
  if (totalAllocation !== basisPoints) {
    errors.push(
      `❌ Total allocation must equal 100% (10000 basis points). Current total: ${totalAllocation}`
    );
  }

  // Chain validation
  const validChains = ["sepolia", "base", "polygon", "worldchain"];
  if (!validChains.includes(chainName)) {
    errors.push(
      `❌ Invalid chain. Supported chains: ${validChains.join(", ")}`
    );
  }

  // Lock asset validation
  const validAssets = ["USDC", "WETH", "LSDC"];
  if (!validAssets.includes(lockAsset)) {
    errors.push(
      `❌ Invalid lock asset. Supported assets: ${validAssets.join(", ")}`
    );
  }

  if (errors.length > 0) {
    console.error("\n🚨 Validation Errors:");
    errors.forEach((error) => console.error(error));
    process.exit(1);
  }

  console.log("✅ All inputs are valid!");
}

// Setup blockchain connection
function setupBlockchainConnection() {
  console.log("🔗 Setting up blockchain connection...");

  const { rpc, factoryAddress } = getChainConfig(chainName);
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log(`✅ Connected to ${chainName} network`);
  console.log(`👤 Wallet address: ${wallet.address}`);

  const factoryContract = new ethers.Contract(
    factoryAddress,
    DatacoinFactoryABI,
    wallet
  );

  return { provider, wallet, factoryContract };
}

// Get lock asset configuration and validate lock amount
function validateLockAssetConfig(chainName, lockAsset, lockAmount) {
  console.log("🔒 Validating lock asset configuration...");

  const lockAssetConfig = getAssetConfig(chainName, lockAsset);
  console.log(`📊 Lock Asset: ${lockAsset}`);
  console.log(`📍 Address: ${lockAssetConfig.address}`);
  console.log(`🔢 Decimals: ${lockAssetConfig.decimal}`);
  console.log(`💰 Minimum Lock Amount: ${lockAssetConfig.minLockAmount}`);

  // Convert amounts for comparison
  const lockAmountInWei = lockAmount * Math.pow(10, lockAssetConfig.decimal);

  if (lockAmountInWei < lockAssetConfig.minLockAmount) {
    console.error(
      `❌ Lock amount (${lockAmount}) is below minimum required (${
        lockAssetConfig.minLockAmount / Math.pow(10, lockAssetConfig.decimal)
      })`
    );
    process.exit(1);
  }

  console.log(`✅ Lock amount (${lockAmount}) meets minimum requirement`);
  return lockAssetConfig;
}

// Calculate and display initial pricing
function calculateInitialPrice(lockAssetConfig, lockAmount) {
  console.log("💹 Calculating initial pricing...");

  const datacoinAmount =
    (totalDatacoinSupply * liquidityAllocationBps) / basisPoints;
  const lockTokenAmount =
    (lockAmount * (basisPoints - datacoinCreationFeeBps)) / basisPoints;
  const initialPrice = datacoinAmount / lockTokenAmount;

  console.log(
    `📈 DataCoin amount for liquidity: ${datacoinAmount.toLocaleString()}`
  );
  console.log(
    `💰 Lock token amount after fees: ${lockTokenAmount.toLocaleString()}`
  );
  console.log(
    `💱 Initial price: 1 ${lockAsset} = ${initialPrice.toLocaleString()} ${symbol}`
  );

  return { datacoinAmount, lockTokenAmount, initialPrice };
}

// ============================================================================
// 🚀 MAIN EXECUTION FUNCTION
// ============================================================================

async function createDataCoin() {
  try {
    console.log("🎯 Starting DataCoin creation process...\n");

    // Step 1: Validate all user inputs
    validateUserInputs();

    // Step 2: Setup blockchain connection
    const { wallet, factoryContract } = setupBlockchainConnection();

    // Step 3: Validate lock asset and amount
    const lockAssetConfig = validateLockAssetConfig(
      chainName,
      lockAsset,
      lockAmount
    );

    // Step 4: Calculate pricing
    calculateInitialPrice(lockAssetConfig, lockAmount);

    // Step 5: Determine creator address
    const finalCreatorAddress = creatorAddress || wallet.address;
    console.log(`👤 Creator address: ${finalCreatorAddress}`);

    // Step 6: Setup lock token contract
    const lockTokenContract = new ethers.Contract(
      lockAssetConfig.address,
      ERC20ABI,
      wallet
    );

    // Step 7: Approve token spending
    console.log("🔓 Approving token spending...");
    console.log("decimal", lockAssetConfig.decimal);
    const approveTx = await lockTokenContract.approve(
      factoryContract.target,
      ethers.parseUnits(lockAmount.toString(), lockAssetConfig.decimal)
    );
    await approveTx.wait();
    console.log("✅ Token approval successful");

    // Step 8: Generate salt and create DataCoin
    console.log("🧂 Generating salt for unique deployment...");
    const salt = await bcrypt.genSalt(10);

    console.log("🏗️  Creating DataCoin...");
    const createTx = await factoryContract.createDataCoin(
      name,
      symbol,
      tokenURI,
      finalCreatorAddress,
      creatorAllocationBps,
      creatorVesting,
      contributorsAllocationBps,
      liquidityAllocationBps,
      lockAssetConfig.address,
      ethers.parseUnits(lockAmount.toString(), lockAssetConfig.decimal),
      ethers.keccak256(ethers.toUtf8Bytes(salt))
    );

    console.log(`📝 Transaction submitted: ${createTx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await createTx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

    // Step 9: Extract and display creation results
    console.log("\n🔍 Extracting creation results...");
    const dataCoinCreatedEvent = receipt.logs.find(
      (log) =>
        log.topics[0] ===
        ethers.id(
          "DataCoinCreated(address,address,address,string,string,string,address,uint256)"
        )
    );

    if (dataCoinCreatedEvent) {
      const decodedEvent = factoryContract.interface.decodeEventLog(
        "DataCoinCreated",
        dataCoinCreatedEvent.data,
        dataCoinCreatedEvent.topics
      );

      console.log("\n🎉 DATACOIN SUCCESSFULLY CREATED!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📊 DataCoin Address: ${decodedEvent.coinAddress}`);
      console.log(`🏊 Pool Address: ${decodedEvent.poolAddress}`);
      console.log(`👤 Creator: ${decodedEvent.creator}`);
      console.log(`🔒 Lock Token: ${decodedEvent.lockToken}`);
      console.log(`📝 Name: ${decodedEvent.name}`);
      console.log(`🏷️  Symbol: ${decodedEvent.symbol}`);
      console.log(`🔗 TokenURI: ${decodedEvent.tokenURI}`);
      console.log(`📝 Transaction Hash: ${receipt.hash}`);
      console.log(`🌐 Network: ${chainName}`);
      console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else {
      console.error(
        "❌ Could not find DataCoinCreated event in transaction receipt"
      );
    }
  } catch (error) {
    console.error("\n🚨 Error creating DataCoin:");
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

// ============================================================================
// 🎬 SCRIPT EXECUTION
// ============================================================================

// Execute the main function
console.log("🚀 DataCoin Creation Script");
console.log("============================\n");

createDataCoin()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  });
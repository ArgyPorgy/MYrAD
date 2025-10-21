require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const hre = require("hardhat");

// Disable ENS lookups
const { JsonRpcProvider } = require("ethers");
if (JsonRpcProvider.prototype.resolveName) {
  JsonRpcProvider.prototype.resolveName = async function (name) {
    if (ethers.isAddress(name)) return name;
    throw new Error(`ENS resolution disabled: "${name}"`);
  };
}

// Platform configuration
const INITIAL_LIQUIDITY_ETH = ethers.parseEther("0.005"); // ~$5 in ETH
const TOTAL_SUPPLY = ethers.parseUnits("1000000", 18);
const CREATOR_ALLOCATION = (TOTAL_SUPPLY * 5n) / 100n; // 5% to creator
const PLATFORM_ALLOCATION = (TOTAL_SUPPLY * 5n) / 100n; // 5% to platform
const LIQUIDITY_ALLOCATION = (TOTAL_SUPPLY * 90n) / 100n; // 90% to bonding curve


async function main() {
  const argv = process.argv.slice(2);
  let tokenName, tokenSymbol;

  if (argv.length === 0) {
    console.log("Using default values for testing...");
    tokenName = "Test Dataset";
    tokenSymbol = "TEST";
  } else if (argv.length >= 2) {
    tokenName = String(argv[0]);
    tokenSymbol = String(argv[1]);
  } else {
    console.log("Usage: node scripts/createDataCoin.js [NAME] [SYMBOL]");
    console.log("Example: node scripts/createDataCoin.js 'Medical Data' 'MDATA'");
    return;
  }

  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const platformWallet = process.env.MYRAD_TREASURY || wallet.address;

  console.log("🔧 Configuration:");
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Platform: ${platformWallet}`);
  console.log(`   Token: ${tokenName} (${tokenSymbol})`);
  console.log(`   CID: ${HARDCODED_CID}`);
  console.log(`   Initial Liquidity: ${ethers.formatEther(INITIAL_LIQUIDITY_ETH)} ETH`);

  let nonce = await provider.getTransactionCount(wallet.address, "latest");

  // Load ABIs
  const factoryArtifact = await hre.artifacts.readArtifact("DataCoinFactory");
  const tokenArtifact = await hre.artifacts.readArtifact("DataCoin");
  const curveArtifact = await hre.artifacts.readArtifact("BondingCurve");

  // Step 1: Get factory address (you need to deploy it first with: npm run deploy)
  const factoryAddr = process.env.FACTORY_ADDRESS;
  if (!factoryAddr) {
    console.error("❌ FACTORY_ADDRESS not set in .env");
    console.log("Deploy factory first with: npm run deploy");
    return;
  }

  console.log(`\n🚀 Step 1: Creating token via factory at ${factoryAddr}`);

  const ifaceFactory = new ethers.Interface(factoryArtifact.abi);
  const calldata = ifaceFactory.encodeFunctionData("createDataCoin", [
    tokenName,
    tokenSymbol,
    TOTAL_SUPPLY,
    0n,
    HARDCODED_CID,
  ]);

  const txCreate = await wallet.sendTransaction({
    to: ethers.getAddress(factoryAddr),
    data: calldata,
    nonce: nonce++,
  });
  const receiptCreate = await txCreate.wait();
  console.log(`   ✅ Tx confirmed: ${receiptCreate.hash}`);

  // Parse DataCoinCreated event
  const iface = new ethers.Interface([
    "event DataCoinCreated(address indexed creator, address indexed dataCoinAddress, address indexed bondingCurveAddress, string symbol, string cid)"
  ]);

  let tokenAddr, curveAddr;
  for (const log of receiptCreate.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === "DataCoinCreated") {
        tokenAddr = parsed.args.dataCoinAddress;
        curveAddr = parsed.args.bondingCurveAddress;
        break;
      }
    } catch {}
  }

  if (!tokenAddr || !curveAddr) {
    console.error("❌ Could not parse DataCoinCreated event");
    return;
  }

  console.log(`   ✅ DataCoin deployed at: ${tokenAddr}`);
  console.log(`   ✅ BondingCurve deployed at: ${curveAddr}`);

  // Step 2: Distribute token allocations
  console.log(`\n💰 Step 2: Distributing token allocations`);

  const token = new ethers.Contract(tokenAddr, tokenArtifact.abi, wallet);
  const ERC20_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];
  const tokenTransfer = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);

  // Creator allocation already has CREATOR_ALLOCATION (50k), keep it
  console.log(`   ✅ Creator allocation: ${ethers.formatUnits(CREATOR_ALLOCATION, 18)} tokens (kept by creator)`);

  // Transfer to platform
  const txPlatform = await tokenTransfer.transfer(ethers.getAddress(platformWallet), PLATFORM_ALLOCATION, { nonce: nonce++ });
  await txPlatform.wait();
  console.log(`   ✅ Platform allocation: ${ethers.formatUnits(PLATFORM_ALLOCATION, 18)} tokens`);

  // Transfer to bonding curve
  const txCurve = await tokenTransfer.transfer(curveAddr, LIQUIDITY_ALLOCATION, { nonce: nonce++ });
  await txCurve.wait();
  console.log(`   ✅ Bonding curve allocation: ${ethers.formatUnits(LIQUIDITY_ALLOCATION, 18)} tokens`);

  // Step 3: Provide initial liquidity to bonding curve
  console.log(`\n💧 Step 3: Initializing bonding curve with ETH liquidity`);

  const curve = new ethers.Contract(curveAddr, curveArtifact.abi, wallet);

  const txLiquidity = await wallet.sendTransaction({
    to: curveAddr,
    value: INITIAL_LIQUIDITY_ETH,
    nonce: nonce++,
  });
  await txLiquidity.wait();
  console.log(`   ✅ Sent ${ethers.formatEther(INITIAL_LIQUIDITY_ETH)} ETH to bonding curve`);

  // Verify bonding curve state
  const ethBal = await provider.getBalance(curveAddr);
  const tokenBal = await token.balanceOf(curveAddr);
  const pricePerToken = await curve.getPrice();

  console.log(`\n📊 Bonding Curve State:`);
  console.log(`   ETH Balance: ${ethers.formatEther(ethBal)} ETH`);
  console.log(`   Token Supply: ${ethers.formatUnits(tokenBal, 18)} tokens`);
  console.log(`   Price per token: ${ethers.formatUnits(pricePerToken, 18)} ETH`);

  // Step 4: Update backend
  console.log(`\n📁 Step 4: Updating backend datasets`);

  const file = path.join(__dirname, "../backend/datasets.json");
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};

  data[tokenAddr.toLowerCase()] = {
    symbol: tokenSymbol,
    cid: HARDCODED_CID,
    bonding_curve: curveAddr.toLowerCase(),
    creator: wallet.address.toLowerCase(),
    timestamp: Date.now(),
  };

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`   ✅ Updated backend/datasets.json`);

  console.log(`\n��� Success! Token created and ready to trade`);
  console.log(`   Token: ${tokenAddr}`);
  console.log(`   Bonding Curve: ${curveAddr}`);
  console.log(`   Network: Base Sepolia`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${tokenAddr}`);
  console.log(`\n   Start trading now on http://localhost:4000`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const hre = require("hardhat");

const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

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
    tokenName = "Test Dataset";
    tokenSymbol = "TEST";
  } else if (argv.length >= 2) {
    tokenName = String(argv[0]);
    tokenSymbol = String(argv[1]);
  } else {
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const platformWallet = process.env.MYRAD_TREASURY || wallet.address;

  let nonce = await provider.getTransactionCount(wallet.address, "latest");

  // Load ABIs
  const factoryArtifact = await hre.artifacts.readArtifact("DataCoinFactory");
  const tokenArtifact = await hre.artifacts.readArtifact("DataCoin");
  const curveArtifact = await hre.artifacts.readArtifact("BondingCurve");

  // Step 1: Get factory address (you need to deploy it first with: npm run deploy)
  const factoryAddr = process.env.FACTORY_ADDRESS;
  if (!factoryAddr) {
    console.error("❌ FACTORY_ADDRESS not set in .env");
    return;
  }

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

  // Step 2: Distribute token allocations
  const token = new ethers.Contract(tokenAddr, tokenArtifact.abi, wallet);
  const ERC20_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];
  const tokenTransfer = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);

  // Creator allocation already has CREATOR_ALLOCATION (50k), keep it
  // Transfer to platform
  const txPlatform = await tokenTransfer.transfer(ethers.getAddress(platformWallet), PLATFORM_ALLOCATION, { nonce: nonce++ });
  await txPlatform.wait();
  // Transfer to bonding curve
  const txCurve = await tokenTransfer.transfer(curveAddr, LIQUIDITY_ALLOCATION, { nonce: nonce++ });
  await txCurve.wait();
  // Step 3: Provide initial liquidity to bonding curve
  const curve = new ethers.Contract(curveAddr, curveArtifact.abi, wallet);

  const txLiquidity = await wallet.sendTransaction({
    to: curveAddr,
    value: INITIAL_LIQUIDITY_ETH,
    nonce: nonce++,
  });
  await txLiquidity.wait();
  // Verify bonding curve state
  const ethBal = await provider.getBalance(curveAddr);
  const tokenBal = await token.balanceOf(curveAddr);
  const pricePerToken = await curve.getPrice();

  // Step 4: Update backend
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
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

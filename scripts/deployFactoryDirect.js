require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

async function main() {
  // Load contract artifacts
  const factoryArtifact = require("../artifacts/contracts/DataCoinFactory.sol/DataCoinFactory.json");
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const platformAddress = process.env.MYRAD_TREASURY || wallet.address;

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) {
    console.error("❌ Deployer has no ETH for gas!");
    process.exit(1);
  }

  // Create contract factory
  const Factory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    wallet
  );

  // Deploy
  const factory = await Factory.deploy(platformAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  // Update .env file
  const envPath = path.join(__dirname, "../.env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    
    // Update or add FACTORY_ADDRESS
    if (envContent.includes("FACTORY_ADDRESS=")) {
      envContent = envContent.replace(/FACTORY_ADDRESS=.*/g, `FACTORY_ADDRESS=${factoryAddress}`);
    } else {
      envContent += `\nFACTORY_ADDRESS=${factoryAddress}\n`;
    }
  } else {
    envContent = `FACTORY_ADDRESS=${factoryAddress}\n`;
  }

  fs.writeFileSync(envPath, envContent);

}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});


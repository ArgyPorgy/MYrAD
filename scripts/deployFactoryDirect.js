require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  // Load contract artifacts
  const factoryArtifact = require("../artifacts/contracts/DataCoinFactory.sol/DataCoinFactory.json");
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const platformAddress = process.env.MYRAD_TREASURY || wallet.address;

  console.log("🔧 Deployment Configuration:");
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Platform Treasury: ${platformAddress}`);
  console.log(`   Network: Base Sepolia`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("❌ Deployer has no ETH for gas!");
    process.exit(1);
  }

  console.log("\n🚀 Deploying DataCoinFactory...");

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

  console.log(`✅ DataCoinFactory deployed to: ${factoryAddress}`);
  console.log(`🔗 Explorer: https://sepolia.basescan.org/address/${factoryAddress}`);

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

  console.log(`\n💾 Factory address saved to .env`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Restart your backend: npm run backend`);
  console.log(`   2. Create a token via frontend`);
  console.log(`\n⚠️  IMPORTANT: You must restart the backend for the new factory address to take effect!`);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});


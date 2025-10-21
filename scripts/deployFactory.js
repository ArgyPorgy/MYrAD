require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [sender] = await hre.ethers.getSigners();
  const platformAddress = process.env.MYRAD_TREASURY || sender.address;

  console.log("🔧 Deployment Configuration:");
  console.log(`   Deployer: ${sender.address}`);
  console.log(`   Platform Treasury: ${platformAddress}`);

  console.log("\n🚀 Deploying DataCoinFactory...");

  const Factory = await hre.ethers.getContractFactory("DataCoinFactory");
  const factory = await Factory.deploy(platformAddress);

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log(`✅ DataCoinFactory deployed to: ${factoryAddress}`);
  console.log(`📡 Network: Base Sepolia (chainId: 84532)`);
  console.log(`🔗 Explorer: https://sepolia.basescan.org/address/${factoryAddress}`);

  // Save factory address to .env.local for easy access
  const envFile = path.join(__dirname, "../.env.local");
  const envContent = `FACTORY_ADDRESS=${factoryAddress}\n`;
  fs.writeFileSync(envFile, envContent);

  console.log(`\n💾 Factory address saved to .env.local`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Set FACTORY_ADDRESS in your .env: ${factoryAddress}`);
  console.log(`   2. Create a token: npm run create "Dataset Name" "SYMBOL"`);
  console.log(`   3. Start backend: npm run dev`);
  console.log(`   4. Start listener: npm run listen`);
  console.log(`   5. Open http://localhost:4000`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

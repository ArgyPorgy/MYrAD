require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const usdcAddress = process.env.BASE_SEPOLIA_USDC || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const treasuryAddress = process.env.MYRAD_TREASURY || wallet.address;

  console.log("🔧 Deployment Configuration:");
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   USDC: ${usdcAddress}`);
  console.log(`   Treasury: ${treasuryAddress}`);
  console.log(`   Network: Base Sepolia`);
  console.log(`   Balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH`);

  console.log("\n🚀 Deploying DataTokenMarketplace with burn functionality...");

  const marketplaceArtifact = require("../artifacts/contracts/DataTokenMarketplace.sol/DataTokenMarketplace.json");
  const Marketplace = new ethers.ContractFactory(marketplaceArtifact.abi, marketplaceArtifact.bytecode, wallet);
  const marketplace = await Marketplace.deploy(usdcAddress, treasuryAddress);

  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();

  console.log(`✅ DataTokenMarketplace deployed to: ${marketplaceAddress}`);
  console.log(`🔗 Explorer: https://sepolia.basescan.org/address/${marketplaceAddress}`);

  // Save marketplace address to .env
  const envFile = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envFile, 'utf8');
  envContent = envContent.replace(/^MARKETPLACE_ADDRESS=.*$/m, `MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  if (!envContent.includes("MARKETPLACE_ADDRESS=")) {
    envContent += `\nMARKETPLACE_ADDRESS=${marketplaceAddress}`;
  }
  fs.writeFileSync(envFile, envContent);

  console.log(`\n💾 Marketplace address saved to .env`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Restart your backend: npm run backend`);
  console.log(`   2. Create a NEW token (old tokens use old marketplace)`);
  console.log(`   3. Test burning tokens to see price increase`);
  console.log(`\n⚠️  IMPORTANT: Existing tokens will NOT have the burn feature. Only NEW tokens created after this deployment will support it.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


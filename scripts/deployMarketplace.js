const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("🚀 Deploying DataTokenMarketplace...");
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   USDC: ${process.env.BASE_SEPOLIA_USDC}`);
  console.log(`   Treasury: ${process.env.MYRAD_TREASURY}`);

  const artifact = await hre.artifacts.readArtifact("DataTokenMarketplace");
  
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  const marketplace = await factory.deploy(
    process.env.BASE_SEPOLIA_USDC,
    process.env.MYRAD_TREASURY
  );

  await marketplace.waitForDeployment();
  const addr = await marketplace.getAddress();

  console.log(`\n✅ Marketplace deployed!`);
  console.log(`   Address: ${addr}`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${addr}`);

  // Save address to .env
  console.log(`\n📝 Update .env with:`);
  console.log(`   MARKETPLACE_ADDRESS=${addr}`);
}

main().catch(console.error);

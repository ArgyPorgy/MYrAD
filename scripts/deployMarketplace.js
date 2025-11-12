const { ethers } = require("ethers");
require("dotenv").config();

const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const artifact = await hre.artifacts.readArtifact("DataTokenMarketplace");
  
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  const marketplace = await factory.deploy(
    process.env.BASE_SEPOLIA_USDC,
    process.env.MYRAD_TREASURY
  );

  await marketplace.waitForDeployment();
  const addr = await marketplace.getAddress();

  // Save address to .env
}

main().catch(console.error);

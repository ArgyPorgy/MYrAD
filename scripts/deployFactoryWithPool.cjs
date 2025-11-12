require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

async function main() {
  const USDC_ADDRESS = process.env.BASE_SEPOLIA_USDC || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const TREASURY_ADDRESS = process.env.MYRAD_TREASURY;

  if (!TREASURY_ADDRESS) {
    throw new Error("❌ MYRAD_TREASURY not set in .env");
  }

  // Load contract artifact
  const factoryArtifact = require("../artifacts/contracts/DataCoinFactory.sol/DataCoinFactory.json");
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) {
    console.error("❌ Deployer has no ETH for gas!");
    process.exit(1);
  }

  // Deploy Factory
  const factoryFactory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    wallet
  );

  const factory = await factoryFactory.deploy(USDC_ADDRESS, TREASURY_ADDRESS);
  await factory.waitForDeployment();

  const factoryAddr = await factory.getAddress();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

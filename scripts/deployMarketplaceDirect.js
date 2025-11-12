require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const usdcAddress = process.env.BASE_SEPOLIA_USDC || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const treasuryAddress = process.env.MYRAD_TREASURY || wallet.address;

  const marketplaceArtifact = require("../artifacts/contracts/DataTokenMarketplace.sol/DataTokenMarketplace.json");
  const Marketplace = new ethers.ContractFactory(marketplaceArtifact.abi, marketplaceArtifact.bytecode, wallet);
  const marketplace = await Marketplace.deploy(usdcAddress, treasuryAddress);

  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();

  // Save marketplace address to .env
  const envFile = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envFile, 'utf8');
  envContent = envContent.replace(/^MARKETPLACE_ADDRESS=.*$/m, `MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  if (!envContent.includes("MARKETPLACE_ADDRESS=")) {
    envContent += `\nMARKETPLACE_ADDRESS=${marketplaceAddress}`;
  }
  fs.writeFileSync(envFile, envContent);

}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


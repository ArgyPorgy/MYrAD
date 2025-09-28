const { ethers } = require("hardhat");

async function main() {
  const usdc = process.env.USDC_ADDRESS;
  const treasury = process.env.TREASURY;

  if (!usdc || !treasury) throw new Error("Missing USDC_ADDRESS or TREASURY in .env");

  const Factory = await ethers.getContractFactory("DataTokenMarketplace");
  const market = await Factory.deploy(usdc, treasury);
  await market.waitForDeployment();

  console.log("✅ DataTokenMarketplace deployed at:", await market.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [sender] = await hre.ethers.getSigners();
  const platformAddress = process.env.MYRAD_TREASURY || sender.address;

  const Factory = await hre.ethers.getContractFactory("DataCoinFactory");
  const factory = await Factory.deploy(platformAddress);

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  // Save factory address to .env.local for easy access
  const envFile = path.join(__dirname, "../.env.local");
  const envContent = `FACTORY_ADDRESS=${factoryAddress}\n`;
  fs.writeFileSync(envFile, envContent);

}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

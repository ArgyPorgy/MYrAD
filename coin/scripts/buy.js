const { ethers } = require("ethers");
require("dotenv").config();

const ABI = require("../artifacts/contracts/DataTokenMarketplace.sol/DataTokenMarketplace.json").abi;
const ERC20ABI = require("./abi/ERC20");
const { getChainConfig } = require("./chainConfig.js");

async function main() {
  const { rpc } = getChainConfig("sepolia");
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const mkt = new ethers.Contract(process.env.MARKETPLACE_ADDRESS, ABI, wallet);
  const usdc = new ethers.Contract(process.env.USDC_ADDRESS, ERC20ABI, wallet);

  const usdcIn = ethers.parseUnits("0.2", 6); // pay $2
  await (await usdc.approve(mkt.target, usdcIn)).wait();

  const tx = await mkt.buy(process.env.DATATOKEN_ADDRESS, usdcIn, 0n);
  console.log("✅ Bought DataTokens, tx:", (await tx.wait()).hash);
}

main().catch(e => { console.error(e); process.exit(1); });

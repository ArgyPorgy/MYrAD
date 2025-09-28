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
  const token = new ethers.Contract(process.env.DATATOKEN_ADDRESS, ERC20ABI, wallet);

  const decimals = await token.decimals();
  const tokenIn = ethers.parseUnits("9", decimals); // selling 100 tokens

  await (await token.approve(mkt.target, tokenIn)).wait();

  const tx = await mkt.sell(process.env.DATATOKEN_ADDRESS, tokenIn, 0n);
  console.log("✅ Sold DataTokens, tx:", (await tx.wait()).hash);
}

main().catch(e => { console.error(e); process.exit(1); });

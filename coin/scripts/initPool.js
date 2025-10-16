const { ethers } = require("ethers");
require("dotenv").config();

const MarketABI = require("../artifacts/contracts/DataTokenMarketplace.sol/DataTokenMarketplace.json").abi;
const ERC20ABI = require("./abi/ERC20");
const { getChainConfig } = require("./chainConfig.js");

const chain = "sepolia";

async function main() {
  const { rpc } = getChainConfig(chain);
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const market = new ethers.Contract(process.env.MARKETPLACE_ADDRESS, MarketABI, wallet);
  const usdc = new ethers.Contract(process.env.USDC_ADDRESS, ERC20ABI, wallet);
  const token = new ethers.Contract(process.env.DATATOKEN_ADDRESS, ERC20ABI, wallet);

  const tokenDecimals = await token.decimals();

  // 🟢 Choose smaller amounts your wallet actually owns
  const usdcSeed = ethers.parseUnits("5", 6);            // 5 USDC
  const tokenSeed = ethers.parseUnits("10", tokenDecimals); // 1000 tokens

  // show balances first for safety
  const balToken = await token.balanceOf(wallet.address);
  const balUsdc = await usdc.balanceOf(wallet.address);
  console.log("💰 Wallet DataToken balance:", ethers.formatUnits(balToken, tokenDecimals));
  console.log("💰 Wallet USDC balance:", ethers.formatUnits(balUsdc, 6));

  if (balToken < tokenSeed) {
    throw new Error(`Insufficient DataToken balance, need ${ethers.formatUnits(tokenSeed, tokenDecimals)} tokens`);
  }
  if (balUsdc < usdcSeed) {
    throw new Error(`Insufficient USDC balance, need ${ethers.formatUnits(usdcSeed, 6)} USDC`);
  }

  // approvals
  await (await usdc.approve(market.target, usdcSeed)).wait();
  await (await token.approve(market.target, tokenSeed)).wait();

  const tx = await market.initPool(
    token.target,
    process.env.CREATOR_ADDRESS,
    tokenSeed,
    usdcSeed
  );
  const rcpt = await tx.wait();
  console.log("✅ Pool initialized in tx:", rcpt.hash);
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});

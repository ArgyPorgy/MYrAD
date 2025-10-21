require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  defaultNetwork: "baseSepolia",
  networks: {
    baseSepolia: {
      url:  "https://base-sepolia-rpc.publicnode.com" ||   "https://base-sepolia.gateway.tenderly.co" || "https://sepolia.base.org",
      chainId: 84532,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: "0.8.18"
};

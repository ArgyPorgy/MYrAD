require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  defaultNetwork: "baseSepolia",
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: "0.8.18"
};

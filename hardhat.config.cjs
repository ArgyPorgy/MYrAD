// Only load Hardhat toolbox when actually running Hardhat commands
// This prevents issues when deploying frontend-only builds
try {
  if (process.argv.some(arg => arg.includes('hardhat'))) {
    require("@nomicfoundation/hardhat-toolbox");
  }
} catch (e) {
  // Silently fail if hardhat-toolbox is not installed (frontend-only deployments)
}

require("dotenv").config();

const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

module.exports = {
  defaultNetwork: "baseSepolia",
  networks: {
    baseSepolia: {
      url: BASE_RPC_URL,
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  solidity: "0.8.18"
};

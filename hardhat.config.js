// Only load Hardhat toolbox when actually running Hardhat commands
// This prevents issues when deploying frontend-only builds
try {
  if (process.argv.some(arg => arg.includes('hardhat'))) {
    require("@nomicfoundation/hardhat-toolbox");
  }
} catch (e) {
  // Silently fail if hardhat-toolbox is not installed (frontend-only deployments)
  console.log("Note: Hardhat toolbox not loaded (frontend-only mode)");
}

require("dotenv").config();

module.exports = {
  defaultNetwork: "baseSepolia",
  networks: {
    baseSepolia: {
      url: "https://base-sepolia.g.alchemy.com/v2/orn0yqO7JI_s9IaveLzEN",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  solidity: "0.8.18"
};

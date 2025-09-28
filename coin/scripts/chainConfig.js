require("dotenv").config();

const validChainNames = ["sepolia", "base", "polygon", "worldchain"];

const RPC_URLs = {
  base: process.env.BASE_RPC_URL || "https://1rpc.io/base",
  polygon:
    process.env.POLYGON_RPC_URL || "https://rpc-mainnet.matic.quiknode.pro",
  sepolia: process.env.SEPOLIA_RPC_URL || "https://1rpc.io/sepolia",
  worldchain:
    process.env.WORLDCHAIN_RPC_URL ||
    "https://worldchain-mainnet.g.alchemy.com/public",
};

const FactoryAddresses = {
  polygon: "0xC0dc9aae4c5256690E9E15fBff445e5921144fc9",
  base: "0xfbb45AaED9fa8877bff185E057f724d1085E5942",
  sepolia: "0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990",
  worldchain: "0x0BEd2A5622393E395c9AFBd76227e429c66ba310",
};

const approvedLockAssets = {
  base: {
    USDC: {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimal: 6,
      minLockAmount: 500000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    WETH: {
      address: "0x4200000000000000000000000000000000000006",
      decimal: 18,
      minLockAmount: 100000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    LSDC: {
      address: "0x22fEAFcD1621d18cF56f5dB6b4D00d2dB56a8ffc",
      decimal: 18,
      minLockAmount: 10000000000000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
  },
  polygon: {
    USDC: {
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimal: 6,
      minLockAmount: 500000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    WETH: {
      address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      decimal: 18,
      minLockAmount: 100000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    LSDC: {
      address: "0x9950bd28A96A2Cde34CcD3C80aE70A752557A50a",
      decimal: 18,
      minLockAmount: 10000000000000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
  },
  worldchain: {
    USDC: {
      address: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
      decimal: 6,
      minLockAmount: 500000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    WETH: {
      address: "0x4200000000000000000000000000000000000006",
      decimal: 18,
      minLockAmount: 100000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    LSDC: {
      address: "0xD3Ede9aF2309895f7aD664A7324DfC850dCB5637",
      decimal: 18,
      minLockAmount: 10000000000000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
  },
  sepolia: {
    USDC: {
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      decimal: 6,
      minLockAmount: 500000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    WETH: {
      address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
      decimal: 18,
      minLockAmount: 100000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
    LSDC: {
      address: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE",
      decimal: 18,
      minLockAmount: 10000000000000000000000,
      buyTaxBPS: 100,
      sellTaxBPS: 100,
      mintTaxBPS: 100,
    },
  },
};

const getChainConfig = (chainName) => {
  if (!validChainNames.includes(chainName)) {
    throw new Error(`${chainName} Not Supported!!`);
  }
  return {
    rpc: RPC_URLs[chainName],
    factoryAddress: FactoryAddresses[chainName],
  };
};

const getAssetConfig = (chainName, assetName) => {
  if (!validChainNames.includes(chainName)) {
    throw new Error(`${chainName} Not Supported!!`);
  }
  return approvedLockAssets[chainName][assetName];
};

module.exports = {
  getChainConfig,
  getAssetConfig,
};

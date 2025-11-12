// USDC on Base Sepolia (6 decimals)
export const BASE_SEPOLIA_USDC = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";
export const BASE_SEPOLIA_CHAIN_ID = 84532n;
export const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14a34";

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function burn(uint256 amount) external",
  "function burnForAccess() external"
];

// BondingCurve ABI - each token has its own bonding curve pool
export const MARKETPLACE_ABI = [
  "function buy(uint256 usdcIn, uint256 minTokensOut) external",
  "function sell(uint256 tokenIn, uint256 minUsdcOut) external",
  "function burnForAccess(uint256 amount) external",
  "function getPriceUSDCperToken() external view returns (uint256)",
  "function getReserves() external view returns (uint256 rToken, uint256 rUSDC)",
  "function poolExists() external view returns (bool)",
  "event Bought(address indexed buyer, uint256 usdcIn, uint256 fee, uint256 tokensOut)",
  "event Sold(address indexed seller, uint256 tokensIn, uint256 usdcOut)",
  "event TokensBurned(address indexed burner, uint256 amountBurned, uint256 newPrice)",
  "event AccessGranted(address indexed buyer)"
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];


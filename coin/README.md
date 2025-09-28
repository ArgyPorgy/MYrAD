# DataCoin Creation and Management Repository

This repository provides JavaScript scripts and smart contracts to create, manage, and mint DataCoins - tokenized representations of data with built-in liquidity pools and role-based access control.

## 🎯 Overview

DataCoins are ERC-20 tokens with the following features:

- **Tokenized Data**: Represent data as tradeable datacoins
- **Liquidity Bootstrapping**: Uniswap pool is created with chosen asset and initial price.
- **Role-based Access**: Admin and minter roles for controlled token operations
- **Vesting Schedule**: Creator tokens vest over a configurable period
- **Multi-allocation**: Split supply between creator, contributors, and liquidity

## 🏗️ Repository Structure

```
data-dao-deploy/
├── contracts/
│   ├── CreateDatacoin.sol       # Sample contract for DataCoin creation
│   └── interfaces/
│       ├── IDataCoin.sol        # DataCoin interface
│       └── IDataCoinFactory.sol # Factory interface
├── scripts/
│   ├── createDataCoin.js        # Datacoin creation script
│   ├── datacoin.js              # Management and minting script
│   ├── chainConfig.js           # Network and asset configurations
│   └── abi/                     # Contract ABIs
├── package.json                 # Dependencies
├── hardhat.config.js           # Hardhat configuration
└── env.example                 # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Wallet** with sufficient balance for lock assets
4. **RPC URLs** for supported networks

### Installation

For creating and interacting with the datacoins through the scripts:

1. Clone the repository:

```bash
git clone https://github.com/lighthouse-web3/data-dao-deployment
cd data-dao-deploy
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env
```

Edit `.env` file with your values:

```env
# Your wallet's private key (KEEP SECURE!)
PRIVATE_KEY=your_private_key_here

# RPC URLs for different networks
SEPOLIA_RPC_URL=
BASE_RPC_URL=
POLYGON_RPC_URL=
WORLDCHAIN_RPC_URL=
```

## 📋 Supported Networks & Assets

### Networks

- **ETH Sepolia Testnet**
- **Base**
- **Polygon**
- **Worldchain**

### Lock Assets

Approved assets which can be selected while creating datacoin to create initial liquidity pool with. Amount of lock asset determines the initial liquidity and initial price for your datacoin. Each lock token has a min lock amount and lighthouse take 5% of the tokens as datacoin creation fees.

#### Sepolia Testnet

| Asset | Address                                      | Decimals | Min Lock Amount |
| ----- | -------------------------------------------- | -------- | --------------- |
| USDC  | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6        | 5 USDC          |
| WETH  | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` | 18       | 0.0001 WETH     |
| LSDC  | `0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE` | 18       | 10,000 LSDC     |

#### Base

| Asset | Address                                      | Decimals | Min Lock Amount |
| ----- | -------------------------------------------- | -------- | --------------- |
| USDC  | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        | 5 USDC          |
| WETH  | `0x4200000000000000000000000000000000000006` | 18       | 0.0001 WETH     |
| LSDC  | `0x22fEAFcD1621d18cF56f5dB6b4D00d2dB56a8ffc` | 18       | 10,000 LSDC     |

#### Polygon

| Asset | Address                                      | Decimals | Min Lock Amount |
| ----- | -------------------------------------------- | -------- | --------------- |
| USDC  | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | 6        | 5 USDC          |
| WETH  | `0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619` | 18       | 0.0001 WETH     |
| LSDC  | `0x9950bd28A96A2Cde34CcD3C80aE70A752557A50a` | 18       | 10,000 LSDC     |

#### Worldchain

| Asset | Address                                      | Decimals | Min Lock Amount |
| ----- | -------------------------------------------- | -------- | --------------- |
| USDC  | `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` | 6        | 5 USDC          |
| WETH  | `0x4200000000000000000000000000000000000006` | 18       | 0.0001 WETH     |
| LSDC  | `0xD3Ede9aF2309895f7aD664A7324DfC850dCB5637` | 18       | 10,000 LSDC     |

There's buy, sell and mint tax for each lock token which is currently 1%.

LSDC is mock USDC by Lighthouse and can be obtained from the faucet function -

- [Sepolia](https://sepolia.etherscan.io/address/0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE#writeContract#F2)
- [Base](https://basescan.org/address/0x22fEAFcD1621d18cF56f5dB6b4D00d2dB56a8ffc#writeContract#F2)
- [Polygon](https://polygonscan.com/address/0x9950bd28A96A2Cde34CcD3C80aE70A752557A50a#writeContract#F2)
- [WorldChain](https://worldscan.org/address/0xD3Ede9aF2309895f7aD664A7324DfC850dCB5637#writeContract#F2)

## 🔧 Step-by-Step Usage

### Step 1: Create Your DataCoin

1. **Configure your DataCoin** by editing `scripts/createDataCoin.js`:

```javascript
// BLOCKCHAIN CONFIGURATION
const chainName = "sepolia"; // Available: "sepolia", "base", "polygon", "worldchain"

// DATACOIN BASIC INFORMATION
const name = "My Data Coin";
const symbol = "MDC";
const description = "My personal data coin for tokenization";
const image = "https://example.com/data-coin.png";
const email = "your@email.com";
const telegram = "your_telegram";
const tokenURI = "your_ipfs_cid"; // Upload metadata to IPFS

// ALLOCATION CONFIGURATION (Must total 10000 basis points = 100%)
const creatorAllocationBps = 2000; // 20% - Creator's allocation
const contributorsAllocationBps = 5000; // 50% - Contributors' allocation
const liquidityAllocationBps = 3000; // 30% - Liquidity pool allocation
const creatorVesting = 365 * 24 * 60 * 60; // 1 year vesting in seconds

// LOCK ASSET CONFIGURATION
const lockAsset = "LSDC"; // Choose: "USDC", "WETH", "LSDC"
const lockAmount = 10000; // Amount to lock (>= minimum required)
```

2. **Ensure you have sufficient balance** of the chosen lock asset in your wallet.

3. **Run the creation script**:

```bash
node scripts/createDataCoin.js
```

4. **Save the output** - you'll receive:
   - DataCoin contract address
   - Liquidity pool address
   - Transaction hash

### Step 2: Grant Minter Role

After creating your DataCoin, grant minter role to addresses that should be able to mint tokens.

1. **Update `scripts/datacoin.js`** with your DataCoin address:

```javascript
const dataCoinAddress = "YOUR_DATACOIN_ADDRESS_HERE";
```

2. **Grant minter role** (only creator/admin can do this):

```javascript
// Uncomment and configure:
const mintRoleAddress = "0x..."; // Address to grant minter role
grantMinterRole(mintRoleAddress);
```

3. **Run the script**:

```bash
node scripts/datacoin.js
```

### Step 3: Mint Tokens

Once minter role is granted, that address can mint tokens to contributors.

1. **Configure minting** in `scripts/datacoin.js`:

```javascript
// Uncomment and configure:
const receiverAddress = "0x..."; // Who receives the tokens
const amount = 100; // Amount to mint
mintTokens(receiverAddress, amount);
```

2. **Run the script** (must be called by address with minter role):

```bash
node scripts/datacoin.js
```

## 🔐 Admin Functions

As the DataCoin creator, you have exclusive access to admin functions:

### Role Management

```javascript
// Grant minter role
grantMinterRole("0x...");

// Revoke minter role
revokeMinterRole("0x...");
```

### Minting Control

```javascript
// Pause minting (emergency stop)
await datacoinContract.pauseMinting();

// Resume minting
await datacoinContract.unpauseMinting();
```

### Creator Management

```javascript
// Transfer admin rights to new address
await datacoinContract.updateCreator("0x...");
```

## 📊 Monitoring & Information

### Get DataCoin Information

```javascript
// Uncomment in datacoin.js:
getCoinInfo();
```

This displays:

- Token name and symbol
- Creator address
- Max supply and allocations
- Current minted amounts
- Vesting information

### Claim Vesting (Creator Only)

```javascript
// Uncomment in datacoin.js:
claimVesting();
```

Allows creator to claim vested tokens according to the vesting schedule.

## 🔍 Creating Datacoin from Contract

For creating and interacting with datacoin directly from contract, you can use the interfaces and addresses.

### CreateDatacoin.sol

- Sample contract for DataCoin creation
- Handles token locking and factory interaction
- Provides utility functions for approved assets

### Key Interfaces

**IDataCoin.sol** - Core DataCoin functionality:

- `mint(address to, uint256 amount)` - Mint tokens (minter role required)
- `grantRole(bytes32 role, address account)` - Grant roles (admin only)
- `claimVesting()` - Claim vested tokens
- `pauseMinting()` / `unpauseMinting()` - Emergency controls

**IDataCoinFactory.sol** - Factory for creating DataCoins:

- `createDataCoin(...)` - Create new DataCoin with parameters
- `getApprovedLockTokens()` - Get list of approved lock assets
- `getMinLockAmount(address token)` - Get minimum lock amount for asset

## ⚠️ Security Considerations

1. **Private Key Security**: Never commit private keys to version control
2. **Role Management**: Only grant minter role to trusted addresses
3. **Lock Assets**: Ensure sufficient balance before creating DataCoin
4. **Allocation Validation**: Total allocations must equal 100% (10000 basis points)

## 🐛 Troubleshooting

### Common Issues

**"Insufficient allowance" error:**

- Ensure you've approved the factory contract to spend your lock tokens
- Check you have sufficient balance of the lock asset

**"Total allocation must equal 100%" error:**

- Verify creator + contributors + liquidity allocations = 10000 basis points

**"Lock amount below minimum" error:**

- Check minimum lock amount for your chosen asset
- Increase your lock amount accordingly

**"Only admin can call this function" error:**

- Ensure you're calling admin functions from the creator address
- Check if admin rights were transferred to another address

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:

- Create an issue in this repository
- Check the troubleshooting section above
- Review contract interfaces for function specifications
- Reach out Lighthouse team at our discord or telegram
#   D a D D y  
 
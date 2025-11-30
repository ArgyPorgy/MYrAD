# MYRAD — Decentralized Data Marketplace

**Live Demo:** [https://myradhq.xyz/](https://myradhq.xyz/)

## Architecture

MYRAD is a decentralized data marketplace built on the Base blockchain that enables users to tokenize, trade, and monetize datasets through an automated market maker (AMM) system.

### System Components

#### Smart Contracts
- **DataCoin (ERC20)**: Represents individual datasets as ERC20 tokens with burn functionality
- **BondingCurve**: Constant product AMM (x × y = k) for trading dataset tokens against USDC
- **DataCoinFactory**: Creates new DataCoin tokens and manages dataset metadata
- **DataTokenMarketplace**: Legacy marketplace contract for older tokens

#### Frontend
- **React 18** with TypeScript
- **Wagmi** for Web3 wallet connections
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation

#### Backend
- **Express.js** REST API server
- **ethers.js v6** for blockchain interactions
- **Event Listener**: Monitors blockchain for burn events and grants download access
- **PostgreSQL**: Stores dataset metadata, user connections, and transaction history
- **IPFS/Lighthouse**: Decentralized storage for dataset files

#### Blockchain Network
- **Base Sepolia** (Testnet)
- **USDC** as the base trading pair

### How It Works

1. **Dataset Upload**: Users upload datasets to IPFS via Lighthouse, receiving a CID (Content Identifier)
2. **Token Creation**: A DataCoin ERC20 token is minted representing the dataset
3. **Pool Initialization**: Creator seeds liquidity pool with tokens and USDC (e.g., 900,000 tokens + 1 USDC)
4. **Trading**: Users can buy/sell tokens using the constant product AMM formula
5. **Burn for Access**: Users burn tokens (minimum $0.5 worth) to unlock dataset download access
6. **Access Control**: Backend listener detects burn events and issues JWT tokens for secure download links

### Key Features

- **Tokenization**: Each dataset is represented as an ERC20 token
- **Automated Market Making**: Constant product formula ensures liquidity
- **Burn-to-Download**: Access control through token burning
- **Fee Distribution**: 5% fee on buys (80% to liquidity, 5% to creator, 5% to treasury)
- **Decentralized Storage**: Datasets stored on IPFS with Lighthouse gateway
- **Real-time Updates**: Event listener monitors blockchain for instant access grants

## Demo

### Walk Through Demo
This guide will help you get started step by step

#### 1. Launch the App & Connect Your Wallet
Hit Launch App and connect your wallet.

**Connect Wallet**

#### 2. Get Testnet USDC + ETH
Visit the faucet and grab some USDC and ETH for testing

**Faucet**

#### 3. Buy, Sell, or Burn a Dataset
Try interacting with any dataset in the Feed or Marketplace:

- **Buy**
- **Sell**
- **Burn for access**

**Dataset Actions**

#### Burn to Download
To download any dataset, you must burn a minimum of $0.5 worth of tokens.
After burning, your download button will automatically unlock.
You can then click **Your Dataset is ready, download it** to access the dataset.

**Ready For Download**

Once unlocked, the content will stay available for you anytime.

#### 4. Upload Your Own Datasets
You can also upload your own dataset and test how everything works

**Dataset Actions**

You should upload only datasets that provide real value nothing random like single images or files that have no real world use, Aim for data that is clean, meaningful, and genuinely helpful for AI developers or researchers.

### Need help?
- Join our [Telegram community](https://t.me/myradhq)
- Follow us on [X](https://x.com/myradhq) for updates
- We always appreciate feedback!

# MYRAD - Decentralized Data Marketplace

Transform your raw data into valuable, tradeable tokens. MYRAD is a complete ecosystem for dataset tokenization, trading, and access control through blockchain technology and decentralized storage.

## 🌟 Core Concept

MYRAD enables data creators to:
- **Tokenize** datasets as fungible ERC20 tokens (DataCoins)
- **Trade** tokens on a USDC-powered AMM (Automated Market Maker)
- **Control Access** through burn-based downloads with JWT authentication
- **Earn Revenue** as demand for their datasets increases token value

## 🏗️ Architecture

### System Layers

```
┌─────────────────────────────────────────────┐
│           Frontend (React/TypeScript)        │
│  - Dataset Upload Interface                 │
│  - Token Trading Dashboard                  │
│  - Download Access Management               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────┴───────────────────────────┐
│         Backend API (Node.js/Express)       │
│  - Dataset & Token Management               │
│  - IPFS Integration (Lighthouse)            │
│  - JWT Grant Management                     │
│  - AMM Quote Calculations                   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────┴──────────────────────┬────────────────────┐
│                                         │                    │
│  ┌──────────────────────────────┐    │  ┌────────────────┐ │
│  │ Smart Contracts (Base Chain) │    │  │ IPFS/Filecoin │ │
│  │ - DataCoin (ERC20)           │    │  │ (via Lighthouse)
│  │ - DataTokenMarketplace (AMM) │    │  │                │ │
│  │ - DataCoinFactory            │    │  └────────────────┘ │
│  └──────────────────────────────┘    │                      │
│                                       │  Decentralized Data  │
└───────────────────────────────────────┴──────────────────────┘
```

### Key Components

#### 1. Smart Contracts (Base Sepolia)

**DataCoin.sol** - ERC20 Token
```solidity
- Standard ERC20 with burn functionality
- Stores metadata CID (pointing to IPFS dataset)
- Decimals: 18
- One contract deployed per dataset
```

**DataTokenMarketplace.sol** - USDC AMM
```solidity
- Constant product formula: x * y = k
- Per-token liquidity pools
- Buy: USDC → DataCoins (5% fee: 80% creator, 20% treasury)
- Sell: DataCoins → USDC (0% fee)
- Functions:
  - initPool(token, creator, tokenSeed, usdcSeed)
  - buy(token, usdcAmount, minTokensOut)
  - sell(token, tokenAmount, minUsdcOut)
  - getPriceUSDCperToken(token)
  - getReserves(token)
  - poolExists(token)
```

**DataCoinFactory.sol** - Token Factory
```solidity
- Creates new DataCoin instances
- Tracks metadata and created tokens
- Functions:
  - createDataCoin(name, symbol, metadataCID)
  - getCreatedTokens()
  - getMetadata(tokenAddress)
```

#### 2. Backend API (REST)

Core endpoints for the MYRAD ecosystem:

**Dataset Management**
```
POST /api/upload
- Upload dataset to IPFS (Lighthouse)
- Returns: { cid, ipfsUrl }

POST /api/create-dataset
- Create dataset and launch DataCoin
- Initializes liquidity pool
- Body: { cid, name, symbol, description }
- Returns: { tokenAddress, marketplaceAddress, symbol, name, cid }

GET /api/datasets
- List all created datasets
- Returns: Array of dataset metadata
```

**Token Economics & Pricing**
```
GET /api/price/:marketplaceAddress/:tokenAddress
- Current USDC per token price
- Returns: { priceUSDCperToken, reserves }

GET /api/quote/buy/:marketplaceAddress/:tokenAddress/:usdcAmount
- Calculate buy quote
- Returns: { tokenAmount, usdcAmount, fee, creatorShare, treasuryShare }

GET /api/quote/sell/:marketplaceAddress/:tokenAddress/:tokenAmount
- Calculate sell quote
- Returns: { usdcAmount, tokenAmount }
```

**Access Control & Downloads**
```
GET /api/access/:userAddress/:symbol
- Check if user can download dataset
- Returns: { canAccess, downloadUrl, expiry }

POST /api/burn-for-access
- Burn tokens to get JWT download grant
- Body: { userAddress, symbol, tokensToBurn }
- Returns: { downloadUrl, jwtToken, expiry }

GET /api/health
- API health check
- Returns: { status: "ok" }
```

#### 3. Frontend Components

**Dataset Creation Flow**
```
1. Connect Wallet → 2. Upload File to IPFS → 3. Enter Metadata
4. Approve USDC → 5. Create DataCoin → 6. Initialize Pool
```

**Trading Flow**
```
1. View Available Datasets → 2. Check Token Price → 3. Approve USDC
4. Buy DataCoins via AMM → 5. Hold/Trade Tokens
```

**Download Flow**
```
1. Burn DataCoins → 2. Receive JWT Token → 3. Download from IPFS
```

## 🔑 Key Smart Contract Addresses (Base Sepolia)

```
MYRAD_TREASURY: 0x342F483f1dDfcdE701e7dB281C6e56aC4C7b05c9
FACTORY_ADDRESS: 0xF32DDC534123DDE736FB1F22dC49D8a6E20394f9
MARKETPLACE_ADDRESS: 0xe3A8998b82d6b6f0763318A37d960e7d3FC4779b
```

## 💡 Tokenomics & Fee Structure

### Buy Flow (Creator → Buyer)
1. User sends X USDC to marketplace
2. 5% fee deducted (Y USDC)
3. Remaining (0.95X USDC) converts to DataCoins
4. Fee distribution:
   - 80% to Dataset Creator
   - 20% to MYRAD Treasury

### Sell Flow
1. User sends DataCoins to marketplace
2. Receives equivalent USDC (no fee)
3. Price determined by constant product formula

### Burn Mechanism
- Users burn DataCoins to access datasets
- Each burn reduces total supply
- Increases scarcity and potential value for remaining holders

### Initial Pool Seeding
- Token Seed: 900,000 DataCoins
- USDC Seed: 1 USDC
- Creates initial price: 1 USDC = 900,000 DataCoins

## 🔐 Authentication & Access Control

### User Authentication
- Gmail login with enterprise-grade security
- Reclaim Protocol integration (privacy-focused)
- Privy Auth for seamless onboarding

### Dataset Access
- JWT-based grant system
- 30-minute expiry for download tokens
- Signed tokens include:
  - User address
  - Dataset symbol
  - Expiration timestamp

### Storage
- Datasets: Lighthouse IPFS gateway (Filecoin-backed)
- Metadata: Stored in DataCoin smart contract (IPFS CID)
- JWT Grants: Persisted in backend database

## 🚀 Deployment Configuration

### Environment Variables (Required)

```bash
# RPC Configuration
VITE_RPC_URL=https://sepolia-rpc.base.org

# Contract Addresses
VITE_FACTORY_ADDRESS=0xF32DDC534123DDE736FB1F22dC49D8a6E20394f9
VITE_MARKETPLACE_ADDRESS=0xe3A8998b82d6b6f0763318A37d960e7d3FC4779b
VITE_USDC_ADDRESS=<USDC_Token_Address>
VITE_MYRAD_TREASURY=0x342F483f1dDfcdE701e7dB281C6e56aC4C7b05c9

# Backend Configuration
BACKEND_URL=https://your-backend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# File Storage
LIGHTHOUSE_API_KEY=<Your_Lighthouse_API_Key>

# Authentication
JWT_SECRET=<Your_JWT_Secret>
PRIVY_APP_ID=<Your_Privy_App_ID>

# Optional Monitoring
SENTRY_DSN=<Your_Sentry_DSN>
```

### Deployment Platforms

**Recommended: Vercel (Frontend)**
- Supports automatic deployments from Git
- Edge functions for API routes
- Environment variable management
- CDN distribution

**Alternative: Netlify**
- Similar to Vercel
- Built-in serverless functions
- Form handling

**Backend: Any Node.js Host**
- Railway, Render, DigitalOcean, AWS Lambda
- Requires HTTPS in production
- Rate limiting (express-rate-limit)
- CORS properly configured

### Deployment Checklist

- [ ] Contracts deployed to Base Sepolia
- [ ] Contract addresses in environment variables
- [ ] Lighthouse API key configured
- [ ] JWT_SECRET rotated and secured
- [ ] CORS origins configured for production domains
- [ ] HTTPS enabled (required)
- [ ] Rate limiting configured (max 100 requests/min per IP)
- [ ] Sentry monitoring enabled
- [ ] Database backups configured
- [ ] Private keys rotated (never in code)
- [ ] Admin functions rate-limited

## 📊 Data Flow Example

```
Dataset Creator uploads data:
1. User uploads file → API /upload endpoint
2. File stored on Lighthouse IPFS
3. Receives CID (Content Identifier)
4. Calls /create-dataset with metadata
5. Backend calls DataCoinFactory.createDataCoin()
6. Backend initializes pool with 900k tokens + 1 USDC
7. Returns token & marketplace addresses to user

Buyer purchases tokens:
1. User views dataset listing
2. Calls /quote/buy to check price
3. Approves USDC spend via MetaMask
4. Calls marketplace.buy() with USDC amount
5. Receives DataCoins in wallet
6. Can immediately resell or burn for access

User downloads dataset:
1. User calls /burn-for-access with token amount
2. Backend initiates token burn via smart contract
3. Burn succeeds → JWT grant issued
4. Returns IPFS download URL + JWT
5. User downloads via Lighthouse gateway
6. JWT expires after 30 minutes
```

## 🛡️ Security Considerations

### Smart Contracts
- Built with OpenZeppelin libraries
- Input validation on all functions
- Reentrancy guards (especially for burn-to-download)
- Pool existence checks before operations

### Backend
- HTTPS enforced (TLS 1.3+)
- Rate limiting: 100 requests/minute per IP
- Input sanitization for file uploads
- CORS restricted to frontend domain
- JWT validation on protected endpoints
- Database encryption at rest

### Frontend
- MetaMask integration for transaction signing
- No private keys stored in browser
- Secure random generation for JWT validation
- HTTPS only (no HTTP fallback)

### Private Key Management
- Private keys managed via environment variables only
- Never committed to version control
- Rotated regularly
- Admin transactions require rate limiting
- Audit logs for all admin actions

## 🔄 Workflow Example: Monetizing a Dataset

### As a Creator

1. **Prepare Your Data**
   - Organize files in a dataset
   - Create descriptive metadata

2. **Upload to MYRAD**
   ```
   POST /api/upload
   - Upload file → Get CID
   - POST /create-dataset
   - Specify: name, symbol, description
   - Approve USDC for pool initialization
   - Receive DataCoin token address
   ```

3. **Set Initial Price**
   - Pool initialized with 900k tokens + 1 USDC
   - Initial price: 1 token = 1/900k USDC
   - Price adjusts based on buy/sell demand

4. **Monitor & Grow**
   - Track token price via `/api/price/:address`
   - Earn when others buy your tokens
   - 80% of buy fees go directly to you
   - 20% goes to treasury for ecosystem maintenance

### As a Buyer

1. **Discover Datasets**
   ```
   GET /api/datasets
   - Browse available DataCoins
   - View creator profiles
   - Check historical demand
   ```

2. **Purchase Tokens**
   ```
   GET /api/quote/buy/:address/:usdcAmount
   - See exact token amount
   - Approve USDC
   - Execute buy transaction
   - Tokens arrive in wallet
   ```

3. **Access Dataset**
   ```
   POST /api/burn-for-access
   - Burn tokens (permanent action)
   - Receive JWT token
   - Download from IPFS
   - Expires after 30 minutes
   ```

4. **Trade Tokens**
   ```
   GET /api/quote/sell/:address/:tokenAmount
   - Check sell price
   - Sell anytime (0% fee)
   - Receive USDC immediately
   - Price automatically adjusts
   ```

## 📈 Use Cases

### Data Scientists
- Monetize research datasets
- Build reputation through token demand
- Earn passive income from proprietary data

### Business Intelligence
- Sell market analysis to competitors
- Create subscription-like token models
- Track buyer demand via token movements

### Healthcare/Pharma
- Tokenize anonymized patient data sets
- Controlled access via burn mechanism
- Audit trail via blockchain

### Climate/Sustainability
- Monetize environmental monitoring data
- Fair compensation for data collectors
- Transparent value attribution

### Financial Data
- Real-time market data tokenization
- Buyer-seller price discovery
- Deflationary value model

## 🧪 Testing & Development

### Local Development
```bash
# Prerequisites
npm install -g pnpm
pnpm install

# Start dev server (Vite + Express)
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Build for production
pnpm build
```

### Testnet Deployment
- Network: Base Sepolia
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Block Explorer: https://sepolia.basescan.org
- Test USDC available via faucet

### Contract Testing
```bash
# Verify contract bytecode
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Check pool state
curl https://sepolia-rpc.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[...]}'
```

## 🎯 Hackathon Highlights

### Unique Value Propositions
1. **Complete Ecosystem** - Not just a marketplace, includes token creation, trading, and access control
2. **Deflationary Model** - Burn mechanism creates real scarcity, unlike meme tokens
3. **USDC Liquidity** - Stablecoin trading prevents volatility
4. **Decentralized Storage** - IPFS/Filecoin ensures data availability
5. **JWT Access Control** - Granular, expiring permissions for downloads

### Technical Innovation
- Constant product AMM for dataset tokenization
- Burn-to-download creates aligned incentives
- IPFS CID storage in smart contracts
- JWT-based time-limited access grants
- Factory pattern for scalable token creation

### Competitive Advantages
- **Privacy**: Buyers don't need to register; just connect wallet
- **Speed**: Instant token trading vs. traditional data brokers
- **Transparency**: All prices and fees on-chain
- **Security**: NFT-like token ownership, not databases
- **Scale**: Handles unlimited datasets without contract upgrades

## 📚 Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (lightning-fast builds)
- TailwindCSS (responsive design)
- ethers.js (blockchain interaction)
- React Router 6 (SPA routing)

**Backend**
- Node.js + Express
- TypeScript
- Zod (validation)
- Lighthouse SDK (IPFS)
- jsonwebtoken (access grants)

**Blockchain**
- Solidity 0.8.x
- OpenZeppelin contracts
- Base Sepolia testnet
- ethers.js for contract calls

**Storage**
- Lighthouse IPFS (Filecoin-backed)
- Database for JWT grants

**Infrastructure**
- Vercel/Netlify (frontend)
- Railway/Render/AWS Lambda (backend)
- Base RPC node

## 🌐 Public URLs

- **Frontend**: https://myradhq.xyz
- **GitHub**: https://github.com/ArgyPorgy/MYrAD
- **Explorer**: https://sepolia.basescan.org
- **IPFS Gateway**: https://lighthouse.storage

## 📞 Contact & Support

- **Email**: contact@myradhq.xyz
- **Twitter**: @MYrAD_HQ
- **GitHub Issues**: For bug reports and features
- **Discord**: Community discussions (link in footer)

## 📄 License

MIT License - See LICENSE file for details

---

**Built for the future of decentralized data. MYRAD: Where Data Meets Value.**

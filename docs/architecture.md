# System Architecture

MYrAD follows a **modular, decentralized architecture** combining blockchain logic, backend orchestration, and an interactive frontend.

---

## 🧱 Layers Overview

### 1. Blockchain Layer (Base Sepolia)
- Smart contracts deployed using **Hardhat**
- **DataCoin (ERC20)**: Represents a dataset  
- **DataTokenMarketplace**: AMM for trading DataCoins  
- **DataCoinFactory**: Manages token creation and metadata

### 2. Backend Layer (Node.js + Express)
- Event listener for **burn transactions**
- Generates **JWT tokens** for secure downloads  
- Handles **metadata retrieval** from IPFS  
- Integrates with **ethers.js v6** for blockchain calls

### 3. Frontend Layer (React + TypeScript)
- Built with **Vite** and **TailwindCSS**
- UI components via **Radix UI**  
- Web3 wallet integration (MetaMask)  
- Displays real-time token prices and pool data  

---

## 🔄 Data Flow

1. **Dataset Upload** → IPFS (via Lighthouse)  
2. **Token Creation** → ERC20 via DataCoinFactory  
3. **Liquidity Initialization** → Token + USDC pool created  
4. **Trading** → Users swap tokens via AMM  
5. **Access Control** → Token burn triggers JWT issuance  
6. **Download** → User downloads dataset securely via IPFS link  

---

## ⚙️ Infrastructure Summary

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Blockchain | Base Sepolia + Solidity | Smart contracts & token logic |
| Backend | Express.js + ethers.js | Transaction monitoring & JWT auth |
| Frontend | React + Vite + Tailwind | UI and marketplace |
| Storage | IPFS (Lighthouse) | Decentralized dataset storage |
| Auth | JWT | Time-limited dataset access |

---

## 🔮 Scalability Vision
- Transition to **Base Mainnet**  
- **Off-chain data indexing** for advanced search  
- **Multi-currency AMMs** (ETH, MATIC, etc.)  
- **Governance and DAO-based upgrades**

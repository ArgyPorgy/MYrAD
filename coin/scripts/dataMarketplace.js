// simpleBuySell.js - Add buy/sell functionality to existing DataCoin
const { ethers } = require("ethers");
require("dotenv").config();

// Import your existing setup
let DatacoinABI, getChainConfig;
try {
    DatacoinABI = require("./abi/DataCoin.js");
    const chainConfigModule = require("./chainConfig.js");
    getChainConfig = chainConfigModule.getChainConfig;
} catch (error) {
    console.error("❌ Missing required files");
    process.exit(1);
}

// Configuration
const CONFIG = {
    chainName: "sepolia",
    dataCoinAddress: "0x49A6d1AcA5e50486c5c455be0B8d5b7Acb08DE44", // Your existing DataCoin
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",   // Sepolia USDC
    marketplaceFee: 5, // 5% fee
    basePrice: 1 // 1 USDC base price
};

// Simple ERC20 ABI
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

class SimpleDataMarketplace {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.dataCoin = null;
        this.usdc = null;
        this.sales = 0; // Track total sales for price discovery
    }

    async initialize() {
        console.log("🚀 Initializing Simple Data Marketplace...");
        
        const { rpc } = getChainConfig(CONFIG.chainName);
        this.provider = new ethers.JsonRpcProvider(rpc);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        
        console.log("👤 Marketplace Wallet:", this.wallet.address);
        
        // Initialize contracts
        this.dataCoin = new ethers.Contract(CONFIG.dataCoinAddress, DatacoinABI, this.wallet);
        this.usdc = new ethers.Contract(CONFIG.usdcAddress, ERC20_ABI, this.wallet);
        
        // Show current state
        const [tokenName, tokenSymbol, usdcBalance] = await Promise.all([
            this.dataCoin.name(),
            this.dataCoin.symbol(),
            this.usdc.balanceOf(this.wallet.address)
        ]);
        
        console.log("🪙  Data Token:", tokenName, `(${tokenSymbol})`);
        console.log("💵 USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");
        console.log("✅ Marketplace ready!");
        
        return this;
    }

    // ========================================================================
    // 🛒 BUY DATA ACCESS
    // ========================================================================
    
    async buyDataAccess(buyerAddress, usdcAmount) {
        console.log("\n🛒 Processing Data Purchase...");
        console.log("=" .repeat(50));
        
        try {
            const usdcAmountWei = ethers.parseUnits(usdcAmount.toString(), 6);
            
            console.log("👤 Buyer:", buyerAddress);
            console.log("💵 Payment:", usdcAmount, "USDC");
            
            // Calculate fees
            const feeAmount = (usdcAmountWei * BigInt(CONFIG.marketplaceFee)) / BigInt(100);
            const ownerAmount = usdcAmountWei - feeAmount;
            
            console.log("💸 Platform Fee (5%):", ethers.formatUnits(feeAmount, 6), "USDC");
            console.log("💰 Data Owner Gets:", ethers.formatUnits(ownerAmount, 6), "USDC");
            
            // Check buyer's USDC balance and allowance
            const buyerBalance = await this.usdc.balanceOf(buyerAddress);
            const allowance = await this.usdc.allowance(buyerAddress, this.wallet.address);
            
            console.log("💼 Buyer USDC Balance:", ethers.formatUnits(buyerBalance, 6));
            console.log("🔓 Allowance to Marketplace:", ethers.formatUnits(allowance, 6));
            
            if (buyerBalance < usdcAmountWei) {
                throw new Error("Buyer has insufficient USDC balance");
            }
            
            if (allowance < usdcAmountWei) {
                console.log("❌ Insufficient allowance. Buyer needs to approve USDC spending first.");
                console.log(`💡 Buyer should call: usdc.approve("${this.wallet.address}", "${usdcAmountWei}")`);
                return { success: false, needsApproval: true };
            }
            
            // Get data owner (creator of the DataCoin)
            const dataOwner = await this.dataCoin.creator();
            console.log("👑 Data Owner:", dataOwner);
            
            // Process payment: Transfer USDC from buyer
            console.log("💸 Processing USDC transfer...");
            
            // Transfer fee to marketplace
            const feeTransferTx = await this.usdc.transferFrom(
                buyerAddress,
                this.wallet.address,
                feeAmount
            );
            await feeTransferTx.wait();
            console.log("✅ Platform fee collected");
            
            // Transfer remaining to data owner
            const ownerTransferTx = await this.usdc.transferFrom(
                buyerAddress,
                dataOwner,
                ownerAmount
            );
            await ownerTransferTx.wait();
            console.log("✅ Payment sent to data owner");
            
            // Mint access tokens to buyer
            const tokensToMint = 1; // 1 token = 1 access
            console.log(`🏭 Minting ${tokensToMint} access token(s) to buyer...`);
            
            const mintTx = await this.dataCoin.mint(
                buyerAddress,
                ethers.parseUnits(tokensToMint.toString(), 18)
            );
            await mintTx.wait();
            console.log("✅ Access tokens minted!");
            
            // Update sales counter for price discovery
            this.sales++;
            
            console.log("\n🎉 PURCHASE COMPLETED SUCCESSFULLY!");
            console.log("📊 Buyer now has access to the dataset");
            
            return {
                success: true,
                txHashes: {
                    feeTransfer: feeTransferTx.hash,
                    ownerTransfer: ownerTransferTx.hash,
                    mint: mintTx.hash
                },
                feeCollected: ethers.formatUnits(feeAmount, 6),
                ownerEarned: ethers.formatUnits(ownerAmount, 6),
                tokensGranted: tokensToMint
            };
            
        } catch (error) {
            console.error("❌ Purchase failed:", error.message);
            throw error;
        }
    }

    // ========================================================================
    // 💰 SELL DATA TOKENS
    // ========================================================================
    
    async sellDataTokens(sellerAddress, tokenAmount, minUsdcExpected) {
        console.log("\n💰 Processing Token Sale...");
        console.log("=" .repeat(50));
        
        try {
            const tokenAmountWei = ethers.parseUnits(tokenAmount.toString(), 18);
            const minUsdcWei = ethers.parseUnits(minUsdcExpected.toString(), 6);
            
            console.log("👤 Seller:", sellerAddress);
            console.log("🪙  Tokens to Sell:", tokenAmount);
            console.log("💵 Minimum USDC Expected:", minUsdcExpected);
            
            // Check seller's token balance
            const sellerBalance = await this.dataCoin.balanceOf(sellerAddress);
            console.log("💼 Seller Token Balance:", ethers.formatUnits(sellerBalance, 18));
            
            if (sellerBalance < tokenAmountWei) {
                throw new Error("Seller has insufficient token balance");
            }
            
            // Simple price discovery: base price + (sales * 0.1 USDC)
            const currentPrice = ethers.parseUnits((CONFIG.basePrice + (this.sales * 0.1)).toString(), 6);
            const totalUsdcValue = (currentPrice * BigInt(tokenAmount));
            
            console.log("💱 Current Price:", ethers.formatUnits(currentPrice, 6), "USDC per token");
            console.log("💰 Total Value:", ethers.formatUnits(totalUsdcValue, 6), "USDC");
            
            if (totalUsdcValue < minUsdcWei) {
                throw new Error(`Current price (${ethers.formatUnits(totalUsdcValue, 6)} USDC) below minimum expected (${minUsdcExpected} USDC)`);
            }
            
            // Calculate fees
            const feeAmount = (totalUsdcValue * BigInt(CONFIG.marketplaceFee)) / BigInt(100);
            const sellerAmount = totalUsdcValue - feeAmount;
            
            console.log("💸 Platform Fee (5%):", ethers.formatUnits(feeAmount, 6), "USDC");
            console.log("💵 Seller Receives:", ethers.formatUnits(sellerAmount, 6), "USDC");
            
            // Check marketplace USDC balance
            const marketplaceBalance = await this.usdc.balanceOf(this.wallet.address);
            if (marketplaceBalance < totalUsdcValue) {
                throw new Error("Marketplace has insufficient USDC to buy tokens");
            }
            
            // Check token allowance
            const tokenAllowance = await this.dataCoin.allowance(sellerAddress, this.wallet.address);
            console.log("🔓 Token Allowance:", ethers.formatUnits(tokenAllowance, 18));
            
            if (tokenAllowance < tokenAmountWei) {
                console.log("❌ Insufficient token allowance. Seller needs to approve token spending first.");
                console.log(`💡 Seller should call: dataCoin.approve("${this.wallet.address}", "${tokenAmountWei}")`);
                return { success: false, needsApproval: true };
            }
            
            // Execute the swap
            console.log("🔄 Executing token swap...");
            
            // Transfer tokens from seller to marketplace
            const tokenTransferTx = await this.dataCoin.transferFrom(
                sellerAddress,
                this.wallet.address,
                tokenAmountWei
            );
            await tokenTransferTx.wait();
            console.log("✅ Tokens transferred to marketplace");
            
            // Transfer USDC to seller (minus fee)
            const usdcTransferTx = await this.usdc.transfer(sellerAddress, sellerAmount);
            await usdcTransferTx.wait();
            console.log("✅ USDC transferred to seller");
            
            console.log("\n🎉 TOKEN SALE COMPLETED SUCCESSFULLY!");
            
            return {
                success: true,
                txHashes: {
                    tokenTransfer: tokenTransferTx.hash,
                    usdcTransfer: usdcTransferTx.hash
                },
                pricePerToken: ethers.formatUnits(currentPrice, 6),
                totalReceived: ethers.formatUnits(sellerAmount, 6),
                feeCollected: ethers.formatUnits(feeAmount, 6)
            };
            
        } catch (error) {
            console.error("❌ Token sale failed:", error.message);
            throw error;
        }
    }

    // ========================================================================
    // 📊 MARKETPLACE UTILITIES
    // ========================================================================
    
    async getCurrentPrice() {
        const price = CONFIG.basePrice + (this.sales * 0.1);
        console.log("💱 Current Token Price:", price.toFixed(2), "USDC");
        return price;
    }
    
    async checkDataAccess(userAddress) {
        try {
            const balance = await this.dataCoin.balanceOf(userAddress);
            const hasAccess = balance > 0;
            
            console.log("👤 User:", userAddress);
            console.log("🪙  Access Tokens:", ethers.formatUnits(balance, 18));
            console.log("🔐 Has Access:", hasAccess ? "✅ YES" : "❌ NO");
            
            return {
                hasAccess,
                tokenBalance: ethers.formatUnits(balance, 18)
            };
            
        } catch (error) {
            console.error("❌ Error checking access:", error.message);
            throw error;
        }
    }
    
    async getMarketplaceStats() {
        console.log("\n📊 Marketplace Statistics");
        console.log("=" .repeat(50));
        
        try {
            const [tokenName, tokenSymbol, totalSupply, creator] = await Promise.all([
                this.dataCoin.name(),
                this.dataCoin.symbol(),
                this.dataCoin.totalSupply(),
                this.dataCoin.creator()
            ]);
            
            const marketplaceBalance = await this.usdc.balanceOf(this.wallet.address);
            const currentPrice = await this.getCurrentPrice();
            
            console.log("🪙  Data Token:", tokenName, `(${tokenSymbol})`);
            console.log("👑 Data Owner:", creator);
            console.log("📈 Total Supply:", ethers.formatUnits(totalSupply, 18));
            console.log("💰 Marketplace USDC:", ethers.formatUnits(marketplaceBalance, 6));
            console.log("💱 Current Price:", currentPrice, "USDC per token");
            console.log("🛒 Total Sales:", this.sales);
            
            return {
                tokenName,
                tokenSymbol,
                totalSupply: ethers.formatUnits(totalSupply, 18),
                currentPrice,
                totalSales: this.sales,
                marketplaceBalance: ethers.formatUnits(marketplaceBalance, 6)
            };
            
        } catch (error) {
            console.error("❌ Error getting stats:", error.message);
            throw error;
        }
    }

    // ========================================================================
    // 🔧 HELPER FUNCTIONS FOR USERS
    // ========================================================================
    
    async approveUSDCSpending(userAddress, amount) {
        console.log("\n🔓 USDC Approval Instructions");
        console.log("=" .repeat(50));
        
        const amountWei = ethers.parseUnits(amount.toString(), 6);
        
        console.log("👤 User needs to approve USDC spending:");
        console.log("📋 Contract Address:", CONFIG.usdcAddress);
        console.log("🎯 Spender Address:", this.wallet.address);
        console.log("💰 Amount:", amount, "USDC");
        console.log("");
        console.log("💡 JavaScript Code:");
        console.log(`const usdc = new ethers.Contract("${CONFIG.usdcAddress}", ERC20_ABI, userWallet);`);
        console.log(`const tx = await usdc.approve("${this.wallet.address}", "${amountWei}");`);
        console.log("await tx.wait();");
        
        return {
            contractAddress: CONFIG.usdcAddress,
            spenderAddress: this.wallet.address,
            amount: amountWei.toString()
        };
    }
    
    async approveTokenSpending(userAddress, tokenAmount) {
        console.log("\n🔓 Token Approval Instructions");
        console.log("=" .repeat(50));
        
        const tokenAmountWei = ethers.parseUnits(tokenAmount.toString(), 18);
        
        console.log("👤 User needs to approve token spending:");
        console.log("📋 Contract Address:", CONFIG.dataCoinAddress);
        console.log("🎯 Spender Address:", this.wallet.address);
        console.log("🪙  Amount:", tokenAmount, "tokens");
        console.log("");
        console.log("💡 JavaScript Code:");
        console.log(`const dataCoin = new ethers.Contract("${CONFIG.dataCoinAddress}", DatacoinABI, userWallet);`);
        console.log(`const tx = await dataCoin.approve("${this.wallet.address}", "${tokenAmountWei}");`);
        console.log("await tx.wait();");
        
        return {
            contractAddress: CONFIG.dataCoinAddress,
            spenderAddress: this.wallet.address,
            amount: tokenAmountWei.toString()
        };
    }
}

// ============================================================================
// 🎬 DEMO & USAGE EXAMPLES
// ============================================================================

async function demonstrateMarketplace() {
    try {
        console.log("🎯 Data Marketplace Buy/Sell Demo");
        console.log("=" .repeat(60));
        
        const marketplace = new SimpleDataMarketplace();
        await marketplace.initialize();
        
        // Show initial stats
        console.log("\n📊 Initial Marketplace State:");
        await marketplace.getMarketplaceStats();
        
        // Example user addresses (replace with real addresses)
        const buyerAddress = "0x9DC63460d0987d8AB27224F42f04ddA36b5232CD";
        const sellerAddress = "0x68827A9Fa11B716091f4B599D54a2484fb599a4C";
        
        console.log("\n" + "=".repeat(60));
        console.log("🛒 PURCHASE SIMULATION");
        console.log("=".repeat(60));
        
        // Simulate a purchase
        console.log("\n1️⃣  Checking buyer's current access...");
        await marketplace.checkDataAccess(buyerAddress);
        
        console.log("\n2️⃣  Processing data purchase...");
        // Note: In real usage, buyer needs to approve USDC spending first
        try {
            const purchaseResult = await marketplace.buyDataAccess(buyerAddress, 2); // 2 USDC
            console.log("Purchase Result:", purchaseResult);
        } catch (error) {
            if (error.message.includes("insufficient")) {
                console.log("💡 This is expected in demo - buyer needs USDC and approval");
                
                // Show approval instructions
                await marketplace.approveUSDCSpending(buyerAddress, 2);
            }
        }
        
        console.log("\n" + "=".repeat(60));
        console.log("💰 SELLING SIMULATION");
        console.log("=".repeat(60));
        
        console.log("\n3️⃣  Processing token sale...");
        try {
            const saleResult = await marketplace.sellDataTokens(sellerAddress, 1, 1.5); // Sell 1 token, expect min 1.5 USDC
            console.log("Sale Result:", saleResult);
        } catch (error) {
            if (error.message.includes("insufficient")) {
                console.log("💡 This is expected in demo - seller needs tokens and approval");
                
                // Show approval instructions
                await marketplace.approveTokenSpending(sellerAddress, 1);
            }
        }
        
        console.log("\n4️⃣  Final marketplace stats...");
        await marketplace.getMarketplaceStats();
        
        console.log("\n🎉 Demo completed!");
        console.log("\n💡 To use in production:");
        console.log("1. Users need to approve USDC/token spending first");
        console.log("2. Ensure users have sufficient balances");
        console.log("3. Handle real CSV data storage/encryption");
        console.log("4. Implement proper access control for data download");
        
    } catch (error) {
        console.error("❌ Demo failed:", error.message);
    }
}

// ============================================================================
// 🚀 INTEGRATION INSTRUCTIONS
// ============================================================================

function showIntegrationInstructions() {
    console.log("\n🔧 INTEGRATION INSTRUCTIONS");
    console.log("=" .repeat(60));
    
    console.log(`
📋 To integrate with your existing system:

1️⃣  SETUP:
   - Save this as 'simpleBuySell.js' in your scripts folder
   - Update CONFIG with your DataCoin address
   - Ensure you have USDC on Sepolia for marketplace operations

2️⃣  FOR BUYERS (Data Purchase):
   - User approves USDC spending to marketplace
   - Call marketplace.buyDataAccess(buyerAddress, usdcAmount)
   - User receives access tokens and can download data

3️⃣  FOR SELLERS (Token Trading):
   - User approves token spending to marketplace  
   - Call marketplace.sellDataTokens(sellerAddress, tokenAmount, minUSDC)
   - User receives USDC minus 5% marketplace fee

4️⃣  PRICE DISCOVERY:
   - Simple model: basePrice + (totalSales * 0.1)
   - More sales = higher token price
   - Can be replaced with Uniswap integration later

5️⃣  REVENUE MODEL:
   - 5% fee on all transactions
   - Data owners get 95% of purchase price
   - Marketplace keeps 5% + token trading fees
   
6️⃣  DATA ACCESS:
   - Users with access tokens can download CSV data
   - Implement checkDataAccess() in your download endpoint
   - Consider encrypting CSV data and providing decryption keys

📱 FRONTEND INTEGRATION:
   - Use ethers.js to interact with contracts
   - Show current token prices and marketplace stats
   - Implement approval flows for USDC/tokens
   - Create buy/sell UI components
`);
}

// ============================================================================
// 🎯 EXPORT & EXECUTION
// ============================================================================

module.exports = {
    SimpleDataMarketplace,
    CONFIG,
    demonstrateMarketplace,
    showIntegrationInstructions
};

// Run demo if called directly
if (require.main === module) {
    console.log("🚀 Starting Data Marketplace Demo...");
    
    demonstrateMarketplace()
        .then(() => {
            showIntegrationInstructions();
            process.exit(0);
        })
        .catch(error => {
            console.error("💥 Fatal error:", error.message);
            process.exit(1);
        });
}
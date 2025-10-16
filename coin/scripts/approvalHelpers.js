// approvalHelpers.js - Helper scripts for USDC and token approvals
const { ethers } = require("ethers");
require("dotenv").config();

// Configuration
const CONFIG = {
    chainName: "sepolia",
    dataCoinAddress: "0xC540B73FC1849DBe94305Cdfc56Ef21405Fe12cE", // From your output
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    marketplaceAddress: "0x68827A9Fa11B716091f4B599D54a2484fb599a4C", // Your wallet
    rpcUrl: process.env.SEPOLIA_RPC_URL
};

// ERC20 ABI for approvals
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

class ApprovalHelper {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.usdc = new ethers.Contract(CONFIG.usdcAddress, ERC20_ABI, this.wallet);
        this.dataCoin = new ethers.Contract(CONFIG.dataCoinAddress, ERC20_ABI, this.wallet);
    }

    // ========================================================================
    // 🔓 USDC APPROVALS (For buying data)
    // ========================================================================
    
    async approveUSDCForPurchase(amountUSDC = 10) {
        console.log("🔓 Approving USDC for data purchases...");
        console.log("=" .repeat(50));
        
        try {
            const amountWei = ethers.parseUnits(amountUSDC.toString(), 6);
            
            // Check current balance
            const balance = await this.usdc.balanceOf(this.wallet.address);
            console.log("💼 Current USDC Balance:", ethers.formatUnits(balance, 6));
            
            if (balance < amountWei) {
                throw new Error(`Insufficient USDC balance. Need ${amountUSDC}, have ${ethers.formatUnits(balance, 6)}`);
            }
            
            // Check current allowance
            const currentAllowance = await this.usdc.allowance(this.wallet.address, CONFIG.marketplaceAddress);
            console.log("🔓 Current Allowance:", ethers.formatUnits(currentAllowance, 6));
            
            if (currentAllowance >= amountWei) {
                console.log("✅ Already approved! Current allowance is sufficient.");
                return { alreadyApproved: true, allowance: ethers.formatUnits(currentAllowance, 6) };
            }
            
            // Approve USDC spending
            console.log("📝 Approving", amountUSDC, "USDC for marketplace spending...");
            const approveTx = await this.usdc.approve(CONFIG.marketplaceAddress, amountWei);
            
            console.log("📤 Approval transaction sent:", approveTx.hash);
            console.log("⏳ Waiting for confirmation...");
            
            const receipt = await approveTx.wait();
            console.log("✅ USDC approval confirmed!");
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
            // Verify approval
            const newAllowance = await this.usdc.allowance(this.wallet.address, CONFIG.marketplaceAddress);
            console.log("🔓 New Allowance:", ethers.formatUnits(newAllowance, 6), "USDC");
            
            return {
                success: true,
                txHash: approveTx.hash,
                approvedAmount: amountUSDC,
                newAllowance: ethers.formatUnits(newAllowance, 6)
            };
            
        } catch (error) {
            console.error("❌ USDC approval failed:", error.message);
            throw error;
        }
    }
    
    // ========================================================================
    // 🪙 TOKEN APPROVALS (For selling tokens)
    // ========================================================================
    
    async approveTokensForSale(amountTokens = 10) {
        console.log("🪙 Approving data tokens for trading...");
        console.log("=" .repeat(50));
        
        try {
            const amountWei = ethers.parseUnits(amountTokens.toString(), 18);
            
            // Check current balance
            const balance = await this.dataCoin.balanceOf(this.wallet.address);
            console.log("💼 Current Token Balance:", ethers.formatUnits(balance, 18));
            
            if (balance < amountWei) {
                throw new Error(`Insufficient token balance. Need ${amountTokens}, have ${ethers.formatUnits(balance, 18)}`);
            }
            
            // Check current allowance
            const currentAllowance = await this.dataCoin.allowance(this.wallet.address, CONFIG.marketplaceAddress);
            console.log("🔓 Current Token Allowance:", ethers.formatUnits(currentAllowance, 18));
            
            if (currentAllowance >= amountWei) {
                console.log("✅ Already approved! Current allowance is sufficient.");
                return { alreadyApproved: true, allowance: ethers.formatUnits(currentAllowance, 18) };
            }
            
            // Approve token spending
            console.log("📝 Approving", amountTokens, "tokens for marketplace trading...");
            const approveTx = await this.dataCoin.approve(CONFIG.marketplaceAddress, amountWei);
            
            console.log("📤 Approval transaction sent:", approveTx.hash);
            console.log("⏳ Waiting for confirmation...");
            
            const receipt = await approveTx.wait();
            console.log("✅ Token approval confirmed!");
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
            // Verify approval
            const newAllowance = await this.dataCoin.allowance(this.wallet.address, CONFIG.marketplaceAddress);
            console.log("🔓 New Token Allowance:", ethers.formatUnits(newAllowance, 18));
            
            return {
                success: true,
                txHash: approveTx.hash,
                approvedAmount: amountTokens,
                newAllowance: ethers.formatUnits(newAllowance, 18)
            };
            
        } catch (error) {
            console.error("❌ Token approval failed:", error.message);
            throw error;
        }
    }
    
    // ========================================================================
    // 📊 STATUS CHECK
    // ========================================================================
    
    async checkAllowances() {
        console.log("📊 Checking Current Allowances...");
        console.log("=" .repeat(50));
        
        try {
            const [usdcBalance, tokenBalance, usdcAllowance, tokenAllowance] = await Promise.all([
                this.usdc.balanceOf(this.wallet.address),
                this.dataCoin.balanceOf(this.wallet.address),
                this.usdc.allowance(this.wallet.address, CONFIG.marketplaceAddress),
                this.dataCoin.allowance(this.wallet.address, CONFIG.marketplaceAddress)
            ]);
            
            console.log("💰 BALANCES:");
            console.log("   💵 USDC:", ethers.formatUnits(usdcBalance, 6));
            console.log("   🪙  Tokens:", ethers.formatUnits(tokenBalance, 18));
            
            console.log("🔓 ALLOWANCES (Approved for marketplace):");
            console.log("   💵 USDC:", ethers.formatUnits(usdcAllowance, 6));
            console.log("   🪙  Tokens:", ethers.formatUnits(tokenAllowance, 18));
            
            console.log("✅ STATUS:");
            console.log("   🛒 Can buy data:", usdcAllowance > 0 ? "✅ YES" : "❌ NO");
            console.log("   💰 Can sell tokens:", tokenAllowance > 0 ? "✅ YES" : "❌ NO");
            
            return {
                balances: {
                    usdc: ethers.formatUnits(usdcBalance, 6),
                    tokens: ethers.formatUnits(tokenBalance, 18)
                },
                allowances: {
                    usdc: ethers.formatUnits(usdcAllowance, 6),
                    tokens: ethers.formatUnits(tokenAllowance, 18)
                },
                canBuy: usdcAllowance > 0,
                canSell: tokenAllowance > 0
            };
            
        } catch (error) {
            console.error("❌ Error checking allowances:", error.message);
            throw error;
        }
    }
    
    // ========================================================================
    // 🎁 HELPER: Send Test Tokens (For demo purposes)
    // ========================================================================
    
    async sendTestUSDC(recipientAddress, amount = 5) {
        console.log("🎁 Sending test USDC...");
        console.log("=" .repeat(30));
        
        try {
            const amountWei = ethers.parseUnits(amount.toString(), 6);
            
            // Check sender balance
            const balance = await this.usdc.balanceOf(this.wallet.address);
            if (balance < amountWei) {
                throw new Error(`Insufficient USDC to send. Need ${amount}, have ${ethers.formatUnits(balance, 6)}`);
            }
            
            console.log("👤 Sending to:", recipientAddress);
            console.log("💵 Amount:", amount, "USDC");
            
            const transferTx = await this.usdc.transfer(recipientAddress, amountWei);
            console.log("📤 Transfer sent:", transferTx.hash);
            
            const receipt = await transferTx.wait();
            console.log("✅ USDC sent successfully!");
            
            return {
                success: true,
                txHash: transferTx.hash,
                amount: amount
            };
            
        } catch (error) {
            console.error("❌ USDC transfer failed:", error.message);
            throw error;
        }
    }
}

// ============================================================================
// 🎬 DEMO FUNCTIONS
// ============================================================================

async function setupMarketplaceApprovals() {
    console.log("🔧 Setting up marketplace approvals...");
    console.log("=" .repeat(60));
    
    const approver = new ApprovalHelper();
    
    try {
        // Check current status
        console.log("1️⃣  Checking current allowances...");
        await approver.checkAllowances();
        
        // Approve USDC for purchases
        console.log("\n2️⃣  Setting up USDC approvals...");
        await approver.approveUSDCForPurchase(20); // Approve 20 USDC
        
        // Approve tokens for sales (if you have tokens)
        console.log("\n3️⃣  Setting up token approvals...");
        try {
            await approver.approveTokensForSale(10); // Approve 10 tokens
        } catch (error) {
            if (error.message.includes("Insufficient token balance")) {
                console.log("ℹ️  Skipping token approval - no tokens to approve yet");
            } else {
                throw error;
            }
        }
        
        // Final status check
        console.log("\n4️⃣  Final status check...");
        const finalStatus = await approver.checkAllowances();
        
        console.log("\n🎉 Approval setup complete!");
        
        if (finalStatus.canBuy && finalStatus.canSell) {
            console.log("✅ Ready for both buying and selling!");
        } else if (finalStatus.canBuy) {
            console.log("✅ Ready for buying data! (Need tokens for selling)");
        } else {
            console.log("⚠️  Still need approvals for transactions");
        }
        
        return finalStatus;
        
    } catch (error) {
        console.error("❌ Setup failed:", error.message);
        throw error;
    }
}

async function testBuyerScenario() {
    console.log("🛒 Testing Complete Buyer Scenario...");
    console.log("=" .repeat(60));
    
    const approver = new ApprovalHelper();
    
    try {
        // Step 1: Setup approvals
        console.log("1️⃣  Setting up USDC approval for purchase...");
        await approver.approveUSDCForPurchase(5);
        
        // Step 2: Import and use marketplace
        const { SimpleDataMarketplace } = require('./simpleBuySell.js');
        const marketplace = new SimpleDataMarketplace();
        await marketplace.initialize();
        
        // Step 3: Execute purchase
        console.log("\n2️⃣  Executing data purchase...");
        const purchaseResult = await marketplace.buyDataAccess(
            "0x9DC63460d0987d8AB27224F42f04ddA36b5232CD", // Buyer
            2 // 2 USDC
        );
        
        console.log("🎉 Purchase completed:", purchaseResult);
        
        // Step 4: Check access
        console.log("\n3️⃣  Verifying data access...");
        await marketplace.checkDataAccess("0x9DC63460d0987d8AB27224F42f04ddA36b5232CD");
        
        return purchaseResult;
        
    } catch (error) {
        console.error("❌ Buyer scenario failed:", error.message);
        throw error;
    }
}

// ============================================================================
// 🚀 EXPORT & EXECUTION
// ============================================================================

module.exports = {
    ApprovalHelper,
    setupMarketplaceApprovals,
    testBuyerScenario,
    CONFIG
};

// Run setup if called directly
if (require.main === module) {
    console.log("🚀 Setting up marketplace approvals...");
    
    setupMarketplaceApprovals()
        .then((status) => {
            console.log("\n💡 Next steps:");
            if (status.canBuy) {
                console.log("✅ You can now run the marketplace purchase flow!");
                console.log("📋 Try: node testCompletePurchase.js");
            }
            if (status.canSell) {
                console.log("✅ You can now sell tokens for USDC!");
            }
            
            process.exit(0);
        })
        .catch(error => {
            console.error("💥 Setup failed:", error.message);
            process.exit(1);
        });
}
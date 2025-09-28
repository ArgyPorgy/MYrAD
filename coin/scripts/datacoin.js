// datacoin-fixed.js - Fixed BigInt mixing issue
const { ethers } = require("ethers");
require("dotenv").config();

// Import ABIs and config
let DatacoinABI;
let getChainConfig;

try {
    DatacoinABI = require("./abi/DataCoin.js");
    const chainConfigModule = require("./chainConfig.js");
    getChainConfig = chainConfigModule.getChainConfig;
} catch (error) {
    console.error("❌ Error loading required files:");
    console.error("Make sure these files exist:");
    console.error("- ./abi/DataCoin.js");
    console.error("- ./chainConfig.js");
    process.exit(1);
}

// Configuration
const chainName = "sepolia";
const dataCoinAddress = "0x1004C62953b2ca3f3dca57Efb6be21D3657009Aa";

async function setupConnection() {
    try {
        console.log("🔗 Setting up connection to", chainName);
        
        const { rpc } = getChainConfig(chainName);
        const provider = new ethers.JsonRpcProvider(rpc);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log("👤 Connected wallet:", wallet.address);
        
        const network = await provider.getNetwork();
        console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
        
        const ethBalance = await provider.getBalance(wallet.address);
        console.log("⛽ ETH Balance:", ethers.formatEther(ethBalance), "ETH");
        
        if (ethBalance < ethers.parseEther("0.001")) {
            console.warn("⚠️  WARNING: Low ETH balance for gas fees");
        }
        
        const datacoinContract = new ethers.Contract(dataCoinAddress, DatacoinABI, wallet);
        
        // Test contract connection
        const name = await datacoinContract.name();
        console.log("✅ Successfully connected to DataCoin:", name);
        
        return { provider, wallet, datacoinContract };
        
    } catch (error) {
        console.error("❌ Connection setup failed:", error.message);
        throw error;
    }
}

const getCoinInfo = async (datacoinContract) => {
    try {
        console.log("\n📊 Getting DataCoin information...");
        console.log("=" .repeat(50));
        
        const [name, symbol, creator, allocationConfig, maxSupply, contributorsAllocationMinted] = await Promise.all([
            datacoinContract.name(),
            datacoinContract.symbol(),
            datacoinContract.creator(),
            datacoinContract.allocConfig(),
            datacoinContract.MAX_SUPPLY(),
            datacoinContract.contributorsAllocMinted()
        ]);

        // Fix BigInt mixing by converting everything to BigInt first
        const maxSupplyBig = BigInt(maxSupply.toString());
        const creatorBps = BigInt(allocationConfig[0].toString());
        const contributorsBps = BigInt(allocationConfig[2].toString());
        const liquidityBps = BigInt(allocationConfig[3].toString());
        const basisPoints = BigInt(10000);

        // Calculate allocations using BigInt arithmetic
        const creatorAllocation = (maxSupplyBig * creatorBps) / basisPoints;
        const contributorsAllocation = (maxSupplyBig * contributorsBps) / basisPoints;
        const liquidityAllocation = (maxSupplyBig * liquidityBps) / basisPoints;
        
        // Convert vesting duration to days
        const vestingSeconds = Number(allocationConfig[1].toString());
        const creatorVestingDuration = vestingSeconds / (24 * 60 * 60);

        console.log(`🪙  Token Name: ${name}`);
        console.log(`🏷️  Token Symbol: ${symbol}`);
        console.log(`👤 Creator: ${creator}`);
        console.log(`📈 Max Supply: ${ethers.formatUnits(maxSupply, 18)}`);
        console.log(`👨‍💼 Creator Allocation: ${ethers.formatUnits(creatorAllocation.toString(), 18)} (${Number(creatorBps) / 100}%)`);
        console.log(`⏰ Creator Vesting: ${creatorVestingDuration.toFixed(1)} days`);
        console.log(`👥 Contributors Allocation: ${ethers.formatUnits(contributorsAllocation.toString(), 18)} (${Number(contributorsBps) / 100}%)`);
        console.log(`✅ Contributors Minted: ${ethers.formatUnits(contributorsAllocationMinted, 18)}`);
        console.log(`🏊 Liquidity Allocation: ${ethers.formatUnits(liquidityAllocation.toString(), 18)} (${Number(liquidityBps) / 100}%)`);
        
        console.log("=" .repeat(50));
        
        return {
            name, symbol, creator, maxSupply,
            creatorAllocation, contributorsAllocation, liquidityAllocation,
            vestingDays: creatorVestingDuration
        };
        
    } catch (error) {
        console.error("❌ Error getting coin info:", error.message);
        console.error("Stack trace:", error.stack);
        throw error;
    }
};

const grantMinterRole = async (datacoinContract, address) => {
    try {
        console.log(`\n🔓 Granting minter role to ${address}...`);
        
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        
        // Check if address already has minter role
        const hasRole = await datacoinContract.hasRole(MINTER_ROLE, address);
        if (hasRole) {
            console.log("ℹ️  Address already has minter role");
            return;
        }
        
        const grantRoleTx = await datacoinContract.grantRole(MINTER_ROLE, address);
        console.log("📤 Transaction submitted:", grantRoleTx.hash);
        
        const receipt = await grantRoleTx.wait();
        console.log("✅ Minter role granted successfully!");
        console.log("⛽ Gas used:", receipt.gasUsed.toString());
        
    } catch (error) {
        console.error("❌ Error granting minter role:", error.message);
        
        if (error.message.includes("AccessControl")) {
            console.error("💡 Only the contract admin can grant minter roles");
        }
        throw error;
    }
};

const mintTokens = async (datacoinContract, address, amount) => {
    try {
        console.log(`\n🏭 Minting ${amount} tokens to ${address}...`);
        
        // Check if caller has minter role
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        const wallet = datacoinContract.runner;
        const hasMinterRole = await datacoinContract.hasRole(MINTER_ROLE, wallet.address);
        
        if (!hasMinterRole) {
            throw new Error("Caller does not have minter role");
        }
        
        const mintTx = await datacoinContract.mint(
            address,
            ethers.parseUnits(amount.toString(), 18)
        );
        console.log("📤 Transaction submitted:", mintTx.hash);
        
        const receipt = await mintTx.wait();
        console.log("✅ Tokens minted successfully!");
        console.log("⛽ Gas used:", receipt.gasUsed.toString());
        
        // Check new balance
        const balance = await datacoinContract.balanceOf(address);
        console.log(`💰 New balance: ${ethers.formatUnits(balance, 18)} tokens`);
        
    } catch (error) {
        console.error("❌ Error minting tokens:", error.message);
        
        if (error.message.includes("minter role")) {
            console.error("💡 Only addresses with minter role can mint tokens");
        }
        throw error;
    }
};

const claimVesting = async (datacoinContract) => {
    try {
        console.log("\n⏰ Claiming vested tokens...");
        
        const claimableAmount = await datacoinContract.getClaimableAmount();
        console.log(`📊 Claimable amount: ${ethers.formatUnits(claimableAmount, 18)} tokens`);
        
        // Convert to BigInt for comparison
        const claimableBig = BigInt(claimableAmount.toString());
        if (claimableBig === 0n) {
            console.log("ℹ️  No tokens available to claim at this time");
            return;
        }
        
        const claimVestingTx = await datacoinContract.claimVesting();
        console.log("📤 Transaction submitted:", claimVestingTx.hash);
        
        const receipt = await claimVestingTx.wait();
        console.log("✅ Vesting claimed successfully!");
        console.log("⛽ Gas used:", receipt.gasUsed.toString());
        
    } catch (error) {
        console.error("❌ Error claiming vesting:", error.message);
        throw error;
    }
};

async function main() {
    try {
        console.log("🚀 DataCoin Management Script");
        console.log("============================");
        
        // Setup connection
        const { datacoinContract } = await setupConnection();
        
        // Configuration - Edit these values
        const operations = {
            getCoinInfo: true,           // Show coin information
            grantMinterRole: true,       // Grant minter role
            mintTokens: true,            // Mint tokens
            claimVesting: false,         // Claim vested tokens
        };
        
        const config = {
            mintRoleAddress: "0x68827A9Fa11B716091f4B599D54a2484fb599a4C",
            receiverAddress: "0x68827A9Fa11B716091f4B599D54a2484fb599a4C",
            mintAmount: 100,
        };
        
        // Execute operations
        if (operations.getCoinInfo) {
            await getCoinInfo(datacoinContract);
        }
        
        if (operations.grantMinterRole) {
            await grantMinterRole(datacoinContract, config.mintRoleAddress);
        }
        
        if (operations.mintTokens) {
            await mintTokens(datacoinContract, config.receiverAddress, config.mintAmount);
        }
        
        if (operations.claimVesting) {
            await claimVesting(datacoinContract);
        }
        
        console.log("\n✅ All operations completed successfully!");
        
    } catch (error) {
        console.error("\n❌ Script execution failed:", error.message);
        process.exit(1);
    }
}

// Execute the script
main()
    .then(() => {
        console.log("\n🎯 Script finished!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Unhandled error:", error.message);
        process.exit(1);
    });
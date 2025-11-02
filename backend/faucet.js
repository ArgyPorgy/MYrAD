const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { RPC_URLS } = require('./config');

// Faucet cooldown file path
const FAUCET_COOLDOWN_FILE = path.join(__dirname, 'faucetCooldowns.json');

// Initialize faucet cooldown file if it doesn't exist
function initializeFaucetCooldownFile() {
  if (!fs.existsSync(FAUCET_COOLDOWN_FILE)) {
    fs.writeFileSync(FAUCET_COOLDOWN_FILE, JSON.stringify({}, null, 2));
    console.log('✅ Created faucetCooldowns.json file');
  }
}

// Load faucet cooldowns from JSON file
function loadFaucetCooldowns() {
  try {
    if (!fs.existsSync(FAUCET_COOLDOWN_FILE)) {
      initializeFaucetCooldownFile();
      return {};
    }
    const data = fs.readFileSync(FAUCET_COOLDOWN_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading faucet cooldowns:', error);
    return {};
  }
}

// Save faucet cooldowns to JSON file
function saveFaucetCooldowns(cooldowns) {
  try {
    fs.writeFileSync(FAUCET_COOLDOWN_FILE, JSON.stringify(cooldowns, null, 2));
  } catch (error) {
    console.error('Error saving faucet cooldowns:', error);
  }
}

// Check if user can claim (24 hour cooldown)
function canClaim(userAddress, faucetType) {
  const cooldowns = loadFaucetCooldowns();
  const key = `${userAddress.toLowerCase()}_${faucetType}`;
  const lastClaim = cooldowns[key];
  
  if (!lastClaim) {
    return { canClaim: true, timeRemaining: 0 };
  }
  
  const lastClaimTime = new Date(lastClaim).getTime();
  const now = Date.now();
  const timeElapsed = now - lastClaimTime;
  const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (timeElapsed >= cooldownMs) {
    return { canClaim: true, timeRemaining: 0 };
  }
  
  const timeRemaining = cooldownMs - timeElapsed;
  const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  
  return { 
    canClaim: false, 
    timeRemaining,
    hoursRemaining,
    minutesRemaining
  };
}

// Record a claim
function recordClaim(userAddress, faucetType) {
  const cooldowns = loadFaucetCooldowns();
  const key = `${userAddress.toLowerCase()}_${faucetType}`;
  cooldowns[key] = new Date().toISOString();
  saveFaucetCooldowns(cooldowns);
}

// Send ETH from faucet wallet
async function sendETH(toAddress, amount) {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not configured in .env');
    }

    // Initialize provider
    let provider;
    for (const rpcUrl of RPC_URLS) {
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        await provider.getBlockNumber();
        break;
      } catch (err) {
        if (rpcUrl === RPC_URLS[RPC_URLS.length - 1]) {
          throw new Error('All RPC providers failed');
        }
      }
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const amountWei = ethers.parseEther(amount);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    if (balance < amountWei) {
      throw new Error(`Insufficient ETH balance. Have ${ethers.formatEther(balance)} ETH, need ${amount} ETH`);
    }

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei,
    });

    console.log(`💧 Sending ${amount} ETH to ${toAddress}, tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ ETH sent successfully, confirmed in block ${receipt.blockNumber}`);

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error sending ETH:', error);
    throw error;
  }
}

// Send USDC from faucet wallet
async function sendUSDC(toAddress, amount) {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not configured in .env');
    }

    const USDC_ADDRESS = process.env.BASE_SEPOLIA_USDC || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    // Initialize provider
    let provider;
    for (const rpcUrl of RPC_URLS) {
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        await provider.getBlockNumber();
        break;
      } catch (err) {
        if (rpcUrl === RPC_URLS[RPC_URLS.length - 1]) {
          throw new Error('All RPC providers failed');
        }
      }
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals

    // USDC ERC20 ABI
    const USDC_ABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)"
    ];

    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

    // Check balance
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance < amountWei) {
      throw new Error(`Insufficient USDC balance. Have ${ethers.formatUnits(balance, 6)} USDC, need ${amount} USDC`);
    }

    // Send transaction
    const tx = await usdcContract.transfer(toAddress, amountWei);
    console.log(`💧 Sending ${amount} USDC to ${toAddress}, tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ USDC sent successfully, confirmed in block ${receipt.blockNumber}`);

    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error sending USDC:', error);
    throw error;
  }
}

// Initialize the file on module load
initializeFaucetCooldownFile();

module.exports = {
  canClaim,
  recordClaim,
  sendETH,
  sendUSDC,
  loadFaucetCooldowns
};


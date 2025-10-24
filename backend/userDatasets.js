const fs = require('fs');
const path = require('path');

// User datasets JSON file path
const USER_DATASETS_FILE = path.join(__dirname, 'userDatasets.json');

// Initialize user datasets file if it doesn't exist
function initializeUserDatasetsFile() {
  if (!fs.existsSync(USER_DATASETS_FILE)) {
    fs.writeFileSync(USER_DATASETS_FILE, JSON.stringify([], null, 2));
    console.log('✅ Created userDatasets.json file');
  }
}

// Load user datasets from JSON file
function loadUserDatasets() {
  try {
    if (!fs.existsSync(USER_DATASETS_FILE)) {
      initializeUserDatasetsFile();
      return [];
    }
    const data = fs.readFileSync(USER_DATASETS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading user datasets:', error);
    return [];
  }
}

// Save user datasets to JSON file
function saveUserDatasets(datasets) {
  try {
    fs.writeFileSync(USER_DATASETS_FILE, JSON.stringify(datasets, null, 2));
  } catch (error) {
    console.error('Error saving user datasets:', error);
  }
}

// Add a new user dataset
function addUserDataset(userDataset) {
  try {
    const datasets = loadUserDatasets();
    
    // Check if dataset already exists for this user/token/type combination
    const existingIndex = datasets.findIndex(d => 
      d.userAddress.toLowerCase() === userDataset.userAddress.toLowerCase() &&
      d.tokenAddress.toLowerCase() === userDataset.tokenAddress.toLowerCase() &&
      d.type === userDataset.type
    );
    
    if (existingIndex !== -1) {
      // Update existing entry
      datasets[existingIndex] = {
        ...datasets[existingIndex],
        ...userDataset,
        updatedAt: new Date().toISOString()
      };
      console.log(`Updated existing dataset: ${userDataset.symbol} for ${userDataset.userAddress}`);
    } else {
      // Add new entry
      datasets.push({
        ...userDataset,
        id: Date.now().toString(), // Simple ID generation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`Added new dataset: ${userDataset.symbol} for ${userDataset.userAddress}`);
    }
    
    saveUserDatasets(datasets);
    return true;
  } catch (error) {
    console.error('Error adding user dataset:', error);
    return false;
  }
}

// Get user datasets by address
function getUserDatasets(userAddress) {
  try {
    const datasets = loadUserDatasets();
    return datasets.filter(d => 
      d.userAddress.toLowerCase() === userAddress.toLowerCase()
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting user datasets:', error);
    return [];
  }
}

// Update token balance for a specific user/token/type combination
function updateTokenBalance(userAddress, tokenAddress, type, additionalAmount) {
  try {
    const datasets = loadUserDatasets();
    const existingIndex = datasets.findIndex(d => 
      d.userAddress.toLowerCase() === userAddress.toLowerCase() &&
      d.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() &&
      d.type === type
    );
    
    if (existingIndex !== -1) {
      // Add to existing balance
      const currentAmount = BigInt(datasets[existingIndex].amount);
      const newAmount = currentAmount + BigInt(additionalAmount);
      datasets[existingIndex].amount = newAmount.toString();
      datasets[existingIndex].updatedAt = new Date().toISOString();
      saveUserDatasets(datasets);
      console.log(`Updated ${type} balance for ${tokenAddress}: ${newAmount} (added ${additionalAmount})`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating token balance:', error);
    return false;
  }
}

// Initialize the file on module load
initializeUserDatasetsFile();

module.exports = {
  addUserDataset,
  getUserDatasets,
  loadUserDatasets,
  saveUserDatasets,
  updateTokenBalance,
  USER_DATASETS_FILE
};

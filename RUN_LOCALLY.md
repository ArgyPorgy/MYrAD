# 🏠 Running MYRAD Locally

## ✅ Setup Complete!

Your environment is now configured for **local development**.

---

## 🚀 How to Run

### Terminal 1: Start Backend
```bash
cd /Users/arghyachowdhury/Desktop/MYrAD
npm run backend
```

**Expected output:**
```
🚀 Backend API running on port 4000
📊 Available at: http://localhost:4000
```

---

### Terminal 2: Start Frontend
```bash
cd /Users/arghyachowdhury/Desktop/MYrAD
npm run dev
```

**Expected output:**
```
VITE v5.4.20 ready in XXXms
➜ Local: http://localhost:5173/
```

**Note:** If you get `EPERM` error on port 5173, that's a system issue. Try:
- Restart your terminal
- Kill any process using port 5173: `lsof -ti:5173 | xargs kill -9`
- Or change the port in `vite.config.ts`

---

## 🧪 Test Token Creation

1. **Open Browser:** http://localhost:5173
2. **Connect Wallet:** Click "Connect Wallet" (MetaMask/Coinbase)
3. **Navigate:** Click "Create Dataset" in sidebar
4. **Upload File:** Drag & drop or click to upload
5. **Fill Form:**
   - Dataset Name: `Test Dataset`
   - Token Symbol: `TEST`
   - Total Supply: `2000000` (or any number)
6. **Create:** Click "Create Dataset Token"

**Wait for:**
```
✅ File uploaded successfully to IPFS!
✅ Dataset created successfully! Redirecting to marketplace...
```

**Then:**
- Auto-redirects to marketplace
- Find your token in the list
- Click to see details
- Price should display (not "N/A")

---

## 📊 Check Your Allocation

After creating a token, check your wallet:

**You should have:**
- **10%** of total supply (e.g., 200,000 if you created 2M)

**To verify:**
1. Click on your token in marketplace
2. Check "Your Balance" stat
3. Should show your 10% allocation

**Treasury wallet** (from .env):
- Should have **5%** of total supply

**Marketplace pool:**
- Should have **85%** for trading

---

## 🔍 Troubleshooting

### Backend won't start

**Error:** "Port 4000 already in use"
```bash
# Kill the process
lsof -ti:4000 | xargs kill -9

# Then restart
npm run backend
```

**Error:** "Missing environment variables"
- Check `.env` file exists
- Verify these are set:
  ```
  FACTORY_ADDRESS=0x1f3Aa6cD139DA8BCd7B147b1edDd8AbA29CB0f49
  MARKETPLACE_ADDRESS=0xe3A8998b82d6b6f0763318A37d960e7d3FC4779b
  MYRAD_TREASURY=0x342F483f1dDfcdE701e7dB281C6e56aC4C7b05c9
  PRIVATE_KEY=<your_wallet_private_key>
  BASE_SEPOLIA_USDC=0x036cbd53842c5426634e7929541ec2318f3dcf7e
  ```

---

### Frontend won't connect to backend

**Error:** "Failed to fetch" or "Network error"
- Make sure backend is running (`npm run backend`)
- Check backend shows: `Running on port 4000`
- Verify `.env` does NOT have `VITE_API_BASE_URL` set
- Restart frontend if you changed `.env`

---

### Token creation fails

**Error:** "500 Internal Server Error"

**Check backend logs for:**

1. **"Insufficient balance for gas"**
   - Solution: Add ETH to company wallet
   - Get from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

2. **"USDC approval failed"**
   - Solution: Get USDC from faucet
   - URL: https://faucet.circle.com/

3. **"All RPC providers failed"**
   - Solution: Check internet connection
   - RPC URL is now hardcoded to Alchemy endpoint

4. **"Pool not initialized"**
   - Solution: Check MARKETPLACE_ADDRESS is correct

---

### Price shows "N/A"

**Solutions:**
1. Wait 5-10 seconds for price to load
2. Check console logs (F12) for errors
3. Refresh the page
4. Make sure pool was initialized (check backend logs)

---

## 🎯 What's Working

✅ Creator gets 10% allocation  
✅ Custom supply is applied  
✅ Redirects to /marketplace after creation  
✅ Price displays with auto-retry  
✅ Price auto-refreshes every 30 seconds  
✅ Price updates after trades  

---

## 📝 Environment Config

**Local Development:** (.env file)
```bash
# NO VITE_API_BASE_URL = Uses localhost:4000 automatically via Vite proxy
FACTORY_ADDRESS=0x1f3Aa6cD139DA8BCd7B147b1edDd8AbA29CB0f49
MARKETPLACE_ADDRESS=0xe3A8998b82d6b6f0763318A37d960e7d3FC4779b
MYRAD_TREASURY=0x342F483f1dDfcdE701e7dB281C6e56aC4C7b05c9
PRIVATE_KEY=<company_wallet_private_key>
BASE_SEPOLIA_USDC=0x036cbd53842c5426634e7929541ec2318f3dcf7e
```

**Production (Vercel):** Set in Vercel dashboard
```bash
VITE_API_BASE_URL=https://myrad.onrender.com  # For Vercel only!
```

---

## 🔥 Quick Commands

**Start Everything:**
```bash
# Terminal 1
npm run backend

# Terminal 2  
npm run dev
```

**Clean Restart:**
```bash
# Kill all node processes
pkill -f node

# Start fresh
npm run backend  # Terminal 1
npm run dev      # Terminal 2
```

**Check Backend Health:**
```bash
curl http://localhost:4000
# Should return: 🚀 MYRAD Backend API running ✅
```

**Check Datasets:**
```bash
curl http://localhost:4000/datasets
# Should return JSON of created tokens
```

---

## ✨ You're All Set!

Your local environment is ready:
- ✅ Frontend uses localhost backend
- ✅ New factory deployed
- ✅ All fixes applied
- ✅ Ready to create tokens

**Start testing!** 🚀


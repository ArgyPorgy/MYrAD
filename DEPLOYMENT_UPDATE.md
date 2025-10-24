# 🚀 Deployment Update Guide

## ⚠️ CRITICAL: Backend on Render Needs Update

Your backend is currently deployed on Render at `https://myrad.onrender.com`, but it's using the **old factory address** and **old code**. This is causing the 500 error.

---

## 📋 Required Actions

### 1. Update Environment Variables on Render

Go to your Render dashboard → Your service → Environment tab

**Update this variable:**
```
FACTORY_ADDRESS=0x1f3Aa6cD139DA8BCd7B147b1edDd8AbA29CB0f49
```

**Verify these are also set:**
```
MARKETPLACE_ADDRESS=0xe3A8998b82d6b6f0763318A37d960e7d3FC4779b
MYRAD_TREASURY=0x342F483f1dDfcdE701e7dB281C6e56aC4C7b05c9
BASE_SEPOLIA_USDC=0x036cbd53842c5426634e7929541ec2318f3dcf7e
PRIVATE_KEY=<your_company_wallet_private_key>
# RPC URL is now hardcoded to Alchemy endpoint
```

---

### 2. Push Code Changes to GitHub

All the code changes need to be deployed to Render:

```bash
cd /Users/arghyachowdhury/Desktop/MYrAD

# Stage all changes
git add .

# Commit with description
git commit -m "Fix token launch: creator allocation, custom supply, and redirect

- Updated DataCoinFactory to accept creator address parameter
- Fixed 10% allocation to creator wallet
- Custom supply now properly passed through
- Redirect to /marketplace after token creation
- Improved price display with retries and fallback
- Auto-refresh price every 30 seconds
- Deployed new factory at 0x1f3Aa6cD139DA8BCd7B147b1edDd8AbA29CB0f49"

# Push to main branch
git push origin main
```

---

### 3. Trigger Render Redeploy

After pushing to GitHub:
1. Go to Render dashboard
2. Your service will auto-deploy (if auto-deploy is enabled)
3. OR manually click "Deploy latest commit"
4. Wait for build to complete (~2-5 minutes)

---

## 🧪 Testing After Deployment

### Test Locally First (Recommended)

```bash
# Terminal 1 - Start backend
cd /Users/arghyachowdhury/Desktop/MYrAD
npm run backend

# Terminal 2 - Start frontend
npm run dev
```

**Test Flow:**
1. Connect wallet (this becomes the creator)
2. Upload dataset
3. Set custom supply (e.g., 2,000,000)
4. Click "Create Dataset Token"
5. Wait for success message
6. Should redirect to /marketplace
7. Click on your token
8. Price should display (not "N/A")

**Expected Distribution:**
- Creator: 10% (200,000 tokens)
- Treasury: 5% (100,000 tokens)  
- Pool: 85% (1,700,000 tokens)

---

### Verify on Render

Once deployed, test on:
- Frontend: https://myrad.vercel.app
- Backend: https://myrad.onrender.com

**Check Backend Health:**
```bash
curl https://myrad.onrender.com/
# Should return: 🚀 MYRAD Backend API running ✅
```

**Check Factory Address:**
```bash
# Check Render logs for:
# "Factory: 0x1f3Aa6cD139DA8BCd7B147b1edDd8AbA29CB0f49"
```

---

## 🔍 Debugging 500 Errors

If you still get 500 errors after deployment:

### Check Render Logs

1. Go to Render dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for error messages when you try to create a token

Common errors and solutions:

**Error: "Missing required environment variables"**
```
Solution: Add FACTORY_ADDRESS and MYRAD_TREASURY to Render env vars
```

**Error: "All RPC providers failed"**
```
Solution: RPC URL is now hardcoded to Alchemy endpoint - check internet connection
```

**Error: "Insufficient balance for gas"**
```
Solution: Add ETH to your company wallet (the one with PRIVATE_KEY)
```

**Error: "USDC approval failed"**
```
Solution: Ensure company wallet has at least 1 USDC
Get from: https://faucet.circle.com/
```

**Error: "Transaction reverted"**
```
Solution: Check that MARKETPLACE_ADDRESS is correct and deployed
```

---

## 📊 What Changed

### Smart Contracts
- `DataCoinFactory.sol` - Now accepts creator address as parameter
- Deployed at: `0x1f3Aa6cD139DA8BCd7B147b1edDd8AbA29CB0f49`

### Backend
- `createDatasetAPI.js` - 10%/5%/85% distribution
- `server.js` - Validates creator address and total supply

### Frontend
- `CreateDatasetPage.tsx` - Total supply input + redirect to /marketplace
- `TokenDetailPage.tsx` - Robust price fetching with retries

---

## ✅ Final Checklist

Before testing:
- [ ] Pushed all code to GitHub
- [ ] Updated FACTORY_ADDRESS on Render
- [ ] Render service redeployed successfully
- [ ] Backend logs show new factory address
- [ ] Wallet connected to frontend
- [ ] Company wallet has ETH for gas
- [ ] Company wallet has 1+ USDC

---

## 🆘 Quick Fix Commands

**If Render logs show old factory:**
1. Update env var on Render dashboard
2. Manually trigger redeploy
3. Wait for build to complete

**If local testing works but Render doesn't:**
- Check Render environment variables match local .env
- Check Render logs for specific error
- Ensure PRIVATE_KEY and RPC_URL are set correctly

**Emergency: Bypass Render, Use Local Backend:**
```bash
# Terminal 1
npm run backend

# Terminal 2 - Update frontend .env.local
echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local
npm run dev
```

---

## 📞 Support

If issues persist, check:
1. Render logs for specific error
2. Frontend console for 500 error details
3. Verify contract deployment on BaseScan
4. Test wallet has ETH and USDC

New Factory Contract:
https://sepolia.basescan.org/address/0x1f3Aa6cD139DA8BCd7B147b1edDd8AbA29CB0f49


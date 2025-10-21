# 🚀 Deployment Guide: Frontend (Vercel) + Backend (Render)

This guide explains how to deploy your MYRAD DataCoin platform with:
- **Backend**: Render (already deployed at https://myrad.onrender.com)
- **Frontend**: Vercel (to be deployed)

---

## ✅ Backend Setup (Render) - COMPLETED

Your backend is already live at: **https://myrad.onrender.com**

### Environment Variables Set on Render:
- `PRIVATE_KEY` - Your wallet private key
- `FACTORY_ADDRESS` - Factory contract address
- `MARKETPLACE_ADDRESS` - Marketplace contract address
- `USDC_ADDRESS` - Base Sepolia USDC address
- `MYRAD_TREASURY` - Treasury address
- `DOWNLOAD_SECRET` - JWT secret
- `PORT` - 4000

✅ CORS is now enabled to allow Vercel frontend to connect!

---

## 🎯 Frontend Setup (Vercel)

### Step 1: Push Your Code to GitHub

```bash
# From your project root
git add .
git commit -m "Add production API configuration and CORS support"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to **https://vercel.com**
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Select your **MYrAD** repository
5. Configure the project:

   **Framework Preset**: Vite
   
   **Build Command**: `npm run build`
   
   **Output Directory**: `dist`
   
   **Install Command**: `npm install`

### Step 3: Set Environment Variables in Vercel

In Vercel dashboard → Your Project → Settings → Environment Variables

Add this variable:

```
Name: VITE_API_BASE_URL
Value: https://myrad.onrender.com
Environment: Production, Preview, Development
```

### Step 4: Deploy!

Click **"Deploy"** and wait 3-5 minutes.

Your frontend will be live at: `https://myrad-[your-username].vercel.app`

---

## 🔧 How It Works

### Development (Local):
- Frontend runs on `localhost:5173`
- Vite proxy forwards API calls to `localhost:4000`
- Backend runs locally on `localhost:4000`

### Production:
- Frontend runs on **Vercel**: `https://myrad-[user].vercel.app`
- Backend runs on **Render**: `https://myrad.onrender.com`
- Frontend uses `VITE_API_BASE_URL` to call backend API
- CORS headers allow cross-origin requests

---

## 📋 Testing After Deployment

1. **Visit your Vercel URL**: `https://myrad-[your-username].vercel.app`

2. **Check backend connection**:
   - Open browser console (F12)
   - You should see API calls to `https://myrad.onrender.com/datasets`
   - No CORS errors should appear

3. **Test features**:
   - ✅ Connect wallet
   - ✅ View datasets
   - ✅ Create new dataset
   - ✅ Buy/sell tokens
   - ✅ Burn for download

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" or CORS errors
**Solution**: Make sure `VITE_API_BASE_URL` is set in Vercel environment variables

### Issue: API calls go to wrong URL
**Solution**: Redeploy after setting environment variable (Vercel → Deployments → Redeploy)

### Issue: "Network error"
**Solution**: Check Render backend is running at https://myrad.onrender.com/health

### Issue: Transactions fail
**Solution**: Make sure MetaMask is on Base Sepolia testnet (Chain ID: 84532)

---

## 🔐 Security Notes for Production

Currently using `Access-Control-Allow-Origin: *` which allows any origin.

For production, update `backend/server.js` to whitelist only your Vercel domain:

```javascript
// Replace in backend/server.js
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://myrad-yourapp.vercel.app',
    'https://myrad.com', // your custom domain
    'http://localhost:5173' // local dev
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

Then redeploy backend on Render.

---

## 🎉 You're Done!

Your full-stack dApp is now live:
- **Frontend**: Vercel
- **Backend**: Render  
- **Smart Contracts**: Base Sepolia
- **Storage**: IPFS via Lighthouse

---

## 📱 Custom Domain (Optional)

### For Vercel (Frontend):
1. Go to Vercel → Your Project → Settings → Domains
2. Add your custom domain (e.g., `myrad.com`)
3. Follow DNS configuration instructions

### For Render (Backend):
1. Go to Render → Your Service → Settings → Custom Domains
2. Add your API domain (e.g., `api.myrad.com`)
3. Update `VITE_API_BASE_URL` in Vercel to use new domain

---

## 🔄 Future Updates

When you make changes:

1. **Frontend changes**: Just push to GitHub → Vercel auto-deploys
2. **Backend changes**: Push to GitHub → Render auto-deploys
3. **Contract changes**: Deploy new contracts → Update env vars on Render

---

Need help? Check the main README.md or open an issue!


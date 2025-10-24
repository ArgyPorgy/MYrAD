import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Dataset } from '@/types/web3';
import { getApiUrl } from '@/config/api';
import {
  ERC20_ABI,
  MARKETPLACE_ABI,
  USDC_ABI,
  BASE_SEPOLIA_USDC
} from '@/constants/contracts';
import { retryContractCall } from '@/utils/web3';
import './TokenDetailPage.css';

const TokenDetailPage = () => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const navigate = useNavigate();
  const { provider, signer, userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [price, setPrice] = useState<string>('N/A');
  const [balance, setBalance] = useState<string>('0.00');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  useEffect(() => {
    if (tokenAddress) {
      loadDataset();
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (connected && provider && dataset) {
      readBalance();
      updatePrice();
    }
  }, [connected, provider, dataset]);

  // Auto-refresh price every 30 seconds
  useEffect(() => {
    if (!dataset || !tokenAddress) return;

    const priceInterval = setInterval(() => {
      console.log('Auto-refreshing price...');
      updatePrice();
    }, 30000); // 30 seconds

    return () => clearInterval(priceInterval);
  }, [dataset, tokenAddress]);

  const loadDataset = async () => {
    try {
      const resp = await fetch(getApiUrl("/datasets"));
      const data = await resp.json();
      
      if (data[tokenAddress!]) {
        setDataset(data[tokenAddress!]);
      } else {
        setStatus('Dataset not found');
      }
    } catch (err) {
      console.error("Error loading dataset:", err);
      setStatus('Error loading dataset');
    } finally {
      setLoading(false);
    }
  };

  const readBalance = async () => {
    try {
      if (!provider || !tokenAddress) return;
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const bal = await retryContractCall(() => token.balanceOf(userAddress));
      setBalance(ethers.formatUnits(bal, 18));
    } catch (err) {
      setBalance('n/a');
    }
  };

  const updatePrice = async (retryCount = 0) => {
    try {
      if (!tokenAddress) {
        console.warn('No token address available');
        return;
      }

      if (!dataset) {
        console.warn('Dataset not loaded yet');
        return;
      }

      // Try to get marketplace address from multiple fields
      const marketplaceAddr = dataset.marketplace || dataset.marketplace_address || dataset.bonding_curve;
      
      if (!marketplaceAddr) {
        console.error('No marketplace address found in dataset:', dataset);
        setPrice('Marketplace not configured');
        return;
      }

      console.log(`Fetching price for token ${tokenAddress} from marketplace ${marketplaceAddr}`);
      
      const resp = await fetch(getApiUrl(`/price/${marketplaceAddr}/${tokenAddress}`));
      
      if (!resp.ok) {
        if (resp.status === 404) {
          // Pool not initialized yet, try to calculate from contract directly
          await fetchPriceFromContract(marketplaceAddr);
          return;
        }
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      const priceNum = parseFloat(data.price);
      
      if (isNaN(priceNum)) {
        throw new Error('Invalid price data received');
      }
      
      // Format price based on magnitude
      let formattedPrice;
      if (priceNum === 0) {
        formattedPrice = '0.000000';
      } else if (priceNum < 0.000001) {
        formattedPrice = priceNum.toExponential(2);
      } else if (priceNum < 0.01) {
        formattedPrice = priceNum.toFixed(8);
      } else if (priceNum < 1) {
        formattedPrice = priceNum.toFixed(6);
      } else {
        formattedPrice = priceNum.toFixed(4);
      }
      
      setPrice(`${formattedPrice} USDC`);
      console.log(`Price updated: ${formattedPrice} USDC`);
    } catch (err: any) {
      console.error('Price fetch error:', err);
      
      // Retry logic (max 3 attempts)
      if (retryCount < 3) {
        console.log(`Retrying price fetch (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => updatePrice(retryCount + 1), 2000 * (retryCount + 1));
      } else {
        // After retries, try direct contract call
        const marketplaceAddr = dataset?.marketplace || dataset?.marketplace_address || dataset?.bonding_curve;
        if (marketplaceAddr) {
          await fetchPriceFromContract(marketplaceAddr);
        } else {
          setPrice('Unable to fetch price');
        }
      }
    }
  };

  const fetchPriceFromContract = async (marketplaceAddr: string) => {
    try {
      if (!provider || !tokenAddress) return;
      
      console.log('Fetching price directly from contract...');
      const marketplace = new ethers.Contract(marketplaceAddr, MARKETPLACE_ABI, provider);
      
      // Check if pool exists
      const exists = await retryContractCall(() => marketplace.poolExists(tokenAddress));
      if (!exists) {
        setPrice('Pool not initialized');
        return;
      }

      // Get price from contract
      const priceWei = await retryContractCall(() => marketplace.getPriceUSDCperToken(tokenAddress));
      const priceNum = parseFloat(ethers.formatUnits(priceWei, 6)); // Price is in USDC format (6 decimals)
      
      if (priceNum === 0) {
        setPrice('0.000000 USDC');
      } else if (priceNum < 0.000001) {
        setPrice(`${priceNum.toExponential(2)} USDC`);
      } else if (priceNum < 0.01) {
        setPrice(`${priceNum.toFixed(8)} USDC`);
      } else if (priceNum < 1) {
        setPrice(`${priceNum.toFixed(6)} USDC`);
      } else {
        setPrice(`${priceNum.toFixed(4)} USDC`);
      }
      
      console.log(`Price from contract: ${priceNum}`);
    } catch (err) {
      console.error('Contract price fetch error:', err);
      setPrice('Error fetching price');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBuy = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus('Connect wallet first or marketplace not configured');
      return;
    }

    try {
      setStatus('🔄 Processing buy...');
      const marketplace = new ethers.Contract(dataset.marketplace, MARKETPLACE_ABI, signer);
      const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, USDC_ABI, signer);
      
      const usdcAmount = ethers.parseUnits(buyAmount, 6);
      await retryContractCall(() => usdc.approve(dataset.marketplace!, usdcAmount));
      
      const tx = await retryContractCall(() => marketplace.buy(tokenAddress, usdcAmount, 0));
      await tx.wait();
      
      setStatus('✅ Buy confirmed!');
      setBuyAmount('');
      // Refresh balance and price after trade
      setTimeout(() => {
        readBalance();
        updatePrice();
      }, 2000);
    } catch (err: any) {
      console.error('Buy error:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('RPC endpoint returned HTTP client error')) {
        setStatus('❌ Network error: RPC endpoint timeout. Please try again.');
      } else if (err.message?.includes('execution reverted')) {
        setStatus('❌ Transaction failed: ' + err.message);
      } else {
        setStatus('❌ Buy failed: ' + (err?.message || err));
      }
    }
  };

  const handleSell = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus('Connect wallet first or marketplace not configured');
      return;
    }

    try {
      setStatus('🔄 Processing sell...');
      const marketplace = new ethers.Contract(dataset.marketplace, MARKETPLACE_ABI, signer);
      const token = new ethers.Contract(tokenAddress!, ERC20_ABI, signer);
      
      const tokenAmount = ethers.parseUnits(sellAmount, 18);
      await retryContractCall(() => token.approve(dataset.marketplace!, tokenAmount));
      
      const tx = await retryContractCall(() => marketplace.sell(tokenAddress, tokenAmount, 0));
      await tx.wait();
      
      setStatus('✅ Sell confirmed!');
      setSellAmount('');
      // Refresh balance and price after trade
      setTimeout(() => {
        readBalance();
        updatePrice();
      }, 2000);
    } catch (err: any) {
      console.error('Sell error:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('RPC endpoint returned HTTP client error')) {
        setStatus('❌ Network error: RPC endpoint timeout. Please try again.');
      } else if (err.message?.includes('execution reverted')) {
        setStatus('❌ Transaction failed: ' + err.message);
      } else {
        setStatus('❌ Sell failed: ' + (err?.message || err));
      }
    }
  };

  const handleBurn = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus('Connect wallet first or marketplace not configured');
      return;
    }

    try {
      setStatus('🔥 Burning tokens for access...');
      
      // Get user's token balance
      const token = new ethers.Contract(tokenAddress!, ERC20_ABI, signer);
      const userBalance = await token.balanceOf(userAddress);
      
      if (userBalance === 0n) {
        setStatus('❌ You have no tokens to burn');
        return;
      }

      // Get pool reserves to see how much can be burned
      const marketplace = new ethers.Contract(dataset.marketplace, MARKETPLACE_ABI, signer);
      const [poolTokenReserve, poolUsdcReserve] = await retryContractCall(() => 
        marketplace.getReserves(tokenAddress)
      );
      
      console.log(`Pool reserves: ${ethers.formatUnits(poolTokenReserve, 18)} tokens, ${ethers.formatUnits(poolUsdcReserve, 6)} USDC`);
      
      // Calculate burn amount - burn 10% of pool or user's balance, whichever is smaller
      const poolBurnAmount = poolTokenReserve / 10n; // Burn 10% of pool
      const burnAmount = userBalance < poolBurnAmount ? userBalance : poolBurnAmount;
      
      if (burnAmount === 0n) {
        setStatus('❌ No tokens available to burn from pool');
        return;
      }

      console.log(`Burning ${ethers.formatUnits(burnAmount, 18)} tokens (${ethers.formatUnits(userBalance, 18)} available)`);

      // Approve marketplace to spend tokens
      setStatus('🔄 Approving tokens...');
      const approveTx = await retryContractCall(() => token.approve(dataset.marketplace!, burnAmount));
      await approveTx.wait(); // Wait for approval confirmation
      console.log('✅ Approval confirmed');
      
      // Call marketplace burnForAccess (burns tokens and affects price)
      setStatus('🔥 Burning tokens from pool...');
      const burnTx = await retryContractCall(() => marketplace.burnForAccess(tokenAddress, burnAmount));
      await burnTx.wait();
      console.log('✅ Burn confirmed');
      
      setStatus('✅ Burned! Price increased. Waiting for download access...');
      
      // Poll for download access
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const r = await fetch(getApiUrl(`/access/${userAddress}/${dataset?.symbol}`));
          if (r.status === 200) {
            const j = await r.json();
            if (j.download || j.downloadUrl) {
              const downloadUrl = j.download || j.downloadUrl;
              window.open(downloadUrl, '_blank');
              setStatus('✅ Download ready!');
              readBalance();
              updatePrice(); // Update price to show the increase
              return;
            }
          }
        } catch (e) {}
      }
      
      setStatus('⚠️ Burn confirmed but download not ready. Try again in a moment.');
      readBalance();
      updatePrice();
    } catch (err: any) {
      console.error('Burn error:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('burn exceeds pool')) {
        setStatus('❌ Burn failed: Trying to burn more tokens than available in pool. Try burning fewer tokens.');
      } else if (err.message?.includes('RPC endpoint returned HTTP client error')) {
        setStatus('❌ Network error: RPC endpoint timeout. Please try again.');
      } else if (err.message?.includes('execution reverted')) {
        setStatus('❌ Transaction failed: ' + err.message);
      } else {
        setStatus('❌ Burn failed: ' + (err?.message || err));
      }
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Header 
            userAddress={userAddress}
            connected={connected}
            onConnect={(provider) => connectWallet(provider)}
            onDisconnect={disconnectWallet}
          />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading token...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Header 
            userAddress={userAddress}
            connected={connected}
            onConnect={(provider) => connectWallet(provider)}
            onDisconnect={disconnectWallet}
          />
          <div className="error-container">
            <h2>Dataset not found</h2>
            <button onClick={() => navigate('/marketplace')}>Back to Marketplace</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header 
          userAddress={userAddress}
          connected={connected}
          onConnect={(provider) => connectWallet(provider)}
          onDisconnect={disconnectWallet}
        />

        <div className="token-detail-page">
          <div className="token-detail-container">
            {/* Back Button */}
            <button className="back-button" onClick={() => navigate('/marketplace')}>
              ← Back to Market
            </button>

            {/* Token Header */}
            <div className="token-header">
              <div className="token-avatar-large">
                {dataset.symbol.charAt(0)}
              </div>
              <div>
                <h1 className="token-title">{dataset.name || dataset.symbol} ({dataset.symbol})</h1>
                <div className="chain-badge">
                  <span>⛓</span> Base Sepolia
                </div>
              </div>
            </div>

            {/* Contract Address */}
            <div className="contract-section">
              <div className="contract-label">CONTRACT ADDRESS</div>
              <div className="contract-display">
                <div className="contract-text">
                  {tokenAddress?.slice(0, 6)}...{tokenAddress?.slice(-4)}
                </div>
                <button className="copy-btn" onClick={copyToClipboard}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">PRICE</div>
                <div className="stat-value price">{price}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">YOUR BALANCE</div>
                <div className="stat-value">{parseFloat(balance).toFixed(2)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">TOTAL SUPPLY</div>
                <div className="stat-value">{dataset.total_supply ? dataset.total_supply.toLocaleString() : 'N/A'}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">CHAIN</div>
                <div className="stat-value">Base</div>
              </div>
            </div>

            {/* Trading Section */}
            {connected ? (
              <div className="trading-container">
                <div className="trade-tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('buy')}
                  >
                    BUY
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sell')}
                  >
                    SELL
                  </button>
                </div>

                <div className="trade-form">
                  {activeTab === 'buy' ? (
                    <div className="trade-group">
                      <label>Buy with USDC</label>
                      <input
                        type="text"
                        placeholder="Enter USDC amount"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="trade-input"
                      />
                      <button className="trade-btn buy" onClick={handleBuy}>
                        Buy ${dataset.symbol}
                      </button>
                    </div>
                  ) : (
                    <div className="trade-group">
                      <label>Sell Tokens</label>
                      <input
                        type="text"
                        placeholder="Enter token amount"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        className="trade-input"
                      />
                      <button className="trade-btn sell" onClick={handleSell}>
                        Sell ${dataset.symbol}
                      </button>
                    </div>
                  )}

                  <button className="burn-btn" onClick={handleBurn}>
                    BURN FOR DOWNLOAD ACCESS
                  </button>
                </div>
              </div>
            ) : (
              <div className="connect-prompt">
                <h3>Trading disabled</h3>
                <button className="connect-btn" onClick={() => connectWallet('metamask')}>
                  Connect wallet
                </button>
              </div>
            )}

            {/* Status */}
            {status && (
              <div className="status-message">
                {status}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TokenDetailPage;


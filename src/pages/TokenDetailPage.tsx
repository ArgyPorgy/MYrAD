import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomLoader from '@/components/CustomLoader';
import { Dataset } from '@/types/web3';
import { getApiUrl } from '@/config/api';
import {
  ERC20_ABI,
  MARKETPLACE_ABI,
  USDC_ABI,
  BASE_SEPOLIA_USDC
} from '@/constants/contracts';
import { retryContractCall } from '@/utils/web3';
import { ChevronLeft, Copy, Check, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const triggerFileDownload = async (url: string, filename?: string) => {
    try {
      const win = window.open(url, '_blank');
      if (win && !win.closed) return;
    } catch { }

    try {
      window.location.href = url;
      return;
    } catch { }

    try {
      const res = await fetch(url, { credentials: 'include' });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'dataset';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

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

  useEffect(() => {
    if (!dataset || !tokenAddress) return;

    const priceInterval = setInterval(() => {
      updatePrice();
    }, 30000);

    return () => clearInterval(priceInterval);
  }, [dataset, tokenAddress]);

  const loadDataset = async () => {
    try {
      setLoading(true);
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
      if (!tokenAddress || !dataset) return;

      const marketplaceAddr = dataset.marketplace || dataset.marketplace_address || dataset.bonding_curve;
      if (!marketplaceAddr) {
        setPrice('Marketplace not configured');
        return;
      }

      const resp = await fetch(getApiUrl(`/price/${marketplaceAddr}/${tokenAddress}`));

      if (!resp.ok) {
        if (resp.status === 404) {
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
    } catch (err: any) {
      console.error('Price fetch error:', err);

      if (retryCount < 3) {
        setTimeout(() => updatePrice(retryCount + 1), 2000 * (retryCount + 1));
      } else {
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

      const marketplace = new ethers.Contract(marketplaceAddr, MARKETPLACE_ABI, provider);
      const exists = await retryContractCall(() => marketplace.poolExists(tokenAddress));
      if (!exists) {
        setPrice('Pool not initialized');
        return;
      }

      const priceWei = await retryContractCall(() => marketplace.getPriceUSDCperToken(tokenAddress));
      const priceNum = parseFloat(ethers.formatUnits(priceWei, 6));

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
      setStatus('Processing buy...');
      const marketplace = new ethers.Contract(dataset.marketplace, MARKETPLACE_ABI, signer);
      const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, USDC_ABI, signer);
      const usdcAmount = ethers.parseUnits(buyAmount, 6);

      const currentAllowance: bigint = await retryContractCall(() => usdc.allowance(userAddress, dataset.marketplace!));
      if (currentAllowance < usdcAmount) {
        setStatus('Approving USDC spending cap...');
        const approveTx = await retryContractCall(() => usdc.approve(dataset.marketplace!, ethers.MaxUint256));
        await approveTx.wait();
      }

      const tx = await retryContractCall(() => marketplace.buy(tokenAddress, usdcAmount, 0));
      await tx.wait();

      setStatus('Buy confirmed!');
      showToast('Buy completed successfully', 'success');
      setBuyAmount('');
      setTimeout(() => {
        readBalance();
        updatePrice();
      }, 2000);
    } catch (err: any) {
      console.error('Buy error:', err);
      if (err.message?.includes('RPC endpoint returned HTTP client error')) {
        setStatus('Network error: RPC endpoint timeout. Please try again.');
      } else if (err.message?.includes('execution reverted')) {
        setStatus('Transaction failed: ' + err.message);
      } else {
        setStatus('Buy failed: ' + (err?.message || err));
      }
    }
  };

  const handleSell = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus('Connect wallet first or marketplace not configured');
      return;
    }

    try {
      setStatus('Processing sell...');
      const marketplace = new ethers.Contract(dataset.marketplace, MARKETPLACE_ABI, signer);
      const token = new ethers.Contract(tokenAddress!, ERC20_ABI, signer);
      const tokenAmount = ethers.parseUnits(sellAmount, 18);

      const currentAllowance: bigint = await retryContractCall(() => token.allowance(userAddress, dataset.marketplace!));
      if (currentAllowance < tokenAmount) {
        setStatus('Approving token spending cap...');
        const approveTx = await retryContractCall(() => token.approve(dataset.marketplace!, ethers.MaxUint256));
        await approveTx.wait();
      }

      const tx = await retryContractCall(() => marketplace.sell(tokenAddress, tokenAmount, 0));
      await tx.wait();

      setStatus('Sell confirmed!');
      showToast('Sell completed successfully', 'success');
      setSellAmount('');
      setTimeout(() => {
        readBalance();
        updatePrice();
      }, 2000);
    } catch (err: any) {
      console.error('Sell error:', err);
      if (err.message?.includes('RPC endpoint returned HTTP client error')) {
        setStatus('Network error: RPC endpoint timeout. Please try again.');
      } else if (err.message?.includes('execution reverted')) {
        setStatus('Transaction failed: ' + err.message);
      } else {
        setStatus('Sell failed: ' + (err?.message || err));
      }
    }
  };

  const handleBurn = async () => {
    if (!signer || !dataset || !dataset.marketplace) {
      setStatus('Connect wallet first or marketplace not configured');
      return;
    }

    try {
      setStatus('Burning tokens for access...');

      const token = new ethers.Contract(tokenAddress!, ERC20_ABI, signer);
      const userBalance: bigint = await token.balanceOf(userAddress);

      if (userBalance === 0n) {
        setStatus('You have no tokens to burn');
        return;
      }

      const marketplace = new ethers.Contract(dataset.marketplace, MARKETPLACE_ABI, signer);
      const [poolTokenReserve] = await retryContractCall(() => marketplace.getReserves(tokenAddress));
      const burnAmount = userBalance <= poolTokenReserve ? userBalance : poolTokenReserve;

      if (burnAmount === 0n) {
        setStatus('No tokens available to burn from pool');
        return;
      }

      const currentAllowance: bigint = await retryContractCall(() => token.allowance(userAddress, dataset.marketplace!));
      if (currentAllowance < burnAmount) {
        setStatus('Approving token burn spending cap...');
        const approveTx = await retryContractCall(() => token.approve(dataset.marketplace!, ethers.MaxUint256));
        await approveTx.wait();
      }

      setStatus('Burning tokens from pool...');
      const burnTx = await retryContractCall(() => marketplace.burnForAccess(tokenAddress, burnAmount));
      await burnTx.wait();

      setStatus('Burned! Price increased. Waiting for download access...');
      showToast('Burn completed successfully', 'success');

      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const r = await fetch(getApiUrl(`/access/${userAddress}/${dataset?.symbol}`));
          if (r.status === 200) {
            const j = await r.json();
            if (j.download || j.downloadUrl) {
              const downloadUrl = j.download || j.downloadUrl;
              await triggerFileDownload(downloadUrl, `${dataset?.symbol || 'dataset'}.zip`);
              setStatus('Download ready!');
              readBalance();
              updatePrice();
              return;
            }
          }
        } catch (e) { }
      }

      setStatus('Burn confirmed but download not ready. Try again in a moment.');
      readBalance();
      updatePrice();
    } catch (err: any) {
      console.error('Burn error:', err);
      if (err.message?.includes('burn exceeds pool')) {
        setStatus('Burn failed: Trying to burn more tokens than available in pool. Try burning fewer tokens.');
      } else if (err.message?.includes('RPC endpoint returned HTTP client error')) {
        setStatus('Network error: RPC endpoint timeout. Please try again.');
      } else if (err.message?.includes('execution reverted')) {
        setStatus('Transaction failed: ' + err.message);
      } else {
        setStatus('Burn failed: ' + (err?.message || err));
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
          <div className="page-container">
            <div className="token-detail-content">
              <div className="token-loading-container">
                <CustomLoader />
                <p className="loading-message">Loading token...</p>
              </div>
            </div>
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
          <div className="page-container">
            <div className="token-detail-content">
              <div className="error-container">
                <h2>Dataset not found</h2>
                <button onClick={() => navigate('/marketplace')}>Back to Marketplace</button>
              </div>
            </div>
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

        <div className="page-container">
          <div className="token-detail-content">
            <div className="toast-container">
              {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>
                  {t.message}
                </div>
              ))}
            </div>

            <div className="page-header">
              <h1 className="page-title">{dataset.name || dataset.symbol}</h1>
              <p className="page-description">
                Trade and manage your {dataset.symbol} position
              </p>
            </div>

            <div className="trading-main-wrapper">
              <div className="chart-area">
                <div className="chart-placeholder">
                  <h3>Chart Available On Mainnet</h3>
                </div>
              </div>

              {connected ? (
                <div className="trading-container">
                  <div className="trade-tabs">
                    <button
                      className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
                      onClick={() => setActiveTab('buy')}
                    >
                      <TrendingUp size={16} strokeWidth={2} />
                      Buy
                    </button>
                    <button
                      className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
                      onClick={() => setActiveTab('sell')}
                    >
                      <TrendingDown size={16} strokeWidth={2} />
                      Sell
                    </button>
                  </div>

                  <div className="trade-form">
                    {activeTab === 'buy' ? (
                      <div className="trade-group">
                        <label className="trade-label">USDC Amount</label>
                        <input
                          type="text"
                          placeholder="0.00"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          className="trade-input"
                        />
                        <button className="trade-btn buy" onClick={handleBuy}>
                          <TrendingUp size={16} strokeWidth={2} />
                          Buy {dataset.symbol}
                        </button>
                      </div>
                    ) : (
                      <div className="trade-group">
                        <label className="trade-label">Token Amount</label>
                        <input
                          type="text"
                          placeholder="0.00"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          className="trade-input"
                        />
                        <button className="trade-btn sell" onClick={handleSell}>
                          <TrendingDown size={16} strokeWidth={2} />
                          Sell {dataset.symbol}
                        </button>
                      </div>
                    )}
                  </div>

                  <button className="burn-button" onClick={handleBurn}>
                    Burn {dataset.symbol} for Access
                  </button>

                  {status && (
                    <div className="status-message">
                      {status}
                    </div>
                  )}
                </div>
              ) : (
                <div className="trading-container">
                  <div className="connect-prompt">
                    <div className="connect-icon">
                      <Wallet size={48} strokeWidth={1.5} />
                    </div>
                    <h3>Connect Your Wallet</h3>
                    <p>Connect your wallet to start trading</p>
                    <button
                      className="connect-btn"
                      onClick={async () => {
                        if (window.ethereum) {
                          await connectWallet('metamask');
                        } else if (window.coinbaseWalletExtension) {
                          await connectWallet('coinbase');
                        } else {
                          alert('No wallet found. Please install MetaMask or Coinbase Wallet.');
                        }
                      }}
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="token-stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Current Price</h3>
                  <div className="stat-icon">
                    <TrendingUp size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="stat-value">{price}</div>
                <p className="stat-description">USDC per token</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Your Balance</h3>
                  <div className="stat-icon">
                    <Wallet size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="stat-value">{parseFloat(balance).toFixed(2)}</div>
                <p className="stat-description">{dataset.symbol} tokens held</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Total Supply</h3>
                  <div className="stat-icon">
                    <TrendingUp size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="stat-value">{dataset.total_supply ? (dataset.total_supply / 1e6).toFixed(1) : '100'}M</div>
                <p className="stat-description">Total tokens issued</p>
              </div>
            </div>

            <div className="info-section">
              <h2 className="section-title">Token Details</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Contract Address</span>
                  <div className="info-value-with-copy">
                    <span className="info-value">{tokenAddress?.slice(0, 6)}...{tokenAddress?.slice(-4)}</span>
                    <button className="copy-btn" onClick={copyToClipboard}>
                      {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-label">Blockchain</span>
                  <span className="info-value">Base Sepolia</span>
                </div>

                <div className="info-item full-width">
                  <span className="info-label">Description</span>
                  <p className="info-description">
                    {dataset.description || 'No description available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TokenDetailPage;

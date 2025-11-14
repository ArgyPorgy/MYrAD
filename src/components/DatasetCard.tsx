import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Dataset } from '@/types/web3';
import {
  ERC20_ABI,
  MARKETPLACE_ABI,
  USDC_ABI,
  BASE_SEPOLIA_USDC,
  BASE_SEPOLIA_CHAIN_ID
} from '@/constants/contracts';
import { retryContractCall, getPublicRpcProvider } from '@/utils/web3';
import { getApiUrl } from '@/config/api';
import './DatasetCard.css';

interface DatasetCardProps {
  tokenAddress: string;
  dataset: Dataset;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  userAddress: string;
  connected: boolean;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
}

const DatasetCard = ({
  tokenAddress,
  dataset,
  provider,
  signer,
  userAddress,
  connected,
  onStatusChange,
  onRefresh,
}: DatasetCardProps) => {
  const [price, setPrice] = useState<string>('loading...');
  const [balance, setBalance] = useState<string>('—');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [hasDownloadAccess, setHasDownloadAccess] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const publicProvider = getPublicRpcProvider();

  // Function to trigger automatic file download
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'dataset';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const checkAccessStatus = async () => {
    if (!userAddress || !dataset?.symbol) {
      setHasDownloadAccess(false);
      setDownloadUrl(null);
      return;
    }

    try {
      const accessUrl = getApiUrl(`/access/${userAddress}/${dataset.symbol}`);
      const response = await fetch(accessUrl);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.download || data.downloadUrl) {
          setHasDownloadAccess(true);
          setDownloadUrl(data.download || data.downloadUrl);
        } else {
          setHasDownloadAccess(false);
          setDownloadUrl(null);
        }
      } else {
        setHasDownloadAccess(false);
        setDownloadUrl(null);
      }
    } catch (err) {
      console.error("Error checking access status:", err);
      setHasDownloadAccess(false);
      setDownloadUrl(null);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    
    try {
      await downloadFile(downloadUrl, dataset.name || dataset.symbol);
      onStatusChange('Download started!');
    } catch (err) {
      console.error("Download error:", err);
      onStatusChange('Download failed. Please try again.');
    }
  };

  const setMaxBuy = () => {
    setBuyAmount(usdcBalance);
  };

  const setMaxSell = () => {
    setSellAmount(balance === '—' || balance === 'n/a' ? '0' : balance);
  };

  useEffect(() => {
    if (connected && userAddress) {
      readBalance();
      checkAccessStatus();
    } else {
      setBalance('—');
      setHasDownloadAccess(false);
      setDownloadUrl(null);
    }
    updatePrice();
  }, [connected, userAddress, tokenAddress, dataset.marketplace_address, dataset.bonding_curve, dataset.symbol]);

  const readBalance = async () => {
    try {
      if (!userAddress) return;
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, publicProvider);
      const bal = await retryContractCall(() => token.balanceOf(userAddress));
      setBalance(ethers.formatUnits(bal, 18));
      
      // Also read USDC balance for max button
      const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, USDC_ABI, publicProvider);
      const usdcBal = await retryContractCall(() => usdc.balanceOf(userAddress));
      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
    } catch (err) {
      setBalance('n/a');
      setUsdcBalance('0.00');
    }
  };

  const updatePrice = async () => {
    try {
      const marketplaceAddr = dataset.marketplace_address || dataset.bonding_curve;
      if (!marketplaceAddr) {
        setPrice('N/A');
        return;
      }

      const response = await fetch(
        getApiUrl(`/price/${marketplaceAddr}/${tokenAddress}`)
      );

      if (!response.ok) {
        if (response.status === 404) {
          setPrice('pool not initialized');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setPrice(`${Number(data.price).toFixed(6)} USDC`);
    } catch (err: any) {
      setPrice('error');
      console.error('Price update error:', err?.message || err);
    }
  };

  const handleBuy = async () => {
    if (!buyAmount || isNaN(Number(buyAmount))) {
      alert('Enter USDC amount to spend');
      return;
    }
    if (!signer) {
      alert('Connect wallet first');
      return;
    }
    if (!dataset.marketplace_address) {
      alert('Marketplace address not found');
      return;
    }

    try {
      const network = await provider!.getNetwork();
      if (network.chainId !== BASE_SEPOLIA_CHAIN_ID) {
        onStatusChange('Wrong network! Must be on Base Sepolia testnet (84532)');
        return;
      }
    } catch (err: any) {
      onStatusChange('❌ Network error: ' + err.message);
      return;
    }

    const usdcAmount = ethers.parseUnits(buyAmount, 6);

    try {
      onStatusChange('Calculating tokens...');

      if (!dataset.marketplace_address) {
        onStatusChange('Error: Marketplace address not found');
        return;
      }

      const code = await retryContractCall(() => publicProvider.getCode(dataset.marketplace_address!));
      if (code === '0x') {
        onStatusChange('Error: Marketplace contract not found at address');
        return;
      }

      const marketplace = new ethers.Contract(dataset.marketplace_address, MARKETPLACE_ABI, signer);
      const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, USDC_ABI, signer);

      const allowance = await retryContractCall(() => usdc.allowance(userAddress, dataset.marketplace_address));
      if (allowance < usdcAmount) {
        onStatusChange('Approving USDC...');
        const approveTx = await retryContractCall(() => usdc.approve(dataset.marketplace_address, ethers.parseUnits('1000', 6)));
        await approveTx.wait();
        onStatusChange('Approved, calculating tokens...');
      }

      onStatusChange('Confirm buy in wallet...');
      const tx = await retryContractCall(() => marketplace.buy(usdcAmount, 0n));
      await tx.wait();

      onStatusChange('Buy confirmed!');
      setTimeout(() => {
        readBalance();
        updatePrice();
        onRefresh();
      }, 1000);
    } catch (err: any) {
      console.error('Buy error:', err);
      onStatusChange('Buy failed: ' + (err?.message || err));
    }
  };

  const handleSell = async () => {
    if (!sellAmount || isNaN(Number(sellAmount))) {
      alert('Enter token amount to sell');
      return;
    }
    if (!signer) {
      alert('Connect wallet first');
      return;
    }
    if (!dataset.marketplace_address) {
      alert('Marketplace address not found');
      return;
    }

    try {
      const network = await provider!.getNetwork();
      if (network.chainId !== BASE_SEPOLIA_CHAIN_ID) {
        onStatusChange('Wrong network! Must be on Base Sepolia testnet (84532)');
        return;
      }
    } catch (err: any) {
      onStatusChange('Network error: ' + err.message);
      return;
    }

    const tokenAmount = ethers.parseUnits(sellAmount, 18);

    try {
      onStatusChange('Calculating USDC...');

      if (!dataset.marketplace_address) {
        onStatusChange('Error: Marketplace address not found');
        return;
      }

      const code = await retryContractCall(() => publicProvider.getCode(dataset.marketplace_address!));
      if (code === '0x') {
        onStatusChange('Error: Marketplace contract not found at address');
        return;
      }

      const marketplace = new ethers.Contract(dataset.marketplace_address, MARKETPLACE_ABI, signer);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      onStatusChange('Checking approval...');
      const allowance = await retryContractCall(() => token.allowance(userAddress, dataset.marketplace_address));
      if (allowance < tokenAmount) {
        onStatusChange('Approving tokens...');
        const approveTx = await retryContractCall(() => token.approve(dataset.marketplace_address, ethers.parseUnits('1000000000', 18)));
        await approveTx.wait();
        onStatusChange('Approved, now selling...');
      }

      onStatusChange('Confirm sell in wallet...');
      const tx = await retryContractCall(() => marketplace.sell(tokenAmount, 0n));
      await tx.wait();

      onStatusChange('Sell confirmed!');
      setTimeout(() => {
        readBalance();
        updatePrice();
        onRefresh();
      }, 1000);
    } catch (err: any) {
      console.error('Sell error:', err);
      onStatusChange('Sell failed: ' + (err?.message || err));
    }
  };

  const handleBurnForAccess = async () => {
    if (!signer) {
      alert('Connect wallet first');
      return;
    }

    try {
      const network = await provider!.getNetwork();
      if (network.chainId !== BASE_SEPOLIA_CHAIN_ID) {
        onStatusChange('Wrong network! Must be on Base Sepolia testnet (84532)');
        return;
      }
    } catch (err: any) {
      onStatusChange('Network error: ' + err.message);
      return;
    }

    try {
      onStatusChange('Sending burn transaction...');

      const token = new ethers.Contract(
        tokenAddress,
        ['function burnForAccess() external', 'function burn(uint256) external'],
        signer
      );

      let tx;
      try {
        tx = await retryContractCall(() => token.burnForAccess());
      } catch (e) {
        const amt = prompt('Enter tokens to burn (or cancel):');
        if (!amt) {
          onStatusChange('Cancelled');
          return;
        }
        tx = await retryContractCall(() => token.burn(ethers.parseUnits(amt, 18)));
      }

      await tx.wait();
      onStatusChange('Burned! Your dataset is ready to download!');

      // Try fast-track first
      try {
        const fastTrackResp = await fetch(getApiUrl("/access/fast-track"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: tx.hash,
            userAddress,
            tokenAddress,
            marketplaceAddress: dataset.marketplace_address || dataset.bonding_curve,
            symbol: dataset.symbol,
          }),
        });

        if (fastTrackResp.ok) {
          const fastTrackData = await fastTrackResp.json();
          if (fastTrackData?.download) {
            setHasDownloadAccess(true);
            setDownloadUrl(fastTrackData.download);
            readBalance();
            return;
          }
        }
      } catch (fastTrackError) {
        console.error("Fast-track error:", fastTrackError);
      }

      // If fast-track didn't work, retry checking access status
      let accessGranted = false;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        
        // Check access directly
        try {
          const accessUrl = getApiUrl(`/access/${userAddress}/${dataset.symbol}`);
          const response = await fetch(accessUrl);
          
          if (response.status === 200) {
            const data = await response.json();
            if (data.download || data.downloadUrl) {
              setHasDownloadAccess(true);
              setDownloadUrl(data.download || data.downloadUrl);
              accessGranted = true;
              break;
            }
          }
        } catch (err) {
          console.error("Error checking access:", err);
        }
      }

      if (!accessGranted) {
        onStatusChange('Burn confirmed. Download access may take a moment to process.');
      }

      readBalance();
    } catch (err: any) {
      console.error(err);
      onStatusChange('Burn failed: ' + (err?.message || err));
    }
  };

  return (
    <div className="dataset-card">
      <div className="dataset-header">
        <div className="dataset-icon">{dataset.symbol.charAt(0)}</div>
        <div className="dataset-info">
          <h3 className="dataset-title">{dataset.name || dataset.symbol}</h3>
          <p className="dataset-symbol">{dataset.symbol}</p>
        </div>
      </div>

      <div className="dataset-meta">
        <div className="meta-item">
          <span className="meta-label">CID</span>
          <span className="meta-value">{dataset.cid.substring(0, 12)}...</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Price</span>
          <span className="meta-value-price">{price}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Your Balance</span>
          <span className="meta-value">
            {balance === '—' || balance === 'n/a' ? balance : Number(balance).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="dataset-actions">
        <div className="action-group">
          <div className="action-input-wrapper">
            <input
              type="text"
              placeholder="USDC amount"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="action-input"
            />
            <button className="max-button" onClick={setMaxBuy}>
              MAX
            </button>
          </div>
          <button className="btn-primary" onClick={handleBuy}>
            Buy
          </button>
        </div>

        <div className="action-group">
          <div className="action-input-wrapper">
            <input
              type="text"
              placeholder="Token amount"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="action-input"
            />
            <button className="max-button" onClick={setMaxSell}>
              MAX
            </button>
          </div>
          <button className="btn-secondary" onClick={handleSell}>
            Sell
          </button>
        </div>

        {hasDownloadAccess ? (
          <button className="btn-download" onClick={handleDownload}>
            Your dataset is ready, download it
          </button>
        ) : (
          <button className="btn-burn" onClick={handleBurnForAccess}>
            Burn for Access
          </button>
        )}
      </div>

      <div className="dataset-footer">
        <span className="contract-address">{tokenAddress.substring(0, 10)}...</span>
      </div>
    </div>
  );
};

export default DatasetCard;


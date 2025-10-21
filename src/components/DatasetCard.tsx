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
import { retryContractCall } from '@/utils/web3';
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

  useEffect(() => {
    if (connected && provider) {
      readBalance();
      updatePrice();
    }
  }, [connected, provider, tokenAddress]);

  const readBalance = async () => {
    try {
      if (!provider) return;
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const bal = await retryContractCall(() => token.balanceOf(userAddress));
      setBalance(ethers.formatUnits(bal, 18));
    } catch (err) {
      setBalance('n/a');
    }
  };

  const updatePrice = async () => {
    try {
      if (!provider) return;
      const marketplaceAddr = dataset.marketplace_address || dataset.bonding_curve;
      if (!marketplaceAddr) {
        setPrice('N/A');
        return;
      }

      const code = await retryContractCall(() => provider.getCode(marketplaceAddr));
      if (code === '0x') {
        setPrice('N/A (contract not found)');
        return;
      }

      const marketplace = new ethers.Contract(marketplaceAddr, MARKETPLACE_ABI, provider);
      const exists = await retryContractCall(() => marketplace.poolExists(tokenAddress));
      if (!exists) {
        setPrice('pool not initialized');
        return;
      }

      const priceValue = await retryContractCall(() => marketplace.getPriceUSDCperToken(tokenAddress));
      setPrice(`${ethers.formatUnits(priceValue, 18)} USDC`);
    } catch (err: any) {
      setPrice('error');
      console.error('Price update error:', err.message);
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
        onStatusChange('❌ Wrong network! Must be on Base Sepolia testnet (84532)');
        return;
      }
    } catch (err: any) {
      onStatusChange('❌ Network error: ' + err.message);
      return;
    }

    const usdcAmount = ethers.parseUnits(buyAmount, 6);

    try {
      onStatusChange('📊 Calculating tokens...');

      if (!dataset.marketplace_address) {
        onStatusChange('❌ Error: Marketplace address not found');
        return;
      }

      const code = await retryContractCall(() => provider!.getCode(dataset.marketplace_address!));
      if (code === '0x') {
        onStatusChange('❌ Error: Marketplace contract not found at address');
        return;
      }

      const marketplace = new ethers.Contract(dataset.marketplace_address, MARKETPLACE_ABI, signer);
      const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, USDC_ABI, signer);

      const allowance = await retryContractCall(() => usdc.allowance(userAddress, dataset.marketplace_address));
      if (allowance < usdcAmount) {
        onStatusChange('⏳ Approving USDC...');
        const approveTx = await retryContractCall(() => usdc.approve(dataset.marketplace_address, ethers.parseUnits('1000', 6)));
        await approveTx.wait();
        onStatusChange('✅ Approved, calculating tokens...');
      }

      onStatusChange('⏳ Confirm buy in wallet...');
      const tx = await retryContractCall(() => marketplace.buy(tokenAddress, usdcAmount, 0n));
      await tx.wait();

      onStatusChange('✅ Buy confirmed!');
      setTimeout(() => {
        readBalance();
        updatePrice();
        onRefresh();
      }, 1000);
    } catch (err: any) {
      console.error('Buy error:', err);
      onStatusChange('❌ Buy failed: ' + (err?.message || err));
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
        onStatusChange('❌ Wrong network! Must be on Base Sepolia testnet (84532)');
        return;
      }
    } catch (err: any) {
      onStatusChange('❌ Network error: ' + err.message);
      return;
    }

    const tokenAmount = ethers.parseUnits(sellAmount, 18);

    try {
      onStatusChange('📊 Calculating USDC...');

      if (!dataset.marketplace_address) {
        onStatusChange('❌ Error: Marketplace address not found');
        return;
      }

      const code = await retryContractCall(() => provider!.getCode(dataset.marketplace_address!));
      if (code === '0x') {
        onStatusChange('❌ Error: Marketplace contract not found at address');
        return;
      }

      const marketplace = new ethers.Contract(dataset.marketplace_address, MARKETPLACE_ABI, signer);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      onStatusChange('⏳ Checking approval...');
      const allowance = await retryContractCall(() => token.allowance(userAddress, dataset.marketplace_address));
      if (allowance < tokenAmount) {
        onStatusChange('⏳ Approving tokens...');
        const approveTx = await retryContractCall(() => token.approve(dataset.marketplace_address, ethers.parseUnits('1000000000', 18)));
        await approveTx.wait();
        onStatusChange('✅ Approved, now selling...');
      }

      onStatusChange('⏳ Confirm sell in wallet...');
      const tx = await retryContractCall(() => marketplace.sell(tokenAddress, tokenAmount, 0n));
      await tx.wait();

      onStatusChange('✅ Sell confirmed!');
      setTimeout(() => {
        readBalance();
        updatePrice();
        onRefresh();
      }, 1000);
    } catch (err: any) {
      console.error('Sell error:', err);
      onStatusChange('❌ Sell failed: ' + (err?.message || err));
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
        onStatusChange('❌ Wrong network! Must be on Base Sepolia testnet (84532)');
        return;
      }
    } catch (err: any) {
      onStatusChange('❌ Network error: ' + err.message);
      return;
    }

    try {
      onStatusChange('🔥 Sending burn transaction...');

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
      onStatusChange('✅ Burned! Waiting for backend access...');

      let accessGranted = false;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const r = await fetch(`/access/${userAddress}/${dataset.symbol}`);
          if (r.status === 200) {
            const j = await r.json();
            if (j.download) {
              // Trigger automatic download instead of opening in new tab
              await downloadFile(j.download, dataset.name || dataset.symbol);
              onStatusChange('✅ Dataset downloaded!');
              accessGranted = true;
              break;
            }
          }
        } catch (e) {}
      }

      if (!accessGranted) {
        onStatusChange('⚠️ Burn confirmed but download not ready. Try again in a moment.');
      }

      readBalance();
    } catch (err: any) {
      console.error(err);
      onStatusChange('❌ Burn failed: ' + (err?.message || err));
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
          <span className="meta-value">{parseFloat(balance).toFixed(2)}</span>
        </div>
      </div>

      <div className="dataset-actions">
        <div className="action-group">
          <input
            type="text"
            placeholder="USDC amount"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            className="action-input"
          />
          <button className="btn-primary" onClick={handleBuy}>
            Buy
          </button>
        </div>

        <div className="action-group">
          <input
            type="text"
            placeholder="Token amount"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            className="action-input"
          />
          <button className="btn-secondary" onClick={handleSell}>
            Sell
          </button>
        </div>

        <button className="btn-burn" onClick={handleBurnForAccess}>
          🔥 Burn for Access
        </button>
      </div>

      <div className="dataset-footer">
        <span className="contract-address">{tokenAddress.substring(0, 10)}...</span>
      </div>
    </div>
  );
};

export default DatasetCard;


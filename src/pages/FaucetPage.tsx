import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getApiUrl } from '@/config/api';
import { Droplet, AlertCircle, Check, X, Info} from 'lucide-react';
import './FaucetPage.css';


const FaucetPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [faucetLoading, setFaucetLoading] = useState<'eth' | 'usdc' | null>(null);
  const [faucetStatus, setFaucetStatus] = useState<{
    eth: { canClaim: boolean; hoursRemaining: number; minutesRemaining: number };
    usdc: { canClaim: boolean; hoursRemaining: number; minutesRemaining: number };
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');


  const showStatus = (message: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };


  const loadFaucetStatus = async () => {
    if (!userAddress) return;
    try {
      const response = await fetch(getApiUrl(`/faucet/status/${userAddress}`));
      if (response.ok) {
        const data = await response.json();
        setFaucetStatus(data);
      }
    } catch (error) {
      console.error('Error loading faucet status:', error);
    }
  };


  useEffect(() => {
    if (connected && userAddress) {
      loadFaucetStatus();
    }
  }, [connected, userAddress]);


  const handleFaucetClaim = async (type: 'eth' | 'usdc') => {
    if (!connected || !userAddress) {
      showStatus('Please connect your wallet first', 'error');
      return;
    }


    setFaucetLoading(type);
    showStatus(`Requesting ${type.toUpperCase()} faucet...`, 'info');


    try {
      const response = await fetch(getApiUrl(`/faucet/${type}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress }),
      });


      const data = await response.json();


      if (response.ok) {
        showStatus(
          `✅ ${data.message}! Transaction: ${data.txHash.substring(0, 10)}...`,
          'success'
        );
        setTimeout(() => loadFaucetStatus(), 1000);
      } else {
        showStatus(
          data.message || `Failed to claim ${type.toUpperCase()}`,
          'error'
        );
      }
    } catch (error: any) {
      console.error('Faucet error:', error);
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      setFaucetLoading(null);
    }
  };


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
          <div className="faucet-content">
            <div className="page-header">
              <h1 className="page-title">Testnet Faucet</h1>
              <p className="page-description">
                Get free test tokens for Base Sepolia testnet. Each faucet can be claimed once per 24 hours.
              </p>
            </div>


            <div className="faucet-container">
              {!connected ? (
                <div className="empty-state">
                  <h3 className="empty-title">Connect Your Wallet</h3>
                  <p className="empty-description">Connect your wallet to use the faucet</p>
                  <button 
                    className="btn-connect-large"
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
              ) : (
                <>
                  <div className="info-box">
                    <div className="info-icon">
                      <Info size={20} strokeWidth={1.5} />
                    </div>
                    <div className="info-content">
                      <strong>How it works:</strong> Click on either button to receive test tokens directly to your connected wallet. 
                      You can claim from each faucet once every 24 hours.
                    </div>
                  </div>


                  <div className="faucet-cards">
                    <div className="faucet-card">
                      <div className="faucet-card-header">
                        <div className="faucet-logo eth">
                          <img src="/eth.png" alt="ETH" />
                        </div>
                        <h3 className="faucet-card-title">ETH Faucet</h3>
                      </div>
                      <div className="faucet-card-amount">0.001 ETH</div>
                      <p className="faucet-card-description">
                        Get free ETH for gas fees and testing
                      </p>
                      <button
                        className={`faucet-btn ${faucetStatus === null || !faucetStatus?.eth.canClaim ? 'disabled' : ''}`}
                        onClick={() => handleFaucetClaim('eth')}
                        disabled={faucetLoading === 'eth' || faucetStatus === null || !faucetStatus?.eth.canClaim}
                      >
                        {faucetLoading === 'eth' ? (
                          <>
                            <Droplet size={16} strokeWidth={2} />
                            Sending...
                          </>
                        ) : faucetStatus === null ? (
                          <>
                            <Droplet size={16} strokeWidth={2} />
                            Loading...
                          </>
                        ) : !faucetStatus.eth.canClaim ? (
                          <>
                            <AlertCircle size={16} strokeWidth={2} />
                            {faucetStatus.eth.hoursRemaining}h {faucetStatus.eth.minutesRemaining}m
                          </>
                        ) : (
                          <>
                            <Droplet size={16} strokeWidth={2} />
                            Claim 0.001 ETH
                          </>
                        )}
                      </button>
                    </div>


                    <div className="faucet-card">
                      <div className="faucet-card-header">
                        <div className="faucet-logo usdc">
                          <img src="/usdc.png" alt="USDC" />
                        </div>
                        <h3 className="faucet-card-title">USDC Faucet</h3>
                      </div>
                      <div className="faucet-card-amount">5 USDC</div>
                      <p className="faucet-card-description">
                        Get free USDC for trading and testing
                      </p>
                      <button
                        className={`faucet-btn ${faucetStatus === null || !faucetStatus?.usdc.canClaim ? 'disabled' : ''}`}
                        onClick={() => handleFaucetClaim('usdc')}
                        disabled={faucetLoading === 'usdc' || faucetStatus === null || !faucetStatus?.usdc.canClaim}
                      >
                        {faucetLoading === 'usdc' ? (
                          <>
                            <Droplet size={16} strokeWidth={2} />
                            Sending...
                          </>
                        ) : faucetStatus === null ? (
                          <>
                            <Droplet size={16} strokeWidth={2} />
                            Loading...
                          </>
                        ) : !faucetStatus.usdc.canClaim ? (
                          <>
                            <AlertCircle size={16} strokeWidth={2} />
                            {faucetStatus.usdc.hoursRemaining}h {faucetStatus.usdc.minutesRemaining}m
                          </>
                        ) : (
                          <>
                            <Droplet size={16} strokeWidth={2} />
                            Claim 5 USDC
                          </>
                        )}
                      </button>
                    </div>
                  </div>


                  {statusMessage && (
                    <div className={`status-message active ${statusType}`}>
                      {statusType === 'success' && <Check size={18} strokeWidth={2.5} />}
                      {statusType === 'error' && <X size={18} strokeWidth={2.5} />}
                      {statusType === 'info' && <Info size={18} strokeWidth={2} />}
                      <span>{statusMessage}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


export default FaucetPage;
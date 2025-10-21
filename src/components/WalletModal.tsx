import React, { useState } from 'react';
import './WalletModal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: string) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleWalletConnect = async (provider: string) => {
    setConnecting(provider);
    try {
      await onConnect(provider);
      onClose();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setConnecting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2>Connect Wallet</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="wallet-modal-content">
          <p className="wallet-modal-description">
            Choose a wallet to connect to the Base Sepolia testnet
          </p>
          
          <div className="wallet-options">
            <button
              className="wallet-option"
              onClick={() => handleWalletConnect('metamask')}
              disabled={connecting === 'metamask'}
            >
              <div className="wallet-icon">🦊</div>
              <div className="wallet-info">
                <h3>MetaMask</h3>
                <p>Connect using MetaMask browser extension</p>
              </div>
              {connecting === 'metamask' && <div className="connecting-spinner" />}
            </button>

            <button
              className="wallet-option"
              onClick={() => handleWalletConnect('coinbase')}
              disabled={connecting === 'coinbase'}
            >
              <div className="wallet-icon">🔷</div>
              <div className="wallet-info">
                <h3>Coinbase Wallet</h3>
                <p>Connect using Coinbase Wallet extension</p>
              </div>
              {connecting === 'coinbase' && <div className="connecting-spinner" />}
            </button>

            <button
              className="wallet-option"
              onClick={() => handleWalletConnect('walletconnect')}
              disabled={connecting === 'walletconnect'}
            >
              <div className="wallet-icon">🔗</div>
              <div className="wallet-info">
                <h3>WalletConnect</h3>
                <p>Connect using WalletConnect protocol</p>
              </div>
              {connecting === 'walletconnect' && <div className="connecting-spinner" />}
            </button>
          </div>

          <div className="wallet-modal-footer">
            <p className="network-info">
              <strong>Network:</strong> Base Sepolia Testnet (Chain ID: 84532)
            </p>
            <p className="help-text">
              Don't have a wallet? <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">Install MetaMask</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;

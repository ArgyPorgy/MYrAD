import { useState } from 'react';
import './WalletModal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: string) => void;
}

const WalletModal = ({ isOpen, onClose, onConnect }: WalletModalProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleWalletConnect = async (provider: string) => {
    setConnecting(provider);
    try {
      if (provider === 'walletconnect') {
        onClose();
        await onConnect(provider);
      } else {
        await onConnect(provider);
        onClose();
      }
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
          <button className="close-button" onClick={onClose}>
            ×
          </button>
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
              <div className="wallet-tile-icon">
                <img src="/images/metamask.jpg" alt="MetaMask" />
              </div>
              <span className="wallet-tile-name">MetaMask</span>
              {connecting === 'metamask' && <div className="connecting-spinner" />}
            </button>

            <button
              className="wallet-option"
              onClick={() => handleWalletConnect('rabby')}
              disabled={connecting === 'rabby'}
            >
              <div className="wallet-tile-icon">
                <img src="/images/rabby.jpg" alt="Rabby Wallet" />
              </div>
              <span className="wallet-tile-name">Rabby</span>
              {connecting === 'rabby' && <div className="connecting-spinner" />}
            </button>

            <button
              className="wallet-option"
              onClick={() => handleWalletConnect('okx')}
              disabled={connecting === 'okx'}
            >
              <div className="wallet-tile-icon">
                <img src="/images/okx.jpg" alt="OKX Wallet" />
              </div>
              <span className="wallet-tile-name">OKX</span>
              {connecting === 'okx' && <div className="connecting-spinner" />}
            </button>

            <button
              className="wallet-option"
              onClick={() => handleWalletConnect('coinbase')}
              disabled={connecting === 'coinbase'}
            >
              <div className="wallet-tile-icon">
                <img src="/images/base app.jpg" alt="Coinbase Wallet" />
              </div>
              <span className="wallet-tile-name">Coinbase</span>
              {connecting === 'coinbase' && <div className="connecting-spinner" />}
            </button>

            <button
              className="wallet-option"
              onClick={() => handleWalletConnect('walletconnect')}
              disabled={connecting === 'walletconnect'}
            >
              <div className="wallet-tile-icon">
                <img src="/images/walletconnect.jpg" alt="WalletConnect" />
              </div>
              <span className="wallet-tile-name">WalletConnect</span>
              {connecting === 'walletconnect' && <div className="connecting-spinner" />}
            </button>
          </div>

          <div className="wallet-modal-footer">
            <p className="network-info">
              <strong>Network:</strong> Base Sepolia Testnet (Chain ID: 84532)
            </p>
            <p className="help-text">
              Don't have a wallet?{' '}
              <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
                Install MetaMask
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;

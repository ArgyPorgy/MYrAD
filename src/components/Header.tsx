import { useState } from 'react';
import { shortenAddress } from '@/utils/web3';
import WalletModal from './WalletModal';
import './Header.css';

interface HeaderProps {
  userAddress: string;
  connected: boolean;
  onConnect: (provider?: string) => void;
  onDisconnect: () => void;
}

const Header = ({ userAddress, connected, onConnect, onDisconnect }: HeaderProps) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const handleConnectClick = () => {
    setIsWalletModalOpen(true);
  };

  const handleWalletConnect = async (provider: string) => {
    await onConnect(provider);
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Marketplace</h1>
          </div>

          <div className="header-right">
            {connected ? (
              <div className="wallet-actions">
                <div className="wallet-badge">
                  <div className="wallet-status"></div>
                  <span>{shortenAddress(userAddress)}</span>
                </div>
                <button className="disconnect-button" onClick={onDisconnect}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="connect-button" onClick={handleConnectClick}>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </>
  );
};

export default Header;


import { useState } from 'react';
import { shortenAddress } from '@/utils/web3';
import WalletModal from './WalletModal';
import { Avatar, Name } from '@coinbase/onchainkit/identity';
import './Header.css';
import { base } from 'viem/chains';

interface HeaderProps {
  userAddress: string;
  connected: boolean;
  onConnect: (provider?: string) => void;
  onDisconnect: () => void;
}

const Header = ({ userAddress, connected, onConnect, onDisconnect }: HeaderProps) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

 // ✅ Simple unified way
const displayAddress = (userAddress ) as `0x${string}`;

//const displayAddress = ('0x06a7CfeFC9358181544166832889a970BdE557EA') as `0x${string}`;


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
              <div className="wallet-actions flex items-center gap-4">
                {/* Avatar + Name Section */}
                <div className="wallet-info">
                  <Avatar
                    address={displayAddress}
                    chain={base}
                    className="avatar"
                  />
                  <Name
                    address={displayAddress}
                    chain={base}
                    className="wallet-name"
                  />
                </div>

                {/* Shortened Address + Disconnect */}
                <div className="wallet-badge">
                  <div className="wallet-status"></div>
                  <span>{shortenAddress(displayAddress)}</span>
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

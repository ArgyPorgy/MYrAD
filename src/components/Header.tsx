import { shortenAddress } from '@/utils/web3';
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

 // ✅ Simple unified way
const displayAddress = (userAddress ) as `0x${string}`;

//const displayAddress = ('0x06a7CfeFC9358181544166832889a970BdE557EA') as `0x${string}`;

  const handleConnectClick = async () => {
    // Trigger wallet connection - this will open the wallet's own selection UI
    // If multiple wallets are installed, the provider will show options
    // Clear any cached connection state first to ensure options appear
    try {
      if (window.ethereum) {
        // Request connection - if multiple wallets, the provider will show selector
        await onConnect('metamask');
      } else if (window.coinbaseWalletExtension) {
        await onConnect('coinbase');
      } else {
        alert('No wallet found. Please install a wallet extension.');
      }
    } catch (err) {
      console.error('Connection error:', err);
    }
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

    </>
  );
};

export default Header;

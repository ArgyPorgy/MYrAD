import { Name } from '@coinbase/onchainkit/identity';
import { LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import { base } from 'viem/chains';

interface HeaderProps {
  userAddress: string;
  connected: boolean;
  onConnect: (provider?: string) => void;
  onDisconnect: () => void;
}

const Header = ({ userAddress, connected, onConnect, onDisconnect }: HeaderProps) => {
  const location = useLocation();
  const displayAddress = userAddress as `0x${string}`;

  // Function to get page title based on route
  const getPageTitle = (): string => {
    const path = location.pathname;
    
    if (path === '/' || path === '') return 'Home';
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/feed') return 'Feed';
    if (path === '/marketplace') return 'Marketplace';
    if (path.startsWith('/token/')) return 'Token Details';
    if (path === '/create') return 'Create Dataset';
    if (path === '/my-datasets') return 'My Datasets';
    if (path === '/faucet') return 'Faucet';
    
    return 'MYRAD';
  };

  const handleConnectClick = async (): Promise<void> => {
    try {
      if (window.ethereum) {
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
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>

        <div className="header-right">
          {connected ? (
            <div className="wallet-actions">
              <div className="wallet-info">
                <div className="avatar-circle"></div>
                <Name
                  address={displayAddress}
                  chain={base}
                  className="wallet-name"
                />
              </div>

              <button className="disconnect-button" onClick={onDisconnect} type="button">
                <LogOut size={16} />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button className="connect-button" onClick={handleConnectClick} type="button">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
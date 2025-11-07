import { Name } from '@coinbase/onchainkit/identity';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Header.css';
import { base } from 'viem/chains';

interface HeaderProps {
  userAddress: string;
  connected: boolean;
  onConnect: (provider?: string) => void;
  onDisconnect: () => void;
}

const Header = ({ userAddress, connected, onConnect, onDisconnect }: HeaderProps) => {
  const displayAddress = userAddress as `0x${string}`;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarToggle = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      setSidebarCollapsed(collapsed);
    };

    const checkInitialState = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      const isMobile = window.innerWidth <= 768;
      setSidebarCollapsed(isMobile || collapsed);
    };

    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setSidebarCollapsed(true);
      } else {
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        setSidebarCollapsed(collapsed);
      }
    };

    checkInitialState();
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-content">
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

              <div className="wallet-dropdown-container">
                <button 
                  className="wallet-dropdown-toggle" 
                  onClick={toggleDropdown}
                  type="button"
                >
                  <div className="avatar-circle-small"></div>
                  <ChevronDown size={16} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="wallet-dropdown-menu">
                    <div className="dropdown-address">
                      <Name
                        address={displayAddress}
                        chain={base}
                        className="dropdown-wallet-name"
                      />
                    </div>
                  </div>
                )}
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

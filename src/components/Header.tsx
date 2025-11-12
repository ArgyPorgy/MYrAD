import { useEffect, useState } from 'react';
import { shortenAddress } from '@/utils/web3';
import WalletModal from './WalletModal';
import './Header.css';

interface HeaderProps {
  userAddress: string;
  connected: boolean;
  onConnect: (provider?: string) => Promise<void> | void;
  onDisconnect: () => Promise<void> | void;
}

const Header = ({
  userAddress,
  connected,
  onConnect,
  onDisconnect,
}: HeaderProps) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Header render - connected:', connected, 'userAddress:', userAddress);
  }, [connected, userAddress]);

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

    const openModal = () => {
      setIsWalletModalOpen(true);
    };

    checkInitialState();
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    window.addEventListener('openWalletModal', openModal);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('openWalletModal', openModal);
    };
  }, []);

  const handlePrimaryConnectClick = async () => {
    try {
      await onConnect();
    } catch (err) {
      console.error('Connect handler error:', err);
    }
  };

  const handleWalletConnect = async (provider: string) => {
    await onConnect(provider);
  };

  const handleDisconnectClick = async () => {
    await onDisconnect();
    setIsWalletModalOpen(false);
  };

  return (
    <>
      <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="header-content">
          <div className="header-right">
            {connected ? (
              <div className="wallet-actions">
                <div className="wallet-badge">
                  <div className="wallet-status"></div>
                  <span>{shortenAddress(userAddress)}</span>
                </div>
                <button className="disconnect-button" onClick={handleDisconnectClick}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="connect-button" onClick={handlePrimaryConnectClick}>
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

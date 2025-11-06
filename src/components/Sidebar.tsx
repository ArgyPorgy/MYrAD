import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Rss, ShoppingBag, Plus, Folder, Droplet, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (path: string): boolean => location.pathname === path;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        setIsCollapsed(collapsed);
      } else {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  async function addBaseSepoliaNetwork(): Promise<void> {
    try {
      if (!window.ethereum) {
        alert('No Ethereum wallet found. Please install MetaMask or another wallet extension.');
        return;
      }
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia-explorer.base.org']
          }
        ]
      });
      console.log('Base Sepolia network added successfully');
      alert('Base Sepolia network added successfully!');
    } catch (error) {
      console.error('Error adding network:', error);
      alert('Error adding network. Check console for details.');
    }
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem('sidebarCollapsed', String(newState));
      window.dispatchEvent(new Event('sidebarToggle'));
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={closeMobileSidebar} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile && isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo" onClick={toggleSidebar}>
            <img
              src="https://pbs.twimg.com/profile_images/1977080620548255745/uoo-Vir5_400x400.jpg"
              alt="MYRAD Logo"
              className="logo-image"
            />
            {(!isCollapsed || (isMobile && isOpen)) && <span className="logo-text">MYRAD</span>}
          </div>
          {(!isCollapsed || (isMobile && isOpen)) && <div className="beta-badge">BETA</div>}
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            title="Dashboard"
            onClick={handleNavClick}
          >
            <BarChart3 size={20} strokeWidth={1.5} />
            {(!isCollapsed || (isMobile && isOpen)) && <span>Dashboard</span>}
          </Link>

          <Link
            to="/feed"
            className={`nav-item ${isActive('/feed') ? 'active' : ''}`}
            title="Feed"
            onClick={handleNavClick}
          >
            <Rss size={20} strokeWidth={1.5} />
            {(!isCollapsed || (isMobile && isOpen)) && <span>Feed</span>}
          </Link>

          <Link
            to="/marketplace"
            className={`nav-item ${isActive('/marketplace') ? 'active' : ''}`}
            title="Marketplace"
            onClick={handleNavClick}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {(!isCollapsed || (isMobile && isOpen)) && <span>Marketplace</span>}
          </Link>

          <Link
            to="/create"
            className={`nav-item ${isActive('/create') ? 'active' : ''}`}
            title="Create Dataset"
            onClick={handleNavClick}
          >
            <Plus size={20} strokeWidth={1.5} />
            {(!isCollapsed || (isMobile && isOpen)) && <span>Create Dataset</span>}
          </Link>

          <Link
            to="/my-datasets"
            className={`nav-item ${isActive('/my-datasets') ? 'active' : ''}`}
            title="My Datasets"
            onClick={handleNavClick}
          >
            <Folder size={20} strokeWidth={1.5} />
            {(!isCollapsed || (isMobile && isOpen)) && <span>My Datasets</span>}
          </Link>

          <Link
            to="/faucet"
            className={`nav-item ${isActive('/faucet') ? 'active' : ''}`}
            title="Faucet"
            onClick={handleNavClick}
          >
            <Droplet size={20} strokeWidth={1.5} />
            {(!isCollapsed || (isMobile && isOpen)) && <span>Faucet</span>}
          </Link>

          <div className="nav-item community-data-item" title="Community">
            <Users size={20} strokeWidth={1.5} />
            {(!isCollapsed || (isMobile && isOpen)) && <span>Community</span>}
            {(!isCollapsed || (isMobile && isOpen)) && <span className="coming-soon-badge">Coming Soon</span>}
          </div>
        </nav>

        {(!isCollapsed || (isMobile && isOpen)) && (
          <div className="sidebar-footer">
            <div className="wallet-info">
              <span className="wallet-label">Network</span>
              <span className="wallet-network">Base Sepolia</span>
            </div>
            <button
              className="add-network-btn"
              onClick={addBaseSepoliaNetwork}
              type="button"
            >
              Add Base Sepolia
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Rss, ShoppingBag, Plus, Folder, Droplet, Users } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => location.pathname === path;

  async function addBaseSepoliaNetwork(): Promise<void> {
    try {
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img
            src="https://pbs.twimg.com/profile_images/1977080620548255745/uoo-Vir5_400x400.jpg"
            alt="MYRAD Logo"
            className="logo-image"
          />
          <span className="logo-text">MYRAD</span>
        </div>
        <div className="beta-badge">BETA</div>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/dashboard"
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <BarChart3 size={20} strokeWidth={1.5} />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/feed"
          className={`nav-item ${isActive('/feed') ? 'active' : ''}`}
        >
          <Rss size={20} strokeWidth={1.5} />
          <span>Feed</span>
        </Link>

        <Link
          to="/marketplace"
          className={`nav-item ${isActive('/marketplace') ? 'active' : ''}`}
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
          <span>Marketplace</span>
        </Link>

        <Link
          to="/create"
          className={`nav-item ${isActive('/create') ? 'active' : ''}`}
        >
          <Plus size={20} strokeWidth={1.5} />
          <span>Create Dataset</span>
        </Link>

        <Link
          to="/my-datasets"
          className={`nav-item ${isActive('/my-datasets') ? 'active' : ''}`}
        >
          <Folder size={20} strokeWidth={1.5} />
          <span>My Datasets</span>
        </Link>

        <Link
          to="/faucet"
          className={`nav-item ${isActive('/faucet') ? 'active' : ''}`}
        >
          <Droplet size={20} strokeWidth={1.5} />
          <span>Faucet</span>
        </Link>

        <div className="nav-item community-data-item">
          <Users size={20} strokeWidth={1.5} />
          <span>Community</span>
          <span className="coming-soon-badge">Coming Soon</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="wallet-info">
          <div className="wallet-label">Network</div>
          <div className="wallet-network">Base Sepolia</div>
        </div>
        <button
          className="add-network-btn"
          onClick={addBaseSepoliaNetwork}
          type="button"
        >
          Add Base Sepolia
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

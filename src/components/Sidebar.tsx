import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  async function addBaseSepoliaNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x14a34', // 84532 in decimal
        chainName: 'Base Sepolia',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://sepolia.base.org'],
        blockExplorerUrls: ['https://sepolia-explorer.base.org']
      }]
    });
    console.log('✅ Base Sepolia network added successfully');
    alert('Base Sepolia network added successfully!');
  } catch (error) {
    console.error('❌ Error adding network:', error);
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
          <i className="icon">📊</i>
          <span>Dashboard</span>
        </Link>

        <Link 
          to="/marketplace" 
          className={`nav-item ${isActive('/marketplace') ? 'active' : ''}`}
        >
          <i className="icon">🏪</i>
          <span>Marketplace</span>
        </Link>

        <Link 
          to="/create" 
          className={`nav-item ${isActive('/create') ? 'active' : ''}`}
        >
          <i className="icon">➕</i>
          <span>Create Dataset</span>
        </Link>

        <Link 
          to="/my-datasets" 
          className={`nav-item ${isActive('/my-datasets') ? 'active' : ''}`}
        >
          <i className="icon">📁</i>
          <span>My Datasets</span>
        </Link>

        <Link 
          to="/faucet" 
          className={`nav-item ${isActive('/faucet') ? 'active' : ''}`}
        >
          <i className="icon">💧</i>
          <span>Faucet</span>
        </Link>

        <div className="nav-item community-data-item">
          <i className="icon">👥</i>
          <span>Community Data</span>
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
  >
    Add Base Sepolia
  </button>
</div>

    </aside>
  );
};

export default Sidebar;


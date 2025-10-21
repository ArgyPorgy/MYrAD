import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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

        <div className="nav-divider"></div>

        <Link 
          to="/settings" 
          className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
        >
          <i className="icon">⚙️</i>
          <span>Settings</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="wallet-info">
          <div className="wallet-label">Network</div>
          <div className="wallet-network">Base Sepolia</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;


import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './DashboardPage.css';

const DashboardPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();

  return (
    <div className="app-layout">
      <Sidebar />
      
      <main className="main-content">
        <Header 
          userAddress={userAddress}
          connected={connected}
          onConnect={(provider) => connectWallet(provider)}
          onDisconnect={disconnectWallet}
        />

        <div className="page-container">
          <div className="page-header">
            <div>
              <h2 className="page-subtitle">Dashboard</h2>
              <p className="page-description">
                Overview of your activity and analytics
              </p>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card large">
              <h3 className="card-title">Portfolio Value</h3>
              <div className="card-value">$0.00</div>
              <div className="card-change positive">+0.00%</div>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Datasets Owned</h3>
              <div className="card-value">0</div>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Total Trades</h3>
              <div className="card-value">0</div>
            </div>

            <div className="dashboard-card">
              <h3 className="card-title">Total Volume</h3>
              <div className="card-value">$0.00</div>
            </div>
          </div>

          <div className="activity-section">
            <h3 className="section-title">Recent Activity</h3>
            <div className="activity-list">
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No activity yet</h3>
                <p>Your trading activity will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;


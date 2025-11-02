import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getApiUrl } from '@/config/api';
import './DashboardPage.css';

interface UserDataset {
  tokenAddress: string;
  type: 'created' | 'bought';
}

const DashboardPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [datasetsOwned, setDatasetsOwned] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && userAddress) {
      loadDashboardData();
    } else {
      setDatasetsOwned(0);
      setTotalTrades(0);
      setLoading(false);
    }
  }, [connected, userAddress]);

  const loadDashboardData = async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/my-datasets/${userAddress}`));
      
      if (response.ok) {
        const data = await response.json();
        // Handle both old format (array) and new format (object with datasets and tradeCount)
        const datasets: UserDataset[] = Array.isArray(data) ? data : (data.datasets || []);
        
        // Count unique datasets owned (both created and bought)
        const uniqueTokens = new Set(
          datasets.map(d => d.tokenAddress.toLowerCase())
        );
        setDatasetsOwned(uniqueTokens.size);
        
        // Use tradeCount from API if available, otherwise fallback to counting bought entries
        const tradeCount = data.tradeCount !== undefined ? data.tradeCount : datasets.filter(d => d.type === 'bought').length;
        setTotalTrades(tradeCount);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

          {!connected ? (
            <div className="dashboard-connect-prompt">
              <div className="connect-icon">🔌</div>
              <h3>Connect Your Wallet</h3>
              <p>Please connect your wallet to view your dashboard</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3 className="card-title">Datasets Owned</h3>
                <div className="card-value">
                  {loading ? '...' : datasetsOwned}
                </div>
                <p className="card-description">Unique datasets you own</p>
              </div>

              <div className="dashboard-card">
                <h3 className="card-title">Total Trades</h3>
                <div className="card-value">
                  {loading ? '...' : totalTrades}
                </div>
                <p className="card-description">Number of buy transactions</p>
              </div>
            </div>
          )}

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


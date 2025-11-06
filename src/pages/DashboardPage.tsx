import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getApiUrl } from '@/config/api';
import { Activity, TrendingUp, Wallet } from 'lucide-react';
import './DashboardPage.css';

interface UserDataset {
  tokenAddress: string;
  type: 'created' | 'bought';
}

const DashboardPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [datasetsOwned, setDatasetsOwned] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [displayedDatasets, setDisplayedDatasets] = useState(0);
  const [displayedTrades, setDisplayedTrades] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cardHovered, setCardHovered] = useState<string | null>(null);
  const counterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (connected && userAddress) {
      loadDashboardData();
    } else {
      setDatasetsOwned(0);
      setTotalTrades(0);
      setDisplayedDatasets(0);
      setDisplayedTrades(0);
      setLoading(false);
    }
  }, [connected, userAddress]);

  // Counter animation effect
  useEffect(() => {
    if (loading) return;

    if (counterIntervalRef.current) {
      clearInterval(counterIntervalRef.current);
    }

    const animationDuration = 800;
    const steps = 30;
    const datasetsDiff = datasetsOwned - displayedDatasets;
    const tradesDiff = totalTrades - displayedTrades;
    let currentStep = 0;

    counterIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      if (datasetsDiff !== 0) {
        setDisplayedDatasets(
          Math.floor(displayedDatasets + datasetsDiff * progress)
        );
      }

      if (tradesDiff !== 0) {
        setDisplayedTrades(
          Math.floor(displayedTrades + tradesDiff * progress)
        );
      }

      if (currentStep >= steps) {
        clearInterval(counterIntervalRef.current!);
        setDisplayedDatasets(datasetsOwned);
        setDisplayedTrades(totalTrades);
      }
    }, animationDuration / steps);

    return () => {
      if (counterIntervalRef.current) {
        clearInterval(counterIntervalRef.current);
      }
    };
  }, [datasetsOwned, totalTrades, loading, displayedDatasets, displayedTrades]);

  const loadDashboardData = async () => {
    if (!userAddress) return;

    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/my-datasets/${userAddress}`));

      if (response.ok) {
        const data = await response.json();
        const datasets: UserDataset[] = Array.isArray(data)
          ? data
          : data.datasets || [];

        const uniqueTokens = new Set(
          datasets.map((d) => d.tokenAddress.toLowerCase())
        );
        setDatasetsOwned(uniqueTokens.size);

        const purchasedCount = datasets.filter((d) => d.type === 'bought').length;
        setTotalTrades(
          data.tradeCount !== undefined ? data.tradeCount : purchasedCount
        );
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
          <div className="dashboard-content">
            <div className="page-header">
              <h1 className="page-title">Dashboard</h1>
              <p className="page-description">
                Overview of your activity and analytics
              </p>
            </div>

            {!connected ? (
              <div
                className="dashboard-connect-prompt"
                role="button"
                tabIndex={0}
                onClick={() => connectWallet('injected')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    connectWallet('injected');
                  }
                }}
              >
                <div className="connect-icon">
                  <Wallet size={48} strokeWidth={1.5} />
                </div>
                <h3>Connect Your Wallet</h3>
                <p>
                  Please connect your wallet to view your dashboard and start
                  trading datasets
                </p>
              </div>
            ) : (
              <>
                <div className="dashboard-grid">
                  <div
                    className="dashboard-card"
                    onMouseEnter={() => setCardHovered('datasets')}
                    onMouseLeave={() => setCardHovered(null)}
                  >
                    <div className="card-header">
                      <h3 className="card-title">Datasets Owned</h3>
                      <div className="card-icon">
                        <TrendingUp size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="card-value">
                      {loading ? (
                        <span className="skeleton-loader">...</span>
                      ) : (
                        displayedDatasets
                      )}
                    </div>
                    <p className="card-description">
                      Unique datasets in your portfolio
                    </p>
                    <div className="card-footer">
                      <span className="stat-badge">Active</span>
                    </div>
                  </div>

                  <div
                    className="dashboard-card"
                    onMouseEnter={() => setCardHovered('trades')}
                    onMouseLeave={() => setCardHovered(null)}
                  >
                    <div className="card-header">
                      <h3 className="card-title">Total Trades</h3>
                      <div className="card-icon">
                        <Activity size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="card-value">
                      {loading ? (
                        <span className="skeleton-loader">...</span>
                      ) : (
                        displayedTrades
                      )}
                    </div>
                    <p className="card-description">
                      Purchased datasets acquired
                    </p>
                    <div className="card-footer">
                      <span className="stat-badge">Transactions</span>
                    </div>
                  </div>
                </div>

                <div className="activity-section">
                  <div className="section-header">
                    <h2 className="section-title">Recent Activity</h2>
                  </div>
                  <div className="activity-list">
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Activity size={64} strokeWidth={1.5} />
                      </div>
                      <h3>No activity yet</h3>
                      <p>
                        Your trading activity and transactions will appear here
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getApiUrl } from '@/config/api';
import { Activity, Wallet, Database, Users } from 'lucide-react';
import CustomLoader from '@/components/CustomLoader';
import './DashboardPage.css';

const DashboardPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();

  // Updated Global stats
  const [globalTrades, setGlobalTrades] = useState<number | null>(null);
const [globalDatacoins, setGlobalDatacoins] = useState<number | null>(null);
const [globalUsers, setGlobalUsers] = useState<number | null>(null);


  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && userAddress) {
      loadGlobalStats();
    } else {
      setLoading(false);
    }
  }, [connected, userAddress]);

  const loadGlobalStats = async () => {
    try {
      const datacoinRes = await fetch(getApiUrl(`/api/datacoin/total-created`));
      const usersRes = await fetch(getApiUrl(`/api/users/total`));
      const tradesRes = await fetch(getApiUrl(`/api/datacoin/total-transactions`));

if (datacoinRes.ok) {
  const data = await datacoinRes.json();
  console.log("DATACOIN RESPONSE:", data);   
  setGlobalDatacoins(Number(data.totalCreated) || 0);
}


      if (usersRes.ok) {
        const users = await usersRes.json();
        setGlobalUsers(users.totalUsers || 0);
      }

      if (tradesRes.ok) {
        const trades = await tradesRes.json();
        if (typeof trades.totalTx === "number") {
          setGlobalTrades(trades.totalTx);
        }

      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading global stats:", err);
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
                Overview of your activity and global analytics
              </p>
            </div>

            {!connected ? (
              <div
                className="dashboard-connect-prompt"
                role="button"
                tabIndex={0}
                onClick={() => connectWallet()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') connectWallet();
                }}
              >
                <div className="connect-icon">
                  <Wallet size={48} strokeWidth={1.5} />
                </div>
                <h3>Connect Your Wallet</h3>
                <p>Please connect your wallet to view your dashboard</p>
              </div>
            ) : loading ? (
              <div className="dashboard-loading-container">
                <CustomLoader />
                <p className="loading-message">Loading your dashboard...</p>
              </div>
            ) : (
              <>
                <h2 className="section-title" style={{ marginTop: '20px' }}>
                  Platform Analytics
                </h2>

                <div className="dashboard-grid">

                  {/* Global Trades */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3 className="card-title">Total Trades (Global)</h3>
                      <div className="card-icon">
                        <Activity size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="card-value">
  {!globalTrades ? "Loading..." : globalTrades}
                    </div>
                    <p className="card-description">All trades on the platform</p>
                  </div>

                  {/* DataCoins Created */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3 className="card-title">DataCoins Created</h3>
                      <div className="card-icon">
                        <Database size={20} strokeWidth={1.5} />
                      </div>
                    </div>
<div className="card-value">
  {globalDatacoins === null ? "Loading..." : globalDatacoins}
</div>
                    <p className="card-description">Total DataCoins minted</p>
                  </div>

                  {/* Total Users */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3 className="card-title">Total Users</h3>
                      <div className="card-icon">
                        <Users size={20} strokeWidth={1.5} />
                      </div>
                    </div>
<div className="card-value">
  {globalUsers === null ? "Loading..." : globalUsers}
</div>
                    <p className="card-description">Registered platform users</p>
                  </div>
                </div>

                <div className="activity-section">
                  <div className="section-header">
                    <h2 className="section-title">Recent Activity</h2>
                  </div>
                  <div className="activity-list">
                    <div className="empty-state">
                      <h3>No activity yet</h3>
                      <p>Available On Mainnet</p>
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

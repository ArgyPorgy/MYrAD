import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getApiUrl } from '@/config/api';
import {
  Wallet,
  User,
  Activity
} from 'lucide-react';
import CustomLoader from '@/components/CustomLoader';
import './DashboardPage.css'; // Reuse same styling

interface UserDataset {
  tokenAddress: string;
  type: 'created' | 'bought';
}

const ProfilePage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    address: '',
    joined: '',
    totalTrades: 0,
    totalDatasets: 0,
  });

  useEffect(() => {
    if (connected && userAddress) {
      loadProfileDetails();
    } else {
      setLoading(false);
    }
  }, [connected, userAddress]);

  const loadProfileDetails = async () => {
    if (!userAddress) return;

    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/my-datasets/${userAddress}`));

      if (response.ok) {
        const data = await response.json();

        const datasets: UserDataset[] = Array.isArray(data)
          ? data
          : data.datasets || [];

        const tradeTotal =
          data.tradeCount !== undefined
            ? data.tradeCount
            : datasets.filter((d) => d.type === 'bought').length;

        setProfileData({
          address: userAddress,
          joined: data?.joinedDate || 'Not Available',
          totalTrades: tradeTotal,
          totalDatasets: datasets.length,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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
              <h1 className="page-title">Profile</h1>
              <p className="page-description">
                Your identity and analytics overview
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
                <p>Connect your wallet to view your profile</p>
              </div>
            ) : loading ? (
              <div className="dashboard-loading-container">
                <CustomLoader />
                <p className="loading-message">Loading your profile...</p>
              </div>
            ) : (
              <>
                {/* Cards Section */}
                <div className="dashboard-grid">

                  {/* Wallet Address */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3 className="card-title">Wallet Address</h3>
                      <div className="card-icon">
                        <User size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="card-value small-text">
                      {profileData.address.substring(0, 6)}...
                      {profileData.address.slice(-4)}
                    </div>
                    <p className="card-description">Your connected wallet</p>
                    <div className="card-footer">
                      <span className="stat-badge">Verified</span>
                    </div>
                  </div>

                  {/* Total Datasets */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3 className="card-title">Total Datasets</h3>
                      <div className="card-icon">
                        <Activity size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="card-value">{profileData.totalDatasets}</div>
                    <p className="card-description">Created + Purchased</p>
                    <div className="card-footer">
                      <span className="stat-badge">Datasets</span>
                    </div>
                  </div>

                  {/* Total Trades */}
                  <div className="dashboard-card">
                    <div className="card-header">
                      <h3 className="card-title">Total Trades</h3>
                      <div className="card-icon">
                        <Activity size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="card-value">{profileData.totalTrades}</div>
                    <p className="card-description">Total transactions made</p>
                    <div className="card-footer">
                      <span className="stat-badge">Trades</span>
                    </div>
                  </div>
                </div>

                {/* Activity Section */}
                <div className="activity-section">
                  <div className="section-header">
                    <h2 className="section-title">Profile Activity</h2>
                  </div>

                  <div className="activity-list">
                    <div className="empty-state">
                      <h3>No recent updates</h3>
                      <p>Chart Available On Mainnet</p>
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

export default ProfilePage;

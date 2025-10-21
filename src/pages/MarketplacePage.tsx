import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DatasetCard from '@/components/DatasetCard';
import { DatasetsMap } from '@/types/web3';
import './MarketplacePage.css';

const MarketplacePage = () => {
  const { provider, signer, userAddress, connected, status, setStatus, connectWallet, disconnectWallet } = useWeb3();
  const [datasets, setDatasets] = useState<DatasetsMap>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/datasets");
      const data = await resp.json();
      setDatasets(data);
    } catch (err) {
      console.error("Error loading datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  const datasetEntries = Object.entries(datasets).filter(([_, meta]) =>
    searchQuery === '' || 
    meta.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meta.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h2 className="page-subtitle">Explore Data</h2>
              <p className="page-description">
                Discover and trade tokenized datasets on the blockchain
              </p>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Datasets</div>
              <div className="stat-value">{datasetEntries.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Volume</div>
              <div className="stat-value">$12.5K</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Traders</div>
              <div className="stat-value">234</div>
            </div>
          </div>

          <div className="datasets-section">
            <h3 className="section-title">All Datasets</h3>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading datasets...</p>
              </div>
            ) : datasetEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>No datasets found</h3>
                <p>Be the first to create a dataset on MYRAD</p>
              </div>
            ) : (
              <div className="datasets-grid">
                {datasetEntries.map(([tokenAddr, meta]) => (
                  <DatasetCard
                    key={tokenAddr}
                    tokenAddress={tokenAddr}
                    dataset={meta}
                    provider={provider}
                    signer={signer}
                    userAddress={userAddress}
                    connected={connected}
                    onStatusChange={setStatus}
                    onRefresh={loadDatasets}
                  />
                ))}
              </div>
            )}
          </div>

          {status && (
            <div className="status-toast">{status}</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;


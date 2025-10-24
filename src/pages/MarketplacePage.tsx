import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DatasetsMap } from '@/types/web3';
import { getApiUrl } from '@/config/api';
import './MarketplacePage.css';

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [datasets, setDatasets] = useState<DatasetsMap>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl("/datasets"));
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

  const handleTokenClick = (tokenAddress: string) => {
    navigate(`/token/${tokenAddress}`);
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

        <div className="marketplace-page">
          <div className="marketplace-container">
            {/* Header */}
            <div className="marketplace-header">
              <h1 className="marketplace-title">Explore Market</h1>
            </div>

            {/* Search and Filters */}
            <div className="marketplace-controls">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, symbol, or locking"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <select className="filter-dropdown">
                <option>Select Chain</option>
                <option>Base Sepolia</option>
              </select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading datasets...</p>
              </div>
            ) : datasetEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3 className="empty-title">No datasets found</h3>
                <p className="empty-description">Be the first to create a dataset on MYRAD</p>
              </div>
            ) : (
              /* Table View */
              <table className="tokens-table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Coin</th>
                    <th>Symbol</th>
                    <th>Locking Asset</th>
                    <th>Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {datasetEntries.map(([tokenAddr, meta]) => (
                    <tr key={tokenAddr} onClick={() => handleTokenClick(tokenAddr)}>
                      <td>
                        <div className="token-logo">
                          {meta.symbol.charAt(0)}
                        </div>
                      </td>
                      <td>
                        <div className="token-name">{meta.name || meta.symbol}</div>
                      </td>
                      <td className="token-symbol">{meta.symbol}</td>
                      <td className="supply-cell">USDC</td>
                      <td>
                        <div className="chain-badge">
                          <img 
                            src="https://pbs.twimg.com/profile_images/1945608199500910592/rnk6ixxH_400x400.jpg" 
                            alt="Base" 
                            className="chain-logo"
                          />
                          Base
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;


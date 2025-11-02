import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DatasetsMap } from '@/types/web3';
import { getApiUrl } from '@/config/api';
import './FeedPage.css';

const FeedPage = () => {
  const navigate = useNavigate();
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [datasets, setDatasets] = useState<DatasetsMap>({});
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const randomImages = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    'https://images.unsplash.com/photo-1503264116251-35a269479413',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b'
  ];

  useEffect(() => {
    loadLocalDatasets();
  }, []);

  const loadLocalDatasets = async () => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl("/datasets"));
      const data = await resp.json();
      setDatasets(data);
    } catch (err) {
      console.error('Error loading local datasets:', err);
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

  const handleLike = (tokenAddr: string) => {
    setLikes((prev) => ({
      ...prev,
      [tokenAddr]: (prev[tokenAddr] || 0) + 1
    }));
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

        <div className="feed-page">
          <div className="feed-container">
            <div className="feed-header">
              <h1 className="feed-title">Data Feed</h1>
            </div>

            <div className="feed-controls">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search datasets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading data feed...</p>
              </div>
            ) : datasetEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3 className="empty-title">No datasets available</h3>
              </div>
            ) : (
              <div className="dataset-grid">
                {datasetEntries.map(([tokenAddr, meta], index) => {
                  const imageUrl = randomImages[index % randomImages.length];
                  return (
                    <div key={tokenAddr} className="dataset-card">
                      <img
                        src={imageUrl}
                        alt={meta.name}
                        className="dataset-image"
                        onClick={() => handleTokenClick(tokenAddr)}
                      />



                      <div className="dataset-info" onClick={() => handleTokenClick(tokenAddr)}>
                        <h3 className="dataset-name">{meta.name || meta.symbol}</h3>
                        <p className="dataset-symbol">{meta.symbol}</p>
                          <p className="dataset-description">
    {meta.description ? meta.description.slice(0, 80) + (meta.description.length > 80 ? "..." : "") : "No description available"}
  </p>
                        <p className="dataset-chain">
                          <img
                            src="https://pbs.twimg.com/profile_images/1945608199500910592/rnk6ixxH_400x400.jpg"
                            alt="Base"
                            className="chain-logo"
                          />
                          Base
                        </p>
                      </div>

                      {/* ❤️ Like Section */}
                      <div className="like-section" onClick={() => handleLike(tokenAddr)}>
                        <span className="like-icon">❤️</span>
                        <span className="like-count">{likes[tokenAddr] || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeedPage;

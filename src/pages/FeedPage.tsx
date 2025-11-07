import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DatasetsMap } from '@/types/web3';
import { getApiUrl } from '@/config/api';
import { Search, Heart } from 'lucide-react';
import CustomLoader from '@/components/CustomLoader';
import './FeedPage.css';

const FeedPage = () => {
  const navigate = useNavigate();
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [datasets, setDatasets] = useState<DatasetsMap>({});
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setCardHovered] = useState<string | null>(null);

  const randomImages = [
    'https://images.unsplash.com/photo-1644088379091-d574269d422f',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
    'https://images.unsplash.com/photo-1510906594845-bc082582c8cc',
    'https://images.unsplash.com/photo-1563089145-599997674d42',
    'https://images.unsplash.com/photo-1568952433726-3896e3881c65',
    'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107',
    'https://images.unsplash.com/photo-1683064325134-3acfdef9c6d7',
    'https://images.unsplash.com/photo-1557264337-e8a93017fe92',
    'https://images.unsplash.com/photo-1597733336794-12d05021d510',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    'https://images.unsplash.com/photo-1454779132693-e5cd0a216ed3',
    'https://images.unsplash.com/photo-1480506132288-68f7705954bd',
    'https://images.unsplash.com/photo-1713557112617-e12d67bddc3a',
    'https://images.unsplash.com/photo-1643228995868-bf698f67d053',
    'https://images.unsplash.com/photo-1672307613484-3254a04651fd',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd',
    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f',
    'https://images.unsplash.com/photo-1705526828940-3e5e7f113e2c',
    'https://images.unsplash.com/photo-1707075891545-41b982930351',
    'https://images.unsplash.com/photo-1762279389042-9439bfb6c155',
    'https://images.unsplash.com/photo-1762278804771-65c446b6acdb',
    'https://images.unsplash.com/photo-1753692400335-88e37779b471',
    'https://images.unsplash.com/photo-1760539165482-c0c83b052065',
    'https://images.unsplash.com/photo-1758073519996-6d3c63b4922c'
  ];

  useEffect(() => {
    loadLocalDatasets();
  }, []);

  const loadLocalDatasets = async () => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl('/datasets'));
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

  const handleLike = (e: React.MouseEvent, tokenAddr: string) => {
    e.stopPropagation();
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

        <div className="page-container">
          <div className="feed-content">
            <div className="page-header">
              <h1 className="page-title">Data Feed</h1>
              <p className="page-description">
                Explore available datasets and discover new opportunities
              </p>
            </div>

            <div className="search-wrapper">
              <div className="search-box">
                <Search size={18} className="search-icon" strokeWidth={1.5} />
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
                <CustomLoader />
                <p className="loading-text">Loading data feed...</p>
              </div>
            ) : datasetEntries.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-title">No datasets available</h3>
                <p className="empty-description">
                  Try adjusting your search or check back later
                </p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {datasetEntries.map(([tokenAddr, meta], index) => {
                  const imageUrl = randomImages[index % randomImages.length];
                  return (
                    <div
                      key={tokenAddr}
                      className="dashboard-card dataset-card"
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => setCardHovered(tokenAddr)}
                      onMouseLeave={() => setCardHovered(null)}
                      onClick={() => handleTokenClick(tokenAddr)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleTokenClick(tokenAddr);
                        }
                      }}
                    >
                      <div className="dataset-image-container">
                        <img
                          src={imageUrl}
                          alt={meta.name}
                          className="dataset-image"
                        />
                      </div>

                      <div className="card-header">
                        <h3 className="card-title">{meta.symbol}</h3>
                      </div>

                      <div className="card-value">{meta.name || meta.symbol}</div>

                      <p className="card-description">
                        {meta.description
                          ? meta.description.slice(0, 60) +
                            (meta.description.length > 60 ? '...' : '')
                          : 'No description available'}
                      </p>

                      <div className="card-footer">
                        <div className="chain-info">
                          <img
                            src="https://pbs.twimg.com/profile_images/1945608199500910592/rnk6ixxH_400x400.jpg"
                            alt="Base"
                            className="chain-logo"
                          />
                          <span className="chain-name">Base</span>
                        </div>
                        <button
                          className="like-button"
                          onClick={(e) => handleLike(e, tokenAddr)}
                          aria-label="Like dataset"
                        >
                          <Heart
                            size={16}
                            strokeWidth={1.5}
                            fill={likes[tokenAddr] ? 'currentColor' : 'none'}
                          />
                          <span>{likes[tokenAddr] || 0}</span>
                        </button>
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

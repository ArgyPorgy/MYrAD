import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DatasetsMap } from '@/types/web3';
import { getApiUrl } from '@/config/api';
import { Search, Heart } from 'lucide-react';
import CustomLoader from '@/components/CustomLoader';
import SEO from '@/components/SEO';
import './FeedPage.css';

const FeedPage = () => {
  const navigate = useNavigate();
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [datasets, setDatasets] = useState<DatasetsMap>({});
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setCardHovered] = useState<string | null>(null);

  // Hardcoded custom images from /public/images (no external links)
  // Filenames suggested below — drop matching SVGs into public/images
  const customImages: Record<string, string> = {
    // Core datasets
    DRP: '/images/dollar-exchange.svg', // Dollar Exchange Rate Prediction
    F1K: '/images/fortune-1000.svg', // Fortune 1000 Data
    HP: '/images/house-prices.svg', // House Prices
    GLD: '/images/nse-gold-cpi.svg', // NSE Gold CPI
    POKE: '/images/pokemon.svg', // Pokemon Dataset
    POP: '/images/population.svg', // Population datasets (2010-2019, 2020-2029)

    // Additional datasets
    CRP: '/images/car-prices.svg', // Car Prices
    BSD: '/images/big-sales.svg', // Big Sales Data
    ADL: '/images/airlines-delay.svg', // Airlines Delay Dataset
    GGL: '/images/google-stock.svg', // Google Stock Data
    APPL: '/images/apple-stock.svg', // Apple Stock Data
    AD: '/images/amazon-stock.svg', // Amazon Stock Data
    USB: '/images/us-shopping.svg', // US Shopping Behaviour
    HSF: '/images/hotels-sf.svg', // Hotels in San Fransisco
    FSA: '/images/financial-planners-sa.svg', // Financial Planners in SA
    CLA: '/images/coffee-shops-la.svg', // Coffee Shops in LA
    RUS: '/images/restaurants-us.svg', // Restaurants in US
    MCD: '/images/maharastra-corp.svg', // Maharastra Corporate Data
    EPT: '/images/event-planners-texas.svg', // Event Planners in Texas
     // NOICE drop allocated wallets
  };

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

  // Get allowed symbols from customImages
  const allowedSymbols = new Set(Object.keys(customImages));

  const datasetEntries = Object.entries(datasets).filter(([_, meta]) => {
    // Only show datasets whose symbol is in customImages
    const symbol = meta.symbol?.toUpperCase?.() ?? '';
    if (!allowedSymbols.has(symbol)) {
      return false;
    }
    
    // Apply search filter if query exists
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    const symbolLower = meta.symbol?.toLowerCase?.() ?? '';
    const name = meta.name?.toLowerCase?.() ?? '';
    return symbolLower.includes(query) || name.includes(query);
  });

  const handleTokenClick = (tokenAddress: string) => {
    navigate(`/token/${tokenAddress}`);
  };

  const handleLike = (e: React.MouseEvent, tokenAddr: string) => {
    e.stopPropagation();
    setLikes((prev) => ({
      ...prev,
      [tokenAddr]: (prev[tokenAddr] || 0) + 1,
    }));
  };

  return (
    <div className="app-layout">
      <SEO
        title="Data Feed"
        description="Explore and discover available datasets on MYrAD. Browse tokenized datasets, search by name or symbol, and find new data opportunities on the decentralized marketplace."
        keywords="data feed, datasets, browse datasets, tokenized data, data discovery, dataset search"
        canonicalUrl="https://myradhq.xyz/feed"
      />
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
                {datasetEntries.map(([tokenAddr, meta]) => {
                  // Prefer mapping by token address (stable) if you later add addresses to the map
                  const imageUrl = customImages[tokenAddr] || customImages[meta.symbol] || '/images/default-dataset.svg';

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
                        <img src={imageUrl} alt={meta.name} className="dataset-image" />
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
                            src="/images/base-logo.svg"
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

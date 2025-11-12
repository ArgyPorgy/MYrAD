import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomLoader from '@/components/CustomLoader';
import { DatasetsMap, Dataset } from '@/types/web3';
import { getApiUrl } from '@/config/api';
import { Search, Copy, Check } from 'lucide-react';
import './MarketplacePage.css';


const MarketplacePage = () => {
  const navigate = useNavigate();
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const [datasets, setDatasets] = useState<DatasetsMap>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<string | null>(null);


  useEffect(() => {
    loadDatasets();
  }, []);


  const copyToClipboard = async (text: string, identifier: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(identifier);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };


  const loadDatasets = async () => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl('/datasets'));
      const data = await resp.json();
      setDatasets(data);


      const entries = Object.entries(data) as [string, Dataset][];
      const priceResults: Record<string, number> = {};


      await Promise.all(
        entries.map(async ([tokenAddr, meta]) => {
          const marketplaceAddr =
            meta.marketplace || meta.marketplace_address || meta.bonding_curve;
          if (!marketplaceAddr) return;


          try {
            const resp = await fetch(getApiUrl(`/price/${marketplaceAddr}/${tokenAddr}`));
            if (!resp.ok) return;
            const j = await resp.json();
            const p = parseFloat(j.price);
            if (!isNaN(p)) priceResults[tokenAddr] = p;
          } catch { }
        })
      );


      setPrices(priceResults);
    } catch (err) {
      console.error('Error loading datasets:', err);
    } finally {
      setLoading(false);
    }
  };


  const datasetEntries = (Object.entries(datasets) as [string, Dataset][]).filter(
    ([tokenAddr, meta]) =>
      searchQuery === '' ||
      meta.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.creator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tokenAddr.toLowerCase().includes(searchQuery.toLowerCase())
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


        <div className="page-container">
          <div className="marketplace-content">
            <div className="page-header">
              <h1 className="page-title">Data Tokens Marketplace</h1>
              <p className="page-description">
                Explore and trade available data tokens across the network
              </p>
            </div>


            <div className="search-wrapper">
              <div className="search-box">
                <Search size={18} className="search-icon" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search by token name, symbol, creator, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>


            {loading ? (
              <div className="marketplace-loading-container">
                <CustomLoader />
                <p className="loading-message">Loading marketplace...</p>
              </div>
            ) : datasetEntries.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-title">
                  {searchQuery ? 'No matching tokens found' : 'No tokens available'}
                </h3>
                <p className="empty-description">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Check back later for new data tokens'}
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="tokens-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Total Supply</th>
                      <th>Market Cap</th>
                      <th>Creator</th>
                      <th>Token Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetEntries.map(([tokenAddr, meta], index) => {
                      const marketCap =
                        prices[tokenAddr] && meta.total_supply
                          ? prices[tokenAddr] * meta.total_supply
                          : null;


                      return (
                        <tr
                          key={tokenAddr}
                          className="token-row"
                          style={{ animationDelay: `${index * 0.05}s` }}
                          onClick={() => handleTokenClick(tokenAddr)}
                        >
                          <td data-label="Token">
                            <div className="token-cell">
                              <div className="token-logo">
                                {meta.symbol.charAt(0).toUpperCase()}
                              </div>
                              <div className="token-info">
                                <div className="token-name">{meta.name || meta.symbol}</div>
                                <div className="token-symbol">{meta.symbol}</div>
                              </div>
                            </div>
                          </td>


                          <td data-label="Total Supply" className="supply-cell">
                            {meta.total_supply?.toLocaleString() || '—'}
                          </td>


                          <td data-label="Market Cap" className="mcap-cell">
                            {marketCap
                              ? marketCap.toLocaleString(undefined, {
                                  maximumFractionDigits: 2
                                })
                              : '—'}
                          </td>


                          <td data-label="Creator">
                            {meta.creator ? (
                              <div
                                className="copy-field"
                                onClick={(e) => copyToClipboard(meta.creator!, `creator_${tokenAddr}`, e)}
                                style={{ cursor: 'pointer' }}
                              >
                                <span className="address-text">
                                  {meta.creator.slice(0, 6)}...{meta.creator.slice(-4)}
                                </span>
                                <button
                                  className={`copy-btn ${
                                    copied === `creator_${tokenAddr}` ? 'copied' : ''
                                  }`}
                                  onClick={(e) => copyToClipboard(meta.creator!, `creator_${tokenAddr}`, e)}
                                  aria-label="Copy creator address"
                                >
                                  {copied === `creator_${tokenAddr}` ? (
                                    <Check size={14} strokeWidth={2.5} />
                                  ) : (
                                    <Copy size={14} strokeWidth={1.5} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>


                          <td data-label="Token Address">
                            <div
                              className="copy-field"
                              onClick={(e) => copyToClipboard(tokenAddr, `token_${tokenAddr}`, e)}
                              style={{ cursor: 'pointer' }}
                            >
                              <span className="address-text">
                                {tokenAddr.slice(0, 6)}...{tokenAddr.slice(-4)}
                              </span>
                              <button
                                className={`copy-btn ${
                                  copied === `token_${tokenAddr}` ? 'copied' : ''
                                }`}
                                onClick={(e) => copyToClipboard(tokenAddr, `token_${tokenAddr}`, e)}
                                aria-label="Copy token address"
                              >
                                {copied === `token_${tokenAddr}` ? (
                                  <Check size={14} strokeWidth={2.5} />
                                ) : (
                                  <Copy size={14} strokeWidth={1.5} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};


export default MarketplacePage;

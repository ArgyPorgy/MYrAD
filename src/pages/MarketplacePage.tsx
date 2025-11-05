import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DatasetsMap, Dataset } from '@/types/web3';
import { getApiUrl } from '@/config/api';
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl("/datasets"));
      const data = await resp.json();
      setDatasets(data);

      const entries = Object.entries(data) as [string, Dataset][];
      const priceResults: Record<string, number> = {};

      await Promise.all(entries.map(async ([tokenAddr, meta]) => {
        const marketplaceAddr = meta.marketplace || meta.marketplace_address || meta.bonding_curve;
        if (!marketplaceAddr) return;

        try {
          const resp = await fetch(getApiUrl(`/price/${marketplaceAddr}/${tokenAddr}`));
          if (!resp.ok) return;
          const j = await resp.json();
          const p = parseFloat(j.price);
          if (!isNaN(p)) priceResults[tokenAddr] = p;
        } catch { }
      }));

      setPrices(priceResults);
    } catch (err) {
      console.error("Error loading datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  const datasetEntries = (Object.entries(datasets) as [string, Dataset][]).filter(([tokenAddr, meta]) =>
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

        <div className="marketplace-page">
          <div className="marketplace-container">
            <div className="marketplace-header">
              <h1 className="marketplace-title">Data Tokens</h1>
              <button className="all-coins-btn">All Tokens</button>
            </div>

            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search by token name, symbol, creator, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading datasets...</p>
              </div>
            ) : datasetEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3 className="empty-title">
                  {searchQuery ? 'No matching datasets found' : 'No datasets found'}
                </h3>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="tokens-table">
                  <thead>
                    <tr>
                      <th>TOKEN</th>
                      <th>TOTAL SUPPLY</th>
                      <th>MARKET CAP (USDC)</th>
                      <th>CREATOR</th>
                      <th>TOKEN ADDRESS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasetEntries.map(([tokenAddr, meta]) => {
                      const marketCap = prices[tokenAddr] && meta.total_supply
                        ? prices[tokenAddr] * meta.total_supply
                        : null;

                      return (
                        <tr key={tokenAddr} onClick={() => handleTokenClick(tokenAddr)}>
                          <td>
                            <div className="coin-info">
                              <div className="token-logo">
                                {meta.symbol.charAt(0)}
                              </div>
                              <div className="coin-details">
                                <div className="coin-name">{meta.name || meta.symbol}</div>
                                <div className="coin-symbol">{meta.symbol}</div>
                              </div>
                            </div>
                          </td>

                          <td>{meta.total_supply?.toLocaleString() || '—'}</td>

                          <td>{marketCap ? marketCap.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</td>

                          <td>
                            {meta.creator ? (
                              <div className="copy-field" onClick={(e) => e.stopPropagation()}>
                                <span>{meta.creator.slice(0, 6)}...{meta.creator.slice(-4)}</span>
                                <button className="copy-btn" onClick={() => meta.creator && copyToClipboard(meta.creator)}>
    {copied === tokenAddr ? '✔' : '⧉'}                                </button>
                              </div>
                            ) : '—'}
                          </td>

                          <td>
                            <div className="copy-field" onClick={(e) => e.stopPropagation()}>
                              <span>{tokenAddr.slice(0, 6)}...{tokenAddr.slice(-4)}</span>
                              <button className="copy-btn" onClick={() => tokenAddr && copyToClipboard(tokenAddr)}>
    {copied === tokenAddr ? '✔' : '⧉'}                              </button>
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

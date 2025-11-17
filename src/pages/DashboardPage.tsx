import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getApiUrl } from '@/config/api';
import { Activity, Wallet, Database, Users, RefreshCw } from 'lucide-react';
import CustomLoader from '@/components/CustomLoader';
import './DashboardPage.css';

const DashboardPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();

  // Updated Global stats
  const [globalTrades, setGlobalTrades] = useState<number | null>(null);
  const [globalDatacoins, setGlobalDatacoins] = useState<number | null>(null);
  const [globalUsers, setGlobalUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);

  // Cache key for sessionStorage
  const CACHE_KEY = 'dashboard_stats_cache';
  const REFRESHING_FLAG = 'dashboard_refreshing';

  // Load data on mount - first time only, in background
  useEffect(() => {
    if (hasLoadedRef.current) {
      // Check if a refresh was in progress when we navigated away
      const wasRefreshing = sessionStorage.getItem(REFRESHING_FLAG) === 'true';
      if (wasRefreshing) {
        // Refresh might still be in progress, poll until it completes
        setIsRefreshing(true);
        
        let pollCount = 0;
        const MAX_POLLS = 100; // Max 30 seconds (100 * 300ms)
        
        const checkRefreshStatus = () => {
          pollCount++;
          const stillRefreshing = sessionStorage.getItem(REFRESHING_FLAG) === 'true';
          
          if (!stillRefreshing) {
            // Refresh completed, update state
            setIsRefreshing(false);
            // Reload cached data in case it was updated
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) {
              try {
                const parsed = JSON.parse(cachedData);
                setGlobalTrades(parsed.trades);
                setGlobalDatacoins(parsed.datacoins);
                setGlobalUsers(parsed.users);
              } catch (err) {
                console.error("Error parsing cached data:", err);
              }
            }
          } else if (pollCount < MAX_POLLS) {
            // Still refreshing, check again in 300ms
            setTimeout(checkRefreshStatus, 300);
          } else {
            // Timeout - clear flag and stop polling (assume refresh completed or failed)
            sessionStorage.removeItem(REFRESHING_FLAG);
            setIsRefreshing(false);
          }
        };
        
        // Start polling after a short delay
        setTimeout(checkRefreshStatus, 300);
      }
      return;
    }
    
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    const wasRefreshing = sessionStorage.getItem(REFRESHING_FLAG) === 'true';

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setGlobalTrades(parsed.trades);
        setGlobalDatacoins(parsed.datacoins);
        setGlobalUsers(parsed.users);
        setLoading(false);
        hasLoadedRef.current = true;
        
        // If a refresh was in progress, poll until it completes
        if (wasRefreshing) {
          setIsRefreshing(true);
          
          let pollCount = 0;
          const MAX_POLLS = 100; // Max 30 seconds (100 * 300ms)
          
          const checkRefreshStatus = () => {
            pollCount++;
            const stillRefreshing = sessionStorage.getItem(REFRESHING_FLAG) === 'true';
            
            if (!stillRefreshing) {
              setIsRefreshing(false);
              // Reload cached data
              const updatedCache = sessionStorage.getItem(CACHE_KEY);
              if (updatedCache) {
                try {
                  const parsed = JSON.parse(updatedCache);
                  setGlobalTrades(parsed.trades);
                  setGlobalDatacoins(parsed.datacoins);
                  setGlobalUsers(parsed.users);
                } catch (err) {
                  console.error("Error parsing cached data:", err);
                }
              }
            } else if (pollCount < MAX_POLLS) {
              // Still refreshing, check again in 300ms
              setTimeout(checkRefreshStatus, 300);
            } else {
              // Timeout - clear flag and stop polling (assume refresh completed or failed)
              sessionStorage.removeItem(REFRESHING_FLAG);
              setIsRefreshing(false);
            }
          };
          
          // Start polling after a short delay
          setTimeout(checkRefreshStatus, 300);
        }
      } catch (err) {
        console.error("Error parsing cached data:", err);
        // If cache is corrupted, load fresh data
        if (connected && userAddress) {
          hasLoadedRef.current = true;
          loadGlobalStats(true); // background load
        } else {
          setLoading(false);
        }
      }
    } else {
      // No cache, load fresh data in background (first time only)
      if (connected && userAddress) {
        hasLoadedRef.current = true;
        loadGlobalStats(true); // background load
      } else {
        setLoading(false);
      }
    }
  }, []); // Only run on mount

  // Load data when wallet first connects (only if no cache exists and we haven't loaded yet)
  useEffect(() => {
    if (hasLoadedRef.current) return; // Prevent multiple loads
    
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    // Only load if no cache exists and wallet just connected
    if (!cachedData && connected && userAddress) {
      hasLoadedRef.current = true;
      loadGlobalStats(true); // background load
    }
  }, [connected, userAddress]);

  const loadGlobalStats = async (background = false) => {
    // Mark refresh as in progress in sessionStorage FIRST (before any async operations)
    if (background) {
      sessionStorage.setItem(REFRESHING_FLAG, 'true');
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Get current cached values for fallback (before fetch)
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      let currentTrades = globalTrades;
      let currentDatacoins = globalDatacoins;
      let currentUsers = globalUsers;
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          currentTrades = parsed.trades ?? currentTrades;
          currentDatacoins = parsed.datacoins ?? currentDatacoins;
          currentUsers = parsed.users ?? currentUsers;
        } catch (e) {
          // Ignore parse errors, use state values
        }
      }

      const [datacoinRes, usersRes, tradesRes] = await Promise.all([
        fetch(getApiUrl(`/api/datacoin/total-created`)),
        fetch(getApiUrl(`/api/users/total`)),
        fetch(getApiUrl(`/api/datacoin/total-transactions`))
      ]);

      let trades: number | null = null;
      let datacoins: number | null = null;
      let users: number | null = null;

      if (datacoinRes.ok) {
        const data = await datacoinRes.json();
        datacoins = Number(data.totalCreated) || 0;
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        users = usersData.totalUsers || 0;
      }

      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        if (typeof tradesData.totalTx === "number") {
          trades = tradesData.totalTx;
        }
      }

      // Cache the results (use fetched values, fallback to cached/current state)
      const finalCache = {
        trades: trades !== null ? trades : currentTrades,
        datacoins: datacoins !== null ? datacoins : currentDatacoins,
        users: users !== null ? users : currentUsers
      };

      // Always update sessionStorage (works even if component unmounts)
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(finalCache));
      
      // Clear refresh flag (works even if component unmounts)
      sessionStorage.removeItem(REFRESHING_FLAG);

      // Update state (only if component is still mounted)
      // These might fail silently if component unmounted, but that's okay
      try {
        if (trades !== null) setGlobalTrades(trades);
        if (datacoins !== null) setGlobalDatacoins(datacoins);
        if (users !== null) setGlobalUsers(users);
        setLoading(false);
        setIsRefreshing(false);
      } catch (e) {
        // Component might be unmounted, ignore state update errors
      }
    } catch (err) {
      console.error("Error loading global stats:", err);
      // Clear refresh flag on error (works even if component unmounts)
      sessionStorage.removeItem(REFRESHING_FLAG);
      
      // Update state (only if component is still mounted)
      try {
        setLoading(false);
        setIsRefreshing(false);
      } catch (e) {
        // Component might be unmounted, ignore state update errors
      }
    }
  };

  const handleRefresh = () => {
    if (!isRefreshing && connected && userAddress) {
      loadGlobalStats(true); // background refresh
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
                Overview of the platform's analytics
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
                <div className="section-header-with-refresh">
                  <h2 className="section-title" style={{ marginTop: '20px' }}>
                    Platform Analytics
                  </h2>
                  <button
                    className="refresh-button"
                    onClick={handleRefresh}
                    disabled={isRefreshing || !connected}
                    title="Refresh analytics data"
                  >
                    <RefreshCw 
                      size={18} 
                      className={isRefreshing ? 'spinning' : ''} 
                    />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>

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

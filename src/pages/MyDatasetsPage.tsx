import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '@/config/api';
import './MyDatasetsPage.css';

interface UserDataset {
  id: string;
  userAddress: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  description: string;
  cid: string;
  totalSupply: number;
  creatorAddress: string;
  marketplaceAddress: string;
  type: 'created' | 'bought';
  amount: string;
  createdAt: string;
  updatedAt: string;
}

const MyDatasetsPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<UserDataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('MyDatasetsPage useEffect - connected:', connected, 'userAddress:', userAddress);
    if (connected && userAddress) {
      loadUserDatasets();
    } else {
      setLoading(false);
    }
  }, [connected, userAddress]);

  const loadUserDatasets = async () => {
    try {
      setLoading(true);
      console.log('Loading datasets for user:', userAddress);
      const apiUrl = getApiUrl(`/api/my-datasets/${userAddress}`);
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datasets loaded:', data);
        setDatasets(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to load datasets:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetClick = (tokenAddress: string) => {
    navigate(`/token/${tokenAddress}`);
  };

  const createdDatasets = datasets.filter(d => d.type === 'created');
  const boughtDatasets = datasets.filter(d => d.type === 'bought');

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
              <h2 className="page-subtitle">My Datasets</h2>
              <p className="page-description">
                Manage your created datasets and track datasets you've purchased
              </p>
            </div>

            <Link to="/create" className="create-btn">
              <span>➕</span> Create Dataset
            </Link>
          </div>

          <div className="my-datasets-content">
            {!connected ? (
              <div className="empty-state-large">
                <div className="empty-icon-large">🔗</div>
                <h3>Connect your wallet</h3>
                <p>Connect your wallet to view your datasets</p>
                <button onClick={() => connectWallet()} className="btn-create-large">
                  Connect Wallet
                </button>
              </div>
            ) : loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your datasets...</p>
              </div>
            ) : datasets.length === 0 ? (
              <div className="empty-state-large">
                <div className="empty-icon-large">📁</div>
                <h3>No datasets yet</h3>
                <p>Create your first dataset or buy some tokens to get started</p>
                <Link to="/create" className="btn-create-large">
                  Create Dataset
                </Link>
              </div>
            ) : (
              <div className="datasets-sections">
                {/* Created Datasets */}
                {createdDatasets.length > 0 && (
                  <div className="dataset-section">
                    <h3 className="section-title">📝 Created Datasets ({createdDatasets.length})</h3>
                    <div className="datasets-grid">
                      {createdDatasets.map((dataset) => (
                        <div 
                          key={dataset.id} 
                          className="dataset-card created"
                          onClick={() => handleDatasetClick(dataset.tokenAddress)}
                        >
                          <div className="dataset-header">
                            <div className="dataset-icon">{dataset.symbol.charAt(0)}</div>
                            <div className="dataset-info">
                              <h4>{dataset.name}</h4>
                              <p className="dataset-symbol">{dataset.symbol}</p>
                            </div>
                            <div className="dataset-type-badge created">Created</div>
                          </div>
                          <div className="dataset-details">
                            <div className="detail-item">
                              <span className="label">Total Supply:</span>
                              <span className="value">{dataset.totalSupply.toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Your Allocation:</span>
                              <span className="value">10% ({(dataset.totalSupply * 0.1).toLocaleString()})</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bought Datasets */}
                {boughtDatasets.length > 0 && (
                  <div className="dataset-section">
                    <h3 className="section-title">🛒 Purchased Datasets ({boughtDatasets.length})</h3>
                    <div className="datasets-grid">
                      {boughtDatasets.map((dataset) => (
                        <div 
                          key={dataset.id} 
                          className="dataset-card bought"
                          onClick={() => handleDatasetClick(dataset.tokenAddress)}
                        >
                          <div className="dataset-header">
                            <div className="dataset-icon">{dataset.symbol.charAt(0)}</div>
                            <div className="dataset-info">
                              <h4>{dataset.name}</h4>
                              <p className="dataset-symbol">{dataset.symbol}</p>
                            </div>
                            <div className="dataset-type-badge bought">Bought</div>
                          </div>
                          <div className="dataset-details">
                            <div className="detail-item">
                              <span className="label">Amount Owned:</span>
                              <span className="value">{ethers.formatUnits(dataset.amount, 18)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Creator:</span>
                              <span className="value">{dataset.creatorAddress.slice(0, 6)}...{dataset.creatorAddress.slice(-4)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyDatasetsPage;


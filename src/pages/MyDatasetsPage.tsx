import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CustomLoader from '@/components/CustomLoader';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '@/config/api';
import { Plus, Folder, ShoppingCart, FileText, Wallet } from 'lucide-react';
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
  realTimeBalance?: string;
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
        const datasets = Array.isArray(data) ? data : (data.datasets || []);
        setDatasets(datasets);
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
          <div className="my-datasets-content">
            <div className="page-header">
              <div>
                <h1 className="page-title">My Datasets</h1>
                <p className="page-description">
                  Manage your created datasets and track datasets you've purchased
                </p>
              </div>
            </div>

            {!connected ? (
              <div className="datasets-container">
                <div className="empty-state">
                  <div className="empty-icon">
                    <Wallet size={64} strokeWidth={1.5} />
                  </div>
                  <h3 className="empty-title">Connect your wallet</h3>
                  <p className="empty-description">Connect your wallet to view your datasets</p>
                  <button 
                    onClick={async () => {
                      if (window.ethereum) {
                        await connectWallet('metamask');
                      } else if (window.coinbaseWalletExtension) {
                        await connectWallet('coinbase');
                      } else {
                        alert('No wallet found. Please install MetaMask or Coinbase Wallet.');
                      }
                    }} 
                    className="btn-connect"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="datasets-container">
                <div className="loading-container">
                  <CustomLoader />
                  <p className="loading-message">Loading your datasets...</p>
                </div>
              </div>
            ) : datasets.length === 0 ? (
              <div className="datasets-container">
                <div className="empty-state">
                  <div className="empty-icon">
                    <FileText size={64} strokeWidth={1.5} />
                  </div>
                  <h3 className="empty-title">No datasets yet</h3>
                  <p className="empty-description">Create your first dataset or buy some tokens to get started</p>
                  <Link to="/create" className="btn-connect">
                    <Plus size={16} strokeWidth={2} />
                    Create Dataset
                  </Link>
                </div>
              </div>
            ) : (
              <div className="datasets-container">
                <div className="datasets-sections">
                  {/* Created Datasets */}
                  {createdDatasets.length > 0 && (
                    <div className="dataset-section">
                      <h3 className="section-title">
                        <Folder size={18} strokeWidth={2} />
                        Created Datasets ({createdDatasets.length})
                      </h3>
                      <div className="datasets-grid">
                        {createdDatasets.map((dataset, index) => (
                          <div 
                            key={dataset.id} 
                            className="dataset-card"
                            onClick={() => handleDatasetClick(dataset.tokenAddress)}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="dataset-header">
                              <div className="dataset-logo">{dataset.symbol.charAt(0).toUpperCase()}</div>
                              <div className="dataset-info">
                                <h4>{dataset.name}</h4>
                                <p className="dataset-symbol">{dataset.symbol}</p>
                              </div>
                              <div className="dataset-badge created">Created</div>
                            </div>
                            <div className="dataset-details">
                              <div className="detail-row">
                                <span className="detail-label">Total Supply:</span>
                                <span className="detail-value">{dataset.totalSupply.toLocaleString()}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Your Allocation:</span>
                                <span className="detail-value">10%</span>
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
                      <h3 className="section-title">
                        <ShoppingCart size={18} strokeWidth={2} />
                        Purchased Datasets ({boughtDatasets.length})
                      </h3>
                      <div className="datasets-grid">
                        {boughtDatasets.map((dataset, index) => (
                          <div 
                            key={dataset.id} 
                            className="dataset-card"
                            onClick={() => handleDatasetClick(dataset.tokenAddress)}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="dataset-header">
                              <div className="dataset-logo">{dataset.symbol.charAt(0).toUpperCase()}</div>
                              <div className="dataset-info">
                                <h4>{dataset.name}</h4>
                                <p className="dataset-symbol">{dataset.symbol}</p>
                              </div>
                              <div className="dataset-badge bought">Bought</div>
                            </div>
                            <div className="dataset-details">
                              <div className="detail-row">
                                <span className="detail-label">Amount Owned:</span>
                                <span className="detail-value">
                                  {ethers.formatUnits(dataset.realTimeBalance || dataset.amount, 18).slice(0, 8)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Creator:</span>
                                <span className="detail-value">{dataset.creatorAddress.slice(0, 6)}...{dataset.creatorAddress.slice(-4)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyDatasetsPage;

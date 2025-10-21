import { useWeb3 } from '@/hooks/useWeb3';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import './MyDatasetsPage.css';

const MyDatasetsPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();

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
                Manage your created datasets and track performance
              </p>
            </div>

            <Link to="/create" className="create-btn">
              <span>➕</span> Create Dataset
            </Link>
          </div>

          <div className="my-datasets-content">
            <div className="empty-state-large">
              <div className="empty-icon-large">📁</div>
              <h3>No datasets yet</h3>
              <p>Create your first dataset to get started</p>
              <Link to="/create" className="btn-create-large">
                Create Dataset
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyDatasetsPage;


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import MarketplacePage from '@/pages/MarketplacePage';
import TokenDetailPage from '@/pages/TokenDetailPage';
import CreateDatasetPage from '@/pages/CreateDatasetPage';
import MyDatasetsPage from '@/pages/MyDatasetsPage';
import './App.css';
import LandingPage from './pages/LandingPage';
import { Providers } from './AppProvider';

function App() {
  return (
    <Providers>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/feed" element={<FeedPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/token/:tokenAddress" element={<TokenDetailPage />} />
          <Route path="/create" element={<CreateDatasetPage />} />
          <Route path="/my-datasets" element={<MyDatasetsPage />} />
          <Route path="/faucet" element={<FaucetPage />} />

        </Routes>
      </Router>
    </Providers>
  );
}

export default App;


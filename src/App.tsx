import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import MarketplacePage from '@/pages/MarketplacePage';
import TokenDetailPage from '@/pages/TokenDetailPage';
import CreateDatasetPage from '@/pages/CreateDatasetPage';
import MyDatasetsPage from '@/pages/MyDatasetsPage';
import FaucetPage from '@/pages/FaucetPage';
import FeedPage from '@/pages/FeedPage';
import LandingPage from './pages/LandingPage';
import { Providers } from './AppProvider';

function App() {
  return (
    <Router>
      <Providers>
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
      </Providers>
    </Router>
  );
}

export default App;
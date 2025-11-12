import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/config/wagmi';
import { Web3Provider } from '@/contexts/Web3Context';
import DashboardPage from '@/pages/DashboardPage';
import MarketplacePage from '@/pages/MarketplacePage';
import TokenDetailPage from '@/pages/TokenDetailPage';
import CreateDatasetPage from '@/pages/CreateDatasetPage';
import MyDatasetsPage from '@/pages/MyDatasetsPage';
import FaucetPage from '@/pages/FaucetPage';
import FeedPage from '@/pages/FeedPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import CommunityPage from './pages/CommunityPage';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
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
              <Route path="/community" element={<CommunityPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
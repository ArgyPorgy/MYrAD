import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import MarketplacePage from '@/pages/MarketplacePage';
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
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/create" element={<CreateDatasetPage />} />
          <Route path="/my-datasets" element={<MyDatasetsPage />} />

        </Routes>
      </Router>
    </Providers>
  );
}

export default App;


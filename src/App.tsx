import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import MarketplacePage from '@/pages/MarketplacePage';
import CreateDatasetPage from '@/pages/CreateDatasetPage';
import MyDatasetsPage from '@/pages/MyDatasetsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/marketplace" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/create" element={<CreateDatasetPage />} />
        <Route path="/my-datasets" element={<MyDatasetsPage />} />

      </Routes>
    </Router>
  );
}

export default App;


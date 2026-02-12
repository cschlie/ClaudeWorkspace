import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MarketProvider } from './context/MarketContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ScreenerPage from './pages/ScreenerPage';
import StockDetailPage from './pages/StockDetailPage';
import ChartsPage from './pages/ChartsPage';
import NewsPage from './pages/NewsPage';
import WatchlistPage from './pages/WatchlistPage';

function App() {
  return (
    <BrowserRouter>
      <MarketProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="screener" element={<ScreenerPage />} />
            <Route path="stock/:symbol" element={<StockDetailPage />} />
            <Route path="charts" element={<ChartsPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
          </Route>
        </Routes>
      </MarketProvider>
    </BrowserRouter>
  );
}

export default App;

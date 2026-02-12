import { HashRouter, Routes, Route } from 'react-router-dom';
import { MarketProvider } from './context/MarketContext';
import { PortfolioProvider } from './context/PortfolioContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ScreenerPage from './pages/ScreenerPage';
import StockDetailPage from './pages/StockDetailPage';
import ChartsPage from './pages/ChartsPage';
import PortfolioPage from './pages/PortfolioPage';
import NewsPage from './pages/NewsPage';
import WatchlistPage from './pages/WatchlistPage';

function App() {
  return (
    <HashRouter>
      <MarketProvider>
        <PortfolioProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="screener" element={<ScreenerPage />} />
              <Route path="stock/:symbol" element={<StockDetailPage />} />
              <Route path="charts" element={<ChartsPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="watchlist" element={<WatchlistPage />} />
            </Route>
          </Routes>
        </PortfolioProvider>
      </MarketProvider>
    </HashRouter>
  );
}

export default App;

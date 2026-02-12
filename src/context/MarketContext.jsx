import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMarketIndices, getSectorETFs, getNews } from '../services/api';

const MarketContext = createContext(null);

const REFRESH_INTERVAL = 30000; // 30 seconds

export function MarketProvider({ children }) {
  const [indices, setIndices] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [news, setNews] = useState([]);
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('bb_watchlist');
    return saved ? JSON.parse(saved) : ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN'];
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [idx, sec, nws] = await Promise.all([
        getMarketIndices(),
        getSectorETFs(),
        getNews(),
      ]);
      setIndices(idx);
      setSectors(sec);
      setNews(nws);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Market refresh failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  const addToWatchlist = useCallback((symbol) => {
    setWatchlist(prev => {
      if (prev.includes(symbol)) return prev;
      const next = [...prev, symbol];
      localStorage.setItem('bb_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol) => {
    setWatchlist(prev => {
      const next = prev.filter(s => s !== symbol);
      localStorage.setItem('bb_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <MarketContext.Provider value={{
      indices, sectors, news, watchlist, loading, lastUpdated,
      addToWatchlist, removeFromWatchlist, refresh,
    }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within MarketProvider');
  return ctx;
}

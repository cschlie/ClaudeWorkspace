import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getQuotes } from '../services/api';

const PortfolioContext = createContext(null);

const STORAGE_KEY = 'bb_portfolio';

const DEFAULT_POSITIONS = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', side: 'long', shares: 50, avgCost: 175.20, dateAdded: '2024-06-15' },
  { id: 2, symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', side: 'long', shares: 30, avgCost: 380.50, dateAdded: '2024-03-10' },
  { id: 3, symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', side: 'long', shares: 20, avgCost: 620.00, dateAdded: '2024-01-20' },
  { id: 4, symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', side: 'short', shares: 25, avgCost: 245.00, dateAdded: '2024-08-01' },
  { id: 5, symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', side: 'long', shares: 100, avgCost: 480.00, dateAdded: '2023-12-01' },
  { id: 6, symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', side: 'long', shares: 40, avgCost: 390.00, dateAdded: '2024-02-15' },
  { id: 7, symbol: 'VFIAX', name: 'Vanguard 500 Index', type: 'mutual_fund', side: 'long', shares: 75, avgCost: 420.00, dateAdded: '2023-06-01' },
  { id: 8, symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', side: 'long', shares: 35, avgCost: 140.00, dateAdded: '2024-04-20' },
  { id: 9, symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', side: 'long', shares: 20, avgCost: 155.00, dateAdded: '2024-05-10' },
  { id: 10, symbol: 'TLT', name: 'iShares 20+ Yr Treasury', type: 'etf', side: 'long', shares: 60, avgCost: 95.00, dateAdded: '2024-07-01' },
];

export function PortfolioProvider({ children }) {
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_POSITIONS;
  });
  const [liveQuotes, setLiveQuotes] = useState({});
  const [loading, setLoading] = useState(true);

  // Persist positions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  // Fetch live quotes for all portfolio symbols
  const refreshQuotes = useCallback(async () => {
    const symbols = [...new Set(positions.map(p => p.symbol))];
    if (!symbols.length) {
      setLoading(false);
      return;
    }
    try {
      const quotes = await getQuotes(symbols);
      const map = {};
      quotes.forEach(q => { map[q.symbol] = q; });
      setLiveQuotes(map);
    } catch (err) {
      console.error('Portfolio quote refresh failed:', err);
    } finally {
      setLoading(false);
    }
  }, [positions]);

  useEffect(() => {
    refreshQuotes();
    const id = setInterval(refreshQuotes, 30000);
    return () => clearInterval(id);
  }, [refreshQuotes]);

  const addPosition = useCallback((position) => {
    setPositions(prev => [...prev, { ...position, id: Date.now() }]);
  }, []);

  const removePosition = useCallback((id) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePosition = useCallback((id, updates) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  // Compute enriched positions with live data
  const enrichedPositions = positions.map(pos => {
    const quote = liveQuotes[pos.symbol];
    const currentPrice = quote?.regularMarketPrice || pos.avgCost;
    const costBasis = pos.shares * pos.avgCost;
    const marketValue = pos.shares * currentPrice;
    const pnl = pos.side === 'long'
      ? marketValue - costBasis
      : costBasis - marketValue;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    const dayChange = quote?.regularMarketChange || 0;
    const dayChangePct = quote?.regularMarketChangePercent || 0;
    const dayPnl = pos.shares * dayChange * (pos.side === 'long' ? 1 : -1);

    return {
      ...pos,
      currentPrice,
      costBasis,
      marketValue,
      pnl,
      pnlPercent,
      dayChange,
      dayChangePct,
      dayPnl,
      quote,
    };
  });

  const totalValue = enrichedPositions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalCost = enrichedPositions.reduce((sum, p) => sum + p.costBasis, 0);
  const totalPnl = enrichedPositions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const totalDayPnl = enrichedPositions.reduce((sum, p) => sum + p.dayPnl, 0);

  return (
    <PortfolioContext.Provider value={{
      positions: enrichedPositions,
      rawPositions: positions,
      liveQuotes,
      loading,
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPercent,
      totalDayPnl,
      addPosition,
      removePosition,
      updatePosition,
      refreshQuotes,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}

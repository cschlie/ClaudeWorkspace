import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScreenerData } from '../services/api';
import { formatPrice, formatPercent, formatChange, formatVolume, formatMarketCap } from '../utils/format';
import { Search, ArrowUpDown, Filter, Star } from 'lucide-react';
import { useMarket } from '../context/MarketContext';

const SECTORS = ['All', 'Technology', 'Financial Services', 'Healthcare', 'Consumer Cyclical', 'Consumer Defensive', 'Communication Services', 'Industrials'];

export default function ScreenerPage() {
  const navigate = useNavigate();
  const { addToWatchlist, removeFromWatchlist, watchlist } = useMarket();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [sortKey, setSortKey] = useState('marketCap');
  const [sortDir, setSortDir] = useState('desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minChange, setMinChange] = useState('');

  useEffect(() => {
    getScreenerData().then(data => {
      setStocks(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = [...stocks];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        (s.shortName || '').toLowerCase().includes(q)
      );
    }

    if (sector !== 'All') {
      result = result.filter(s => s.sector === sector);
    }

    if (minPrice) {
      result = result.filter(s => (s.regularMarketPrice || 0) >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter(s => (s.regularMarketPrice || 0) <= Number(maxPrice));
    }
    if (minChange) {
      result = result.filter(s => Math.abs(s.regularMarketChangePercent || 0) >= Number(minChange));
    }

    result.sort((a, b) => {
      const aVal = a[sortKey] || 0;
      const bVal = b[sortKey] || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [stocks, search, sector, sortKey, sortDir, minPrice, maxPrice, minChange]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ label, field, className = '' }) => (
    <th
      className={`px-3 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)] select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === field && (
          <ArrowUpDown size={10} className="text-[var(--color-accent)]" />
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-[var(--color-accent)]" />
          <span className="text-sm font-medium">Stock Screener</span>
          <span className="text-[var(--color-text-dim)] text-xs ml-auto">{filtered.length} results</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
            <input
              type="text"
              placeholder="Search symbol or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] w-52"
            />
          </div>

          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="px-2 py-1.5 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          >
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="px-2 py-1.5 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] w-24"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="px-2 py-1.5 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] w-24"
          />

          <input
            type="number"
            placeholder="Min |Chg%|"
            value={minChange}
            onChange={e => setMinChange(e.target.value)}
            className="px-2 py-1.5 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] w-24"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--color-text-muted)] text-sm">
            Loading screener data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-surface-light)]">
                <tr>
                  <th className="px-3 py-2 w-8"></th>
                  <SortHeader label="Symbol" field="symbol" />
                  <SortHeader label="Name" field="shortName" />
                  <SortHeader label="Price" field="regularMarketPrice" />
                  <SortHeader label="Change" field="regularMarketChange" />
                  <SortHeader label="Change %" field="regularMarketChangePercent" />
                  <SortHeader label="Volume" field="regularMarketVolume" />
                  <SortHeader label="Market Cap" field="marketCap" />
                  <SortHeader label="P/E" field="trailingPE" />
                  <SortHeader label="52W High" field="fiftyTwoWeekHigh" />
                  <SortHeader label="52W Low" field="fiftyTwoWeekLow" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(stock => {
                  const isPositive = (stock.regularMarketChange || 0) >= 0;
                  const inWatchlist = watchlist.includes(stock.symbol);

                  return (
                    <tr
                      key={stock.symbol}
                      className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-light)] cursor-pointer transition-colors"
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <td className="px-2 py-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => inWatchlist ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol)}
                          className="p-0.5"
                        >
                          <Star size={12} className={inWatchlist ? 'fill-[var(--color-yellow)] text-[var(--color-yellow)]' : 'text-[var(--color-text-dim)]'} />
                        </button>
                      </td>
                      <td className="px-3 py-1.5 text-xs font-medium text-[var(--color-accent)]">{stock.symbol}</td>
                      <td className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] truncate max-w-[150px]">{stock.shortName}</td>
                      <td className="px-3 py-1.5 text-xs font-mono">{formatPrice(stock.regularMarketPrice)}</td>
                      <td className={`px-3 py-1.5 text-xs font-mono ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                        {formatChange(stock.regularMarketChange)}
                      </td>
                      <td className={`px-3 py-1.5 text-xs font-mono ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                        {formatPercent(stock.regularMarketChangePercent)}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-mono text-[var(--color-text-muted)]">{formatVolume(stock.regularMarketVolume)}</td>
                      <td className="px-3 py-1.5 text-xs font-mono text-[var(--color-text-muted)]">{formatMarketCap(stock.marketCap)}</td>
                      <td className="px-3 py-1.5 text-xs font-mono text-[var(--color-text-muted)]">{stock.trailingPE?.toFixed(1) || '—'}</td>
                      <td className="px-3 py-1.5 text-xs font-mono text-[var(--color-text-muted)]">{formatPrice(stock.fiftyTwoWeekHigh)}</td>
                      <td className="px-3 py-1.5 text-xs font-mono text-[var(--color-text-muted)]">{formatPrice(stock.fiftyTwoWeekLow)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

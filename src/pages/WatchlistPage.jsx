import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { getQuotes } from '../services/api';
import { formatPrice, formatPercent, formatChange, formatVolume, formatMarketCap } from '../utils/format';
import MiniChart from '../components/MiniChart';
import { Star, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { watchlist, addToWatchlist, removeFromWatchlist } = useMarket();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!watchlist.length) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getQuotes(watchlist).then(data => {
      setQuotes(data);
      setLoading(false);
    });
  }, [watchlist]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!watchlist.length) return;
    const id = setInterval(() => {
      getQuotes(watchlist).then(setQuotes);
    }, 30000);
    return () => clearInterval(id);
  }, [watchlist]);

  const handleAdd = (e) => {
    e.preventDefault();
    const sym = addInput.trim().toUpperCase();
    if (sym) {
      addToWatchlist(sym);
      setAddInput('');
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star size={16} className="text-[var(--color-yellow)]" />
        <h1 className="text-sm font-medium">Watchlist</h1>
        <span className="text-[var(--color-text-dim)] text-xs">{watchlist.length} symbols</span>

        <div className="ml-auto flex items-center gap-2">
          {showAdd ? (
            <form onSubmit={handleAdd} className="flex items-center gap-1">
              <input
                type="text"
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                placeholder="SYMBOL"
                autoFocus
                className="px-2 py-1 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-accent)] font-medium w-24 focus:outline-none focus:border-[var(--color-accent)] uppercase"
              />
              <button type="submit" className="px-2 py-1 rounded text-xs bg-[var(--color-accent)] text-black font-medium">
                Add
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="p-1">
                <X size={12} className="text-[var(--color-text-dim)]" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
            >
              <Plus size={12} />
              Add Symbol
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-[var(--color-text-muted)] text-sm">
          Loading watchlist...
        </div>
      ) : watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-[var(--color-text-muted)]">
          <Star size={32} className="mb-2 text-[var(--color-text-dim)]" />
          <p className="text-sm">Your watchlist is empty</p>
          <p className="text-xs text-[var(--color-text-dim)] mt-1">Add symbols from the screener or use the button above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map(quote => {
            const isPositive = (quote.regularMarketChange || 0) >= 0;

            return (
              <div
                key={quote.symbol}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3 hover:border-[var(--color-border-light)] transition-colors cursor-pointer"
                onClick={() => navigate(`/stock/${quote.symbol}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Symbol & Name */}
                  <div className="w-32 shrink-0">
                    <div className="font-medium text-[var(--color-accent)] text-sm">{quote.symbol}</div>
                    <div className="text-[var(--color-text-muted)] text-xs truncate">{quote.shortName}</div>
                  </div>

                  {/* Mini chart */}
                  <div className="w-40 shrink-0">
                    <MiniChart symbol={quote.symbol} height={40} color={isPositive ? '#00c853' : '#ff1744'} />
                  </div>

                  {/* Price */}
                  <div className="w-24 text-right shrink-0">
                    <div className="font-mono text-sm">{formatPrice(quote.regularMarketPrice)}</div>
                  </div>

                  {/* Change */}
                  <div className={`w-28 text-right shrink-0 ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span className="font-mono text-xs">{formatChange(quote.regularMarketChange)}</span>
                    </div>
                    <div className="font-mono text-xs">{formatPercent(quote.regularMarketChangePercent)}</div>
                  </div>

                  {/* Volume */}
                  <div className="w-20 text-right shrink-0 hidden md:block">
                    <div className="text-[var(--color-text-dim)] text-[10px]">Vol</div>
                    <div className="font-mono text-xs text-[var(--color-text-muted)]">{formatVolume(quote.regularMarketVolume)}</div>
                  </div>

                  {/* Market Cap */}
                  <div className="w-24 text-right shrink-0 hidden lg:block">
                    <div className="text-[var(--color-text-dim)] text-[10px]">Mkt Cap</div>
                    <div className="font-mono text-xs text-[var(--color-text-muted)]">{formatMarketCap(quote.marketCap)}</div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removeFromWatchlist(quote.symbol);
                    }}
                    className="p-1 rounded hover:bg-[var(--color-surface-light)] ml-auto shrink-0"
                    title="Remove from watchlist"
                  >
                    <X size={14} className="text-[var(--color-text-dim)]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

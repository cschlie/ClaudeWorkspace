import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuote, getChart } from '../services/api';
import { useMarket } from '../context/MarketContext';
import { formatPrice, formatPercent, formatChange, formatVolume, formatMarketCap } from '../utils/format';
import PriceChart from '../components/PriceChart';
import { Star, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

export default function StockDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { watchlist, addToWatchlist, removeFromWatchlist } = useMarket();
  const [quote, setQuote] = useState(null);
  const [volumeData, setVolumeData] = useState([]);
  const [loading, setLoading] = useState(true);

  const inWatchlist = watchlist.includes(symbol);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getQuote(symbol),
      getChart(symbol, '5d', '15m'),
    ]).then(([q, chart]) => {
      setQuote(q);
      if (chart?.length) {
        setVolumeData(chart.slice(-40).map(d => ({
          time: new Date(d.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          volume: d.volume,
          color: d.close >= d.open ? '#00c853' : '#ff1744',
        })));
      }
      setLoading(false);
    });
  }, [symbol]);

  if (loading || !quote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-muted)]">Loading {symbol}...</div>
      </div>
    );
  }

  const isPositive = (quote.regularMarketChange || 0) >= 0;

  const stats = [
    { label: 'Open', value: formatPrice(quote.regularMarketOpen) },
    { label: 'Prev Close', value: formatPrice(quote.regularMarketPreviousClose) },
    { label: 'Day High', value: formatPrice(quote.regularMarketDayHigh) },
    { label: 'Day Low', value: formatPrice(quote.regularMarketDayLow) },
    { label: 'Volume', value: formatVolume(quote.regularMarketVolume) },
    { label: 'Avg Vol (3M)', value: formatVolume(quote.averageDailyVolume3Month) },
    { label: 'Market Cap', value: formatMarketCap(quote.marketCap) },
    { label: 'P/E Ratio', value: quote.trailingPE?.toFixed(2) || '—' },
    { label: '52W High', value: formatPrice(quote.fiftyTwoWeekHigh) },
    { label: '52W Low', value: formatPrice(quote.fiftyTwoWeekLow) },
  ];

  const pctOf52High = quote.fiftyTwoWeekHigh
    ? ((quote.regularMarketPrice / quote.fiftyTwoWeekHigh) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-[var(--color-surface-light)]">
          <ArrowLeft size={16} className="text-[var(--color-text-muted)]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[var(--color-accent)]">{symbol}</h1>
            <span className="text-[var(--color-text-muted)] text-sm">{quote.shortName}</span>
            <button
              onClick={() => inWatchlist ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
              className="ml-2"
            >
              <Star size={16} className={inWatchlist ? 'fill-[var(--color-yellow)] text-[var(--color-yellow)]' : 'text-[var(--color-text-dim)]'} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-2xl font-mono font-medium">{formatPrice(quote.regularMarketPrice)}</span>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-mono text-sm">
                {formatChange(quote.regularMarketChange)} ({formatPercent(quote.regularMarketChangePercent)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main chart */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <PriceChart symbol={symbol} height={350} />
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Stats */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
          <div className="text-sm font-medium mb-3">Key Statistics</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)] text-xs">{label}</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>
          {pctOf52High && (
            <div className="mt-3">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">52-Week Range Position</div>
              <div className="w-full bg-[var(--color-surface-lighter)] rounded-full h-2">
                <div
                  className="bg-[var(--color-accent)] h-2 rounded-full transition-all"
                  style={{ width: `${pctOf52High}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--color-text-dim)] mt-0.5">
                <span>{formatPrice(quote.fiftyTwoWeekLow)}</span>
                <span>{pctOf52High}%</span>
                <span>{formatPrice(quote.fiftyTwoWeekHigh)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Volume chart */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
          <div className="text-sm font-medium mb-3">Volume Profile</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeData}>
              <XAxis dataKey="time" tick={{ fill: '#555', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#555', fontSize: 9 }} tickFormatter={v => formatVolume(v)} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, fontSize: 11 }}
                formatter={(value) => [formatVolume(value), 'Volume']}
              />
              <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                {volumeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick info panel */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
          <div className="text-sm font-medium mb-3">Company Info</div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[var(--color-text-muted)]">Sector</span>
              <div className="mt-0.5">{quote.sector || 'N/A'}</div>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Exchange</span>
              <div className="mt-0.5">{quote.exchange || 'NASDAQ'}</div>
            </div>
            <div className="pt-2 border-t border-[var(--color-border)]">
              <div className="text-[var(--color-text-muted)] mb-2">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => inWatchlist ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    inWatchlist
                      ? 'bg-[var(--color-yellow)]/20 text-[var(--color-yellow)] border border-[var(--color-yellow)]/30'
                      : 'bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

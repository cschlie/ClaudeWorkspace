import { useMarket } from '../context/MarketContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice, formatPercent, formatChange, formatVolume, timeAgo } from '../utils/format';
import MiniChart from '../components/MiniChart';
import { TrendingUp, TrendingDown, BarChart3, Globe, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function IndexCard({ data }) {
  const navigate = useNavigate();
  const isPositive = (data.regularMarketChange || 0) >= 0;

  return (
    <div
      onClick={() => navigate(`/stock/${data.symbol}`)}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3 cursor-pointer hover:border-[var(--color-border-light)] transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[var(--color-text-muted)] text-xs">{data.shortName || data.symbol}</span>
        {isPositive ? <TrendingUp size={14} className="text-[var(--color-green)]" /> : <TrendingDown size={14} className="text-[var(--color-red)]" />}
      </div>
      <div className="font-mono text-lg font-medium">{formatPrice(data.regularMarketPrice)}</div>
      <div className={`font-mono text-xs mt-0.5 ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
        {formatChange(data.regularMarketChange)} ({formatPercent(data.regularMarketChangePercent)})
      </div>
      <div className="mt-2">
        <MiniChart symbol={data.symbol} height={40} color={isPositive ? '#00c853' : '#ff1744'} />
      </div>
    </div>
  );
}

function SectorHeatmap({ sectors }) {
  const chartData = sectors.map(s => ({
    name: s.symbol,
    value: s.regularMarketChangePercent || 0,
  }));

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} className="text-[var(--color-accent)]" />
        <span className="text-sm font-medium">Sector Performance</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} width={40} />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, fontSize: 11 }}
            formatter={(value) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Change']}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? '#00c853' : '#ff1744'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function NewsTicker({ news }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-[var(--color-yellow)]" />
        <span className="text-sm font-medium">Latest Headlines</span>
        <button
          onClick={() => navigate('/news')}
          className="ml-auto text-[var(--color-accent)] text-xs hover:underline"
        >
          View All
        </button>
      </div>
      <div className="space-y-2">
        {news.slice(0, 6).map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex items-start gap-2 py-1.5 border-b border-[var(--color-border)] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[var(--color-text-dim)] text-[10px]">{item.source}</span>
                  <span className="text-[var(--color-text-dim)] text-[10px]">{timeAgo(item.publishedAt)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function TopMovers({ indices }) {
  const stocks = [...indices].filter(s => s.regularMarketChangePercent != null);
  const gainers = [...stocks].sort((a, b) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0)).slice(0, 5);
  const losers = [...stocks].sort((a, b) => (a.regularMarketChangePercent || 0) - (b.regularMarketChangePercent || 0)).slice(0, 5);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={14} className="text-[var(--color-blue)]" />
        <span className="text-sm font-medium">Market Movers</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[var(--color-green)] text-xs font-medium mb-2">Gainers</div>
          {gainers.map(s => (
            <div key={s.symbol} className="flex items-center justify-between py-1 text-xs">
              <span className="text-[var(--color-text-muted)]">{s.shortName || s.symbol}</span>
              <span className="text-[var(--color-green)] font-mono">{formatPercent(s.regularMarketChangePercent)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[var(--color-red)] text-xs font-medium mb-2">Losers</div>
          {losers.map(s => (
            <div key={s.symbol} className="flex items-center justify-between py-1 text-xs">
              <span className="text-[var(--color-text-muted)]">{s.shortName || s.symbol}</span>
              <span className="text-[var(--color-red)] font-mono">{formatPercent(s.regularMarketChangePercent)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { indices, sectors, news, loading } = useMarket();

  if (loading && !indices.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-muted)]">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Market Indices Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {indices.slice(0, 5).map(idx => (
          <IndexCard key={idx.symbol} data={idx} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left column - Sector performance */}
        <div className="lg:col-span-1 space-y-3">
          <SectorHeatmap sectors={sectors} />
          <TopMovers indices={indices} />
        </div>

        {/* Center - Additional indices */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
            <div className="text-sm font-medium mb-3">Global Indices & Commodities</div>
            <div className="space-y-0.5">
              {indices.slice(5).map(idx => {
                const isPositive = (idx.regularMarketChange || 0) >= 0;
                return (
                  <div key={idx.symbol} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0 text-xs">
                    <span className="text-[var(--color-text-muted)]">{idx.shortName || idx.symbol}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{formatPrice(idx.regularMarketPrice)}</span>
                      <span className={`font-mono w-16 text-right ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                        {formatPercent(idx.regularMarketChangePercent)}
                      </span>
                      <span className="text-[var(--color-text-dim)] w-14 text-right">{formatVolume(idx.regularMarketVolume)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right - News */}
        <div className="lg:col-span-1">
          <NewsTicker news={news} />
        </div>
      </div>
    </div>
  );
}

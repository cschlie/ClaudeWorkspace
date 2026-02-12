import { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { timeAgo, formatDate } from '../utils/format';
import { Newspaper, ExternalLink, Clock, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All', 'Markets', 'Tech', 'Economy', 'Crypto', 'Commodities'];

export default function NewsPage() {
  const { news, refresh, loading } = useMarket();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-[var(--color-accent)]" />
          <h1 className="text-sm font-medium">News & Announcements</h1>
        </div>

        <div className="flex gap-1 ml-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-accent)] text-black font-medium'
                  : 'bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={refresh}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] ml-auto"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Main feed */}
        <div className="space-y-2">
          {news.map((item, i) => (
            <article
              key={i}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4 hover:border-[var(--color-border-light)] transition-colors"
            >
              <div className="flex items-start gap-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-20 h-14 object-cover rounded shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h3 className="text-sm font-medium leading-snug group-hover:text-[var(--color-accent)] transition-colors">
                      {item.title}
                    </h3>
                  </a>

                  {(expandedId === i || !item.description) ? (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  ) : (
                    <p
                      className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed line-clamp-2 cursor-pointer"
                      onClick={() => setExpandedId(i)}
                    >
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[var(--color-accent)] text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-accent-dim)]">
                      {item.source}
                    </span>
                    <div className="flex items-center gap-1 text-[var(--color-text-dim)] text-[10px]">
                      <Clock size={10} />
                      <span>{timeAgo(item.publishedAt)}</span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[var(--color-text-dim)] text-[10px] hover:text-[var(--color-accent)] ml-auto"
                    >
                      <ExternalLink size={10} />
                      Read more
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Sidebar - trending tickers and market summary */}
        <div className="space-y-3">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4">
            <h3 className="text-sm font-medium mb-3">Market Summary</h3>
            <div className="space-y-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <p>
                Markets are showing mixed signals today with technology stocks leading gains
                while energy and utilities sectors face selling pressure. The Federal Reserve's
                latest commentary continues to be closely monitored by investors.
              </p>
              <p>
                Trading volume has been above average with increased activity in options markets,
                suggesting institutional positioning ahead of the upcoming earnings season.
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4">
            <h3 className="text-sm font-medium mb-3">Trending Tickers</h3>
            <div className="flex flex-wrap gap-2">
              {['NVDA', 'AAPL', 'TSLA', 'AMD', 'META', 'MSFT', 'AMZN', 'GOOGL'].map(sym => (
                <span
                  key={sym}
                  className="px-2 py-1 rounded text-xs bg-[var(--color-surface-light)] text-[var(--color-accent)] border border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer transition-colors"
                >
                  ${sym}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4">
            <h3 className="text-sm font-medium mb-3">Economic Calendar</h3>
            <div className="space-y-2">
              {[
                { event: 'CPI Data Release', date: 'Feb 14, 2026', impact: 'High' },
                { event: 'FOMC Minutes', date: 'Feb 19, 2026', impact: 'High' },
                { event: 'Jobless Claims', date: 'Feb 20, 2026', impact: 'Medium' },
                { event: 'PMI Composite', date: 'Feb 21, 2026', impact: 'Medium' },
                { event: 'Consumer Sentiment', date: 'Feb 21, 2026', impact: 'Low' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0 text-xs">
                  <div>
                    <div>{item.event}</div>
                    <div className="text-[var(--color-text-dim)] text-[10px]">{item.date}</div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    item.impact === 'High' ? 'bg-[var(--color-red-dim)] text-[var(--color-red)]' :
                    item.impact === 'Medium' ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]' :
                    'bg-[var(--color-surface-lighter)] text-[var(--color-text-dim)]'
                  }`}>
                    {item.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { NavLink, Outlet } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { formatTimestamp } from '../utils/format';
import {
  LayoutDashboard, Search, LineChart, Newspaper, Star, Briefcase,
  RefreshCw, Activity,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/screener', icon: Search, label: 'Screener' },
  { to: '/charts', icon: LineChart, label: 'Charts' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
];

export default function Layout() {
  const { lastUpdated, refresh, loading, indices } = useMarket();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-3 gap-1 bg-[var(--color-surface)] border-r border-[var(--color-border)]">
        <div className="flex items-center justify-center w-10 h-10 mb-3 rounded bg-[var(--color-accent)] text-black font-bold text-sm">
          BB
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded text-[10px] gap-0.5 transition-colors ${
                isActive
                  ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-text)]'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top ticker bar */}
        <header className="flex items-center h-8 px-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] gap-4 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 text-[var(--color-accent)] text-xs font-medium mr-2">
            <Activity size={12} />
            <span>LIVE</span>
          </div>
          {indices.slice(0, 8).map((idx) => (
            <div key={idx.symbol} className="flex items-center gap-1.5 whitespace-nowrap text-xs">
              <span className="text-[var(--color-text-muted)]">{idx.shortName || idx.symbol}</span>
              <span className="text-[var(--color-text)]">
                {idx.regularMarketPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={idx.regularMarketChange >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}>
                {idx.regularMarketChange >= 0 ? '+' : ''}
                {idx.regularMarketChangePercent?.toFixed(2)}%
              </span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2 text-[var(--color-text-dim)] text-xs shrink-0">
            <span>{lastUpdated ? formatTimestamp(lastUpdated) : '...'}</span>
            <button
              onClick={refresh}
              className="p-1 rounded hover:bg-[var(--color-surface-light)] transition-colors"
              title="Refresh"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

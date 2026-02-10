import { Outlet, NavLink } from 'react-router-dom';
import { Home, Compass, Users, User, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { setSearchQuery } = useApp();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/clubs', icon: Users, label: 'Book Clubs' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-background text-text">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-light/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <NavLink to="/" className="font-serif text-2xl font-bold text-accent shrink-0">
            shelf.
          </NavLink>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search books, authors..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-surface-lighter pl-10 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 transition-colors ${
                    isActive ? 'text-accent' : 'text-text-muted hover:text-text'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="pt-20 max-w-7xl mx-auto px-4">
        <Outlet />
      </main>
    </div>
  );
}

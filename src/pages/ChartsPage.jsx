import { useState } from 'react';
import PriceChart from '../components/PriceChart';
import { Grid2x2, Plus, X } from 'lucide-react';

const DEFAULT_PANELS = [
  { id: 1, symbol: 'AAPL', range: '1d' },
  { id: 2, symbol: 'MSFT', range: '1d' },
  { id: 3, symbol: 'GOOGL', range: '1d' },
  { id: 4, symbol: 'NVDA', range: '1d' },
];

const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX',
  'AMD', 'CRM', 'JPM', 'V', '^GSPC', '^DJI', 'BTC-USD', 'GC=F',
];

export default function ChartsPage() {
  const [panels, setPanels] = useState(DEFAULT_PANELS);
  const [layout, setLayout] = useState('2x2');

  const addPanel = () => {
    const usedSymbols = panels.map(p => p.symbol);
    const nextSymbol = POPULAR_SYMBOLS.find(s => !usedSymbols.includes(s)) || 'AAPL';
    setPanels(prev => [...prev, {
      id: Date.now(),
      symbol: nextSymbol,
      range: '1d',
    }]);
  };

  const removePanel = (id) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  };

  const updateSymbol = (id, symbol) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, symbol: symbol.toUpperCase() } : p));
  };

  const gridClass = layout === '1x1' ? 'grid-cols-1' :
    layout === '2x1' ? 'grid-cols-2' :
    layout === '2x2' ? 'grid-cols-1 lg:grid-cols-2' :
    layout === '3x2' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
    'grid-cols-1 lg:grid-cols-2';

  const chartHeight = layout === '1x1' ? 500 :
    layout === '2x1' ? 400 :
    layout === '3x2' ? 220 : 280;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Grid2x2 size={14} className="text-[var(--color-accent)]" />
          <span className="text-sm font-medium">Multi-Chart View</span>
        </div>

        <div className="flex gap-1 ml-4">
          {['1x1', '2x1', '2x2', '3x2'].map(l => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                layout === l
                  ? 'bg-[var(--color-accent)] text-black font-medium'
                  : 'bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={addPanel}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] ml-auto"
        >
          <Plus size={12} />
          Add Chart
        </button>
      </div>

      {/* Chart Grid */}
      <div className={`grid ${gridClass} gap-2`}>
        {panels.map(panel => (
          <div key={panel.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={panel.symbol}
                onChange={e => updateSymbol(panel.id, e.target.value)}
                onBlur={e => {
                  if (!e.target.value.trim()) updateSymbol(panel.id, 'AAPL');
                }}
                className="bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded px-2 py-0.5 text-xs text-[var(--color-accent)] font-medium w-24 focus:outline-none focus:border-[var(--color-accent)]"
              />
              <span className="text-[var(--color-text-dim)] text-xs flex-1">
                {panel.symbol}
              </span>
              {panels.length > 1 && (
                <button
                  onClick={() => removePanel(panel.id)}
                  className="p-0.5 rounded hover:bg-[var(--color-surface-light)]"
                >
                  <X size={12} className="text-[var(--color-text-dim)]" />
                </button>
              )}
            </div>
            <PriceChart
              symbol={panel.symbol}
              height={chartHeight}
              showVolume={layout !== '3x2'}
              defaultRange={panel.range}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

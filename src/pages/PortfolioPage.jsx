import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { formatPrice, formatPercent, formatChange, formatMarketCap } from '../utils/format';
import {
  Briefcase, Plus, X, TrendingUp, TrendingDown, DollarSign,
  ArrowUpDown, Filter,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const POSITION_TYPES = ['All', 'stock', 'etf', 'mutual_fund'];
const SIDES = ['All', 'long', 'short'];

const TYPE_LABELS = {
  stock: 'Stock',
  etf: 'ETF',
  mutual_fund: 'Mutual Fund',
  option: 'Option',
  crypto: 'Crypto',
};

const SIDE_LABELS = { long: 'Long', short: 'Short' };

const PIE_COLORS = [
  '#ff8c00', '#2979ff', '#00c853', '#ff1744', '#d500f9',
  '#00e5ff', '#ffd600', '#ff6d00', '#76ff03', '#f50057',
];

function AddPositionForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    symbol: '', name: '', type: 'stock', side: 'long',
    shares: '', avgCost: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.symbol || !form.shares || !form.avgCost) return;
    onAdd({
      symbol: form.symbol.toUpperCase(),
      name: form.name || form.symbol.toUpperCase(),
      type: form.type,
      side: form.side,
      shares: parseFloat(form.shares),
      avgCost: parseFloat(form.avgCost),
      dateAdded: new Date().toISOString().split('T')[0],
    });
    onCancel();
  };

  const inputClass = 'px-2 py-1.5 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]';
  const selectClass = 'px-2 py-1.5 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]';

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-accent)]">Add Position</span>
        <button type="button" onClick={onCancel} className="p-0.5">
          <X size={14} className="text-[var(--color-text-dim)]" />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <input
          type="text" placeholder="Symbol *" value={form.symbol}
          onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
          className={`${inputClass} uppercase`} required
        />
        <input
          type="text" placeholder="Name" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className={inputClass}
        />
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={selectClass}>
          <option value="stock">Stock</option>
          <option value="etf">ETF</option>
          <option value="mutual_fund">Mutual Fund</option>
          <option value="option">Option</option>
          <option value="crypto">Crypto</option>
        </select>
        <select value={form.side} onChange={e => setForm(f => ({ ...f, side: e.target.value }))} className={selectClass}>
          <option value="long">Long (Buy)</option>
          <option value="short">Short (Sell)</option>
        </select>
        <input
          type="number" placeholder="Shares *" step="any" value={form.shares}
          onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
          className={inputClass} required
        />
        <input
          type="number" placeholder="Avg Cost *" step="any" value={form.avgCost}
          onChange={e => setForm(f => ({ ...f, avgCost: e.target.value }))}
          className={inputClass} required
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 rounded text-xs bg-[var(--color-accent)] text-black font-medium hover:opacity-90">
          Add Position
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded text-xs bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function PortfolioSummary({ totalValue, totalCost, totalPnl, totalPnlPercent, totalDayPnl, positionCount }) {
  const isPositive = totalPnl >= 0;
  const isDayPositive = totalDayPnl >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <div className="text-[var(--color-text-dim)] text-[10px] uppercase tracking-wide">Portfolio Value</div>
        <div className="font-mono text-lg font-medium mt-0.5">{formatPrice(totalValue)}</div>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <div className="text-[var(--color-text-dim)] text-[10px] uppercase tracking-wide">Cost Basis</div>
        <div className="font-mono text-lg font-medium mt-0.5">{formatPrice(totalCost)}</div>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <div className="text-[var(--color-text-dim)] text-[10px] uppercase tracking-wide">Total P&L</div>
        <div className={`font-mono text-lg font-medium mt-0.5 ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
          {formatChange(totalPnl)}
        </div>
        <div className={`font-mono text-xs ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
          {formatPercent(totalPnlPercent)}
        </div>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <div className="text-[var(--color-text-dim)] text-[10px] uppercase tracking-wide">Day P&L</div>
        <div className={`font-mono text-lg font-medium mt-0.5 ${isDayPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
          {formatChange(totalDayPnl)}
        </div>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <div className="text-[var(--color-text-dim)] text-[10px] uppercase tracking-wide">Positions</div>
        <div className="font-mono text-lg font-medium mt-0.5">{positionCount}</div>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
        <div className="text-[var(--color-text-dim)] text-[10px] uppercase tracking-wide">Return</div>
        <div className={`font-mono text-lg font-medium mt-0.5 flex items-center gap-1 ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {formatPercent(totalPnlPercent)}
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const {
    positions, loading, totalValue, totalCost, totalPnl, totalPnlPercent, totalDayPnl,
    addPosition, removePosition,
  } = usePortfolio();

  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [filterSide, setFilterSide] = useState('All');
  const [sortKey, setSortKey] = useState('marketValue');
  const [sortDir, setSortDir] = useState('desc');

  // Filter
  let filtered = [...positions];
  if (filterType !== 'All') filtered = filtered.filter(p => p.type === filterType);
  if (filterSide !== 'All') filtered = filtered.filter(p => p.side === filterSide);

  // Sort
  filtered.sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Chart data: allocation by symbol
  const allocationData = positions
    .map(p => ({ name: p.symbol, value: p.marketValue }))
    .sort((a, b) => b.value - a.value);

  // Chart data: P&L by position
  const pnlData = positions
    .map(p => ({ name: p.symbol, pnl: +p.pnl.toFixed(2), fill: p.pnl >= 0 ? '#00c853' : '#ff1744' }))
    .sort((a, b) => b.pnl - a.pnl);

  // Breakdown by type
  const typeBreakdown = {};
  positions.forEach(p => {
    const label = TYPE_LABELS[p.type] || p.type;
    typeBreakdown[label] = (typeBreakdown[label] || 0) + p.marketValue;
  });
  const typeData = Object.entries(typeBreakdown).map(([name, value]) => ({ name, value: +value.toFixed(2) }));

  const SortHeader = ({ label, field, className = '' }) => (
    <th
      className={`px-2 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)] select-none whitespace-nowrap ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === field && <ArrowUpDown size={10} className="text-[var(--color-accent)]" />}
      </div>
    </th>
  );

  if (loading && !positions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-muted)]">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Briefcase size={16} className="text-[var(--color-accent)]" />
        <h1 className="text-sm font-medium">Portfolio</h1>

        <div className="flex gap-1 ml-4">
          {POSITION_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                filterType === t
                  ? 'bg-[var(--color-accent)] text-black font-medium'
                  : 'bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {t === 'All' ? 'All' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {SIDES.map(s => (
            <button
              key={s}
              onClick={() => setFilterSide(s)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                filterSide === s
                  ? 'bg-[var(--color-accent)] text-black font-medium'
                  : 'bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {s === 'All' ? 'All Sides' : SIDE_LABELS[s]}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--color-accent)] text-black font-medium hover:opacity-90 ml-auto"
        >
          <Plus size={12} /> Add Position
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <AddPositionForm onAdd={addPosition} onCancel={() => setShowAddForm(false)} />
      )}

      {/* Summary Cards */}
      <PortfolioSummary
        totalValue={totalValue}
        totalCost={totalCost}
        totalPnl={totalPnl}
        totalPnlPercent={totalPnlPercent}
        totalDayPnl={totalDayPnl}
        positionCount={positions.length}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Allocation Pie */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
          <div className="text-xs font-medium mb-2">Allocation by Symbol</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={allocationData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                strokeWidth={1} stroke="#1a1a1a"
              >
                {allocationData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, fontSize: 11 }}
                formatter={(value) => [formatPrice(value), 'Value']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {allocationData.slice(0, 8).map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[var(--color-text-muted)]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* P&L Bar Chart */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
          <div className="text-xs font-medium mb-2">P&L by Position</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pnlData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis type="number" tick={{ fill: '#555', fontSize: 10 }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} width={45} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, fontSize: 11 }}
                formatter={(value) => [formatPrice(value), 'P&L']}
              />
              <Bar dataKey="pnl" radius={[0, 3, 3, 0]}>
                {pnlData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown by Type */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3">
          <div className="text-xs font-medium mb-2">Allocation by Type</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={typeData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                strokeWidth={1} stroke="#1a1a1a"
              >
                {typeData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, fontSize: 11 }}
                formatter={(value) => [formatPrice(value), 'Value']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {typeData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[(i + 3) % PIE_COLORS.length] }} />
                <span className="text-[var(--color-text-muted)]">{d.name}</span>
                <span className="text-[var(--color-text-dim)]">({((d.value / totalValue) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-light)]">
              <tr>
                <SortHeader label="Symbol" field="symbol" />
                <SortHeader label="Name" field="name" />
                <th className="px-2 py-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Type</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Side</th>
                <SortHeader label="Shares" field="shares" />
                <SortHeader label="Avg Cost" field="avgCost" />
                <SortHeader label="Price" field="currentPrice" />
                <SortHeader label="Mkt Value" field="marketValue" />
                <SortHeader label="Cost Basis" field="costBasis" />
                <SortHeader label="P&L" field="pnl" />
                <SortHeader label="P&L %" field="pnlPercent" />
                <SortHeader label="Day P&L" field="dayPnl" />
                <th className="px-2 py-2 text-left text-xs font-medium text-[var(--color-text-muted)]">Weight</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(pos => {
                const isPnlPositive = pos.pnl >= 0;
                const isDayPositive = pos.dayPnl >= 0;
                const weight = totalValue > 0 ? ((pos.marketValue / totalValue) * 100).toFixed(1) : '0.0';

                return (
                  <tr
                    key={pos.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-light)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/stock/${pos.symbol}`)}
                  >
                    <td className="px-2 py-1.5 text-xs font-medium text-[var(--color-accent)]">{pos.symbol}</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--color-text-muted)] truncate max-w-[140px]">{pos.name}</td>
                    <td className="px-2 py-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        pos.type === 'etf' ? 'bg-[var(--color-blue-dim)] text-[var(--color-blue)]' :
                        pos.type === 'mutual_fund' ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]' :
                        pos.type === 'crypto' ? 'bg-[rgba(213,0,249,0.15)] text-[var(--color-purple)]' :
                        'bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)]'
                      }`}>
                        {TYPE_LABELS[pos.type] || pos.type}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        pos.side === 'short'
                          ? 'bg-[var(--color-red-dim)] text-[var(--color-red)]'
                          : 'bg-[var(--color-green-dim)] text-[var(--color-green)]'
                      }`}>
                        {SIDE_LABELS[pos.side]}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-xs font-mono">{pos.shares}</td>
                    <td className="px-2 py-1.5 text-xs font-mono text-[var(--color-text-muted)]">{formatPrice(pos.avgCost)}</td>
                    <td className="px-2 py-1.5 text-xs font-mono">{formatPrice(pos.currentPrice)}</td>
                    <td className="px-2 py-1.5 text-xs font-mono">{formatPrice(pos.marketValue)}</td>
                    <td className="px-2 py-1.5 text-xs font-mono text-[var(--color-text-muted)]">{formatPrice(pos.costBasis)}</td>
                    <td className={`px-2 py-1.5 text-xs font-mono ${isPnlPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {formatChange(pos.pnl)}
                    </td>
                    <td className={`px-2 py-1.5 text-xs font-mono ${isPnlPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {formatPercent(pos.pnlPercent)}
                    </td>
                    <td className={`px-2 py-1.5 text-xs font-mono ${isDayPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {formatChange(pos.dayPnl)}
                    </td>
                    <td className="px-2 py-1.5 text-xs font-mono text-[var(--color-text-dim)]">{weight}%</td>
                    <td className="px-2 py-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => removePosition(pos.id)}
                        className="p-0.5 rounded hover:bg-[var(--color-surface-lighter)]"
                        title="Remove position"
                      >
                        <X size={12} className="text-[var(--color-text-dim)]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

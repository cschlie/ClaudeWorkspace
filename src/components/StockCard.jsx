import { useNavigate } from 'react-router-dom';
import { formatPrice, formatPercent, formatChange } from '../utils/format';
import MiniChart from './MiniChart';

export default function StockCard({ quote }) {
  const navigate = useNavigate();
  const isPositive = (quote.regularMarketChange || 0) >= 0;

  return (
    <div
      onClick={() => navigate(`/stock/${quote.symbol}`)}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3 cursor-pointer hover:border-[var(--color-border-light)] transition-colors"
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="font-medium text-[var(--color-accent)] text-sm">{quote.symbol}</div>
          <div className="text-[var(--color-text-muted)] text-xs truncate max-w-[120px]">
            {quote.shortName}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">{formatPrice(quote.regularMarketPrice)}</div>
          <div className={`text-xs font-mono ${isPositive ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
            {formatChange(quote.regularMarketChange)} ({formatPercent(quote.regularMarketChangePercent)})
          </div>
        </div>
      </div>
      <MiniChart
        symbol={quote.symbol}
        height={50}
        color={isPositive ? '#00c853' : '#ff1744'}
      />
    </div>
  );
}

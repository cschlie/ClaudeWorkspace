import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { getChart } from '../services/api';

const RANGES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' },
];

export default function PriceChart({ symbol, height = 300, showVolume = true, showControls = true, defaultRange = '1d' }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [activeRange, setActiveRange] = useState(defaultRange);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#111111' },
        textColor: '#888888',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#ff8c00', width: 1, style: 2 },
        horzLine: { color: '#ff8c00', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
      },
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: activeRange === '1d' || activeRange === '5d',
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    });

    let volumeSeries = null;
    if (showVolume) {
      volumeSeries = chart.addHistogramSeries({
        color: '#2979ff',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
    }

    const rangeConfig = RANGES.find(r => r.range === activeRange) || RANGES[0];

    setLoading(true);
    getChart(symbol, rangeConfig.range, rangeConfig.interval).then(data => {
      if (!data.length) return;

      const candleData = data.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      candlestickSeries.setData(candleData);

      if (volumeSeries) {
        const volData = data.map(d => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(0,200,83,0.3)' : 'rgba(255,23,68,0.3)',
        }));
        volumeSeries.setData(volData);
      }

      chart.timeScale().fitContent();
      setLoading(false);
    });

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, activeRange, height, showVolume]);

  return (
    <div className="relative">
      {showControls && (
        <div className="flex gap-1 mb-2">
          {RANGES.map(r => (
            <button
              key={r.range}
              onClick={() => setActiveRange(r.range)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                activeRange === r.range
                  ? 'bg-[var(--color-accent)] text-black font-medium'
                  : 'bg-[var(--color-surface-lighter)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-surface)]/50">
          <div className="text-[var(--color-text-muted)] text-xs">Loading chart...</div>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

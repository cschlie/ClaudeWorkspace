import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { getChart } from '../services/api';

export default function MiniChart({ symbol, height = 60, color = '#2979ff' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { mode: 0, vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineColor: color,
      topColor: `${color}40`,
      bottomColor: `${color}05`,
      lineWidth: 1.5,
      crosshairMarkerVisible: false,
    });

    getChart(symbol, '1d', '5m').then(data => {
      if (!data.length) return;
      series.setData(data.map(d => ({ time: d.time, value: d.close })));
      chart.timeScale().fitContent();
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
  }, [symbol, height, color]);

  return <div ref={containerRef} />;
}

'use client';

import React, { useState } from 'react';
import InteractiveChart from './InteractiveChart';

interface TickerWithChartProps {
  symbol: string;
  children: React.ReactNode;
  className?: string;
  defaultTimeRange?: string;
}

const TickerWithChart: React.FC<TickerWithChartProps> = ({
  symbol,
  children,
  className = '',
  defaultTimeRange = '1y'
}) => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className={className}>
      <div
        onClick={() => setShowChart(!showChart)}
        className="cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-2"
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowChart(!showChart);
          }
        }}
      >
        {children}
        <svg
          className={`w-4 h-4 transition-transform ${showChart ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {showChart && (
        <InteractiveChart
          symbol={symbol}
          initialTimeRange={defaultTimeRange}
          onClose={() => setShowChart(false)}
        />
      )}
    </div>
  );
};

export default TickerWithChart;

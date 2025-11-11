'use client';

import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
import TimeRangeSelector from './TimeRangeSelector';
import { api } from '@/lib/api';

interface DataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoricalData {
  symbol: string;
  time_range: string;
  granularity: string;
  data: DataPoint[];
}

interface InteractiveChartProps {
  symbol: string;
  initialTimeRange?: string;
  onClose?: () => void;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  symbol,
  initialTimeRange = '1y',
  onClose
}) => {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api(
          `/market/ticker/${symbol}/history?time_range=${timeRange}`
        );
        setData(response);
      } catch (err) {
        setError('Failed to load chart data');
        console.error('Error fetching historical data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol, timeRange]);

  const chartData = data?.data.map(d => ({
    date: d.date,
    value: d.close
  })) || [];

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    lineStyle: {
      lineWidth: 2,
    },
    color: '#3b82f6',
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: true,
      },
    },
    yAxis: {
      label: {
        formatter: (v: string) => `$${parseFloat(v).toFixed(2)}`,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Price',
          value: `$${datum.value.toFixed(2)}`,
        };
      },
    },
    point: {
      size: 3,
      shape: 'circle',
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {symbol} Price History
          </h3>
          <p className="text-sm text-gray-500">
            {data?.granularity === 'weekly' ? 'Weekly' : 'Monthly'} granularity
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close chart"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <div className="h-80">
          <Line {...config} />
        </div>
      )}

      {!loading && !error && chartData.length === 0 && (
        <div className="flex justify-center items-center h-80 text-gray-500">
          No data available for this time range
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;

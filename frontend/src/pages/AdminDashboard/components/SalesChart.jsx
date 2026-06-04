import React, { useMemo } from 'react';
import './SalesChart.css';

export default function SalesChart({ orders }) {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        sales: [0, 0, 0, 0, 0, 0],
        revenue: [0, 0, 0, 0, 0, 0],
      };
    }

    console.log('📊 Processing chart data for orders:', orders.length);

    // Get last 6 months
    const now = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      last6Months.push({ key: monthKey, name: monthName, orders: 0, revenue: 0 });
    }

    // Group orders by month
    orders.forEach(order => {
      const date = new Date(order.orderDate || order.createdAt || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = last6Months.find(m => m.key === monthKey);
      if (monthData) {
        monthData.orders += 1;
        // Backend uses totalPrice field
        const price = parseFloat(order.totalPrice || order.totalAmount || order.total || 0);
        monthData.revenue += price;
      }
    });

    console.log('📊 Chart monthly data:', last6Months);

    return {
      months: last6Months.map(m => m.name),
      sales: last6Months.map(m => m.orders),
      revenue: last6Months.map(m => m.revenue),
    };
  }, [orders]);

  const maxValue = Math.max(...chartData.sales, ...chartData.revenue, 10);
  const chartHeight = 250;

  const formatYAxis = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value}`;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Sales Overview</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#10b981' }}></span>
            Orders ({chartData.sales.reduce((a, b) => a + b, 0)})
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
            Revenue (${chartData.revenue.reduce((a, b) => a + b, 0).toFixed(0)})
          </span>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-y-axis">
          <span>{formatYAxis(maxValue)}</span>
          <span>{formatYAxis(maxValue / 2)}</span>
          <span>$0</span>
        </div>

        <div className="chart-content">
          <svg className="chart-svg" viewBox={`0 0 ${chartData.months.length * 100} ${chartHeight}`}>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`grid-${i}`}
                x1="0"
                y1={i * (chartHeight / 4)}
                x2={chartData.months.length * 100}
                y2={i * (chartHeight / 4)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* Sales line */}
            <polyline
              points={chartData.sales.map((val, i) => 
                `${i * 100 + 50},${chartHeight - (val / maxValue) * chartHeight}`
              ).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Revenue line */}
            <polyline
              points={chartData.revenue.map((val, i) => 
                `${i * 100 + 50},${chartHeight - (val / maxValue) * chartHeight}`
              ).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points for Sales */}
            {chartData.sales.map((val, i) => (
              <circle
                key={`sales-point-${i}`}
                cx={i * 100 + 50}
                cy={chartHeight - (val / maxValue) * chartHeight}
                r="5"
                fill="#10b981"
                stroke="white"
                strokeWidth="2"
              />
            ))}

            {/* Data points for Revenue */}
            {chartData.revenue.map((val, i) => (
              <circle
                key={`revenue-point-${i}`}
                cx={i * 100 + 50}
                cy={chartHeight - (val / maxValue) * chartHeight}
                r="5"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>

          <div className="chart-x-axis">
            {chartData.months.map((month, i) => (
              <span key={i}>{month}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

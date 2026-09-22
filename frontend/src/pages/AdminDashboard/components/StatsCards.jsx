import React from 'react';
import './StatsCards.css';

export default function StatsCards({ stats, books, orders, users }) {
  // Calculate revenue from orders
  const totalRevenue = orders?.reduce((sum, order) => {
    return sum + (parseFloat(order.totalPrice || 0));
  }, 0) || 0;

  const cards = [
    {
      title: 'Total Books',
      value: books?.length || stats?.books || 0,
      icon: '📚',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Total Users',
      value: users?.length || stats?.users || 0,
      icon: '👥',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'Total Orders',
      value: orders?.length || stats?.orders || 0,
      icon: '🛒',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: '💰',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
  ];

  return (
    <div className="stats-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className="stat-card"
          style={{ '--card-color': card.color, '--card-bg': card.bgColor }}
        >
          <div className="stat-icon-wrapper">
            <div className="stat-icon">{card.icon}</div>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">{card.title}</h3>
            <p className="stat-value">{card.value}</p>
          </div>
          <div className="stat-trend">
            <span className="trend-indicator up">↑ 12%</span>
            <span className="trend-label">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}

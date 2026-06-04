import React from 'react';
import './UserStatistics.css';

export default function UserStatistics({ users }) {
  const stats = [
    {
      label: 'Active Users',
      value: users?.filter(u => u.enabled !== false).length || 0,
      icon: '👥',
      color: '#3b82f6',
    },
    {
      label: 'New Signups',
      value: users?.filter(u => {
        const createdDate = new Date(u.createdAt || u.registeredAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate > thirtyDaysAgo;
      }).length || 0,
      icon: '➕',
      color: '#10b981',
    },
    {
      label: 'Admins',
      value: users?.filter(u => u.role === 'ADMIN').length || 0,
      icon: '🛡️',
      color: '#8b5cf6',
    },
    {
      label: 'Banned Users',
      value: users?.filter(u => u.enabled === false).length || 0,
      icon: '🚫',
      color: '#ef4444',
    },
  ];

  return (
    <div className="user-stats-card">
      <h3 className="user-stats-title">User Statistics</h3>
      
      <div className="user-stats-list">
        {stats.map((stat, index) => (
          <div key={index} className="user-stat-item">
            <div className="user-stat-icon" style={{ background: `${stat.color}20` }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div className="user-stat-content">
              <span className="user-stat-label">{stat.label}</span>
              <span className="user-stat-value">{stat.value.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="user-stats-chart">
        <div className="pie-chart">
          {users && users.length > 0 ? (
            <>
              <svg viewBox="0 0 100 100" className="pie-svg">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${(stats[0].value / users.length * 100) * 2.51} 251.2`}
                  transform="rotate(-90 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${(stats[1].value / users.length * 100) * 2.51} 251.2`}
                  strokeDashoffset={`-${(stats[0].value / users.length * 100) * 2.51}`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="pie-center">
                <span className="pie-total">{users.length}</span>
                <span className="pie-label">Total</span>
              </div>
            </>
          ) : (
            <div className="no-data">No user data</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import './Sidebar.css';

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'books', label: 'Books', icon: '📚' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">📖</span>
          <span className="logo-text">BookStore</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item logout-btn" onClick={onLogout}>
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

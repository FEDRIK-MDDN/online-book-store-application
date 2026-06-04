import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { adminApi } from '../../api';
import StatsCards from './components/StatsCards';
import SalesChart from './components/SalesChart';
import RecentOrders from './components/RecentOrders';
import TopSellingBooks from './components/TopSellingBooks';
import UserStatistics from './components/UserStatistics';
import Sidebar from './components/Sidebar';
import BookManagement from '../BookManagement/BookManagement';
import UsersManagement from './components/UsersManagement';
import OrdersManagement from './components/OrdersManagement';
import CategoriesManagement from './components/CategoriesManagement';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stats, books, orders, users, categories] = await Promise.all([
        adminApi.getDashboardStats(user.token),
        adminApi.getBooks(user.token),
        adminApi.getOrders(user.token),
        adminApi.getUsers(user.token),
        adminApi.getCategories(user.token)
      ]);

      setDashboardData({
        stats,
        books,
        orders,
        users,
        categories
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'ADMIN') {
      navigate('/login', { replace: true });
      return;
    }
    fetchDashboardData();
  }, [user, navigate, fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await adminApi.logout(user.token);
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn--primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        onLogout={handleLogout}
      />
      
      <div className="admin-main">
        <header className="admin-header">
          <h1>
            <span className="dashboard-icon">📊</span> Admin Dashboard
          </h1>
          <div className="admin-header-right">
            <span className="welcome-text">Welcome, Admin!</span>
            <div className="notification-icon">
              🔔
              <span className="notification-badge">3</span>
            </div>
            <div className="admin-profile-icon">
              <img 
                src={user.profileImage || 'https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff'} 
                alt="Admin"
              />
            </div>
            <button className="menu-btn">☰</button>
          </div>
        </header>

        <div className="admin-content">
          {activeView === 'dashboard' && (
            <>
              <StatsCards 
                stats={dashboardData?.stats} 
                books={dashboardData?.books}
                orders={dashboardData?.orders}
                users={dashboardData?.users}
              />
              
              <div className="dashboard-grid">
                <div className="dashboard-grid-left">
                  <SalesChart orders={dashboardData?.orders} />
                  <TopSellingBooks books={dashboardData?.books} />
                </div>
                
                <div className="dashboard-grid-right">
                  <RecentOrders orders={dashboardData?.orders} />
                  <UserStatistics users={dashboardData?.users} />
                </div>
              </div>
            </>
          )}

          {activeView === 'books' && (
            <BookManagement />
          )}

          {activeView === 'orders' && (
            <OrdersManagement />
          )}

          {activeView === 'users' && (
            <UsersManagement />
          )}

          {activeView === 'categories' && (
            <CategoriesManagement />
          )}

          {activeView === 'reports' && (
            <div className="view-placeholder">
              <h2>📈 Reports</h2>
              <p>Reports interface coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

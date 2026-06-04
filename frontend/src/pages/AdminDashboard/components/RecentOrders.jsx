import React from 'react';
import './RecentOrders.css';

export default function RecentOrders({ orders }) {
  const recentOrders = orders?.slice(-5).reverse() || [];

  const getStatusClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('deliver')) return 'delivered';
    if (statusLower.includes('ship')) return 'shipped';
    if (statusLower.includes('process')) return 'processing';
    if (statusLower.includes('pend')) return 'pending';
    if (statusLower.includes('cancel')) return 'cancelled';
    if (statusLower.includes('complete')) return 'delivered';
    return 'pending';
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  return (
    <div className="recent-orders-card">
      <div className="orders-header">
        <h3>Recent Orders</h3>
        <button className="view-all-btn">
          View All <span>→</span>
        </button>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No orders yet</td>
              </tr>
            ) : (
              recentOrders.map((order, index) => (
                <tr key={order.id || index}>
                  <td className="order-id">#{order.id || order.orderId || 1000 + index}</td>
                  <td className="customer-name">
                    {order.user?.name || order.userName || order.customerName || order.user?.email || order.userEmail || 'Customer'}
                  </td>
                  <td className="order-date">
                    {formatDate(order.orderDate || order.createdAt)}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.orderStatus || order.status)}`}>
                      {formatStatus(order.orderStatus || order.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {recentOrders.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>No recent orders to display</p>
        </div>
      )}
    </div>
  );
}

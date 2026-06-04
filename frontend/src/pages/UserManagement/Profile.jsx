import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api from '../../api';
import './Profile.css';

export default function Profile() {
  const { user, logout, updateUser, token } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    username: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    profileImage: user?.profileImage || ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'orders', 'billing'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch current user data on component mount ONLY ONCE
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:8080/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (updateUser) {
            updateUser(userData);
          }
          
          // Construct full image URL if needed
          let imageUrl = userData.profileImage || userData.profileImageUrl || '';
          if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            imageUrl = `http://localhost:8080${imageUrl}`;
          }
          
          setProfileData({
            firstName: userData.name?.split(' ')[0] || '',
            lastName: userData.name?.split(' ').slice(1).join(' ') || '',
            username: userData.email?.split('@')[0] || '',
            email: userData.email || '',
            profileImage: imageUrl
          });
          setDataLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    if (token && !dataLoaded) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Only JPG, PNG, GIF, and WEBP images are allowed');
        return;
      }
      
      // Validate file size (8MB)
      if (file.size > 8 * 1024 * 1024) {
        setMessage('Image must be under 8MB');
        return;
      }
      
      // Show preview immediately
      const imageUrl = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, profileImage: imageUrl }));
      setMessage('Uploading image...');
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:8080/users/me/profile-image/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          const updatedUser = await response.json();
          const serverImagePath = updatedUser.profileImage || updatedUser.profileImageUrl;
          let fullImageUrl;
          
          if (serverImagePath) {
            if (serverImagePath.startsWith('http://') || serverImagePath.startsWith('https://')) {
              fullImageUrl = serverImagePath;
            } else {
              fullImageUrl = `http://localhost:8080${serverImagePath}`;
            }
          } else {
            fullImageUrl = imageUrl;
          }
          
          setProfileData(prev => ({ ...prev, profileImage: fullImageUrl }));
          
          if (updateUser) {
            updateUser({ ...updatedUser, profileImage: fullImageUrl });
          }
          
          setMessage('Profile image updated successfully!');
          setTimeout(() => setMessage(''), 3000);
        } else {
          setMessage('Failed to upload image');
          setProfileData(prev => ({ ...prev, profileImage: user?.profileImage || '' }));
        }
      } catch (error) {
        console.error('Error uploading profile image:', error);
        setMessage(`Error uploading profile image: ${error.message}`);
        setProfileData(prev => ({ ...prev, profileImage: user?.profileImage || '' }));
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage('');
    try {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      const response = await fetch('http://localhost:8080/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: fullName,
          email: profileData.email,
          username: profileData.username,
          profileImage: profileData.profileImage
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        if (updateUser) {
          updateUser(updatedUser);
        }
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    if (!passwordData.currentPassword) {
      setMessage('Please enter your current password');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:8080/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setMessage('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorText = await response.text();
        setMessage(errorText || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage('Error updating password');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const ordersData = await api.getUserOrders(token);
      
      // Handle different response formats
      let ordersArray = [];
      if (Array.isArray(ordersData)) {
        ordersArray = ordersData;
      } else if (ordersData && typeof ordersData === 'object') {
        ordersArray = ordersData.orders || ordersData.data || ordersData.content || [];
        if (ordersArray.length === 0 && ordersData.id) {
          ordersArray = [ordersData];
        }
      }
      
      setOrders(ordersArray);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    try {
      await api.cancelOrder(token, orderId);
      alert('Order cancelled successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert(`Failed to cancel order: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }
    try {
      await api.deleteOrder(token, orderId);
      alert('Order deleted successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert(`Failed to delete order: ${error.message || 'Unknown error'}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const getStatusClass = (status) => {
    if (status === 'delivered' || status === 'completed') return 'status-delivered';
    if (status === 'cancelled') return 'status-cancelled';
    if (status === 'processing' || status === 'pending') return 'status-processing';
    return '';
  };

  const viewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const downloadInvoicePDF = () => {
    if (!selectedOrder) return;

    const invoiceContent = document.getElementById('invoice-content');
    if (!invoiceContent) return;

    // Simple approach: open print dialog
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${selectedOrder.orderNumber || selectedOrder.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-header h1 { margin: 0; color: #333; }
            .invoice-info { margin-bottom: 20px; }
            .invoice-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total-row { font-weight: bold; font-size: 1.1em; }
          </style>
        </head>
        <body>
          ${invoiceContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const calculateOrderTotal = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const price = item.unitPrice || item.price || 0;
      return sum + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleBuyNowClick = async (item) => {
    // Extract book details from order item
    const book = item.book || item;
    const bookDetails = {
      id: book.id || item.bookId,
      title: book.title || item.bookTitle || 'Untitled Book',
      author: book.author || item.author || 'Unknown',
      price: item.unitPrice || item.price || book.price || 0,
      imageUrl: book.imageUrl || item.imageUrl,
      description: book.description || 'No description available',
      available: book.available !== false,
      stock: book.stock || 999,
      rating: book.rating,
      createdAt: book.createdAt
    };
    
    setSelectedBook(bookDetails);
    setQuantity(1);
    setShowBuyModal(true);
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
    setSelectedBook(null);
    setQuantity(1);
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const newQty = prev + delta;
      return newQty < 1 ? 1 : (selectedBook?.stock && newQty > selectedBook.stock ? selectedBook.stock : newQty);
    });
  };

  const handleConfirmAddToCart = async () => {
    if (selectedBook) {
      if (!user || !token) {
        alert('Please login to add items to cart');
        navigate('/login');
        return;
      }

      try {
        // Add to cart via backend API
        await api.addToCart(token, selectedBook.id, quantity);
        
        handleCloseBuyModal();
        
        // Navigate to cart page
        navigate('/cart');
      } catch (err) {
        console.error('Failed to add to cart:', err);
        alert('Failed to add item to cart. Please try again.');
      }
    }
  };

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="modern-profile-page">
      {/* Sidebar */}
      <div className="profile-sidebar">
        <div className="sidebar-header">
          <div className="user-avatar-large">
            {profileData.profileImage ? (
              <img src={profileData.profileImage} alt={user.name} />
            ) : (
              <div className="avatar-placeholder-icon">
                <svg viewBox="0 0 24 24" fill="white" width="60" height="60">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
            <label htmlFor="imageUpload" className="avatar-upload-overlay">
              <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13h3v-3h3V7H7V4H4v3H1v3h3v3zm8-6c1.66 0 3-1.34 3-3S13.66 1 12 1 9 2.34 9 4s1.34 3 3 3z"/>
              </svg>
            </label>
          </div>
          <div className="welcome-text">Welcome, {profileData.firstName || user.name}</div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('orders');
              loadOrders();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
            <span>My Orders</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveView('billing')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
            </svg>
            <span>Billing & Payment</span>
          </button>
        </nav>

        <Link to="/home" className="home-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>Home</span>
        </Link>

        <button className="logout-btn" onClick={onLogout}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          <span>Log Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        <div className="content-wrapper">
          {activeView === 'dashboard' && (
            <>
              <h2 className="page-title">Your personal profile info</h2>

              {message && (
                <div className={`alert-message ${message.includes('success') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}

          {/* Profile Section */}
          <div className="info-section">
            <div className="section-header">
              <span className="section-number">1</span>
              <h3 className="section-title">PROFILE</h3>
            </div>

            <div className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    placeholder="Name"
                  />
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    placeholder="Surname"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Username (not your e-mail)</label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
                <div className="form-group">
                  <label>Your e-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    placeholder="mail@example.com"
                  />
                </div>
              </div>

              <button 
                className="save-data-btn" 
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Correct Save data'}
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div className="info-section">
            <div className="section-header">
              <span className="section-number">2</span>
              <h3 className="section-title">PASSWORD</h3>
            </div>

            <div className="form-grid">
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Current password *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••••"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>New password *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm new password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••••"
                  />
                </div>
              </div>

              <button 
                className="save-data-btn" 
                onClick={handleSavePassword}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Correct Save data'}
              </button>
            </div>
          </div>

              {/* Hidden file input for profile image */}
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </>
          )}

          {/* Orders View */}
          {activeView === 'orders' && (
            <div className="orders-section">
              <h2 className="page-title">My Orders</h2>
              
              {loadingOrders ? (
                <div className="loading-message">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="empty-orders">
                  <h3>No orders found</h3>
                  <p>You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-header-info">
                        <div className="order-details-header">
                          <p className="order-number">Order : #{order.orderNumber || order.id}</p>
                          <p className="order-date">Order Payment : {formatDate(order.orderDate || order.createdAt)}</p>
                        </div>
                        <div className="order-actions-top">
                          <button 
                            className="btn-show-invoice"
                            onClick={() => viewInvoice(order)}
                          >
                            Show Invoice
                          </button>
                        </div>
                      </div>

                      <div className="order-items">
                        {order.items && order.items.map((item, index) => {
                          const book = item.book || item;
                          const bookTitle = book.title || item.bookTitle || 'Untitled Book';
                          const author = book.author || item.author || 'Unknown';
                          const imageUrl = book.imageUrl || item.imageUrl;
                          const price = item.unitPrice || item.price || 0;
                          
                          return (
                            <div key={index} className="order-item">
                              <div className="item-image">
                                <img 
                                  src={getImageUrl(imageUrl) || '/images/book-placeholder.jpg'} 
                                  alt={bookTitle}
                                  onError={(e) => { e.target.src = '/images/book-placeholder.jpg'; }}
                                />
                              </div>
                              <div className="item-details">
                                <h3 className="item-name">{bookTitle}</h3>
                                <p className="item-author">By: {author}</p>
                                <div className="item-specs">
                                  <span>Qty: {item.quantity}</span>
                                  <span className="item-price">Price LKR {(price * item.quantity).toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="item-status-info">
                                <div className="status-group">
                                  <span className="status-label">Status</span>
                                  <span className={`status-value ${getStatusClass(order.orderStatus)}`}>
                                    {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1) || 'Pending'}
                                  </span>
                                </div>
                                <div className="delivery-group">
                                  <span className="delivery-label">Delivery Expected by</span>
                                  <span className="delivery-date">{formatDate(order.expectedDeliveryDate || order.orderDate)}</span>
                                </div>
                                <button 
                                  className="btn-buy-again"
                                  onClick={() => handleBuyNowClick(item)}
                                  title="Buy this book again"
                                >
                                  🛒 Buy Again
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="order-footer">
                        <div className="order-actions-bottom">
                          {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                            <button 
                              className="btn-cancel-order"
                              onClick={() => cancelOrder(order.id)}
                            >
                              ✕ cancel order
                            </button>
                          )}
                          <button 
                            className="btn-delete-order"
                            onClick={() => deleteOrder(order.id)}
                          >
                            🗑️ delete order
                          </button>
                        </div>
                        <div className="order-payment-status">
                          Payment Is {order.paymentStatus === 'completed' ? 'Successful!' : order.paymentStatus}
                        </div>
                        <div className="order-total">
                          Total Price: <strong>LKR {order.totalPrice || (order.items?.reduce((sum, item) => sum + (item.unitPrice || item.price || 0) * item.quantity, 0).toFixed(2))}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Views Placeholder */}
          {activeView === 'billing' && (
            <div>
              <h2 className="page-title">Billing & Payment</h2>
              <p>Coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invoice</h2>
              <button className="close-btn" onClick={() => setShowInvoiceModal(false)}>✕</button>
            </div>
            
            <div id="invoice-content" className="invoice-content">
              <div className="invoice-header">
                <h1>📚 BOOKS Online Store</h1>
                <p style={{fontSize: '14px', margin: '10px 0'}}>123 Main Street, Colombo 00100, Sri Lanka</p>
                <p style={{fontSize: '14px', margin: '5px 0'}}>Phone: +94 11 234 5678 | Email: info@bookstore.lk</p>
                <p style={{fontSize: '18px', fontWeight: 'bold', marginTop: '15px'}}>Invoice #{selectedOrder.orderNumber || selectedOrder.id}</p>
              </div>

              <div className="invoice-info" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div>
                  <h3 style={{marginBottom: '10px', color: '#0ea5e9'}}>Customer Information</h3>
                  <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                  <p><strong>Order Date:</strong> {formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <h3 style={{marginBottom: '10px', color: '#0ea5e9'}}>Payment & Delivery</h3>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod?.toUpperCase() || 'N/A'}</p>
                  <p><strong>Payment Status:</strong> <span style={{color: selectedOrder.paymentStatus === 'completed' ? 'green' : 'orange'}}>{selectedOrder.paymentStatus?.toUpperCase() || 'N/A'}</span></p>
                  <p><strong>Order Status:</strong> <span style={{color: selectedOrder.orderStatus === 'completed' ? 'green' : selectedOrder.orderStatus === 'cancelled' ? 'red' : 'orange'}}>{selectedOrder.orderStatus?.toUpperCase() || 'N/A'}</span></p>
                  <p><strong>Expected Delivery:</strong> {formatDate(selectedOrder.expectedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Author</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.map((item, index) => {
                    const book = item.book || item;
                    const bookTitle = book.title || item.bookTitle || 'Untitled Book';
                    const author = book.author || item.author || 'Unknown';
                    const unitPrice = item.unitPrice || item.price || 0;
                    const quantity = item.quantity || 1;
                    const total = unitPrice * quantity;
                    
                    return (
                      <tr key={index}>
                        <td>{bookTitle}</td>
                        <td>{author}</td>
                        <td>{quantity}</td>
                        <td>LKR {unitPrice.toFixed(2)}</td>
                        <td>LKR {total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{borderTop: '2px solid #e5e7eb'}}>
                    <td colSpan="4" style={{textAlign: 'right', paddingTop: '15px'}}><strong>Subtotal:</strong></td>
                    <td style={{paddingTop: '15px'}}><strong>LKR {(selectedOrder.totalPrice || calculateOrderTotal(selectedOrder.items))}</strong></td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{textAlign: 'right'}}>Shipping:</td>
                    <td>LKR 0.00</td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{textAlign: 'right'}}>Tax (0%):</td>
                    <td>LKR 0.00</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="4" style={{textAlign: 'right', fontSize: '1.2em'}}>Total Amount:</td>
                    <td style={{fontSize: '1.2em'}}><strong>LKR {(selectedOrder.totalPrice || calculateOrderTotal(selectedOrder.items))}</strong></td>
                  </tr>
                </tfoot>
              </table>

              <div className="invoice-footer">
                <div style={{marginTop: '40px', padding: '20px', background: '#f9fafb', borderRadius: '8px'}}>
                  <h4 style={{marginBottom: '10px', color: '#0ea5e9'}}>Terms & Conditions</h4>
                  <ul style={{fontSize: '12px', color: '#6b7280', lineHeight: '1.8', paddingLeft: '20px'}}>
                    <li>All sales are final. Returns accepted within 14 days with receipt.</li>
                    <li>Damaged items must be reported within 48 hours of delivery.</li>
                    <li>Delivery time is 5-7 business days from order confirmation.</li>
                    <li>Payment must be completed before shipment for online orders.</li>
                  </ul>
                </div>
                <p style={{textAlign: 'center', marginTop: '30px', color: '#0ea5e9', fontSize: '16px', fontWeight: 'bold'}}>
                  Thank you for your purchase!
                </p>
                <p style={{textAlign: 'center', marginTop: '10px', color: '#6b7280', fontSize: '12px'}}>
                  For any queries, please contact us at support@bookstore.lk or call +94 11 234 5678
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{marginTop: '20px', textAlign: 'center'}}>
              <button className="btn btn--primary" onClick={downloadInvoicePDF} style={{marginRight: '10px'}}>
                📥 Download PDF
              </button>
              <button className="btn btn--outline" onClick={() => setShowInvoiceModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Now Modal */}
      {showBuyModal && selectedBook && (
        <div className="modal-overlay" onClick={handleCloseBuyModal}>
          <div className="modal-content buy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedBook.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseBuyModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="book-image-container">
                <img 
                  src={getImageUrl(selectedBook.imageUrl)} 
                  alt={selectedBook.title}
                  className="modal-book-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600';
                  }}
                />
              </div>

              <div className="product-details-section">
                <h3>Product Details</h3>
                <p className="product-author"><strong>Author:</strong> {selectedBook.author}</p>
                <p className="product-description">{selectedBook.description || 'No description available'}</p>
              </div>

              <div className="price-section">
                <h3>Price</h3>
                <p className="modal-price">LKR {Number(selectedBook.price).toFixed(2)}</p>
              </div>

              <div className="availability-section">
                <h3>Availability</h3>
                <p className={`availability-status ${selectedBook.available ? 'in-stock' : 'out-of-stock'}`}>
                  {selectedBook.available ? '● In Stock & Available' : '● Out of Stock'}
                </p>
              </div>

              <div className="quantity-section">
                <h3>Quantity</h3>
                <div className="quantity-controls">
                  <button 
                    className="qty-btn" 
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input 
                    type="number" 
                    className="qty-input" 
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(val < 1 ? 1 : val);
                    }}
                    min="1"
                    max={selectedBook.stock || 999}
                  />
                  <button 
                    className="qty-btn" 
                    onClick={() => handleQuantityChange(1)}
                    disabled={selectedBook.stock && quantity >= selectedBook.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="added-date-section">
                <h3>Added on</h3>
                <p className="added-date">
                  {selectedBook.createdAt 
                    ? new Date(selectedBook.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-add-to-cart" onClick={handleConfirmAddToCart}>
                Add to Cart ({quantity})
              </button>
              <button className="btn-close-modal" onClick={handleCloseBuyModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

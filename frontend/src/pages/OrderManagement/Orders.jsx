import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api from '../../api';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    filterOrders();
  }, [activeTab, orders, dateRange]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await api.getUserOrders(token);
      console.log('=== ORDERS DEBUG ===');
      console.log('Raw response:', ordersData);
      
      // Handle different response formats
      let ordersArray = [];
      
      if (Array.isArray(ordersData)) {
        ordersArray = ordersData;
      } else if (ordersData && typeof ordersData === 'object') {
        // Check if response has a 'message' property with stringified JSON (backend error format)
        if (ordersData.message && typeof ordersData.message === 'string') {
          try {
            // Try to parse the message - it might be JSON string
            const parsed = JSON.parse(ordersData.message);
            if (Array.isArray(parsed)) {
              ordersArray = parsed;
            }
          } catch (e) {
            console.warn('Could not parse message as JSON:', e);
            // Message is not valid JSON or has circular references
            // Backend needs to fix circular reference issue
          }
        } else {
          // Try common property names
          ordersArray = ordersData.orders || ordersData.data || ordersData.content || [];
          
          // If still not found, check if the object itself is the order
          if (ordersArray.length === 0 && ordersData.id) {
            ordersArray = [ordersData];
          }
        }
      }
      
      console.log('Processed orders array:', ordersArray);
      console.log('Orders count:', ordersArray.length);
      if (ordersArray.length > 0) {
        console.log('First order:', ordersArray[0]);
      }
      console.log('===================');
      setOrders(ordersArray);
    } catch (error) {
      console.error('❌ Failed to load orders:', error);
      console.error('Error response:', error.response?.data);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await api.cancelOrder(token, orderId);
      alert('Order cancelled successfully');
      loadOrders(); // Reload orders
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert(`Failed to cancel order: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order from history? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteOrder(token, orderId);
      alert('Order deleted successfully');
      loadOrders(); // Reload orders
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert(`Failed to delete order: ${error.message || 'Unknown error'}`);
    }
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

  const filterOrders = () => {
    // Ensure orders is an array before filtering
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Filter by status
    if (activeTab === 'completed') {
      filtered = filtered.filter(order => 
        order.orderStatus === 'delivered' || order.paymentStatus === 'completed'
      );
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(order => 
        order.orderStatus === 'cancelled'
      );
    } else if (activeTab === 'summary') {
      filtered = filtered.filter(order => 
        order.orderStatus === 'pending' || order.orderStatus === 'processing'
      );
    }

    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate >= new Date(dateRange.from);
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate <= new Date(dateRange.to);
      });
    }

    setFilteredOrders(filtered);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const getStatusClass = (status) => {
    if (status === 'delivered' || status === 'completed') return 'status-delivered';
    if (status === 'cancelled') return 'status-cancelled';
    if (status === 'processing' || status === 'pending') return 'status-processing';
    return '';
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
      createdAt: book.createdAt || book.publishedDate || book.addedDate || item.createdAt || new Date().toISOString()
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

  return (
    <div className="orders-page">
      <header className="cart-navbar">
        <Link to="/home" className="cart-brand">📚 <span>BOOKS</span></Link>
        <nav className="cart-nav-links">
          <Link to="/home">Home</Link>
          <Link to="/cart">🛒 Cart</Link>
          <Link to="/checkout">💳 Checkout</Link>
          <Link to="/orders" className="active">📦 My Orders</Link>
        </nav>
        <div className="cart-nav-actions">
          <input
            type="search"
            placeholder="Search..."
            className="cart-search"
          />
          <button
            type="button"
            className="btn btn--ghost"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Link className="btn btn--ghost" to="/profile">👤 {user?.name || user?.email}</Link>
          <button className="btn btn--outline" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="orders-container">
        <div className="orders-header">
          <h1>Order History</h1>
          
          <div className="orders-filters">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Order
              </button>
              <button 
                className={`filter-tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
              <button 
                className={`filter-tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Completed
              </button>
              <button 
                className={`filter-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled
              </button>
            </div>

            <div className="date-filters">
              <div className="date-input-group">
                <span>📅</span>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  placeholder="From"
                />
              </div>
              <span className="date-separator">To</span>
              <div className="date-input-group">
                <span>📅</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-message">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet.</p>
            <Link to="/home" className="btn-shop-now">Shop Now</Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header-info">
                  <div className="order-details-header">
                    <p className="order-number">Order : #{order.orderNumber || order.id}</p>
                    <p className="order-date">Order Payment : {formatDate(order.orderDate || order.createdAt)}</p>
                  </div>
                  <div className="order-actions">
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
                    // Handle both direct properties and nested book object
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
                  <div className="order-actions">
                    {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                      <button 
                        className="btn-cancel-order"
                        onClick={() => cancelOrder(order.id)}
                        disabled={order.orderStatus === 'completed'}
                      >
                        ✕ cancel order
                      </button>
                    )}
                    <button 
                      className="btn-delete-order"
                      onClick={() => deleteOrder(order.id)}
                      style={{ marginLeft: '10px' }}
                    >
                      🗑️ delete order
                    </button>
                  </div>
                  <div className="order-payment-status">
                    Payment Is {order.paymentStatus === 'completed' ? 'Successful!' : order.paymentStatus}
                  </div>
                  <div className="order-total">
                    Total Price: <strong>LKR {order.totalPrice || calculateOrderTotal(order.items)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  <h3 style={{marginBottom: '10px', color: 'var(--primary)'}}>Customer Information</h3>
                  <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                  <p><strong>Order Date:</strong> {formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <h3 style={{marginBottom: '10px', color: 'var(--primary)'}}>Payment & Delivery</h3>
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
                  <tr style={{borderTop: '2px solid var(--border)'}}>
                    <td colSpan="4" style={{textAlign: 'right', paddingTop: '15px'}}><strong>Subtotal:</strong></td>
                    <td style={{paddingTop: '15px'}}><strong>LKR {(selectedOrder.totalPrice || calculateOrderTotal(selectedOrder.items)).toFixed(2)}</strong></td>
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
                    <td style={{fontSize: '1.2em'}}><strong>LKR {(selectedOrder.totalPrice || calculateOrderTotal(selectedOrder.items)).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              <div className="invoice-footer">
                <div style={{marginTop: '40px', padding: '20px', background: 'var(--panel)', borderRadius: '8px'}}>
                  <h4 style={{marginBottom: '10px', color: 'var(--primary)'}}>Terms & Conditions</h4>
                  <ul style={{fontSize: '12px', color: 'var(--muted)', lineHeight: '1.8', paddingLeft: '20px'}}>
                    <li>All sales are final. Returns accepted within 14 days with receipt.</li>
                    <li>Damaged items must be reported within 48 hours of delivery.</li>
                    <li>Delivery time is 5-7 business days from order confirmation.</li>
                    <li>Payment must be completed before shipment for online orders.</li>
                  </ul>
                </div>
                <p style={{textAlign: 'center', marginTop: '30px', color: 'var(--primary)', fontSize: '16px', fontWeight: 'bold'}}>
                  Thank you for your purchase!
                </p>
                <p style={{textAlign: 'center', marginTop: '10px', color: 'var(--muted)', fontSize: '12px'}}>
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
      )}    </div>
  );
}

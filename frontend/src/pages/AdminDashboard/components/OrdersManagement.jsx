import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../authContext';
import { adminApi } from '../../../api';
import jsPDF from 'jspdf';
import './OrdersManagement.css';

export default function OrdersManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('all');

  // Helper function to construct proper image URLs
  const getImageUrl = (imageUrl) => {
    // Simple gray placeholder as data URI (no external dependencies)
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    
    // Return placeholder if no image URL provided
    if (!imageUrl || imageUrl === '' || imageUrl === 'null' || imageUrl === 'undefined') {
      return placeholder;
    }
    
    // Return as-is if already a complete URL
    const urlStr = String(imageUrl).trim();
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('data:')) {
      return urlStr;
    }
    
    // Construct backend URL for relative paths
    const path = urlStr.startsWith('/') ? urlStr : `/${urlStr}`;
    return `http://localhost:8080${path}`;
  };

  // Order status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#FFA500' },
    { value: 'processing', label: 'Processing', color: '#3B82F6' },
    { value: 'shipped', label: 'Shipped', color: '#8B5CF6' },
    { value: 'delivered', label: 'Delivered', color: '#10B981' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' }
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, dateRange]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getOrders(user.token);
      console.log('📦 Orders API Response:', data);
      
      // Handle array or object response
      const ordersArray = Array.isArray(data) ? data : (data.orders || data.data || []);
      console.log('📋 Orders Array Length:', ordersArray.length);
      
      if (ordersArray.length > 0) {
        console.log('🔍 Full Sample Order:', JSON.stringify(ordersArray[0], null, 2));
        if (ordersArray[0].orderItems?.[0]) {
          console.log('🔍 Full Sample Order Item:', JSON.stringify(ordersArray[0].orderItems[0], null, 2));
        }
      }
      
      // Process orders - first try to use existing book data, then optionally enrich
      const processedOrders = await Promise.all(ordersArray.map(async (order) => {
        const items = order.items || order.orderItems || [];
        
        if (items.length > 0) {
          const processedItems = await Promise.all(items.map(async (item) => {
            console.log('🔍 Processing item:', item);
            
            // Try to get book data from various possible sources in the item
            let bookData = item.book || item.bookModel || item.bookDto || {};
            const bookId = item.bookId || bookData.id || item.id;
            
            // Extract book info from various possible field names
            const title = item.bookTitle || item.title || bookData.title || bookData.bookTitle;
            const author = item.bookAuthor || item.author || bookData.author || bookData.bookAuthor;
            const image = item.bookImage || item.imageUrl || item.image || 
                         bookData.coverImage || bookData.imageUrl || bookData.image || bookData.cover;
            const category = item.category || bookData.category || bookData.categoryName;
            const price = item.price || item.bookPrice || bookData.price;
            const quantity = item.quantity || item.qty || 1;
            
            console.log('📚 Extracted book info:', { title, author, image, category, bookId });
            
            // If we have book ID but missing data, try to fetch from API
            if (bookId && !title) {
              try {
                console.log(`📚 Fetching book details for ID: ${bookId}`);
                const fetchedBook = await adminApi.getBook(user.token, bookId);
                console.log(`✅ Fetched book data:`, fetchedBook);
                
                return {
                  ...item,
                  bookId: bookId,
                  book: fetchedBook,
                  bookTitle: fetchedBook.title || title || 'Unknown Book',
                  bookAuthor: fetchedBook.author || author || 'Unknown Author',
                  bookImage: fetchedBook.coverImage || fetchedBook.imageUrl || image,
                  category: fetchedBook.category || category,
                  price: price,
                  quantity: quantity
                };
              } catch (fetchErr) {
                console.error(`❌ Failed to fetch book ${bookId}:`, fetchErr);
              }
            }
            
            // Return item with extracted data
            return {
              ...item,
              bookId: bookId,
              book: bookData,
              bookTitle: title || 'No Title Available',
              bookAuthor: author || 'Unknown Author',
              bookImage: image,
              category: category || 'Uncategorized',
              price: price,
              quantity: quantity
            };
          }));
          
          return { ...order, items: processedItems, orderItems: processedItems };
        }
        
        return order;
      }));
      
      console.log('✨ Processed Orders:', processedOrders);
      setOrders(processedOrders);
    } catch (err) {
      console.error('❌ Failed to load orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const orderId = (order.id || order.orderId || '').toString();
        const userName = order.user?.name || order.user?.userName || order.userDto?.name || '';
        const userEmail = order.user?.email || order.userDto?.email || '';
        const bookTitles = (order.items || order.orderItems || []).map(item => 
          item.book?.title || item.bookTitle || ''
        ).join(' ');
        
        const searchLower = searchTerm.toLowerCase();
        return orderId.includes(searchTerm) ||
          userName.toLowerCase().includes(searchLower) ||
          userEmail.toLowerCase().includes(searchLower) ||
          bookTitles.toLowerCase().includes(searchLower);
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        const status = (order.orderStatus || order.status || '').toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }

    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(
          order.orderDate || 
          order.createdAt || 
          order.createdDate || 
          order.date
        );
        return orderDate >= new Date(dateRange.from);
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(
          order.orderDate || 
          order.createdAt || 
          order.createdDate || 
          order.date
        );
        return orderDate <= new Date(dateRange.to);
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Convert to uppercase to match backend OrderStatus enum (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
      const upperCaseStatus = newStatus.toUpperCase();
      console.log('📤 Updating order status:', { orderId, newStatus: upperCaseStatus, token: user?.token ? 'present' : 'missing' });
      
      // Call the admin API to update order status
      const response = await adminApi.updateOrderStatus(user.token, orderId, upperCaseStatus);
      console.log('✅ Order status updated successfully:', response);

      // Update local state - handle both possible ID fields
      setOrders(orders.map(order => 
        (order.id === orderId || order.orderId === orderId)
          ? { ...order, orderStatus: upperCaseStatus, status: upperCaseStatus }
          : order
      ));

      alert('✅ Order status updated successfully!');
    } catch (err) {
      console.error('❌ Failed to update order status:', err);
      alert('❌ Failed to update order status: ' + err.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'status-badge status-pending';
      case 'processing':
        return 'status-badge status-processing';
      case 'shipped':
        return 'status-badge status-shipped';
      case 'delivered':
        return 'status-badge status-delivered';
      case 'cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const calculateStats = () => {
    const total = orders.length;
    const newOrders = orders.filter(o => {
      const status = (o.orderStatus || o.status || '').toLowerCase();
      return status === 'pending';
    }).length;
    const completed = orders.filter(o => {
      const status = (o.orderStatus || o.status || '').toLowerCase();
      return status === 'delivered';
    }).length;
    const cancelled = orders.filter(o => {
      const status = (o.orderStatus || o.status || '').toLowerCase();
      return status === 'cancelled';
    }).length;

    return { total, newOrders, completed, cancelled };
  };

  const getTimeFrameOrders = (timeFrame) => {
    const now = new Date();
    let startDate;

    switch (timeFrame) {
      case '1day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
      default:
        return orders;
    }

    return orders.filter(order => {
      const orderDate = new Date(
        order.orderDate || 
        order.createdAt || 
        order.createdDate || 
        order.date
      );
      return orderDate >= startDate;
    });
  };

  const calculateRevenue = (ordersList) => {
    return ordersList.reduce((total, order) => {
      const amount = parseFloat(
        order.totalAmount || 
        order.total || 
        order.amount || 
        order.totalPrice ||
        0
      );
      return total + amount;
    }, 0);
  };

  const generateRevenuePDF = () => {
    const timeFrameOrders = getTimeFrameOrders(selectedTimeFrame);
    const totalRevenue = calculateRevenue(timeFrameOrders);
    
    // Create PDF
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Revenue Report', 105, 20, { align: 'center' });
    
    // Time frame
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const timeFrameLabels = {
      '1day': 'Last 24 Hours',
      '1week': 'Last 7 Days',
      '1month': 'Last Month',
      '1year': 'Last Year',
      'all': 'All Time'
    };
    doc.text(`Time Frame: ${timeFrameLabels[selectedTimeFrame]}`, 105, 30, { align: 'center' });
    
    // Date generated
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 38, { align: 'center' });
    
    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary', 20, 50);
    
    // Revenue box
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(20, 55, 170, 25, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Total Revenue:', 30, 65);
    doc.setFontSize(18);
    doc.text(`$${totalRevenue.toFixed(2)}`, 30, 75);
    
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`Total Orders: ${timeFrameOrders.length}`, 130, 68);
    
    // Orders by Status
    const statusCounts = {
      pending: timeFrameOrders.filter(o => (o.orderStatus || o.status || '').toLowerCase() === 'pending').length,
      processing: timeFrameOrders.filter(o => (o.orderStatus || o.status || '').toLowerCase() === 'processing').length,
      shipped: timeFrameOrders.filter(o => (o.orderStatus || o.status || '').toLowerCase() === 'shipped').length,
      delivered: timeFrameOrders.filter(o => (o.orderStatus || o.status || '').toLowerCase() === 'delivered').length,
      cancelled: timeFrameOrders.filter(o => (o.orderStatus || o.status || '').toLowerCase() === 'cancelled').length
    };
    
    let yPos = 95;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Orders by Status:', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Pending: ${statusCounts.pending}`, 30, yPos);
    doc.text(`Processing: ${statusCounts.processing}`, 80, yPos);
    doc.text(`Shipped: ${statusCounts.shipped}`, 130, yPos);
    
    yPos += 6;
    doc.text(`Delivered: ${statusCounts.delivered}`, 30, yPos);
    doc.text(`Cancelled: ${statusCounts.cancelled}`, 80, yPos);
    
    // Detailed Orders Table
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Detailed Orders', 20, yPos);
    
    yPos += 8;
    
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('Order ID', 25, yPos + 5);
    doc.text('Date', 60, yPos + 5);
    doc.text('Customer', 95, yPos + 5);
    doc.text('Amount', 140, yPos + 5);
    doc.text('Status', 165, yPos + 5);
    
    yPos += 10;
    
    // Table rows (limit to prevent overflow)
    const maxOrders = 20;
    const displayOrders = timeFrameOrders.slice(0, maxOrders);
    
    doc.setFontSize(8);
    displayOrders.forEach((order, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const orderUser = order.user || order.userDto || {};
      const userName = orderUser.name || orderUser.userName || 'N/A';
      const orderAmount = parseFloat(
        order.totalAmount || 
        order.total || 
        order.amount || 
        order.totalPrice ||
        0
      );
      const orderStatus = (order.orderStatus || order.status || 'pending').toLowerCase();
      
      doc.setTextColor(80, 80, 80);
      doc.text(`#${order.id || order.orderId || 'N/A'}`, 25, yPos);
      doc.text(formatDate(order.orderDate || order.createdAt || order.createdDate || order.date), 60, yPos);
      doc.text(userName.substring(0, 15), 95, yPos);
      doc.text(`$${orderAmount.toFixed(2)}`, 140, yPos);
      doc.text(orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1), 165, yPos);
      
      yPos += 7;
    });
    
    if (timeFrameOrders.length > maxOrders) {
      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`... and ${timeFrameOrders.length - maxOrders} more orders`, 20, yPos);
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('© Online Book Store - Admin Dashboard', 105, 295, { align: 'center' });
    }
    
    // Save PDF
    const fileName = `Revenue_Report_${timeFrameLabels[selectedTimeFrame].replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    setShowRevenueModal(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-management">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-icon">🏠</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-text">Orders List</span>
      </div>

      {/* Header */}
      <div className="orders-header">
        <div className="orders-header-left">
          <h1>Orders List</h1>
          <p>Here you can find all of your Orders</p>
        </div>
        <div className="orders-header-right">
          <button 
            className="btn-add-order"
            onClick={() => setShowRevenueModal(true)}
          >
            <span className="btn-icon">📊</span> Revenue Reports
          </button>
        </div>
      </div>

      {/* Revenue Report Modal */}
      {showRevenueModal && (
        <div className="revenue-modal-overlay" onClick={() => setShowRevenueModal(false)}>
          <div className="revenue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="revenue-modal-header">
              <h2>Download Revenue Report</h2>
              <button className="modal-close" onClick={() => setShowRevenueModal(false)}>×</button>
            </div>
            <div className="revenue-modal-body">
              <p className="revenue-modal-description">
                Select a time frame to generate and download the revenue report in PDF format.
              </p>
              <div className="timeframe-options">
                <label className={`timeframe-option ${selectedTimeFrame === '1day' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="timeframe" 
                    value="1day"
                    checked={selectedTimeFrame === '1day'}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                  />
                  <div className="timeframe-label">
                    <span className="timeframe-icon">📅</span>
                    <span className="timeframe-text">Last 24 Hours</span>
                  </div>
                </label>
                <label className={`timeframe-option ${selectedTimeFrame === '1week' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="timeframe" 
                    value="1week"
                    checked={selectedTimeFrame === '1week'}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                  />
                  <div className="timeframe-label">
                    <span className="timeframe-icon">📅</span>
                    <span className="timeframe-text">Last 7 Days</span>
                  </div>
                </label>
                <label className={`timeframe-option ${selectedTimeFrame === '1month' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="timeframe" 
                    value="1month"
                    checked={selectedTimeFrame === '1month'}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                  />
                  <div className="timeframe-label">
                    <span className="timeframe-icon">📅</span>
                    <span className="timeframe-text">Last Month</span>
                  </div>
                </label>
                <label className={`timeframe-option ${selectedTimeFrame === '1year' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="timeframe" 
                    value="1year"
                    checked={selectedTimeFrame === '1year'}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                  />
                  <div className="timeframe-label">
                    <span className="timeframe-icon">📅</span>
                    <span className="timeframe-text">Last Year</span>
                  </div>
                </label>
                <label className={`timeframe-option ${selectedTimeFrame === 'all' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="timeframe" 
                    value="all"
                    checked={selectedTimeFrame === 'all'}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                  />
                  <div className="timeframe-label">
                    <span className="timeframe-icon">📊</span>
                    <span className="timeframe-text">All Time</span>
                  </div>
                </label>
              </div>
              <div className="revenue-preview">
                <div className="preview-label">Preview:</div>
                <div className="preview-stats">
                  <div className="preview-stat">
                    <span className="preview-stat-label">Total Orders:</span>
                    <span className="preview-stat-value">{getTimeFrameOrders(selectedTimeFrame).length}</span>
                  </div>
                  <div className="preview-stat">
                    <span className="preview-stat-label">Total Revenue:</span>
                    <span className="preview-stat-value">
                      ${calculateRevenue(getTimeFrameOrders(selectedTimeFrame)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="revenue-modal-footer">
              <button className="btn-cancel" onClick={() => setShowRevenueModal(false)}>
                Cancel
              </button>
              <button className="btn-download" onClick={generateRevenuePDF}>
                <span className="btn-icon">⬇️</span> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.total.toLocaleString()}</div>
          <div className="stat-trend stat-up">
            <span className="trend-icon">↑</span>
            Total Orders last 365 days
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New Orders</div>
          <div className="stat-value">{stats.newOrders.toLocaleString()}</div>
          <div className="stat-trend stat-up">
            <span className="trend-icon">↑</span>
            New Orders last 365 days
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Orders</div>
          <div className="stat-value">{stats.completed.toLocaleString()}</div>
          <div className="stat-trend stat-down">
            <span className="trend-icon">→</span>
            Completed Order last 365 days
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelled Orders</div>
          <div className="stat-value">{stats.cancelled.toLocaleString()}</div>
          <div className="stat-trend stat-down">
            <span className="trend-icon">→</span>
            Cancelled Order last 365 days
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="filter-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-status">
          <span className="filter-icon">⚙️</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-date-range">
          <span className="date-icon">📅</span>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            placeholder="From"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            placeholder="To"
          />
        </div>

        <button className="btn-more-filter">
          <span className="filter-icon">⚙️</span>
          More Filter
        </button>
      </div>

      {/* Orders Table */}
      {error && (
        <div className="orders-error">
          <p>{error}</p>
          <button onClick={loadOrders}>Retry</button>
        </div>
      )}

      {currentOrders.length === 0 ? (
        <div className="orders-empty">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Id</th>
                <th>Image</th>
                <th>Product Name</th>
                <th>Customer Name</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => {
                // Safely access order items and book info
                const orderItems = order.items || order.orderItems || [];
                const firstItem = orderItems[0] || {};
                const itemCount = orderItems.length;
                
                // Get book data - backend returns it in item.book
                const book = firstItem.book || {};
                
                // Book title from backend response
                const bookTitle = book.title || 'No Title Available';
                
                // Book image from backend response
                const bookImageUrl = book.imageUrl || book.coverImage;
                
                const bookImage = getImageUrl(bookImageUrl);
                
                // Book category and author from backend response
                const bookCategory = book.category || 'Uncategorized';
                const bookAuthor = book.author || 'Unknown Author';
                
                // Safely access user info (multiple possible paths)
                const orderUser = order.user || order.userDto || {};
                const userName = orderUser.name || orderUser.userName || orderUser.fullName || orderUser.email?.split('@')[0] || 'Unknown';
                const userRole = orderUser.role || orderUser.userRole || 'USER';
                const profileImage = orderUser.profileImage || orderUser.profileImg || orderUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4F46E5&color=fff`;
                
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="order-id">#{order.id || order.orderId || 'N/A'}</div>
                      <div className="order-date">
                        {formatDate(
                          order.orderDate || 
                          order.createdAt || 
                          order.createdDate || 
                          order.createdOn ||
                          order.date ||
                          new Date()
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ padding: '5px' }}>
                        <img 
                          src={bookImage} 
                          alt={bookTitle} 
                          className="product-image"
                          style={{ display: 'block', objectFit: 'cover' }}
                          onError={(e) => { 
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; 
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="product-info">
                        <div className="product-title">
                          {bookTitle}
                        </div>
                        <div className="product-category">
                          {itemCount > 1 ? `+${itemCount - 1} more items` : `${bookCategory} • ${bookAuthor}`}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <img 
                          src={profileImage}
                          alt={userName} 
                          className="customer-avatar"
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4F46E5&color=fff`; }}
                        />
                        <div className="customer-info">
                          <div className="customer-name">{userName}</div>
                          <div className="customer-type">
                            {userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' ? 'Admin' : 'Customer'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="order-amount">
                        {formatCurrency(
                          order.totalAmount || 
                          order.total || 
                          order.amount || 
                          order.totalPrice ||
                          0
                        )}
                      </div>
                      <div className="payment-method">
                        Paid by {order.paymentMethod || order.payment || order.method || 'Card'}
                      </div>
                    </td>
                    <td>
                      <select
                        className={getStatusBadgeClass(order.orderStatus || order.status)}
                        value={(order.orderStatus || order.status || 'pending').toString().toLowerCase()}
                        onChange={(e) => {
                          console.log('🔄 Changing order status:', {
                            orderId: order.id,
                            currentStatus: order.status,
                            newStatus: e.target.value
                          });
                          updateOrderStatus(order.id || order.orderId, e.target.value);
                        }}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="orders-pagination">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="pagination-dots">...</span>;
              }
              return null;
            })}
          </div>

          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

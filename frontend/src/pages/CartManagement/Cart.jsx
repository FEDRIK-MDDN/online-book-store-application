import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api from '../../api';
import './Cart.css';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Load cart items from backend on mount
  useEffect(() => {
    if (user?.email) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check token and user
      console.log('Loading cart with:', { token, email: user.email, hasToken: !!token });
      
      const cartData = await api.getCart(token);
      
      // Debug: Log the raw cart data from backend
      console.log('Raw cart data from backend:', cartData);
      console.log('Cart items:', cartData.items);
      
      // Transform backend cart format to match frontend expectations
      const items = cartData.items?.map(item => {
        console.log('Processing cart item:', item);
        return {
          id: item.book?.id || item.bookId,
          title: item.book?.title || item.bookTitle || 'Unknown Book',
          price: item.book?.price || item.price || 0,
          quantity: item.quantity || 1,
          imageUrl: item.book?.imageUrl || item.imageUrl,
          description: item.book?.description || item.description,
          stock: item.book?.stock || item.stock,
        };
      }) || [];
      
      console.log('Transformed cart items:', items);
      setCartItems(items);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleQuantityChange = async (itemId, delta) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;
    
    const newQty = item.quantity + delta;
    if (newQty < 1) return; // Don't allow quantity less than 1
    if (item.stock && newQty > item.stock) {
      alert(`Only ${item.stock} items available in stock`);
      return;
    }

    try {
      await api.updateCartItem(token, itemId, newQty);
      await loadCart(); // Reload cart from backend
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handleQuantityInputChange = async (itemId, value) => {
    const qty = parseInt(value) || 1;
    if (qty < 1) return;
    
    const item = cartItems.find(i => i.id === itemId);
    if (item?.stock && qty > item.stock) {
      alert(`Only ${item.stock} items available in stock`);
      return;
    }

    try {
      await api.updateCartItem(token, itemId, qty);
      await loadCart(); // Reload cart from backend
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      console.log('Removing item:', itemId, 'with token:', token ? 'present' : 'missing');
      const result = await api.removeFromCart(token, itemId);
      console.log('Remove item result:', result);
      
      // Force immediate UI update
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      // Reload from backend to ensure sync
      await loadCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      });
      alert(`Failed to remove item: ${err.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }
    
    try {
      console.log('Clearing cart with token:', token ? 'present' : 'missing');
      
      // Try backend clear first
      try {
        const result = await api.clearCart(token);
        console.log('Clear cart result:', result);
      } catch (backendErr) {
        console.warn('Backend clear cart failed, falling back to removing items individually:', backendErr);
        
        // Fallback: Try removing items one by one
        const itemsToRemove = [...cartItems];
        let successCount = 0;
        let failCount = 0;
        
        for (const item of itemsToRemove) {
          try {
            await api.removeFromCart(token, item.id);
            successCount++;
          } catch (removeErr) {
            console.error(`Failed to remove item ${item.id}:`, removeErr);
            failCount++;
          }
        }
        
        if (failCount > 0 && successCount === 0) {
          throw new Error('Unable to clear cart. Please contact support.');
        }
      }
      
      // Force immediate UI update
      setCartItems([]);
      
      // Reload from backend to ensure sync
      await loadCart();
      
      alert('Cart cleared successfully!');
    } catch (err) {
      console.error('Failed to clear cart:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      });
      alert(`Failed to clear cart: ${err.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const calculateItemTotal = (item) => {
    return (item.price * item.quantity).toFixed(2);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    // Navigate to checkout page
    navigate('/checkout');
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    // If it's a relative path, construct the full URL
    // Try localhost:8080 (Spring Boot backend) first
    return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  return (
    <div className="cart-page">
      <header className="cart-navbar">
        <Link to="/home" className="cart-brand">📚 <span>BOOKS</span></Link>
        <nav className="cart-nav-links">
          <Link to="/home">Home</Link>
          <Link to="/cart" className="active">🛒 Cart</Link>
          <Link to="/checkout">💳 Checkout</Link>
          <Link to="/orders">📦 My Orders</Link>
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

      <div className="cart-container">
        <div className="cart-header-section">
          <h1>My Cart</h1>
          <Link to="/home" className="btn-continue-shopping">Continue Shopping</Link>
        </div>

        {loading ? (
          <div className="empty-cart">
            <p>Loading cart...</p>
          </div>
        ) : error ? (
          <div className="empty-cart" style={{ color: 'red' }}>
            <p>Error: {error}</p>
            <button className="btn btn--primary" onClick={loadCart}>Retry</button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <Link to="/home" className="btn btn--primary">Start Shopping</Link>
          </div>
        ) : (
          <>
            <div className="cart-items-section">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img
                    src={getImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600'}
                    alt={item.title}
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600';
                    }}
                  />
                  <div className="cart-item-details">
                    <h3>{item.title}</h3>
                    <p className="cart-item-description">{item.description || 'good book for kids'}</p>
                    <p className="cart-item-price">
                      <span className="label">LKR</span> {Number(item.price).toFixed(2)} <span className="per-unit">per unit</span>
                    </p>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-controls-cart">
                      <button
                        className="qty-btn-cart"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="qty-input-cart"
                        value={item.quantity}
                        onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                        min="1"
                      />
                      <button
                        className="qty-btn-cart"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-total">
                      <span className="total-label">total:</span>
                      <span className="total-price">LKR {calculateItemTotal(item)}</span>
                    </div>
                    <button
                      className="btn-remove-item"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Items ({cartItems.length}):</span>
                <span>LKR {calculateTotal()}</span>
              </div>
              <div className="summary-row total-row">
                <span>Total:</span>
                <span className="total-amount">LKR {calculateTotal()}</span>
              </div>
            </div>

            <div className="cart-actions">
              <button className="btn-clear-cart" onClick={handleClearCart}>
                Clear Cart
              </button>
              <button className="btn-checkout" onClick={handleCheckout}>
                PROCEED TO CHECKOUT
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

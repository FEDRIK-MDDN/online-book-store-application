import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api from '../../api';
import PaperHavenNav from '../../components/PaperHavenNav';
import './Cart.css';

function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) return imageUrl;
  return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) loadCart();
    else setLoading(false);
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true); setError(null);
      const cartData = await api.getCart(token);
      const items = cartData.items?.map(item => ({
        id: item.book?.id || item.bookId,
        title: item.book?.title || item.bookTitle || 'Unknown Book',
        price: item.book?.price || item.price || 0,
        quantity: item.quantity || 1,
        imageUrl: item.book?.imageUrl || item.imageUrl,
        description: item.book?.description || item.description,
        stock: item.book?.stock || item.stock,
      })) || [];
      setCartItems(items);
    } catch (err) {
      setError(err.message || 'Failed to load cart');
    } finally { setLoading(false); }
  };

  const handleQuantityChange = async (itemId, delta) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (item.stock && newQty > item.stock) { alert(`Only ${item.stock} items in stock`); return; }
    try { await api.updateCartItem(token, itemId, newQty); await loadCart(); }
    catch { alert('Failed to update quantity.'); }
  };

  const handleQuantityInputChange = async (itemId, value) => {
    const qty = parseInt(value) || 1;
    if (qty < 1) return;
    const item = cartItems.find(i => i.id === itemId);
    if (item?.stock && qty > item.stock) { alert(`Only ${item.stock} items in stock`); return; }
    try { await api.updateCartItem(token, itemId, qty); await loadCart(); }
    catch { alert('Failed to update quantity.'); }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.removeFromCart(token, itemId);
      setCartItems(prev => prev.filter(i => i.id !== itemId));
      await loadCart();
    } catch (err) { alert(`Failed to remove item: ${err.message}`); }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    try {
      try { await api.clearCart(token); }
      catch { for (const item of cartItems) { try { await api.removeFromCart(token, item.id); } catch {} } }
      setCartItems([]);
      await loadCart();
    } catch (err) { alert(`Failed to clear cart: ${err.message}`); }
  };

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const calculateTotal = () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="ph-cart-page">
      <PaperHavenNav user={user} cartCount={cartCount} onLogout={handleLogout} activeLink="cart" />

      <div className="ph-cart-wrap">
        {/* Page header — always full width */}
        <div className="ph-cart-hdr">
          <h1 className="ph-cart-title">My Cart</h1>
          <Link to="/home" className="ph-cart-continue">← Continue Shopping</Link>
        </div>

        {loading ? (
          <div className="ph-cart-empty">
            <div className="ph-spinner" style={{margin:'0 auto 16px'}} />
            <p className="ph-cart-empty__text">Loading cart...</p>
          </div>
        ) : error ? (
          <div className="ph-cart-empty">
            <div className="ph-cart-empty__icon">⚠️</div>
            <p className="ph-cart-empty__text">{error}</p>
            <button className="ph-btn ph-btn--primary" onClick={loadCart}>Retry</button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="ph-cart-empty">
            <div className="ph-cart-empty__icon">🛒</div>
            <p className="ph-cart-empty__text">Your cart is empty</p>
            <Link to="/home" className="ph-btn ph-btn--primary">Start Shopping</Link>
          </div>
        ) : (
          /* Two-column grid only when items exist */
          <div className="ph-cart-main">
            {/* Left — items */}
            <div className="ph-cart-list">
              {cartItems.map(item => (
                <div key={item.id} className="ph-cart-item">
                  <img
                    className="ph-cart-item__img"
                    src={getImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'}
                    alt={item.title}
                    onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }}
                  />
                  <div className="ph-cart-item__body">
                    <div className="ph-cart-item__title">{item.title}</div>
                    <div className="ph-cart-item__desc">{item.description || 'A wonderful read.'}</div>
                    <div className="ph-cart-item__price-row">
                      <span className="ph-cart-item__label">LKR</span>
                      <span className="ph-cart-item__price">{Number(item.price).toFixed(2)}</span>
                      <span className="ph-cart-item__per">per unit</span>
                    </div>
                  </div>
                  <div className="ph-cart-item__controls">
                    <div className="ph-qty-row">
                      <button className="ph-qty-btn" onClick={() => handleQuantityChange(item.id, -1)} disabled={item.quantity <= 1}>−</button>
                      <input className="ph-qty-input" type="number" value={item.quantity} min="1"
                        onChange={e => handleQuantityInputChange(item.id, e.target.value)} />
                      <button className="ph-qty-btn" onClick={() => handleQuantityChange(item.id, 1)} disabled={item.stock && item.quantity >= item.stock}>+</button>
                    </div>
                    <div className="ph-cart-item__total">
                      Total: <strong>LKR {(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                    <button className="ph-cart-item__remove" onClick={() => handleRemoveItem(item.id)} title="Remove">🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — Summary */}
            <div className="ph-cart-summary">
              <div className="ph-cart-summary__title">Order Summary</div>
              <div className="ph-summary-row"><span>Items ({cartItems.length})</span><span>LKR {calculateTotal()}</span></div>
              <div className="ph-summary-row"><span>Shipping</span><span>Free</span></div>
              <div className="ph-summary-row ph-summary-row--total"><span>Total</span><span>LKR {calculateTotal()}</span></div>
              <button className="ph-cart-checkout-btn" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
              <button className="ph-cart-clear-btn" onClick={handleClearCart}>Clear Cart</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

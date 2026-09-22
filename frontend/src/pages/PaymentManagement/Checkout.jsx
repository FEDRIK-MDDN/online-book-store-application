import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api from '../../api';
import PaperHavenNav from '../../components/PaperHavenNav';
import './Checkout.css';

function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) return imageUrl;
  return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

const Checkout = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [billingInfo, setBillingInfo] = useState({
    businessPurchase: false, email: user?.email || '',
    firstName: '', lastName: '', phone: '', country: '',
    state: '', city: '', address: '', zipCode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardInfo, setCardInfo] = useState({
    cardNumber1: '', cardNumber2: '', cardNumber3: '', cardNumber4: '',
    expirationMonth: '', expirationYear: '', cvv: '', cardholderName: ''
  });

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await api.getCart(token);
      const items = cartData.items?.map(item => ({
        id: item.book?.id || item.bookId,
        title: item.book?.title || item.bookTitle || 'Unknown Book',
        price: item.book?.price || item.price || 0,
        quantity: item.quantity || 1,
        imageUrl: item.book?.imageUrl || item.imageUrl,
      })) || [];
      setCartItems(items);
      if (items.length === 0) { alert('Your cart is empty!'); navigate('/cart'); }
    } catch (err) {
      console.error('Failed to load cart:', err);
      alert('Failed to load cart items'); navigate('/cart');
    } finally { setLoading(false); }
  };

  const handleBillingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardInfo(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) { alert('Your cart is empty!'); return; }
    if (!billingInfo.firstName || !billingInfo.lastName) { alert('Please fill in your name'); return; }
    if (!billingInfo.address || !billingInfo.city || !billingInfo.state || !billingInfo.country || !billingInfo.zipCode) { alert('Please fill in all billing address fields'); return; }
    if (!billingInfo.phone) { alert('Please enter your phone number'); return; }
    if (paymentMethod === 'card') {
      if (!cardInfo.cardNumber1 || !cardInfo.cardNumber2 || !cardInfo.cardNumber3 || !cardInfo.cardNumber4) { alert('Please enter complete card number'); return; }
      if (!cardInfo.expirationMonth || !cardInfo.expirationYear) { alert('Please enter card expiration date'); return; }
      if (!cardInfo.cvv) { alert('Please enter CVV'); return; }
    }
    setSubmitting(true);
    try {
      const orderData = {
        billingAddress: { ...billingInfo, firstName: billingInfo.firstName.trim(), lastName: billingInfo.lastName.trim(), email: billingInfo.email.trim(), phone: billingInfo.phone.trim(), address: billingInfo.address.trim(), city: billingInfo.city.trim(), state: billingInfo.state.trim(), country: billingInfo.country.trim(), zipCode: billingInfo.zipCode.trim() },
        paymentMethod,
        cardDetails: paymentMethod === 'card' ? {
          cardholderName: `${billingInfo.firstName.trim()} ${billingInfo.lastName.trim()}`,
          number: `${cardInfo.cardNumber1}${cardInfo.cardNumber2}${cardInfo.cardNumber3}${cardInfo.cardNumber4}`,
          expirationMonth: cardInfo.expirationMonth.trim(),
          expirationYear: cardInfo.expirationYear.trim(),
          cvv: cardInfo.cvv.trim()
        } : null
      };
      const result = await api.placeOrder(token, orderData);
      setOrderNumber(result.orderNumber || result.id);
      setShowSuccessModal(true);
    } catch (error) {
      const msg = error.data?.message || error.message || 'Unknown error';
      alert(`Failed to place order: ${msg}`);
    } finally { setSubmitting(false); }
  };

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  if (loading) return (
    <div className="ph-checkout-page">
      <PaperHavenNav user={user} cartCount={0} onLogout={handleLogout} />
      <div className="ph-loading" style={{ padding: '80px', justifyContent: 'center' }}><div className="ph-spinner" />Loading...</div>
    </div>
  );

  return (
    <div className="ph-checkout-page">
      <PaperHavenNav user={user} cartCount={cartCount} onLogout={handleLogout} />

      <div className="ph-checkout-main">
        {/* Left: Forms */}
        <div>
          <h1 className="ph-checkout-title">Checkout</h1>

          <form onSubmit={handleSubmit}>
            {/* Billing Info */}
            <div className="ph-checkout-section">
              <div className="ph-checkout-section__title">📋 Billing Information</div>
              <label className="ph-checkbox" style={{ marginBottom: 14, fontSize: '0.85rem', color: 'var(--ph-muted)' }}>
                <input type="checkbox" name="businessPurchase" checked={billingInfo.businessPurchase} onChange={handleBillingChange} style={{ accentColor: 'var(--ph-gold)' }} />
                <span>Business purchase</span>
              </label>
              <div className="ph-form-grid" style={{ marginBottom: 14 }}>
                <div className="ph-form-field"><label>First Name *</label><input name="firstName" value={billingInfo.firstName} onChange={handleBillingChange} placeholder="John" required /></div>
                <div className="ph-form-field"><label>Last Name *</label><input name="lastName" value={billingInfo.lastName} onChange={handleBillingChange} placeholder="Doe" required /></div>
              </div>
              <div className="ph-form-grid" style={{ marginBottom: 14 }}>
                <div className="ph-form-field"><label>Email *</label><input name="email" type="email" value={billingInfo.email} onChange={handleBillingChange} placeholder="you@example.com" required /></div>
                <div className="ph-form-field"><label>Phone *</label><input name="phone" type="tel" value={billingInfo.phone} onChange={handleBillingChange} placeholder="+94 77 000 0000" required /></div>
              </div>
              <div className="ph-form-grid" style={{ marginBottom: 14 }}>
                <div className="ph-form-field"><label>Country *</label><input name="country" value={billingInfo.country} onChange={handleBillingChange} placeholder="Sri Lanka" required /></div>
                <div className="ph-form-field"><label>State / Province *</label><input name="state" value={billingInfo.state} onChange={handleBillingChange} placeholder="Western Province" required /></div>
              </div>
              <div className="ph-form-grid" style={{ marginBottom: 14 }}>
                <div className="ph-form-field"><label>City *</label><input name="city" value={billingInfo.city} onChange={handleBillingChange} placeholder="Colombo" required /></div>
                <div className="ph-form-field"><label>Zip / Postal Code *</label><input name="zipCode" value={billingInfo.zipCode} onChange={handleBillingChange} placeholder="10000" required /></div>
              </div>
              <div className="ph-form-grid ph-form-grid--full">
                <div className="ph-form-field"><label>Street Address *</label><input name="address" value={billingInfo.address} onChange={handleBillingChange} placeholder="123 Main Street" required /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="ph-checkout-section">
              <div className="ph-checkout-section__title">💳 Payment Method</div>
              <div className="ph-payment-tabs">
                {[{ id: 'card', label: '💳 Credit / Debit Card' }, { id: 'cod', label: '🚚 Cash on Delivery' }, { id: 'bank', label: '🏦 Bank Transfer' }].map(m => (
                  <button key={m.id} type="button" className={`ph-payment-tab ${paymentMethod === m.id ? 'ph-payment-tab--active' : ''}`} onClick={() => setPaymentMethod(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <>
                  <div className="ph-form-grid ph-form-grid--full" style={{ marginBottom: 14 }}>
                    <div className="ph-form-field"><label>Card Number *</label>
                      <div className="ph-card-row">
                        {['cardNumber1','cardNumber2','cardNumber3','cardNumber4'].map(n => (
                          <div key={n} className="ph-card-seg">
                            <input name={n} value={cardInfo[n]} onChange={handleCardChange} placeholder="XXXX" maxLength={4} style={{ textAlign: 'center', letterSpacing: '0.2em' }} required />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="ph-form-grid">
                    <div className="ph-form-field"><label>Expiry Month *</label><input name="expirationMonth" value={cardInfo.expirationMonth} onChange={handleCardChange} placeholder="MM" maxLength={2} required /></div>
                    <div className="ph-form-field"><label>Expiry Year *</label><input name="expirationYear" value={cardInfo.expirationYear} onChange={handleCardChange} placeholder="YYYY" maxLength={4} required /></div>
                  </div>
                  <div className="ph-form-grid" style={{ marginTop: 14 }}>
                    <div className="ph-form-field"><label>CVV *</label><input name="cvv" type="password" value={cardInfo.cvv} onChange={handleCardChange} placeholder="•••" maxLength={4} required /></div>
                    <div className="ph-form-field"><label>Cardholder Name</label><input name="cardholderName" value={cardInfo.cardholderName || `${billingInfo.firstName} ${billingInfo.lastName}`} onChange={handleCardChange} placeholder="John Doe" /></div>
                  </div>
                </>
              )}
              {paymentMethod === 'cod' && <p style={{ fontSize: '0.875rem', color: 'var(--ph-muted)', padding: '12px 0' }}>Pay with cash when your order is delivered to your door.</p>}
              {paymentMethod === 'bank' && <p style={{ fontSize: '0.875rem', color: 'var(--ph-muted)', padding: '12px 0' }}>Bank transfer details will be sent to your email after placing the order.</p>}
            </div>

            <button type="submit" className="ph-place-order-btn" disabled={submitting}>
              {submitting ? 'Placing Order…' : `Place Order — LKR ${calculateTotal()}`}
            </button>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="ph-checkout-summary">
          <div className="ph-checkout-summary__title">Order Summary</div>
          {cartItems.map(item => (
            <div key={item.id} className="ph-checkout-item">
              <img className="ph-checkout-item__img" src={getImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200'} alt={item.title}
                onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200'; }} />
              <div className="ph-checkout-item__info">
                <div className="ph-checkout-item__title">{item.title}</div>
                <div className="ph-checkout-item__qty">Qty: {item.quantity}</div>
              </div>
              <div className="ph-checkout-item__price">LKR {(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
          <div className="ph-checkout-totals">
            <div className="ph-checkout-row"><span>Subtotal</span><span>LKR {calculateTotal()}</span></div>
            <div className="ph-checkout-row"><span>Shipping</span><span>Free</span></div>
            <div className="ph-checkout-row ph-checkout-row--total"><span>Total</span><span>LKR {calculateTotal()}</span></div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="ph-modal-overlay">
          <div className="ph-modal ph-success-modal">
            <div className="ph-success-modal__icon">🎉</div>
            <div className="ph-success-modal__title">Order Placed!</div>
            <p className="ph-success-modal__order">
              Your order <strong>#{orderNumber}</strong> has been confirmed. You'll receive a confirmation email shortly.
            </p>
            <div className="ph-success-modal__buttons">
              <button className="ph-btn ph-btn--primary" onClick={() => navigate('/orders')}>View Orders</button>
              <button className="ph-btn ph-btn--outline" onClick={() => navigate('/home')}>Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;

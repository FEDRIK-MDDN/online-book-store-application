import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api from '../../api';
import './Checkout.css';

const Checkout = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [billingInfo, setBillingInfo] = useState({
    businessPurchase: false,
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardInfo, setCardInfo] = useState({
    cardNumber1: '',
    cardNumber2: '',
    cardNumber3: '',
    cardNumber4: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    cardholderName: ''
  });

  // Load cart items on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

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
      
      if (items.length === 0) {
        alert('Your cart is empty!');
        navigate('/cart');
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      alert('Failed to load cart items');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
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

  const handleBillingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Validate required fields
    if (!billingInfo.firstName || !billingInfo.lastName) {
      alert('Please fill in your first and last name');
      return;
    }

    if (!billingInfo.address || !billingInfo.city || !billingInfo.state || !billingInfo.country || !billingInfo.zipCode) {
      alert('Please fill in all billing address fields');
      return;
    }

    if (!billingInfo.phone) {
      alert('Please enter your phone number');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardInfo.cardNumber1 || !cardInfo.cardNumber2 || !cardInfo.cardNumber3 || !cardInfo.cardNumber4) {
        alert('Please enter complete card number');
        return;
      }
      if (!cardInfo.expirationMonth || !cardInfo.expirationYear) {
        alert('Please enter card expiration date');
        return;
      }
      if (!cardInfo.cvv) {
        alert('Please enter CVV');
        return;
      }
    }

    setSubmitting(true);
    
    try {
      const orderData = {
        billingAddress: {
          ...billingInfo,
          firstName: billingInfo.firstName.trim(),
          lastName: billingInfo.lastName.trim(),
          email: billingInfo.email.trim(),
          phone: billingInfo.phone.trim(),
          address: billingInfo.address.trim(),
          city: billingInfo.city.trim(),
          state: billingInfo.state.trim(),
          country: billingInfo.country.trim(),
          zipCode: billingInfo.zipCode.trim(),
          businessPurchase: billingInfo.businessPurchase
        },
        paymentMethod: paymentMethod,
        cardDetails: paymentMethod === 'card' ? {
          cardholderName: `${billingInfo.firstName.trim()} ${billingInfo.lastName.trim()}`,
          number: `${cardInfo.cardNumber1}${cardInfo.cardNumber2}${cardInfo.cardNumber3}${cardInfo.cardNumber4}`,
          expirationMonth: cardInfo.expirationMonth.trim(),
          expirationYear: cardInfo.expirationYear.trim(),
          cvv: cardInfo.cvv.trim()
        } : null
      };

      console.log('Submitting order data:', JSON.stringify(orderData, null, 2));
      console.log('Billing Info:', billingInfo);
      console.log('Card Info:', cardInfo);

      const result = await api.placeOrder(token, orderData);
      
      console.log('Order placed successfully:', result);
      setOrderNumber(result.orderNumber || result.id);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to place order:', error);
      console.error('Error status:', error.status);
      console.error('Error data:', JSON.stringify(error.data, null, 2));
      const errorMessage = error.data?.message || error.message || 'Unknown error';
      alert(`Failed to place order: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <header className="cart-navbar">
        <Link to="/home" className="cart-brand">📚 <span>BOOKS</span></Link>
        <nav className="cart-nav-links">
          <Link to="/home">Home</Link>
          <Link to="/cart">🛒 Cart</Link>
          <Link to="/checkout" className="active">💳 Checkout</Link>
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

      <div className="checkout-container">
        <div className="checkout-content">
          <form onSubmit={handleSubmit}>
          <div className="checkout-left">
            {/* Billing Information */}
            <div className="checkout-section">
              <h2 className="section-title">BILLING INFORMATION</h2>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="businessPurchase"
                    checked={billingInfo.businessPurchase}
                    onChange={handleBillingChange}
                  />
                  <span>Business purchase</span>
                </label>
              </div>

              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="E-mail *"
                  value={billingInfo.email}
                  onChange={handleBillingChange}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  value={billingInfo.phone}
                  onChange={handleBillingChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name *"
                    value={billingInfo.firstName}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name *"
                    value={billingInfo.lastName}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="address"
                  placeholder="Address *"
                  value={billingInfo.address}
                  onChange={handleBillingChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="city"
                    placeholder="City *"
                    value={billingInfo.city}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="state"
                    placeholder="State/Province *"
                    value={billingInfo.state}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP/Postal Code *"
                    value={billingInfo.zipCode}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="country"
                    placeholder="Country *"
                    value={billingInfo.country}
                    onChange={handleBillingChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="checkout-section">
              <h2 className="section-title">PAYMENT METHODS</h2>
              
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-icons">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="VISA" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" />
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-text">
                    <span className="cash-on-delivery">💵 Cash on Delivery</span>
                  </div>
                </label>
              </div>

              {paymentMethod === 'card' && (
                <div className="credit-card-form">
                  <div className="card-visual">
                    <div className="card-number-label">Card number</div>
                    <div className="card-number-inputs">
                      <input
                        type="text"
                        name="cardNumber1"
                        value={cardInfo.cardNumber1}
                        onChange={handleCardChange}
                        maxLength="4"
                        placeholder="****"
                        required
                      />
                      <input
                        type="text"
                        name="cardNumber2"
                        value={cardInfo.cardNumber2}
                        onChange={handleCardChange}
                        maxLength="4"
                        placeholder="****"
                        required
                      />
                      <input
                        type="text"
                        name="cardNumber3"
                        value={cardInfo.cardNumber3}
                        onChange={handleCardChange}
                        maxLength="4"
                        placeholder="****"
                        required
                      />
                      <input
                        type="text"
                        name="cardNumber4"
                        value={cardInfo.cardNumber4}
                        onChange={handleCardChange}
                        maxLength="4"
                        placeholder="****"
                        required
                      />
                    </div>

                    <div className="card-details">
                      <div className="card-holder">
                        <label>Cardholder name</label>
                        <input
                          type="text"
                          name="cardholderName"
                          value={cardInfo.cardholderName || `${billingInfo.firstName} ${billingInfo.lastName}`.trim()}
                          onChange={handleCardChange}
                          placeholder="Name on card"
                          required
                        />
                      </div>
                      <div className="card-expiry">
                        <label>CVV</label>
                        <div className="expiry-inputs">
                          <input
                            type="text"
                            name="expirationMonth"
                            value={cardInfo.expirationMonth}
                            onChange={handleCardChange}
                            placeholder="mm"
                            maxLength="2"
                            required
                          />
                          <span>/</span>
                          <input
                            type="text"
                            name="expirationYear"
                            value={cardInfo.expirationYear}
                            onChange={handleCardChange}
                            placeholder="yy"
                            maxLength="2"
                            required
                          />
                        </div>
                        <input
                          type="text"
                          name="cvv"
                          value={cardInfo.cvv}
                          onChange={handleCardChange}
                          placeholder="***"
                          maxLength="3"
                          className="cvv-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="visa-logo">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="VISA" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="checkout-right">
            {/* Product Information */}
            <div className="product-summary">
              <h2 className="section-title">ORDER SUMMARY</h2>
              
              {loading ? (
                <div className="loading-message">Loading cart items...</div>
              ) : (
                <>
                  <div className="cart-items-list">
                    {cartItems.map(item => (
                      <div key={item.id} className="product-item">
                        <div className="product-image">
                          <img 
                            src={getImageUrl(item.imageUrl) || '/images/book-placeholder.jpg'} 
                            alt={item.title}
                            onError={(e) => { e.target.src = '/images/book-placeholder.jpg'; }}
                          />
                        </div>
                        <div className="product-details">
                          <h3>{item.title}</h3>
                          <p className="product-quantity">Qty: {item.quantity}</p>
                          <p className="product-price">LKR {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary">
                    <div className="summary-row total">
                      <span>TOTAL</span>
                      <span>LKR {calculateTotal()}</span>
                    </div>
                  </div>

                  <button type="submit" className="submit-button" disabled={submitting}>
                    {submitting ? 'PROCESSING...' : 'PAY NOW'}
                  </button>
                </>
              )}

              <div className="terms-text">
                By submitting your Order, you acknowledge that you agree to our terms and conditions. Once the order is confirmed, you will receive an order confirmation email with shipping and payment details.
              </div>

              <div className="contact-info">
                <p>* Have a question? Contact us for online payment related issues:</p>
                <p>• 1-888-317-4838 (Toll free)</p>
                <p>• 1-647-977-7769 (International)</p>
              </div>

              <div className="footer-links">
                <p>© Online Book Store 2026</p>
                <p>
                  <a href="#">Privacy Policy</a> | <a href="#">Terms and Conditions</a> | <a href="#">Refund Policy</a>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon success-icon">✓</div>
            <h2 className="modal-title">Payment Successful!</h2>
            <p className="modal-message">
              Your order has been placed successfully.
            </p>
            <p className="modal-order-number">
              Order Number: <strong>{orderNumber}</strong>
            </p>
            <button 
              className="modal-button"
              onClick={() => navigate('/orders')}
            >
              View My Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;

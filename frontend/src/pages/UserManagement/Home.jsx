
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api, { publicApi, adminApi } from '../../api';
import { categoryCache } from '../../utils/categoryCache';
import '../../components/Visit/visit.css';

export default function Home() {
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [activeCategory, setActiveCategory] = useState('All');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Load cart count from backend
  useEffect(() => {
    const loadCartCount = async () => {
      if (user && token) {
        try {
          const cartData = await api.getCart(token);
          const count = cartData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          setCartCount(count);
        } catch (err) {
          console.error('Failed to load cart count:', err);
        }
      }
    };
    loadCartCount();
  }, [user, token]);

  // Fetch books and categories from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch books
        const booksData = await publicApi.getBooks();
        
        // Fetch categories - try multiple strategies
        let categoriesData = [];
        
        // Strategy 1: Try cached categories first (from admin session)
        const cachedCategories = categoryCache.get();
        if (cachedCategories && cachedCategories.length > 0) {
          console.log('✅ Home: Using cached categories:', cachedCategories.length);
          categoriesData = cachedCategories;
        } else {
          // Strategy 2: Try public API
          try {
            categoriesData = await publicApi.getCategories();
            categoryCache.save(categoriesData); // Cache for next time
          } catch (err) {
            // Strategy 3: If 401 and user logged in, try with token
            if (err.status === 401 && token) {
              console.log('🔑 Home: Categories require auth, trying with token...');
              try {
                categoriesData = await adminApi.getCategories(token);
                categoryCache.save(categoriesData); // Cache for next time
              } catch (authErr) {
                console.warn('⚠️ Home: Failed to fetch categories with auth:', authErr);
              }
            } else {
              console.warn('⚠️ Home: Cannot fetch categories - backend requires authentication');
            }
          }
        }
        
        console.log('📚 Home: Fetched books from backend:', booksData);
        console.log('🏷️ Home: Fetched categories from backend:', categoriesData);
        console.log('📊 Home: Categories count:', Array.isArray(categoriesData) ? categoriesData.length : 0);
        
        const booksList = Array.isArray(booksData) ? booksData : [];
        const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
        
        console.log('✅ Home: Setting books:', booksList.length, 'categories:', categoriesList.length);
        
        setBooks(booksList);
        setCategories(categoriesList);
      } catch (err) {
        console.error('❌ Home: Failed to fetch data:', err);
        console.error('❌ Home: Error details:', {
          message: err.message,
          status: err.status,
          isNetworkError: err.isNetworkError
        });
        setBooks([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const categoryOk = activeCategory === 'All' || b.category === activeCategory;
      const queryOk = !query || (b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()));
      return categoryOk && queryOk;
    });
  }, [activeCategory, query, books]);

  // Persist and apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleAddToCart = (book) => {
    setSelectedBook(book);
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
        
        // Reload cart count
        const cartData = await api.getCart(token);
        const count = cartData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(count);
        
        handleCloseBuyModal();
        
        // Navigate to cart page
        navigate('/cart');
      } catch (err) {
        console.error('Failed to add to cart:', err);
        alert('Failed to add item to cart. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600';
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    // If it's a relative path, construct the full URL pointing to Spring Boot backend
    return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  return (
    <div className="visit">
      <header className="visit__navbar">
        <Link to="/home" className="visit__brand">📚 <span>BOOKS</span></Link>
        <nav className="visit__navActions">
          <button
            type="button"
            className="btn btn--ghost"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Link className="btn btn--ghost" to="/cart">
            My Cart <span className="counter">{cartCount}</span>
          </Link>
          <div className="visit__auth">
            <Link className="btn btn--ghost" to="/profile">👤 {user?.name || user?.email}</Link>
            <button className="btn btn--outline" onClick={handleLogout}>Logout</button>
          </div>
        </nav>
      </header>

      <section 
        className="visit__hero"
        style={{
          background: `linear-gradient(180deg, #00000066, #00000022 60%, #00000000), url('/images/Webpic.png') center/cover no-repeat`
        }}
      >
        <div className="visit__heroContent">
          <h1>Welcome back, {user?.name || 'Reader'}!</h1>
          <p>Continue your journey through amazing stories.</p>
          <form className="visit__search" onSubmit={(e) => e.preventDefault()}>
            <input
              type="search"
              placeholder="Search by title or author…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn btn--primary" type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="visit__categories">
        <h2>Browse by category</h2>
        <div className="visit__chips">
          <button
            className={`chip ${activeCategory === 'All' ? 'chip--active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All
          </button>
          {loading ? (
            <span style={{ color: '#999', fontSize: '0.9rem' }}>Loading categories...</span>
          ) : categories.length === 0 ? (
            <span style={{ color: '#999', fontSize: '0.9rem' }}>No categories available</span>
          ) : (
            categories.map(cat => (
              <button
                key={cat.id}
                className={`chip ${activeCategory === cat.name ? 'chip--active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>
      </section>

      <section className="visit__grid">
        <h2>New arrivals</h2>
        {loading ? (
          <p>Loading books...</p>
        ) : filteredBooks.length === 0 ? (
          <p>No books available at the moment. Check back soon!</p>
        ) : (
          <div className="grid">
            {filteredBooks.map(book => (
              <article key={book.id} className="card">
                <div className="card__media">
                  {book.salePrice && <span className="badge badge--top">Top sale</span>}
                  <img 
                    className="card__image" 
                    src={getImageUrl(book.imageUrl)} 
                    alt={book.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600';
                    }}
                  />
                </div>
                <div className="card__body">
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  {book.salePrice ? (
                    <p className="price">
                      Rs {Number(book.salePrice).toLocaleString('en-LK', { minimumFractionDigits: 2 })} <span className="price price--old">Rs {Number(book.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                    </p>
                  ) : (
                    <p className="price">Rs {Number(book.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                  )}
                  <div className="actions">
                    <Link to={`/book/${book.id}`} className="btn btn--outline btn--sm">Details</Link>
                    <button className="btn btn--primary btn--sm" onClick={() => handleAddToCart(book)}>Buy Now</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="visit__footer">
        <div className="footerGrid">
          <div className="footBrand">
            <h3>📚 BOOKS</h3>
            <p>Curated reads from across the world. Join thousands of readers discovering new favorites every week.</p>
            <form className="visit__newsletter" onSubmit={(e)=> e.preventDefault()}>
              <input type="email" placeholder="Enter your email for deals & updates" aria-label="Email"/>
              <button className="btn btn--primary" type="submit">Subscribe</button>
            </form>
          </div>
          <div className="footCol">
            <h4>Browse</h4>
            <ul>
              <li><Link to="/browse">All books</Link></li>
              <li><button className="linkLike" onClick={()=> setActiveCategory('Fiction')}>Fiction</button></li>
              <li><button className="linkLike" onClick={()=> setActiveCategory('Sci‑Fi')}>Sci‑Fi</button></li>
              <li><button className="linkLike" onClick={()=> setActiveCategory('Education')}>Education</button></li>
            </ul>
          </div>
          <div className="footCol">
            <h4>Help</h4>
            <ul>
              <li><button type="button" className="linkLike">Shipping & returns</button></li>
              <li><button type="button" className="linkLike">Support</button></li>
              <li><button type="button" className="linkLike">Gift cards</button></li>
              <li><button type="button" className="linkLike">FAQs</button></li>
            </ul>
          </div>
          <div className="footCol">
            <h4>Company</h4>
            <ul>
              <li><button type="button" className="linkLike">About us</button></li>
              <li><button type="button" className="linkLike">Careers</button></li>
              <li><button type="button" className="linkLike">Press</button></li>
            </ul>
          </div>
          <div className="footCol">
            <h4>Follow</h4>
            <div className="socialLinks">
              <button type="button" className="linkLike" aria-label="Twitter">🐦</button>
              <button type="button" className="linkLike" aria-label="YouTube">▶</button>
              <button type="button" className="linkLike" aria-label="Instagram">📸</button>
              <button type="button" className="linkLike" aria-label="Facebook">📘</button>
            </div>
          </div>
        </div>
        <div className="visit__subfooter">
          <small>© {new Date().getFullYear()} BOOKS. All rights reserved.</small>
          <nav className="legalLinks">
            <button type="button" className="linkLike">Privacy</button>
            <button type="button" className="linkLike">Terms</button>
            <button type="button" className="linkLike">Cookies</button>
          </nav>
        </div>
      </footer>

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
                <p className="product-description">{selectedBook.description || 'Good book for kids'}</p>
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
                    : 'December 29, 2025'
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

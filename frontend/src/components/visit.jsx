
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../api';
import { categoryCache } from '../utils/categoryCache';
import './Visit/visit.css';

export default function Visit() {
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch books and categories from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch books
        const booksData = await publicApi.getBooks();
        
        // Fetch categories - try multiple strategies
        let categoriesData = [];
        
        // Strategy 1: Check localStorage cache first (set by admin)
        const cachedCategories = categoryCache.get();
        if (cachedCategories && cachedCategories.length > 0) {
          console.log('✅ Visit: Using cached categories:', cachedCategories.length);
          categoriesData = cachedCategories;
        } else {
          // Strategy 2: Try public API
          try {
            categoriesData = await publicApi.getCategories();
            categoryCache.save(categoriesData); // Cache for later
          } catch (err) {
            // If 401, backend requires auth - use cache or show message
            if (err.status === 401) {
              console.warn('⚠️ Visit: Categories require authentication.');
              console.warn('💡 Visit: Categories will appear after admin logs in and visits Categories page');
              console.warn('🔧 Visit: Or configure backend SecurityConfig to allow public access');
            }
          }
        }
        
        console.log('📚 Visit: Fetched books from backend:', booksData);
        console.log('🏷️ Visit: Fetched categories from backend:', categoriesData);
        console.log('📊 Visit: Categories count:', Array.isArray(categoriesData) ? categoriesData.length : 0);
        
        const booksList = Array.isArray(booksData) ? booksData : [];
        const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
        
        console.log('✅ Visit: Setting books:', booksList.length, 'categories:', categoriesList.length);
        
        setBooks(booksList);
        setCategories(categoriesList);
      } catch (err) {
        console.error('❌ Visit: Failed to fetch data:', err);
        console.error('❌ Visit: Error details:', {
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
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const categoryOk = activeCategory === 'All' || b.category === activeCategory;
      const queryOk = !query || (b.title?.toLowerCase().includes(query.toLowerCase()) || b.author?.toLowerCase().includes(query.toLowerCase()));
      return categoryOk && queryOk;
    });
  }, [activeCategory, query, books]);

  // Persist and apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleNavigateToLogin = () => {
    setShowAuthModal(false);
    navigate('/login');
  };

  const handleNavigateToRegister = () => {
    setShowAuthModal(false);
    navigate('/register');
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
    <div className="visit">
      <header className="visit__navbar">
        <Link to="/" className="visit__brand">📚 <span>BOOKS</span></Link>
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
          <button className="btn btn--ghost" onClick={handleAuthRequired}>
            My Cart <span className="counter">{cartCount}</span>
          </button>
          <div className="visit__auth">
            <Link className="btn btn--outline" to="/login">Login</Link>
            <Link className="btn btn--primary" to="/register">Register</Link>
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
          <h1>Books That Build Your Future....</h1>
          <p>Because Every Book Has a Story.</p>
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
                    src={getImageUrl(book.imageUrl) || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600'} 
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
                    <button className="btn btn--primary btn--sm" onClick={handleAuthRequired}>Buy Now</button>
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

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="authModal__overlay" onClick={() => setShowAuthModal(false)}>
          <div className="authModal__content" onClick={(e) => e.stopPropagation()}>
            <button className="authModal__close" onClick={() => setShowAuthModal(false)} aria-label="Close">✕</button>
            <div className="authModal__icon">🔒</div>
            <h2>Authentication Required</h2>
            <p>Please register or login to add books to your cart and enjoy shopping!</p>
            <div className="authModal__buttons">
              <button className="btn btn--primary btn--lg" onClick={handleNavigateToRegister}>
                Register Now
              </button>
              <button className="btn btn--outline btn--lg" onClick={handleNavigateToLogin}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


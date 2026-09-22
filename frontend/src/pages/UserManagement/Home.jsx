
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import api, { publicApi, adminApi } from '../../api';
import { categoryCache } from '../../utils/categoryCache';
import PaperHavenNav from '../../components/PaperHavenNav';
import PaperHavenFooter from '../../components/PaperHavenFooter';
import '../../components/Visit/visit.css';

const CATEGORY_ICONS = {
  'History': '📜', 'Children': '🧸', 'Science Fiction': '🚀',
  'Self Improvement': '🧘', 'Self-Improvement': '🧘', 'Self improvement': '🧘',
  'Comics': '🦸', 'Fiction': '📖', 'Mystery': '🔍',
  'Biography': '👤', 'Education': '🎓', 'Romance': '💕',
  'Fantasy': '🐉', 'default': '📚'
};

const BG_COLORS = ['#FDEBD0', '#FEF9C3', '#D5F5E3', '#D6EAF8'];

function getImageUrl(imageUrl) {
  if (!imageUrl) return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) return imageUrl;
  return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

function StarRating({ rating = 4.9 }) {
  return <span className="stars">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && token) {
      api.getCart(token)
        .then(d => setCartCount(d.items?.reduce((s, i) => s + i.quantity, 0) || 0))
        .catch(() => { });
    }
  }, [user, token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const booksData = await publicApi.getBooks();
        let categoriesData = [];
        const cached = categoryCache.get();
        if (cached && cached.length > 0) {
          categoriesData = cached;
        } else {
          try {
            categoriesData = await publicApi.getCategories();
            categoryCache.save(categoriesData);
          } catch (err) {
            if (err.status === 401 && token) {
              try { categoriesData = await adminApi.getCategories(token); categoryCache.save(categoriesData); } catch { }
            }
          }
        }
        setBooks(Array.isArray(booksData) ? booksData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        console.error('Failed to fetch:', err);
        setBooks([]); setCategories([]);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  const filteredBooks = useMemo(() => books.filter(b => {
    const catOk = activeCategory === 'All' || b.category === activeCategory;
    const qOk = !query || b.title?.toLowerCase().includes(query.toLowerCase()) || b.author?.toLowerCase().includes(query.toLowerCase());
    return catOk && qOk;
  }), [activeCategory, query, books]);

  const handleAddToCart = (book) => { setSelectedBook(book); setQuantity(1); setShowBuyModal(true); };
  const handleCloseBuyModal = () => { setShowBuyModal(false); setSelectedBook(null); setQuantity(1); };

  const handleConfirmAddToCart = async () => {
    if (!selectedBook) return;
    if (!user || !token) { navigate('/login'); return; }
    try {
      await api.addToCart(token, selectedBook.id, quantity);
      const cartData = await api.getCart(token);
      setCartCount(cartData.items?.reduce((s, i) => s + i.quantity, 0) || 0);
      handleCloseBuyModal();
      navigate('/cart');
    } catch (err) { alert('Failed to add to cart. Please try again.'); }
  };

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const recommended = filteredBooks.slice(0, 6);
  const recentlyAdded = filteredBooks.slice(0, 5);
  const bestSellers = filteredBooks.slice(0, 4);
  const popularThisMonth = filteredBooks.slice(2, 6);

  return (
    <div className="ph-visit">
      <PaperHavenNav
        user={user}
        cartCount={cartCount}
        onLogout={handleLogout}
        onSearch={setQuery}
        activeLink="home"
        categories={categories}
        onCategorySelect={setActiveCategory}
        activeCategory={activeCategory}
      />

      {/* ── Hero ── */}
      <section className="ph-hero">
        <div className="ph-hero__content">
          <h1 className="ph-hero__title">Find Your<br />Next Book</h1>
          <p className="ph-hero__desc">
            Welcome back, <strong>{user?.name || 'Reader'}</strong>! Continue your journey
            through amazing stories. At BOOKS, we curate a diverse collection of books.
          </p>
          <button className="ph-hero__cta" onClick={() => document.getElementById('ph-recommended')?.scrollIntoView({ behavior: 'smooth' })}>
            Explore Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div>
          <div className="ph-hero__books">
            {books[1] && <div className="ph-hero__book ph-hero__book--side" style={{ alignSelf: 'flex-end' }}><img src={getImageUrl(books[1].imageUrl)} alt={books[1].title} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} /></div>}
            {books[0] && <div className="ph-hero__book ph-hero__book--main"><img src={getImageUrl(books[0].imageUrl)} alt={books[0].title} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} /></div>}
            {books[2] && <div className="ph-hero__book ph-hero__book--side" style={{ alignSelf: 'flex-end' }}><img src={getImageUrl(books[2].imageUrl)} alt={books[2].title} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} /></div>}
          </div>
          <div className="ph-hero__dots">
            <div className="ph-hero__dot ph-hero__dot--active" />
            <div className="ph-hero__dot" /><div className="ph-hero__dot" />
          </div>
        </div>
      </section>

      {/* ── Main Sections ── */}
      <div className="ph-sections">

        {/* Recommended */}
        <section className="ph-section" id="ph-recommended">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Recommended For You</h2>
            <button className="ph-section-see-all">See all ›</button>
          </div>
          {loading ? (
            <div className="ph-loading"><div className="ph-spinner" />Loading books...</div>
          ) : recommended.length === 0 ? (
            <p style={{ color: 'var(--ph-muted)', textAlign: 'center', padding: '40px 0' }}>No books found. Check back soon!</p>
          ) : (
            <div className="ph-books-grid">
              {recommended.map(book => (
                <div key={book.id} className="ph-book-card">
                  <div className="ph-book-card__cover">
                    {book.salePrice && <span className="ph-book-card__badge">SALE</span>}
                    <img src={getImageUrl(book.imageUrl)} alt={book.title} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                  </div>
                  <div className="ph-book-card__body">
                    <div className="ph-book-card__title">{book.title}</div>
                    <div className="ph-book-card__author">By : {book.author}</div>
                    <div className="ph-book-card__rating"><StarRating /> 4.9</div>
                    <div className="ph-book-card__price-row">
                      <div>
                        <span className="ph-book-card__price">Rs {Number(book.salePrice || book.price).toLocaleString('en-LK')}</span>
                        {book.salePrice && <span className="ph-book-card__price-old">Rs {Number(book.price).toLocaleString('en-LK')}</span>}
                      </div>
                    </div>
                    <button className="ph-book-card__btn" onClick={() => handleAddToCart(book)}>Add to cart</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recently Added */}
      <div className="ph-recently-grid" style={{ marginTop: 48 }}>
        <div className="ph-recently-grid__inner">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Recently added</h2>
            <button className="ph-section-see-all">See all ›</button>
          </div>
          <div className="ph-recently-books">
            {recentlyAdded.map(book => (
              <button key={book.id} className="ph-recently-card" onClick={() => handleAddToCart(book)}>
                <div className="ph-recently-card__cover">
                  <img src={getImageUrl(book.imageUrl)} alt={book.title} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                </div>
                <div className="ph-recently-card__title">{book.title}</div>
                <div className="ph-recently-card__author">{book.author}</div>
                <div className="ph-recently-card__meta">
                  <span className="ph-recently-card__price">Rs {Number(book.salePrice || book.price).toLocaleString('en-LK')}</span>
                  {book.salePrice && <span className="ph-recently-card__old-price">Rs {Number(book.price).toLocaleString('en-LK')}</span>}
                  <span className="ph-recently-card__cart-icon">🛒</span> <span>4.7</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ph-sections" style={{ paddingTop: 48 }}>
        {/* Best sellers */}
        <section className="ph-section">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Best seller of all time</h2>
            <button className="ph-section-see-all">See all ›</button>
          </div>
          <div className="ph-bestseller-grid">
            {bestSellers.map((book, i) => (
              <div key={book.id} className="ph-bestseller-card">
                <div className="ph-bestseller-card__cover" style={{ background: BG_COLORS[i % BG_COLORS.length] }}>
                  <img src={getImageUrl(book.imageUrl)} alt={book.title} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                  <div className="ph-bestseller-card__ribbon">Read a little</div>
                </div>
                <div className="ph-bestseller-card__info">
                  <div className="ph-bestseller-card__title">{book.title}</div>
                  <div className="ph-bestseller-card__by">By: {book.author}</div>
                  <div className="ph-bestseller-card__price-row">
                    <div>
                      <span className="ph-bestseller-card__price">Rs {Number(book.salePrice || book.price).toLocaleString('en-LK')}</span>
                      {book.salePrice && <span className="ph-bestseller-card__old"> Rs {Number(book.price).toLocaleString('en-LK')}</span>}
                    </div>
                    <div className="ph-bestseller-card__rating">★ 4.7 <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} onClick={() => handleAddToCart(book)}>🛒</button></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular This Month */}
        <section className="ph-section">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Popular this month</h2>
            <button className="ph-section-see-all">See all ›</button>
          </div>
          <div className="ph-bestseller-grid">
            {popularThisMonth.map((book, i) => (
              <div key={book.id} className="ph-bestseller-card">
                <div className="ph-bestseller-card__cover" style={{ background: BG_COLORS[(i + 1) % BG_COLORS.length] }}>
                  <img src={getImageUrl(book.imageUrl)} alt={book.title} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                </div>
                <div className="ph-bestseller-card__info">
                  <div className="ph-bestseller-card__title">{book.title}</div>
                  <div className="ph-bestseller-card__by">By: {book.author}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className="ph-bestseller-card__price">Rs {Number(book.salePrice || book.price).toLocaleString('en-LK')}</span>
                    {book.salePrice && <span className="ph-bestseller-card__old"> Rs {Number(book.price).toLocaleString('en-LK')}</span>}
                  </div>
                  <button className="ph-book-card__btn" style={{ marginTop: 8 }} onClick={() => handleAddToCart(book)}>Add to cart</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <PaperHavenFooter onCategoryClick={setActiveCategory} />

      {/* Buy Modal */}
      {showBuyModal && selectedBook && (
        <div className="ph-modal-overlay" onClick={handleCloseBuyModal}>
          <div className="ph-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="ph-modal__header">
              <div className="ph-modal__title" style={{ fontFamily: 'var(--font-heading)' }}>{selectedBook.title}</div>
              <button className="ph-modal__close" onClick={handleCloseBuyModal}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20 }}>
              <img src={getImageUrl(selectedBook.imageUrl)} alt={selectedBook.title} style={{ borderRadius: 8, width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ph-muted)', lineHeight: 1.6, marginBottom: 12 }}>{selectedBook.description || 'A wonderful read for all ages.'}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ph-gold)', marginBottom: 8 }}>
                  Rs {Number(selectedBook.price).toFixed(2)}
                </p>
                <p style={{ fontSize: '0.8rem', color: selectedBook.available !== false ? 'var(--ph-green)' : 'var(--ph-red)', marginBottom: 12 }}>
                  ● {selectedBook.available !== false ? 'In Stock & Available' : 'Out of Stock'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button style={{ width: 32, height: 32, border: '1.5px solid var(--ph-border2)', borderRadius: 6, fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
                  <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                  <button style={{ width: 32, height: 32, border: '1.5px solid var(--ph-border2)', borderRadius: 6, fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="ph-btn ph-btn--primary" style={{ flex: 1 }} onClick={handleConfirmAddToCart}>
                Add to Cart ({quantity})
              </button>
              <button className="ph-btn ph-btn--outline" onClick={handleCloseBuyModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

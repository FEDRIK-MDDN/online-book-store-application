
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicApi } from '../api';
import { categoryCache } from '../utils/categoryCache';
import PaperHavenNav from './PaperHavenNav';
import PaperHavenFooter from './PaperHavenFooter';
import './Visit/visit.css';

const CATEGORY_ICONS = {
  'History': '📜', 'Children': '🧸', 'Science Fiction': '🚀',
  'Self Improvement': '🧘', 'Self-Improvement': '🧘',
  'Self improvement': '🧘', 'Comics': '🦸', 'Fiction': '📖',
  'Mystery': '🔍', 'Biography': '👤', 'Education': '🎓',
  'Romance': '💕', 'Fantasy': '🐉', 'default': '📚'
};

const TESTIMONIALS = [
  { name: 'Savannah Nguyen', handle: '@Savannahnguyen', text: '"This book was an absolute page-turner! I couldn\'t put it down and was captivated from start to finish. The plot was engaging and the characters were so well developed."' },
  { name: 'Devon Lane', handle: '@Devonlane', text: '"This book was an absolute page-turner! I couldn\'t put it down and was captivated from start to finish. The plot was engaging and the characters were so well developed."' },
  { name: 'Jane Cooper', handle: '@Janecooper', text: '"This book was an absolute page-turner! I couldn\'t put it down and was captivated from start to finish. The plot was engaging and the characters were so well developed."' },
  { name: 'Nathan Woods', handle: '@HeisNathan', text: '"This book was an absolute page-turner! I couldn\'t put it down and was captivated from start to finish. The plot was engaging and the characters were so well developed."' },
  { name: 'Ralph Edwards', handle: '@Ralphedwards', text: '"This book was an absolute page-turner! I couldn\'t put it down and was captivated from start to finish. The plot was engaging and the characters were so well developed."' },
  { name: 'Annette Black', handle: '@Annetteblack', text: '"This book was an absolute page-turner! I couldn\'t put it down and was captivated from start to finish. The plot was engaging and the characters were so well developed."' },
];

const AUTHORS = [
  { name: 'Latest from James Clear', avatar: 'https://i.pravatar.cc/40?img=33' },
  { name: 'Latest from Napoleon Hill', avatar: 'https://i.pravatar.cc/40?img=11' },
  { name: 'Latest from Robert Kiyosaki', avatar: 'https://i.pravatar.cc/40?img=52' },
  { name: 'Latest from Brian Tracy', avatar: 'https://i.pravatar.cc/40?img=68' },
];

function getImageUrl(imageUrl) {
  if (!imageUrl) return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) return imageUrl;
  return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

function StarRating({ rating = 4.9 }) {
  return (
    <span className="stars">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}

export default function Visit() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const booksData = await publicApi.getBooks();
        let categoriesData = [];
        const cachedCategories = categoryCache.get();
        if (cachedCategories && cachedCategories.length > 0) {
          categoriesData = cachedCategories;
        } else {
          try {
            categoriesData = await publicApi.getCategories();
            categoryCache.save(categoriesData);
          } catch (err) { /* categories may require auth */ }
        }
        setBooks(Array.isArray(booksData) ? booksData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setBooks([]); setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const catOk = activeCategory === 'All' || b.category === activeCategory;
      const qOk = !query || b.title?.toLowerCase().includes(query.toLowerCase()) || b.author?.toLowerCase().includes(query.toLowerCase());
      return catOk && qOk;
    });
  }, [activeCategory, query, books]);

  const heroBooks = books.slice(0, 3);
  const recommended = books.slice(0, 6);
  const recentlyAdded = books.slice(0, 5);
  const bestSellers = books.slice(0, 4);
  const popularThisMonth = books.slice(0, 4);

  const BG_COLORS = ['#FDEBD0', '#FEF9C3', '#D5F5E3', '#D6EAF8'];

  return (
    <div className="ph-visit">
      <PaperHavenNav
        user={null}
        onSearch={setQuery}
      />

      {/* ── Hero ── */}
      <section className="ph-hero">
        <div className="ph-hero__content">
          <h1 className="ph-hero__title">Find Your<br />Next Book</h1>
          <p className="ph-hero__desc">
            Discover a world where every page brings a new adventure.
            At BOOKS, we curate a diverse collection of books.
          </p>
          <button className="ph-hero__cta" onClick={() => navigate('/login')}>
            Explore Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div>
          <div className="ph-hero__books">
            {heroBooks[1] && (
              <div className="ph-hero__book ph-hero__book--side" style={{ alignSelf: 'flex-end' }}>
                <img src={getImageUrl(heroBooks[1].imageUrl)} alt={heroBooks[1].title}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
              </div>
            )}
            {heroBooks[0] && (
              <div className="ph-hero__book ph-hero__book--main">
                <img src={getImageUrl(heroBooks[0].imageUrl)} alt={heroBooks[0].title}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
              </div>
            )}
            {heroBooks[2] && (
              <div className="ph-hero__book ph-hero__book--side" style={{ alignSelf: 'flex-end' }}>
                <img src={getImageUrl(heroBooks[2].imageUrl)} alt={heroBooks[2].title}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
              </div>
            )}
          </div>
          <div className="ph-hero__dots">
            <div className="ph-hero__dot ph-hero__dot--active" />
            <div className="ph-hero__dot" />
            <div className="ph-hero__dot" />
          </div>
        </div>
      </section>

      {/* ── Author Strip ── */}
      <div className="ph-author-strip">
        <div className="ph-author-strip__inner">
          {AUTHORS.map((a, i) => (
            <div key={i} className="ph-author-item" onClick={() => setShowAuthModal(true)}>
              <img className="ph-author-item__avatar" src={a.avatar} alt={a.name}
                onError={e => { e.target.onerror = null; e.target.src = 'https://i.pravatar.cc/40?img=' + i; }} />
              <span className="ph-author-item__text">{a.name}</span>
              <span className="ph-author-item__arrow">›</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Sections ── */}
      <div className="ph-sections">

        {/* Recommended For You */}
        <section className="ph-section">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Recommended For You</h2>
            <button className="ph-section-see-all" onClick={() => setShowAuthModal(true)}>See all ›</button>
          </div>
          {loading ? (
            <div className="ph-loading"><div className="ph-spinner" />Loading books...</div>
          ) : (
            <div className="ph-books-grid">
              {recommended.map(book => (
                <div key={book.id} className="ph-book-card">
                  <div className="ph-book-card__cover">
                    <img src={getImageUrl(book.imageUrl)} alt={book.title}
                      onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                  </div>
                  <div className="ph-book-card__body">
                    <div className="ph-book-card__title">{book.title}</div>
                    <div className="ph-book-card__author">By : {book.author}</div>
                    <div className="ph-book-card__price-row">
                      <div>
                        <span className="ph-book-card__rating"><StarRating /> 4.9</span>
                        <span className="ph-book-card__price" style={{ marginLeft: 8 }}>
                          Rs {Number(book.price).toLocaleString('en-LK')}
                        </span>
                      </div>
                    </div>
                    <button className="ph-book-card__btn" onClick={() => setShowAuthModal(true)}>
                      Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Category */}
        <section className="ph-section">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Category</h2>
            <button className="ph-section-see-all" onClick={() => setShowAuthModal(true)}>See all ›</button>
          </div>
          <div className="ph-categories-row">
            <button
              className={`ph-category-chip ${activeCategory === 'All' ? 'ph-category-chip--active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              <span className="ph-category-chip__icon">📚</span>
              All
              <span className="ph-category-chip__arrow">›</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`ph-category-chip ${activeCategory === cat.name ? 'ph-category-chip--active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <span className="ph-category-chip__icon">{CATEGORY_ICONS[cat.name] || CATEGORY_ICONS.default}</span>
                {cat.name}
                <span className="ph-category-chip__arrow">›</span>
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* ── Recently Added (cream background section) ── */}
      <div className="ph-recently-grid" style={{ marginTop: 48 }}>
        <div className="ph-recently-grid__inner">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Recently added</h2>
            <button className="ph-section-see-all" onClick={() => setShowAuthModal(true)}>See all ›</button>
          </div>
          <div className="ph-recently-books">
            {recentlyAdded.map(book => (
              <button key={book.id} className="ph-recently-card" onClick={() => setShowAuthModal(true)}>
                <div className="ph-recently-card__cover">
                  <img src={getImageUrl(book.imageUrl)} alt={book.title}
                    onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                </div>
                <div className="ph-recently-card__title">{book.title}</div>
                <div className="ph-recently-card__author">{book.author}</div>
                <div className="ph-recently-card__meta">
                  <span className="ph-recently-card__price">Rs {Number(book.price).toLocaleString('en-LK')}</span>
                  {book.salePrice && (
                    <span className="ph-recently-card__old-price">Rs {Number(book.salePrice).toLocaleString('en-LK')}</span>
                  )}
                  <span className="ph-recently-card__cart-icon">🛒</span>
                  <span>4.7</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bestsellers ── */}
      <div className="ph-sections" style={{ paddingTop: 48 }}>
        <section className="ph-section">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Best seller of all time</h2>
            <button className="ph-section-see-all" onClick={() => setShowAuthModal(true)}>See all ›</button>
          </div>
          <div className="ph-bestseller-grid">
            {bestSellers.map((book, i) => (
              <div key={book.id} className="ph-bestseller-card" onClick={() => setShowAuthModal(true)}>
                <div className="ph-bestseller-card__cover" style={{ background: BG_COLORS[i % BG_COLORS.length] }}>
                  <img src={getImageUrl(book.imageUrl)} alt={book.title}
                    onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                  <div className="ph-bestseller-card__ribbon">Read a little</div>
                  <span className="ph-bestseller-card__link">↗</span>
                </div>
                <div className="ph-bestseller-card__info">
                  <div className="ph-bestseller-card__title">{book.title}</div>
                  <div className="ph-bestseller-card__by">By: {book.author}</div>
                  <div className="ph-bestseller-card__price-row">
                    <div>
                      <span className="ph-bestseller-card__price">Rs {Number(book.price).toLocaleString('en-LK')}</span>
                      {book.salePrice && <span className="ph-bestseller-card__old"> Rs {Number(book.salePrice).toLocaleString('en-LK')}</span>}
                    </div>
                    <div className="ph-bestseller-card__rating">★ 4.7 🛒</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Promo Banners */}
        <div className="ph-promos">
          {[
            { pct: '20%', label: 'for comics books!' },
            { pct: '25%', label: 'for science fiction books!' },
            { pct: '15%', label: 'for novels!' },
          ].map((p, i) => (
            <div key={i} className="ph-promo-card" onClick={() => setShowAuthModal(true)}>
              <div className="ph-promo-card__text">
                <div className="ph-promo-card__pct">Flat <span>{p.pct} OFF</span></div>
                <div className="ph-promo-card__label">{p.label}</div>
                <div className="ph-promo-card__link">View details →</div>
              </div>
              {books[i] && (
                <div className="ph-promo-card__books">
                  <img src={getImageUrl(books[i]?.imageUrl)} alt="" onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Popular This Month */}
        <section className="ph-section">
          <div className="ph-section-header">
            <h2 className="ph-section-title">Popular this month</h2>
            <button className="ph-section-see-all" onClick={() => setShowAuthModal(true)}>See all ›</button>
          </div>
          <div className="ph-bestseller-grid">
            {popularThisMonth.map((book, i) => (
              <div key={book.id} className="ph-bestseller-card" onClick={() => setShowAuthModal(true)}>
                <div className="ph-bestseller-card__cover" style={{ background: BG_COLORS[(i + 2) % BG_COLORS.length] }}>
                  <img src={getImageUrl(book.imageUrl)} alt={book.title}
                    onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }} />
                </div>
                <div className="ph-bestseller-card__info">
                  <div className="ph-bestseller-card__title">{book.title}</div>
                  <div className="ph-bestseller-card__by">By: {book.author}</div>
                  <div className="ph-bestseller-card__price-row">
                    <span className="ph-bestseller-card__price">Rs {Number(book.price).toLocaleString('en-LK')}</span>
                    {book.salePrice && <span className="ph-bestseller-card__old"> Rs {Number(book.salePrice).toLocaleString('en-LK')}</span>}
                  </div>
                  <button className="ph-book-card__btn" style={{ marginTop: 8 }} onClick={e => { e.stopPropagation(); setShowAuthModal(true); }}>Add to cart</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="ph-section ph-testimonials" style={{ paddingBottom: 20 }}>
          <h2 className="ph-testimonials-title">Our happy customers</h2>
          <div className="ph-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="ph-testimonial-card">
                <div className="ph-testimonial-card__header">
                  <div className="ph-testimonial-card__user">
                    <img className="ph-testimonial-card__avatar" src={`https://i.pravatar.cc/40?img=${i + 1}`} alt={t.name}
                      onError={e => { e.target.onerror = null; e.target.src = 'https://i.pravatar.cc/40?img=' + i; }} />
                    <div>
                      <div className="ph-testimonial-card__name">{t.name}</div>
                      <div className="ph-testimonial-card__handle">{t.handle}</div>
                    </div>
                  </div>
                  <span className="ph-testimonial-card__x">𝕏</span>
                </div>
                <p className="ph-testimonial-card__text">{t.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <PaperHavenFooter onCategoryClick={setActiveCategory} />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="ph-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="ph-modal ph-auth-modal" onClick={e => e.stopPropagation()}>
            <div className="ph-auth-modal__icon">🔒</div>
            <div className="ph-auth-modal__title">Authentication Required</div>
            <p className="ph-auth-modal__desc">Please register or login to add books to your cart and enjoy shopping!</p>
            <div className="ph-auth-modal__buttons">
              <button className="ph-btn ph-btn--primary ph-btn--lg" onClick={() => { setShowAuthModal(false); navigate('/register'); }}>
                Register Now
              </button>
              <button className="ph-btn ph-btn--outline ph-btn--lg" onClick={() => { setShowAuthModal(false); navigate('/login'); }}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

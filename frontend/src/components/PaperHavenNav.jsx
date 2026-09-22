// src/components/PaperHavenNav.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PaperHaven.css';

/**
 * Shared BOOKS navigation bar.
 * Props:
 *   user             — auth user object (null = guest)
 *   cartCount        — number of items in cart
 *   onLogout         — logout handler
 *   activeLink       — 'home' | 'shop' | 'ebook' | 'about' | 'wishlist' | 'cart'
 *   onSearch         — optional search handler(query)
 *   categories       — array of category objects [{ id, name }]
 *   onCategorySelect — callback(categoryName) when a category is clicked
 *   activeCategory   — currently selected category name
 */
export default function PaperHavenNav({
  user,
  cartCount = 0,
  onLogout,
  activeLink = '',
  onSearch,
  categories = [],
  onCategorySelect,
  activeCategory = 'All',
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const getInitial = () => {
    if (!user) return '?';
    return (user.name || user.email || 'U').charAt(0).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCatOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCategoryClick = (name) => {
    if (onCategorySelect) onCategorySelect(name);
    setCatOpen(false);
  };

  return (
    <header className="ph-nav">
      {/* Brand */}
      <Link to={user ? '/home' : '/'} className="ph-nav__brand">
        BOOKS
      </Link>

      {/* Center Nav Links */}
      <nav>
        <ul className="ph-nav__links">
          <li>
            <Link to={user ? '/home' : '/'} className={`ph-nav__link ${activeLink === 'home' ? 'ph-nav__link--active' : ''}`}>
              Home
            </Link>
          </li>
          {/* Categories Dropdown */}
          <li className="ph-nav__dropdown-wrap" ref={dropdownRef}>
            <button
              className={`ph-nav__link ph-nav__dropdown-trigger ${catOpen ? 'ph-nav__link--active' : ''}`}
              onClick={() => setCatOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={catOpen}
            >
              Categories
              <svg
                className={`ph-nav__dropdown-caret ${catOpen ? 'ph-nav__dropdown-caret--open' : ''}`}
                width="10" height="10" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {catOpen && (
              <div className="ph-nav__dropdown" role="listbox">
                <button
                  className={`ph-nav__dropdown-item ${activeCategory === 'All' ? 'ph-nav__dropdown-item--active' : ''}`}
                  onClick={() => handleCategoryClick('All')}
                >
                  All Books
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`ph-nav__dropdown-item ${activeCategory === cat.name ? 'ph-nav__dropdown-item--active' : ''}`}
                    onClick={() => handleCategoryClick(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </li>

          <li>
            <button className="ph-nav__link">E-book</button>
          </li>
          <li>
            <button className="ph-nav__link">About</button>
          </li>

          {user && (
            <li>
              <Link to="/cart" className={`ph-nav__link ${activeLink === 'cart' ? 'ph-nav__link--active' : ''}`}>
                My Cart
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Right Side */}
      <div className="ph-nav__right">
        {/* Search */}
        <form className="ph-nav__search" onSubmit={handleSearchSubmit}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search books"
          />
        </form>

        {user ? (
          /* Logged-in state */
          <div className="ph-nav__user-menu">
            {/* Cart icon */}
            <Link to="/cart" className="ph-nav__cart" aria-label="My cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && <span className="ph-nav__cart-badge">{cartCount}</span>}
            </Link>

            {/* Profile avatar */}
            <Link to="/profile" className="ph-nav__avatar" title={user.name || user.email}>
              {user.profileImage
                ? <img src={user.profileImage} alt="profile" />
                : getInitial()
              }
            </Link>

            {/* Logout */}
            <button
              className="ph-btn ph-btn--outline ph-btn--sm"
              onClick={onLogout}
              style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.8rem' }}
            >
              Logout
            </button>
          </div>
        ) : (
          /* Guest state */
          <div className="ph-nav__user-menu">
            <span style={{ fontSize: '0.78rem', color: 'var(--ph-muted)', marginRight: '2px' }}>EN</span>
            <Link to="/login" className="ph-btn ph-btn--outline ph-btn--sm" style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.8rem' }}>
              Login
            </Link>
            <Link to="/register" className="ph-btn ph-btn--primary ph-btn--sm" style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.8rem' }}>
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

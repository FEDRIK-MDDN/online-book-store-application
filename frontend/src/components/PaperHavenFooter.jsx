// src/components/PaperHavenFooter.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './PaperHaven.css';

export default function PaperHavenFooter({ onCategoryClick }) {
  return (
    <footer className="ph-footer">
      <div className="ph-footer__grid">
        {/* Brand + newsletter */}
        <div>
          <div className="ph-footer__brand-name">BOOKS</div>
          <p className="ph-footer__brand-desc">
            Curated reads from across the world. Join thousands of readers discovering
            new favorites every week.
          </p>
          <form className="ph-footer__newsletter" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Enter your email for deals & updates" aria-label="Email for newsletter" />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        {/* Browse */}
        <div className="ph-footer__col">
          <div className="ph-footer__col-title">Browse</div>
          <ul>
            <li><button className="ph-footer__col-link" onClick={() => onCategoryClick?.('All')}>All books</button></li>
            <li><button className="ph-footer__col-link" onClick={() => onCategoryClick?.('Fiction')}>Fiction</button></li>
            <li><button className="ph-footer__col-link" onClick={() => onCategoryClick?.('Science Fiction')}>Sci-Fi</button></li>
            <li><button className="ph-footer__col-link" onClick={() => onCategoryClick?.('Education')}>Education</button></li>
          </ul>
        </div>

        {/* Help */}
        <div className="ph-footer__col">
          <div className="ph-footer__col-title">Help</div>
          <ul>
            <li><button className="ph-footer__col-link">Shipping & Returns</button></li>
            <li><button className="ph-footer__col-link">Support</button></li>
            <li><button className="ph-footer__col-link">Gift Cards</button></li>
            <li><button className="ph-footer__col-link">FAQs</button></li>
          </ul>
        </div>

        {/* Company */}
        <div className="ph-footer__col">
          <div className="ph-footer__col-title">Company</div>
          <ul>
            <li><button className="ph-footer__col-link">About Us</button></li>
            <li><button className="ph-footer__col-link">Careers</button></li>
            <li><button className="ph-footer__col-link">Press</button></li>
          </ul>
        </div>

        {/* Follow */}
        <div className="ph-footer__col">
          <div className="ph-footer__col-title">Follow</div>
          <div className="ph-footer__social">
            <button className="ph-footer__social-btn" aria-label="Twitter">𝕏</button>
            <button className="ph-footer__social-btn" aria-label="Instagram">📸</button>
            <button className="ph-footer__social-btn" aria-label="Facebook">f</button>
            <button className="ph-footer__social-btn" aria-label="YouTube">▶</button>
          </div>
        </div>
      </div>

      <div className="ph-footer__bottom">
        <p className="ph-footer__copy">© {new Date().getFullYear()} BOOKS. All rights reserved.</p>
        <nav className="ph-footer__legal">
          <button>Privacy</button>
          <button>Terms</button>
          <button>Cookies</button>
        </nav>
      </div>
    </footer>
  );
}

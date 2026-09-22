// src/pages/UserManagement/Login.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, adminApi, publicApi } from '../../api';
import { useAuth } from '../../authContext';
import './auth.css';

function getImageUrl(imageUrl) {
  if (!imageUrl) return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) return imageUrl;
  return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  const isAdminLogin = location.pathname === '/admin/login' ||
    location.state?.from?.pathname?.startsWith('/admin');

  const [form, setForm] = useState({
    email: location.state?.email || '',
    password: '',
    remember: true,
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [heroBooks, setHeroBooks] = useState([]);

  useEffect(() => {
    publicApi.getBooks()
      .then(data => setHeroBooks(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setHeroBooks([]));
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!form.email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email is invalid';
    if (!form.password) return 'Password is required';
    return null;
  };

  const pwStrength = useMemo(() => {
    const pw = form.password;
    if (!pw) return { score: 0, label: 'Empty' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong', 'Very strong'];
    return { score, label: labels[score] };
  }, [form.password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);
    setError('');
    setBusy(true);
    try {
      const loginMethod = isAdminLogin ? adminApi.login : api.login;
      const res = await loginMethod({ email: form.email, password: form.password });
      const baseUser = res.user || res.raw || { email: form.email };
      const token = res.token || null;
      if (!token) { setError('Login failed: no token received from server'); return; }
      login({ ...baseUser, token, remember: form.remember });
      const role = (baseUser.role || '').toUpperCase();
      if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ph-auth-page">
      {/* Left Panel */}
      <div className="ph-auth-left">
        <div className="ph-auth-left__content">
          <div className="ph-auth-left__logo">BOOKS</div>
          <h2 className="ph-auth-left__title">Your Next Great<br />Read Awaits</h2>
          <p className="ph-auth-left__desc">
            Join thousands of readers discovering curated books every day.
            Sign in to access your personalized library.
          </p>
          <div className="ph-auth-hero-books">
            {heroBooks[1] && (
              <div className="ph-auth-hero-book ph-auth-hero-book--side">
                <img
                  src={getImageUrl(heroBooks[1].imageUrl)}
                  alt={heroBooks[1].title}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }}
                />
              </div>
            )}
            {heroBooks[0] && (
              <div className="ph-auth-hero-book ph-auth-hero-book--main">
                <img
                  src={getImageUrl(heroBooks[0].imageUrl)}
                  alt={heroBooks[0].title}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }}
                />
              </div>
            )}
            {heroBooks[2] && (
              <div className="ph-auth-hero-book ph-auth-hero-book--side">
                <img
                  src={getImageUrl(heroBooks[2].imageUrl)}
                  alt={heroBooks[2].title}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400'; }}
                />
              </div>
            )}
            {heroBooks.length === 0 && (
              <>
                {['photo-1544947950-fa07a98d237f','photo-1543002588-bfa74002ed7e','photo-1497633762265-9d179a990aa6'].map((id, i) => (
                  <div key={i} className={`ph-auth-hero-book ${i === 1 ? 'ph-auth-hero-book--main' : 'ph-auth-hero-book--side'}`}>
                    <img src={`https://images.unsplash.com/${id}?q=80&w=200`} alt="book" />
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="ph-auth-left__features">
            {['Curated book collections', 'Personalized recommendations', 'Exclusive member discounts'].map((f, i) => (
              <div key={i} className="ph-auth-left__feature">
                <div className="ph-auth-left__feature-icon">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="ph-auth-right">
        <div className="ph-auth-form-wrap">
          <div className="ph-auth-form__logo">BOOKS</div>
          <h1 className="ph-auth-form__title">{isAdminLogin ? 'Admin Sign in' : 'Welcome back'}</h1>
          <p className="ph-auth-form__sub">Please enter your details to continue.</p>

          {location.state?.registered && (
            <div className="ph-auth-info" role="status">✓ Account created. Please sign in.</div>
          )}
          {error && <div className="ph-auth-error" role="alert">⚠ {error}</div>}

          <form onSubmit={onSubmit} aria-labelledby="loginTitle" noValidate>
            {/* Email */}
            <div className="ph-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" name="email" value={form.email} onChange={onChange}
                placeholder="you@example.com" autoComplete="email" disabled={busy} required />
            </div>

            {/* Password */}
            <div className="ph-field">
              <label htmlFor="password">Password</label>
              <div className="ph-field__input-wrap">
                <input id="password" type={showPw ? 'text' : 'password'} name="password"
                  value={form.password} onChange={onChange} placeholder="••••••••"
                  autoComplete="current-password" disabled={busy} required
                  style={{ paddingRight: '52px' }} />
                <button type="button" className="ph-field__toggle" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide' : 'Show'}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && (
                <div className="ph-pw-strength">
                  <div className="ph-pw-bar-track"><div className={`ph-pw-bar ph-pw-bar--${pwStrength.score}`} /></div>
                  <span className="ph-pw-label">{pwStrength.label}</span>
                </div>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="ph-auth-row">
              <label className="ph-checkbox">
                <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} disabled={busy} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="ph-auth-link">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button id="login-submit-btn" className="ph-auth-submit" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : (isAdminLogin ? 'Admin Sign In' : 'Sign In')}
            </button>
          </form>

          <div className="ph-auth-divider"><span>or continue with</span></div>

          <div className="ph-social-grid">
            <button type="button" className="ph-social-btn" disabled={busy}>
              🔵 Microsoft
            </button>
            <button type="button" className="ph-social-btn" disabled={busy}>
              🔴 Google
            </button>
          </div>

          <p className="ph-auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="ph-auth-link">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// src/pages/UserManagement/Register.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, publicApi } from '../../api';
import { useAuth } from '../../authContext';
import './auth.css';
import './Register.css';

function getImageUrl(imageUrl) {
  if (!imageUrl) return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=400';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) return imageUrl;
  return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', acceptTerms: false });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email is invalid';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) return 'Password must include an uppercase letter';
    if (!/[0-9]/.test(form.password)) return 'Password must include a number';
    if (form.password !== form.confirm) return 'Passwords do not match';
    if (!form.acceptTerms) return 'You must accept the Terms & Privacy Policy';
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
    setError(''); setBusy(true);
    try {
      const res = await api.register({ name: form.name.trim(), email: form.email.trim(), password: form.password, confirmPassword: form.confirm });
      if (res?.token) {
        const baseUser = res.user || { name: form.name.trim(), email: form.email.trim() };
        login({ ...baseUser, token: res.token });
        navigate('/home', { replace: true });
      } else {
        navigate('/login', { replace: true, state: { registered: true, email: form.email.trim() } });
      }
    } catch (err) {
      const details = err?.data?.errors ? Object.values(err.data.errors).flat().join('\n') : '';
      setError(details || err.message || 'Registration failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="ph-auth-page">
      {/* Left Panel */}
      <div className="ph-auth-left">
        <div className="ph-auth-left__content">
          <div className="ph-auth-left__logo">BOOKS</div>
          <h2 className="ph-auth-left__title">Join the World<br />of Readers</h2>
          <p className="ph-auth-left__desc">
            Create your account and dive into a universe of stories, knowledge, and discovery.
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
                {['photo-1512820790803-83ca734da794','photo-1481627834876-b7833e8f5570','photo-1531988042231-d39a9cc12a9a'].map((id, i) => (
                  <div key={i} className={`ph-auth-hero-book ${i === 1 ? 'ph-auth-hero-book--main' : 'ph-auth-hero-book--side'}`}>
                    <img src={`https://images.unsplash.com/${id}?q=80&w=200`} alt="book" />
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="ph-auth-left__features">
            {['Free account forever', 'Access thousands of books', 'Personalized reading lists'].map((f, i) => (
              <div key={i} className="ph-auth-left__feature">
                <div className="ph-auth-left__feature-icon">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="ph-auth-right">
        <div className="ph-auth-form-wrap">
          <div className="ph-auth-form__logo">BOOKS</div>
          <h1 className="ph-auth-form__title">Create account</h1>
          <p className="ph-auth-form__sub">Join the community and start reading today.</p>

          {error && <div className="ph-auth-error" role="alert">⚠ {error}</div>}

          <form onSubmit={onSubmit} aria-labelledby="registerTitle" noValidate>
            {/* Name */}
            <div className="ph-field">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" name="name" value={form.name} onChange={onChange}
                placeholder="Your name" autoComplete="name" disabled={busy} required />
            </div>

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
                  value={form.password} onChange={onChange} placeholder="Min. 8 characters"
                  autoComplete="new-password" disabled={busy} required style={{ paddingRight: '52px' }} />
                <button type="button" className="ph-field__toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="ph-pw-strength">
                <div className="ph-pw-bar-track"><div className={`ph-pw-bar ph-pw-bar--${pwStrength.score}`} /></div>
                <span className="ph-pw-label">{pwStrength.label}</span>
              </div>
              <ul className="ph-pw-hints">
                <li>At least 8 characters</li>
                <li>Include uppercase and a number</li>
              </ul>
            </div>

            {/* Confirm Password */}
            <div className="ph-field">
              <label htmlFor="confirm">Confirm password</label>
              <div className="ph-field__input-wrap">
                <input id="confirm" type={showConfirm ? 'text' : 'password'} name="confirm"
                  value={form.confirm} onChange={onChange} placeholder="••••••••"
                  autoComplete="new-password" disabled={busy} required style={{ paddingRight: '52px' }} />
                <button type="button" className="ph-field__toggle" onClick={() => setShowConfirm(s => !s)}>
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div style={{ marginBottom: 20 }}>
              <label className="ph-checkbox">
                <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={onChange} disabled={busy} required />
                <span style={{ fontSize: '0.82rem', color: 'var(--ph-muted)' }}>
                  I agree to the <Link to="/terms" className="ph-auth-link">Terms</Link> &{' '}
                  <Link to="/privacy" className="ph-auth-link">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <button id="register-submit-btn" className="ph-auth-submit" type="submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="ph-auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="ph-auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

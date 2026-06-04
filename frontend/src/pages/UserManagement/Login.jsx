// src/pages/UserManagement/Login.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, adminApi } from '../../api';
import { useAuth } from '../../authContext';
import './auth.css'; // make sure this path is correct

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  // Check if trying to access admin route
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

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      // Use adminApi for admin login, regular api for user login
      const loginMethod = isAdminLogin ? adminApi.login : api.login;
      const res = await loginMethod({ email: form.email, password: form.password });
      const baseUser = res.user || { email: form.email };
      // If backend uses session cookies and doesn't return a token,
      // mark token as 'session' to treat as authenticated in the app.
      const token = res.token || 'session';
      login({ ...baseUser, token, remember: form.remember });
      
      // Redirect based on user role
      if (baseUser.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={onSubmit} aria-labelledby="loginTitle">
        <div className="auth-header">
          <h2 id="loginTitle">{isAdminLogin ? 'Admin Sign in' : 'Sign in'}</h2>
          <p className="auth-subtitle">Welcome back! Please enter your details.</p>
        </div>

        {location.state?.registered && (
          <div className="auth-info" role="status">Account created. Please sign in.</div>
        )}

        {error && <div className="auth-error" role="alert">{error}</div>}

        {/* Email */}
        <label className="auth-label" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            autoComplete="email"
            className="auth-input"
            disabled={busy}
            required
          />
        </label>

        {/* Password + toggle */}
        <label className="auth-label" htmlFor="password">
          Password
          <div className="pw-wrapper">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
              autoComplete="current-password"
              className="auth-input"
              disabled={busy}
              required
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="pw-strength" aria-live="polite">
            <div className={`pw-bar pw-bar--${pwStrength.score}`}></div>
            <span className="pw-label">{pwStrength.label}</span>
          </div>
        </label>

        {/* Row */}
        <div className="auth-row">
          <label className="checkbox">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={onChange}
              disabled={busy}
            />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="auth-link">Change password?</Link>
        </div>

        {/* Submit */}
        <button className="btn btn--primary auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Login'}
        </button>

        {/* Divider */}
        <div className="auth-divider"><span>OR</span></div>

        {/* Social (optional, wire later) */}
        <div className="social-grid">
          <button type="button" className="btn btn--outline social-btn" disabled={busy}>
            <span>🔵</span> Continue with Microsoft
          </button>
          <button type="button" className="btn btn--outline social-btn" disabled={busy}>
            <span>🟥</span> Continue with Google
          </button>
        </div>

        {/* Footer */}
        <p className="auth-footer">
          No account? <Link to="/register" className="auth-link">Register</Link>
        </p>
      </form>
    </div>
  );
}

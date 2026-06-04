
// src/pages/UserManagement/Register.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../authContext';
import './Register.css'; // new stylesheet for register

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    acceptTerms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
    setError('');
    setBusy(true);
    try {
      const res = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirm,
      });
      if (res?.token) {
        const baseUser = res.user || { name: form.name.trim(), email: form.email.trim() };
        // Auto-login after register
        login({ ...baseUser, token: res.token });
        navigate('/home', { replace: true });
      } else {
        // Registration successful but no token; go to Login with prefilled email
        navigate('/login', {
          replace: true,
          state: { registered: true, email: form.email.trim() },
        });
      }
    } catch (err) {
      const details = err?.data?.errors
        ? Object.values(err.data.errors).flat().join('\n')
        : '';
      setError(details || err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={onSubmit} aria-labelledby="registerTitle">
        <div className="auth-header">
          <h2 id="registerTitle">Create account</h2>
          <p className="auth-subtitle">Join the community and start reading today.</p>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        {/* Name */}
        <label className="auth-label" htmlFor="name">
          Name
          <input
            id="name"
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Your name"
            autoComplete="name"
            className="auth-input"
            disabled={busy}
            required
          />
        </label>

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

        {/* Password + toggle + strength */}
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
              autoComplete="new-password"
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
          <ul className="pw-hints">
            <li>At least 8 characters</li>
            <li>Include uppercase and a number</li>
          </ul>
        </label>

        {/* Confirm password + toggle */}
        <label className="auth-label" htmlFor="confirm">
          Confirm password
          <div className="pw-wrapper">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              name="confirm"
              value={form.confirm}
              onChange={onChange}
              placeholder="••••••••"
              autoComplete="new-password"
              className="auth-input"
              disabled={busy}
              required
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {/* Terms */}
        <div className="auth-row">
          <label className="checkbox">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={onChange}
              disabled={busy}
              required
            />
            <span>
              I agree to the <Link to="/terms" className="auth-link">Terms</Link> &amp;{' '}
              <Link to="/privacy" className="auth-link">Privacy Policy</Link>
            </span>
          </label>
        </div>

        {/* Submit */}
        <button className="btn btn--primary auth-submit" disabled={busy}>
          {busy ? 'Creating…' : 'Register'}
        </button>

        {/* Footer */}
        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Login</Link>
        </p>
      </form>
    </div>
  );
}

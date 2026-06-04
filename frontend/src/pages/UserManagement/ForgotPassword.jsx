// src/pages/UserManagement/ForgotPassword.jsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../authContext';
import './auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = () => {
    if (!form.email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email is invalid';
    if (!form.oldPassword) return 'Current password is required';
    if (!form.newPassword) return 'New password is required';
    if (form.newPassword.length < 8) return 'New password must be at least 8 characters';
    if (!form.confirmPassword) return 'Please confirm your new password';
    if (form.newPassword !== form.confirmPassword) return 'New passwords do not match';
    if (form.oldPassword === form.newPassword) return 'New password must be different from current password';
    return null;
  };

  const passwordStrength = useMemo(() => {
    const pw = form.newPassword;
    if (!pw) return { score: 0, label: 'Empty' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong', 'Very strong'];
    return { score, label: labels[score] };
  }, [form.newPassword]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);
    
    setError('');
    setBusy(true);
    
    try {
      // Call your API to change password
      await api.changePassword({
        email: form.email,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Password Changed Successfully!</h2>
            <p className="auth-subtitle">
              Your password has been updated successfully.
            </p>
          </div>
          
          <div className="auth-info" role="status">
            You can now login with your new password.
          </div>

          <Link to="/login" className="btn btn--primary auth-submit">
            Go to Login
          </Link>

          <p className="auth-footer">
            Want to change it again? 
            <button 
              type="button" 
              className="auth-link"
              style={{ background: 'none', border: 'none', padding: 0, marginLeft: '4px' }}
              onClick={() => {
                setSuccess(false);
                setForm({ email: '', oldPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              Change password
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={onSubmit} aria-labelledby="changePasswordTitle">
        <div className="auth-header">
          <h2 id="changePasswordTitle">Change Password</h2>
          <p className="auth-subtitle">
            Enter your current password and choose a new one.
          </p>
        </div>

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

        {/* Current Password */}
        <label className="auth-label" htmlFor="oldPassword">
          Current Password
          <div className="pw-wrapper">
            <input
              id="oldPassword"
              type={showPasswords.old ? 'text' : 'password'}
              name="oldPassword"
              value={form.oldPassword}
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
              onClick={() => togglePassword('old')}
              aria-label={showPasswords.old ? 'Hide password' : 'Show password'}
            >
              {showPasswords.old ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {/* New Password */}
        <label className="auth-label" htmlFor="newPassword">
          New Password
          <div className="pw-wrapper">
            <input
              id="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              name="newPassword"
              value={form.newPassword}
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
              onClick={() => togglePassword('new')}
              aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
            >
              {showPasswords.new ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="pw-strength" aria-live="polite">
            <div className={`pw-bar pw-bar--${passwordStrength.score}`}></div>
            <span className="pw-label">{passwordStrength.label}</span>
          </div>
        </label>

        {/* Confirm New Password */}
        <label className="auth-label" htmlFor="confirmPassword">
          Confirm New Password
          <div className="pw-wrapper">
            <input
              id="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
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
              onClick={() => togglePassword('confirm')}
              aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
            >
              {showPasswords.confirm ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {/* Submit */}
        <button className="btn btn--primary auth-submit" disabled={busy}>
          {busy ? 'Changing Password...' : 'Change Password'}
        </button>

        {/* Footer */}
        <p className="auth-footer">
          <Link to="/login" className="auth-link">← Back to login</Link>
        </p>
      </form>
    </div>
  );
}
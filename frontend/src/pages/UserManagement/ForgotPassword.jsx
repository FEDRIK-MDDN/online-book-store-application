// src/pages/UserManagement/ForgotPassword.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import './auth.css';

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const togglePassword = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

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
    setError(''); setBusy(true);
    try {
      await api.changePassword({ email: form.email, oldPassword: form.oldPassword, newPassword: form.newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please check your current password.');
    } finally { setBusy(false); }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ph-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'var(--ph-white)', borderRadius: 'var(--radius-lg)', padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--ph-border)', animation: 'scaleIn 0.3s ease-out' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ph-dark)', marginBottom: 10 }}>Password Changed!</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--ph-muted)', marginBottom: 28 }}>
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ph-gold)', color: '#fff', padding: '12px 28px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', transition: 'background 0.2s' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ph-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--ph-white)', borderRadius: 'var(--radius-lg)', padding: '48px 40px', maxWidth: 460, width: '100%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--ph-border)', animation: 'slideUp 0.4s ease-out' }}>

        {/* Logo */}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ph-gold)', marginBottom: 24, textAlign: 'center' }}>
          BOOKS
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--ph-dark)', marginBottom: 6 }}>
          Change Password
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--ph-muted)', marginBottom: 28 }}>
          Enter your current password and choose a new one.
        </p>

        {error && <div className="ph-auth-error" role="alert">⚠ {error}</div>}

        <form onSubmit={onSubmit} noValidate>
          {/* Email */}
          <div className="ph-field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" name="email" value={form.email} onChange={onChange}
              placeholder="you@example.com" autoComplete="email" disabled={busy} required />
          </div>

          {/* Current Password */}
          <div className="ph-field">
            <label htmlFor="oldPassword">Current Password</label>
            <div className="ph-field__input-wrap">
              <input id="oldPassword" type={showPasswords.old ? 'text' : 'password'} name="oldPassword"
                value={form.oldPassword} onChange={onChange} placeholder="••••••••"
                autoComplete="current-password" disabled={busy} required style={{ paddingRight: '52px' }} />
              <button type="button" className="ph-field__toggle" onClick={() => togglePassword('old')}>
                {showPasswords.old ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="ph-field">
            <label htmlFor="newPassword">New Password</label>
            <div className="ph-field__input-wrap">
              <input id="newPassword" type={showPasswords.new ? 'text' : 'password'} name="newPassword"
                value={form.newPassword} onChange={onChange} placeholder="Min. 8 characters"
                autoComplete="new-password" disabled={busy} required style={{ paddingRight: '52px' }} />
              <button type="button" className="ph-field__toggle" onClick={() => togglePassword('new')}>
                {showPasswords.new ? 'Hide' : 'Show'}
              </button>
            </div>
            {form.newPassword && (
              <div className="ph-pw-strength">
                <div className="ph-pw-bar-track"><div className={`ph-pw-bar ph-pw-bar--${passwordStrength.score}`} /></div>
                <span className="ph-pw-label">{passwordStrength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="ph-field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="ph-field__input-wrap">
              <input id="confirmPassword" type={showPasswords.confirm ? 'text' : 'password'} name="confirmPassword"
                value={form.confirmPassword} onChange={onChange} placeholder="••••••••"
                autoComplete="new-password" disabled={busy} required style={{ paddingRight: '52px' }} />
              <button type="button" className="ph-field__toggle" onClick={() => togglePassword('confirm')}>
                {showPasswords.confirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button className="ph-auth-submit" type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? 'Changing Password…' : 'Change Password'}
          </button>
        </form>

        <p className="ph-auth-footer" style={{ marginTop: 20 }}>
          <Link to="/login" className="ph-auth-link">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
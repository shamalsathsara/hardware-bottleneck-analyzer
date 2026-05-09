//The entire visual Sign In and Sign Up screen

import { useState } from 'react';
import axios from 'axios';

/* SVG Icons  */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/*  AuthPage Component */
export default function AuthPage({ onLogin }) {
  const [mode, setMode]           = useState('login');   // 'login' | 'register'
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (!username.trim()) return setError('Username is required.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login'
        ? 'http://localhost:4000/api/auth/login'
        : 'http://localhost:4000/api/auth/register';

      const body = mode === 'login'
        ? { email, password }
        : { username, email, password };

      const { data } = await axios.post(endpoint, body);

      // Persist token + user info
      localStorage.setItem('aura_token', data.token);
      localStorage.setItem('aura_user', JSON.stringify(data.user));

      if (mode === 'register') {
        setSuccess('Account created! Signing you in…');
        setTimeout(() => onLogin(data.user), 800);
      } else {
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo / brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon"><IconBolt /></div>
          <div>
            <div className="auth-brand-name">Project Aura</div>
            <div className="auth-brand-sub">Hardware Bottleneck Analyzer</div>
          </div>
        </div>

        {/* Toggle tabs */}
        <div className="auth-tabs">
          <button
            id="auth-tab-login"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            id="auth-tab-register"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Sign Up
          </button>
          <div className={`auth-tab-indicator ${mode === 'register' ? 'right' : ''}`} />
        </div>

        {/* Heading */}
        <div className="auth-heading">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
          <p className="auth-subheading">
            {mode === 'login'
              ? 'Sign in to access the AI-powered analyzer.'
              : 'Join Project Aura and start analyzing your hardware.'}
          </p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-username">Username</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconUser /></span>
                <input
                  id="auth-username"
                  type="text"
                  placeholder="e.g. ShamalGamer"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email Address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><IconMail /></span>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><IconLock /></span>
              <input
                id="auth-password"
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                id="auth-toggle-password"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">Confirm Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="auth-confirm"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="auth-error">
              <span className="auth-error-icon"><IconWarning /></span>
              {error}
            </div>
          )}
          {success && (
            <div className="auth-success">{success}</div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            className={`auth-submit-btn${loading ? ' loading' : ''}`}
            disabled={loading}
          >
            {loading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer-note">
          {mode === 'login'
            ? <>Don't have an account? <button className="auth-link-btn" onClick={() => switchMode('register')}>Sign Up</button></>
            : <>Already have an account? <button className="auth-link-btn" onClick={() => switchMode('login')}>Sign In</button></>
          }
        </div>
      </div>
    </div>
  );
}

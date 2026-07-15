// Authentication component (Login / Signup)

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
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
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

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/*  AuthPage Component */
export default function AuthPage({ onLogin }) {
  // Form state
  const [mode, setMode]           = useState('login'); // 'login', 'register', 'forgot', 'verify', 'reset'
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [contact, setContact]     = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPass, setShowPass]   = useState(false);
  
  // UI state
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Toggle between auth modes and reset form
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    
    // Don't clear email/code if we are progressing through the reset flow
    if (newMode !== 'verify' && newMode !== 'reset') {
      setUsername('');
      setEmail('');
      setContact('');
      setResetCode('');
    }
    setPassword('');
    setConfirm('');
  };

  // Handle form submission and authentication API calls
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation for registration
    if (mode === 'register') {
      if (!username.trim()) return setError('Username is required.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
       
      // PASSWORD RECOVERY: STEP 1 (Send Email)
      if (mode === 'forgot') {
        // Send the email to the backend to generate a code
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
        setSuccess(data.message);
        
        // Wait 2 seconds so the user can read the success message, then show the "Verify Code" screen
        setTimeout(() => switchMode('verify'), 2000);
      } 
       
      // PASSWORD RECOVERY: STEP 2 (Verify Code)
       
      else if (mode === 'verify') {
        // Send both the email AND the code they just typed to see if it's correct
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-code`, { email, code: resetCode });
        setSuccess('Code verified! Set your new password.');
        
        // Wait 1 second, then show the "New Password" screen
        setTimeout(() => switchMode('reset'), 1000);
      } 
       
      // PASSWORD RECOVERY: STEP 3 (Save New Password)
       
      else if (mode === 'reset') {
        // Basic security check on the frontend before bothering the backend
        if (password.length < 6) { setLoading(false); return setError('Password must be at least 6 characters.'); }
        if (password !== confirm) { setLoading(false); return setError('Passwords do not match.'); }
        
        // Send the email, the code, AND the brand new password to save it
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, { 
          email, code: resetCode, newPassword: password 
        });
        setSuccess('Password reset successfully! Please sign in.');
        
        // Send them back to the login screen so they can use their new password
        setTimeout(() => switchMode('login'), 2000);
      } 
      else {
        // Normal Login / Register flow
        const endpoint = mode === 'login'
          ? `${import.meta.env.VITE_API_URL}/api/auth/login`
          : `${import.meta.env.VITE_API_URL}/api/auth/register`;

        const body = mode === 'login'
          ? { email, password }
          : { username, email, password, contact };

        const { data } = await axios.post(endpoint, body);

        localStorage.setItem('aura_token', data.token);
        localStorage.setItem('aura_user', JSON.stringify(data.user));

        if (mode === 'register') {
          setSuccess('Account created! Signing you in…');
          setTimeout(() => onLogin(data.user), 800);
        } else {
          onLogin(data.user);
        }
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

        {/* Toggle tabs (Only show on login/register) */}
        {['login', 'register'].includes(mode) && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Sign Up
            </button>
            <div className={`auth-tab-indicator ${mode === 'register' ? 'right' : ''}`} />
          </div>
        )}

        {/* 
            UNIVERSAL BACK BUTTON
            This button only shows up if the user is NOT on the main 'login' screen.
            If they click "Forgot Password", "Verify Code", or "Sign Up", they 
            can click this to instantly reset the 'mode' back to 'login'.
         */}
        {mode !== 'login' && (
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={() => switchMode('login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-sub)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                fontWeight: '600',
                padding: '0.4rem 0',
                transition: 'color 0.2s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-sub)'; }}
            >
              <span style={{ width: '16px', height: '16px' }}><IconArrowLeft /></span>
              Back to Login
            </button>
          </div>
        )}

        {/* Heading */}
        <div className="auth-heading">
          {mode === 'login' && 'Welcome back'}
          {mode === 'register' && 'Create your account'}
          {mode === 'forgot' && 'Reset Password'}
          {mode === 'verify' && 'Check Your Email'}
          {mode === 'reset' && 'Create New Password'}
          <p className="auth-subheading">
            {mode === 'login' && 'Sign in to access the AI-powered analyzer.'}
            {mode === 'register' && 'Join Project Aura and start analyzing your hardware.'}
            {mode === 'forgot' && 'Enter your email and we will send you a 6-digit code.'}
            {mode === 'verify' && `We've sent a 6-digit code to ${email}`}
            {mode === 'reset' && 'Enter a strong new password.'}
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

          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-contact">Contact Number</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconPhone /></span>
                <input
                  id="auth-contact"
                  type="text"
                  placeholder="e.g. +1 234 567 8900"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>
          )}

          {/* Email input - used in login, register, and forgot password */}
          {['login', 'register', 'forgot'].includes(mode) && (
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
          )}

          {/* 6-Digit Code input - used in verify mode */}
          {mode === 'verify' && (
            <div className="auth-field">
              <label htmlFor="auth-code">6-Digit Code</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="auth-code"
                  type="text"
                  placeholder="123456"
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))} // numbers only
                  maxLength={6}
                  required
                  style={{ letterSpacing: '0.2em', fontWeight: 'bold' }}
                />
              </div>
            </div>
          )}

          {/* Password input - used in login, register, and reset mode */}
          {['login', 'register', 'reset'].includes(mode) && (
            <div className="auth-field">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label htmlFor="auth-password">{mode === 'reset' ? 'New Password' : 'Password'}</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => switchMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder={['register', 'reset'].includes(mode) ? 'Minimum 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password input */}
          {['register', 'reset'].includes(mode) && (
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
            type="submit"
            className={`auth-submit-btn${loading ? ' loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
               mode === 'login' ? 'Signing in…' : 
               mode === 'register' ? 'Creating account…' : 
               mode === 'forgot' ? 'Sending Code…' :
               mode === 'verify' ? 'Verifying…' :
               'Resetting…'
            ) : (
               mode === 'login' ? 'Sign In' : 
               mode === 'register' ? 'Create Account' : 
               mode === 'forgot' ? 'Send Code' :
               mode === 'verify' ? 'Verify Code' :
               'Reset Password'
            )}
          </button>
        </form>

        <div className="auth-footer-note">
          {['login', 'forgot', 'verify', 'reset'].includes(mode)
            ? <>Don't have an account? <button className="auth-link-btn" onClick={() => switchMode('register')}>Sign Up</button></>
            : <>Already have an account? <button className="auth-link-btn" onClick={() => switchMode('login')}>Sign In</button></>
          }
        </div>
      </div>
    </div>
  );
}

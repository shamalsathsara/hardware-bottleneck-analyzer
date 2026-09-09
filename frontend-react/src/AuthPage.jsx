import { useState } from 'react';
import { 
  loginUser, 
  registerUser, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword, 
  setSession 
} from './services/authService';
import authBg from './assets/auth/auth-bg.jpg';

/* SVG Icons */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="23" x2="23" y2="23"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconDatabase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconGamepad = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="6" />
  </svg>
);

const IconGoogle = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

const IconGithub = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    
    if (newMode !== 'verify' && newMode !== 'reset') {
      setUsername('');
      setEmail('');
      setContact('');
      setResetCode('');
    }
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
      if (mode === 'forgot') {
        const data = await forgotPassword(email);
        setSuccess(data.message);
        setTimeout(() => switchMode('verify'), 2000);
      } else if (mode === 'verify') {
        await verifyResetCode(email, resetCode);
        setSuccess('Code verified! Set your new password.');
        setTimeout(() => switchMode('reset'), 1000);
      } else if (mode === 'reset') {
        if (password.length < 6) { setLoading(false); return setError('Password must be at least 6 characters.'); }
        if (password !== confirm) { setLoading(false); return setError('Passwords do not match.'); }
        
        await resetPassword(email, resetCode, password);
        setSuccess('Password reset successfully! Please sign in.');
        setTimeout(() => switchMode('login'), 2000);
      } else if (mode === 'register') {
        const data = await registerUser(username, email, password, contact);
        setSession(data.token, data.user);
        setSuccess('Account created! Signing you in…');
        setTimeout(() => onLogin(data.user), 800);
      } else {
        const data = await loginUser(email, password);
        setSession(data.token, data.user);
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-split-layout">
      {/* ════════ LEFT VISUAL PANEL (55%) ════════ */}
      <div className="auth-visual-panel">
        <img 
          src={authBg} 
          alt="Project Aura Gaming Battlestation" 
          className="auth-bg-img" 
        />
        <div className="auth-visual-overlay" />

        <div className="auth-visual-content">
          {/* Eyebrow badge */}
          <div className="hero-eyebrow-tag auth-eyebrow">
            <span className="hero-eyebrow-chevron-wrap" aria-hidden="true">
              <svg className="hero-eyebrow-chevron" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5.5 5.5L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 1L11.5 5.5L7 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>PC PERFORMANCE. POWERED BY ML.</span>
          </div>

          {/* Headline */}
          <h1 className="auth-visual-headline">
            Analyze smarter.<br />
            <span className="text-gradient-cyan">Upgrade with confidence.</span>
          </h1>

          {/* Short description */}
          <p className="auth-visual-desc">
            Sign in to save your PC builds, compare rigs, and access personalized performance analysis.
          </p>

          {/* Feature highlights */}
          <div className="auth-feature-cards">
            <div className="auth-feature-card">
              <div className="auth-feature-icon-box">
                <IconDatabase />
              </div>
              <div className="auth-feature-text">
                <span className="auth-feature-title">Save Your Builds</span>
                <span className="auth-feature-sub">Keep track of your PC configurations</span>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon-box">
                <IconChart />
              </div>
              <div className="auth-feature-text">
                <span className="auth-feature-title">Compare Rigs</span>
                <span className="auth-feature-sub">Find the best setup for your games</span>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon-box">
                <IconGamepad />
              </div>
              <div className="auth-feature-text">
                <span className="auth-feature-title">Access History</span>
                <span className="auth-feature-sub">View and manage your past analysis</span>
              </div>
            </div>
          </div>

          {/* Bottom Slogan */}
          <div className="auth-visual-footer">
            <span className="auth-slogan-text">Better PCs. Brighter Games.</span>
            <div className="auth-slogan-line" />
          </div>
        </div>
      </div>

      {/* ════════ RIGHT AUTH PANEL (45%) ════════ */}
      <div className="auth-form-panel">
        <div className="auth-card-container">
          <div className="auth-card">
            {/* Top Brand Logo */}
            <div className="auth-brand-header">
              <div className="auth-brand-logo-wrap">
                <svg viewBox="0 0 24 24" className="auth-brand-logo-svg" fill="none">
                  <path d="M12 2L2 22h5l2.5-5h5l2.5 5h5L12 2zm0 6.5L14.75 14h-5.5L12 8.5z" fill="url(#authBrandGrad)" />
                  <defs>
                    <linearGradient id="authBrandGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#00f2fe" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <div className="auth-brand-title">Project Aura</div>
                <div className="auth-brand-sub">Hardware Bottleneck Analyzer</div>
              </div>
            </div>

            {/* Segmented control tab switcher (for login/register modes) */}
            {['login', 'register'].includes(mode) && (
              <div className="auth-segmented-control" role="tablist" aria-label="Sign in or Sign up">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`auth-segment-btn ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={`auth-segment-btn ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Back Button for Reset/Verify/Forgot */}
            {mode !== 'login' && !['login', 'register'].includes(mode) && (
              <div className="auth-back-row">
                <button 
                  type="button"
                  onClick={() => switchMode('login')}
                  className="auth-back-button"
                  aria-label="Back to Sign In"
                >
                  <IconArrowLeft />
                  <span>Back to Sign In</span>
                </button>
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="auth-header-block">
              <h2 className="auth-main-title">
                {mode === 'login' && 'Welcome back'}
                {mode === 'register' && 'Create your account'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'verify' && 'Check Your Email'}
                {mode === 'reset' && 'Create New Password'}
              </h2>
              <p className="auth-main-subtitle">
                {mode === 'login' && 'Sign in to continue your hardware analysis.'}
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

              {/* Email input */}
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

              {/* 6-Digit Code input */}
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
                      onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      required
                      style={{ letterSpacing: '0.25em', fontWeight: '700', fontSize: '1.1rem' }}
                    />
                  </div>
                </div>
              )}

              {/* Password input */}
              {['login', 'register', 'reset'].includes(mode) && (
                <div className="auth-field">
                  <div className="auth-field-header">
                    <label htmlFor="auth-password">{mode === 'reset' ? 'New Password' : 'Password'}</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => switchMode('forgot')} 
                        className="auth-forgot-link"
                      >
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
                      aria-label={showPass ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
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

              {/* Compact Error Banner */}
              {error && (
                <div className="auth-error-banner" role="alert">
                  <span className="auth-error-icon"><IconWarning /></span>
                  <span className="auth-error-text">{error}</span>
                </div>
              )}

              {/* Compact Success Banner */}
              {success && (
                <div className="auth-success-banner" role="status">
                  <span className="auth-success-text">{success}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                className={`auth-btn-primary${loading ? ' is-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-btn-loading-content">
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>
                      {mode === 'login' ? 'Signing in…' : 
                       mode === 'register' ? 'Creating account…' : 
                       mode === 'forgot' ? 'Sending Code…' :
                       mode === 'verify' ? 'Verifying…' :
                       'Resetting…'}
                    </span>
                  </span>
                ) : (
                  <span className="auth-btn-content">
                    <span>
                      {mode === 'login' ? 'Sign In' : 
                       mode === 'register' ? 'Create Account' : 
                       mode === 'forgot' ? 'Send Code' :
                       mode === 'verify' ? 'Verify Code' :
                       'Reset Password'}
                    </span>
                    <IconArrowRight />
                  </span>
                )}
              </button>
            </form>

            {/* Social Divider & Actions (only on Login / Register) */}
            {['login', 'register'].includes(mode) && (
              <>
                <div className="auth-divider">
                  <span className="auth-divider-line" />
                  <span className="auth-divider-text">OR CONTINUE WITH</span>
                  <span className="auth-divider-line" />
                </div>

                <div className="auth-social-row">
                  <button 
                    type="button" 
                    className="auth-social-btn" 
                    onClick={() => setError('Social sign-in is not configured in this environment.')}
                    aria-label="Sign in with Google"
                  >
                    <IconGoogle />
                    <span>Google</span>
                  </button>
                  <button 
                    type="button" 
                    className="auth-social-btn" 
                    onClick={() => setError('Social sign-in is not configured in this environment.')}
                    aria-label="Sign in with GitHub"
                  >
                    <IconGithub />
                    <span>GitHub</span>
                  </button>
                </div>
              </>
            )}

            {/* Footer switcher note */}
            <div className="auth-footer-note">
              {['login', 'forgot', 'verify', 'reset'].includes(mode) ? (
                <>
                  <span>Don't have an account?</span>{' '}
                  <button 
                    type="button" 
                    className="auth-link-btn" 
                    onClick={() => switchMode('register')}
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>{' '}
                  <button 
                    type="button" 
                    className="auth-link-btn" 
                    onClick={() => switchMode('login')}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

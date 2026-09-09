import { useState } from 'react';

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}>
    <path d="M12 3L2 20h4l3.5-7h5l3.5 7h4L12 3z" />
  </svg>
);

export default function Navbar({ currentRoute, onNavigate, currentUser, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route, e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <nav className="site-nav" role="navigation" aria-label="Main Navigation">
      <div className="nav-container">
        
        {/* Brand Logo */}
        <a 
          href="/" 
          className="nav-logo" 
          onClick={(e) => handleNav('/', e)}
          aria-label="Project Aura Home"
        >
          <LogoIcon />
          <span className="logo-text">Project Aura</span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="nav-links-desktop">
          <a 
            href="/bottleneck-calculator" 
            className={`nav-link ${currentRoute === '/bottleneck-calculator' ? 'active' : ''}`}
            onClick={(e) => handleNav('/bottleneck-calculator', e)}
          >
            Analyze PC
          </a>
          <a 
            href="/games" 
            className={`nav-link ${currentRoute.startsWith('/games') ? 'active' : ''}`}
            onClick={(e) => handleNav('/games', e)}
          >
            Games
          </a>
          <a 
            href="/compare" 
            className={`nav-link ${currentRoute === '/compare' ? 'active' : ''}`}
            onClick={(e) => handleNav('/compare', e)}
          >
            Compare Rigs
          </a>
          <a 
            href="/about" 
            className={`nav-link ${currentRoute === '/about' ? 'active' : ''}`}
            onClick={(e) => handleNav('/about', e)}
          >
            About
          </a>
          <a 
            href="/contact" 
            className={`nav-link ${currentRoute === '/contact' ? 'active' : ''}`}
            onClick={(e) => handleNav('/contact', e)}
          >
            Contact
          </a>
        </div>

        {/* Right Actions (Auth & User controls) */}
        <div className="nav-actions-desktop">
          <a 
            href="/my-rigs" 
            className={`nav-rigs-btn ${currentRoute === '/my-rigs' ? 'active' : ''}`}
            onClick={(e) => handleNav('/my-rigs', e)}
            title="View your saved PC builds"
          >
            My Rigs
          </a>

          {currentUser ? (
            <div className="nav-user-cluster">
              <span className="nav-username" title={`Logged in as ${currentUser.username}`}>
                {currentUser.username}
              </span>
              <button 
                className="nav-logout-btn" 
                onClick={onLogout}
                aria-label="Log out"
              >
                Logout
              </button>
            </div>
          ) : (
            <a 
              href="/auth" 
              className={`nav-signin-btn ${currentRoute === '/auth' ? 'active' : ''}`}
              onClick={(e) => handleNav('/auth', e)}
            >
              Sign In
            </a>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button 
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="nav-mobile-drawer" role="menu">
          <a 
            href="/" 
            className={`mobile-nav-item ${currentRoute === '/' ? 'active' : ''}`}
            onClick={(e) => handleNav('/', e)}
            role="menuitem"
          >
            Home
          </a>
          <a 
            href="/bottleneck-calculator" 
            className={`mobile-nav-item ${currentRoute === '/bottleneck-calculator' ? 'active' : ''}`}
            onClick={(e) => handleNav('/bottleneck-calculator', e)}
            role="menuitem"
          >
            Analyze PC
          </a>
          <a 
            href="/games" 
            className={`mobile-nav-item ${currentRoute.startsWith('/games') ? 'active' : ''}`}
            onClick={(e) => handleNav('/games', e)}
            role="menuitem"
          >
            Games Catalog
          </a>
          <a 
            href="/compare" 
            className={`mobile-nav-item ${currentRoute === '/compare' ? 'active' : ''}`}
            onClick={(e) => handleNav('/compare', e)}
            role="menuitem"
          >
            Compare Rigs
          </a>
          <a 
            href="/about" 
            className={`mobile-nav-item ${currentRoute === '/about' ? 'active' : ''}`}
            onClick={(e) => handleNav('/about', e)}
            role="menuitem"
          >
            About
          </a>
          <a 
            href="/contact" 
            className={`mobile-nav-item ${currentRoute === '/contact' ? 'active' : ''}`}
            onClick={(e) => handleNav('/contact', e)}
            role="menuitem"
          >
            Contact
          </a>

          <div className="mobile-nav-divider" />

          {currentUser ? (
            <div className="mobile-auth-section">
              <a 
                href="/my-rigs" 
                className={`mobile-nav-item ${currentRoute === '/my-rigs' ? 'active' : ''}`}
                onClick={(e) => handleNav('/my-rigs', e)}
                role="menuitem"
              >
                My Rigs ({currentUser.username})
              </a>
              <button 
                className="mobile-logout-btn"
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
              >
                Logout
              </button>
            </div>
          ) : (
            <a 
              href="/auth" 
              className="mobile-nav-item mobile-signin-link"
              onClick={(e) => handleNav('/auth', e)}
              role="menuitem"
            >
              Sign In / Register
            </a>
          )}

          <a 
            href="/bottleneck-calculator" 
            className="mobile-cta-btn"
            onClick={(e) => handleNav('/bottleneck-calculator', e)}
          >
            Analyze My PC
          </a>
        </div>
      )}
    </nav>
  );
}

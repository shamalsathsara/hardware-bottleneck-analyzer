export default function Footer({ onNavigate }) {
  const handleNav = (route, e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onNavigate(route);
  };

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        
        {/* Brand & Mission */}
        <div className="footer-brand-col">
          <div className="footer-brand-header">
            <span className="logo-text">Project Aura</span>
          </div>
          <p className="footer-desc">
            An ML-powered PC gaming performance and bottleneck analysis platform.
            Helping gamers and builders understand hardware balance before upgrading.
          </p>
          <div className="footer-social-links">
            <a href="https://github.com/shamalsathsara" target="_blank" rel="noreferrer" className="social-icon" aria-label="GitHub">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12c0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://linkedin.com/in/shamalsathsara" target="_blank" rel="noreferrer" className="social-icon" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://facebook.com/shamalsathsara" target="_blank" rel="noreferrer" className="social-icon" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 6.03 4.388 11.024 10.125 11.927v-8.43H7.078v-3.497h3.047V9.43c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.248h3.328l-.532 3.497h-2.796v8.43C19.612 23.097 24 18.103 24 12.073z"/></svg>
            </a>
          </div>
        </div>

        {/* Tools Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Performance Tools</h4>
          <ul className="footer-links">
            <li>
              <a href="/bottleneck-calculator" onClick={(e) => handleNav('/bottleneck-calculator', e)}>
                Bottleneck Calculator
              </a>
            </li>
            <li>
              <a href="/compare" onClick={(e) => handleNav('/compare', e)}>
                Compare PC Builds
              </a>
            </li>
            <li>
              <a href="/my-rigs" onClick={(e) => handleNav('/my-rigs', e)}>
                Saved Hardware Profiles
              </a>
            </li>
          </ul>
        </div>

        {/* Platform & Methodology Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Platform</h4>
          <ul className="footer-links">
            <li>
              <a href="/methodology" onClick={(e) => handleNav('/methodology', e)}>
                ML Methodology
              </a>
            </li>
            <li>
              <a href="/about" onClick={(e) => handleNav('/about', e)}>
                About Project
              </a>
            </li>
            <li>
              <a href="/contact" onClick={(e) => handleNav('/contact', e)}>
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Legal &amp; Policies</h4>
          <ul className="footer-links">
            <li>
              <a href="/privacy" onClick={(e) => handleNav('/privacy', e)}>
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" onClick={(e) => handleNav('/terms', e)}>
                Terms of Use
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} <strong>Project Aura</strong>. Built with React, Node.js, Python &amp; Random Forest ML.
          </p>
          <p className="footer-disclaimer-note">
            Performance predictions are ML regression estimates. Real-world gaming results depend on drivers, thermals, and software versions.
          </p>
        </div>
      </div>
    </footer>
  );
}

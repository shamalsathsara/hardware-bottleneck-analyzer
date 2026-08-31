export default function PrivacyPage() {
  return (
    <div className="info-page">
      <div className="info-container">
        
        <header className="info-header">
          <span className="section-eyebrow">Legal &amp; Transparency</span>
          <h1 className="info-headline">Privacy Policy</h1>
          <p className="info-lead">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <section className="info-card">
          <h2 className="info-section-title">1. Introduction</h2>
          <p>
            Project Aura ("we", "our", or "the platform") is committed to protecting your privacy. This Privacy Policy outlines what information we collect when you use our website, how we process that information, and how we keep it secure.
          </p>
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Note: This policy represents our current technical practices and is prepared for public preview. It should be reviewed by legal counsel before commercial monetization.
          </p>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">2. Information We Collect</h2>
          <p>We only collect information strictly required to provide platform functionality:</p>
          <ul className="info-list">
            <li>
              <strong>Public Usage:</strong> When you use our public Bottleneck Calculator or Compare Rigs tool without logging in, your hardware selections (CPU, GPU, RAM, resolution) are processed in real-time to compute predictions. We do not require personal identification to use these tools.
            </li>
            <li>
              <strong>Account Information:</strong> If you voluntarily create an account, we store your chosen username, email address, contact information (if provided), and an encrypted hash of your password (`bcrypt`). We never store plaintext passwords.
            </li>
            <li>
              <strong>Saved Hardware Configurations:</strong> If you use the "Save PC" feature, we store your saved PC names, hardware specifications, and timestamps linked to your user ID.
            </li>
            <li>
              <strong>Server Logs:</strong> Like standard web services, our web server logs standard request metadata (IP address, user-agent, timestamp) to protect against denial-of-service (DoS) attacks and enforce API rate limits.
            </li>
          </ul>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">3. How We Use Your Data</h2>
          <ul className="info-list">
            <li>To compute machine learning bottleneck calculations and predicted FPS.</li>
            <li>To authenticate and maintain your user session via JSON Web Tokens (JWT).</li>
            <li>To retrieve and display your saved PC rigs in your user profile.</li>
            <li>To protect our APIs against abuse through rate limiting.</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            <strong>We do not sell, rent, or trade your personal data to third parties.</strong>
          </p>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">4. Data Security</h2>
          <p>
            We implement security best practices including:
          </p>
          <ul className="info-list">
            <li>Strong password hashing with `bcrypt` (12 rounds).</li>
            <li>JSON Web Tokens (JWT) for stateless, encrypted session verification.</li>
            <li>Database isolation on MongoDB Atlas with IP access restrictions.</li>
            <li>Input validation, string sanitization, and regex escaping to prevent injection attacks.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">5. Data Retention &amp; Deletion</h2>
          <p>
            You may delete any of your saved PC configurations at any time directly from the "My Rigs" dashboard. If you wish to delete your entire user account, you may submit a request through our <a href="/contact" style={{ color: 'var(--primary)' }}>Contact Page</a>.
          </p>
        </section>

      </div>
    </div>
  );
}

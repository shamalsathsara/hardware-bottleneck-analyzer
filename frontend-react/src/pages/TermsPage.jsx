export default function TermsPage() {
  return (
    <div className="info-page">
      <div className="info-container">
        
        <header className="info-header">
          <span className="section-eyebrow">Legal &amp; Terms</span>
          <h1 className="info-headline">Terms of Use</h1>
          <p className="info-lead">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <section className="info-card">
          <h2 className="info-section-title">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Project Aura ("the platform", "our website"), you agree to be bound by these Terms of Use. If you disagree with any part of these terms, please discontinue use of the platform.
          </p>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">2. Informational &amp; Estimation Disclaimer</h2>
          <p>
            <strong>All framerate predictions, bottleneck severity percentages, and hardware recommendations are machine learning estimates provided strictly for informational and educational purposes.</strong>
          </p>
          <ul className="info-list">
            <li>Project Aura does not guarantee exact real-world gaming performance or specific framerates in any game title.</li>
            <li>We do not guarantee physical hardware compatibility (e.g., motherboard socket compatibility, power supply wattage headroom, or PC chassis clearance). Users must always verify manufacturer compatibility before purchasing hardware.</li>
            <li>We are not responsible for any financial decisions, component purchases, or hardware damage resulting from reliance on our analysis tools.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">3. User Accounts &amp; Conduct</h2>
          <p>When creating an account or interacting with our APIs, you agree that you will not:</p>
          <ul className="info-list">
            <li>Provide false registration credentials or create automated accounts.</li>
            <li>Attempt to bypass rate limiting, flood endpoints, or perform denial-of-service attacks.</li>
            <li>Attempt unauthorized access to other users' hardware profiles or private data.</li>
            <li>Reverse engineer, decompile, or exploit our Machine Learning models or proprietary APIs.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">4. Intellectual Property</h2>
          <p>
            The software, user interface design, logos, Machine Learning pipelines, and documentation of Project Aura are the intellectual property of the project creators, protected under applicable copyright and intellectual property laws.
          </p>
        </section>

        <section className="info-card">
          <h2 className="info-section-title">5. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Use at any time. Continued use of the platform following any modifications constitutes acceptance of the revised terms.
          </p>
        </section>

      </div>
    </div>
  );
}

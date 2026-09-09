import { useState } from 'react';

// Easily editable personal and contact details
const contactInfo = {
  name: "YOUR NAME",
  email: "YOUR EMAIL",
  location: "YOUR LOCATION",
  github: "YOUR GITHUB URL",
  linkedin: "YOUR LINKEDIN URL",
  portfolio: "YOUR PORTFOLIO URL"
};

// Clean, professional SVG icons
const IconMail = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLocation = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconGithub = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const IconGlobe = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [notice, setNotice] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setNotice({ type: 'error', text: 'Please fill in your name, email, and message.' });
      return;
    }

    // Launch default email client with prefilled details
    const subject = encodeURIComponent(formData.subject ? `[Project Aura] ${formData.subject}` : `[Project Aura] Inquiry from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    const mailtoUrl = `mailto:${contactInfo.email !== 'YOUR EMAIL' ? contactInfo.email : ''}?subject=${subject}&body=${body}`;

    window.location.href = mailtoUrl;

    setNotice({
      type: 'info',
      text: 'Opening your email client to send message...'
    });
  };

  return (
    <div className="contact-page-wrapper">
      <div className="section-container">
        
        {/* Page Header */}
        <header className="section-header-center">
          <span className="section-eyebrow">Get In Touch</span>
          <h1 className="section-headline">Let&apos;s Connect</h1>
          <p className="section-subheadline">
            Have a question about Project Aura, want to discuss the project, or just want to get in touch? You can reach me using the details below.
          </p>
        </header>

        <div className="contact-grid-layout">
          
          {/* Left Column: Editable Details */}
          <div className="contact-cards-column">
            
            <div className="contact-detail-card">
              <div className="contact-card-icon-wrap">
                <IconUser />
              </div>
              <div className="contact-card-body">
                <span className="contact-detail-label">Developer</span>
                <span className="contact-detail-value">{contactInfo.name}</span>
              </div>
            </div>

            <div className="contact-detail-card">
              <div className="contact-card-icon-wrap">
                <IconMail />
              </div>
              <div className="contact-card-body">
                <span className="contact-detail-label">Email</span>
                {contactInfo.email !== 'YOUR EMAIL' ? (
                  <a href={`mailto:${contactInfo.email}`} className="contact-detail-link">
                    {contactInfo.email}
                  </a>
                ) : (
                  <span className="contact-detail-value">{contactInfo.email}</span>
                )}
              </div>
            </div>

            <div className="contact-detail-card">
              <div className="contact-card-icon-wrap">
                <IconLocation />
              </div>
              <div className="contact-card-body">
                <span className="contact-detail-label">Location</span>
                <span className="contact-detail-value">{contactInfo.location}</span>
              </div>
            </div>

            <div className="contact-detail-card">
              <div className="contact-card-icon-wrap">
                <IconGithub />
              </div>
              <div className="contact-card-body">
                <span className="contact-detail-label">GitHub</span>
                {contactInfo.github !== 'YOUR GITHUB URL' ? (
                  <a href={contactInfo.github} target="_blank" rel="noreferrer" className="contact-detail-link">
                    {contactInfo.github}
                  </a>
                ) : (
                  <span className="contact-detail-value">{contactInfo.github}</span>
                )}
              </div>
            </div>

            <div className="contact-detail-card">
              <div className="contact-card-icon-wrap">
                <IconLinkedin />
              </div>
              <div className="contact-card-body">
                <span className="contact-detail-label">LinkedIn</span>
                {contactInfo.linkedin !== 'YOUR LINKEDIN URL' ? (
                  <a href={contactInfo.linkedin} target="_blank" rel="noreferrer" className="contact-detail-link">
                    {contactInfo.linkedin}
                  </a>
                ) : (
                  <span className="contact-detail-value">{contactInfo.linkedin}</span>
                )}
              </div>
            </div>

            <div className="contact-detail-card">
              <div className="contact-card-icon-wrap">
                <IconGlobe />
              </div>
              <div className="contact-card-body">
                <span className="contact-detail-label">Portfolio</span>
                {contactInfo.portfolio !== 'YOUR PORTFOLIO URL' ? (
                  <a href={contactInfo.portfolio} target="_blank" rel="noreferrer" className="contact-detail-link">
                    {contactInfo.portfolio}
                  </a>
                ) : (
                  <span className="contact-detail-value">{contactInfo.portfolio}</span>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Clean Simple Contact Form */}
          <div className="contact-form-panel">
            <h2 className="contact-form-title">Send a Message</h2>
            <p className="contact-form-subtitle">
              Fill in the form below to initiate an email conversation directly.
            </p>

            {notice && (
              <div className={`contact-notice-banner ${notice.type}`}>
                {notice.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form-body">
              <div className="form-group">
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  placeholder="Subject or project topic"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                    resize: 'vertical',
                    width: '100%'
                  }}
                />
              </div>

              <button type="submit" className="btn-primary-glow" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                <IconSend />
                <span>Send Message</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

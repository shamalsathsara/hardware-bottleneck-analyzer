import { useState } from 'react';

// Crisp, professional SVG icons
const IconMail = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M9.5 9.5c.3.8 1.2 2 2.5 2.5.3.1.6 0 .8-.2l.8-.8c.3-.3.8-.3 1.1-.1l1.6.8c.4.2.5.7.3 1.1-.5 1-1.6 1.7-2.6 1.7-3.5 0-6.5-3-6.5-6.5 0-1 .7-2.1 1.7-2.6.4-.2.9-.1 1.1.3l.8 1.6c.2.3.2.8-.1 1.1l-.8.8c-.2.2-.3.5-.2.8z" />
  </svg>
);

const IconTelegram = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconLocation = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Form icons
const IconSendPlane = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconInputMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconGridCategory = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconInfoCircle = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Feedback', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  return (
    <div className="info-page">
      <div className="info-container">
        
        <header className="info-header">
          <span className="section-eyebrow">Get In Touch</span>
          <h1 className="info-headline">Contact Project Aura</h1>
          <p className="info-lead">
            Have questions about our bottleneck calculations, want to suggest new hardware benchmarks, or discuss a collaboration? Connect directly through any of our channels.
          </p>
        </header>

        <div className="contact-layout">
          
          {/* Left Column: Direct Channels */}
          <div className="info-card contact-info-card">
            <h2 className="info-section-title">Direct Channels</h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Reach out directly for technical inquiries, hardware collaboration, or project feedback.
            </p>

            <div className="contact-methods">
              
              {/* Email */}
              <a href="mailto:shamalsathsara3@gmail.com" className="contact-method-item">
                <div className="contact-method-icon">
                  <IconMail />
                </div>
                <div className="contact-method-text">
                  <div className="contact-method-label">Email</div>
                  <div className="contact-method-value">shamalsathsara3@gmail.com</div>
                </div>
              </a>

              {/* Mobile Phone */}
              <a href="tel:+94771581916" className="contact-method-item">
                <div className="contact-method-icon">
                  <IconPhone />
                </div>
                <div className="contact-method-text">
                  <div className="contact-method-label">Mobile / Phone</div>
                  <div className="contact-method-value">+94 77 158 1916</div>
                </div>
              </a>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/94771581916?text=Hi%20Shamal,%20I'm%20reaching%20out%20regarding%20Project%20Aura" 
                target="_blank" 
                rel="noreferrer" 
                className="contact-method-item"
              >
                <div className="contact-method-icon">
                  <IconWhatsApp />
                </div>
                <div className="contact-method-text">
                  <div className="contact-method-label">WhatsApp</div>
                  <div className="contact-method-value">+94 77 158 1916 (Chat)</div>
                </div>
              </a>

              {/* Telegram */}
              <a 
                href="https://t.me/+94771581916" 
                target="_blank" 
                rel="noreferrer" 
                className="contact-method-item"
              >
                <div className="contact-method-icon">
                  <IconTelegram />
                </div>
                <div className="contact-method-text">
                  <div className="contact-method-label">Telegram</div>
                  <div className="contact-method-value">+94 77 158 1916</div>
                </div>
              </a>

              {/* Facebook */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="contact-method-item"
              >
                <div className="contact-method-icon">
                  <IconFacebook />
                </div>
                <div className="contact-method-text">
                  <div className="contact-method-label">Facebook</div>
                  <div className="contact-method-value">Shamal Sathsara</div>
                </div>
              </a>

              {/* Location */}
              <div className="contact-method-item static">
                <div className="contact-method-icon">
                  <IconLocation />
                </div>
                <div className="contact-method-text">
                  <div className="contact-method-label">Location</div>
                  <div className="contact-method-value">Colombo, Sri Lanka</div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Send a Message Card */}
          <div className="info-card contact-form-card">
            
            {/* Header with Plane Icon */}
            <div className="form-card-header">
              <div className="form-header-icon-box">
                <IconSendPlane />
              </div>
              <div className="form-header-text">
                <h2 className="form-card-title">Send a Message</h2>
                <p className="form-card-subtitle">
                  We&apos;d love to hear from you. Send us your questions, feedback or suggestions.
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="contact-success-box">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for reaching out. We will review your inquiry and get back to you shortly.</p>
                <button 
                  className="btn-secondary-glass" 
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: 'General Feedback', message: '' }); }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form-redesign" noValidate>
                {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

                {/* 2-Column Row for Name and Email */}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label htmlFor="contact-name">Your Name <span className="text-rose">*</span></label>
                    <div className="input-with-icon-wrap">
                      <span className="input-leading-icon"><IconUser /></span>
                      <input 
                        id="contact-name"
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="e.g. Alex Mercer"
                        className="form-input-with-icon"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">Email Address <span className="text-rose">*</span></label>
                    <div className="input-with-icon-wrap">
                      <span className="input-leading-icon"><IconInputMail /></span>
                      <input 
                        id="contact-email"
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        placeholder="alex@example.com"
                        className="form-input-with-icon"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Topic Dropdown with Leading Category Icon */}
                <div className="form-group">
                  <label htmlFor="contact-subject">Topic</label>
                  <div className="input-with-icon-wrap">
                    <span className="input-leading-icon"><IconGridCategory /></span>
                    <select 
                      id="contact-subject"
                      name="subject" 
                      value={formData.subject} 
                      onChange={handleChange}
                      className="form-input-with-icon"
                    >
                      <option value="General Feedback">General Feedback</option>
                      <option value="Bug Report">Bug / Issue Report</option>
                      <option value="Hardware Suggestion">Hardware Model Suggestion</option>
                      <option value="Collaboration">Collaboration / Inquiry</option>
                    </select>
                  </div>
                </div>

                {/* Message Textarea with Leading Chat Icon */}
                <div className="form-group">
                  <label htmlFor="contact-message">Message <span className="text-rose">*</span></label>
                  <div className="textarea-with-icon-wrap">
                    <span className="textarea-leading-icon"><IconChat /></span>
                    <textarea 
                      id="contact-message"
                      name="message" 
                      rows="4" 
                      value={formData.message} 
                      onChange={handleChange} 
                      placeholder="Describe your question or feedback in detail..."
                      className="form-textarea-with-icon"
                      required
                    />
                  </div>
                </div>

                {/* Value Your Feedback Banner */}
                <div className="feedback-notice-card">
                  <div className="notice-icon-box">
                    <IconInfoCircle />
                  </div>
                  <div className="notice-content">
                    <div className="notice-title">We value your feedback</div>
                    <p className="notice-desc">Your message helps us improve Project Aura for everyone.</p>
                  </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn-submit-gradient">
                  <span className="btn-icon"><IconSendPlane /></span>
                  <span>Submit Message</span>
                </button>

                {/* Privacy Guarantee Footer Note */}
                <div className="contact-privacy-note">
                  <IconLock />
                  <span>Your information will only be used to respond to your message.</span>
                </div>

              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

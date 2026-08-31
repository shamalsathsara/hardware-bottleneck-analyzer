import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Feedback', message: '' });
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
            Have questions about our bottleneck calculations, want to suggest new hardware benchmarks, or report an issue? Reach out to us.
          </p>
        </header>

        <div className="contact-layout">
          
          {/* Contact Details Card */}
          <div className="info-card contact-info-card">
            <h2 className="info-section-title">Project Information</h2>
            <p style={{ color: 'var(--text-sub)' }}>
              Project Aura is developed as an ML-powered PC hardware analyzer. We welcome community feedback and model refinement ideas.
            </p>

            <div className="contact-methods">
              <div className="contact-method-item">
                <div className="contact-method-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <strong>Developer Email</strong>
                  <div>shamal.sathsara.dev@gmail.com</div>
                </div>
              </div>

              <div className="contact-method-item">
                <div className="contact-method-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </div>
                <div>
                  <strong>GitHub Repository</strong>
                  <div>github.com/shamalsathsara/hardware-bottleneck-analyzer</div>
                </div>
              </div>

              <div className="contact-method-item">
                <div className="contact-method-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                </div>
                <div>
                  <strong>Location</strong>
                  <div>Colombo, Sri Lanka</div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="info-card contact-form-card">
            <h2 className="info-section-title">Send a Message</h2>
            
            {submitted ? (
              <div className="contact-success-box">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for reaching out. We will review your inquiry and get back to you shortly.</p>
                <button 
                  className="btn-secondary-glass" 
                  style={{ marginTop: '1rem' }}
                  onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: 'Feedback', message: '' }); }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                {error && <div className="contact-error-msg">{error}</div>}

                <div className="form-group">
                  <label htmlFor="contact-name">Your Name *</label>
                  <input 
                    id="contact-name"
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Alex Mercer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-email">Email Address *</label>
                  <input 
                    id="contact-email"
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="alex@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-subject">Topic</label>
                  <select 
                    id="contact-subject"
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleChange}
                  >
                    <option value="Feedback">General Feedback</option>
                    <option value="Bug Report">Bug / Issue Report</option>
                    <option value="Hardware Suggestion">Hardware Model Suggestion</option>
                    <option value="Collaboration">Collaboration / Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message">Message *</label>
                  <textarea 
                    id="contact-message"
                    name="message" 
                    rows="5" 
                    value={formData.message} 
                    onChange={handleChange} 
                    placeholder="Describe your question or feedback in detail..."
                    required
                  />
                </div>

                <button type="submit" className="btn-primary-glow" style={{ width: '100%' }}>
                  Submit Message
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

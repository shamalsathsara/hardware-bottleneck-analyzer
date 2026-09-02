import { useState, useEffect } from 'react';

export default function SaveRigModal({ isOpen, onClose, onSave, defaultName = '' }) {
  const [rigName, setRigName] = useState(defaultName || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRigName(defaultName || '');
      setIsSaving(false);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!rigName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(rigName.trim());
      setRigName('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="save-modal-backdrop" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="save-rig-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="save-modal-card">
        <h3 id="save-rig-title" style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>
          Save This PC Build
        </h3>
        <p style={{ margin: '0 0 1.2rem 0', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          Give your setup a memorable name to view, reload, and compare it anytime in "My Rigs".
        </p>

        <form onSubmit={handleSubmit}>
          <input 
            type="text"
            placeholder="e.g. My 1440p Gaming Rig"
            value={rigName}
            onChange={(e) => setRigName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'rgba(5, 10, 22, 0.8)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem',
              outline: 'none',
              fontSize: '1rem',
            }}
            onKeyDown={(e) => { 
              if (e.key === 'Escape') onClose(); 
            }}
            autoFocus
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ 
                background: 'transparent', 
                color: 'var(--text-main)', 
                border: '1px solid var(--border)', 
                padding: '0.6rem 1.2rem', 
                borderRadius: 'var(--radius)', 
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!rigName.trim() || isSaving}
              style={{ 
                background: 'var(--primary)', 
                color: 'black', 
                border: 'none', 
                padding: '0.6rem 1.4rem', 
                borderRadius: 'var(--radius)', 
                cursor: rigName.trim() && !isSaving ? 'pointer' : 'not-allowed', 
                fontWeight: 'bold', 
                opacity: rigName.trim() && !isSaving ? 1 : 0.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isSaving ? 'Saving...' : 'Save PC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

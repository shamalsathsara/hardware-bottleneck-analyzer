import { useState } from 'react';

export default function SaveRigModal({ isOpen, onClose, onSave }) {
  const [rigName, setRigName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!rigName.trim()) return;
    onSave(rigName.trim());
    setRigName('');
  };

  return (
    <div className="save-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="save-rig-title">
      <div className="save-modal-card">
        <h3 id="save-rig-title" style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
          Save This PC Build
        </h3>
        <p style={{ margin: '0 0 1.2rem 0', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          Give your setup a memorable name to view and compare it anytime in "My Rigs".
        </p>
        <input 
          type="text"
          placeholder="e.g. My 1440p Gaming Rig"
          value={rigName}
          onChange={(e) => setRigName(e.target.value)}
          style={{
            width: '100%',
            padding: '0.8rem 1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-main)',
            borderRadius: 'var(--radius)',
            marginBottom: '1.5rem',
            outline: 'none',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          autoFocus
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border)', 
              padding: '0.6rem 1.2rem', 
              borderRadius: 'var(--radius)', 
              cursor: 'pointer' 
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!rigName.trim()}
            style={{ 
              background: 'var(--primary)', 
              color: 'black', 
              border: 'none', 
              padding: '0.6rem 1.2rem', 
              borderRadius: 'var(--radius)', 
              cursor: rigName.trim() ? 'pointer' : 'not-allowed', 
              fontWeight: 'bold', 
              opacity: rigName.trim() ? 1 : 0.5 
            }}
          >
            Save PC
          </button>
        </div>
      </div>
    </div>
  );
}

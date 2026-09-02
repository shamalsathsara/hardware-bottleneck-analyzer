import { useState, useEffect } from 'react';
import { fetchUserRigs, deleteUserRig } from './services/rigService';

// Icons
const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconLoad = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function MyRigs({ currentUser, onLoadRig, onBack }) {
  const [rigs, setRigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRigs();
  }, []);

  const loadRigs = async () => {
    try {
      setLoading(true);
      const data = await fetchUserRigs();
      setRigs(data);
      setError(null);
    } catch {
      setError('Could not load your saved rigs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRig = async (rigId) => {
    if (!window.confirm('Delete this saved rig?')) return;
    try {
      const data = await deleteUserRig(rigId);
      setRigs(data);
    } catch {
      alert('Failed to delete rig.');
    }
  };

  return (
    <div className="my-rigs-page">

      {/* Profile header */}
      <div className="info-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--primary-dim)', border: '1px solid rgba(56,189,248,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)', flexShrink: 0
        }}>
          <IconUser />
        </div>
        <div>
          <h1 style={{ margin: '0 0 0.2rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {currentUser.username}&apos;s Rigs
          </h1>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.875rem' }}>
            Your saved PC hardware profiles
          </p>
        </div>
        <button
          onClick={onBack}
          className="btn-secondary-glass"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
        >
          ← Back to Analyzer
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your rigs...
        </div>
      ) : rigs.length === 0 ? (
        /* Empty state */
        <div className="info-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-sub)', marginBottom: '0.5rem', fontSize: '1rem' }}>
            No saved rigs yet
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Go to the Analyzer, configure a PC, run analysis, then click &quot;Save Rig&quot;.
          </p>
          <button onClick={onBack} className="btn-primary-glow">
            Go to Analyzer
          </button>
        </div>
      ) : (
        /* Rig list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rigs.map((rig) => (
            <div
              key={rig._id}
              className="info-card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}
            >
              {/* Rig info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rig.name}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem', fontSize: '0.825rem', color: 'var(--text-sub)' }}>
                  <span><strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>CPU</strong>&nbsp;{rig.cpu}</span>
                  <span><strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>GPU</strong>&nbsp;{rig.gpu}</span>
                  <span><strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>RAM</strong>&nbsp;{rig.ram} GB</span>
                  <span><strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Res</strong>&nbsp;{rig.resolution}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => onLoadRig(rig)}
                  className="btn-secondary-glass"
                  style={{ padding: '0.5rem 1rem', gap: '0.35rem' }}
                  title="Load this rig in the Analyzer"
                >
                  <IconLoad />
                  Load
                </button>
                <button
                  onClick={() => handleDeleteRig(rig._id)}
                  title="Delete this rig"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.5rem', background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fca5a5', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

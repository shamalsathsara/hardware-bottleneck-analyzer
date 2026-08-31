import { useState, useEffect } from 'react';
import axios from 'axios';

// Component SVG Icons
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconLoad = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Main MyRigs Component
export default function MyRigs({ currentUser, onLoadRig, onBack }) {
  const [rigs, setRigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the user's saved rigs as soon as this page opens
  useEffect(() => {
    fetchRigs();
  }, []);

  const fetchRigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('aura_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      // We pass the login token to prove who we are to the backend
      const { data } = await axios.get(`${baseUrl}/api/user/rigs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRigs(data);
      setError(null);
    // eslint-disable-next-line no-unused-vars
    } catch (_err) {
      setError('Could not load your saved PCs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRig = async (rigId) => {
    // Ask for confirmation before deleting so the user doesn't delete by mistake
    if (!window.confirm('Are you sure you want to delete this saved PC?')) return;

    try {
      const token = localStorage.getItem('aura_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const { data } = await axios.delete(`${baseUrl}/api/user/rigs/${rigId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the screen with the new list from the backend
      setRigs(data);
    // eslint-disable-next-line no-unused-vars
    } catch (_err) {
      alert('Failed to delete rig.');
    }
  };

  return (
    <div className="my-rigs-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* -------------------------------------------------------------------
          PROFILE HEADER 
          Shows the user's name prominently as requested!
      -------------------------------------------------------------------- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
          <span style={{ width: '30px', height: '30px' }}><IconUser /></span>
        </div>
        <div>
          <h2 style={{ margin: '0 0 0.2rem 0', color: 'var(--text-main)', fontSize: '1.5rem' }}>
            {currentUser.username}'s Hardware Profile
          </h2>
          <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            Manage your saved PC builds here.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Your Saved PCs</h3>
        <button 
          onClick={onBack}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-main)' }}
        >
          Back to Analyzer
        </button>
      </div>

      {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-sub)' }}>Loading your setups...</div>
      ) : rigs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1rem' }}>You don't have any saved PCs yet!</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Go to the Analyzer, configure a PC, and click "Save this PC".</p>
          <button 
            onClick={onBack}
            style={{ marginTop: '1rem', background: 'var(--primary)', color: 'black', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: '600' }}
          >
            Go to Analyzer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rigs.map((rig) => (
            <div key={rig._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              {/* Rig Details */}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{rig.name}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                  <div><strong style={{ color: 'var(--text-main)' }}>CPU:</strong> {rig.cpu}</div>
                  <div><strong style={{ color: 'var(--text-main)' }}>GPU:</strong> {rig.gpu}</div>
                  <div><strong style={{ color: 'var(--text-main)' }}>RAM:</strong> {rig.ram} GB</div>
                  <div><strong style={{ color: 'var(--text-main)' }}>Res:</strong> {rig.resolution}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                <button 
                  onClick={() => onLoadRig(rig)}
                  style={{ background: 'var(--primary)', color: 'black', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span style={{ width: '16px', height: '16px' }}><IconLoad /></span>
                  Load
                </button>
                <button 
                  onClick={() => handleDeleteRig(rig._id)}
                  style={{ background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', padding: '0.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Delete this rig"
                >
                  <span style={{ width: '18px', height: '18px' }}><IconTrash /></span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

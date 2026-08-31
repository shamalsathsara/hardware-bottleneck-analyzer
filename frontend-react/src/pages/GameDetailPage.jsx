import { useState, useEffect } from 'react';
import { getGameBySlug } from '../services/gameService';

export default function GameDetailPage({ slug, onNavigate }) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadGame() {
      setLoading(true);
      setError(null);
      try {
        const data = await getGameBySlug(slug);
        setGame(data);
      } catch (err) {
        console.error('Game detail fetch error:', err.message);
        setError(`Game "${slug}" not found in our verified catalog.`);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadGame();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="content-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '1.2rem' }}>Loading hardware requirements...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="content-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-main, #f8fafc)', marginBottom: '1rem' }}>Game Not Found</h2>
        <p style={{ color: 'var(--text-sub, #94a3b8)', marginBottom: '2rem' }}>{error || 'Unable to find specifications for this title.'}</p>
        <button
          onClick={() => onNavigate('/games')}
          style={{
            background: 'var(--primary, #38bdf8)',
            color: '#000',
            border: 'none',
            padding: '0.6rem 1.4rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '700',
          }}
        >
          &larr; Back to Games Catalog
        </button>
      </div>
    );
  }

  const min = game.requirements?.minimum || {};
  const rec = game.requirements?.recommended || {};
  const perf = game.performanceProfile || {};

  return (
    <div className="content-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Back Button */}
      <button
        onClick={() => onNavigate('/games')}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-sub, #94a3b8)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          padding: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary, #38bdf8)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-sub, #94a3b8)'; }}
      >
        &larr; Back to PC Games Catalog
      </button>

      {/* Header Banner */}
      <div style={{
        background: 'var(--surface, #0f172a)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
            <span style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: '12px',
              background: game.dataQuality === 'verified' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              color: game.dataQuality === 'verified' ? '#4ade80' : '#fde047',
              border: `1px solid ${game.dataQuality === 'verified' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              fontWeight: '600',
            }}>
              {game.dataQuality === 'verified' ? '✓ Official Verified Specs' : 'Requirements Profile'}
            </span>
            {game.releaseYear && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-sub, #94a3b8)' }}>
                Released {game.releaseYear}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-main, #f8fafc)' }}>
            {game.name}
          </h1>

          <p style={{ margin: '0 0 1rem 0', color: 'var(--text-sub, #94a3b8)', fontSize: '1rem' }}>
            Developer: <strong style={{ color: '#cbd5e1' }}>{game.developer || 'N/A'}</strong> &nbsp;|&nbsp; Publisher: <strong style={{ color: '#cbd5e1' }}>{game.publisher || 'N/A'}</strong>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {game.genres?.map((g) => (
              <span key={g} style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '6px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}>
                {g}
              </span>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => onNavigate('/bottleneck-calculator')}
            style={{
              background: 'var(--primary, #38bdf8)',
              color: '#000',
              border: 'none',
              padding: '0.85rem 1.6rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            ⚡ Test My PC Balance
          </button>
        </div>
      </div>

      {/* System Requirements Comparison Grid */}
      <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main, #f8fafc)', marginBottom: '1.2rem' }}>
        System Requirements
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
      }}>
        
        {/* Minimum Specs */}
        <div style={{
          background: 'var(--surface, #0f172a)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '12px',
          padding: '1.8rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
            <h3 style={{ margin: 0, color: 'var(--text-main, #f8fafc)', fontSize: '1.3rem' }}>
              Minimum Requirements
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
            <div>
              <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Processor (CPU)</div>
              <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                {min.cpu?.name || 'Dual-core 64-bit CPU'}
              </div>
              {min.cpu?.notes && <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem' }}>{min.cpu.notes}</div>}
            </div>

            <div>
              <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Graphics Card (GPU)</div>
              <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                {min.gpu?.name || 'DirectX 11 compatible GPU'}
              </div>
              {min.gpu?.vramGB && <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>{min.gpu.vramGB} GB VRAM required</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Memory (RAM)</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                  {min.ramGB ? `${min.ramGB} GB RAM` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Storage</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                  {min.storageGB ? `${min.storageGB} GB (${min.storageType || 'Space'})` : 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Operating System</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
                  {min.os || 'Windows 10 64-bit'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>DirectX API</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
                  {min.directX || 'DirectX 11'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Specs */}
        <div style={{
          background: 'var(--surface, #0f172a)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '12px',
          padding: '1.8rem',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🚀</span>
            <h3 style={{ margin: 0, color: 'var(--primary, #38bdf8)', fontSize: '1.3rem' }}>
              Recommended Requirements
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
            <div>
              <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Processor (CPU)</div>
              <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                {rec.cpu?.name || 'Modern 6-core / 8-core CPU'}
              </div>
              {rec.cpu?.notes && <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem' }}>{rec.cpu.notes}</div>}
            </div>

            <div>
              <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Graphics Card (GPU)</div>
              <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                {rec.gpu?.name || 'High performance GPU'}
              </div>
              {rec.gpu?.vramGB && <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>{rec.gpu.vramGB} GB VRAM recommended</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Memory (RAM)</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                  {rec.ramGB ? `${rec.ramGB} GB RAM` : '16 GB'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Storage</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', marginTop: '2px' }}>
                  {rec.storageGB ? `${rec.storageGB} GB (${rec.storageType || 'SSD'})` : 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Operating System</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
                  {rec.os || 'Windows 10 / 11 64-bit'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.8rem', textTransform: 'uppercase' }}>DirectX API</div>
                <div style={{ color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
                  {rec.directX || 'DirectX 12'}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Graphics & Performance Profile */}
      <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main, #f8fafc)', marginBottom: '1.2rem' }}>
        Graphics & Performance Profile
      </h2>

      <div style={{
        background: 'var(--surface, #0f172a)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '12px',
        padding: '1.8rem',
        marginBottom: '2.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
      }}>
        <div>
          <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Upscaling & Technologies</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: perf.rayTracingSupported ? 'rgba(56, 189, 248, 0.15)' : '#1e293b', color: perf.rayTracingSupported ? '#38bdf8' : '#64748b', border: `1px solid ${perf.rayTracingSupported ? 'rgba(56, 189, 248, 0.3)' : '#334155'}` }}>
              Ray Tracing {perf.rayTracingSupported ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: perf.dlssSupported ? 'rgba(129, 140, 248, 0.15)' : '#1e293b', color: perf.dlssSupported ? '#818cf8' : '#64748b', border: `1px solid ${perf.dlssSupported ? 'rgba(129, 140, 248, 0.3)' : '#334155'}` }}>
              NVIDIA DLSS {perf.dlssSupported ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: perf.fsrSupported ? 'rgba(234, 88, 12, 0.15)' : '#1e293b', color: perf.fsrSupported ? '#fb923c' : '#64748b', border: `1px solid ${perf.fsrSupported ? 'rgba(234, 88, 12, 0.3)' : '#334155'}` }}>
              AMD FSR {perf.fsrSupported ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: perf.xessSupported ? 'rgba(34, 197, 94, 0.15)' : '#1e293b', color: perf.xessSupported ? '#4ade80' : '#64748b', border: `1px solid ${perf.xessSupported ? 'rgba(34, 197, 94, 0.3)' : '#334155'}` }}>
              Intel XeSS {perf.xessSupported ? '✓' : '✗'}
            </span>
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Engine Load Profile</div>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div>CPU Load: <strong style={{ color: '#f8fafc' }}>{perf.cpuIntensity || 'Medium'}</strong></div>
            <div>GPU Load: <strong style={{ color: '#f8fafc' }}>{perf.gpuIntensity || 'High'}</strong></div>
            <div>VRAM Intensity: <strong style={{ color: '#f8fafc' }}>{perf.vramIntensity || 'Standard'}</strong></div>
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Target Resolutions</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {perf.supportedResolutions?.map((r) => (
              <span key={r} style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#38bdf8', border: '1px solid #334155' }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Data Source & Provenance Notice */}
      <div style={{
        padding: '1.2rem 1.5rem',
        background: '#090d16',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: 'var(--text-sub, #94a3b8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.8rem',
      }}>
        <div>
          Source: <strong style={{ color: '#cbd5e1' }}>{game.dataSource?.requirementsSource || 'Official Publisher Specifications'}</strong>
        </div>
        <div>
          Status: <strong style={{ color: game.dataSource?.requirementsVerified ? '#4ade80' : '#fde047' }}>
            {game.dataSource?.requirementsVerified ? 'Verified by Project Aura Team' : 'Community Profile'}
          </strong>
        </div>
      </div>

    </div>
  );
}

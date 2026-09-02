import { useState, useEffect } from 'react';
import { getGames } from '../services/gameService';
import GameSearch from '../components/game/GameSearch';

const GENRES = ['All', 'Action', 'RPG', 'Open World', 'FPS', 'Soulslike', 'Multiplayer'];

export default function GamesPage({ onNavigate }) {
  const [games, setGames] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCatalog = async (page = 1, genre = selectedGenre) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 12 };
      if (genre && genre !== 'All') params.genre = genre;
      const data = await getGames(params);
      setGames(data.games || []);
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
    } catch (err) {
      console.error('Catalog fetch error:', err.message);
      setError('Failed to load PC games catalog. Please ensure the backend is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog(1, selectedGenre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre]);

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCatalog(newPage, selectedGenre);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="content-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="badge-pill" style={{ display: 'inline-block', marginBottom: '0.8rem' }}>
          🎮 Game Hardware Database
        </div>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.8rem 0', color: 'var(--text-main, #f8fafc)' }}>
          PC Games Catalog
        </h1>
        <p style={{ color: 'var(--text-sub, #94a3b8)', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Browse verified PC system requirements, graphics technology support (DLSS, FSR, Ray Tracing), and hardware profiles.
        </p>
      </div>

      {/* Interactive Autocomplete Search */}
      <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <GameSearch onSelectGame={(game) => onNavigate(`/games/${game.slug}`)} />
      </div>

      {/* Genre Filter Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => handleGenreChange(genre)}
            style={{
              background: selectedGenre === genre ? 'var(--primary, #38bdf8)' : 'var(--surface, #0f172a)',
              color: selectedGenre === genre ? '#000' : 'var(--text-sub, #94a3b8)',
              border: `1px solid ${selectedGenre === genre ? 'var(--primary, #38bdf8)' : 'var(--border, #334155)'}`,
              padding: '0.45rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: selectedGenre === genre ? '700' : '500',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', textAlign: 'center', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-sub, #94a3b8)' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Loading game specifications...</div>
        </div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--surface, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: '12px' }}>
          <h3 style={{ color: 'var(--text-main, #f8fafc)', margin: '0 0 0.5rem 0' }}>No Games Found</h3>
          <p style={{ color: 'var(--text-sub, #94a3b8)' }}>Try selecting another genre or searching for another title.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          {games.map((game) => (
            <div
              key={game.slug}
              className="game-card"
              style={{
                background: 'var(--surface, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary, #38bdf8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border, #334155)'; }}
            >
              <div>
                {game.thumbnailUrl && (
                  <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', background: '#1e293b' }}>
                    <img
                      src={game.thumbnailUrl}
                      alt={game.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main, #f8fafc)', lineHeight: '1.3' }}>
                    {game.name}
                  </h3>
                  {game.releaseYear && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-sub, #94a3b8)', background: '#1e293b', padding: '2px 8px', borderRadius: '6px' }}>
                      {game.releaseYear}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-sub, #94a3b8)', marginBottom: '1rem' }}>
                  {game.developer || game.publisher || 'PC'}
                </div>

                {/* Genre badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {game.genres?.map((g) => (
                    <span
                      key={g}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#1e293b',
                        color: '#cbd5e1',
                        border: '1px solid #334155',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Tech features */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
                  {game.performanceProfile?.rayTracingSupported && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      Ray Tracing
                    </span>
                  )}
                  {game.performanceProfile?.dlssSupported && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.3)' }}>
                      DLSS
                    </span>
                  )}
                  {game.performanceProfile?.fsrSupported && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', color: '#fb923c', border: '1px solid rgba(234, 88, 12, 0.3)' }}>
                      FSR
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer & Link */}
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.72rem',
                  color: game.dataQuality === 'verified' ? '#4ade80' : '#fde047',
                }}>
                  {game.dataQuality === 'verified' ? '✓ Official Specs Verified' : 'Requirements Available'}
                </span>
                <button
                  onClick={() => onNavigate(`/games/${game.slug}`)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--primary, #38bdf8)',
                    color: 'var(--primary, #38bdf8)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary, #38bdf8)'; e.currentTarget.style.color = '#000'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary, #38bdf8)'; }}
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--surface, #0f172a)',
              border: '1px solid var(--border, #334155)',
              color: pagination.page <= 1 ? 'var(--text-muted, #64748b)' : 'var(--text-main, #f8fafc)',
              borderRadius: '6px',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            &larr; Previous
          </button>
          <span style={{ color: 'var(--text-sub, #94a3b8)', fontSize: '0.9rem' }}>
            Page {pagination.page} of {pagination.pages} ({pagination.total} Games)
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--surface, #0f172a)',
              border: '1px solid var(--border, #334155)',
              color: pagination.page >= pagination.pages ? 'var(--text-muted, #64748b)' : 'var(--text-main, #f8fafc)',
              borderRadius: '6px',
              cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
            }}
          >
            Next &rarr;
          </button>
        </div>
      )}

    </div>
  );
}

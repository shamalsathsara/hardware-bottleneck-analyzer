import { useState, useEffect } from 'react';
import { searchGames } from '../../services/gameService';

export default function GameSearch({ onSelectGame, placeholder = 'Search supported PC games (e.g. Cyberpunk, GTA, CS2)...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchGames(query);
        setResults(data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Game search error:', err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (game) => {
    setQuery(game.name);
    setIsOpen(false);
    if (onSelectGame) {
      onSelectGame(game);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{
          width: '100%',
          padding: '0.85rem 1.2rem',
          background: 'var(--surface, #0f172a)',
          border: '1px solid var(--border, #334155)',
          borderRadius: 'var(--radius, 8px)',
          color: 'var(--text-main, #f8fafc)',
          fontSize: '1rem',
          outline: 'none',
        }}
      />

      {loading && (
        <div style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-sub, #94a3b8)', fontSize: '0.85rem' }}>
          Searching...
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          listStyle: 'none',
          padding: 0,
          margin: '6px 0 0 0',
          maxHeight: '280px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
        }}>
          {results.map((game) => (
            <li
              key={game.slug}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(game);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #334155',
                color: '#e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div>
                <strong style={{ color: 'var(--primary, #38bdf8)' }}>{game.name}</strong>
                {game.releaseYear && (
                  <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    ({game.releaseYear})
                  </span>
                )}
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                  {game.developer || 'PC'} {game.genres?.length ? `• ${game.genres.slice(0, 2).join(', ')}` : ''}
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '12px',
                background: game.dataQuality === 'verified' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                color: game.dataQuality === 'verified' ? '#4ade80' : '#fde047',
                border: `1px solid ${game.dataQuality === 'verified' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              }}>
                {game.dataQuality === 'verified' ? '✓ Verified' : 'Requirements'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

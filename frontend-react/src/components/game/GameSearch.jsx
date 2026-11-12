import { useState, useEffect, useRef } from 'react';
import { searchGames } from '../../services/gameService';

/**
 * Game autocomplete. `onSelectGame(game)` fires on pick; `onSelectGame(null)` fires
 * as soon as the user edits or clears the text, so the parent never keeps a stale game.
 */
export default function GameSearch({ value = '', onSelectGame, placeholder = 'Search supported PC games (e.g. Cyberpunk, GTA, CS2)...' }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const requestIdRef = useRef(0);
  const skipSearchRef = useRef(false);
  const blurTimerRef = useRef(null);
  const queryRef = useRef(value || '');
  const expectedValueRef = useRef(null); // value we just emitted to the parent

  const updateQuery = (text) => {
    queryRef.current = text;
    setQuery(text);
  };

  // Sync parent-driven changes ("Clear Game", Game Detail page, loaded rig) without searching.
  useEffect(() => {
    const next = value || '';
    if (expectedValueRef.current !== null && next === expectedValueRef.current) {
      expectedValueRef.current = null; // echo of our own onSelectGame call: keep the user's text
      return;
    }
    expectedValueRef.current = null;
    if (next === queryRef.current) return;
    skipSearchRef.current = true;
    updateQuery(next);
    setIsOpen(false);
  }, [value]);

  useEffect(() => () => clearTimeout(blurTimerRef.current), []);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return undefined;
    }
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchGames(query);
        if (requestId !== requestIdRef.current) return; // a newer query is in flight
        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
      } catch {
        if (requestId === requestIdRef.current) setResults([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleChange = (text) => {
    skipSearchRef.current = false;
    updateQuery(text);
    if (value && onSelectGame) {
      expectedValueRef.current = ''; // editing invalidates the previous selection
      onSelectGame(null);
    }
  };

  const handleSelect = (game) => {
    requestIdRef.current += 1; // ignore any pending response
    skipSearchRef.current = true;
    updateQuery(game.name);
    setResults([]);
    setIsOpen(false);
    setLoading(false);
    if (onSelectGame) onSelectGame(game);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id="game-search-input"
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        onBlur={() => {
          clearTimeout(blurTimerRef.current);
          blurTimerRef.current = setTimeout(() => setIsOpen(false), 200);
        }}
        autoComplete="off"
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

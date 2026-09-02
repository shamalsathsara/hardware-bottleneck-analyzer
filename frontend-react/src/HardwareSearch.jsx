import { useState, useEffect } from 'react';
import { searchCpus, searchGpus } from './services/hardwareService';

export default function HardwareSearch({ type, onSelect, placeholder, value }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Sync internal query state if the parent component forces a new value (e.g., loading a saved rig)
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = type === 'cpu' ? await searchCpus(query) : await searchGpus(query);
        setResults(data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Hardware search error:', err.message);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, type]);

  const handleSelect = (item) => {
    const itemName = type === 'cpu' ? item.cpuName : item.Device;
    setQuery(itemName);
    setIsOpen(false);
    onSelect(item);
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
      />
      
      {loading && (
        <div style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Searching...
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--surface-2, #0f172a)',
          border: '1px solid var(--border-hover, #334155)',
          borderRadius: 'var(--radius-sm, 8px)',
          listStyle: 'none',
          padding: '4px 0',
          margin: 0,
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)'
        }}>
          {results.map((item, idx) => (
            <li 
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              style={{
                padding: '9px 14px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text, #f8fafc)',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {type === 'cpu' ? item.cpuName : item.Device}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

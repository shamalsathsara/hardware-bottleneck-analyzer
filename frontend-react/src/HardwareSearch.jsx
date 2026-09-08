import { useState, useEffect, useRef } from 'react';
import { searchCpus, searchGpus } from './services/hardwareService';

export default function HardwareSearch({ id, type, onSelect, placeholder, value }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const skipNextSearchRef = useRef(false);

  // Sync internal query state if the parent component forces a new value (e.g., loading a saved rig or preset)
  useEffect(() => {
    if (value !== undefined && value !== query) {
      skipNextSearchRef.current = true;
      setQuery(value);
      setIsOpen(false);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (!query || query.trim() === '') {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = type === 'cpu' ? await searchCpus(query) : await searchGpus(query);
        const list = data || [];
        
        // Deduplicate entries with identical names
        const seen = new Set();
        const unique = [];
        for (const item of list) {
          const name = (type === 'cpu' ? item.cpuName : item.Device) || '';
          if (name && !seen.has(name)) {
            seen.add(name);
            unique.push(item);
          }
        }

        setResults(unique);
        if (unique.length > 0) {
          setIsOpen(true);
        }
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
    skipNextSearchRef.current = true;
    setQuery(itemName);
    setIsOpen(false);
    setResults([]);
    onSelect(item);
  };

  const inputId = id || `${type}-search-input`;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        id={inputId}
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          skipNextSearchRef.current = false;
          setQuery(e.target.value);
        }}
        onFocus={() => {
          if (results.length > 0 && query.trim() !== '') {
            setIsOpen(true);
          }
        }}
        autoComplete="off"
      />
      
      {loading && (
        <div style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--text-muted)', fontSize: '0.8rem', pointerEvents: 'none' }}>
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
          {results.map((item, idx) => {
            const name = type === 'cpu' ? item.cpuName : item.Device;
            const key = item._id || `${name}_${idx}`;
            return (
              <li 
                key={key}
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
                {name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

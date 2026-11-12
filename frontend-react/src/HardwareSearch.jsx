import { useState, useEffect, useRef } from 'react';
import { searchCpus, searchGpus } from './services/hardwareService';

const displayNameOf = (item, type) =>
  item.displayName || (type === 'cpu' ? item.cpuName : item.Device || item.gpuName) || item.canonicalName || '';

/**
 * CPU/GPU autocomplete. `onSelect(item)` fires on pick; `onSelect(null)` fires as soon as
 * the user edits the text, so the parent never analyzes hardware the box no longer shows.
 */
export default function HardwareSearch({ id, type, onSelect, placeholder, value }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const skipNextSearchRef = useRef(false);
  const requestIdRef = useRef(0);
  const queryRef = useRef(value || '');
  const expectedValueRef = useRef(null);

  const updateQuery = (text) => {
    queryRef.current = text;
    setQuery(text);
  };

  // Sync parent-driven value changes (loaded rig, reset) without triggering a search.
  useEffect(() => {
    const next = value || '';
    if (expectedValueRef.current !== null && next === expectedValueRef.current) {
      expectedValueRef.current = null; // echo of our own onSelect(null): keep the typed text
      return;
    }
    expectedValueRef.current = null;
    if (next === queryRef.current) return;
    skipNextSearchRef.current = true;
    updateQuery(next);
    setIsOpen(false);
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
      return undefined;
    }

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = type === 'cpu' ? await searchCpus(query) : await searchGpus(query);
        if (requestId !== requestIdRef.current) return; // stale response

        // Deduplicate by display name (case-insensitive)
        const seen = new Set();
        const unique = [];
        for (const item of Array.isArray(data) ? data : []) {
          const name = displayNameOf(item, type);
          const key = name.toLowerCase();
          if (name && !seen.has(key)) {
            seen.add(key);
            unique.push({ ...item, displayName: name });
          }
        }

        setResults(unique);
        setSelectedIndex(-1);
        setIsOpen(unique.length > 0);
      } catch {
        if (requestId === requestIdRef.current) setResults([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, type]);

  const handleChange = (text) => {
    skipNextSearchRef.current = false;
    updateQuery(text);
    if (value) {
      expectedValueRef.current = '';
      onSelect(null);
    }
  };

  const handleSelect = (item) => {
    requestIdRef.current += 1; // ignore pending responses
    skipNextSearchRef.current = true;
    updateQuery(item.displayName);
    setIsOpen(false);
    setResults([]);
    setSelectedIndex(-1);
    setLoading(false);
    onSelect(item);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
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
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0 && query.trim() !== '') {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      
      {loading && (
        <div style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--text-muted)', fontSize: '0.8rem', pointerEvents: 'none' }}>
          Searching...
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul 
          role="listbox"
          style={{
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
          }}
        >
          {results.map((item, idx) => {
            const name = item.displayName;
            const key = item._id || `${name}_${idx}`;
            const isSelected = idx === selectedIndex;
            return (
              <li 
                key={key}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                style={{
                  padding: '9px 14px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text, #f8fafc)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                  transition: 'background-color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                onMouseLeave={() => setSelectedIndex(-1)}
              >
                <span>{name}</span>
                {item.hardwareSource === 'master' && (
                  <span style={{ 
                    fontSize: '0.68rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    backgroundColor: 'rgba(56, 189, 248, 0.15)', 
                    color: 'var(--primary, #38bdf8)',
                    fontWeight: '600'
                  }}>
                    MASTER
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

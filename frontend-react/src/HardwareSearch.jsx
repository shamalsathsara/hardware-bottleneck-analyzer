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
        <div style={{ position: 'absolute', right: '10px', top: '12px', color: '#888', fontSize: '0.8rem' }}>
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
          borderRadius: '5px',
          listStyle: 'none',
          padding: 0,
          margin: '5px 0 0 0',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        }}>
          {results.map((item, idx) => (
            <li 
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              style={{
                padding: '10px',
                cursor: 'pointer',
                borderBottom: idx !== results.length - 1 ? '1px solid #334155' : 'none',
                color: '#e2e8f0'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
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

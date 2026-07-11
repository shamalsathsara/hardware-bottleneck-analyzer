import React, { useState, useEffect } from 'react';
import axios from 'axios';

// A simple autocomplete search component that fetches data dynamically
// This fixes Issue 3.1: Massive Data Fetch on Mount
const HardwareSearch = ({ type, onSelect, placeholder, value }) => {
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
    // If the user clears the input, clear the results
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Dynamically search via API instead of loading the whole database
        const endpoint = type === 'cpu' ? '/api/cpus/search' : '/api/gpus/search';
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${endpoint}?q=${query}`);
        setResults(res.data);
        setIsOpen(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce to prevent spamming the API while typing

    return () => clearTimeout(timer);
  }, [query, type]);

  const handleSelect = (item) => {
    const itemName = type === 'cpu' ? item.cpuName : item.Device;
    setQuery(itemName);
    setIsOpen(false);
    onSelect(item); // Send the full selected object back to parent
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
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} // delay to allow click
      />
      
      {loading && <div style={{ position: 'absolute', right: '10px', top: '12px', color: '#888', fontSize: '0.8rem' }}>Searching...</div>}

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
              onClick={() => handleSelect(item)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                borderBottom: idx !== results.length - 1 ? '1px solid #334155' : 'none',
                color: '#e2e8f0'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#334155'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {type === 'cpu' ? item.cpuName : item.Device}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HardwareSearch;

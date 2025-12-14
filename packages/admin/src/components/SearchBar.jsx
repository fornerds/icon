import React from 'react';
import './SearchBar.css';

function SearchBar({ value, onChange, placeholder = '검색...' }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
    </div>
  );
}

export default SearchBar;


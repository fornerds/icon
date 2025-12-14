import React from 'react';
import './SearchBar.css';

function SearchBar({ value, onChange, placeholder = '검색...', onSearch }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch();
    }
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="search-input"
        />
        <button
          type="button"
          className="search-button"
          onClick={handleSearchClick}
          aria-label="검색"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 36 36"
            fill="none"
          >
            <path
              d="M33.75 33.75L26.0167 26.0167M30.1944 15.9722C30.1944 23.8269 23.8269 30.1944 15.9722 30.1944C8.11751 30.1944 1.75 23.8269 1.75 15.9722C1.75 8.11751 8.11751 1.75 15.9722 1.75C23.8269 1.75 30.1944 8.11751 30.1944 15.9722Z"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SearchBar;

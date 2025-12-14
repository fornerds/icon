import React from 'react';
import './CategoryTag.css';

function CategoryTag({ category, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`category-tag ${isActive ? 'category-tag-active' : ''}`}
      onClick={onClick}
    >
      {category}
    </button>
  );
}

export default CategoryTag;


import React from 'react';
import './IconCard.css';

function IconCard({ icon }) {
  return (
    <div className="icon-card">
      <div className="icon-card-preview">
        <div
          className="icon-card-svg"
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      </div>
      <div className="icon-card-info">
        <div className="icon-card-name">{icon.name}</div>
        <div className="icon-card-slug">{icon.slug}</div>
      </div>
    </div>
  );
}

export default IconCard;



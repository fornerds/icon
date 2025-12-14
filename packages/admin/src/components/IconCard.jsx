import React from 'react';
import './IconCard.css';

function IconCard({ icon }) {
  const isDeleted = icon.deleted_at !== null;
  const isDeprecated = icon.is_deprecated;

  return (
    <div className={`icon-card ${isDeleted ? 'icon-card-deleted' : ''}`}>
      <div className="icon-card-preview">
        <div
          className="icon-card-svg"
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      </div>
      <div className="icon-card-info">
        <div className="icon-card-name">{icon.name}</div>
        <div className="icon-card-slug">{icon.slug}</div>
        {isDeprecated && (
          <span className="icon-card-badge icon-card-badge-deprecated">Deprecated</span>
        )}
        {isDeleted && (
          <span className="icon-card-badge icon-card-badge-deleted">Deleted</span>
        )}
      </div>
    </div>
  );
}

export default IconCard;


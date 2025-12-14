import React from 'react';
import logoImage from '../assets/fornerds.png';
import './Logo.css';

function Logo() {
  return (
    <div className="logo-container">
      <img src={logoImage} alt="Fornerds Logo" className="logo-image" />
      <div className="logo-text">
        Fornerds Icon
      </div>
    </div>
  );
}

export default Logo;

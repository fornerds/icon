import React from 'react';
import Logo from './Logo';
import './Header.css';

function Header() {
  return (
    <header className="toss-header">
      <div className="toss-header-container">
        <div className="toss-header-content">
          <div className="toss-header-logo">
            <Logo />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;


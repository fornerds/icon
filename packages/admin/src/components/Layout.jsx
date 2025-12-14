import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-container">
          <div className="layout-header-content">
            <h1 className="layout-title">Fornerds Icon Admin</h1>
            {user && (
              <div className="layout-user">
                <span className="user-name">{user.username}</span>
                <button className="logout-button" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            )}
          </div>
          {user && (
            <nav className="layout-nav">
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                아이콘 관리
              </Link>
              <Link
                to="/categories"
                className={`nav-link ${location.pathname === '/categories' ? 'active' : ''}`}
              >
                카테고리 관리
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main className="layout-main">
        <div className="layout-container">{children}</div>
      </main>
    </div>
  );
}

export default Layout;

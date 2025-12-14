import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import IconCard from '../components/IconCard';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import CategoryTag from '../components/CategoryTag';
import './Home.css';

function Home() {
  const [icons, setIcons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchIcons();
  }, []);

  useEffect(() => {
    fetchIcons();
  }, [search, category]);

  const fetchCategories = async () => {
    try {
      const { data } = await client.get('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchIcons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const { data } = await client.get(`/icons?${params.toString()}`);
      setIcons(data);
    } catch (error) {
      console.error('Error fetching icons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categorySlug) => {
    setCategory(category === categorySlug ? '' : categorySlug);
  };

  return (
    <div className="home">
      <Header />
      
      <main className="home-main">
        <div className="home-content">
          <div className="home-container">
            <div className="home-filters">
              <SearchBar value={search} onChange={setSearch} placeholder="아이콘 검색..." />
            </div>

            {categories.length > 0 && (
              <div className="category-tags-container">
                <CategoryTag
                  category="전체"
                  isActive={category === ''}
                  onClick={() => handleCategoryClick('')}
                />
                {categories.map((cat) => (
                  <CategoryTag
                    key={cat.id}
                    category={cat.name}
                    isActive={category === cat.slug}
                    onClick={() => handleCategoryClick(cat.slug)}
                  />
                ))}
              </div>
            )}

            <div className="home-stats">
              <span className="stats-text">
                총 <strong>{icons.length}</strong>개의 아이콘
              </span>
            </div>

            {loading ? (
              <div className="loading">로딩 중...</div>
            ) : icons.length === 0 ? (
              <div className="empty-state">
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="icon-grid">
                {icons.map((icon) => (
                  <Link key={icon.id} to={`/icons/${icon.slug}`}>
                    <IconCard icon={icon} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <div className="home-container">
          <p className="footer-text">
            <a href="https://www.npmjs.com/package/@fornerds/icon" target="_blank" rel="noopener noreferrer">
              npm install @fornerds/icon
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;

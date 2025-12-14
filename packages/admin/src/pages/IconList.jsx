import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import IconCard from '../components/IconCard';
import SearchBar from '../components/SearchBar';
import Button from '../components/Button';
import './IconList.css';

function IconList() {
  const [icons, setIcons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeDeprecated, setIncludeDeprecated] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchIcons();
  }, []);

  useEffect(() => {
    fetchIcons();
  }, [search, category, includeDeprecated, includeDeleted]);

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
      if (includeDeprecated) params.append('includeDeprecated', 'true');
      if (includeDeleted) params.append('includeDeleted', 'true');

      const { data } = await client.get(`/icons?${params.toString()}`);
      setIcons(data);
    } catch (error) {
      console.error('Error fetching icons:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="icon-list">
      <div className="icon-list-header">
        <h2>아이콘 관리</h2>
        <Button onClick={() => setShowCreateModal(true)}>새 아이콘 추가</Button>
      </div>

      <div className="icon-list-filters">
        <SearchBar value={search} onChange={setSearch} placeholder="아이콘 검색..." />
        <select
          className="filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">전체 카테고리</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={includeDeprecated}
            onChange={(e) => setIncludeDeprecated(e.target.checked)}
          />
          Deprecated 포함
        </label>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          삭제된 항목 포함
        </label>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : icons.length === 0 ? (
        <div className="empty-state">아이콘이 없습니다.</div>
      ) : (
        <div className="icon-grid">
          {icons.map((icon) => (
            <Link key={icon.id} to={`/icons/${icon.id}`}>
              <IconCard icon={icon} />
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateIconModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchIcons();
          }}
        />
      )}
    </div>
  );
}

function CreateIconModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    svg: '',
    tags: '',
    category: '',
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await client.get('/categories');
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await client.get('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await client.post('/icons', {
        ...formData,
        tags,
        category: formData.category || null,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating icon:', error);
      alert('아이콘 생성에 실패했습니다.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>새 아이콘 추가</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>SVG</label>
            <textarea
              value={formData.svg}
              onChange={(e) => setFormData({ ...formData, svg: e.target.value })}
              rows={6}
              required
            />
          </div>
          <div className="form-group">
            <label>카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">선택 안함</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">생성</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IconList;


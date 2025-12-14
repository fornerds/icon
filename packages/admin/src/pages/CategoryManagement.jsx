import React, { useState, useEffect } from 'react';
import client from '../api/client';
import Button from '../components/Button';
import './CategoryManagement.css';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`카테고리 "${name}"을(를) 삭제하시겠습니까?`)) return;

    try {
      await client.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || '삭제에 실패했습니다.';
      if (message.includes('being used')) {
        alert(`${message}\n사용 중인 카테고리는 삭제할 수 없습니다.`);
      } else {
        alert(message);
      }
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="category-management">
      <div className="category-header">
        <h2>카테고리 관리</h2>
        <Button onClick={() => setShowCreateModal(true)}>새 카테고리 추가</Button>
      </div>

      <div className="category-list">
        {categories.length === 0 ? (
          <div className="empty-state">카테고리가 없습니다.</div>
        ) : (
          <table className="category-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>Slug</th>
                <th>설명</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>
                    <code>{category.slug}</code>
                  </td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingCategory(category)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(category.id, category.name)}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CategoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCategories();
          }}
        />
      )}

      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (category) {
        await client.patch(`/categories/${category.id}`, formData);
      } else {
        await client.post('/categories', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: category ? formData.slug : generateSlug(name),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{category ? '카테고리 수정' : '새 카테고리 추가'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이름 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="예: Navigation"
            />
          </div>
          <div className="form-group">
            <label>Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
              placeholder="예: navigation"
            />
            <small>URL에 사용되는 고유 식별자입니다.</small>
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="카테고리 설명 (선택사항)"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : category ? '수정' : '생성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryManagement;


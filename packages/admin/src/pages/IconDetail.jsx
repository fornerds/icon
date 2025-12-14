import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import Button from '../components/Button';
import './IconDetail.css';

function IconDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [icon, setIcon] = useState(null);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchIcon();
    fetchHistory();
  }, [id]);

  const fetchIcon = async () => {
    try {
      const { data } = await client.get(`/icons/${id}`);
      setIcon(data);
      setFormData({
        name: data.name,
        svg: data.svg,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        category: data.category || '',
      });
    } catch (error) {
      console.error('Error fetching icon:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await client.get('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await client.get(`/icons/${id}/history`);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await client.patch(`/icons/${id}`, {
        ...formData,
        tags,
      });
      setEditing(false);
      fetchIcon();
    } catch (error) {
      console.error('Error updating icon:', error);
      alert('업데이트에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await client.delete(`/icons/${id}`);
      navigate('/');
    } catch (error) {
      console.error('Error deleting icon:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleRestore = async () => {
    try {
      await client.patch(`/icons/${id}/restore`);
      fetchIcon();
    } catch (error) {
      console.error('Error restoring icon:', error);
      alert('복원에 실패했습니다.');
    }
  };

  const handleDeprecate = async () => {
    try {
      await client.patch(`/icons/${id}/deprecate`, {
        is_deprecated: !icon.is_deprecated,
      });
      fetchIcon();
    } catch (error) {
      console.error('Error deprecating icon:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!icon) {
    return <div className="error">아이콘을 찾을 수 없습니다.</div>;
  }

  const isDeleted = icon.deleted_at !== null;
  const isDeprecated = icon.is_deprecated;

  return (
    <div className="icon-detail">
      <div className="icon-detail-header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← 목록으로
        </Button>
        <div className="icon-detail-actions">
          {isDeleted ? (
            <Button variant="success" onClick={handleRestore}>
              복원
            </Button>
          ) : (
            <>
              {editing ? (
                <>
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    취소
                  </Button>
                  <Button onClick={handleUpdate}>저장</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    수정
                  </Button>
                  <Button
                    variant={isDeprecated ? 'success' : 'warning'}
                    onClick={handleDeprecate}
                  >
                    {isDeprecated ? 'Deprecated 해제' : 'Deprecated'}
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>
                    삭제
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="icon-detail-content">
        <div className="icon-detail-main">
          <div className="icon-preview-section">
            <h3>프리뷰</h3>
            <div className="icon-preview-grid">
              {[16, 24, 32, 48, 64].map((size) => (
                <div key={size} className="icon-preview-item">
                  <div
                    className="icon-preview-box"
                    dangerouslySetInnerHTML={{ __html: icon.svg }}
                    style={{ width: size, height: size }}
                  />
                  <span className="icon-preview-size">{size}px</span>
                </div>
              ))}
            </div>
          </div>

          <div className="icon-info-section">
            <h3>정보</h3>
            {editing ? (
              <div className="icon-form">
                <div className="form-group">
                  <label>이름</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>SVG</label>
                  <textarea
                    value={formData.svg}
                    onChange={(e) => setFormData({ ...formData, svg: e.target.value })}
                    rows={10}
                  />
                </div>
                <div className="form-group">
                  <label>태그 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
              </div>
            ) : (
              <div className="icon-info">
                <div className="info-item">
                  <span className="info-label">이름:</span>
                  <span className="info-value">{icon.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Slug:</span>
                  <span className="info-value">{icon.slug}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">버전:</span>
                  <span className="info-value">v{icon.latest_version}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">카테고리:</span>
                  <span className="info-value">{icon.category || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">태그:</span>
                  <span className="info-value">
                    {Array.isArray(icon.tags) && icon.tags.length > 0
                      ? icon.tags.join(', ')
                      : '-'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">상태:</span>
                  <span className="info-value">
                    {isDeleted ? (
                      <span className="status-badge status-deleted">삭제됨</span>
                    ) : isDeprecated ? (
                      <span className="status-badge status-deprecated">Deprecated</span>
                    ) : (
                      <span className="status-badge status-active">활성</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="icon-code-section">
            <h3>코드 스니펫</h3>
            <div className="code-tabs">
              <div className="code-tab active">React Component</div>
            </div>
            <div className="code-block">
              <pre>
                <code>{`import { ${icon.slug
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join('')} } from '@fornerds/icon';

<${icon.slug
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join('')} size={24} />`}</code>
              </pre>
            </div>
            <div className="code-tabs">
              <div className="code-tab active">Raw SVG</div>
            </div>
            <div className="code-block">
              <pre>
                <code>{icon.svg}</code>
              </pre>
            </div>
          </div>
        </div>

        <div className="icon-detail-sidebar">
          <div className="icon-history-section">
            <h3>변경 이력</h3>
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-header">
                    <span className="history-version">v{item.version}</span>
                    <span className={`history-type history-type-${item.change_type.toLowerCase()}`}>
                      {item.change_type}
                    </span>
                  </div>
                  <div className="history-meta">
                    {new Date(item.created_at).toLocaleString('ko-KR')}
                  </div>
                  {item.memo && <div className="history-memo">{item.memo}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IconDetail;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import Button from '../components/Button';
import Header from '../components/Header';
import './IconDetail.css';

function IconDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [icon, setIcon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchIcon();
  }, [slug]);

  const fetchIcon = async () => {
    try {
      const { data } = await client.get('/icons');
      const found = data.find((i) => i.slug === slug);
      if (found) {
        setIcon(found);
      }
    } catch (error) {
      console.error('Error fetching icon:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="icon-detail-page">
        <Header />
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (!icon) {
    return (
      <div className="icon-detail-page">
        <Header />
        <div className="error">아이콘을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const componentName = icon.slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  const reactCode = `import { ${componentName} } from '@fornerds/icon';

<${componentName} size={24} />`;

  return (
    <div className="icon-detail-page">
      <Header />
      
      <div className="detail-back-button">
        <div className="detail-container">
          <Button variant="secondary" onClick={() => navigate('/')}>
            ← 목록으로
          </Button>
        </div>
      </div>

      <main className="detail-main">
        <div className="detail-container">
          <div className="detail-content">
            <div className="detail-preview-section">
              <div className="preview-large">
                <div
                  className="preview-svg"
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
              </div>
              <h1 className="detail-title">{icon.name}</h1>
              <p className="detail-slug">{icon.slug}</p>
            </div>

            <div className="detail-sizes-section">
              <h2 className="section-title">다양한 사이즈</h2>
              <div className="sizes-grid">
                {[16, 24, 32, 48, 64, 96].map((size) => (
                  <div key={size} className="size-item">
                    <div
                      className="size-preview"
                      dangerouslySetInnerHTML={{ __html: icon.svg }}
                      style={{ width: size, height: size }}
                    />
                    <span className="size-label">{size}px</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-code-section">
              <h2 className="section-title">사용법</h2>
              <div className="code-tabs">
                <div className="code-tab active">React Component</div>
              </div>
              <div className="code-block">
                <div className="code-header">
                  <span>React</span>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(reactCode)}
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
                <pre>
                  <code>{reactCode}</code>
                </pre>
              </div>

              <div className="code-tabs">
                <div className="code-tab active">Raw SVG</div>
              </div>
              <div className="code-block">
                <div className="code-header">
                  <span>SVG</span>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(icon.svg)}
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
                <pre>
                  <code>{icon.svg}</code>
                </pre>
              </div>
            </div>

            {icon.tags && Array.isArray(icon.tags) && icon.tags.length > 0 && (
              <div className="detail-tags-section">
                <h2 className="section-title">태그</h2>
                <div className="tags-list">
                  {icon.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default IconDetail;


import express from 'express';
import pool from '../db.js';
import { authenticateToken, authenticateApiToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// tags 파싱 헬퍼 함수 (PostgreSQL JSONB는 이미 파싱되어 있지만 안전하게 처리)
function parseTags(tags) {
  if (!tags) return null;
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'object') return tags;
  if (typeof tags === 'string') {
    try {
      return JSON.parse(tags);
    } catch (e) {
      // JSON이 아닌 경우 쉼표로 구분된 문자열로 처리
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  return null;
}

// GET /api/icons - 아이콘 목록 조회
router.get('/', async (req, res) => {
  try {
    const { search, category, includeDeprecated, includeDeleted } = req.query;
    
    let query = 'SELECT * FROM icons WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (!includeDeleted || includeDeleted === 'false') {
      query += ' AND deleted_at IS NULL';
    }

    if (!includeDeprecated || includeDeprecated === 'false') {
      query += ' AND is_deprecated = FALSE';
    }

    if (search) {
      query += ` AND (name LIKE $${paramIndex} OR slug LIKE $${paramIndex + 1})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
      paramIndex += 2;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    // JSON 필드는 이미 파싱되어 있음 (JSONB)
    const parsedRows = result.rows.map(row => ({
      ...row,
      tags: row.tags || null, // JSONB는 이미 파싱되어 있음
    }));

    res.json(parsedRows);
  } catch (error) {
    console.error('Error fetching icons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/icons/:id - 아이콘 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Icon not found' });
    }

    const row = result.rows[0];
    const parsedRow = {
      ...row,
      tags: row.tags || null,
    };

    res.json(parsedRow);
  } catch (error) {
    console.error('Error fetching icon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/icons/:id/history - 아이콘 이력 조회
router.get('/:id/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM icon_versions WHERE icon_id = $1 ORDER BY version DESC',
      [req.params.id]
    );
    
    const parsedRows = result.rows.map(row => ({
      ...row,
      tags: row.tags || null,
    }));

    res.json(parsedRows);
  } catch (error) {
    console.error('Error fetching icon history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/icons - 아이콘 생성
router.post(
  '/',
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('svg').notEmpty().withMessage('SVG is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, svg, tags, category, size, property } = req.body;
      const userId = req.user?.id || 1;
      
      // size와 property는 필수값
      if (!size) {
        return res.status(400).json({ error: 'Size is required' });
      }
      if (!property) {
        return res.status(400).json({ error: 'Property is required' });
      }
      
      const iconSize = size.toString();
      const iconProperty = property.toString();
      
      // slug는 name 기반으로 자동 생성 (하위 호환성 유지)
      const slug = name.replace(/^icon\//, '').replace(/\//g, '-');

      console.log('📝 Creating icon:', { name, size: iconSize, property: iconProperty, category, tagsCount: tags?.length || 0 });

      // (name, size, property) 조합으로 중복 확인
      const checkResult = await pool.query(
        'SELECT id FROM icons WHERE name = $1 AND size = $2 AND property = $3 AND deleted_at IS NULL',
        [name, iconSize, iconProperty]
      );

      if (checkResult.rows.length > 0) {
        return res.status(409).json({ error: 'Icon with this name, size, and property already exists' });
      }

      // tags 처리: 이미 배열이면 그대로, 아니면 배열로 변환
      const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);
      const tagsJson = JSON.stringify(tagsArray);

      // category가 문자열인 경우, categories 테이블에서 확인
      let categoryValue = category || null;
      if (category && typeof category === 'string') {
        const categoryCheck = await pool.query('SELECT slug FROM categories WHERE slug = $1', [category]);
        if (categoryCheck.rows.length === 0) {
          console.warn(`⚠️ Category "${category}" not found in database, using null`);
          categoryValue = null;
        } else {
          categoryValue = category;
        }
      }

      // icons 테이블에 저장
      const insertResult = await pool.query(
        `INSERT INTO icons (name, slug, latest_version, svg, tags, category, size, property, created_by, updated_by)
         VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [name, slug, svg, tagsJson, categoryValue, iconSize, iconProperty, userId, userId]
      );

      const iconId = insertResult.rows[0].id;

      // icon_versions 테이블에 이력 저장
      await pool.query(
        `INSERT INTO icon_versions (icon_id, version, name, svg, tags, category, size, property, change_type, created_by)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, 'CREATE', $8)`,
        [iconId, name, svg, tagsJson, categoryValue, iconSize, iconProperty, userId]
      );

      const newIcon = insertResult.rows[0];
      const parsedIcon = {
        ...newIcon,
        tags: parseTags(newIcon.tags),
      };

      console.log('✅ Icon created successfully:', iconId);
      res.status(201).json(parsedIcon);
    } catch (error) {
      console.error('❌ Error creating icon:', error);
      console.error('   Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack,
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.detail : undefined,
      });
    }
  }
);

// PATCH /api/icons/:id - 아이콘 업데이트
router.patch(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { name, svg, tags, category } = req.body;
      const userId = req.user?.id || 1;

      // 현재 아이콘 정보 조회
      const currentResult = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);

      if (currentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Icon not found' });
      }

      const currentIcon = currentResult.rows[0];
      const newVersion = currentIcon.latest_version + 1;

      // icons 테이블 업데이트
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (svg !== undefined) {
        updateFields.push(`svg = $${paramIndex++}`);
        updateValues.push(svg);
      }
      if (tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        updateValues.push(JSON.stringify(tags));
      }
      if (category !== undefined) {
        updateFields.push(`category = $${paramIndex++}`);
        updateValues.push(category);
      }

      updateFields.push(`latest_version = $${paramIndex++}`);
      updateValues.push(newVersion);
      updateFields.push(`updated_by = $${paramIndex++}`);
      updateValues.push(userId);
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(req.params.id);

      await pool.query(
        `UPDATE icons SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );

      // icon_versions 테이블에 이력 저장
      await pool.query(
        `INSERT INTO icon_versions (icon_id, version, name, svg, tags, category, size, property, change_type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UPDATE', $9)`,
        [
          req.params.id,
          newVersion,
          name || currentIcon.name,
          svg || currentIcon.svg,
          JSON.stringify(tags !== undefined ? tags : (currentIcon.tags ? (Array.isArray(currentIcon.tags) ? currentIcon.tags : parseTags(currentIcon.tags)) : [])),
          category !== undefined ? category : currentIcon.category,
          currentIcon.size || '24',
          currentIcon.property || 'outline',
          userId
        ]
      );

      const updatedResult = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);
      const updated = updatedResult.rows[0];

      const parsedIcon = {
        ...updated,
        tags: parseTags(updated.tags),
      };

      res.json(parsedIcon);
    } catch (error) {
      console.error('Error updating icon:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/icons/:id - Soft Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    const currentResult = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Icon not found' });
    }

    const currentIcon = currentResult.rows[0];

    // Soft delete
    await pool.query('UPDATE icons SET deleted_at = NOW() WHERE id = $1', [req.params.id]);

    // 이력 저장
    await pool.query(
      `INSERT INTO icon_versions (icon_id, version, name, svg, tags, category, size, property, change_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DELETE', $9)`,
      [
        req.params.id,
        currentIcon.latest_version,
        currentIcon.name,
        currentIcon.svg,
        currentIcon.tags,
        currentIcon.category,
        currentIcon.size || '24',
        currentIcon.property || 'outline',
        userId
      ]
    );

    res.json({ message: 'Icon deleted successfully' });
  } catch (error) {
    console.error('Error deleting icon:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.detail : undefined,
    });
  }
});

// PATCH /api/icons/:id/restore - Restore
router.patch('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    const currentResult = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Icon not found' });
    }

    const currentIcon = currentResult.rows[0];

    // Restore
    await pool.query('UPDATE icons SET deleted_at = NULL WHERE id = $1', [req.params.id]);

    // 이력 저장
    await pool.query(
      `INSERT INTO icon_versions (icon_id, version, name, svg, tags, category, size, property, change_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'RESTORE', $9)`,
      [
        req.params.id,
        currentIcon.latest_version,
        currentIcon.name,
        currentIcon.svg,
        currentIcon.tags,
        currentIcon.category,
        currentIcon.size || '24',
        currentIcon.property || 'outline',
        userId
      ]
    );

    const restoredResult = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);
    const restored = restoredResult.rows[0];

    const parsedIcon = {
      ...restored,
        tags: parseTags(restored.tags),
    };

    res.json(parsedIcon);
  } catch (error) {
    console.error('Error restoring icon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/icons/:id/deprecate - Deprecate
router.patch('/:id/deprecate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    const currentResult = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Icon not found' });
    }

    const currentIcon = currentResult.rows[0];
    const { is_deprecated } = req.body;
    const deprecateValue = is_deprecated !== undefined ? is_deprecated : true;

    // Deprecate/Undeprecate
    await pool.query('UPDATE icons SET is_deprecated = $1 WHERE id = $2', [deprecateValue, req.params.id]);

    // 이력 저장
    await pool.query(
      `INSERT INTO icon_versions (icon_id, version, name, svg, tags, category, size, property, change_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DEPRECATE', $9)`,
      [
        req.params.id,
        currentIcon.latest_version,
        currentIcon.name,
        currentIcon.svg,
        currentIcon.tags,
        currentIcon.category,
        currentIcon.size || '24',
        currentIcon.property || 'outline',
        userId
      ]
    );

    const updatedResult = await pool.query('SELECT * FROM icons WHERE id = $1', [req.params.id]);
    const updated = updatedResult.rows[0];

    const parsedIcon = {
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : null,
    };

    res.json(parsedIcon);
  } catch (error) {
    console.error('Error deprecating icon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/icons/from-figma - Figma Plugin 전용 API
router.post(
  '/from-figma',
  authenticateApiToken,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('svg').notEmpty().withMessage('SVG is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, svg, tags, category, mode, size, property } = req.body;
      const baseSlug = name.replace(/^icon\//, '').replace(/\//g, '-');
      const iconSize = size || '24';
      const iconProperty = property || 'outline';
      const userId = 1; // Figma plugin user

      // 기존 아이콘 확인 (name, size, property 조합으로)
      const existingResult = await pool.query(
        'SELECT * FROM icons WHERE name = $1 AND size = $2 AND property = $3 AND deleted_at IS NULL',
        [name, iconSize, iconProperty]
      );
      const existing = existingResult.rows[0];

      if (existing && mode !== 'FORCE_UPDATE') {
        // 기존 아이콘이 있으면 업데이트
        const newVersion = existing.latest_version + 1;

        await pool.query(
          `UPDATE icons SET svg = $1, tags = $2, category = $3, latest_version = $4, updated_by = $5, updated_at = NOW(), size = $6, property = $7 WHERE id = $8`,
          [svg, JSON.stringify(tags || []), category || null, newVersion, userId, iconSize, iconProperty, existing.id]
        );

        await pool.query(
          `INSERT INTO icon_versions (icon_id, version, name, svg, tags, category, size, property, change_type, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UPDATE', $9)`,
          [existing.id, newVersion, existing.name, svg, JSON.stringify(tags || []), category || null, iconSize, iconProperty, userId]
        );

        const updatedResult = await pool.query('SELECT * FROM icons WHERE id = $1', [existing.id]);
        const updated = updatedResult.rows[0];

        const parsedIcon = {
          ...updated,
          tags: parseTags(updated.tags),
        };

        return res.json(parsedIcon);
      } else {
        // 신규 생성
        const insertResult = await pool.query(
          `INSERT INTO icons (name, slug, latest_version, svg, tags, category, size, property, created_by, updated_by)
           VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [name, baseSlug, svg, JSON.stringify(tags || []), category || null, iconSize, iconProperty, userId, userId]
        );

        const iconId = insertResult.rows[0].id;

        await pool.query(
          `INSERT INTO icon_versions (icon_id, version, name, svg, tags, category, size, property, change_type, created_by)
           VALUES ($1, 1, $2, $3, $4, $5, $6, $7, 'CREATE', $8)`,
          [iconId, name, svg, JSON.stringify(tags || []), category || null, iconSize, iconProperty, userId]
        );

        const newIcon = insertResult.rows[0];
        const parsedIcon = {
          ...newIcon,
          tags: parseTags(newIcon.tags),
        };

        return res.status(201).json(parsedIcon);
      }
    } catch (error) {
      console.error('Error processing Figma icon:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/icons/export/build - npm 빌드용 데이터
router.get('/export/build', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, svg, tags, category, size, property, is_deprecated FROM icons WHERE deleted_at IS NULL ORDER BY name, size, property'
    );
    
    const parsedRows = result.rows.map(row => ({
      ...row,
      tags: parseTags(row.tags),
      size: row.size || '24',
      property: row.property || 'outline',
    }));

    res.json(parsedRows);
  } catch (error) {
    console.error('Error exporting icons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

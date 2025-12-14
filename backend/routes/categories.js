import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/categories - 카테고리 목록 조회 (인증 불필요)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/:id - 카테고리 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - 카테고리 생성 (인증 필요)
router.post(
  '/',
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, slug, description } = req.body;
      const userId = req.user?.id || 1;

      // slug 중복 확인
      const checkResult = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);

      if (checkResult.rows.length > 0) {
        return res.status(409).json({ error: 'Slug already exists' });
      }

      const insertResult = await pool.query(
        `INSERT INTO categories (name, slug, description, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, slug, description || null, userId, userId]
      );

      res.status(201).json(insertResult.rows[0]);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/categories/:id - 카테고리 수정 (인증 필요)
router.patch(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { name, slug, description } = req.body;
      const userId = req.user?.id || 1;

      // 현재 카테고리 확인
      const currentResult = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);

      if (currentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const current = currentResult.rows[0];

      // slug 중복 확인 (자신 제외)
      if (slug && slug !== current.slug) {
        const checkResult = await pool.query(
          'SELECT id FROM categories WHERE slug = $1 AND id != $2',
          [slug, req.params.id]
        );

        if (checkResult.rows.length > 0) {
          return res.status(409).json({ error: 'Slug already exists' });
        }
      }

      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (slug !== undefined) {
        updateFields.push(`slug = $${paramIndex++}`);
        updateValues.push(slug);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(description);
      }

      updateFields.push(`updated_by = $${paramIndex++}`);
      updateValues.push(userId);
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(req.params.id);

      await pool.query(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );

      const updatedResult = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
      res.json(updatedResult.rows[0]);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/categories/:id - 카테고리 삭제 (인증 필요)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // 해당 카테고리를 사용하는 아이콘 확인
    const categoryResult = await pool.query('SELECT slug FROM categories WHERE id = $1', [req.params.id]);

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categoryResult.rows[0];

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM icons 
       WHERE category = $1 AND deleted_at IS NULL`,
      [category.slug]
    );

    if (parseInt(countResult.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete category. It is being used by icons.',
        iconCount: parseInt(countResult.rows[0].count),
      });
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

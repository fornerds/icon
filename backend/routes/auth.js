import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// POST /api/auth/login - 로그인
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // 데이터베이스에서 사용자 조회
      const result = await pool.query(
        'SELECT id, username, email, password_hash, is_active FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      // 비밀번호 확인
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/auth/me - 현재 사용자 정보
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid token' });
        }

        try {
          const result = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1 AND is_active = TRUE',
            [decoded.id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json(result.rows[0]);
        } catch (error) {
          console.error('Error fetching user:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

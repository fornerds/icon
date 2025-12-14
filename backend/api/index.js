// Vercel Serverless Functions용 진입점
import express from 'express';
import cors from 'cors';
import iconRoutes from '../routes/icons.js';
import authRoutes from '../routes/auth.js';
import categoryRoutes from '../routes/categories.js';

const app = express();

// CORS 설정 - Vercel 배포 시 프론트엔드 도메인 허용
const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.LANDING_URL,
  'http://localhost:3002',
  'http://localhost:3003',
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/icons', iconRoutes);

// Vercel Serverless Function export
export default app;

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
  'https://fornerds-icon-admin.vercel.app',
  'https://fornerds-icon.vercel.app',
].filter(Boolean);

// CORS 미들웨어 설정
app.use(cors({
  origin: (origin, callback) => {
    // origin이 없으면 (같은 도메인 요청 등) 허용
    if (!origin) {
      return callback(null, true);
    }
    
    // Vercel 도메인 패턴 확인
    const isVercelDomain = /^https:\/\/.*\.vercel\.app$/.test(origin);
    
    // 허용된 origin 목록 확인
    const isAllowed = allowedOrigins.includes(origin) || isVercelDomain;
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // 개발 환경에서는 모든 origin 허용
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// OPTIONS 요청 명시적 처리 (Vercel Serverless Functions용)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const isVercelDomain = origin && /^https:\/\/.*\.vercel\.app$/.test(origin);
  const isAllowed = allowedOrigins.includes(origin) || isVercelDomain;
  
  if (isAllowed || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(204).send();
  } else {
    res.status(403).send();
  }
});

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

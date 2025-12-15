import pg from 'pg';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const { Pool } = pg;

// DATABASE_URL이 있으면 우선 사용 (Neon 등)
let poolConfig;

// Vercel에서는 환경 변수가 이미 로드되어 있으므로 확인
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  console.log('📦 Using DATABASE_URL for connection');
  poolConfig = {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  };
} else {
  console.warn('⚠️ DATABASE_URL not found, using individual DB config');
  // 개별 환경 변수 사용
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fornerds_icon',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
  
  // 로컬호스트로 연결 시도하는 것을 방지
  if (poolConfig.host === 'localhost' && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL environment variable is required in production. Please set it in Vercel Dashboard.');
  }
}

const pool = new Pool(poolConfig);

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export default pool;

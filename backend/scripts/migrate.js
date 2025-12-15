import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../db.js';
import bcrypt from 'bcrypt';

// 현재 파일의 디렉토리 경로 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드 (.env 파일 경로 명시)
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath, override: true });

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // icons 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS icons (
        id              BIGSERIAL PRIMARY KEY,
        name            VARCHAR(191) NOT NULL,
        slug            VARCHAR(191) NOT NULL UNIQUE,
        latest_version  INTEGER NOT NULL DEFAULT 1,
        svg             TEXT NOT NULL,
        tags            JSONB NULL,
        category        VARCHAR(50) NULL,
        is_deprecated   BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_at      TIMESTAMP NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by      BIGINT NOT NULL DEFAULT 1,
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_by      BIGINT NOT NULL DEFAULT 1
      )
    `);

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_icons_slug ON icons(slug);
      CREATE INDEX IF NOT EXISTS idx_icons_category ON icons(category);
      CREATE INDEX IF NOT EXISTS idx_icons_deleted_at ON icons(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_icons_is_deprecated ON icons(is_deprecated);
    `);

    // icon_versions 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS icon_versions (
        id             BIGSERIAL PRIMARY KEY,
        icon_id        BIGINT NOT NULL,
        version        INTEGER NOT NULL,
        name           VARCHAR(191) NOT NULL,
        svg            TEXT NOT NULL,
        tags           JSONB NULL,
        category       VARCHAR(50) NULL,
        change_type    VARCHAR(20) NOT NULL CHECK(change_type IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'DEPRECATE')),
        memo           VARCHAR(255) NULL,
        created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by     BIGINT NOT NULL DEFAULT 1,
        FOREIGN KEY (icon_id) REFERENCES icons(id) ON DELETE CASCADE
      )
    `);

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_icon_versions_icon_id ON icon_versions(icon_id);
      CREATE INDEX IF NOT EXISTS idx_icon_versions_version ON icon_versions(icon_id, version);
    `);

    // categories 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id              BIGSERIAL PRIMARY KEY,
        name            VARCHAR(50) NOT NULL UNIQUE,
        slug            VARCHAR(50) NOT NULL UNIQUE,
        description     VARCHAR(255) NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by      BIGINT NOT NULL DEFAULT 1,
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_by      BIGINT NOT NULL DEFAULT 1
      )
    `);

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    `);

    // users 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id              BIGSERIAL PRIMARY KEY,
        username        VARCHAR(50) NOT NULL UNIQUE,
        email           VARCHAR(100) NOT NULL UNIQUE,
        password_hash   VARCHAR(255) NOT NULL,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // 기본 카테고리 추가
    const defaultCategories = [
      { name: 'Navigation', slug: 'navigation' },
      { name: 'Action', slug: 'action' },
      { name: 'Communication', slug: 'communication' },
      { name: 'Content', slug: 'content' },
      { name: 'Device', slug: 'device' },
      { name: 'Editor', slug: 'editor' },
      { name: 'File', slug: 'file' },
      { name: 'Hardware', slug: 'hardware' },
      { name: 'Image', slug: 'image' },
      { name: 'Maps', slug: 'maps' },
      { name: 'Notification', slug: 'notification' },
      { name: 'Social', slug: 'social' },
      { name: 'Toggle', slug: 'toggle' },
    ];

    for (const cat of defaultCategories) {
      await client.query(
        `INSERT INTO categories (name, slug, created_by, updated_by) 
         VALUES ($1, $2, 1, 1) 
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug]
      );
    }

    // 기본 관리자 계정 생성/업데이트 (환경 변수에서 가져오거나 기본값 사용)
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fornerds.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
    
    // 비밀번호 해싱 (bcrypt 사용)
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // 기존 계정 확인
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [adminUsername]
    );
    
    if (existingUser.rows.length > 0) {
      // 기존 계정이 있으면 비밀번호 업데이트
      await client.query(
        `UPDATE users 
         SET email = $1, password_hash = $2, updated_at = NOW() 
         WHERE username = $3`,
        [adminEmail, passwordHash, adminUsername]
      );
      console.log(`📝 Admin account updated:`);
    } else {
      // 새 계정 생성
      await client.query(
        `INSERT INTO users (username, email, password_hash, is_active) 
         VALUES ($1, $2, $3, TRUE)`,
        [adminUsername, adminEmail, passwordHash]
      );
      console.log(`📝 Default admin account created:`);
    }
    
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword} (hashed and stored)`);
    console.log(`   Password Hash: ${passwordHash.substring(0, 20)}...`);
    console.log(`\n⚠️  Please change the default password after first login!`);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
    console.log(`📝 Default admin account created:`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`\n⚠️  Please change the default password after first login!`);
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

createTables();

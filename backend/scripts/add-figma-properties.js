import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../db.js';

// 현재 파일의 디렉토리 경로 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드 (.env 파일 경로 명시)
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath, override: true });

const addFigmaProperties = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('📝 Adding size and property columns to icons table...');

    // size 컬럼 추가
    await client.query(`
      ALTER TABLE icons 
      ADD COLUMN IF NOT EXISTS size VARCHAR(20) NULL
    `);

    // property 컬럼 추가
    await client.query(`
      ALTER TABLE icons 
      ADD COLUMN IF NOT EXISTS property VARCHAR(50) NULL
    `);

    // icon_versions 테이블에도 추가
    await client.query(`
      ALTER TABLE icon_versions 
      ADD COLUMN IF NOT EXISTS size VARCHAR(20) NULL
    `);

    await client.query(`
      ALTER TABLE icon_versions 
      ADD COLUMN IF NOT EXISTS property VARCHAR(50) NULL
    `);

    // 기존 아이콘에 기본값 설정
    console.log('📝 Setting default values for existing icons...');
    await client.query(`
      UPDATE icons 
      SET size = '24', property = 'outline' 
      WHERE size IS NULL OR property IS NULL
    `);

    // UNIQUE 제약 조건 제거 (slug가 이미 UNIQUE이므로)
    // 대신 (name, size, property) 조합으로 검색할 수 있도록 인덱스 추가
    console.log('📝 Adding index for name, size, property...');
    
    // slug UNIQUE 제약 조건 제거 (이미 있으면 에러 무시)
    try {
      await client.query(`
        ALTER TABLE icons 
        DROP CONSTRAINT IF EXISTS icons_slug_key
      `);
    } catch (error) {
      // 제약 조건이 없으면 무시
      console.log('   (slug constraint already removed or does not exist)');
    }

    // (name, size, property) 조합으로 UNIQUE 제약 조건 추가
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_icons_name_size_property 
      ON icons(name, size, property) 
      WHERE deleted_at IS NULL
    `);

    // size, property 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_icons_size ON icons(size)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_icons_property ON icons(property)
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully added size and property columns');
    console.log('📝 Default values: size=24, property=outline');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

addFigmaProperties();


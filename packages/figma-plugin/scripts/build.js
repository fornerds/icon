import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');

// dist 디렉토리 생성
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// UI HTML 파일을 dist로 복사
const uiHtmlPath = path.join(__dirname, '../src/ui.html');
const distUiPath = path.join(distDir, 'ui.html');

if (fs.existsSync(uiHtmlPath)) {
  fs.copyFileSync(uiHtmlPath, distUiPath);
  console.log('✅ Copied ui.html to dist');
} else {
  console.warn('⚠️  ui.html not found');
}

// manifest.json을 dist로 복사
const manifestPath = path.join(__dirname, '../manifest.json');
const distManifestPath = path.join(distDir, 'manifest.json');

if (fs.existsSync(manifestPath)) {
  fs.copyFileSync(manifestPath, distManifestPath);
  console.log('✅ Copied manifest.json to dist');
} else {
  console.warn('⚠️  manifest.json not found');
}


import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'https://fornerds-icon-backend.vercel.app/api/icons/export/build';

async function fetchIcons() {
  try {
    console.log('📦 Fetching icons from API...');
    const { data } = await axios.get(API_URL);
    return data;
  } catch (error) {
    console.error('❌ Error fetching icons:', error.message);
    process.exit(1);
  }
}

function generateComponentName(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function generateComponent(icon) {
  const componentName = generateComponentName(icon.slug);
  const svg = icon.svg.replace(/<svg/, '<svg').trim();

  return `import React from 'react';
import { Icon, IconProps } from './Icon';

export const ${componentName}: React.FC<IconProps> = (props) => {
  return <Icon svg={\`${svg.replace(/`/g, '\\`')}\`} {...props} />;
};
`;
}

function generateIndex(icons) {
  const exports = icons
    .map((icon) => {
      const componentName = generateComponentName(icon.slug);
      return `export { ${componentName} } from './${componentName}';`;
    })
    .join('\n');

  return `${exports}\n`;
}

function generateTypes(icons) {
  const types = icons
    .map((icon) => {
      const componentName = generateComponentName(icon.slug);
      return `export declare const ${componentName}: React.FC<IconProps>;`;
    })
    .join('\n');

  return `import React from 'react';
import { IconProps } from './Icon';

${types}
`;
}

async function build() {
  console.log('🚀 Starting build process...\n');

  const icons = await fetchIcons();
  console.log(`✅ Fetched ${icons.length} icons\n`);

  const distDir = path.join(__dirname, '../dist');
  const srcDir = path.join(__dirname, '../src');

  // Create dist directory
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy Icon.tsx to dist
  const iconSource = fs.readFileSync(path.join(srcDir, 'Icon.tsx'), 'utf-8');
  fs.writeFileSync(path.join(distDir, 'Icon.tsx'), iconSource);
  fs.writeFileSync(path.join(distDir, 'Icon.js'), iconSource.replace(/\.tsx/g, '.js'));

  // Generate components
  console.log('📝 Generating components...');
  for (const icon of icons) {
    const componentName = generateComponentName(icon.slug);
    const componentCode = generateComponent(icon);
    const componentPath = path.join(distDir, `${componentName}.tsx`);
    fs.writeFileSync(componentPath, componentCode);
  }
  console.log(`✅ Generated ${icons.length} components\n`);

  // Generate index
  console.log('📝 Generating index file...');
  const indexContent = generateIndex(icons);
  fs.writeFileSync(path.join(distDir, 'index.tsx'), indexContent);
  fs.writeFileSync(path.join(distDir, 'index.js'), indexContent.replace(/\.tsx/g, '.js'));
  // ESM version (same content for now)
  fs.writeFileSync(path.join(distDir, 'index.esm.js'), indexContent.replace(/\.tsx/g, '.js'));
  console.log('✅ Generated index file\n');

  // Generate types
  console.log('📝 Generating type definitions...');
  const typesContent = generateTypes(icons);
  fs.writeFileSync(path.join(distDir, 'index.d.ts'), typesContent);
  console.log('✅ Generated type definitions\n');

  console.log('🎉 Build completed successfully!');
}

build().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});


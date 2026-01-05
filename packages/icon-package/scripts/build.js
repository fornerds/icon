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

function generateIconKey(name, size, property) {
  // name-size-property 형태의 키 생성
  // 예: "arrow-right-24-outline"
  const sizeStr = size || '24';
  const propertyStr = property || 'outline';
  return `${name}-${sizeStr}-${propertyStr}`;
}

function generateIconsMap(icons) {
  const mapEntries = icons.map((icon) => {
    // SVG에서 백틱과 달러 기호 이스케이프
    const svg = icon.svg.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const key = generateIconKey(icon.name, icon.size, icon.property);
    return `  '${key}': \`${svg}\`,`;
  }).join('\n');

  return `export const iconsMap: Record<string, string> = {
${mapEntries}
};
`;
}

function generateIconNameType(icons) {
  // 중복 제거된 icon name 목록
  const uniqueNames = [...new Set(icons.map(icon => icon.name))];
  const iconNames = uniqueNames.map((name) => `  | '${name}'`).join('\n');
  return `export type IconName =\n${iconNames};
`;
}

function generateSizePropertyTypes(icons) {
  // 사용 가능한 size와 property 값 추출
  const sizes = [...new Set(icons.map(icon => icon.size || '24').filter(Boolean))];
  const properties = [...new Set(icons.map(icon => icon.property || 'outline').filter(Boolean))];
  
  const sizeType = sizes.map(s => `  | '${s}'`).join('\n');
  const propertyType = properties.map(p => `  | '${p}'`).join('\n');
  
  return `export type IconSize =\n${sizeType};

export type IconProperty =\n${propertyType};
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

  // Generate icons map
  console.log('📝 Generating icons map...');
  const iconsMapContent = generateIconsMap(icons);
  
  // TypeScript version
  fs.writeFileSync(path.join(distDir, 'iconsMap.ts'), iconsMapContent);
  
  // JavaScript version (remove type annotation)
  const iconsMapJs = iconsMapContent.replace(/Record<string, string>/g, '');
  fs.writeFileSync(path.join(distDir, 'iconsMap.js'), iconsMapJs);
  
  console.log(`✅ Generated icons map with ${icons.length} icons\n`);

  // Generate icon name type
  console.log('📝 Generating icon name type...');
  const iconNameTypeContent = generateIconNameType(icons);
  fs.writeFileSync(path.join(distDir, 'iconNameType.ts'), iconNameTypeContent);
  console.log('✅ Generated icon name type\n');

  // Generate size and property types
  console.log('📝 Generating size and property types...');
  const sizePropertyTypeContent = generateSizePropertyTypes(icons);
  fs.writeFileSync(path.join(distDir, 'iconSizePropertyType.ts'), sizePropertyTypeContent);
  console.log('✅ Generated size and property types\n');

  // Generate enhanced Icon component wrapper
  console.log('📝 Generating Icon wrapper...');
  const iconWrapperContent = `import React from 'react';
import { Icon as BaseIcon, IconProps as BaseIconProps } from './Icon';
import { iconsMap } from './iconsMap';
import type { IconName } from './iconNameType';
import type { IconSize, IconProperty } from './iconSizePropertyType';

export interface IconProps extends Omit<BaseIconProps, 'svg'> {
  name: IconName;
  size?: IconSize | number | string;
  property?: IconProperty;
  svg?: never;
}

export interface IconWithSvgProps extends BaseIconProps {
  name?: never;
  svg: string;
}

export type IconComponentProps = IconProps | IconWithSvgProps;

function getIconKey(name: string, size?: IconSize | number | string, property?: IconProperty): string {
  const sizeStr = (size || '24').toString();
  const propertyStr = property || 'outline';
  return \`\${name}-\${sizeStr}-\${propertyStr}\`;
}

export const Icon: React.FC<IconComponentProps> = (props) => {
  if ('name' in props && props.name) {
    const { name, size, property, ...restProps } = props;
    const iconKey = getIconKey(name, size, property);
    const svg = iconsMap[iconKey];
    if (!svg) {
      console.warn('Icon "' + iconKey + '" not found in iconsMap. Available keys:', Object.keys(iconsMap).slice(0, 5));
      return null;
    }
    // SVG는 이미 size에 맞게 선택되었으므로, BaseIcon에 전달
    // 사용자가 size를 명시적으로 변경하고 싶다면 restProps에 포함됨
    return <BaseIcon svg={svg} size={size ? Number(size) : undefined} {...restProps} />;
  }
  
  if ('svg' in props && props.svg) {
    return <BaseIcon {...(props as BaseIconProps)} />;
  }
  
  console.warn('Icon component requires either "name" or "svg" prop');
  return null;
};
`;
  fs.writeFileSync(path.join(distDir, 'IconWrapper.tsx'), iconWrapperContent);
  
  // JavaScript version - simplified version (with JSX)
  const iconWrapperJsContent = `import React from 'react';
import { Icon as BaseIcon } from './Icon.js';
import { iconsMap } from './iconsMap.js';

function getIconKey(name, size, property) {
  const sizeStr = (size || '24').toString();
  const propertyStr = property || 'outline';
  return name + '-' + sizeStr + '-' + propertyStr;
}

export const Icon = (props) => {
  if (props.name) {
    const { name, size, property, ...restProps } = props;
    const iconKey = getIconKey(name, size, property);
    const svg = iconsMap[iconKey];
    if (!svg) {
      console.warn('Icon "' + iconKey + '" not found in iconsMap');
      return null;
    }
    // SVG는 이미 size에 맞게 선택되었으므로, BaseIcon에 전달
    // 사용자가 size를 명시적으로 변경하고 싶다면 restProps에 포함됨
    return <BaseIcon svg={svg} size={size ? Number(size) : undefined} {...restProps} />;
  }
  
  if (props.svg) {
    return <BaseIcon {...props} />;
  }
  
  console.warn('Icon component requires either "name" or "svg" prop');
  return null;
};
`;
  fs.writeFileSync(path.join(distDir, 'IconWrapper.js'), iconWrapperJsContent);
  console.log('✅ Generated Icon wrapper\n');

  // Generate index
  console.log('📝 Generating index file...');
  const indexContent = `export { Icon, type IconProps, type IconWithSvgProps, type IconComponentProps } from './IconWrapper';\nexport { iconsMap } from './iconsMap';\nexport type { IconName } from './iconNameType';\nexport type { IconSize, IconProperty } from './iconSizePropertyType';\nexport { Icon as BaseIcon, type IconProps as BaseIconProps } from './Icon';\n`;
  fs.writeFileSync(path.join(distDir, 'index.tsx'), indexContent);
  fs.writeFileSync(path.join(distDir, 'index.js'), indexContent.replace(/\.tsx/g, '.js').replace(/type /g, ''));
  // ESM version
  fs.writeFileSync(path.join(distDir, 'index.esm.js'), indexContent.replace(/\.tsx/g, '.js').replace(/type /g, ''));
  console.log('✅ Generated index file\n');

  // Generate types
  console.log('📝 Generating type definitions...');
  const typesContent = `export { Icon, type IconProps, type IconWithSvgProps, type IconComponentProps } from './IconWrapper';\nexport { iconsMap } from './iconsMap';\nexport type { IconName } from './iconNameType';\nexport type { IconSize, IconProperty } from './iconSizePropertyType';\nexport { Icon as BaseIcon, type IconProps as BaseIconProps } from './Icon';\n`;
  fs.writeFileSync(path.join(distDir, 'index.d.ts'), typesContent);
  console.log('✅ Generated type definitions\n');

  console.log('🎉 Build completed successfully!');
}

build().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});


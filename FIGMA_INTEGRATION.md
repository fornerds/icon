# Figma 아이콘 Size와 Property 통합 가이드

피그마에서 사용하는 아이콘의 Size와 Property를 읽어서 npm 패키지에서도 동일하게 사용할 수 있도록 하는 방법입니다.

## 피그마 Plugin API로 Size와 Property 읽기

피그마 플러그인에서 컴포넌트의 variant properties를 읽는 방법:

```typescript
// 피그마 플러그인 예시 코드
figma.on('selectionchange', async () => {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 1 && selection[0].type === 'INSTANCE') {
    const instance = selection[0] as InstanceNode;
    const component = instance.mainComponent;
    
    // 현재 인스턴스의 속성 값 가져오기
    const properties = instance.componentProperties || {};
    
    // Size와 Property 값 추출
    // 피그마에서는 variant property의 이름이 정확히 'Size', 'Property'일 수 있습니다
    const size = properties['Size']?.value || properties['size']?.value || '24';
    const property = properties['Property']?.value || properties['property']?.value || 'outline';
    
    // 컴포넌트 이름 (기본 아이콘 이름)
    const baseName = component?.name || instance.name;
    
    console.log('Icon:', baseName);
    console.log('Size:', size);
    console.log('Property:', property);
    
    // SVG 추출 (실제 구현은 더 복잡할 수 있음)
    const svgBytes = await instance.exportAsync({ format: 'SVG' });
    const svgString = new TextDecoder().decode(svgBytes);
    
    // API로 전송
    await fetch('https://your-api.com/api/icons/from-figma', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        name: baseName,
        svg: svgString,
        size: size.toString(),
        property: property.toString(),
        tags: [],
        category: null
      })
    });
  }
});
```

### 피그마에서 속성 이름 확인 방법

피그마에서 컴포넌트의 variant property 이름을 확인하려면:

1. 컴포넌트 선택
2. Properties 패널에서 variant property 이름 확인
3. 일반적으로 `Size`, `Property` 등의 이름을 사용

만약 다른 이름을 사용한다면 (예: `Icon Size`, `Style`), 플러그인 코드에서 해당 이름을 사용해야 합니다.

## 데이터베이스 스키마 변경

마이그레이션 스크립트 실행:

```bash
cd backend
node scripts/add-figma-properties.js
```

이 스크립트는:
1. `icons` 테이블에 `size`, `property` 컬럼 추가
2. `icon_versions` 테이블에 `size`, `property` 컬럼 추가
3. 기존 데이터에 기본값 설정 (size='24', property='outline')
4. 인덱스 추가

## API 수정

`/api/icons/from-figma` 엔드포인트가 이미 수정되어 `size`와 `property`를 받아서 저장합니다.

요청 예시:
```json
{
  "name": "arrow-right",
  "svg": "<svg>...</svg>",
  "size": "24",
  "property": "outline",
  "tags": [],
  "category": null
}
```

## npm 패키지에서 사용

```tsx
import { Icon } from '@fornerds/icon';

// 피그마와 동일한 방식으로 사용
<Icon name="arrow-right" size={24} property="outline" />
<Icon name="arrow-right" size={16} property="fill" />
```

## 마이그레이션 전략

1. ✅ 데이터베이스 스키마 업데이트 (마이그레이션 스크립트 실행)
2. ✅ 백엔드 API 수정 완료
3. 🔄 npm 패키지 빌드 스크립트 수정 (진행 중)
4. 🔄 Icon 컴포넌트 수정 (진행 중)
5. 📝 피그마 플러그인 구현 (참고 코드 제공됨)


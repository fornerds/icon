# @fornerds/icon

Fornerds 아이콘 라이브러리

## 설치

```bash
npm install @fornerds/icon
```

## 사용법

피그마 방식으로 하나의 `Icon` 컴포넌트에 `name`, `size`, `property` props로 아이콘을 지정합니다:

```tsx
import { Icon } from '@fornerds/icon';

function App() {
  return (
    <div>
      {/* 기본 사용 (size=24, property=outline) */}
      <Icon name="arrow-right" />
      
      {/* size 지정 */}
      <Icon name="arrow-right" size="24" />
      <Icon name="arrow-right" size="16" />
      
      {/* size와 property 모두 지정 */}
      <Icon name="arrow-right" size="24" property="outline" />
      <Icon name="arrow-right" size="16" property="fill" />
      
      {/* 추가 스타일링 */}
      <Icon name="arrow-right" size="32" property="outline" color="#3182f6" />
    </div>
  );
}
```

## Props

- `name`: 아이콘 이름 (기본 이름, 예: "arrow-right", "home") - **필수**
- `size`: 아이콘 크기 (예: "16", "24", "32") - 선택, 기본값: "24"
- `property`: 아이콘 스타일 (예: "outline", "fill") - 선택, 기본값: "outline"
- `color`: 아이콘 색상 (CSS 색상 값)
- `className`: CSS 클래스명
- `style`: 인라인 스타일

## 피그마 방식 지원

이 패키지는 피그마의 컴포넌트 변수 방식과 동일하게 동작합니다:

- **피그마**: 하나의 컴포넌트에서 Size, Property 등의 변수로 여러 아이콘을 구분
- **이 패키지**: 하나의 `Icon` 컴포넌트에 `name`, `size`, `property` props로 아이콘을 지정
- 피그마에서 사용한 Size와 Property 값을 그대로 사용할 수 있습니다

### 예시

피그마에서 다음과 같이 설정된 아이콘이 있다면:
- 컴포넌트 이름: "Icon"
- Size 변수: "16", "24", "32"
- Property 변수: "outline", "fill"

npm 패키지에서는 다음과 같이 사용:
```tsx
<Icon name="arrow-right" size="24" property="outline" />
<Icon name="arrow-right" size="16" property="fill" />
```

피그마에서 읽은 Size와 Property 값을 그대로 `size`와 `property` props에 전달하면 됩니다.

## 라이센스

MIT



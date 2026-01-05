# @fornerds/icon npm 패키지 배포 가이드

## 사전 준비

### 1. npm 계정 준비
- npm 공개 레지스트리에 배포하려면 npm 계정이 필요합니다
- [npmjs.com](https://www.npmjs.com)에서 계정 생성
- 로컬에서 npm 로그인: `npm login`

### 2. 스코프 설정 (선택사항)
- `@fornerds` 스코프를 사용하려면 npm 조직을 생성하거나 개인 계정으로 사용 가능
- 또는 `fornerds-icon` 같은 이름으로 변경 가능

## 배포 전 확인사항

### 1. 백엔드 API 확인
- 배포된 백엔드 URL이 올바른지 확인: `https://fornerds-icon-backend.vercel.app/api/icons/export/build`
- 아이콘 데이터가 있는지 확인

### 2. 빌드 실행
```bash
cd packages/icon-package
npm run build
```

### 3. package.json 확인
- 버전 번호 확인 (`version`)
- 패키지 이름 확인 (`name`)
- `files` 필드에 `dist` 폴더가 포함되어 있는지 확인

## 배포 단계

### 1. 빌드 실행
```bash
cd packages/icon-package
npm run build
```

### 2. 배포 전 테스트 (선택사항)
```bash
# 로컬에서 테스트
npm pack
# 생성된 .tgz 파일을 다른 프로젝트에서 설치하여 테스트
```

### 3. npm 배포
```bash
# 공개 배포
npm publish --access public

# 또는 스코프가 이미 설정되어 있다면
npm publish
```

### 4. 배포 확인
- [npmjs.com/@fornerds/icon](https://www.npmjs.com/package/@fornerds/icon)에서 확인
- 다른 프로젝트에서 설치 테스트:
  ```bash
  npm install @fornerds/icon
  ```

## 버전 업데이트

새 버전을 배포할 때:

```bash
# 패치 버전 (1.0.0 -> 1.0.1)
npm version patch

# 마이너 버전 (1.0.0 -> 1.1.0)
npm version minor

# 메이저 버전 (1.0.0 -> 2.0.0)
npm version major

# 빌드 및 배포
npm run build
npm publish --access public
```

## 문제 해결

### 빌드 실패
- 백엔드 API가 정상 작동하는지 확인
- 네트워크 연결 확인
- `API_URL` 환경 변수로 다른 URL 지정 가능:
  ```bash
  API_URL=https://fornerds-icon-backend.vercel.app/api/icons/export/build npm run build
  ```

### 배포 실패
- npm 로그인 상태 확인: `npm whoami`
- 패키지 이름 중복 확인
- 버전 번호가 이전 버전보다 높은지 확인

## 사용 예시

배포 후 다른 프로젝트에서 사용:

```bash
npm install @fornerds/icon
```

```tsx
import { ArrowRight, Search, Home } from '@fornerds/icon';

function App() {
  return (
    <div>
      <ArrowRight size={24} color="#3182f6" />
      <Search size={32} />
      <Home size={16} color="#000" />
    </div>
  );
}
```



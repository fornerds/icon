# Fornerds Icon System

아이콘 단일 소스 관리 시스템 - Figma에서 npm 패키지까지 완전한 워크플로우

## 프로젝트 구조

```
icon/
├── packages/
│   ├── icon-package/    # npm 패키지 (@fornerds/icon)
│   ├── figma-plugin/    # Figma Plugin
│   ├── admin/           # Admin Web (관리자 페이지)
│   └── landing/         # Landing Page (공개 페이지)
├── backend/             # Backend API (Express + PostgreSQL)
│   └── api/             # Vercel Serverless Functions
└── architect.md         # 아키텍처 문서
```

## 배포

이 프로젝트는 **Neon DB**와 **Vercel**을 사용하여 배포됩니다.

자세한 배포 가이드는 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)를 참고하세요.

### 빠른 배포

1. **Neon DB 설정** → https://neon.tech
2. **Backend 배포** → `cd backend && vercel`
3. **Admin 배포** → `cd packages/admin && vercel`
4. **Landing 배포** → `cd packages/landing && vercel`

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

각 패키지별로도 설치가 필요합니다:
```bash
cd backend && npm install
cd ../packages/admin && npm install
cd ../packages/landing && npm install
cd ../packages/icon-package && npm install
cd ../packages/figma-plugin && npm install
```

### 2. PostgreSQL 데이터베이스 설정

**무료 PostgreSQL 옵션:**
- **Supabase** (https://supabase.com) - 무료 티어 제공
- **Neon** (https://neon.tech) - 무료 티어 제공
- **Railway** (https://railway.app) - 무료 크레딧 제공
- 로컬 PostgreSQL 설치

**로컬 PostgreSQL 설치 (macOS):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb fornerds_icon
```

### 3. 환경 변수 설정

Backend `.env` 파일 생성:
```bash
cd backend
cp .env.example .env
```

`.env` 파일 내용:
```
# PostgreSQL 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=fornerds_icon
DB_SSL=false

# 기본 관리자 계정 설정 (마이그레이션 시 생성됨)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@fornerds.com
ADMIN_PASSWORD=ChangeThisPassword123!

JWT_SECRET=your_jwt_secret_key_here
API_TOKEN=your_figma_api_token_here
PORT=3001
```

**중요**: `ADMIN_PASSWORD`를 안전한 비밀번호로 변경하세요!

### 4. 데이터베이스 마이그레이션

마이그레이션을 실행하면 테이블과 기본 관리자 계정이 생성됩니다:

```bash
cd backend
npm run migrate
```

마이그레이션 완료 후 콘솔에 기본 계정 정보가 표시됩니다. **첫 로그인 후 반드시 비밀번호를 변경하세요!**

### 4. 서버 실행

#### Backend API
```bash
npm run dev:backend
# 또는
cd backend && npm run dev
```

#### Admin Web (포트 3002)
```bash
npm run dev:admin
# 또는
cd packages/admin && npm run dev
```

#### Landing Page (포트 3003)
```bash
npm run dev:landing
# 또는
cd packages/landing && npm run dev
```

## 주요 기능

### Backend API
- RESTful API로 아이콘 CRUD 처리
- 버전 관리 및 변경 이력 추적
- Soft Delete 및 Deprecated 지원
- Figma Plugin 전용 API 엔드포인트

### Admin Web
- 아이콘 생성, 수정, 삭제
- 버전 이력 조회
- Soft Delete / Restore / Deprecated 관리
- 다양한 사이즈 프리뷰
- React Component 및 Raw SVG 스니펫 제공

### Landing Page
- 공개 아이콘 갤러리
- 검색 및 필터링
- 아이콘 상세 페이지
- 코드 스니펫 복사 기능

### Figma Plugin
- Figma에서 직접 아이콘 추출
- SVG 자동 변환
- 서버로 직접 업로드
- 태그 및 카테고리 설정

### npm 패키지
- React 컴포넌트 자동 생성
- TypeScript 타입 정의 포함
- 트리 쉐이킹 지원

## npm 패키지 빌드

```bash
cd packages/icon-package
npm run build
```

빌드 스크립트는 Backend API에서 아이콘 데이터를 가져와 React 컴포넌트를 자동 생성합니다.

## Figma Plugin 설치

1. `packages/figma-plugin` 디렉토리에서 빌드:
```bash
npm run build
```

2. Figma Desktop 앱에서:
   - Plugins → Development → Import plugin from manifest...
   - `packages/figma-plugin/dist/manifest.json` 선택

3. 플러그인 사용:
   - 아이콘 선택
   - Plugins → Development → Fornerds Icon Uploader 실행
   - 정보 입력 후 업로드

## API 엔드포인트

- `GET /api/icons` - 아이콘 목록
- `GET /api/icons/:id` - 아이콘 상세
- `GET /api/icons/:id/history` - 변경 이력
- `POST /api/icons` - 아이콘 생성 (인증 필요)
- `PATCH /api/icons/:id` - 아이콘 수정 (인증 필요)
- `DELETE /api/icons/:id` - Soft Delete (인증 필요)
- `PATCH /api/icons/:id/restore` - 복원 (인증 필요)
- `PATCH /api/icons/:id/deprecate` - Deprecated 처리 (인증 필요)
- `POST /api/icons/from-figma` - Figma Plugin 전용 (API Token 필요)
- `GET /api/icons/export/build` - npm 빌드용 데이터

## 디자인

Toss 스타일의 깔끔하고 모던한 디자인을 적용했습니다:
- 미니멀한 UI
- 부드러운 애니메이션
- 일관된 색상 팔레트
- 반응형 디자인

## 라이센스

MIT

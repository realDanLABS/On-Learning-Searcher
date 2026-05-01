# On Learning Searcher 운영형 백엔드/DB/인증 가이드

## 개요

이 프로젝트는 기존 `localStorage` 기반 데모 구조 위에 운영형 서버 골격을 추가했습니다.

- 프론트엔드: Next.js App Router + React
- 백엔드: Node HTTP 서버 + 공용 API 핸들러
- DB: Supabase Postgres
- 인증: 서버 세션 + HttpOnly 쿠키

## 현재 추가된 서버 기능

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/logout`
- `GET /auth/session`
- `PUT /profile`
- `GET/POST /diagnosis`
- `GET /diagnosis/history`
- `GET /recommendations`
- `POST /recommendations/select`
- `GET /selected-course`
- `GET/POST /enrollments`
- `GET /journey/events`
- `GET /journey/stage`
- `POST /chatbot/reply`
- 관리자 API
  - `GET /admin/dashboard`
  - `GET /admin/departments`
  - `GET/POST/PUT/DELETE /admin/questions`
  - `GET /admin/courses`
  - `GET /admin/courses/catalog`
  - `POST/PUT/DELETE /admin/courses`
  - `GET/PUT/DELETE /admin/users`
  - `GET /admin/boards`
  - `POST/PUT/DELETE /admin/notices`
  - `POST/PUT/DELETE /admin/faqs`

## 기본 관리자 계정

- 사원번호: `90000`
- 비밀번호: `admin1234!`

## 로컬 개발

### 1. API 서버 실행

```bash
npm run server
```

기본 주소:

- [http://127.0.0.1:8787](http://127.0.0.1:8787)

### 2. 프론트 개발 서버 실행

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 npm run dev
```

프론트 주소:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

이 모드에서는:

- 프론트는 Next.js 개발 서버
- API/DB/세션은 8787 서버

## 한 서버로 운영/시연 실행

### 1. 프론트 빌드

```bash
npm run build:remote
```

### 2. 앱 서버 실행

```bash
npm run server
```

이 경우 `dist` 정적 파일과 API가 모두 같은 서버에서 서빙됩니다.

접속 주소:

- [http://127.0.0.1:8787](http://127.0.0.1:8787)

즉, 학습자 페이지와 관리자 페이지가 같은 서버에서 함께 동작합니다.

## 주의 사항

현재 구조는 운영형 골격이지만, 아래 항목은 다음 단계 고도화 대상입니다.

- 비밀번호 정책 강화
- 감사 로그 서버 저장 확대
- 권한별 세분화 정책
- 관리자 시스템 설정 페이지의 서버 영속화 확대
- 외부 SSO 연동
- 배포 환경 시크릿/쿠키 보안 설정 강화

## 추천 다음 단계

1. 운영 DB를 Postgres로 전환
2. 배포 플랫폼(Vercel 프론트 + 별도 API, 또는 단일 Node 호스팅) 결정
3. 관리자 시스템 설정 페이지의 스냅샷/초기화 기능을 DB 기준으로 이관
4. 운영용 백업/복구 정책 수립

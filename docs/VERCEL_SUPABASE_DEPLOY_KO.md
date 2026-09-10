# Vercel + Supabase 배포 가이드

## 구조

- 프론트엔드: Vercel
- API: Vercel Functions (`/api/*`)
- DB: Supabase Postgres
- 인증: 앱 세션 + HttpOnly 쿠키

## 필요한 환경 변수

### Vercel

- `NEXT_PUBLIC_API_BASE_URL=/api`
- `SUPABASE_DB_URL=<Supabase pooled connection string>`

권장:

- Supabase의 pooled connection string 사용
- transaction pool/Supavisor 연결 문자열 사용

## Supabase 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 [schema.sql](/Users/daniel/내%20작업/내%20프로젝트/Vibe%20Coding/On_Learning_Searcher/supabase/schema.sql) 실행
3. Connection string 복사
4. Vercel 환경 변수 `SUPABASE_DB_URL`로 등록

## Vercel 배포

1. 프로젝트 import
2. Framework preset: Next.js
3. Root Directory: 프로젝트 루트
4. Environment Variables 등록
5. Deploy

## 로컬 개발

### 프론트 + 로컬 Node API

```bash
NEXT_PUBLIC_API_BASE_URL=/api npm run dev
npm run server
```

루트 앱은 Next.js App Router 기준이며, 기본 API 경로는 same-origin `/api`입니다. 원격 mock 리허설처럼 별도 API를 붙일 때만 `NEXT_PUBLIC_API_BASE_URL`을 절대 경로로 지정하면 됩니다.

### Vercel 배포 모드와 같은 빌드 확인

```bash
npm run build:remote
```

## 기본 관리자 계정

- 사원번호: `90000`
- 비밀번호: `local-dev-only`

## 주의

- 현재는 Supabase Auth가 아니라 앱 자체 세션 방식입니다.
- 즉, Supabase는 현재 DB 역할을 맡습니다.
- 다음 단계로 원하면 Supabase Auth 연동까지 확장할 수 있습니다.

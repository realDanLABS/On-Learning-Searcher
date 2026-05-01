# On Learning Searcher Stitch 구현 명세

## 목적

Google Stitch에서 생성된 `On Learning Searcher Enterprise` 시안을 현재 Next.js 코드베이스에 무리 없이 반영하기 위한 구현 기준 문서다.

목표는 다음과 같다.

1. 현재 정보구조와 데이터 흐름 유지
2. 사용자용 화면과 관리자용 화면을 하나의 공통 시스템으로 재정렬
3. Stitch 시안의 엔터프라이즈 SaaS 톤을 실제 구현 가능한 토큰과 컴포넌트 단위로 변환
4. 한 번에 전체 페이지를 갈아엎지 않고, 핵심 화면부터 점진 반영

## Stitch 시안 해석

현재 Stitch 1차 결과에서 읽히는 핵심 방향은 다음과 같다.

### 1. 시각 톤

- 과장된 마케팅 랜딩 톤이 아니라 운영형 B2B 제품 톤
- 배경은 밝고 중성적인 캔버스
- 카드와 패널은 얕은 음영, 낮은 대비의 선, 높은 정렬 밀도
- 정보 우선형 레이아웃

### 2. 1차 토큰

Stitch 결과 화면에서 직접 읽힌 토큰:

- `Primary`: `#0F172A`
- `Secondary`: `#2563EB`
- `Tertiary`: `#231500`
- `Neutral`: `#64748B`
- `Typography`: `Inter`

구현 시 해석:

- `Primary`는 제목/핵심 본문/주요 버튼 텍스트 기준색
- `Secondary`는 액션, 강조 배지, 링크, 활성 상태 기준색
- `Tertiary`는 포인트 색으로 제한 사용
- `Neutral`은 보조 텍스트, 아이콘, 비활성 상태 기준색

### 3. 컴포넌트 방향

- 버튼 타입 명확화: `Primary`, `Secondary`, `Inverted`, `Outlined`
- 검색 입력창, 카드, 필터, 데이터 패널을 공통 컴포넌트로 통일
- 관리자 화면은 표/상태/필터가 강한 밀도형 UI
- 사용자 화면은 카드 중심이되 과도한 장식 없이 정돈된 정보 구조

## 현재 코드베이스 매핑

### 사용자 핵심 화면

- 홈: [components/home-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/home-screen.tsx)
- 추천 과정: [components/recommendation-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/recommendation-screen.tsx)
- 학습 경로: [components/learning-path-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/learning-path-screen.tsx)
- 학습 이력: [components/history-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/history-screen.tsx)
- 진단/결과/챗봇/플랫폼 소개: `components/*-screen.tsx`

### 관리자 핵심 화면

- 통합 관리자: [components/admin-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/admin-screen.tsx)
- 과정 관리 업로드: [components/admin-course-management-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/admin-course-management-screen.tsx)
- 부서 분석: [components/admin-departments-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/admin-departments-screen.tsx)

### 공통 스타일 진입점

- 전역 스타일: [app/globals.css](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/app/globals.css)

## 반영 원칙

### 유지

- 라우트 구조
- 인증 흐름
- Supabase/백엔드 연동 방식
- 기존 문구와 기능
- 화면별 데이터 구조

### 교체

- 색상 체계
- 타이포 위계
- 카드/필터/표/배지/버튼 외형
- 헤더/페이지 타이틀/요약 패널 구조
- 관리자 정보 밀도와 정렬 방식

## 구현 토큰 초안

현재 `app/globals.css`의 블루 계열을 Stitch 기준으로 재정렬한다.

### 색상

- `--text-strong`: `#0F172A`
- `--text`: `#1E293B`
- `--text-muted`: `#64748B`
- `--primary`: `#2563EB`
- `--primary-strong`: `#1D4ED8`
- `--surface`: `rgba(255,255,255,0.94)`
- `--surface-raised`: `#FFFFFF`
- `--surface-muted`: `#F8FAFC`
- `--line`: `#E2E8F0`
- `--line-strong`: `#CBD5E1`
- `--bg`: `#F8FAFC`

### 그림자

- 카드 그림자는 현재보다 얕게 조정
- 큰 퍼짐형 블러 대신 `0 10px 30px rgba(15, 23, 42, 0.08)` 수준으로 축소

### 모서리

- 카드/패널: `16px`
- 입력/필터/버튼: `12px~14px`

### 타이포

- 현재 한국어 폰트 스택 유지
- 영문 숫자 계열 느낌은 Stitch의 `Inter` 위계 참고
- 제목은 더 무겁고, 본문은 더 중립적으로 정리

## 공통 컴포넌트 개편 항목

### 1. 버튼

공통 버튼 계층 4종으로 통일:

- `button-primary`
- `button-secondary`
- `button-outlined`
- `button-ghost`

### 2. 카드

공통 카드 계층:

- 요약 카드
- 데이터 카드
- 추천 카드
- 관리자 표 카드

### 3. 필터/폼

- 선택 상태 대비 강화
- 드롭다운, 검색, 체크/라디오를 동일한 외형 규칙으로 통일
- 관리자 폼은 라벨, 힌트, 액션 버튼 정렬을 더 엄격하게

### 4. 상태 배지

현재 페이지마다 다른 상태 표현을 다음 계열로 고정:

- `info`
- `success`
- `warning`
- `neutral`
- `danger`

### 5. 페이지 헤더

공통 구조:

- 페이지 타이틀
- 짧은 설명
- 우측 액션 또는 요약 메타

## 페이지별 구현 순서

### 1단계: 공통 시스템

대상:

- `app/globals.css`
- 공통 헤더/푸터/버튼/입력/배지 계층

결과:

- 전체 페이지에 기본 톤이 깔림
- 이후 개별 페이지 수정량 감소

### 2단계: 사용자 핵심 3페이지

대상:

- 홈
- 추천 과정
- 학습 경로

반영 포인트:

- 요약 카드 재정렬
- 추천 카드 시각 체계 통일
- 필터/검색/정렬 정비
- 페이지 헤더와 CTA 정리

### 3단계: 관리자 핵심 3페이지

대상:

- 관리자 대시보드
- 관리자 과정 관리
- 관리자 회원 관리

반영 포인트:

- 데이터 테이블 밀도 최적화
- 업로드/내보내기 액션의 계층 정리
- 상태 배지, 필터, 섹션 그룹 구조 정돈

### 4단계: 분석/이력/진단 확장

대상:

- 학습 이력
- 분석 대시보드
- 진단 / 진단 결과

반영 포인트:

- 차트/막대/진행 상태 UI 통일
- 데이터 서머리 카드 계층 일치

### 5단계: 나머지 페이지 및 QA

대상:

- 챗봇
- 플랫폼 소개
- 공지/FAQ
- 설정
- 반응형 보정

반영 포인트:

- 모바일/데스크톱 간 위계 유지
- 버튼, 텍스트, 표, 카드 overflow 점검

## 병렬 작업 분해 기준

동시에 진행할 수 있는 작업 단위:

1. 공통 스타일 시스템
2. 사용자 3페이지
3. 관리자 3페이지
4. 분석/이력/진단
5. QA 및 반응형

단, `app/globals.css`와 공통 UI 클래스는 충돌 가능성이 높으므로 먼저 기준안을 만든 뒤 병렬 적용이 안전하다.

## 리스크

### 1. 현재 페이지별 스타일 방식 혼재

- 일부는 전역 CSS 중심
- 일부는 인라인 스타일
- 일부는 Stitch 유산 클래스 기반

대응:

- 먼저 공통 변수와 공통 클래스부터 정리
- 인라인 스타일이 많은 관리자 페이지는 2차로 정리

### 2. 디자인은 바뀌되 문구/기능은 유지해야 함

대응:

- JSX 구조 변경 시 텍스트 키와 라우트는 그대로 유지
- 데이터 fetch 로직과 이벤트 핸들러는 건드리지 않음

### 3. 관리자 테이블과 실제 데이터 밀도

대응:

- 관리자 화면은 예쁜 카드형보다 운영형 정보 밀도 우선

## 즉시 구현 시작점

가장 먼저 수정할 파일:

1. [app/globals.css](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/app/globals.css)
2. [components/home-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/home-screen.tsx)
3. [components/recommendation-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/recommendation-screen.tsx)
4. [components/learning-path-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/learning-path-screen.tsx)
5. [components/admin-screen.tsx](/Users/berkley/Library/CloudStorage/Dropbox/projects/On%20Learning%20Searcher/components/admin-screen.tsx)

## 완료 기준

다음 조건을 만족하면 Stitch 1차 시안 반영이 성공한 것으로 본다.

1. 홈 / 추천 / 학습경로 / 관리자 대시보드가 같은 제품군처럼 보일 것
2. 색상/타이포/버튼/배지/카드 규칙이 통일될 것
3. 관리자 화면이 더 전문적이되 데이터 사용성은 떨어지지 않을 것
4. 기존 데이터 흐름과 라우팅이 유지될 것
5. `npm run lint`와 `npm run build`를 통과할 것

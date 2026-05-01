# Foundation Recovery Brief (2026-03-08)

## 목적
- `main`에 누적된 변경 중 foundation 소유 범위만 `worktrees/foundation`으로 선별 회수한다.
- 구현 복사본 이관이 아니라, 공통 헤더 / 진입·가드 / 홈 이어가기 / 공통 여정 액션 / foundation 범위 인증·프로필 연동만 환원한다.

## 회수 후보 파일
- `src/router/AppRouter.tsx`
- `src/router/HomePage.tsx`
- `src/router/StageGuard.tsx`
- `src/router/routeConfig.ts`
- `src/shared/layouts/AppShell.tsx`
- `src/shared/components/JourneyActionBar.tsx`
- `src/shared/components/JourneyFlowGuide.tsx`
- `src/shared/components/JourneyProgressPanel.tsx`
- `src/shared/api/authApi.ts`
- `src/shared/api/profileApi.ts`
- `src/shared/state/profile.ts`

## 확인 결과
- 위 11개 파일은 모두 `main` 대비 `worktrees/foundation`에 diff가 존재한다.
- 대량 변경은 `HomePage.tsx`, `AppShell.tsx`, `AppRouter.tsx`에 집중되어 있다.
- 공통 파일 내부에 관리자 direct-dev track 관련 hunk가 섞여 있어 통째 복사 금지 원칙을 반드시 적용해야 한다.

## 선별 회수 기준
- 포함:
  - 페이지별로 달라지지 않는 공통 헤더 구조와 스타일
  - 로그인/회원가입 포함 공통 헤더 진입선
  - 홈 이어가기 진입과 공통 여정 액션 영역
  - foundation 범위의 인증 세션 동기화와 프로필 상태 연동
  - 공통 라우팅/가드 중 foundation가 선소유해야 하는 계약
- 제외:
  - 관리자 direct-dev track 전용 라우트와 관리자 허브 연결
  - diagnosis 결과 상세, recommendation 상세, history analytics 자체 구현
  - 타 워크트리 전용 비즈니스 로직
  - 홈 메인 카피 변경

## 공통 충돌 메모
- `src/router/AppRouter.tsx`
  - `/login`, `/signup` 진입은 foundation 범위 검토 대상이다.
  - `/admin*`, `/analytics`, 타 워크트리 상세 페이지 직결 라우트는 이번 회수에서 제외한다.
- `src/shared/layouts/AppShell.tsx`
  - 공통 헤더/탑바/인증 버튼 일관성은 foundation 우선 소유다.
  - `관리자` 탑네비 노출, `mode='admin'` 중심 분기는 direct-dev track과 충돌 가능성이 있어 선별 적용이 필요하다.
- `src/router/HomePage.tsx`
  - 실제 추천 과정 수, 실제 역량 변화값, 공지/FAQ 연결 상태 유지가 핵심이다.
  - 메인 카피는 변경하지 않는다.
  - Stitch/시각 재구성 성격이 강한 hunk는 responsive 소유 범위와 섞이지 않게 분리한다.

## foundation -> 후속 워크트리 계약
- `diagnosis`
  - `StageGuard`와 홈 이어가기에서 기대하는 진입 단계 값은 foundation에서 먼저 고정한다.
- `recommendation`
  - 홈에서 소비하는 추천 과정 개수와 이어가기 진입 경로는 foundation 계약을 깨지 않는 범위에서만 확장한다.
- `course-linking`
  - 공통 액션 바에서 외부 신청/복귀 상태를 직접 소유하지 말고, foundation은 진입 슬롯만 유지한다.
- `history`
  - 홈의 역량 변화값은 실제 진단 이력 기반 수치만 연결하고 운영 분석 확장은 history가 소유한다.
- `responsive`
  - 헤더 구조와 행동 계약은 foundation 우선, 스타일 미세조정은 후행한다.

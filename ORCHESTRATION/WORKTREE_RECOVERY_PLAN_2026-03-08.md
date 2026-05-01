# Worktree Recovery Plan (2026-03-08)

## 목적
- 현재 최우선 원칙은 `main` 직접 구현을 멈추고 병렬 워크트리 구조를 복구하는 것이다.
- 이 문서는 메인 워크트리에 누적된 구현 변경을 워크트리별 작업 묶음으로 다시 분해하기 위한 오케스트레이터 기준 문서다.

## 현재 사실관계
- 확인 시각: 2026-03-08
- `git worktree list` 기준 활성 워크트리 7개 모두 정상 연결
- 모든 워크트리는 `6770fd3` 기준으로 `ahead 0 / behind 0 / dirty NO`
- 모든 워크트리는 첫 기능 커밋이 아직 없음
- `ORCHESTRATION/WAVE2_*` 산출물은 2026-03-08 기준으로 재생성 완료
- 반면 `main` 워크트리에는 구현 변경이 대량 누적되어 있어, 현 상태로는 병렬 구조보다 단일 워크트리 드리프트가 더 큰 위험이다

## 운영 원칙
1. `main`에서 직접 추가 구현하지 않는다.
2. `main` 변경분을 통째로 머지하거나 전체 복사하지 않는다.
3. 기능 회수는 반드시 워크트리 단위로 나눈다.
4. 공통 계약 변경은 `foundation` 또는 계약 문서에서 먼저 확정하고, 하위 워크트리는 그 계약만 소비한다.
5. 각 워크트리는 "첫 기능 커밋 1개 + 체크인 최신화"를 첫 목표로 둔다.

## 즉시 리스크
1. 메인 구현이 계속 누적되면 워크트리 브랜치가 실질적으로 무력화된다.
2. `diagnosis -> recommendation -> course-linking -> history -> chatbot` 계약이 코드상으로는 이미 섞여 있을 가능성이 높다.
3. 반응형 보정과 Stitch 런타임 변경이 기능 변경과 섞여 있으면 마지막 QA 단계가 아니라 선행 충돌 요인이 된다.

## 워크트리별 회수 대상

### 1. foundation
- 우선 회수 파일:
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
- 회수 목적:
  - 공통 헤더, 진입/가드, 홈 이어가기, 여정 공통 액션을 foundation으로 환원

### 2. diagnosis
- 우선 회수 파일:
  - `src/features/diagnosis/pages/DiagnosisPage.tsx`
  - `src/features/diagnosis/pages/DiagnosisResultsPage.tsx`
  - `src/features/diagnosis/diagnosisResult.ts`
  - `src/features/diagnosis/questions.ts`
  - `src/shared/orchestration/skillGap.ts`
  - `src/shared/orchestration/skillGap.test.ts`
  - `src/shared/state/questionBank.ts`
- 회수 목적:
  - 질문 구조, 결과 스냅샷, 갭 계산, 결과 계약을 diagnosis로 분리

### 3. recommendation
- 우선 회수 파일:
  - `src/features/recommendation/pages/RecommendationPage.tsx`
  - `src/features/recommendation/pages/LearningPathPage.tsx`
  - `src/shared/api/learningApi.ts`
  - `src/shared/api/learningApi.test.ts`
  - `src/shared/state/learningFlow.ts`
  - `src/shared/state/learningFlow.test.ts`
- 회수 목적:
  - 추천 카드, 추천 이유, 학습경로, 저장/이어가기 흐름을 recommendation 중심으로 정리

### 4. course-linking
- 우선 회수 파일:
  - `src/features/course-linking/pages/CourseLinkingPage.tsx`
  - `src/shared/api/learningApi.ts`
  - `src/shared/state/learningFlow.ts`
- 회수 목적:
  - 신청 상태, 외부 이동, 복귀 처리, 추천 과정 수강 완료 흐름을 독립 회수
- 주의:
  - `learningApi.ts`, `learningFlow.ts`는 recommendation과 경계가 겹치므로 계약 먼저 분리 후 회수

### 5. history
- 우선 회수 파일:
  - `src/features/history/pages/HistoryPage.tsx`
  - `src/features/history/pages/AdminPage.tsx`
  - `src/features/history/pages/AnalyticsPage.tsx`
  - `src/shared/orchestration/fullJourney.test.ts`
  - `src/shared/observability/funnel.test.ts`
  - `src/shared/state/boards.ts`
- 회수 목적:
  - 성장 추적, 추천 과정 이력, 관리자 허브/운영분석, 퍼널 검증을 history 축으로 정리

### 6. chatbot
- 우선 회수 파일:
  - `src/features/chatbot/pages/ChatbotPage.tsx`
  - `src/shared/api/chatbotApi.ts`
- 회수 목적:
  - 현재 사용자 상태 기반 상담, 빠른 질문, 다음 액션 유도 로직을 별도 브랜치로 회수

### 7. responsive
- 우선 회수 파일:
  - `src/styles/global.css`
  - `src/shared/components/StitchFrame.tsx`
  - `src/shared/stitch/*`
  - `public/stitch-runtime/*`
  - `public/brand/*`
- 회수 목적:
  - Stitch 런타임, 반응형, 공통 스타일 보정을 마지막 QA 트랙으로 분리
- 주의:
  - 기능 로직이 섞인 스타일 변경은 원소유 워크트리에서 먼저 정리한 뒤 responsive가 후속 보정

## 회수 순서
1. foundation
2. diagnosis
3. recommendation
4. course-linking
5. history
6. chatbot
7. responsive

## 이번 사이클의 오케스트레이터 액션
1. `foundation`, `diagnosis`, `recommendation`에 첫 커밋 유도 메시지를 우선 하달
2. 각 워크트리 체크인을 2026-03-08 기준으로 최신화
3. 메인 변경분은 "회수 대상 파일 목록" 기준으로만 가져가고, 워크트리 범위 밖 파일은 제외
4. 각 워크트리 첫 커밋 후 `bash scripts/orchestrator-wave2-command-center.sh quick` 재실행

## 완료 판정
- 각 워크트리에서 최소 1개 기능 커밋이 생성됨
- 체크인 stale 상태가 해소됨
- 메인에서 직접 구현해야 하는 파일이 더 이상 증가하지 않음
- 머지 준비도 문서에서 `ahead > 0` 워크트리가 순차적으로 생기기 시작함

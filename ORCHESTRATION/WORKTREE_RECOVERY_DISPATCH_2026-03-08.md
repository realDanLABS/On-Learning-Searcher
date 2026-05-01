# Worktree Recovery Dispatch (2026-03-08)

이 문서는 `WORKTREE_RECOVERY_PLAN_2026-03-08.md` 기준의 워크트리별 복붙 하달문 고정본이다.
자동 생성되는 `WAVE2_*` 산출물과 별개로, 이번 recovery 사이클에서는 이 문서만 복붙 기준으로 사용한다.

## 1차 발송 우선순위
1. foundation
2. diagnosis
3. recommendation

## 2차 발송 우선순위
4. course-linking
5. history
6. chatbot

## 3차 발송 우선순위
7. responsive

---

## foundation

```text
[foundation 워크트리 하달]

기준 문서:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md

이번 작업은 main 직접 구현이 아니라, main에 누적된 변경 중 foundation 소유 범위만 worktrees/foundation으로 선별 회수하는 작업이다.

소유 범위:
- 공통 헤더
- 진입/가드
- 홈 이어가기
- 공통 여정 액션
- 공통 프로필/인증 연동의 foundation 범위

우선 회수 대상 파일:
- src/router/AppRouter.tsx
- src/router/HomePage.tsx
- src/router/StageGuard.tsx
- src/router/routeConfig.ts
- src/shared/layouts/AppShell.tsx
- src/shared/components/JourneyActionBar.tsx
- src/shared/components/JourneyFlowGuide.tsx
- src/shared/components/JourneyProgressPanel.tsx
- src/shared/api/authApi.ts
- src/shared/api/profileApi.ts
- src/shared/state/profile.ts

반드시 지킬 원칙:
1. main 변경분을 통째로 복사하지 말 것
2. foundation 소유 파일만 선별 회수할 것
3. 공통 파일 충돌 시 foundation가 우선 소유한다
4. 타 워크트리 소유 로직은 건드리지 말 것
5. 관리자 direct-dev track은 이번 회수 범위에 포함하지 말 것

컨텍스트 반영 포인트:
- 상단 헤더는 페이지마다 달라지면 안 된다
- 로그인/회원가입 포함 공통 헤더 스타일 일관성이 중요하다
- 홈은 실제 추천 과정 수, 실제 역량 변화값, 공지/FAQ 연결 상태를 유지해야 한다
- 홈 메인 카피는 변경하지 말 것

이번 사이클 완료조건:
- foundation 범위 첫 기능 커밋 1개 생성
- 체크인 updatedAt를 2026-03-08로 갱신
- progress 최소 20
- blockers 없으면 `없음`으로 명시

권장 커밋 메시지:
- feat(foundation): recover shared routing and journey shell from main drift

작업 후 오케스트레이터 보고 형식:
- 회수한 파일:
- 제외한 파일:
- 공통 충돌 여부:
- blockers:
- 다음 의존 워크트리에 전달할 계약/주의점:
```

## diagnosis

```text
[diagnosis 워크트리 하달]

기준 문서:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md

이번 작업은 main 직접 구현이 아니라, main에 누적된 변경 중 diagnosis 소유 범위만 worktrees/diagnosis로 선별 회수하는 작업이다.

소유 범위:
- 질문 구조
- 결과 스냅샷
- 갭 계산
- diagnosis 결과 계약

우선 회수 대상 파일:
- src/features/diagnosis/pages/DiagnosisPage.tsx
- src/features/diagnosis/pages/DiagnosisResultsPage.tsx
- src/features/diagnosis/diagnosisResult.ts
- src/features/diagnosis/questions.ts
- src/shared/orchestration/skillGap.ts
- src/shared/orchestration/skillGap.test.ts
- src/shared/state/questionBank.ts

반드시 지킬 원칙:
1. main 변경분을 통째로 복사하지 말 것
2. diagnosis 소유 파일만 선별 회수할 것
3. recommendation/history/chatbot이 소비할 결과 필드는 diagnosis에서 먼저 정리할 것
4. 공통 파일 수정이 필요하면 foundation 선반영 필요 여부를 먼저 표시할 것
5. 관리자 direct-dev track은 이번 회수 범위에 포함하지 말 것

컨텍스트 반영 포인트:
- 질문은 제조업 맥락의 20문항 객관식 기준 유지
- 선택지는 1x4 세로 배치 유지
- `응답 현황` 카드의 문구는 `진단 영역` 기준 유지
- 결과 페이지의 점수 상승률은 이전 진단과 실제 비교 기반이어야 한다
- `추천 과정 보러가기`는 `/recommendation` 연결 기준을 깨지 말 것

이번 사이클 완료조건:
- diagnosis 범위 첫 기능 커밋 1개 생성
- 체크인 updatedAt를 2026-03-08로 갱신
- progress 최소 20
- blockers 없으면 `없음`으로 명시

권장 커밋 메시지:
- feat(diagnosis): recover diagnosis snapshot and gap calculation from main drift

작업 후 오케스트레이터 보고 형식:
- 회수한 파일:
- 추가/정리한 결과 필드:
- recommendation/history/chatbot 영향:
- blockers:
- 다음 의존 워크트리에 전달할 계약/주의점:
```

## recommendation

```text
[recommendation 워크트리 하달]

기준 문서:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md

이번 작업은 main 직접 구현이 아니라, main에 누적된 변경 중 recommendation 소유 범위만 worktrees/recommendation으로 선별 회수하는 작업이다.

소유 범위:
- 추천 카드
- 추천 이유
- 학습 경로
- 저장/이어가기 흐름의 recommendation 범위

우선 회수 대상 파일:
- src/features/recommendation/pages/RecommendationPage.tsx
- src/features/recommendation/pages/LearningPathPage.tsx
- src/shared/api/learningApi.ts
- src/shared/api/learningApi.test.ts
- src/shared/state/learningFlow.ts
- src/shared/state/learningFlow.test.ts

반드시 지킬 원칙:
1. main 변경분을 통째로 복사하지 말 것
2. recommendation 소유 파일만 선별 회수할 것
3. course-linking과 경계가 겹치는 상태는 임의 확장하지 말고 경계만 표시할 것
4. 하단 고정 저장 바는 제거된 최종 상태를 유지할 것
5. 관리자 direct-dev track은 이번 회수 범위에 포함하지 말 것

컨텍스트 반영 포인트:
- 추천 과정은 실추천 데이터 기반이어야 한다
- 추천 이유 설명력이 중요하다
- 보조 섹션은 progressive disclosure 방향 유지
- 학습 경로 페이지는 하단 고정 바 없는 상태가 맞다
- 추천 카드/학습이력/현재 이어갈 학습은 상위 추천 3개 기준과 일관돼야 한다

이번 사이클 완료조건:
- recommendation 범위 첫 기능 커밋 1개 생성
- 체크인 updatedAt를 2026-03-08로 갱신
- progress 최소 20
- blockers 없으면 `없음`으로 명시

권장 커밋 메시지:
- feat(recommendation): recover recommendation flow and learning state from main drift

작업 후 오케스트레이터 보고 형식:
- 회수한 파일:
- course-linking과 경계가 겹치는 필드:
- 남은 의존성:
- blockers:
- 다음 의존 워크트리에 전달할 계약/주의점:
```

## course-linking

```text
[course-linking 워크트리 하달]

기준 문서:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md

이번 작업은 main 직접 구현이 아니라, main에 누적된 변경 중 course-linking 소유 범위만 worktrees/course-linking으로 선별 회수하는 작업이다.

소유 범위:
- 신청 상태
- 외부 이동
- 복귀 처리
- 추천 과정 수강 완료 흐름

우선 회수 대상 파일:
- src/features/course-linking/pages/CourseLinkingPage.tsx
- src/shared/api/learningApi.ts
- src/shared/state/learningFlow.ts

반드시 지킬 원칙:
1. main 변경분을 통째로 복사하지 말 것
2. course-linking 소유 범위만 선별 회수할 것
3. `learningApi.ts`, `learningFlow.ts`는 recommendation과 경계가 겹치므로 계약 먼저 분리하고 회수할 것
4. history 반영까지 한 번에 확장하지 말고 신청/복귀 상태 계약까지만 확정할 것
5. 관리자 direct-dev track은 이번 회수 범위에 포함하지 말 것

컨텍스트 반영 포인트:
- 버튼 문구는 `추천 과정 수강 완료` 기준 유지
- 이 상태는 나의 학습 이력의 `학습 추천 과정`과 연동되어야 한다
- 신청/예외 대응은 과도하게 복잡하게 다시 늘리지 말 것

이번 사이클 완료조건:
- course-linking 범위 첫 기능 커밋 1개 생성
- 체크인 updatedAt를 2026-03-08로 갱신
- progress 최소 20
- blockers 없으면 `없음`으로 명시

권장 커밋 메시지:
- feat(course-linking): recover enrollment return flow from main drift

작업 후 오케스트레이터 보고 형식:
- 회수한 파일:
- recommendation과 경계 분리한 상태 필드:
- history에 전달할 상태 계약:
- blockers:
- 다음 의존 워크트리에 전달할 계약/주의점:
```

## history

```text
[history 워크트리 하달]

기준 문서:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md

이번 작업은 main 직접 구현이 아니라, main에 누적된 변경 중 history 소유 범위만 worktrees/history로 선별 회수하는 작업이다.

소유 범위:
- 성장 추적
- 추천 과정 이력
- 운영 분석/퍼널 검증의 history 범위
- boards 상태의 history 소비 범위

우선 회수 대상 파일:
- src/features/history/pages/HistoryPage.tsx
- src/features/history/pages/AdminPage.tsx
- src/features/history/pages/AnalyticsPage.tsx
- src/shared/orchestration/fullJourney.test.ts
- src/shared/observability/funnel.test.ts
- src/shared/state/boards.ts

반드시 지킬 원칙:
1. main 변경분을 통째로 복사하지 말 것
2. history 소유 파일만 선별 회수할 것
3. 관리자 페이지 구현 축은 direct-dev track으로 취급하고, 여기서는 상태 기록 또는 소비 범위만 정리할 것
4. foundation 공통 파일이 필요하면 history에서 직접 소유하지 말 것
5. chatbot이 소비할 최신 요약 데이터는 history 기준으로 정리할 것

컨텍스트 반영 포인트:
- `역량 성장 변화`는 월별 더미가 아니라 영역별 점수 기반 그래프여야 한다
- 영역 막대는 연회색, `점수 종합`만 블루 강조 규칙 유지
- `학습 추천 과정`은 실제 추천 데이터여야 한다
- `현재 이어갈 학습` 사용자명은 로그인 사용자명 기준이어야 한다
- 버튼 문구는 `다음 학습 과정 추천 받기` 기준 유지
- 홈 공지/FAQ는 관리자 보드 데이터와 연결된 상태를 깨지 말 것

이번 사이클 완료조건:
- history 범위 첫 기능 커밋 1개 생성
- 체크인 updatedAt를 2026-03-08로 갱신
- progress 최소 20
- blockers 없으면 `없음`으로 명시

권장 커밋 메시지:
- feat(history): recover growth tracking and history dashboard from main drift

작업 후 오케스트레이터 보고 형식:
- 회수한 파일:
- chatbot에 전달할 최신 요약 데이터:
- direct-dev admin track과 겹치는 부분:
- blockers:
- 다음 의존 워크트리에 전달할 계약/주의점:
```

## chatbot

```text
[chatbot 워크트리 하달]

기준 문서:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md

이번 작업은 main 직접 구현이 아니라, main에 누적된 변경 중 chatbot 소유 범위만 worktrees/chatbot으로 선별 회수하는 작업이다.

소유 범위:
- 현재 사용자 상태 기반 상담
- 빠른 질문
- 다음 액션 유도 로직

우선 회수 대상 파일:
- src/features/chatbot/pages/ChatbotPage.tsx
- src/shared/api/chatbotApi.ts

반드시 지킬 원칙:
1. main 변경분을 통째로 복사하지 말 것
2. chatbot 소유 파일만 선별 회수할 것
3. 진단/추천/신청/이력 상태는 소비만 하고 원천 계약은 diagnosis/recommendation/course-linking/history에서 가져올 것
4. 공통 스타일 보정은 responsive 또는 foundation 충돌 여부를 먼저 표시할 것
5. 관리자 direct-dev track은 이번 회수 범위에 포함하지 말 것

컨텍스트 반영 포인트:
- 빠른 질문 버튼은 바로 답변 생성돼야 한다
- `준비중` alert로 되돌리면 안 된다
- 호칭은 `님` 기준 유지
- 오른쪽 패널은 실제 진단/추천 상태 기반이어야 한다
- 상담 종료 시 홈/추천/이력 등 다음 액션 유도가 있어야 한다

이번 사이클 완료조건:
- chatbot 범위 첫 기능 커밋 1개 생성
- 체크인 updatedAt를 2026-03-08로 갱신
- progress 최소 20
- blockers 없으면 `없음`으로 명시

권장 커밋 메시지:
- feat(chatbot): recover contextual guidance flow from main drift

작업 후 오케스트레이터 보고 형식:
- 회수한 파일:
- 소비 중인 upstream 상태:
- 다음 액션 유도 규칙:
- blockers:
- 남은 의존성:
```

## responsive

```text
[responsive 워크트리 하달]

기준 문서:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md

이번 작업은 main 직접 구현이 아니라, main에 누적된 변경 중 responsive 소유 범위만 worktrees/responsive로 선별 회수하는 작업이다.

소유 범위:
- Stitch 런타임 보정
- 반응형
- 공통 스타일 후속 보정

우선 회수 대상 파일:
- src/styles/global.css
- src/shared/components/StitchFrame.tsx
- src/shared/stitch/*
- public/stitch-runtime/*
- public/brand/*

반드시 지킬 원칙:
1. main 변경분을 통째로 복사하지 말 것
2. responsive 소유 파일만 선별 회수할 것
3. 기능 로직이 섞인 스타일 변경은 원소유 워크트리에서 먼저 정리한 뒤 responsive가 후속 보정할 것
4. foundation 공통 파일 충돌 시 foundation 우선 원칙을 따를 것
5. 관리자 direct-dev track은 기록만 하고 이번 워크트리 복구 우선순위를 넘지 말 것

컨텍스트 반영 포인트:
- Stitch 원본 디자인 유지가 최우선이다
- iframe + runtime bridge 구조를 깨지 말 것
- 페이지별 상단 메뉴, 브랜드, 프로필, 체류시간 시각 일관성을 해치지 말 것
- 모바일/태블릿에서도 핵심 CTA가 죽지 않게 할 것
- 홈/진단/추천/신청/이력/챗봇의 현재 최종 문구와 레이아웃 의도를 보존할 것

이번 사이클 완료조건:
- responsive 범위 첫 기능 커밋 1개 생성
- 체크인 updatedAt를 2026-03-08로 갱신
- progress 최소 20
- blockers 없으면 `없음`으로 명시

권장 커밋 메시지:
- feat(responsive): recover stitch runtime and responsive polish from main drift

작업 후 오케스트레이터 보고 형식:
- 회수한 파일:
- 기능 로직과 분리한 스타일 변경:
- 해상도별 주요 리스크:
- blockers:
- 남은 후속 QA 항목:
```

## admin-direct-dev

```text
[admin-direct-dev 트랙 안내]

이 스레드는 관리자 페이지 direct-dev 전용 트랙이다.

현재 원칙:
1. 이 트랙은 7개 병렬 워크트리 복구 트랙에 포함하지 않는다
2. 병합 순서에도 넣지 않는다
3. 관리자 구현은 계속 진행할 수 있지만, 공통 파일 충돌 가능성이 있으면 먼저 보고한다
4. foundation 공통 파일, stitch runtime 공통 파일, 전역 스타일 충돌 시 단독 진행하지 말고 오케스트레이터에 먼저 알린다

현재 관리자 범위:
- /admin
- /admin/departments
- /admin/questions
- /admin/courses
- /admin/users
- /admin/boards
- /admin/settings
- /analytics

컨텍스트 반영 포인트:
- 관리자 페이지도 stitch 디자인 유지 + 실데이터 주입 방식 선호
- 사용자 플로우용 7개 워크트리 복구가 현재 최우선이다
- admin은 direct-dev track으로 상태만 분리 관리한다

우선 회신 형식:
- 현재 작업 중인 관리자 페이지:
- 최근 구현 파일:
- 공통 파일 충돌 가능성:
- 지금 필요한 지원:
```

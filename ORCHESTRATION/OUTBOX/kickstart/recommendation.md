- 목표: main drift에서 recommendation 소유 범위만 선별 회수
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/recommendation
- 기준 문서:
  - /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md
- 회수 대상 파일:
  - src/features/recommendation/pages/RecommendationPage.tsx
  - src/features/recommendation/pages/LearningPathPage.tsx
  - src/shared/api/learningApi.ts
  - src/shared/api/learningApi.test.ts
  - src/shared/state/learningFlow.ts
  - src/shared/state/learningFlow.test.ts
- 회수 원칙:
  - main 변경분을 통째로 복사하지 말 것
  - recommendation 소유 범위만 선별 회수할 것
  - course-linking과 겹치는 상태는 임의 확장하지 말고 경계만 표시할 것
  - Learning Path 페이지는 하단 고정 저장 바 없는 최종 상태를 유지할 것
  - 관리자 direct-dev track은 이번 회수 범위에서 제외할 것
- 반영 포인트:
  - 추천 과정은 실추천 데이터 기반이어야 함
  - 추천 이유 설명력이 중요함
  - 보조 섹션은 progressive disclosure 방향 유지
  - 추천 카드 / 학습이력 / 현재 이어갈 학습은 상위 추천 3개 기준과 일관돼야 함
- 경계 표시가 필요한 필드:
  - `learningFlow.ts`: `selectedCourse`, `favoriteCourseIds`, `journeyStage`, `journeyEvents`는 recommendation 회수 가능
  - `learningFlow.ts`: `enrollmentRecords`, `remoteStageSnapshot(enrollment_done)`는 course-linking 경계로 취급
  - `learningApi.ts`: 추천 조회/선택과 현재 이어가기 조회는 recommendation 회수 가능
  - `learningApi.ts`: 신청 처리, 외부 이동/복귀, enrollment 상태 확장은 course-linking 경계로 남길 것
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/recommendation"
git status --short --branch
# main 대비 대상 파일 diff 확인
git diff -- src/features/recommendation/pages/RecommendationPage.tsx src/features/recommendation/pages/LearningPathPage.tsx src/shared/api/learningApi.ts src/shared/api/learningApi.test.ts src/shared/state/learningFlow.ts src/shared/state/learningFlow.test.ts
# 선별 회수 후
npm run lint && npm run test
```
- 완료조건:
  - recommendation 범위 첫 기능 커밋 1개 생성
  - 체크인 `updatedAt: 2026-03-08` 유지
  - progress 최소 20
  - blockers 없으면 `없음` 명시
- 권장 커밋메시지: `feat(recommendation): recover recommendation flow and learning state from main drift`
- 완료 후 오케스트레이터 보고 형식:
  - 회수한 파일:
  - course-linking과 경계가 겹치는 필드:
  - 남은 의존성:
  - blockers:
  - 다음 의존 워크트리에 전달할 계약/주의점:
- 완료 후 오케스트레이터 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
bash scripts/orchestrator-wave2-checkin-update.sh recommendation 20 IN_PROGRESS 없음
bash scripts/orchestrator-wave2-command-center.sh quick
```

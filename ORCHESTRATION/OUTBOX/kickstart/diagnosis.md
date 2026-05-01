- 목표: main drift에서 diagnosis 소유 범위만 worktrees/diagnosis로 선별 회수
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/diagnosis
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/diagnosis"
git status --short --branch
# 기능 구현 후
npm run lint && npm run test
```
- 회수 우선 파일:
  - src/features/diagnosis/pages/DiagnosisPage.tsx
  - src/features/diagnosis/pages/DiagnosisResultsPage.tsx
  - src/features/diagnosis/diagnosisResult.ts
  - src/features/diagnosis/questions.ts
  - src/shared/orchestration/skillGap.ts
  - src/shared/orchestration/skillGap.test.ts
  - src/shared/state/questionBank.ts
- 회수 원칙:
  - main 변경분 전체 복사 금지
  - diagnosis 소유 범위만 선별 회수
  - recommendation/history/chatbot 소비 필드는 diagnosis에서 먼저 정리
  - 공통 파일 수정 필요 시 foundation 선반영 필요 여부를 먼저 표시
  - 관리자 direct-dev track은 제외
- 확인 포인트:
  - 질문은 제조업 맥락의 20문항 객관식 유지
  - 선택지는 1x4 세로 배치 유지
  - `응답 현황` 카드 문구는 `진단 영역` 기준 유지
  - 결과 페이지 점수 상승률은 실제 이전 진단 비교 기반 유지
  - `추천 과정 보러가기`는 `/recommendation` 연결 유지
- 완료조건: 첫 기능 커밋 1개 이상 + 체크인 progress 20 이상 + blockers `없음` 명시
- 권장 커밋메시지: `feat(diagnosis): recover diagnosis snapshot and gap calculation from main drift`
- 완료 후 오케스트레이터 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
bash scripts/orchestrator-wave2-checkin-update.sh diagnosis 20 IN_PROGRESS 없음
bash scripts/orchestrator-wave2-command-center.sh quick
```

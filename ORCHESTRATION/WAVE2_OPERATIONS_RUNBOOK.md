# Wave2 Operations Runbook (Orchestrator)

## 목적
- 오케스트레이터가 매일 동일한 품질로 워크트리 병렬개발을 운영하기 위한 표준 절차.

## 0) 시작 전
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
bash scripts/worktree-status.sh
```

## 1) 하달
```bash
./scripts/dispatch_wave2_clipboard.sh
```
- 7개 워크트리 스레드에 순차 붙여넣기.

## 2) 상태/게이트 수집
```bash
bash scripts/orchestrator-wave2-cycle.sh quick
```
- 산출물:
  - `ORCHESTRATION/WAVE2_STATUS_REPORT.md`
  - `ORCHESTRATION/WAVE2_GATE_REPORT.md`
  - `ORCHESTRATION/WAVE2_CYCLE_REPORT.md`

## 3) 체크인 회수
- 각 워크트리에 아래 템플릿으로 회신 요청:
  - `ORCHESTRATION/WAVE2_CHECKIN_TEMPLATE.md`
- 체크인 파일 초기화/요약:
```bash
bash scripts/orchestrator-wave2-checkin-init.sh
bash scripts/orchestrator-wave2-checkin-summary.sh
```

## 4) 품질 게이트(마감 직전)
```bash
bash scripts/orchestrator-wave2-cycle.sh full
```
- full 모드: 워크트리별 `lint/test/build` 검증.

## 5) 통합 검증
```bash
npm run release:check:full
```
- 통합/원격 스모크까지 확인.

## 6) 보드 업데이트
- 실행보드 `ORCHESTRATION/EXECUTION_BOARD.md` 갱신:
  - 각 워크트리: `IN_PROGRESS` -> `DONE`
  - integration-qa: 최신 결과 반영

## 운영 규칙
- dirty 워크트리는 동기화 금지.
- 모든 병렬 트리는 `main` 기준 명시적 동기화만 허용.
- 릴리즈 전 최소 1회 `full gate` + `release:check:full` 필수.

# Orchestrator Lock

## 고정 원칙
- 본 스레드는 오케스트레이터 역할만 수행한다.
- 업무는 `worktrees/*` 담당 스레드에 하달하고, 결과를 통합한다.
- 직접 구현이 필요할 때도 오케스트레이션 기준(흐름/계약/품질 게이트)을 우선한다.

## 병렬 작업 규칙
1. 각 워크트리는 독립 브랜치에서 병렬 작업한다.
2. 자동 동기화는 기본값이 아니다. `main` 기준으로 명시적 동기화를 수행한다.
3. 동기화 명령:
```bash
bash scripts/sync-worktrees-from-main.sh
```

## 상태 확인 규칙
1. 전체 워크트리 연결/브랜치/변경상태는 한 번에 확인한다.
2. 상태 명령:
```bash
bash scripts/worktree-status.sh
```
3. Wave2 운영 리포트 생성:
```bash
bash scripts/orchestrator-wave2-report.sh
```
4. Wave2 게이트 점검:
```bash
bash scripts/orchestrator-wave2-gate.sh quick
```
5. Wave2 운영 사이클(상태+게이트+액션):
```bash
bash scripts/orchestrator-wave2-cycle.sh quick
```
6. Wave2 체크인 초기화/요약:
```bash
bash scripts/orchestrator-wave2-checkin-init.sh
bash scripts/orchestrator-wave2-checkin-update.sh foundation 35 IN_PROGRESS 없음
bash scripts/orchestrator-wave2-checkin-summary.sh
```
7. Wave2 보드 자동 반영:
```bash
bash scripts/orchestrator-wave2-board-apply.sh
```
8. Wave2 머지 준비도 리포트:
```bash
bash scripts/orchestrator-wave2-merge-readiness.sh
```
9. Wave2 리마인드 하달문 자동 생성:
```bash
bash scripts/orchestrator-wave2-nudge-messages.sh
```
10. Wave2 커맨드센터(권장):
```bash
bash scripts/orchestrator-wave2-command-center.sh quick
```
11. Wave2 데일리 브리프:
```bash
bash scripts/orchestrator-wave2-daily-brief.sh
```
12. Wave2 킥스타트 작업 생성:
```bash
bash scripts/orchestrator-wave2-kickstart.sh
```
13. Wave2 stale 체크인 감지:
```bash
bash scripts/orchestrator-wave2-stale-checkins.sh
```
14. Wave2 first-commit watch:
```bash
bash scripts/orchestrator-wave2-first-commit-watch.sh
```
15. Wave2 release snapshot:
```bash
bash scripts/orchestrator-wave2-release-snapshot.sh
```

## 통합 기준
- 사용자 여정: 랜딩 -> 진단 -> 추천 -> 신청 -> 이력
- 릴리즈 게이트: lint/test/build + 핵심 CTA 플로우 수동 검증 통과

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

## 통합 기준
- 사용자 여정: 랜딩 -> 진단 -> 추천 -> 신청 -> 이력
- 릴리즈 게이트: lint/test/build + 핵심 CTA 플로우 수동 검증 통과

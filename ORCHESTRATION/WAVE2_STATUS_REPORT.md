# Wave 2 Status Report

- generatedAt: 2026-03-06 10:08:20 UTC
- base(main): ec4281a

## Worktree Snapshot

| Worktree | Branch | HEAD | Dirty | Last Commit |
|---|---|---|---|---|
| foundation | codex/foundation | ec4281a | NO | chore(orchestrator): add priority queue and wire next-task selection |
| diagnosis | codex/diagnosis | ec4281a | NO | chore(orchestrator): add priority queue and wire next-task selection |
| recommendation | codex/recommendation | ec4281a | NO | chore(orchestrator): add priority queue and wire next-task selection |
| course-linking | codex/course-linking | ec4281a | NO | chore(orchestrator): add priority queue and wire next-task selection |
| history | codex/history | ec4281a | NO | chore(orchestrator): add priority queue and wire next-task selection |
| chatbot | codex/chatbot | ec4281a | NO | chore(orchestrator): add priority queue and wire next-task selection |
| responsive | codex/responsive | ec4281a | NO | chore(orchestrator): add priority queue and wire next-task selection |

## Check-in Template

각 워크트리 스레드에 아래 포맷으로 회신:

```text
[Wave2 체크인] <worktree-name>
- 진행률: <0~100>%
- 완료: <핵심 1~3개>
- 진행중: <현재 작업 1~2개>
- 리스크/블로커: <없음 또는 상세>
- 다음 커밋 예정: <짧은 메시지>
- 검증: <실행 명령 + 결과>
```

## Orchestrator Notes

- integration-qa는 모든 워크트리 Wave2 완료 후 실행
- dirty=YES 워크트리는 동기화 전에 커밋/정리 필요

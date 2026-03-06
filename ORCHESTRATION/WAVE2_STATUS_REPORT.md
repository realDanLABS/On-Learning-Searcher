# Wave 2 Status Report

- generatedAt: 2026-03-06 10:01:10 UTC
- base(main): 3964394

## Worktree Snapshot

| Worktree | Branch | HEAD | Dirty | Last Commit |
|---|---|---|---|---|
| foundation | codex/foundation | 3964394 | NO | chore(orchestrator): add stale-checkin monitoring and kickstart clipboard dispatch |
| diagnosis | codex/diagnosis | 3964394 | NO | chore(orchestrator): add stale-checkin monitoring and kickstart clipboard dispatch |
| recommendation | codex/recommendation | 3964394 | NO | chore(orchestrator): add stale-checkin monitoring and kickstart clipboard dispatch |
| course-linking | codex/course-linking | 3964394 | NO | chore(orchestrator): add stale-checkin monitoring and kickstart clipboard dispatch |
| history | codex/history | 3964394 | NO | chore(orchestrator): add stale-checkin monitoring and kickstart clipboard dispatch |
| chatbot | codex/chatbot | 3964394 | NO | chore(orchestrator): add stale-checkin monitoring and kickstart clipboard dispatch |
| responsive | codex/responsive | 3964394 | NO | chore(orchestrator): add stale-checkin monitoring and kickstart clipboard dispatch |

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

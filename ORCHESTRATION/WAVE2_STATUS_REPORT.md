# Wave 2 Status Report

- generatedAt: 2026-03-06 09:58:30 UTC
- base(main): 017f116

## Worktree Snapshot

| Worktree | Branch | HEAD | Dirty | Last Commit |
|---|---|---|---|---|
| foundation | codex/foundation | 017f116 | NO | chore(orchestrator): run full command-center pass and fix step labels |
| diagnosis | codex/diagnosis | 017f116 | NO | chore(orchestrator): run full command-center pass and fix step labels |
| recommendation | codex/recommendation | 017f116 | NO | chore(orchestrator): run full command-center pass and fix step labels |
| course-linking | codex/course-linking | 017f116 | NO | chore(orchestrator): run full command-center pass and fix step labels |
| history | codex/history | 017f116 | NO | chore(orchestrator): run full command-center pass and fix step labels |
| chatbot | codex/chatbot | 017f116 | NO | chore(orchestrator): run full command-center pass and fix step labels |
| responsive | codex/responsive | 017f116 | NO | chore(orchestrator): run full command-center pass and fix step labels |

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

# Wave 2 Status Report

- generatedAt: 2026-03-06 10:09:37 UTC
- base(main): a80bcdd

## Worktree Snapshot

| Worktree | Branch | HEAD | Dirty | Last Commit |
|---|---|---|---|---|
| foundation | codex/foundation | a80bcdd | NO | chore(orchestrator): add snapshot trend report to command center |
| diagnosis | codex/diagnosis | a80bcdd | NO | chore(orchestrator): add snapshot trend report to command center |
| recommendation | codex/recommendation | a80bcdd | NO | chore(orchestrator): add snapshot trend report to command center |
| course-linking | codex/course-linking | a80bcdd | NO | chore(orchestrator): add snapshot trend report to command center |
| history | codex/history | a80bcdd | NO | chore(orchestrator): add snapshot trend report to command center |
| chatbot | codex/chatbot | a80bcdd | NO | chore(orchestrator): add snapshot trend report to command center |
| responsive | codex/responsive | a80bcdd | NO | chore(orchestrator): add snapshot trend report to command center |

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

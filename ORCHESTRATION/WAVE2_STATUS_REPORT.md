# Wave 2 Status Report

- generatedAt: 2026-03-08 03:35:42 UTC
- base(main): 6770fd3

## Worktree Snapshot

| Worktree | Branch | HEAD | Dirty | Last Commit |
|---|---|---|---|---|
| foundation | codex/foundation | 6770fd3 | NO | chore(orchestrator): add merge plan generation and command-center step |
| diagnosis | codex/diagnosis | 6770fd3 | NO | chore(orchestrator): add merge plan generation and command-center step |
| recommendation | codex/recommendation | 6770fd3 | NO | chore(orchestrator): add merge plan generation and command-center step |
| course-linking | codex/course-linking | 6770fd3 | NO | chore(orchestrator): add merge plan generation and command-center step |
| history | codex/history | 6770fd3 | NO | chore(orchestrator): add merge plan generation and command-center step |
| chatbot | codex/chatbot | 6770fd3 | NO | chore(orchestrator): add merge plan generation and command-center step |
| responsive | codex/responsive | 6770fd3 | NO | chore(orchestrator): add merge plan generation and command-center step |

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

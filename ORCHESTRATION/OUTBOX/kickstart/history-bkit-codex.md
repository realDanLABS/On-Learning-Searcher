- 목표: bkit -> Codex parity 추적과 릴리즈 판단 문서화
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/history
- 필수 산출물:
  - parity tracker
  - intentional deviation log
  - release readiness checklist
  - migration changelog
- 완료조건:
  - skill/agent/workflow 별 완료 여부를 한 문서에서 확인 가능
  - deviations가 누락 없이 기록됨
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/history"
git status --short --branch
rg -n "parity|deviation|release|migration|report" "$HOME/.gemini/extensions/bkit" ORCHESTRATION
```
- 권장 커밋메시지: `docs(history): add codex parity tracker and release checklist`

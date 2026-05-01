- 목표: Codex parity 산출물을 운영자가 바로 검증할 수 있는 validation pack 작성
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/responsive
- 필수 산출물:
  - Starter/Dynamic/Enterprise 검증 시나리오
  - smoke-test checklist
  - quickstart guide
  - known failure modes
- 완료조건:
  - 새 Codex skillset을 처음 쓰는 작업자가 문서만 보고 검증 가능
  - project level별 최소 1개 시나리오가 존재
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/responsive"
git status --short --branch
rg -n "Starter|Dynamic|Enterprise|validation|smoke|quickstart" "$HOME/.gemini/extensions/bkit"
```
- 권장 커밋메시지: `docs(responsive): add validation pack for bkit codex parity`

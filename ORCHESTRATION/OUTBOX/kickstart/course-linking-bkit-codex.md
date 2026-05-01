- 목표: Gemini-specific hook/command/context behavior를 Codex orchestration으로 대체
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/course-linking
- 필수 산출물:
  - 10-event hook 대응표
  - Codex에서 대체 가능한 지점과 불가능한 지점
  - command alias 전략
  - `GEMINI.md` append 동작 대체 흐름
- 완료조건:
  - unsupported 항목마다 workaround가 기입됨
  - operator가 어떤 명령/문서로 같은 효과를 낼지 설명 가능
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/course-linking"
git status --short --branch
rg -n "hook|command|GEMINI.md|context|Session" "$HOME/.gemini/extensions/bkit"
```
- 권장 커밋메시지: `docs(course-linking): map gemini hooks and commands to codex orchestration`

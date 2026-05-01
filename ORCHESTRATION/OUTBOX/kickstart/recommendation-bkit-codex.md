- 목표: bkit 35개 skill을 Codex skillset으로 1:1 매핑
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/recommendation
- 필수 산출물:
  - 전체 skill inventory 표
  - 각 skill 상태: `REUSE`, `ADAPT`, `NEW`, `UNSUPPORTED_WITH_WORKAROUND`
  - trigger 문구와 호출 정책
  - 기존 로컬 skill 재사용 후보 목록
- 완료조건:
  - 35개 skill 모두 상태가 채워짐
  - 재사용 가능한 기존 skill과 신규 제작 skill이 분리됨
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/recommendation"
git status --short --branch
find "$HOME/.gemini/extensions/bkit/skills" -maxdepth 2 -name SKILL.md | sort
```
- 권장 커밋메시지: `docs(recommendation): build bkit-to-codex skill mapping matrix`

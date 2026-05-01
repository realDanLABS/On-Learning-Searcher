- 목표: bkit Gemini extension을 Codex skillset으로 옮기기 위한 공통 계약 정의
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/foundation
- 필수 산출물:
  - Codex skill/agent 디렉터리 구조 초안
  - skill metadata schema
  - agent metadata schema
  - `output style`, `project level` 설정 계약
  - Gemini 용어 -> Codex 용어 번역표
- 완료조건:
  - downstream 작업자가 참조 가능한 단일 문서 1개 이상 커밋
  - 필수 필드/파일명/배치 규칙이 문서에 명시됨
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/foundation"
git status --short --branch
rg -n "skill|agent|pdca|hook|output style|project level" "$HOME/.gemini/extensions/bkit"
```
- 권장 커밋메시지: `docs(foundation): define codex parity contract for bkit migration`

- 목표: bkit PDCA 흐름을 Codex 워크플로우로 변환
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/diagnosis
- 필수 산출물:
  - `plan`, `design`, `analyze`, `iterate`, `report` 단계 정의
  - 각 단계 입력/출력 문서 템플릿
  - `gap >= 90%` 규칙의 Codex 적용 방식
- 완료조건:
  - PDCA 5단계가 빠짐없이 문서화됨
  - 예시 feature 하나로 end-to-end 흐름 설명 가능
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/diagnosis"
git status --short --branch
rg -n "pdca|plan|design|analyze|iterate|report" "$HOME/.gemini/extensions/bkit"
```
- 권장 커밋메시지: `docs(diagnosis): map bkit pdca workflow to codex`

- 목표: bkit agent 21개를 Codex 역할 프롬프트/트리거로 변환
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/chatbot
- 필수 산출물:
  - 전체 agent inventory
  - agent별 역할/트리거/입력/도구 제한/출력 형식
  - Gemini invalid tool name 항목의 Codex 대체안
- 완료조건:
  - 21개 agent 전부가 매핑됨
  - unsupported tool은 fallback이 문서화됨
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/chatbot"
git status --short --branch
find "$HOME/.gemini/extensions/bkit/agents" -maxdepth 1 -name '*.md' | sort
```
- 권장 커밋메시지: `docs(chatbot): convert bkit agent roles for codex`

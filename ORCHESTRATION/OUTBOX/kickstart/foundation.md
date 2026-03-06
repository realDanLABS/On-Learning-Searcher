
- 목표: 공통 상태 컴포넌트 + 릴리즈 메타 표기
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/foundation
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/foundation"
git status --short --branch
# 기능 구현 후
npm run lint && npm run test
```
- 완료조건: 첫 기능 커밋 1개 이상 + 체크인 progress 20% 이상
- 권장 커밋메시지: `feat(foundation): start wave2 foundation implementation`
- 완료 후 오케스트레이터 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
bash scripts/orchestrator-wave2-checkin-update.sh foundation 20 IN_PROGRESS 없음
bash scripts/orchestrator-wave2-command-center.sh quick
```


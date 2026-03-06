
- 목표: 신청 실패 재시도 + 콜백 검증 강화
- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/course-linking
- 권장 시작 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/course-linking"
git status --short --branch
# 기능 구현 후
npm run lint && npm run test
```
- 완료조건: 첫 기능 커밋 1개 이상 + 체크인 progress 20% 이상
- 권장 커밋메시지: `feat(course-linking): start wave2 course-linking implementation`
- 완료 후 오케스트레이터 명령:
```bash
cd "/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
bash scripts/orchestrator-wave2-checkin-update.sh course-linking 20 IN_PROGRESS 없음
bash scripts/orchestrator-wave2-command-center.sh quick
```


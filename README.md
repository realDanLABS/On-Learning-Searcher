# On Learning Searcher

현대위아 온러닝서처(Online + Learning + Search) 프로젝트 저장소입니다.

## 시작하기
```bash
npm install
npm run dev
```

환경 변수는 `.env.example`을 참고해서 설정합니다.
- `VITE_API_MODE=mock|remote` (`mock` 기본)
- `VITE_API_MODE=remote`일 때 `VITE_API_BASE_URL` 필수
- `VITE_SSO_LOGIN_URL`, `VITE_SSO_LOGOUT_URL`, `VITE_SSO_CALLBACK_URL` (remote 권장)
- `VITE_DISABLED_FEATURES=chatbot,responsive` 형태로 기능 임시 비활성화

## 시작 전 핵심
- 기능별 `git worktree`를 사용합니다.
- 한 기능은 한 브랜치(한 worktree)에서만 작업합니다.

## 사용자 여정 (최종 기준)
- `로그인` → `프로필 저장` → `역량 진단` → `추천 과정 선택` → `교육 신청` → `이력/감사로그 확인`

## 현재 Worktree 구성
- `codex/foundation`
- `codex/diagnosis`
- `codex/recommendation`
- `codex/course-linking`
- `codex/history`
- `codex/chatbot`
- `codex/responsive`

상세 운영 방법은 [docs/WORKTREE_GUIDE.md](docs/WORKTREE_GUIDE.md)를 확인하세요.

## 폴더 구조
```text
src/
  app/
  router/
  styles/
  shared/
    layouts/
    state/
  features/
    diagnosis/
    recommendation/
    course-linking/
    history/
    chatbot/
    responsive/
```

## 협업 템플릿
- PR 템플릿: `.github/pull_request_template.md`
- 이슈 템플릿: `.github/ISSUE_TEMPLATE/*`

## Agent Policy
- Orchestrator lock: [AGENTS.md](AGENTS.md)

## Orchestration Docs
- Master plan: [ORCHESTRATION/MASTER_ORCHESTRATION_PLAN.md](ORCHESTRATION/MASTER_ORCHESTRATION_PLAN.md)
- Release plan: [ORCHESTRATION/RELEASE_MASTER_PLAN.md](ORCHESTRATION/RELEASE_MASTER_PLAN.md)
- Dispatch: [ORCHESTRATION/DISPATCH_MESSAGES.md](ORCHESTRATION/DISPATCH_MESSAGES.md)
- Integration contract: [ORCHESTRATION/INTEGRATION_CONTRACT.md](ORCHESTRATION/INTEGRATION_CONTRACT.md)
- Execution board: [ORCHESTRATION/EXECUTION_BOARD.md](ORCHESTRATION/EXECUTION_BOARD.md)

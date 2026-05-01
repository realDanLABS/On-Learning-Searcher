# On Learning Searcher

현대위아 온러닝서처(Online + Learning + Search) 프로젝트 저장소입니다.

현재 기준 앱은 `Next.js App Router`이며, 백엔드는 Supabase/Postgres 기반 `/api` 경로를 사용합니다.

## 시작하기
```bash
npm install
npm run dev
```

원격 연동 리허설(백엔드 계약 테스트)은 아래 한 줄로 실행할 수 있습니다.
```bash
npm run dev:remote-mock
```

환경 변수는 `.env.example`을 참고해서 설정합니다.
- `NEXT_PUBLIC_API_BASE_URL`
  - 기본값은 `/api`
  - 원격 mock/E2E 리허설에서는 `http://127.0.0.1:8787` 같은 절대 경로를 사용합니다.
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`

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

## Worktree 운영 명령
```bash
# 전체 워크트리 상태 확인
bash scripts/worktree-status.sh

# main 기준 전체 워크트리 fast-forward 동기화
bash scripts/sync-worktrees-from-main.sh

# 릴리즈 전 전체 품질 점검 (lint + test + e2e + build + worktree status)
npm run release:check

# 원격 계약 리허설 E2E (remote mock api + app + playwright)
npm run test:e2e:remote

# 최종 게이트 (기본 release check + remote rehearsal)
npm run release:check:full

# 원격 운영 스모크 점검 (.env 기반 필수값 + /health)
npm run remote:smoke

# 원격 API 모의 서버 단독 실행 (포트: 8787)
npm run api:remote-mock
```

## 폴더 구조
```text
app/
components/
lib/
api/
public/
server/
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
- Orchestrator lock: [ORCHESTRATION/ORCHESTRATOR_LOCK.md](ORCHESTRATION/ORCHESTRATOR_LOCK.md)

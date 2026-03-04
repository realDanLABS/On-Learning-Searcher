# On Learning Searcher

현대위아 온러닝서처(Online + Learning + Search) 프로젝트 저장소입니다.

## 시작 전 핵심
- 이 저장소는 기능별로 `git worktree`를 사용합니다.
- 한 기능은 한 브랜치(한 worktree)에서만 작업합니다.

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
  features/
    diagnosis/
    recommendation/
    course-linking/
    history/
    chatbot/
  shared/
    components/
    layouts/
    hooks/
    utils/
    types/
    api/
  assets/
    images/
    icons/
  styles/
  router/
  mocks/
```

`src` 상세 설명은 [src/README.md](src/README.md)에 정리되어 있습니다.

## 협업 템플릿
- PR 템플릿: `.github/pull_request_template.md`
- 이슈 템플릿: `.github/ISSUE_TEMPLATE/*`

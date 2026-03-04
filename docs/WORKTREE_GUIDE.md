# On Learning Searcher - Git Worktree 운영 가이드 (입문용)

## 1) 왜 Worktree를 쓰나요?
- 기능별로 폴더를 분리해서 동시에 개발할 수 있습니다.
- 브랜치 전환(`git checkout`)으로 인한 실수를 줄일 수 있습니다.

## 2) 현재 프로젝트의 Worktree 구성
- 메인 저장소: `On_Learning_Searcher` (`main` 브랜치)
- 작업 폴더: `../OnLearning_worktrees/`
  - `foundation` -> `codex/foundation`
  - `diagnosis` -> `codex/diagnosis`
  - `recommendation` -> `codex/recommendation`
  - `course-linking` -> `codex/course-linking`
  - `history` -> `codex/history`
  - `chatbot` -> `codex/chatbot`
  - `responsive` -> `codex/responsive`

## 3) 매일 작업 루틴
1. 작업할 기능 폴더로 이동
```bash
cd "../OnLearning_worktrees/diagnosis"
```
2. 코드 수정 후 커밋
```bash
git add .
git commit -m "feat(diagnosis): add OX question step"
```
3. 원격에 푸시 (원격이 연결되어 있을 때)
```bash
git push -u origin codex/diagnosis
```

## 4) 머지 순서 (권장)
1. `codex/foundation`
2. `codex/diagnosis`
3. `codex/recommendation`
4. `codex/course-linking`
5. `codex/history`
6. `codex/chatbot`
7. `codex/responsive`

## 5) 자주 쓰는 명령어
```bash
# 모든 worktree 확인
git worktree list

# worktree 제거 (폴더만 제거, 브랜치 유지)
git worktree remove "../OnLearning_worktrees/chatbot"

# 브랜치까지 삭제 (이미 main에 머지됐을 때만)
git branch -d codex/chatbot
```

## 6) 초보자 체크리스트
- 한 번에 한 기능 브랜치만 수정하기
- 커밋 메시지에 기능명을 넣기 (`feat(diagnosis): ...`)
- 머지 전에 `main` 최신 반영하기
- 충돌이 나면 당황하지 말고, `main` 기준으로 다시 정리하기

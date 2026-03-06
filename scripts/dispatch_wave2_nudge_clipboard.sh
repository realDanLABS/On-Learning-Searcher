#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
FILE="$ROOT/ORCHESTRATION/WAVE2_NUDGE_MESSAGES.md"

WORKTREES=(
  "foundation"
  "diagnosis"
  "recommendation"
  "course-linking"
  "history"
  "chatbot"
  "responsive"
)

if [[ ! -f "$FILE" ]]; then
  echo "리마인드 파일이 없습니다: $FILE"
  echo "먼저 실행: bash scripts/orchestrator-wave2-nudge-messages.sh"
  exit 1
fi

i=0
for name in "${WORKTREES[@]}"; do
  i=$((i + 1))
  awk -v name="$name" '
    $0 ~ "^## " name "$" {on=1; next}
    on && $0 ~ "^## " {exit}
    on {print}
  ' "$FILE" | pbcopy

  echo "[$i/7] $name 리마인드 클립보드 복사 완료: 하위 스레드에 붙여넣고 Enter 후, 터미널에서 Enter"
  read -r
done

echo "Wave2 리마인드 7개 전송 루프 완료"

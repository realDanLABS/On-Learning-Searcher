#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
FILE="$ROOT/ORCHESTRATION/WORKTREE_RECOVERY_DISPATCH_2026-03-08.md"

SECTIONS=(
  "foundation"
  "diagnosis"
  "recommendation"
  "course-linking"
  "history"
  "chatbot"
  "responsive"
  "admin-direct-dev"
)

if [[ ! -f "$FILE" ]]; then
  echo "recovery dispatch 파일이 없습니다: $FILE"
  exit 1
fi

i=0
for name in "${SECTIONS[@]}"; do
  i=$((i + 1))
  awk -v name="$name" '
    $0 == "## " name {in_section=1; next}
    in_section && $0 ~ /^## / {exit}
    in_section {print}
  ' "$FILE" | awk '
    /^```text$/ {capture=1; next}
    /^```$/ && capture {exit}
    capture {print}
  ' | pbcopy

  echo "[$i/${#SECTIONS[@]}] $name 프롬프트를 클립보드에 복사했습니다."
  echo "해당 스레드에 붙여넣고 Enter 후, 이 터미널에서 Enter를 눌러 다음으로 진행하세요."
  read -r
done

echo "Recovery dispatch 8개 전송 루프 완료"

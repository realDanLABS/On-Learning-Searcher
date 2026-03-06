#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_STALE_CHECKINS.md"

WORKTREES=(
  "foundation"
  "diagnosis"
  "recommendation"
  "course-linking"
  "history"
  "chatbot"
  "responsive"
)

cd "$ROOT_DIR"

today="$(date +"%Y-%m-%d")"
generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

{
  echo "# Wave2 Stale Checkins"
  echo
  echo "- generatedAt: $generated_at"
  echo "- today: $today"
  echo
  echo "| Worktree | UpdatedAt | Stale |"
  echo "|---|---|---|"
} > "$OUT_FILE"

stale_count=0
for name in "${WORKTREES[@]}"; do
  file="$CHECKIN_DIR/${name}.md"
  updated="-"
  stale="YES"

  if [[ -f "$file" ]]; then
    updated="$(awk -F': ' '/^- updatedAt:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
    [[ -z "$updated" ]] && updated="-"
    if [[ "$updated" == "$today" ]]; then
      stale="NO"
    fi
  fi

  [[ "$stale" == "YES" ]] && stale_count=$((stale_count + 1))
  echo "| $name | $updated | $stale |" >> "$OUT_FILE"
done

{
  echo
  echo "## Summary"
  echo
  echo "- staleCount: $stale_count"
  echo "- action: stale=YES 워크트리 체크인 갱신 필요"
} >> "$OUT_FILE"

echo "generated: $OUT_FILE"

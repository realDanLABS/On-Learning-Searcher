#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_FIRST_COMMIT_WATCH.md"

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

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
today="$(date +"%Y-%m-%d")"

{
  echo "# Wave2 First Commit Watch"
  echo
  echo "- generatedAt: $generated_at"
  echo
  echo "| Worktree | Ahead(main) | Checkin Progress (before) | Auto Update |"
  echo "|---|---:|---:|---|"
} > "$OUT_FILE"

auto_updated=0
for name in "${WORKTREES[@]}"; do
  branch="codex/$name"
  ahead="$(git rev-list --count main.."$branch")"
  checkin_file="$CHECKIN_DIR/$name.md"

  progress_before="0"
  auto="NO"

  if [[ -f "$checkin_file" ]]; then
    progress_before="$(awk -F': ' '/^- progress:/ {print $2; exit}' "$checkin_file" | tr -d '\r' || true)"
    [[ -z "$progress_before" ]] && progress_before="0"
  fi

  if [[ "$ahead" -gt 0 && "$progress_before" -eq 0 && -f "$checkin_file" ]]; then
    tmp="$(mktemp)"
    awk -v d="$today" '
      /^- updatedAt:/ { print "- updatedAt: " d; next }
      /^- progress:/ { print "- progress: 20"; next }
      { print }
    ' "$checkin_file" > "$tmp"
    mv "$tmp" "$checkin_file"
    auto="YES (progress 0 -> 20)"
    auto_updated=$((auto_updated + 1))
  fi

  echo "| $name | $ahead | $progress_before | $auto |" >> "$OUT_FILE"
done

{
  echo
  echo "## Summary"
  echo
  echo "- autoUpdatedCount: $auto_updated"
  echo "- rule: ahead(main)>0 이고 progress=0이면 progress를 20으로 자동 상향"
} >> "$OUT_FILE"

echo "generated: $OUT_FILE"

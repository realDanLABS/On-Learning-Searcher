#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_MERGE_READINESS.md"

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
base_head="$(git rev-parse --short main)"

{
  echo "# Wave2 Merge Readiness"
  echo
  echo "- generatedAt: $generated_at"
  echo "- base(main): $base_head"
  echo
  echo "| Order | Worktree | Branch | Ahead | Behind | Dirty | Checkin Status | Ready | Action |"
  echo "|---:|---|---|---:|---:|---|---|---|---|"
} > "$OUT_FILE"

idx=0
for name in "${WORKTREES[@]}"; do
  idx=$((idx + 1))
  wt="$ROOT_DIR/worktrees/$name"
  branch="codex/$name"
  ahead="$(git rev-list --count main.."$branch")"
  behind="$(git rev-list --count "$branch"..main)"
  dirty="NO"
  [[ -n "$(git -C "$wt" status --porcelain)" ]] && dirty="YES"

  checkin_file="$CHECKIN_DIR/$name.md"
  checkin_status="IN_PROGRESS"
  blocker="없음"
  if [[ -f "$checkin_file" ]]; then
    checkin_status="$(awk -F': ' '/^- status:/ {print $2; exit}' "$checkin_file" | tr -d '\r' || true)"
    blocker="$(awk 'found && /^  - / {sub(/^  - /,""); print; exit} /^- blockers:/{found=1}' "$checkin_file" | tr -d '\r' || true)"
    [[ -z "$checkin_status" ]] && checkin_status="IN_PROGRESS"
    [[ -z "$blocker" ]] && blocker="없음"
  fi

  ready="NO"
  action="continue development"

  if [[ "$ahead" -gt 0 && "$behind" -eq 0 && "$dirty" == "NO" && "$checkin_status" == "DONE" && "$blocker" == "없음" ]]; then
    ready="YES"
    action="merge candidate"
  elif [[ "$behind" -gt 0 ]]; then
    action="sync from main first"
  elif [[ "$dirty" == "YES" ]]; then
    action="commit/stash before merge"
  elif [[ "$checkin_status" == "BLOCKED" || "$blocker" != "없음" ]]; then
    action="resolve blocker"
  elif [[ "$ahead" -eq 0 ]]; then
    action="no feature commits yet"
  fi

  echo "| $idx | $name | $branch | $ahead | $behind | $dirty | $checkin_status | $ready | $action |" >> "$OUT_FILE"
done

{
  echo
  echo "## Merge Rule"
  echo
  echo "- 순서: foundation -> diagnosis -> recommendation -> course-linking -> history -> chatbot -> responsive"
  echo "- 조건: ahead>0, behind=0, dirty=NO, checkin status=DONE, blocker=없음"
} >> "$OUT_FILE"

echo "generated: $OUT_FILE"

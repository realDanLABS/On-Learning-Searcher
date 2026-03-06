#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_CHECKIN_SUMMARY.md"

WORKTREES=(
  "foundation"
  "diagnosis"
  "recommendation"
  "course-linking"
  "history"
  "chatbot"
  "responsive"
)

if [[ ! -d "$CHECKIN_DIR" ]]; then
  echo "missing checkin dir: $CHECKIN_DIR"
  echo "run: bash scripts/orchestrator-wave2-checkin-init.sh"
  exit 1
fi

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

{
  echo "# Wave2 Check-in Summary"
  echo
  echo "- generatedAt: $generated_at"
  echo
  echo "| Worktree | Progress | Status | Blocker | UpdatedAt |"
  echo "|---|---:|---|---|---|"
} > "$OUT_FILE"

sum=0
count=0

for name in "${WORKTREES[@]}"; do
  file="$CHECKIN_DIR/${name}.md"
  if [[ ! -f "$file" ]]; then
    echo "| $name | 0 | MISSING | yes | - |" >> "$OUT_FILE"
    continue
  fi

  progress="$(awk -F': ' '/^- progress:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
  status="$(awk -F': ' '/^- status:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
  updated="$(awk -F': ' '/^- updatedAt:/ {print $2; exit}' "$file" | tr -d '\r' || true)"

  if grep -q "^- blockers:" "$file"; then
    blocker_line="$(awk 'found && /^  - / {sub(/^  - /,""); print; exit} /^- blockers:/{found=1}' "$file" | tr -d '\r' || true)"
  else
    blocker_line=""
  fi

  [[ -z "$progress" ]] && progress="0"
  [[ -z "$status" ]] && status="UNKNOWN"
  [[ -z "$updated" ]] && updated="-"
  [[ -z "$blocker_line" ]] && blocker_line="-"

  if [[ "$blocker_line" == "없음" || "$blocker_line" == "-" ]]; then
    blocker="no"
  else
    blocker="yes"
  fi

  sum=$((sum + progress))
  count=$((count + 1))

  echo "| $name | $progress | $status | $blocker | $updated |" >> "$OUT_FILE"
done

avg=0
if [[ "$count" -gt 0 ]]; then
  avg=$((sum / count))
fi

{
  echo
  echo "## Overall"
  echo
  echo "- averageProgress: ${avg}%"
  echo "- note: blocker=yes 항목 우선 해결"
} >> "$OUT_FILE"

echo "generated: $OUT_FILE"

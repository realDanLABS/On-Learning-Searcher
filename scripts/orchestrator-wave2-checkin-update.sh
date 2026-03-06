#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"

usage() {
  echo "usage: bash scripts/orchestrator-wave2-checkin-update.sh <worktree> <progress> <status> <blocker>"
  echo "example: bash scripts/orchestrator-wave2-checkin-update.sh foundation 35 IN_PROGRESS 없음"
}

if [[ $# -lt 4 ]]; then
  usage
  exit 1
fi

name="$1"
progress="$2"
status="$3"
blocker="$4"

case "$name" in
  foundation|diagnosis|recommendation|course-linking|history|chatbot|responsive) ;;
  *)
    echo "invalid worktree: $name"
    exit 1
    ;;
esac

case "$status" in
  TODO|IN_PROGRESS|BLOCKED|DONE) ;;
  *)
    echo "invalid status: $status (allowed: TODO|IN_PROGRESS|BLOCKED|DONE)"
    exit 1
    ;;
esac

if ! [[ "$progress" =~ ^[0-9]+$ ]] || [[ "$progress" -lt 0 ]] || [[ "$progress" -gt 100 ]]; then
  echo "invalid progress: $progress (0~100)"
  exit 1
fi

file="$CHECKIN_DIR/${name}.md"
if [[ ! -f "$file" ]]; then
  echo "missing checkin file: $file"
  echo "run: bash scripts/orchestrator-wave2-checkin-init.sh"
  exit 1
fi

today="$(date +"%Y-%m-%d")"
tmp="$(mktemp)"

awk -v d="$today" -v p="$progress" -v s="$status" -v b="$blocker" '
  /^- updatedAt:/ { print "- updatedAt: " d; next }
  /^- progress:/ { print "- progress: " p; next }
  /^- status:/ { print "- status: " s; next }
  /^- blockers:/ { print; in_blocker=1; next }
  in_blocker && /^  - / { print "  - " b; in_blocker=0; next }
  { print }
' "$file" > "$tmp"

mv "$tmp" "$file"
echo "updated: $file"

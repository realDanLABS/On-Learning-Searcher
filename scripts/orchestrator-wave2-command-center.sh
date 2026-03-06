#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-quick}" # quick | full

if [[ "$MODE" != "quick" && "$MODE" != "full" ]]; then
  echo "usage: bash scripts/orchestrator-wave2-command-center.sh [quick|full]"
  exit 1
fi

cd "$ROOT_DIR"

echo "[1/10] cycle run ($MODE)"
bash scripts/orchestrator-wave2-cycle.sh "$MODE"

echo
echo "[2/10] run first-commit watch"
bash scripts/orchestrator-wave2-first-commit-watch.sh

echo
echo "[3/10] apply execution board from checkins"
bash scripts/orchestrator-wave2-board-apply.sh

echo
echo "[4/10] refresh checkin summary"
bash scripts/orchestrator-wave2-checkin-summary.sh

echo
echo "[5/10] refresh merge readiness"
bash scripts/orchestrator-wave2-merge-readiness.sh

echo
echo "[6/10] refresh nudge messages"
bash scripts/orchestrator-wave2-nudge-messages.sh

echo
echo "[7/10] refresh stale checkins"
bash scripts/orchestrator-wave2-stale-checkins.sh

echo
echo "[8/10] build kickstart tasks"
bash scripts/orchestrator-wave2-kickstart.sh

echo
echo "[9/10] build daily brief"
bash scripts/orchestrator-wave2-daily-brief.sh

echo
echo "[10/10] build outbox pack"
bash scripts/orchestrator-wave2-inbox-pack.sh

echo
echo "command-center complete"
echo "- cycle: ORCHESTRATION/WAVE2_CYCLE_REPORT.md"
echo "- first-commit-watch: ORCHESTRATION/WAVE2_FIRST_COMMIT_WATCH.md"
echo "- board: ORCHESTRATION/EXECUTION_BOARD.md"
echo "- merge: ORCHESTRATION/WAVE2_MERGE_READINESS.md"
echo "- nudge: ORCHESTRATION/WAVE2_NUDGE_MESSAGES.md"
echo "- stale: ORCHESTRATION/WAVE2_STALE_CHECKINS.md"
echo "- daily: ORCHESTRATION/WAVE2_DAILY_BRIEF.md"
echo "- kickstart: ORCHESTRATION/WAVE2_KICKSTART_TASKS.md"
echo "- outbox: ORCHESTRATION/OUTBOX/"

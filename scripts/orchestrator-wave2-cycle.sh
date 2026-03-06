#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-quick}" # quick | full
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_CYCLE_REPORT.md"

if [[ "$MODE" != "quick" && "$MODE" != "full" ]]; then
  echo "usage: bash scripts/orchestrator-wave2-cycle.sh [quick|full]"
  exit 1
fi

cd "$ROOT_DIR"

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
base_head="$(git rev-parse --short main)"

# 1) Snapshot report
bash scripts/orchestrator-wave2-report.sh >/tmp/w2_cycle_report.log 2>&1 || true

# 2) Gate report
bash scripts/orchestrator-wave2-gate.sh "$MODE" >/tmp/w2_cycle_gate.log 2>&1 || true

# 3) Check-in summary + board draft
bash scripts/orchestrator-wave2-checkin-summary.sh >/tmp/w2_cycle_checkin.log 2>&1 || true
bash scripts/orchestrator-wave2-board-draft.sh >/tmp/w2_cycle_board.log 2>&1 || true
bash scripts/orchestrator-wave2-merge-readiness.sh >/tmp/w2_cycle_merge.log 2>&1 || true
bash scripts/orchestrator-wave2-nudge-messages.sh >/tmp/w2_cycle_nudge.log 2>&1 || true

# 4) Compose cycle summary
{
  echo "# Wave2 Cycle Report"
  echo
  echo "- generatedAt: $generated_at"
  echo "- base(main): $base_head"
  echo "- gateMode: $MODE"
  echo
  echo "## Command Result"
  echo
  if grep -q "generated:" /tmp/w2_cycle_report.log; then
    echo "- status report: PASS"
  else
    echo "- status report: FAIL"
  fi
  if grep -q "generated:" /tmp/w2_cycle_gate.log; then
    echo "- gate report: PASS"
  else
    echo "- gate report: FAIL"
  fi
  if grep -q "generated:" /tmp/w2_cycle_checkin.log; then
    echo "- checkin summary: PASS"
  else
    echo "- checkin summary: FAIL"
  fi
  if grep -q "generated:" /tmp/w2_cycle_board.log; then
    echo "- board draft: PASS"
  else
    echo "- board draft: FAIL"
  fi
  if grep -q "generated:" /tmp/w2_cycle_merge.log; then
    echo "- merge readiness: PASS"
  else
    echo "- merge readiness: FAIL"
  fi
  if grep -q "generated:" /tmp/w2_cycle_nudge.log; then
    echo "- nudge messages: PASS"
  else
    echo "- nudge messages: FAIL"
  fi
  echo
  echo "## Artifacts"
  echo
  echo "- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WAVE2_STATUS_REPORT.md"
  echo "- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WAVE2_GATE_REPORT.md"
  echo "- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WAVE2_CHECKIN_SUMMARY.md"
  echo "- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/EXECUTION_BOARD_WAVE2_DRAFT.md"
  echo "- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WAVE2_MERGE_READINESS.md"
  echo "- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/WAVE2_NUDGE_MESSAGES.md"
  echo
  echo "## Next Action Guide"
  echo
  echo "1. 각 워크트리 스레드에 Wave2 체크인 회수"
  echo "2. dirty=YES 또는 gate WARN/FAIL 항목 우선 정리"
  echo "3. 모든 워크트리 feature 커밋 회수 후 full gate 재실행"
} > "$OUT_FILE"

echo "generated: $OUT_FILE"

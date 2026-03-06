#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MERGE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_MERGE_READINESS.md"
CHECKIN_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_CHECKIN_SUMMARY.md"
STALE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_STALE_CHECKINS.md"
QUEUE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_PRIORITY_QUEUE.md"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_DAILY_BRIEF.md"

cd "$ROOT_DIR"

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
base_head="$(git rev-parse --short main)"

if [[ ! -f "$MERGE_FILE" ]]; then
  bash scripts/orchestrator-wave2-merge-readiness.sh >/tmp/w2_daily_merge.log 2>&1 || true
fi
if [[ ! -f "$CHECKIN_FILE" ]]; then
  bash scripts/orchestrator-wave2-checkin-summary.sh >/tmp/w2_daily_checkin.log 2>&1 || true
fi
if [[ ! -f "$STALE_FILE" ]]; then
  bash scripts/orchestrator-wave2-stale-checkins.sh >/tmp/w2_daily_stale.log 2>&1 || true
fi
if [[ ! -f "$QUEUE_FILE" ]]; then
  bash scripts/orchestrator-wave2-priority-queue.sh >/tmp/w2_daily_queue.log 2>&1 || true
fi

ready_count="$(awk -F'|' '/^\| [0-9]+ / {gsub(/ /,"",$8); if ($8=="YES") c++} END {print c+0}' "$MERGE_FILE")"
blocked_count="$(awk -F'|' '/^\| [0-9]+ / {gsub(/ /,"",$9); if ($9=="resolveblocker") c++} END {print c+0}' "$MERGE_FILE")"
no_commit_count="$(awk -F'|' '/^\| [0-9]+ / {if ($10 ~ /no feature commits yet/) c++} END {print c+0}' "$MERGE_FILE")"
avg_progress="$(awk -F': ' '/^- averageProgress:/ {gsub(/%/,"",$2); print $2; exit}' "$CHECKIN_FILE" | tr -d '\r' || true)"
stale_count="$(awk -F': ' '/^- staleCount:/ {print $2; exit}' "$STALE_FILE" | tr -d '\r' || true)"
[[ -z "$avg_progress" ]] && avg_progress="0"
[[ -z "$stale_count" ]] && stale_count="0"

{
  echo "# Wave2 Daily Brief"
  echo
  echo "- generatedAt: $generated_at"
  echo "- base(main): $base_head"
  echo
  echo "## KPI"
  echo
  echo "- averageProgress: ${avg_progress}%"
  echo "- mergeReadyCount: $ready_count"
  echo "- blockedCount: $blocked_count"
  echo "- noFeatureCommitCount: $no_commit_count"
  echo "- staleCheckinCount: $stale_count"
  echo
  echo "## Priority Today"
  echo
  awk -F'|' '
    BEGIN {n=0}
    /^\| [0-9]+ / {
      gsub(/^ +| +$/,"",$2); rank=$2
      gsub(/^ +| +$/,"",$3); wt=$3
      gsub(/^ +| +$/,"",$4); reason=$4
      if (wt!="-" && n<3) {
        n++
        printf "%d. %s: %s\n", n, wt, reason
      }
    }
    END {
      if (n==0) print "1. 우선순위 항목 없음 (merge candidate 중심으로 진행)"
    }
  ' "$QUEUE_FILE"
  echo
  echo "## Orchestrator Action"
  echo
  echo "1. ./scripts/dispatch_wave2_nudge_clipboard.sh 실행"
  echo "2. ./scripts/dispatch_wave2_kickstart_clipboard.sh 실행"
  echo "3. 체크인 갱신 후 board apply"
  echo "4. full gate 시점 확정"
} > "$OUT_FILE"

echo "generated: $OUT_FILE"

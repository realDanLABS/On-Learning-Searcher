#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MERGE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_MERGE_READINESS.md"
OUTBOX_NUDGE="$ROOT_DIR/ORCHESTRATION/OUTBOX/nudge"
OUTBOX_KICK="$ROOT_DIR/ORCHESTRATION/OUTBOX/kickstart"

cd "$ROOT_DIR"

if [[ ! -f "$MERGE_FILE" ]]; then
  echo "merge readiness file missing. running command-center quick..."
  bash scripts/orchestrator-wave2-command-center.sh quick >/tmp/w2_next_task.log 2>&1 || true
fi

target="$(
  awk -F'|' '
    /^\| [0-9]+ / {
      gsub(/^ +| +$/,"",$3); wt=$3
      gsub(/^ +| +$/,"",$10); action=$10
      if (action == "no feature commits yet") { print wt; exit }
    }
  ' "$MERGE_FILE"
)"

if [[ -z "$target" ]]; then
  target="$(
    awk -F'|' '
      /^\| [0-9]+ / {
        gsub(/^ +| +$/,"",$3); wt=$3
        gsub(/^ +| +$/,"",$9); ready=$9
        if (ready == "YES") { print wt; exit }
      }
    ' "$MERGE_FILE"
  )"
fi

if [[ -z "$target" ]]; then
  echo "no actionable worktree found from $MERGE_FILE"
  exit 0
fi

nudge_file="$OUTBOX_NUDGE/$target.md"
kick_file="$OUTBOX_KICK/$target.md"

if [[ ! -f "$nudge_file" || ! -f "$kick_file" ]]; then
  echo "outbox files missing for $target. generating outbox..."
  bash scripts/orchestrator-wave2-inbox-pack.sh >/tmp/w2_next_outbox.log 2>&1 || true
fi

if [[ ! -f "$nudge_file" || ! -f "$kick_file" ]]; then
  echo "failed to locate outbox messages for $target"
  exit 1
fi

{
  echo "[오케스트레이터 자동하달] $target"
  echo
  cat "$nudge_file"
  echo
  cat "$kick_file"
} | pbcopy

echo "target: $target"
echo "clipboard: nudge + kickstart message copied"
echo "nudge: $nudge_file"
echo "kickstart: $kick_file"

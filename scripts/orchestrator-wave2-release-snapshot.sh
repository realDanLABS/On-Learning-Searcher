#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNAP_ROOT="$ROOT_DIR/ORCHESTRATION/SNAPSHOTS"
TS="$(date +"%Y%m%d-%H%M%S")"
OUT_DIR="$SNAP_ROOT/$TS"

cd "$ROOT_DIR"
mkdir -p "$OUT_DIR"

FILES=(
  "ORCHESTRATION/EXECUTION_BOARD.md"
  "ORCHESTRATION/WAVE2_DAILY_BRIEF.md"
  "ORCHESTRATION/WAVE2_CYCLE_REPORT.md"
  "ORCHESTRATION/WAVE2_GATE_REPORT.md"
  "ORCHESTRATION/WAVE2_MERGE_READINESS.md"
  "ORCHESTRATION/WAVE2_STALE_CHECKINS.md"
  "ORCHESTRATION/WAVE2_FIRST_COMMIT_WATCH.md"
  "ORCHESTRATION/WAVE2_NUDGE_MESSAGES.md"
  "ORCHESTRATION/WAVE2_KICKSTART_TASKS.md"
)

for f in "${FILES[@]}"; do
  if [[ -f "$f" ]]; then
    cp "$f" "$OUT_DIR/$(basename "$f")"
  fi
done

cat > "$OUT_DIR/SNAPSHOT_META.md" <<EOF
# Wave2 Release Snapshot

- createdAt: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- baseMain: $(git rev-parse --short main)
- path: $OUT_DIR

## Included Files
$(for f in "${FILES[@]}"; do
  b="$(basename "$f")"
  if [[ -f "$OUT_DIR/$b" ]]; then
    echo "- $b"
  fi
done)
EOF

cat > "$OUT_DIR/snapshot.json" <<EOF
{
  "createdAtUtc": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "baseMain": "$(git rev-parse --short main)",
  "path": "$OUT_DIR"
}
EOF

echo "generated: $OUT_DIR"

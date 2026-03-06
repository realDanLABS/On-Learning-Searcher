#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRAFT="$ROOT_DIR/ORCHESTRATION/EXECUTION_BOARD_WAVE2_DRAFT.md"
TARGET="$ROOT_DIR/ORCHESTRATION/EXECUTION_BOARD.md"

cd "$ROOT_DIR"

bash scripts/orchestrator-wave2-board-draft.sh >/tmp/w2_board_apply.log 2>&1

if [[ ! -f "$DRAFT" ]]; then
  echo "draft board missing: $DRAFT"
  exit 1
fi

cp "$DRAFT" "$TARGET"
sed -i.bak '1s/^# Execution Board (Wave2 Draft)$/# Execution Board/' "$TARGET"
rm -f "$TARGET.bak"

echo "applied: $TARGET"

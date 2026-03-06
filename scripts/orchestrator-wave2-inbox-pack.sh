#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NUDGE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_NUDGE_MESSAGES.md"
KICK_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_KICKSTART_TASKS.md"
OUTBOX_DIR="$ROOT_DIR/ORCHESTRATION/OUTBOX"

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

mkdir -p "$OUTBOX_DIR/nudge" "$OUTBOX_DIR/kickstart"

if [[ ! -f "$NUDGE_FILE" ]]; then
  bash scripts/orchestrator-wave2-nudge-messages.sh >/tmp/w2_outbox_nudge.log 2>&1 || true
fi

if [[ ! -f "$KICK_FILE" ]]; then
  bash scripts/orchestrator-wave2-kickstart.sh >/tmp/w2_outbox_kick.log 2>&1 || true
fi

for name in "${WORKTREES[@]}"; do
  awk -v name="$name" '
    $0 ~ "^## " name "$" {on=1; next}
    on && $0 ~ "^## " {exit}
    on {print}
  ' "$NUDGE_FILE" > "$OUTBOX_DIR/nudge/${name}.md"

  case "$name" in
    foundation) idx=1 ;;
    diagnosis) idx=2 ;;
    recommendation) idx=3 ;;
    course-linking) idx=4 ;;
    history) idx=5 ;;
    chatbot) idx=6 ;;
    responsive) idx=7 ;;
  esac

  awk -v idx="$idx" '
    $0 ~ "^## " idx "\\) " {on=1; next}
    on && $0 ~ "^## [0-9]+\\) " {exit}
    on {print}
  ' "$KICK_FILE" > "$OUTBOX_DIR/kickstart/${name}.md"
done

INDEX="$OUTBOX_DIR/README.md"
{
  echo "# Wave2 Outbox"
  echo
  echo "각 스레드에 붙여넣을 메시지 파일:"
  echo
  for name in "${WORKTREES[@]}"; do
    echo "- $name"
    echo "  - nudge: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/OUTBOX/nudge/${name}.md"
    echo "  - kickstart: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/ORCHESTRATION/OUTBOX/kickstart/${name}.md"
  done
} > "$INDEX"

echo "generated: $OUTBOX_DIR"

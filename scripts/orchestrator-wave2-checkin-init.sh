#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"

WORKTREES=(
  "foundation"
  "diagnosis"
  "recommendation"
  "course-linking"
  "history"
  "chatbot"
  "responsive"
)

mkdir -p "$CHECKIN_DIR"

today="$(date +"%Y-%m-%d")"

for name in "${WORKTREES[@]}"; do
  file="$CHECKIN_DIR/${name}.md"
  if [[ -f "$file" ]]; then
    continue
  fi

  cat > "$file" <<EOF
# Wave2 Check-in: ${name}

- updatedAt: ${today}
- progress: 0
- status: IN_PROGRESS
- completed:
  - (작성 필요)
- inProgress:
  - (작성 필요)
- blockers:
  - 없음
- nextCommit:
  - (작성 필요)
- validation:
  - (명령 + 결과)
EOF
done

echo "initialized: $CHECKIN_DIR"

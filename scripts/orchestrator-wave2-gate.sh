#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-quick}" # quick | full
REPORT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_GATE_REPORT.md"

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

if [[ "$MODE" != "quick" && "$MODE" != "full" ]]; then
  echo "usage: bash scripts/orchestrator-wave2-gate.sh [quick|full]"
  exit 1
fi

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
base_head="$(git rev-parse --short main)"

tmp_report="$(mktemp)"

{
  echo "# Wave2 Gate Report"
  echo
  echo "- generatedAt: $generated_at"
  echo "- mode: $MODE"
  echo "- base(main): $base_head"
  echo
  echo "## Per-worktree Result"
  echo
  echo "| Worktree | Branch | HEAD | Dirty | Base Sync | Gate | Notes |"
  echo "|---|---|---|---|---|---|---|"
} > "$tmp_report"

overall_pass="PASS"

for name in "${WORKTREES[@]}"; do
  wt="$ROOT_DIR/worktrees/$name"
  branch="$(git -C "$wt" branch --show-current)"
  head="$(git -C "$wt" rev-parse --short HEAD)"

  if [[ -n "$(git -C "$wt" status --porcelain)" ]]; then
    dirty="YES"
  else
    dirty="NO"
  fi

  if [[ "$head" == "$base_head" ]]; then
    base_sync="YES"
  else
    base_sync="NO"
  fi

  gate="PASS"
  notes="quick checks passed"

  if [[ "$dirty" == "YES" ]]; then
    gate="WARN"
    notes="worktree has uncommitted changes"
  fi

  if [[ "$MODE" == "full" ]]; then
    if ! (cd "$wt" && npm run lint >/tmp/w2_lint_"$name".log 2>&1); then
      gate="FAIL"
      notes="lint failed"
    elif ! (cd "$wt" && npm run test >/tmp/w2_test_"$name".log 2>&1); then
      gate="FAIL"
      notes="unit test failed"
    elif ! (cd "$wt" && npm run build >/tmp/w2_build_"$name".log 2>&1); then
      gate="FAIL"
      notes="build failed"
    else
      notes="lint/test/build passed"
    fi
  fi

  if [[ "$gate" == "FAIL" ]]; then
    overall_pass="FAIL"
  elif [[ "$gate" == "WARN" && "$overall_pass" != "FAIL" ]]; then
    overall_pass="WARN"
  fi

  echo "| $name | $branch | $head | $dirty | $base_sync | $gate | $notes |" >> "$tmp_report"
done

{
  echo
  echo "## Summary"
  echo
  echo "- overall: $overall_pass"
  echo
  echo "## Next Action"
  echo
  echo "- PASS: integration-qa 진행"
  echo "- WARN: dirty 워크트리 정리 후 재실행"
  echo "- FAIL: 실패 워크트리 로그 확인 후 수정"
} >> "$tmp_report"

mv "$tmp_report" "$REPORT_FILE"
echo "generated: $REPORT_FILE"
